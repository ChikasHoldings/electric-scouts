/**
 * Sitemap helpers used by the in-app /sitemap-xml preview page.
 *
 * The authoritative sitemap is generated server-side by api/sitemap.js and
 * served at /sitemap.xml. This module renders a preview of the same URL set by
 * delegating to the shared registry in src/seo/, rather than keeping its own
 * hand-maintained list — the previous list had drifted badly enough to publish
 * /article/:slug URLs, a route that does not exist.
 */

import { absoluteUrl, SITE_URL } from '@/seo/site';
import { getIndexableRoutes } from '@/seo/routes';

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build the sitemap XML for the public route set.
 * @param {Array} articles Optional database-backed articles addressed by slug.
 */
export async function generateDynamicSitemap(articles = []) {
  const today = new Date().toISOString().split('T')[0];

  const entries = getIndexableRoutes().map((route) => ({
    loc: absoluteUrl(route.path),
    lastmod: today,
    changefreq: route.changefreq || 'weekly',
    priority: (route.priority ?? 0.7).toFixed(1),
  }));

  for (const article of articles) {
    const data = article.data || article;
    const identifier = data.slug || article.slug || article.id;
    if (!identifier) continue;
    entries.push({
      loc: absoluteUrl(`/learn/${identifier}`),
      lastmod: (article.updated_date || article.created_date || today).split('T')[0],
      changefreq: 'weekly',
      priority: '0.7',
    });
  }

  const seen = new Set();
  const unique = entries.filter((entry) => {
    if (seen.has(entry.loc)) return false;
    seen.add(entry.loc);
    return true;
  });

  const urls = unique
    .map(
      (entry) => `
  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
}

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
