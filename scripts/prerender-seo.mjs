#!/usr/bin/env node
/**
 * prerender-seo.mjs — runs after `vite build`.
 *
 * Electric Scouts is a client-rendered SPA: before this script existed, Vercel
 * served the exact same dist/index.html for every URL. That meant every page on
 * the site shipped the homepage's <title>, the homepage's description and
 * `<link rel="canonical" href="https://electricscouts.com/">` — i.e. every URL
 * told Google "I am a duplicate of the homepage", so nothing but the homepage
 * could be indexed.
 *
 * This script emits one static HTML file per public route, reusing the built
 * shell (so the hashed asset tags stay identical) but replacing the SEO tags
 * and filling #root with a readable summary of the page. React clears #root on
 * mount, so the app itself is untouched.
 *
 * Output:
 *   dist/index.html               prerendered homepage
 *   dist/<route>/index.html       one directory per route
 *   dist/404.html                 real 404 page (Vercel serves it with a 404)
 *   dist/app-shell.html           neutral shell for dynamic routes added after
 *                                 the build (no canonical, no robots meta — the
 *                                 client sets both)
 *   dist/robots.txt               generated from src/seo/robots.js
 */

import { createServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE_NAME, SITE_URL } from '../src/seo/site.js';
import { getAllRoutes, getStateRoutes, getCityRoutes } from '../src/seo/routes.js';
import { getCities, getStates } from '../src/seo/locations.js';
import { getArticleRouteList } from '../src/seo/routes.js';
import { generateRobotsTxt } from '../src/seo/robots.js';
import { renderBody, renderHead, escapeHtml } from '../src/seo/render.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

/* ------------------------------------------------------------------ *
 * Template surgery
 * ------------------------------------------------------------------ */

/**
 * Strip the SEO tags baked into index.html so they cannot survive alongside the
 * per-route ones. Everything else — analytics, favicons, preloads and the
 * hashed <script>/<link> tags Vite injected — is preserved verbatim.
 */
function stripManagedTags(html) {
  return html
    .replace(/\n?\s*<title>[\s\S]*?<\/title>/gi, '')
    .replace(/\n?\s*<meta\s+name=["'](?:title|description|keywords|author|robots)["'][^>]*>/gi, '')
    .replace(/\n?\s*<meta\s+property=["']og:[^"']*["'][^>]*>/gi, '')
    .replace(/\n?\s*<meta\s+name=["']twitter:[^"']*["'][^>]*>/gi, '')
    .replace(/\n?\s*<link\s+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/\n?\s*<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/gi, '')
    // The old noscript block duplicated the link list we now render into #root.
    .replace(/\n?\s*<noscript>[\s\S]*?<\/noscript>/gi, '');
}

function buildPage(template, { headTags, bodyHtml }) {
  let html = stripManagedTags(template);

  if (!html.includes('</head>')) throw new Error('built index.html has no </head>');
  html = html.replace('</head>', `${headTags}\n  </head>`);

  const rootPattern = /<div id="root">[\s\S]*?<\/div>/;
  if (!rootPattern.test(html)) throw new Error('built index.html has no <div id="root"> container');
  html = html.replace(rootPattern, `<div id="root">${bodyHtml}</div>`);

  return html;
}

/** dist/index.html for "/", dist/<path>/index.html for everything else. */
function outputPathFor(routePath) {
  if (routePath === '/') return path.join(DIST, 'index.html');
  return path.join(DIST, routePath.replace(/^\//, ''), 'index.html');
}

/* ------------------------------------------------------------------ *
 * Data loading
 * ------------------------------------------------------------------ */

/**
 * Article bodies live in a .jsx module, so they are loaded through Vite rather
 * than plain Node. A failure here is fatal on purpose: shipping 73 articles
 * with no title or description is the bug this script exists to prevent.
 */
async function loadArticleData() {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const module = await server.ssrLoadModule('/src/components/learning/fullArticles.jsx');
    const articles = module.fullArticles;
    if (!articles || !Object.keys(articles).length) {
      throw new Error('fullArticles resolved to an empty map');
    }
    return articles;
  } finally {
    await server.close();
  }
}

/**
 * Providers whose detail pages actually render. Missing credentials are not
 * fatal — the routes simply are not prerendered and fall back to the neutral
 * app shell, which still resolves client-side.
 */
async function loadActiveProviders() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn('[prerender] Supabase credentials unavailable — skipping provider pages');
    return [];
  }
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from('electricity_providers')
      .select('name, updated_at')
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn(`[prerender] could not load providers: ${error.message}`);
    return [];
  }
}

