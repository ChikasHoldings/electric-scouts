/**
 * Plan ranking.
 *
 * "Best match" has to mean something. This scores every eligible plan against
 * what the session actually knows about the customer, and the score is
 * deterministic: the same inputs always produce the same order, and every
 * component is inspectable.
 *
 * The commercial rule is explicit and load-bearing: an affiliate relationship
 * is worth a fraction of a point and is applied *after* customer-value scoring,
 * so it can only ever separate plans that are already equivalent. It can never
 * lift a worse plan above a better one.
 */

import { estimateMonthlyCost, COST_CONFIDENCE, costSortKey } from './planPricing.js';
import { matchScore } from './matchScore.js';

/**
 * Weights, in points. Cost dominates because it is what the customer pays;
 * everything else adjusts around it.
 */
/**
 * How much more expensive a plan has to be than the cheapest option before it
 * scores nothing on cost. 25% is wide enough that ordinary market spread is
 * ranked smoothly, and tight enough that a genuinely expensive plan is buried.
 */
const PREMIUM_CEILING = 0.25;

export const WEIGHTS = {
  cost: 50,          // relative monthly cost against the eligible set
  renewable: 20,     // only when the customer asked for renewable
  term: 12,          // contract length against stated intent
  rateStability: 8,  // fixed pricing when the customer wants predictability
  dataQuality: 10,   // we can actually price it
  affiliate: 0.5,    // tie-breaker only — see module comment
};

/** Terms that suit each stated intent, best first. */
const TERM_PREFERENCE = {
  // Moving: wants service now, not a long commitment before they've settled.
  moving: (months) => (months <= 12 ? 1 : months <= 24 ? 0.5 : 0.2),
  // Switching: usually chasing a better rate, longer lock-ins are fine.
  switching: (months) => (months >= 12 ? 1 : 0.6),
  // Rate shopping: values the lock.
  better_rate: (months) => (months >= 12 ? 1 : 0.5),
};

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

/**
 * Score one plan. `costRange` is the min/max estimated cost across the eligible
 * set, so cost is scored relatively — the cheapest plan available scores full
 * marks whatever the absolute price level in that market happens to be.
 */
export function scorePlan(plan, state, { usageKwh, costRange, hasAffiliate }) {
  const estimate = estimateMonthlyCost(plan, usageKwh);
  const breakdown = {};

  // ── Cost ──
  //
  // Scored as a premium over the cheapest comparable plan, not as a position
  // between cheapest and dearest. Straight min-max normalization made the
  // spread meaningless: in a set where the cheapest is $126 and the dearest
  // $130, a $4 gap consumed the entire cost weight and drowned out every other
  // signal. A premium scale keeps small differences small — a plan has to be
  // PREMIUM_CEILING more expensive before it loses the cost score outright.
  const comparable = estimate.comparableAmount;
  if (comparable !== null && costRange.min > 0) {
    const premium = (comparable - costRange.min) / costRange.min;
    breakdown.cost = WEIGHTS.cost * (1 - clamp01(premium / PREMIUM_CEILING));
  } else {
    breakdown.cost = 0;
  }

  // ── Renewable ──
  // Only scored when the customer expressed the preference; otherwise a green
  // plan gets no artificial advantage over a cheaper conventional one.
  const renewablePct = Number(plan.renewable_percentage) || 0;
  if (state.energyPreference === 'renewable') {
    breakdown.renewable = WEIGHTS.renewable * clamp01(renewablePct / 100);
  } else {
    breakdown.renewable = 0;
  }

  // ── Contract term against intent ──
  const months = Number(plan.contract_length) || 0;
  const termFit = TERM_PREFERENCE[state.shoppingIntent];
  breakdown.term = termFit && months > 0 ? WEIGHTS.term * termFit(months) : 0;

  // ── Rate stability ──
  breakdown.rateStability = plan.plan_type === 'fixed' ? WEIGHTS.rateStability : 0;

  // ── Data quality ──
  // A plan we can price completely is genuinely more useful to the customer
  // than one where the estimate is a guess, so it ranks above it.
  breakdown.dataQuality =
    estimate.confidence === COST_CONFIDENCE.COMPLETE ? WEIGHTS.dataQuality
      : estimate.confidence === COST_CONFIDENCE.PARTIAL ? WEIGHTS.dataQuality * 0.5
        : 0;

  // ── Affiliate tie-breaker ──
  // Applied last and worth half a point: two plans have to be within half a
  // point of each other on customer value before this changes anything.
  breakdown.affiliate = hasAffiliate ? WEIGHTS.affiliate : 0;

  const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

  return { plan, estimate, score, breakdown, hasAffiliate };
}

/**
 * Reasons a plan is a good match, derived only from data we actually have.
 *
 * Anything that cannot be supported is simply not returned — there is no
 * fallback copy, because a generic reason on every card is noise.
 */
