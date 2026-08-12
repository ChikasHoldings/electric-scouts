/**
 * Estimated monthly cost for a plan.
 *
 * The previous helper multiplied the advertised rate by usage and added the
 * base charge, which silently ignored three fields the schema actually carries:
 * `tdsp_charges` (utility delivery), `usage_credit` and its threshold. On a
 * Texas plan with a $100 bill credit at 1,000 kWh that produced an estimate
 * that was wrong by the entire credit.
 *
 * This module computes from the components that are present and — just as
 * importantly — reports how much of the bill it could actually account for.
 * A number we cannot stand behind is labelled, not hidden.
 */

/** How much of the real bill the estimate is believed to cover. */
export const COST_CONFIDENCE = {
  /** Energy + base + delivery all known: safe to present as an estimate. */
  COMPLETE: 'complete',
  /** Energy charge known, at least one cost component missing. */
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
 * Estimate the monthly cost of `plan` at `usageKwh`.
 *
 * Returns the amount plus the components that produced it, so the UI can show
 * a breakdown rather than an unexplained figure, and `caveats` naming the
 * pricing structures we could not model.
 */
export function estimateMonthlyCost(plan, usageKwh) {
  const usage = positive(usageKwh);
  const rate = positive(plan?.rate_per_kwh);

  if (!usage || !rate) {
    return {
      amount: null,
      confidence: COST_CONFIDENCE.UNAVAILABLE,
      components: {},
      caveats: [],
      effectiveRate: null,
    };
  }

  const components = {};
  const caveats = [];

  // ── Energy ──
  components.energy = (rate / 100) * usage;

  // ── Fixed monthly charges ──
  // Two columns exist for historical reasons; prefer whichever is populated
  // rather than double-counting them.
  const baseCharge = positive(plan.monthly_base_charge) ?? positive(plan.base_charge);
  if (baseCharge !== null) components.baseCharge = baseCharge;

  // ── Utility delivery ──
  // Stored per-kWh where present. Absent it, the estimate is supply-only, which
  // is materially lower than the bill the customer will receive.
  const tdsp = positive(plan.tdsp_charges);
  if (tdsp !== null) {
    components.delivery = (tdsp / 100) * usage;
  }

  // ── Usage credit ──
  // Only applies once usage clears the threshold. A credit with no threshold is
  // treated as unconditional, which is how these plans are marketed.
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

  const amount = Object.values(components).reduce((sum, v) => sum + v, 0);

  // ── Confidence ──
  // Delivery charges are the single biggest thing we can be missing, so their
  // absence downgrades the estimate even when everything else is present.
  let confidence = COST_CONFIDENCE.COMPLETE;
  if (tdsp === null) {
    confidence = COST_CONFIDENCE.PARTIAL;
    caveats.push('Utility delivery charges are billed separately and are not included.');
  }

  // Structures the data cannot express are named rather than silently ignored.
  if (plan.plan_type === 'variable' || plan.plan_type === 'indexed') {
    caveats.push('This rate can change month to month.');
  }

  // Supply-only total: energy + fixed charges + credits, excluding delivery.
  //
  // Ranking uses this rather than `amount`. Delivery charges are populated for
  // some plans and not others, so ranking on the full total would systematically
  // favour whichever plans happen to be *missing* delivery data — they look
  // cheaper purely because we know less about them. Every plan has a supply
  // figure, so comparing on it is like for like.
  const comparableAmount =
    (components.energy ?? 0) + (components.baseCharge ?? 0) + (components.usageCredit ?? 0);

  return {
    amount: amount > 0 ? amount : null,
    comparableAmount: comparableAmount > 0 ? comparableAmount : null,
    confidence,
    components,
    caveats,
    // What the customer effectively pays per kWh once everything modelled is
    // included — the number that actually makes plans comparable.
    effectiveRate: amount > 0 ? (amount / usage) * 100 : null,
  };
}

/**
 * Difference against what the customer pays today.
 *
 * Deliberately conservative: it returns null unless both sides are trustworthy,
 * because "you save $X" computed against a partial estimate is worse than
 * showing nothing. The wording the UI uses is "estimated monthly difference",
 * not a savings promise.
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

/** Sort key that keeps plans without an estimate at the end, not at the top. */
export function costSortKey(estimate) {
  return estimate?.amount ?? Number.POSITIVE_INFINITY;
}
