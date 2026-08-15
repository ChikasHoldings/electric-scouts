/**
 * providerReadiness.js
 *
 * Whether a supplier can be switched live, and what is stopping it.
 *
 * Turning a provider on is a publishing decision, not a checkbox. The switch in
 * the admin panel decides three things at once:
 *
 *   - whether /providers/<slug> renders a page or the "not found" shell
 *   - whether the supplier's plans appear in any comparison
 *   - whether its page stays in Google's index
 *
 * The operator could see none of that. The Plans column counted every plan
 * including the inactive ones, so a supplier with nine dead plans read as "9"
 * and switching it on produced a live page with nothing on it. The Affiliate
 * column showed the `has_affiliate_program` flag, which is a note-to-self, not
 * a link — a supplier could carry the flag, no URL, and a sign-up button that
 * went to "#".
 *
 * And switching one *off* is worse, because it is slow to undo: the URL drops
 * out of the sitemap, gets recrawled as a 404, and takes weeks to come back.
 * That already happened once — on 2026-08-13 every provider row but two was
 * flipped inactive in a single pass, and nothing in the panel said what that
 * would cost.
 *
 * This module answers both questions from data, so the panel can state them
 * plainly and an operator with an affiliate link in hand never has to guess.
 *
 * Plain JS with no React import: the admin screen and the tests both read it.
 */

/** A supplier needs somewhere to send a customer who clicks "sign up". */
export function outboundUrlFor(provider, affiliateLinks = []) {
  const tracked = affiliateLinks.find(
    (link) => link && link.is_active && link.provider_id === provider.id && link.slug
  );
  if (tracked) return { url: `/go/${tracked.slug}`, kind: 'tracked' };
  if (provider.affiliate_url) return { url: provider.affiliate_url, kind: 'affiliate' };
  if (provider.website_url) return { url: provider.website_url, kind: 'website' };
  return { url: null, kind: 'none' };
}

/**
 * @param {object} provider          a row from electricity_providers
 * @param {Array}  plans             every plan row (filtered here by name)
 * @param {Array}  [affiliateLinks]  rows from affiliate_links
 */
export function providerReadiness(provider, plans = [], affiliateLinks = []) {
  const mine = plans.filter((plan) => plan.provider_name === provider.name);
  const activePlans = mine.filter((plan) => plan.is_active).length;
  const outbound = outboundUrlFor(provider, affiliateLinks);
  const states = (provider.supported_states || []).length;

  // Ordered by what an operator should fix first.
  const blockers = [];
  if (activePlans === 0) {
    blockers.push(mine.length
      ? `all ${mine.length} of its plans are switched off`
      : 'it has no plans yet');
  }
  if (!outbound.url) blockers.push('it has no affiliate link or website to send customers to');
  if (states === 0) blockers.push('no states are selected');

  const canPublish = blockers.length === 0;
  const published = Boolean(provider.is_active) && canPublish;

  return {
    totalPlans: mine.length,
    activePlans,
    states,
    outbound,
    blockers,
    canPublish,
    published,
    /**
     * live      — on, and working
     * incomplete— on, but something is missing, so the page is already degraded
     * ready     — off, and would work the moment it is switched on
     * blocked   — off, and switching it on would publish a broken page
     */
    status: provider.is_active
      ? (canPublish ? 'live' : 'incomplete')
      : (canPublish ? 'ready' : 'blocked'),
  };
}

export const STATUS_LABELS = {
  live: 'Live',
  incomplete: 'Live, incomplete',
  ready: 'Ready',
  blocked: 'Not ready',
};

/**
 * What to tell the operator before a switch actually flips.
 *
 * Returns null when the change is unremarkable and should just happen.
 * Everything else gets a confirmation naming the consequence, in the terms the
 * consequence is actually felt: a page appearing or disappearing from search.
 */
export function toggleWarning(provider, readiness, nextActive) {
  if (nextActive && !readiness.canPublish) {
    return {
      title: `Switch on ${provider.name} anyway?`,
      body:
        `Its page will publish, but ${readiness.blockers.join(', and ')}. ` +
        'Visitors will land on a page with nothing to compare. Fix that first and ' +
        'the switch will go through without this warning.',
      confirmLabel: 'Switch on anyway',
    };
  }

  if (!nextActive && readiness.published) {
    return {
      title: `Take ${provider.name} off the site?`,
      body:
        `Its page and its ${readiness.activePlans} ` +
        `${readiness.activePlans === 1 ? 'plan' : 'plans'} come down immediately, and ` +
        '/providers/' + slugify(provider.name) + ' drops out of the sitemap. ' +
        'Google recrawls it as a missing page, and it takes weeks to rank again ' +
        'once it is switched back on.',
      confirmLabel: 'Take it down',
    };
  }

  return null;
}

/** Mirrors utils/providerSlug.generateProviderSlug — kept import-free here. */
function slugify(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/&/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * A one-line read on the whole catalog, for the bar at the top of the screen.
 *
 * `atRisk` is the number that matters: suppliers that are on but broken, which
 * is the state nobody notices because the switch looks right.
 */
export function catalogReadiness(providers = [], plans = [], affiliateLinks = []) {
  const rows = providers.map((p) => providerReadiness(p, plans, affiliateLinks));
  return {
    total: providers.length,
    live: rows.filter((r) => r.status === 'live').length,
    incomplete: rows.filter((r) => r.status === 'incomplete').length,
    ready: rows.filter((r) => r.status === 'ready').length,
    blocked: rows.filter((r) => r.status === 'blocked').length,
    atRisk: rows.filter((r) => r.status === 'incomplete').length,
  };
}