export function matchReasons(scored, state, { ranked, usageKwh }) {
  const reasons = [];
  const { plan, estimate } = scored;

  // Cheapest of the eligible set, at this customer's usage.
  const cheapest = ranked.reduce(
    (best, r) => (costSortKey(r.estimate) < costSortKey(best.estimate) ? r : best),
    ranked[0]
  );
  if (cheapest?.plan?.id === plan.id && estimate.amount !== null) {
    reasons.push(
      usageKwh
        ? `Lowest estimated cost at ${Math.round(usageKwh).toLocaleString()} kWh`
        : 'Lowest estimated monthly cost'
    );
  }

  const renewablePct = Number(plan.renewable_percentage) || 0;
  if (state.energyPreference === 'renewable' && renewablePct >= 50) {
    reasons.push(
      renewablePct >= 100
        ? 'Matches your renewable preference — 100% renewable'
        : `Matches your renewable preference — ${renewablePct}% renewable`
    );
  }

  const months = Number(plan.contract_length) || 0;
  if (state.shoppingIntent === 'moving' && months > 0 && months <= 12) {
    reasons.push('Shorter term while you settle in');
  }
  if (plan.plan_type === 'fixed' && months >= 12) {
    reasons.push(`Rate fixed for ${months} months`);
  }

  if (estimate.components?.usageCredit) {
    reasons.push('Bill credit applies at your usage level');
  }

  return reasons.slice(0, 2);
}

/**
 * Rank the eligible set.
 *
 * Returns `{ top, rest }` — the three best matches and everything else in
 * score order. Ties break on estimated cost then plan id so the order is
 * stable across renders and reloads.
 */
export function rankPlans(plans, state, { usageKwh, affiliateIds = new Set() } = {}) {
  if (!Array.isArray(plans) || plans.length === 0) {
    return { top: [], rest: [], all: [] };
  }

  const estimates = plans.map((plan) => estimateMonthlyCost(plan, usageKwh));
  // Built from the supply-only figure for the same reason scoring uses it.
  const amounts = estimates.map((e) => e.comparableAmount).filter((a) => a !== null);

  const costRange = {
    min: amounts.length ? Math.min(...amounts) : 0,
    max: amounts.length ? Math.max(...amounts) : 0,
  };

  const scored = plans.map((plan) =>
    scorePlan(plan, state, {
      usageKwh,
      costRange,
      hasAffiliate: affiliateIds.has(plan.id),
    })
  );

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const costDelta = costSortKey(a.estimate) - costSortKey(b.estimate);
    if (costDelta !== 0) return costDelta;
    return String(a.plan.id).localeCompare(String(b.plan.id));
  });

  // The customer-facing score is attached to every entry, not just the top
  // three, so a plan shows the same number wherever it appears.
  for (const entry of scored) entry.match = matchScore(entry, state, WEIGHTS);

  // ── Completeness gate on the Top 3 ──
  //
  // A plan we cannot fully price must not occupy a headline slot while plans
  // we CAN fully price are available. Ranking already compares supply-to-supply
  // so a missing delivery charge cannot inflate the cost score — but the figure
  // the customer READS is the total, and a partial total sits next to complete
  // ones as though the two were comparable. A $105 "excludes delivery" card in
  // the #1 slot beside a complete $158 card tells the customer they would save
  // $53, which is not something we know.
  //
  // So completeness gates the top three only. Partial plans keep their place in
  // the full list, correctly ordered and clearly disclosed.
  const complete = scored.filter((e) => e.estimate.confidence === COST_CONFIDENCE.COMPLETE);
  const headline = complete.length >= 3 ? complete : scored;
  const rest = scored.filter((e) => !headline.slice(0, 3).includes(e));

  const top = headline.slice(0, 3).map((entry, index) => ({
    ...entry,
    rank: index + 1,
    reasons: matchReasons(entry, state, { ranked: scored, usageKwh }),
  }));

  return { top, rest, all: scored };
}

/**
 * How personalized the ranking actually is.
 *
 * Drives the labelling: with only a ZIP we say "match", with usage and a bill
 * we can honestly say the ranking reflects the customer's own numbers.
 */
export function personalizationLevel(state) {
  let signals = 0;
  if (state.zip) signals += 1;
  if (state.usageRange || state.monthlyUsageKwh > 0) signals += 1;
  if (state.monthlyUsageKwh > 0) signals += 1; // measured beats a band
  if (state.shoppingIntent || state.timing) signals += 1;
  if (state.energyPreference) signals += 1;

  return signals >= 4 ? 'high' : signals >= 2 ? 'medium' : 'low';
}

/** Labels for the top three. Never "Perfect Match". */
export const RANK_LABELS = {
  1: 'Best match',
  2: 'Strong match',
  3: 'Great match',
};
