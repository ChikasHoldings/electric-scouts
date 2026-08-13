/**
 * The comparison result contract.
 *
 * One shape, produced by the server, consumed by the results board and by the
 * comparison email. Before this existed the page and the email each computed
 * their own economics from raw plan rows — the email multiplied rate by usage
 * and added the base charge, which ignored delivery charges and bill credits
 * entirely, so a customer could read one monthly figure on screen and a
 * different one in their inbox for the same plan.
 *
 * Everything with commercial weight is decided before a result becomes a DTO:
 * price, completeness, difference against the current bill, rank, match score,
 * reasons and the outbound route. A consumer of this contract formats these
 * numbers; it never derives them.
 *
 * Deliberately absent: the affiliate destination URL, commission values, admin
 * notes and raw row metadata. The browser gets the ElectricScouts route and
 * /api/go resolves the rest, so nothing a client sends can redirect revenue.
 */

import { COST_CONFIDENCE } from './planPricing.js';

/**
 * How much of the bill the estimate accounts for.
 *
 * Same three values the pricing engine reports — aliased rather than
 * re-declared so the contract and the engine cannot drift apart.
 */
export const PRICING_COMPLETENESS = COST_CONFIDENCE;

/**
 * What an outbound click is actually worth.
 *
 * A tracked click and a payable click are different things, and reporting them
 * as one overstates revenue. Most configured links point at plain provider
 * pages: we can attribute the click internally, and it earns nothing.
 */
export const MONETIZATION = {
  /** Destination carries real affiliate-network tracking; a conversion can pay. */
  COMMISSION_CAPABLE: 'commission_capable',
  /** Routed and attributable through /api/go, but not commission-bearing. */
  INTERNAL_TRACKING_ONLY: 'internal_tracking_only',
  /** No usable destination is configured for this plan's provider. */
  UNAVAILABLE: 'unavailable',
};

/** Result sections, used for click attribution. */
export const RESULT_SECTIONS = {
  TOP_MATCH: 'top_match',
  MORE_OPTIONS: 'more_options',
};

function round2(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value * 100) / 100
    : null;
}

function numberOrNull(value) {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : null;
}

/**
 * Build the public result for one scored plan.
 *
 * @param {object} scored      an entry from `rankPlans`
 * @param {object} context
 * @param {number} context.rank        1-based position in the full ranked set
 * @param {boolean} context.isTopMatch whether it holds a headline slot
 * @param {object} context.comparison  from `compareToCurrentBill`
 * @param {string|null} context.trackedOutboundRoute
 * @param {string} context.monetizationStatus
 */
export function toResultDto(scored, context = {}) {
  const { plan, estimate, match } = scored;
  const comparison = context.comparison || { available: false };
  const complete = estimate.confidence === PRICING_COMPLETENESS.COMPLETE;

  // ── The pricing rule this contract exists to enforce ──
  //
  // `estimatedMonthlyCost` is a FULL modelled monthly bill and is null unless
  // every material component is known. A partial estimate is published as
  // `supplyEstimate` instead, under a different name, so no consumer can pick
  // up an incomplete figure and present it — or subtract it from a current
  // bill — as though it were the whole bill. The customer still sees the
  // number; what changes is what it is called.
  const estimatedMonthlyCost = complete ? round2(estimate.amount) : null;
  const supplyEstimate = round2(estimate.comparableAmount);

  const monthlyDifference = comparison.available ? round2(comparison.monthlyDelta) : null;

  return {
    planId: plan.id,
    planName: plan.plan_name,
    providerId: plan.provider_id || null,
    providerName: plan.provider_name || null,
    providerLogoUrl: plan.logo_url || null,

    // ── Position, decided by the server ──
    rank: context.rank ?? null,
    isTopMatch: Boolean(context.isTopMatch),

    // ── Pricing ──
    pricingCompleteness: estimate.confidence,
    // Which material components are missing, by stable name. A generic boolean
    // cannot tell an admin what to go and fix, and cannot tell the customer
    // what the estimate excludes — both read this.
    missingComponents: Array.isArray(estimate.missingComponents)
      ? estimate.missingComponents
      : [],
    ratePerKwh: numberOrNull(plan.rate_per_kwh),
    baseCharge: round2(estimate.components?.baseCharge ?? null),
    deliveryCharge: round2(estimate.components?.delivery ?? null),
    usageCredit: numberOrNull(plan.usage_credit),
    usageCreditThreshold: numberOrNull(plan.usage_credit_threshold),

    // ── Delivery context ──
    //
    // The utility's NAME is the customer's own utility and appears on their
    // bill, so naming it makes the estimate checkable. Nothing else about the
    // territory row travels: no source references, no admin notes, no ids.
    utilityName: estimate.territory?.name || null,
    billingModel: estimate.billingModel || null,

    estimatedMonthlyCost,
    supplyEstimate,
    effectiveRate: complete ? round2(estimate.effectiveRate) : null,
    costComponents: {
      energy: round2(estimate.components?.energy ?? null),
      baseCharge: round2(estimate.components?.baseCharge ?? null),
      // Split, because they are different kinds of charge: one scales with
      // usage and one does not, and a customer checking the estimate against a
      // real bill needs to see both lines.
      deliveryVariable: round2(estimate.components?.deliveryVariable ?? null),
      deliveryFixed: round2(estimate.components?.deliveryFixed ?? null),
      delivery: round2(estimate.components?.delivery ?? null),
      usageCredit: round2(estimate.components?.usageCredit ?? null),
    },

    // ── Against the current bill ──
    //
    // Signed: positive means this plan costs MORE than the customer pays today.
    // `potentialSavings` is populated only when the difference is genuinely in
    // the customer's favour, so no consumer can print a negative saving.
    currentMonthlyCost: comparison.available ? round2(comparison.currentMonthly) : null,
    monthlyDifference,
    annualDifference: comparison.available ? round2(comparison.annualDelta) : null,
    potentialSavings:
      comparison.available && comparison.direction === 'saving'
        ? round2(Math.abs(comparison.monthlyDelta))
        : null,
    differenceDirection: comparison.available ? comparison.direction : null,

    // ── Match ──
    matchScore: match?.score ?? null,
    matchLabel: match?.label ?? null,
    matchScoreCapped: Boolean(match?.capped),
    matchReasons: Array.isArray(scored.reasons) ? scored.reasons : [],

    // ── Plan terms ──
    termMonths: numberOrNull(plan.contract_length),
    rateType: plan.plan_type || null,
    renewablePercentage: numberOrNull(plan.renewable_percentage),
    // Whether this counts as renewable supply is a catalog judgement, not a
    // threshold for the browser to re-apply: inventory filed as a renewable
    // product qualifies even where its percentage is not recorded.
    isRenewable:
      Number(plan.renewable_percentage) >= 50 || plan.customer_type === 'renewable',
    earlyTerminationFee: numberOrNull(plan.early_termination_fee),

    pricingCaveats: Array.isArray(estimate.caveats) ? estimate.caveats : [],

    // ── Outbound ──
    trackedOutboundRoute: context.trackedOutboundRoute || null,
    monetizationStatus: context.monetizationStatus || MONETIZATION.UNAVAILABLE,
  };
}

