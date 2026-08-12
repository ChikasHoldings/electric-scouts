/**
 * Referral destination classification.
 *
 * Two things that look identical in the database are not the same commercially,
 * and conflating them overstates revenue:
 *
 *   TRACKED INTERNAL CLICK — every /api/go hit. We know who clicked what.
 *   COMMISSION-CAPABLE     — the destination carries real affiliate-network
 *                            tracking, so a conversion can pay.
 *
 * 36 of 38 configured links currently point at plain public provider pages.
 * Those clicks are attributable to us and worth nothing to us, and reporting
 * has to be able to tell the difference.
 */

import { MONETIZATION } from '../../src/components/compare/engine/resultsContract.js';

/**
 * Affiliate networks whose URLs carry a tracking identifier.
 *
 * Matched on host, not on a substring of the whole URL, so a provider page
 * that merely mentions a network name in a path cannot be misread as tracked.
 */
const NETWORK_HOSTS = [
  'awin1.com',
  'awin.com',
  'zenaps.com',
  'sjv.io',
  'impact.com',
  'pxf.io',
  'cj.com',
  'anrdoezrs.net',
  'dpbolvw.net',
  'jdoqocy.com',
  'kqzyfj.com',
  'tkqlhce.com',
  'linksynergy.com',
  'shareasale.com',
  'flexlinks.com',
  'flexoffers.com',
];

/** Query keys that indicate an affiliate identifier is being passed through. */
const TRACKING_PARAMS = [
  'awinaffid', 'awinmid', 'affid', 'aff_id', 'afftrack', 'subid', 'sub_id',
  'clickref', 'irclickid', 'utm_source', 'sscid', 'siteid', 'pid', 'ref',
];

/**
 * Does this destination carry real affiliate-network tracking?
 *
 * Conservative: unknown means NOT commission-capable. Overstating monetization
 * is the expensive direction to be wrong in, because it hides the providers
 * that still need a real referral URL configured.
 */
export function isCommissionCapable(url) {
  if (!url || typeof url !== 'string') return false;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if (NETWORK_HOSTS.some((n) => host === n || host.endsWith(`.${n}`))) return true;

  // A provider's own domain can still be commission-capable when it carries an
  // affiliate identifier the provider issued.
  for (const key of parsed.searchParams.keys()) {
    if (TRACKING_PARAMS.includes(key.toLowerCase())) return true;
  }

  return false;
}

/**
 * Is this a usable redirect target?
 *
 * Rejects placeholders and the malformed CJ links that were configured without
 * a deal id — those resolve to a network error page rather than the provider,
 * so sending a customer to one is worse than falling back to the provider's
 * own site.
 */
export function isValidRedirectUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;

  const invalidPatterns = [
    /sjv\.io\/c\/[^/]+\/[^/]+$/, // CJ Affiliate links without a proper article/deal ID
    /example\.com/,
    /placeholder/i,
    /your-affiliate/i,
    /partner\.example/i,
  ];
  if (invalidPatterns.some((pattern) => pattern.test(url))) return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * The destination an /api/go hit will land on.
 *
 * Priority: the link's own target_url, then the provider's affiliate_url, then
 * the provider's website_url. Offer-specific links win because they are the
 * more specific configuration; provider-level is the fallback that actually
 * carries production today — all 38 active links are provider-keyed and none
 * are offer-keyed, so losing this fallback would unresolve every plan.
 *
 * Shared with the comparison engine so a plan's advertised monetization status
 * is derived from the same resolution the redirect will really perform.
 */
export function resolveRedirectUrl(link) {
  if (isValidRedirectUrl(link?.target_url)) return link.target_url;
  if (isValidRedirectUrl(link?.provider?.affiliate_url)) return link.provider.affiliate_url;
  if (isValidRedirectUrl(link?.provider?.website_url)) return link.provider.website_url;
  return null;
}

/**
 * What a click on this link is commercially worth.
 *
 * Returns one of the MONETIZATION values. Deliberately conservative: a plain
 * provider page is `internal_tracking_only`, never commission_capable, because
 * overstating monetization hides the providers that still need a real referral
 * URL configured.
 */
export function classifyMonetization(link) {
  const destination = resolveRedirectUrl(link);
  if (!destination) return MONETIZATION.UNAVAILABLE;
  return isCommissionCapable(destination)
    ? MONETIZATION.COMMISSION_CAPABLE
    : MONETIZATION.INTERNAL_TRACKING_ONLY;
}

/** Which configured field produced the destination. */
export function resolutionOf(link, redirectUrl) {
  if (!redirectUrl) return 'unresolved';
  if (link?.offer_id && link?.target_url === redirectUrl) return 'offer_link';
  if (link?.target_url === redirectUrl) return 'provider_link';
  if (link?.provider?.affiliate_url === redirectUrl) return 'provider_affiliate_url';
  if (link?.provider?.website_url === redirectUrl) return 'provider_website';
  return 'other';
}
