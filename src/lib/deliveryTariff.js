/**
 * What delivery actually costs, and who has already charged for it.
 *
 * A delivery charge is a fact about a utility's service territory, not about a
 * plan. Every retailer selling into Oncor bills the same Oncor delivery
 * charge — so holding that number on each plan means copying it across every
 * plan in the territory, and correcting all of them when the tariff changes.
 *
 * That is not a hypothetical cost. Every one of the 378 active plans carried a
 * delivery charge of 0, which the pricing engine reads as "not configured", so
 * nothing on the site could publish a monthly bill or a savings comparison.
 * Fixing that plan by plan is 378 edits of a number that has about seventeen
 * distinct real values.
 *
 * So the tariff is configured once per territory, and a plan's own
 * `tdsp_charges` becomes an override for the rare plan that bundles delivery
 * differently.
 *
 * THE PART THAT IS EASY TO GET BACKWARDS
 *
 * `billing_model` records what the retailer's advertised rate already covers:
 *
 *   supply_only  the rate is energy alone and the utility bills delivery on
 *                top, so delivery must be ADDED to reach a real bill
 *   all_in       the rate already includes delivery, so adding anything
 *                overstates the bill
 *
 * An `all_in` territory therefore needs no delivery rate at all to produce a
 * complete estimate — the advertised rate is already the whole thing. Treating
 * the two models the same way produces a confidently wrong number, which is
 * worse than the honest supply-only subtotal shown when nothing is configured.
 */

/** How a territory's advertised rates relate to delivery. */
export const BILLING_MODELS = {
  /** Rate is energy only; delivery is billed separately and must be added. */
  SUPPLY_ONLY: 'supply_only',
  /** Rate already includes delivery; nothing may be added. */
  ALL_IN: 'all_in',
};

function num(value) {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : null;
}

/** A number that is present and not negative. 0 is a legitimate value here. */
function nonNegative(value) {
  const n = num(value);
  return n !== null && n >= 0 ? n : null;
}

/** Today as YYYY-MM-DD, so comparisons against DATE columns are lexical. */
function today(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/**
 * Is this tariff in force on `asOf`?
 *
 * Effective dating is what keeps a superseded tariff explainable rather than
 * overwritten: a rate change closes one row and opens another, and a quote from
 * last month can still be reconstructed.
 */
export function isEffective(territory, asOf = today()) {
  if (!territory || territory.is_active === false) return false;

  const from = territory.effective_from || null;
  const to = territory.effective_to || null;

  if (from && String(from).slice(0, 10) > asOf) return false;
  if (to && String(to).slice(0, 10) < asOf) return false;
  return true;
}

/**
 * Does this territory cover the given ZIP?
 *
 * A territory with no prefixes applies state-wide. One with prefixes covers
 * only the ZIPs that start with them.
 */
export function coversZip(territory, zip) {
  const prefixes = Array.isArray(territory?.service_zip_prefixes)
    ? territory.service_zip_prefixes.filter(Boolean)
    : [];

  if (prefixes.length === 0) return true;
  if (!zip) return false;

  const normalized = String(zip).replace(/\D/g, '');
  return prefixes.some((prefix) => normalized.startsWith(String(prefix).trim()));
}

/**
 * Pick the tariff that applies to a market.
 *
 * Most specific wins: a territory scoped to ZIP prefixes beats the state-wide
 * fallback, because that is what "this ZIP is in CenterPoint, not Oncor" means.
 * Between two equally specific matches the later `effective_from` wins, so
 * publishing a new tariff supersedes the old one without needing the old row
 * closed out first. Ties break on id, so the choice is stable across requests.
 *
 * @param {object[]} territories  candidate rows
 * @param {{state: string, zip?: string}} market
 * @param {string} [asOf]  YYYY-MM-DD, defaults to today
 * @returns {object|null}
 */
export function selectTerritory(territories, market, asOf = today()) {
  const state = market?.state;
  if (!state) return null;

  const candidates = (Array.isArray(territories) ? territories : []).filter(
    (t) => t?.state === state && isEffective(t, asOf) && coversZip(t, market?.zip)
  );

  if (candidates.length === 0) return null;

  const specificity = (t) =>
    Array.isArray(t.service_zip_prefixes) && t.service_zip_prefixes.filter(Boolean).length > 0 ? 1 : 0;

  return candidates.reduce((best, t) => {
    const bySpecificity = specificity(t) - specificity(best);
    if (bySpecificity !== 0) return bySpecificity > 0 ? t : best;

    const from = String(t.effective_from || '');
    const bestFrom = String(best.effective_from || '');
    if (from !== bestFrom) return from > bestFrom ? t : best;

    return String(t.id) < String(best.id) ? t : best;
  });
}

/**
 * The delivery terms to price a plan under.
 *
 * Returns a shape the pricing engine can apply without knowing anything about
 * territories, so the arithmetic stays in one place and this stays a lookup.
 *
 * @returns {{
 *   billingModel: string,
 *   perKwhCents: number|null,
 *   fixedMonthly: number|null,
 *   source: 'plan'|'territory'|'included'|'unknown',
 *   territoryName: string|null,
 * }}
 *   `source` explains where the number came from, which is what lets admin show
 *   an operator why a plan prices the way it does instead of asserting it.
 */
export function resolveDelivery(plan, territory) {
  const model = territory?.billing_model === BILLING_MODELS.ALL_IN
    ? BILLING_MODELS.ALL_IN
    : BILLING_MODELS.SUPPLY_ONLY;

  // An all-in territory has already charged for delivery inside the advertised
  // rate. Adding a delivery component on top would double-count it, and a plan
  // override cannot change that — the override describes how the plan bills,
  // and in an all-in market the plan bills everything.
  if (model === BILLING_MODELS.ALL_IN) {
    return {
      billingModel: model,
      perKwhCents: null,
      fixedMonthly: null,
      source: 'included',
      territoryName: territory?.name || null,
    };
  }

  // A plan's own delivery charge overrides the territory: it describes this
  // particular product, which is more specific than the market it sells into.
  // Zero is not an override — it is the sentinel that meant "never configured",
  // and migration 023 removed it from the catalog for exactly that reason.
  const planRate = num(plan?.tdsp_charges);
  if (planRate !== null && planRate > 0) {
    return {
      billingModel: model,
      perKwhCents: planRate,
      // A plan-level override says nothing about the territory's fixed monthly
      // charge, which is levied by the utility either way.
      fixedMonthly: territory ? nonNegative(territory.fixed_monthly_delivery_charge) : null,
      source: 'plan',
      territoryName: territory?.name || null,
    };
  }

  const territoryRate = territory ? nonNegative(territory.delivery_per_kwh_cents) : null;
  if (territoryRate !== null) {
    return {
      billingModel: model,
      perKwhCents: territoryRate,
      fixedMonthly: nonNegative(territory.fixed_monthly_delivery_charge),
      source: 'territory',
      territoryName: territory.name || null,
    };
  }

  return {
    billingModel: model,
    perKwhCents: null,
    fixedMonthly: territory ? nonNegative(territory.fixed_monthly_delivery_charge) : null,
    source: 'unknown',
    territoryName: territory?.name || null,
  };
}

/**
 * Can a plan be priced completely under these delivery terms?
 *
 * The single rule behind the "full estimate" badge in admin and the withheld
 * `estimatedMonthlyCost` on the public site, so the two cannot disagree.
 */
export function canPriceCompletely(delivery) {
  if (delivery?.billingModel === BILLING_MODELS.ALL_IN) return true;
  return delivery?.perKwhCents !== null && delivery?.perKwhCents !== undefined;
}