/**
 * Which figure to show for a result, and what to call it.
 *
 * Shared by the results board and the comparison email, deliberately. Parity
 * between the two is not just a matter of using the same numbers — it is also a
 * matter of describing them the same way. A supply-only subtotal labelled
 * "estimated monthly bill" in an inbox is exactly as misleading as it would be
 * on the page, and a customer who reads "$105/mo" in an email and "$105/mo
 * supply" on screen has been told two different things.
 *
 * @returns {{amount: number, unit: string, basis: 'total'|'supply',
 *            note: string|null}|null}
 */
export function describeResultPrice(result) {
  if (result?.estimatedMonthlyCost !== null && result?.estimatedMonthlyCost !== undefined) {
    return {
      amount: result.estimatedMonthlyCost,
      unit: '/mo est.',
      basis: 'total',
      note: null,
    };
  }

  if (result?.supplyEstimate !== null && result?.supplyEstimate !== undefined) {
    return {
      amount: result.supplyEstimate,
      unit: '/mo supply',
      basis: 'supply',
      note: 'Delivery charges not included',
    };
  }

  return null;
}

/**
 * The completeness caveat, worded once for every surface that shows it.
 *
 * Market-aware, because the two structures mean different things to the
 * customer. Where the supplier bills everything, the missing delivery charge
 * would have appeared on the bill this plan produces. Where the utility bills
 * delivery separately, it is a charge the customer already pays and will keep
 * paying whoever supplies them — a materially less alarming fact, and saying so
 * is more accurate than one generic warning for both.
 */
export function pricingCaveatText(result) {
  if (result?.pricingCompleteness === PRICING_COMPLETENESS.COMPLETE) return null;
  if (result?.pricingCompleteness === PRICING_COMPLETENESS.UNAVAILABLE) {
    return 'Not enough pricing data for a monthly estimate';
  }
  return result?.billingModel === 'supply_only'
    ? 'Supply only — your utility bills delivery separately'
    : 'Supply only — utility delivery charges are billed separately';
}

/**
 * Pick the headline results out of an already-ranked set.
 *
 * This runs server-side for the unfiltered set and client-side after the
 * customer applies a filter. It is the same function in both places on purpose:
 * filtering must be able to change WHICH results are headlined without being
 * able to change what any of them scored. It reads `rank`, `matchScore` and
 * `pricingCompleteness`; it never computes them.
 *
 * The completeness gate: a plan we cannot fully price must not occupy a
 * headline slot while plans we can fully price are available. A partial
 * estimate is always too low — the missing component is always a charge — so
 * headlining one next to complete estimates invites a comparison that is not
 * true. Partial plans keep their correct place in the full list.
 *
 * @param {object[]} results  DTOs in server rank order
 * @returns {{headline: object[], rest: object[]}}
 */
export function selectHeadline(results, limit = 3) {
  const ordered = Array.isArray(results) ? results : [];
  if (ordered.length === 0) return { headline: [], rest: [] };

  const complete = ordered.filter(
    (r) => r.pricingCompleteness === PRICING_COMPLETENESS.COMPLETE
  );
  const pool = complete.length >= limit ? complete : ordered;

  const headline = pool.slice(0, limit);
  const headlineIds = new Set(headline.map((r) => r.planId));

  return {
    headline,
    rest: ordered.filter((r) => !headlineIds.has(r.planId)),
  };
}

/**
 * Attach where a result was rendered to its outbound route.
 *
 * The route itself — slug, plan, provider, session, score, campaign — is built
 * by the server and is not editable here. Section and position are facts about
 * the page, known only at render time, so they are appended rather than being
 * guessed server-side. This helper exists so no component hand-rolls a URL.
 */
export function withResultPlacement(route, section, position) {
  if (!route) return null;

  const validSection = Object.values(RESULT_SECTIONS).includes(section) ? section : null;
  const parts = [route];
  if (validSection) parts.push(`rs=${validSection}`);
  if (Number.isFinite(position) && position > 0) parts.push(`rp=${Math.round(position)}`);

  return parts.length === 1 ? route : `${parts[0]}&${parts.slice(1).join('&')}`;
}
