/**
 * Search-engine notification helpers.
 *
 * There is exactly one sitemap: scripts/prerender-seo.mjs writes dist/sitemap.xml
 * from the route registry at build time, and that static file is what gets
 * served and submitted. This module used to also build a second copy in the
 * browser for the /sitemap-xml page; that copy read the registry without the
 * provider and article lists, so it published a fraction of the real URL set —
 * two sitemaps that disagreed about what the site contains. The page now reads
 * the published file directly and the generator is gone.
 */

import { SITE_URL } from '@/seo/site';

/**
 * Sitemap "ping" endpoints.
 *
 * Google retired https://google.com/ping?sitemap= in 2023 and Bing retired its
 * equivalent; both now return an error for every request. Discovery happens via
 * robots.txt and Search Console instead. These remain as no-ops so existing
 * call sites keep working without firing requests that can only fail.
 */
const PING_RETIRED = {
  success: false,
  message: 'Sitemap ping endpoints were retired; search engines discover the sitemap via robots.txt.',
};

export async function pingGoogleSearchConsole() {
  return PING_RETIRED;
}

export async function pingBingWebmaster() {
  return PING_RETIRED;
}

export async function pingAllSearchEngines() {
  return { google: PING_RETIRED, bing: PING_RETIRED };
}

export async function notifySearchEnginesOfUpdate() {
  return pingAllSearchEngines();
}

export { SITE_URL };
