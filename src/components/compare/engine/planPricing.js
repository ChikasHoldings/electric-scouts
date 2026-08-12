/**
 * Estimated monthly cost for a plan.
 *
 * This module answers two questions that must never be confused: what does this
 * plan cost, and how much of that answer do we actually know?
 *
 * WHAT CHANGED, AND WHY
 *
 * Completeness used to be a single test — `tdsp_charges > 0` — against a
 * per-plan column that defaults to 0. That made "nobody entered a delivery
 * charge" and "delivery is free" the same value, and it modelled delivery as a
 * per-kWh rate with no fixed monthly counterpart, so any estimate built from it
 * was short by the utility's customer charge every month.
 *
 * Completeness is now STRUCTURAL: it is derived from the components a bill in
 * that market actually has, and it reports which ones are missing by name. The
 * delivery components come from the customer's utility territory (see
 * ./utilityTerritory.js), because that is who sets them.
 *
 * THE RULE THAT GOVERNS EVERYTHING HERE
 *
 * A missing charge is never treated as zero. Every component we cannot supply
 * is a charge the customer will really pay, so an estimate missing one is
 * always TOO LOW — and a saving computed from it always overstates. Unknown
 * therefore downgrades the estimate rather than quietly shrinking the bill.
 */

import {
  BILLING_MODEL,
  PRICING_COMPONENTS,
  TERRITORY_RESOLUTION,
  deliveryFor,
  legacyPlanOverride,
} from './utilityTerritory.js';

/** How much of the real bill the estimate is believed to cover. */
export const COST_CONFIDENCE = {
  /** Every material recurring component is known. Safe to present as a bill. */
  COMPLETE: 'complete',
  /** Supply is known; at least one material component is not. */
  PARTIAL: 'partial',
  /** Not enough data to compute anything meaningful. */
  UNAVAILABLE: 'unavailable',
};

function num(value) {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : null;
}

function positive(value) {
  const n = num(value);
  return n !== null && n > 0 ? n : null;
}

/**
 * The canonical supplier base charge.
 *
 * `monthly_base_charge` is what admin writes and is the only field the forms
 * now offer. `base_charge` is a legacy column kept as a read fallback so rows
 * written before the two were reconciled still price correctly. They are never
 * summed — that would double-charge a plan carrying both.
 */
export function supplierBaseCharge(plan) {
  return positive(plan?.monthly_base_charge) ?? positive(plan?.base_charge);
}

/**
 * Estimate the monthly cost of `plan` at `usageKwh`.
 *
 * @param {object} plan
 * @param {number} usageKwh
 * @param {object} [context]
 * @param {object} [context.territory]   resolved utility territory, if any
 * @param {string} [context.resolution]  how it was resolved
 * @returns {{
 *   amount: number|null, comparableAmount: number|null, confidence: string,
 *   components: object, missingComponents: string[], caveats: string[],
 *   effectiveRate: number|null, territory: object|null, billingModel: string|null
 * }}
 */