/* ------------------------------------------------------------------ *
 * Extra artefacts
 * ------------------------------------------------------------------ */

/** Neutral shell for dynamic routes created after this build. */
function buildAppShell(template) {
  const html = stripManagedTags(template).replace(
    '</head>',
    `    <title>${escapeHtml(SITE_NAME)}</title>\n  </head>`
  );
  // No canonical and no robots meta on purpose: SEOHead sets both from the real
  // route once the app mounts, and a wrong guess here is worse than none.
  return html;
}

function build404Page(template, context) {
  const route = {
    type: 'static',
    path: '/404',
    noindex: true,
    noCanonical: true,
    title: `Page Not Found | ${SITE_NAME}`,
    description: 'The page you are looking for does not exist. Browse electricity rates by state, city or provider instead.',
    heading: 'Page Not Found',
  };
  return buildPage(template, {
    headTags: renderHead(route),
    bodyHtml: renderBody(route, context),
  });
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

async function main() {
  const templatePath = path.join(DIST, 'index.html');
  const template = await fs.readFile(templatePath, 'utf8').catch(() => {
    throw new Error(`${templatePath} not found — run "vite build" first`);
  });

  // dist/index.html doubles as the template and as the prerendered homepage, so
  // running this script twice against one build would treat generated markup as
  // the template and mangle #root.
  if (template.includes('data-seo-prerender')) {
    throw new Error(`${templatePath} is already prerendered — run "vite build" before prerendering`);
  }

  const [fullArticles, providers] = await Promise.all([loadArticleData(), loadActiveProviders()]);

  const states = getStates();
  const citiesByState = {};
  for (const city of getCities()) {
    (citiesByState[city.stateCode] ||= []).push(city);
  }
  const context = { states, citiesByState };

  const routes = getAllRoutes({ providers, fullArticles });

  // Every route must have unique, non-empty metadata — the failure mode we are
  // fixing is hundreds of URLs sharing one title and one canonical.
  const problems = [];
  const seenTitles = new Map();
  for (const route of routes) {
    if (!route.title) problems.push(`${route.path}: missing title`);
    if (!route.description && !route.noindex) problems.push(`${route.path}: missing description`);
    if (!route.heading && !route.noindex) problems.push(`${route.path}: missing H1`);
    // Alias routes (route.canonical) are duplicates on purpose and are
    // consolidated by their canonical tag, so a shared title is expected there.
    if (route.title && !route.noindex && !route.canonical) {
      const previous = seenTitles.get(route.title);
      if (previous) problems.push(`${route.path}: duplicate title with ${previous}`);
      else seenTitles.set(route.title, route.path);
    }
  }
  if (problems.length) {
    throw new Error(`prerender metadata check failed:\n  ${problems.join('\n  ')}`);
  }

  let written = 0;
  for (const route of routes) {
    const html = buildPage(template, {
      headTags: renderHead(route),
      bodyHtml: renderBody(route, context),
    });
    const outputPath = outputPathFor(route.path);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, html, 'utf8');
    written += 1;
  }

  await fs.writeFile(path.join(DIST, '404.html'), build404Page(template, context), 'utf8');
  await fs.writeFile(path.join(DIST, 'app-shell.html'), buildAppShell(template), 'utf8');
  await fs.writeFile(path.join(DIST, 'robots.txt'), generateRobotsTxt(), 'utf8');

  const counts = routes.reduce((acc, route) => {
    acc[route.type] = (acc[route.type] || 0) + 1;
    return acc;
  }, {});

  console.log(`[prerender] canonical host: ${SITE_URL}`);
  console.log(`[prerender] wrote ${written} pages (${JSON.stringify(counts)})`);
  console.log('[prerender] wrote 404.html, app-shell.html, robots.txt');

  // Surfaced so a build with no provider pages is obvious in the deploy log.
  const stateCount = getStateRoutes().length;
  const cityCount = getCityRoutes().length;
  const articleCount = getArticleRouteList(fullArticles).length;
  console.log(
    `[prerender] states=${stateCount} cities=${cityCount} articles=${articleCount} providers=${providers.length}`
  );
}

main().catch((error) => {
  console.error(`[prerender] FAILED: ${error.message}`);
  process.exit(1);
});
