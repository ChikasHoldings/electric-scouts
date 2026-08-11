import { createClient } from '@supabase/supabase-js';
import { SITE_URL, absoluteUrl } from '../src/seo/site.js';
import { getIndexableRoutes } from '../src/seo/routes.js';

/**
 * GET /sitemap.xml  (rewritten to /api/sitemap by vercel.json)
 *
 * Emits every canonical, indexable public URL. The URL list comes from the
 * shared registry in src/seo/, the same one that drives build-time
 * prerendering — so every URL in here resolves to a real page that returns 200
 * and self-canonicalizes, instead of a hand-maintained list that drifts.
 *
 * Database-backed routes (providers, articles) are layered on top at request
 * time so content published after the last deploy still shows up.
 *
 * Deliberately NOT set here: X-Robots-Tag. The previous version sent
 * `X-Robots-Tag: noindex` on this response, which tells Google not to use the
 * file it just fetched.
 */

const CACHE_SECONDS = 3600;

function createSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}

/**
 * Providers that ProviderDetails will actually render. That page resolves its
 * slug against active providers only, so listing an inactive provider would put
 * a "Provider Not Found" page in the sitemap.
 */
async function fetchActiveProviders(supabase) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('electricity_providers')
      .select('name, updated_at')
      .eq('is_active', true);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch {
    // A sitemap missing provider URLs beats a 500 that costs us the whole file.
    return [];
  }
}

/**
 * Published articles stored in the database. The column is `published`; the
 * previous implementation filtered on `is_published`, which does not exist, so
 * this query always threw and was silently swallowed.
 */
async function fetchPublishedArticles(supabase) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('id, slug, updated_date, created_date')
      .eq('published', true);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toDateOnly(value, fallback) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toISOString().split('T')[0];
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

/** Registry routes + database rows, deduplicated, as sitemap entries. */
export function buildSitemapEntries({ providers = [], articles = [], today }) {
  const lastmodDefault = today || new Date().toISOString().split('T')[0];

  const entries = getIndexableRoutes({ providers }).map((route) => ({
    loc: absoluteUrl(route.path),
    lastmod: route.lastmod || lastmodDefault,
    changefreq: route.changefreq || 'weekly',
    priority: (route.priority ?? 0.7).toFixed(1),
  }));

  // Database articles addressed by slug are additional URLs, not replacements:
  // /learn/:id keeps working and stays canonical for the bundled articles.
  for (const article of articles) {
    const identifier = article.slug || article.id;
    if (!identifier) continue;
    entries.push({
      loc: absoluteUrl(`/learn/${identifier}`),
      lastmod: toDateOnly(article.updated_date || article.created_date, lastmodDefault),
      changefreq: 'weekly',
      priority: '0.7',
    });
  }

  const seen = new Set();
  return entries.filter((entry) => {
    if (seen.has(entry.loc)) return false;
    seen.add(entry.loc);
    return true;
  });
}

export default async function handler(req, res) {
  try {
    const supabase = createSupabaseClient();
    const [providers, articles] = await Promise.all([
      fetchActiveProviders(supabase),
      fetchPublishedArticles(supabase),
    ]);

    const xml = buildSitemapXml(buildSitemapEntries({ providers, articles }));

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`);
    return res.status(200).send(xml);
  } catch (error) {
    // Never serve a partial or malformed sitemap: a 500 tells Search Console to
    // retry, whereas broken XML gets recorded as a parse failure.
    console.error('sitemap generation failed', error);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(500).send('Sitemap temporarily unavailable');
  }
}

export { SITE_URL };
