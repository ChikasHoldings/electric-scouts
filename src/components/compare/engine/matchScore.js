/**
 * Customer-facing match score.
 *
 * The ranking engine produces a raw point total whose maximum depends on what
 * the session knows: a customer who never stated an intent cannot earn the
 * term points, so scoring them against the full scale would cap everyone at
 * ~70% and make a genuinely perfect match look mediocre.
 *
 * This maps the raw score onto 0-100 against the points that were *actually
 * attainable for that customer*, then applies an honesty cap for incomplete
 * pricing. Same inputs always produce the same number.
 */

import { COST_CONFIDENCE } from './planPricing.js';

/**
 * Ceilings applied when we cannot fully price a plan.
 *
 * A plan we cannot price completely may still be the right answer, but we are
 * less sure, and the number the customer reads should say so. Without this a
 * plan missing its delivery charge could show 96% purely because the unknown
 * component was treated as zero.
 */
export const CONFIDENCE_CAPS = {
  [COST_CONFIDENCE.COMPLETE]: 100,
  [COST_CONFIDENCE.PARTIAL]: 79,
  [COST_CONFIDENCE.UNAVAILABLE]: 59,
};

/** Presentation bands. Never "Perfect match". */
export function scoreLabel(score) {
  if (score >= 90) return 'Excellent match';
  if (score >= 80) return 'Strong match';
  if (score >= 70) return 'Good match';
  return 'Possible match';
}

/**
 * Points this customer could possibly have earned.
 *
 * Mirrors the conditions in `scorePlan`: a weight only counts toward the
 * denominator when the session carries the signal that weight scores.
 */
export function attainablePoints(state, weights) {
  let total = weights.cost + weights.rateStability + weights.dataQuality;
  if (state.energyPreference === 'renewable') total += weights.renewable;
  if (state.shoppingIntent) total += weights.term;
  return total;
}

/**
 * Map a scored entry onto a 0-100 customer-facing score.
 *
 * @param {{score: number, estimate: object}} entry  from `scorePlan`
 * @param {object} state
 * @param {object} weights  the same WEIGHTS the ranking engine used
 * @returns {{score: number, label: string, capped: boolean, confidence: string}}
 */
export function matchScore(entry, state, weights) {
  const attainable = attainablePoints(state, weights);
  const confidence = entry?.estimate?.confidence || COST_CONFIDENCE.UNAVAILABLE;
  const cap = CONFIDENCE_CAPS[confidence] ?? CONFIDENCE_CAPS[COST_CONFIDENCE.UNAVAILABLE];

  if (!attainable || !Number.isFinite(entry?.score)) {
    return { score: 0, label: scoreLabel(0), capped: true, confidence };
  }

  // The affiliate tie-breaker is deliberately excluded from the denominator
  // and from the numerator: a commercial relationship must never move the
  // number a customer reads as "how well this fits me".
  const raw = Math.max(0, entry.score - (entry.hasAffiliate ? weights.affiliate : 0));
  const percent = Math.round((raw / attainable) * 100);
  const score = Math.max(0, Math.min(cap, percent));

  return {
    score,
    label: scoreLabel(score),
    capped: percent > cap,
    confidence,
  };
}
