/**
 * Monetization health.
 *
 * Answers one question per provider, from live catalog data: can this provider
 * actually earn revenue right now, and if not, what is missing?
 *
 * The distinction this module exists to hold apart — and the one that matters
 * most in diligence — is between a click we can attribute and a click that can
 * pay us:
 *
 *   TRACKED     every /api/go hit is recorded against a session, plan and
 *               provider. We know exactly what happened.
 *   EARNING     the destination carries real affiliate-network tracking, so a
 *               conversion can actually be credited to us.
 *
 * A provider can be fully tracked and earn nothing. Reporting those as one
 * number would overstate revenue readiness, which is the single easiest way to
 * lose credibility with an investor who checks.
 *
 * Pure functions over rows already fetched, so the same logic backs the admin
 * screen and the tests.
 */

/** What is blocking a provider from earning, most-blocking first. */
export const BLOCKERS = {
  PROVIDER_INACTIVE: 'provider_inactive',
  NO_ACTIVE_PLANS: 'no_active_plans',
  NO_AFFILIATE_LINK: 'no_affiliate_link',
  LINK_INACTIVE: 'link_inactive',
  NOT_COMMISSION_CAPABLE: 'not_commission_capable',
};

export const BLOCKER_LABELS = {
  [BLOCKERS.PROVIDER_INACTIVE]: 'Provider is inactive',
  [BLOCKERS.NO_ACTIVE_PLANS]: 'No active plans',
  [BLOCKERS.NO_AFFILIATE_LINK]: 'No referral link configured',
  [BLOCKERS.LINK_INACTIVE]: 'Referral link is switched off',
  [BLOCKERS.NOT_COMMISSION_CAPABLE]: 'Link has no affiliate tracking — earns nothing',
};

/** What an admin should do about it. */
export const BLOCKER_ACTIONS = {
  [BLOCKERS.PROVIDER_INACTIVE]: 'Activate the provider, or leave it retired.',
  [BLOCKERS.NO_ACTIVE_PLANS]: 'Add or activate at least one plan.',
  [BLOCKERS.NO_AFFILIATE_LINK]: 'Create a referral link for this provider.',
  [BLOCKERS.LINK_INACTIVE]: 'Re-activate the referral link.',
  [BLOCKERS.NOT_COMMISSION_CAPABLE]:
    'Replace the destination with a tracked affiliate-network URL from the provider or network.',
};

/**
 * Revenue state for one provider.
 *
 * `earning` is deliberately strict: everything must line up. `tracked` is true
 * whenever a click would be recorded, which is a weaker and much more common
 * condition.
 *
 * @param {object} provider
 * @param {object[]} links      affiliate_links rows for this provider
 * @param {number} activePlans  count of active plans
 * @param {(url: string) => boolean} isCommissionCapable  injected so the admin
 *        screen and the redirect handler share one definition
 */
export function providerRevenueState(provider, links, activePlans, isCommissionCapable) {
  const blockers = [];

  const providerActive = provider?.is_active === true;
  if (!providerActive) blockers.push(BLOCKERS.PROVIDER_INACTIVE);
  if (!activePlans) blockers.push(BLOCKERS.NO_ACTIVE_PLANS);

  const all = Array.isArray(links) ? links : [];
  const active = all.filter((l) => l.is_active === true);

  if (all.length === 0) {
    blockers.push(BLOCKERS.NO_AFFILIATE_LINK);
  } else if (active.length === 0) {
    blockers.push(BLOCKERS.LINK_INACTIVE);
  }

  const capable = active.filter((l) => isCommissionCapable(l.target_url));
  if (active.length > 0 && capable.length === 0) {
    blockers.push(BLOCKERS.NOT_COMMISSION_CAPABLE);
  }

  // A click is recorded whenever an active link exists to route through,
  // whatever the destination turns out to be worth.
  const tracked = providerActive && activePlans > 0 && active.length > 0;
  const earning = tracked && capable.length > 0;

  return {
    providerId: provider?.id || null,
    providerName: provider?.name || 'Unknown provider',
    providerActive,
    activePlans,
    linkCount: all.length,
    activeLinkCount: active.length,
    commissionCapableCount: capable.length,
    hasLogo: Boolean(provider?.logo_url),
    tracked,
    earning,
    blockers,
    // The one thing to fix first. Ordered by how blocking it is, so an admin
    // working top-down is always doing the highest-leverage thing available.
    primaryBlocker: blockers[0] || null,
  };
}

/**
 * Portfolio-level rollup.
 *
 * `revenueReadyPlans` is the number that matters commercially: not how many
 * providers are configured, but how much of the inventory a customer actually
 * sees can pay us when they click it.
 */
export function summarize(states) {
  const rows = Array.isArray(states) ? states : [];
  const active = rows.filter((r) => r.providerActive);

  const totalActivePlans = active.reduce((sum, r) => sum + r.activePlans, 0);
  const earningPlans = active.filter((r) => r.earning).reduce((sum, r) => sum + r.activePlans, 0);
  const trackedPlans = active.filter((r) => r.tracked).reduce((sum, r) => sum + r.activePlans, 0);

  return {
    providers: rows.length,
    activeProviders: active.length,
    earningProviders: active.filter((r) => r.earning).length,
    trackedProviders: active.filter((r) => r.tracked).length,
    providersMissingLogo: active.filter((r) => !r.hasLogo).length,

    activePlans: totalActivePlans,
    trackedPlans,
    earningPlans,

    // Share of visible inventory that can actually produce revenue. Rounded to
    // a whole percent; 0 when there is no inventory rather than NaN.
    earningPlanShare: totalActivePlans ? Math.round((earningPlans / totalActivePlans) * 100) : 0,
  };
}

/** Providers to fix first: most active plans behind the blocker, worst first. */
export function prioritizedGaps(states) {
  return (Array.isArray(states) ? states : [])
    .filter((r) => r.providerActive && !r.earning)
    .sort((a, b) => b.activePlans - a.activePlans);
}
