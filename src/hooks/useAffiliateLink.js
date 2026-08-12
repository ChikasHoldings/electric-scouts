import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Cache for affiliate links to avoid repeated DB queries.
 * Keyed by provider_id or offer_id.
 */
const linkCache = {
  byProvider: {},
  byOffer: {},
  allLoaded: false,
  allLinks: [],
};

/**
 * Load all active affiliate links into cache (called once).
 */
async function loadAllLinks() {
  if (linkCache.allLoaded) return linkCache.allLinks;

  const { data, error } = await supabase
    .from("affiliate_links")
    .select("slug, provider_id, offer_id, target_url, is_active")
    .eq("is_active", true);

  if (error) {
    console.error("Failed to load affiliate links:", error);
    return [];
  }

  linkCache.allLinks = data || [];
  linkCache.allLoaded = true;

  // Index by provider_id and offer_id
  for (const link of linkCache.allLinks) {
    if (link.provider_id) {
      linkCache.byProvider[link.provider_id] = link;
    }
    if (link.offer_id) {
      linkCache.byOffer[link.offer_id] = link;
    }
  }

  return linkCache.allLinks;
}

/**
 * Get the affiliate redirect URL for a given provider or plan.
 * Returns /api/go?slug=[slug] if an active affiliate link exists, or the fallback URL.
 *
 * @param {Object} options
 * @param {string} [options.providerId] - Provider UUID
 * @param {string} [options.offerId] - Plan/offer UUID
 * @param {string} [options.fallbackUrl] - URL to use if no affiliate link exists
 * @returns {string} The resolved URL
 */
export function getAffiliateUrl({ providerId, offerId, fallbackUrl = "#" }) {
  // Check offer first (more specific), then provider
  if (offerId && linkCache.byOffer[offerId]) {
    return `/api/go?slug=${linkCache.byOffer[offerId].slug}`;
  }
  if (providerId && linkCache.byProvider[providerId]) {
    return `/api/go?slug=${linkCache.byProvider[providerId].slug}`;
  }
  return fallbackUrl;
}

/**
 * React hook to load affiliate links and provide a resolver function.
 * Call this once in a parent component; the cache persists across renders.
 *
 * @returns {{ affiliateReady: boolean, getAffiliateUrl: Function }}
 */
export function useAffiliateLinks() {
  const [ready, setReady] = useState(linkCache.allLoaded);

  useEffect(() => {
    if (!linkCache.allLoaded) {
      loadAllLinks().then(() => setReady(true));
    }
  }, []);

  return {
    affiliateReady: ready,
    getAffiliateUrl,
    // Which offers and providers carry a commercial relationship.
    //
    // Both are exposed because links are registered against providers in
    // practice, not offers: resolving by offer id alone silently matched
    // nothing and sent every click to the plan's public page instead of
    // through /api/go, losing the referral.
    affiliateOfferIds: new Set(Object.keys(linkCache.byOffer)),
    affiliateProviderIds: new Set(Object.keys(linkCache.byProvider)),
  };
}

/**
 * Invalidate the cache (e.g., after admin creates/edits a link).
 */
export function invalidateAffiliateCache() {
  linkCache.byProvider = {};
  linkCache.byOffer = {};
  linkCache.allLoaded = false;
  linkCache.allLinks = [];
}
