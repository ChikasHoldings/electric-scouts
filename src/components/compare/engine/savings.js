/**
 * Current bill vs estimated new cost.
 *
 * The rule that governs this whole module: a savings claim we cannot defend is
 * worse than showing nothing at all. Every path that cannot be fully supported
 * returns `available: false` and the UI renders nothing.
 *
 * The other half is transparency in the opposite direction — a plan that costs
 * MORE is reported as costing more, in plain language, rather than quietly
 * omitted. Hiding unfavourable differences is what makes a comparison site
 * untrustworthy.
 */

import { COST_CONFIDENCE } from './planPricing.js';

/** Bill confidence values the Bill Analyzer can report. */
const TRUSTED_BILL_CONFIDENCE = new Set(['high']);

function positive(value) {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * May the customer's own bill figures be used to draw a conclusion?
 *
 * Extracted so every surface that reasons from the current bill — the savings
 * line on a result, and the market benchmark the Bill Analyzer leads with —
 * applies exactly the same rules. Two places deciding separately whether a bill
 * is trustworthy is two places that can disagree about the same bill.
 *
 * @param {object} state comparison session
 * @returns {{trusted: boolean, reason?: string, currentMonthly?: number}}
 */
export function currentBillTrust(state) {
  const current = positive(state?.monthlyCost);

  if (current === null) {
    return { trusted: false, reason: 'no_current_bill' };
  }

  // A figure read off a bill with low confidence is not a basis for a savings
  // claim. The customer confirming it upgrades confidence and unlocks this.
  if (state?.billAnalysisStatus === 'complete' &&
      state?.billConfidence &&
      !TRUSTED_BILL_CONFIDENCE.has(state.billConfidence)) {
    return { trusted: false, reason: 'bill_confidence_low' };
  }

  // A value the customer was asked to verify and has not yet verified.
  if (Array.isArray(state?.unverifiedFields) &&
      (state.unverifiedFields.includes('monthlyCost') ||
       state.unverifiedFields.includes('monthlyUsageKwh'))) {
    return { trusted: false, reason: 'unverified_inputs' };
  }

  return { trusted: true, currentMonthly: current };
}

/**
 * Compare a plan estimate against what the customer pays today.
 *
 * @param {object} estimate  from `estimateMonthlyCost`
 * @param {object} state     comparison session
 * @returns {{
 *   available: boolean, reason?: string, direction?: 'saving'|'costlier'|'same',
 *   currentMonthly?: number, estimatedMonthly?: number,
 *   monthlyDelta?: number, annualDelta?: number
 * }}
 */
export function compareToCurrentBill(estimate, state) {
  // ── Every reason we must stay silent ──

  const trust = currentBillTrust(state);
  if (!trust.trusted) {
    return { available: false, reason: trust.reason };
  }

  const current = trust.currentMonthly;
  const estimated = positive(estimate?.amount);
  if (estimated === null) {
    return { available: false, reason: 'no_estimate' };
  }

  // Partial pricing is the single most dangerous case: the missing component
  // is always a CHARGE, so a partial estimate is always too low, and a savings
  // figure computed from it always overstates the saving.
  if (estimate?.confidence !== COST_CONFIDENCE.COMPLETE) {
    return { available: false, reason: 'incomplete_pricing' };
  }

  // ── Both sides trustworthy ──

  const monthlyDelta = Math.round((estimated - current) * 100) / 100;
  const annualDelta = Math.round(monthlyDelta * 12 * 100) / 100;

  const direction =
    monthlyDelta < -0.5 ? 'saving'
      : monthlyDelta > 0.5 ? 'costlier'
        : 'same';

  return {
    available: true,
    direction,
    currentMonthly: current,
    estimatedMonthly: estimated,
    monthlyDelta,
    annualDelta,
  };
}

/**
 * Wording for a comparison.
 *
 * "Potential", never "guaranteed" — the estimate rests on the customer's
 * stated usage and the components we hold, neither of which is a promise.
 */
export function describeComparison(comparison) {
  if (!comparison?.available) return null;

  const monthly = Math.abs(comparison.monthlyDelta);
  const annual = Math.abs(comparison.annualDelta);

  if (comparison.direction === 'saving') {
    return {
      tone: 'positive',
      headline: `Potential savings: $${monthly.toFixed(0)}/mo`,
      annual: `≈ $${annual.toFixed(0)}/year`,
      // Screen readers and colour-blind users get the direction in words, so
      // the meaning never rests on green-vs-red alone.
      srText: `Estimated saving of ${monthly.toFixed(0)} dollars per month`,
    };
  }

  if (comparison.direction === 'costlier') {
    return {
      tone: 'negative',
      headline: `Estimated difference: +$${monthly.toFixed(0)}/mo`,
      annual: `About $${annual.toFixed(0)}/year more`,
      srText: `Estimated ${monthly.toFixed(0)} dollars per month more than your current bill`,
    };
  }

  return {
    tone: 'neutral',
    headline: 'About the same as your current bill',
    annual: null,
    srText: 'Estimated cost is about the same as your current bill',
  };
}
