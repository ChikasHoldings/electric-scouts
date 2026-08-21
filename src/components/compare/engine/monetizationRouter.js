/**
 * Monetization router.
 *
 * Decides what happens to a completed comparison. Routing is derived from the
 * session and from what inventory actually exists — no partner is named here,
 * so adding or removing a partner is a data change rather than a code change.
 *
 * Routes:
 *   affiliate            — at least one relevant result can actually pay a
 *                          commission; never merely "results exist"
 *   residential_partner  — residential lead with no instant inventory
 *   commercial_partner   — commercial opportunity for broker follow-up
 *   renewable_partner    — renewable request with no direct renewable match
 *   concierge            — qualified but not automatically monetizable
 *   nurture              — keep in touch, nothing actionable yet
 *   unrouted             — nothing applies; never used as a dead end in the UI
 */

import { CUSTOMER_TYPES } from './comparisonState.js';

export const ROUTES = {
  AFFILIATE: 'affiliate',
  RESIDENTIAL_PARTNER: 'residential_partner',
  COMMERCIAL_PARTNER: 'commercial_partner',
  RENEWABLE_PARTNER: 'renewable_partner',
  CONCIERGE: 'concierge',
  NURTURE: 'nurture',
  UNROUTED: 'unrouted',
};

export const QUALIFICATION = {
  HOT: 'hot',
  WARM: 'warm',
  NURTURE: 'nurture',
};

/** Commercial spend bands ordered by value, used for lead scoring. */
const SPEND_SCORE = {
  under_500: 1,
  '500_1499': 2,
  '1500_4999': 3,
  '5000_19999': 4,
  '20000_plus': 5,
  not_sure: 1,
};

const TIMING_SCORE = {
  now: 5,
  '30_days': 4,
  '1_3_months': 3,
  '3_6_months': 2,
  '6_plus_months': 1,
  comparing: 1,
};

/**
 * Score a commercial opportunity from spend and urgency.
 *
 * Both signals are stored alongside the classification so the reasoning stays
 * inspectable in the admin panel rather than being an opaque label.
 */
export function scoreCommercialLead(state) {
  // A monthly cost read off a bill is better evidence than a self-reported
  // band, so it is mapped onto the same scale rather than ignored.
  let spendScore = SPEND_SCORE[state.monthlySpendRange] ?? 0;
  if (state.monthlyCost > 0) {
    const cost = state.monthlyCost;
    spendScore = Math.max(
      spendScore,
      cost >= 20000 ? 5 : cost >= 5000 ? 4 : cost >= 1500 ? 3 : cost >= 500 ? 2 : 1
    );
  }

  const timingScore = TIMING_SCORE[state.timing] ?? (state.contractEndDate ? 3 : 1);
  const total = spendScore + timingScore;

  const qualification =
    total >= 7 ? QUALIFICATION.HOT
      : total >= 4 ? QUALIFICATION.WARM
        : QUALIFICATION.NURTURE;

  return {
    qualification,
    score: total,
    signals: { spendScore, timingScore },
  };
}

/**
 * Resolve the monetization route for a finished comparison.
 *
 * ── The invariant ──
 *
 * AFFILIATE means "this session can earn a commission". It may only be returned
 * when at least one relevant result is genuinely commission-capable.
 *
 * This used to take a single `matchCount`, and returned AFFILIATE whenever it
 * was above zero. But a result existing and a result being payable are two
 * different facts: most configured links are plain provider pages that we can
 * attribute internally and that earn nothing (INTERNAL_TRACKING_ONLY), and some
 * results have no usable destination at all (UNAVAILABLE). A comparison made
 * entirely of those was classified as affiliate revenue, which overstated what
 * the session was worth and pointed the customer at a handoff that could not
 * pay — while the partner and concierge routes that could actually help them
 * were never reached.
 *
 * So the count is now split by what it measures, and only the commission-capable
 * one opens the affiliate route:
 *
 * @param {object} state
 * @param {object} counts
 * @param {number} counts.resultCount                     results shown, whatever they are worth
 * @param {number} counts.commissionCapableCount          of those, links a conversion can pay on
 * @param {number} counts.internalTrackingOnlyCount       tracked and attributable, but not paying
 * @param {number} counts.renewableResultCount            results meeting the renewable preference
 * @param {number} counts.renewableCommissionCapableCount renewable AND commission-capable
 *
 * Every count defaults to 0, so a caller that has not been migrated fails
 * towards a human rather than towards a revenue claim it cannot support.
 *
 * What this does NOT do is hide results. Routing decides who follows up on a
 * session; the results board shows every plan it was given either way, because
 * a plan we earn nothing from is still the right answer for the customer if it
 * is the cheapest one.
 */
