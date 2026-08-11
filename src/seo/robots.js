/**
 * robots.js
 *
 * Generates production robots.txt. Emitted to dist/robots.txt at build time by
 * scripts/prerender-seo.mjs so the Sitemap directive always uses the same
 * SITE_URL as canonical tags and sitemap.xml.
 *
 * Two mistakes this file exists to prevent, both of which were live:
 *
 *  1. `Disallow: /sitemap` — robots.txt paths are PREFIX matches, so that rule
 *     also blocked /sitemap.xml and Google could never read the sitemap.
 *     Likewise `Disallow: /robots` matched /robots.txt.
 *
 *  2. A `User-agent: Googlebot` group containing only `Allow: /`. A crawler
 *     obeys exactly one group — the most specific one that matches it — so
 *     Googlebot ignored the `User-agent: *` group entirely and was free to
 *     crawl /admin/ and /api/. Per-bot groups must therefore either repeat
 *     every rule or not exist. We keep a single `*` group.
 *
 * Only genuinely private or non-content paths are disallowed here. Pages that
 * merely should not be indexed (legacy duplicates, dashboards, error pages)
 * are served with `noindex` instead: a crawler must be able to fetch a page to
 * see its noindex, so blocking those in robots.txt would keep them indexed as
 * bare URLs rather than removing them.
 */

import { SITE_URL } from './site.js';

/** Paths no crawler should request: admin UI, API surface, affiliate redirects. */
export const DISALLOWED_PATHS = [
  '/admin',
  '/api/',
  '/go/',
];

/**
 * Crawlers blocked for AI training / scraping. This is a content-licensing
 * decision and has no effect on Google Search or Bing indexing — Google-Extended
 * governs Gemini training only, not Googlebot.
 */
export const BLOCKED_AI_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'CCBot',
  'anthropic-ai',
  'ClaudeBot',
  'Claude-Web',
  'Google-Extended',
  'Applebot-Extended',
  'Bytespider',
  'Amazonbot',
  'meta-externalagent',
  'PerplexityBot',
];

export function generateRobotsTxt({ siteUrl = SITE_URL } = {}) {
  const lines = [
    '# Electric Scouts — robots.txt',
    `# Canonical host: ${siteUrl}`,
    '',
    '# All crawlers: the whole public site is open. Do not add a per-bot group',
    '# below without repeating these Disallow rules in it — a bot obeys only the',
    '# single most specific group that matches its user agent.',
    'User-agent: *',
    'Allow: /',
    ...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
    '',
    '# AI training and scraping crawlers (does not affect search indexing)',
  ];

  for (const agent of BLOCKED_AI_AGENTS) {
    lines.push(`User-agent: ${agent}`, 'Disallow: /', '');
  }

  lines.push(`Sitemap: ${siteUrl}/sitemap.xml`, '');
  return lines.join('\n');
}
