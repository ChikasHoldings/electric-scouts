/**
 * Monetization router.
 *
 * Decides what happens to a completed comparison. Routing is derived from the
 * session and from what inventory actually exists — no partner is named here,
 * so adding or removing a partner is a data change rather than a code change.
 *
 * Routes:
 *   affiliate            — matching plans exist and can be clicked through
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
 * `matchCount` is how many eligible plans the results step actually found, and
 * `renewableMatchCount` how many of those meet the renewable preference.
 */
export function resolveRoute(state, { matchCount = 0, renewableMatchCount = 0 } = {}) {
  const wantsRenewable = state.energyPreference === 'renewable';

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

  // ── Residential ──
  if (wantsRenewable && renewableMatchCount === 0) {
    // Asked for renewable, nothing renewable available: hand to a partner
    // rather than showing an empty result.
    return {
      route: matchCount > 0 ? ROUTES.RENEWABLE_PARTNER : ROUTES.CONCIERGE,
      qualification: QUALIFICATION.WARM,
      score: 0,
      signals: {},
    };
  }

  if (matchCount > 0) {
    return {
      route: ROUTES.AFFILIATE,
      qualification: QUALIFICATION.HOT,
      score: 0,
      signals: {},
    };
  }

  // Residential with no inventory for this location — still a real person with
  // a real need, so route to a human instead of a dead end.
  return {
    route: state.zip ? ROUTES.CONCIERGE : ROUTES.RESIDENTIAL_PARTNER,
    qualification: QUALIFICATION.WARM,
    score: 0,
    signals: {},
  };
}
