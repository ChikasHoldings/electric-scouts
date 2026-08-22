/**
 * sitemap.js
 *
 * Builds sitemap.xml from the route registry.
 *
 * This used to be a serverless function that queried Supabase on every request,
 * which meant the sitemap and the pages the build had actually produced were
 * assembled from two different reads of the database. When they disagreed —
 * which they did — the sitemap advertised URLs that resolved to an empty app
 * shell. Both now come from the same registry and the same market snapshot, and
 * scripts/prerender-seo.mjs writes the file at build time, so the sitemap can
 * only ever contain URLs that were prerendered in the same build.
 *
 * It also no longer emits /learn/:slug URLs for database articles. The article
 * route resolves by numeric id; a slug URL rendered "Article Not Found" behind
 * a 200, which is exactly the soft 404 this rebuild is removing.
 */

import { absoluteUrl } from './site.js';
import { getIndexableRoutes } from './routes.js';
import { MARKET_GENERATED_AT } from './market.js';

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sitemap entries for every indexable route, in registry order.
 *
 * @param {{providers?: any[], fullArticles?: Record<string, any>, today?: string}} [options]
 */
export function buildSitemapEntries({ providers = [], fullArticles, today } = {}) {
  /**
   * `lastmod` must be the date the PAGE last changed, not the date we built it.
   *
   * It used to default to `new Date()`, so every deploy told Google that all
   * 300-odd generated URLs had been rewritten that morning. Google's stated
   * behaviour with lastmod values it finds inaccurate is to stop trusting them,
   * and a site asking for 335 URLs to be crawled cannot afford to throw away
   * the one signal that says which of them are worth re-fetching. It also made
   * the sitemap differ on every rebuild for no reason.
   *
   * These pages are generated from the market snapshot, so the date that
   * snapshot was taken IS the date their content last changed. Routes with a
   * truer date of their own — articles carry their last edit, providers their
   * record's updatedAt — override it below.
   *
   * `today` stays overridable for tests; it is no longer a clock read.
   */
  const lastmodDefault = today || MARKET_GENERATED_AT;

  const entries = getIndexableRoutes({ providers, fullArticles }).map((route) => ({
    loc: absoluteUrl(route.path),
    lastmod: route.lastmod || lastmodDefault,
    changefreq: route.changefreq || 'weekly',
    priority: (route.priority ?? 0.7).toFixed(1),
  }));

  const seen = new Set();
  return entries.filter((entry) => {
    if (seen.has(entry.loc)) return false;
    seen.add(entry.loc);
    return true;
  });
}

export function buildSitemapXml(entries) {
  const urls = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function generateSitemap(options = {}) {
  return buildSitemapXml(buildSitemapEntries(options));
}