export function estimateMonthlyCost(plan, usageKwh, context = {}) {
  const usage = positive(usageKwh);
  const rate = positive(plan?.rate_per_kwh);

  if (!usage || !rate) {
    return {
      amount: null,
      comparableAmount: null,
      confidence: COST_CONFIDENCE.UNAVAILABLE,
      components: {},
      missingComponents: [PRICING_COMPONENTS.SUPPLY_RATE],
      caveats: [],
      effectiveRate: null,
      territory: null,
      territoryResolution: context.resolution || TERRITORY_RESOLUTION.UNRESOLVED,
      billingModel: null,
    };
  }

  const components = {};
  const caveats = [];

  // ── Energy ──
  // rate_per_kwh is CENTS per kWh throughout the catalog.
  components.energy = (rate / 100) * usage;

  // ── Supplier fixed charge ──
  const baseCharge = supplierBaseCharge(plan);
  if (baseCharge !== null) components.baseCharge = baseCharge;

  // ── Usage credit ──
  // Applies only once usage clears the threshold. A credit with no threshold is
  // unconditional, which is how these plans are marketed.
  const credit = positive(plan.usage_credit);
  if (credit !== null) {
    const threshold = num(plan.usage_credit_threshold) ?? 0;
    if (usage >= threshold) {
      components.usageCredit = -credit;
    } else {
      caveats.push(
        `A $${credit.toFixed(0)} bill credit applies at ${threshold.toLocaleString()} kWh and up — your usage is below that.`
      );
    }
  }

  // ── Utility delivery ──
  //
  // From the resolved territory. Falling back to the plan's legacy per-kWh
  // override only when it carries a positive value, since that column's
  // DEFAULT 0 means "unset".
  const territory = context.territory || legacyPlanOverride(plan);
  const delivery = deliveryFor(territory, usage);
  const billingModel = territory?.billing_model || null;

  if (delivery.variable !== null) components.deliveryVariable = delivery.variable;
  if (delivery.fixed !== null) components.deliveryFixed = delivery.fixed;
  // Combined delivery, for consumers that show one delivery line.
  if (delivery.total !== null) components.delivery = delivery.total;

  // ── Structural completeness ──
  //
  // The estimate is complete when nothing material is missing. `missing` is
  // reported by stable component name so admin badges, tests and monitoring can
  // all say exactly what is blocking the plan.
  const missingComponents = [...delivery.missing];

  const confidence =
    missingComponents.length === 0 ? COST_CONFIDENCE.COMPLETE : COST_CONFIDENCE.PARTIAL;

  if (confidence !== COST_CONFIDENCE.COMPLETE) {
    caveats.push(
      billingModel === BILLING_MODEL.SUPPLY_ONLY
        ? 'Your utility bills delivery separately and that charge is not included here.'
        : 'Utility delivery charges are billed separately and are not included.'
    );
  }

  if (plan.plan_type === 'variable' || plan.plan_type === 'indexed') {
    caveats.push('This rate can change month to month.');
  }

  // ── The two totals ──
  //
  // `amount` is the full modelled bill and is only meaningful when complete.
  //
  // `comparableAmount` is supply-only: energy + supplier fixed charges +
  // credits. Ranking uses it rather than the total, because delivery is known
  // for some plans and not others, and ranking on the total would systematically
  // favour whichever plans we know LESS about — they look cheaper purely for
  // being incomplete. Every plan has a supply figure, so comparing on it is
  // like for like.
  //
  // In a supply_only market it is also the honest basis for comparison in its
  // own right: delivery there is identical whoever supplies you.
  const comparableAmount =
    (components.energy ?? 0) + (components.baseCharge ?? 0) + (components.usageCredit ?? 0);

  const amount =
    confidence === COST_CONFIDENCE.COMPLETE
      ? comparableAmount + (delivery.total ?? 0)
      : null;

  return {
    amount: amount !== null && amount > 0 ? amount : null,
    comparableAmount: comparableAmount > 0 ? comparableAmount : null,
    confidence,
    components,
    missingComponents,
    caveats,
    // What the customer effectively pays per kWh once everything modelled is
    // included — the number that actually makes plans comparable.
    effectiveRate: amount !== null && amount > 0 ? (amount / usage) * 100 : null,
    territory: territory || null,
    territoryResolution: context.resolution || (territory ? TERRITORY_RESOLUTION.PLAN_PINNED : TERRITORY_RESOLUTION.UNRESOLVED),
    billingModel,
  };
}

/**
 * Difference against what the customer pays today.
 *
 * Deliberately conservative: it returns null unless both sides are trustworthy,
 * because "you save $X" computed against a partial estimate is worse than
 * showing nothing.
 */
export function estimateMonthlyDifference(estimate, currentMonthlyCost) {
  const current = positive(currentMonthlyCost);

  if (
    current === null ||
    estimate?.amount === null ||
    estimate?.confidence !== COST_CONFIDENCE.COMPLETE
  ) {
    return { difference: null, comparable: false };
  }

  return {
    difference: estimate.amount - current,
    comparable: true,
  };
}

/**
 * Sort key that keeps plans without an estimate at the end, not at the top.
 *
 * Keyed on the supply-only figure, for the same reason scoring is: it is the
 * one basis every plan has, so ordering on it cannot reward a plan for being
 * incomplete. Falling back to the full amount covers estimates built without a
 * comparable subtotal.
 */
export function costSortKey(estimate) {
  return estimate?.comparableAmount ?? estimate?.amount ?? Number.POSITIVE_INFINITY;
}
