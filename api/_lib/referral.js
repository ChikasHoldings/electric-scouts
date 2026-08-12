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

// The detector lives in src/lib so the browser (admin monetization screen) and
// this handler share one definition. Two copies would eventually disagree, and
// the number that disagreed would be the one shown to investors.
import { isCommissionCapable } from '../../src/lib/commissionCapable.js';

export { isCommissionCapable };

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
