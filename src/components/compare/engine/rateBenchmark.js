/**
 * How the customer's current rate compares to the market they can actually buy.
 *
 * The Bill Analyzer used to answer this in the browser, and answered it wrongly
 * in two independent ways:
 *
 *   1. It scored the customer's rate against every plan row in the database —
 *      all twelve states, business inventory included, deactivated plans
 *      included. A Houston household's "overpayment" was measured against the
 *      cheapest plan in Ohio, which is not a plan they can buy.
 *
 *   2. It compared their bill's effective rate (total charges ÷ kWh, so it
 *      INCLUDES utility delivery) against a plan's advertised rate (energy
 *      alone, delivery billed on top). Those two numbers are not the same kind
 *      of thing. Every customer therefore looked like they were overpaying by
 *      roughly the delivery charge — a number the size of the entire finding.
 *
 * This module fixes both by construction: it is handed the eligible, in-market,
 * in-state result set the comparison engine already produced, and it compares
 * total-bill against total-bill. A result we could not price completely has no
 * total, so it is not in the comparison — and if too few plans can be priced
 * completely, the benchmark reports that it is unavailable instead of grading
 * the customer against a handful of guesses.
 */

import { PRICING_COMPLETENESS } from './resultsContract.js';

/**
 * The fewest fully-priced plans a benchmark may be drawn from.
 *
 * A percentile computed over two plans is arithmetic, not information. Below
 * this the honest answer is that we cannot place their rate in the market yet.
 */
export const MIN_BENCHMARK_SAMPLE = 5;

/** Score bands. Wording is about the rate, never about the customer. */
export const BENCHMARK_LABELS = {
  excellent: 'Among the best available',
  good: 'Better than most',
  fair: 'Middle of the market',
  poor: 'Above most available plans',
};

function positive(value) {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) && n > 0 ? n : null;
}

function round2(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

function median(sorted) {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Band a percentile into a label. */
export function benchmarkLabel(percentile) {
  if (percentile >= 75) return BENCHMARK_LABELS.excellent;
  if (percentile >= 50) return BENCHMARK_LABELS.good;
  if (percentile >= 25) return BENCHMARK_LABELS.fair;
  return BENCHMARK_LABELS.poor;
}

/**
 * Place the customer's current bill inside the set of plans available to them.
 *
 * @param {object[]} results   result DTOs from the comparison engine
 * @param {object} input
 * @param {number} input.currentMonthlyCost  what they pay today, in dollars
 * @param {number} input.usageKwh            the usage everything was priced at
 * @returns {{available: boolean, reason?: string} & Record<string, any>}
 *
 * `score` is a percentile and nothing more: the share of plans available to
 * this customer that their current bill already beats. It is deliberately not a
 * weighted blend of several overlapping heuristics — a composite score cannot
 * be explained to the customer, and a number nobody can explain is a number
 * nobody should act on.
 */
export function benchmarkCurrentRate(results, { currentMonthlyCost, usageKwh } = {}) {
  const current = positive(currentMonthlyCost);
  const usage = positive(usageKwh);

  if (current === null) return { available: false, reason: 'no_current_bill' };
  if (usage === null) return { available: false, reason: 'no_usage' };

  // Only fully-priced plans carry a total, and only totals are comparable with
  // the customer's total. This is the whole correctness argument of the module.
  const priced = (Array.isArray(results) ? results : [])
    .filter(
      (r) =>
        r?.pricingCompleteness === PRICING_COMPLETENESS.COMPLETE &&
        positive(r.estimatedMonthlyCost) !== null
    )
    .map((r) => ({
      planId: r.planId,
      monthly: r.estimatedMonthlyCost,
      // Effective rate is the modelled total spread back over the same usage,
      // so it is directly comparable with the customer's own bill rate.
      effectiveRate: positive(r.effectiveRate) ?? (r.estimatedMonthlyCost / usage) * 100,
    }));

  if (priced.length < MIN_BENCHMARK_SAMPLE) {
    return {
      available: false,
      reason: 'insufficient_priced_inventory',
      pricedCount: priced.length,
    };
  }

  const currentEffectiveRate = (current / usage) * 100;

  const monthlies = priced.map((p) => p.monthly).sort((a, b) => a - b);
  const cheapest = monthlies[0];

  // How many of the plans they can actually buy cost less than their bill.
  const cheaperCount = monthlies.filter((m) => m < current).length;

  // The share of available plans their current bill already beats. Ties count
  // as beaten: paying exactly what a plan would cost is not losing to it.
  const percentile = Math.round(((monthlies.length - cheaperCount) / monthlies.length) * 100);

  // Overpayment is measured against the cheapest plan they could switch to, on
  // the same total-bill basis, and floored at zero — a customer already on the
  // best available plan is not overpaying by a negative amount.
  const monthlyOverpayment = Math.max(0, current - cheapest);
  const overpaymentPercent = cheapest > 0 ? Math.max(0, ((current - cheapest) / cheapest) * 100) : 0;

  return {
    available: true,
    basis: 'total',
    score: percentile,
    label: benchmarkLabel(percentile),
    currentMonthlyCost: round2(current),
    currentEffectiveRate: round2(currentEffectiveRate),
    bestMonthlyCost: round2(cheapest),
    bestEffectiveRate: round2((cheapest / usage) * 100),
    medianMonthlyCost: round2(median(monthlies)),
    medianEffectiveRate: round2((median(monthlies) / usage) * 100),
    monthlyOverpayment: round2(monthlyOverpayment),
    annualOverpayment: round2(monthlyOverpayment * 12),
    overpaymentPercent: round2(overpaymentPercent),
    cheaperCount,
    comparedCount: monthlies.length,
    usageKwh: Math.round(usage),
  };
}