export function resolveRoute(state, {
  resultCount = 0,
  commissionCapableCount = 0,
  internalTrackingOnlyCount = 0,
  renewableResultCount = 0,
  renewableCommissionCapableCount = 0,
} = {}) {
  const wantsRenewable = state.energyPreference === 'renewable';

  // Why this session routed where it did, in the same inspectable form the
  // commercial branch already uses for its score. These are counts, never
  // customer data, and they are what makes "10 results but no affiliate route"
  // legible in the admin panel instead of looking like a bug.
  const signals = {
    resultCount,
    commissionCapableCount,
    internalTrackingOnlyCount,
    renewableResultCount,
    renewableCommissionCapableCount,
  };

  if (state.customerType === CUSTOMER_TYPES.COMMERCIAL) {
    const scoring = scoreCommercialLead(state);
    // Large or urgent commercial accounts are worth a human; the rest go to the
    // partner queue rather than being dropped.
    const route = scoring.qualification === QUALIFICATION.HOT
      ? ROUTES.COMMERCIAL_PARTNER
      : scoring.qualification === QUALIFICATION.WARM
        ? ROUTES.COMMERCIAL_PARTNER
        : ROUTES.NURTURE;

    return {
      route: wantsRenewable && route === ROUTES.COMMERCIAL_PARTNER
        ? ROUTES.RENEWABLE_PARTNER
        : route,
      ...scoring,
    };
  }

  // ── Residential, renewable preference ──
  //
  // The renewable test is deliberately its own count rather than the general
  // one. A commission-capable plan that is not renewable does not satisfy a
  // customer who asked for renewable supply, so it cannot be what makes this
  // session an affiliate opportunity.
  if (wantsRenewable) {
    if (renewableCommissionCapableCount > 0) {
      return {
        route: ROUTES.AFFILIATE,
        qualification: QUALIFICATION.HOT,
        score: 0,
        signals,
      };
    }

    // Renewable results exist but none of them can pay, or there is no renewable
    // inventory here at all. Either way this is the renewable partner's case —
    // the same route this branch has always used for a renewable request we
    // cannot close directly.
    return {
      route: renewableResultCount > 0 || resultCount > 0
        ? ROUTES.RENEWABLE_PARTNER
        : ROUTES.CONCIERGE,
      qualification: QUALIFICATION.WARM,
      score: 0,
      signals,
    };
  }

  // ── Residential, standard ──
  if (commissionCapableCount > 0) {
    return {
      route: ROUTES.AFFILIATE,
      qualification: QUALIFICATION.HOT,
      score: 0,
      signals,
    };
  }

  if (resultCount > 0) {
    // Results to show, none of them payable. "Qualified but not automatically
    // monetizable" is exactly what CONCIERGE is for, so the session goes to a
    // human rather than being booked as revenue it cannot produce. The board
    // keeps showing every result regardless.
    return {
      route: ROUTES.CONCIERGE,
      qualification: QUALIFICATION.WARM,
      score: 0,
      signals,
    };
  }

  // Residential with no inventory for this location — still a real person with
  // a real need, so route to a human instead of a dead end.
  return {
    route: state.zip ? ROUTES.CONCIERGE : ROUTES.RESIDENTIAL_PARTNER,
    qualification: QUALIFICATION.WARM,
    score: 0,
    signals,
  };
}
