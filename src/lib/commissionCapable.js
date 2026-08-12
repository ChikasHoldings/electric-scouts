/**
 * Does an outbound destination carry real affiliate-network tracking?
 *
 * One definition, imported by the /api/go redirect handler (which records
 * whether a click can pay) and by the admin monetization screen (which reports
 * it). Two copies would eventually disagree, and the number that disagreed
 * would be the one shown to investors.
 *
 * Conservative by design: unknown means NOT commission-capable. Overstating
 * monetization is the expensive direction to be wrong in, because it hides the
 * providers that still need a real referral URL configured.
 */

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
  let hasTrackingParam = false;
  parsed.searchParams.forEach((_value, key) => {
    if (TRACKING_PARAMS.includes(key.toLowerCase())) hasTrackingParam = true;
  });

  return hasTrackingParam;
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
