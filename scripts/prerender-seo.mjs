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
 *   dist/sitemap.xml              every indexable URL, same registry as above
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE_NAME, SITE_URL } from '../src/seo/site.js';
import { getAllRoutes, getStateRoutes, getCityRoutes, getArticleRouteList } from '../src/seo/routes.js';
import { getCities, getStates } from '../src/seo/locations.js';
import { generateRobotsTxt } from '../src/seo/robots.js';
import { generateSitemap } from '../src/seo/sitemap.js';
import { buildPageContent, renderBody, renderHead, escapeHtml } from '../src/seo/render.js';
import { loadSeoData } from '../src/seo/data.mjs';
import { MARKET_GENERATED_AT } from '../src/seo/market.js';
import { outputPathFor } from './prerender-paths.mjs';

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

/* ------------------------------------------------------------------ *
 * Extra artefacts
 * ------------------------------------------------------------------ */

/**
 * Neutral shell, used for the /admin rewrite and served at its own URL.
 *
 * It carries `noindex` because both of those are things we never want indexed,
 * and the file was reachable at https://…/app-shell.html returning 200 with an
 * empty #root, no robots directive and no canonical — an app shell at a public
 * URL, which is the shape this whole prerender exists to remove. Nothing linked
 * to it, but Google does not need a link: it finds URLs from Chrome telemetry,
 * from external references, and from the /admin rewrite pointing at it.
 *
 * `follow` rather than `nofollow` so the shell never strands link equity, and
 * still no canonical: a canonical guessed here would be wrong for every URL the
 * shell is rewritten to. SEOHead overwrites the robots meta from the real route
 * once the app mounts (it setAttributes the existing tag rather than appending
 * a second one), so this is the value for the raw fetch only.
 *
 * There is deliberately no catch-all rewrite onto this file — unknown URLs 404
 * — so the only consumers are /admin* and the file's own URL, and noindex is
 * correct for both.
 */
function buildAppShell(template) {
  return stripManagedTags(template).replace(
    '</head>',
    `    <title>${escapeHtml(SITE_NAME)}</title>\n` +
      `    <meta name="robots" content="noindex, follow" />\n  </head>`
  );
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
  const content = buildPageContent(route, context);
  return buildPage(template, {
    headTags: renderHead(route, content),
    bodyHtml: renderBody(route, content, context),
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

  const seoData = await loadSeoData();
  const { fullArticles, providers } = seoData;

  const states = getStates();
  const citiesByState = {};
  for (const city of getCities()) {
    (citiesByState[city.stateCode] ||= []).push(city);
  }
  // Article routes are handed to the content builder so /learning-center can
  // link to every article — without that list the 73 article pages have no
  // inbound link anywhere on the site and stay orphaned.
  const articles = getArticleRouteList(fullArticles);
  // fullArticles carries the tags the topical article links are scored on;
  // `articles` above is the route list, which does not.
  const context = { states, citiesByState, articles, fullArticles };

  const routes = getAllRoutes(seoData);

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
    const content = buildPageContent(route, context);
    const html = buildPage(template, {
      headTags: renderHead(route, content),
      bodyHtml: renderBody(route, content, context),
    });
    const outputPath = outputPathFor(DIST, route.path);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, html, 'utf8');
    written += 1;
  }

  await fs.writeFile(path.join(DIST, '404.html'), build404Page(template, context), 'utf8');
  await fs.writeFile(path.join(DIST, 'app-shell.html'), buildAppShell(template), 'utf8');
  await fs.writeFile(path.join(DIST, 'robots.txt'), generateRobotsTxt(), 'utf8');
  // Written as a static file rather than served by a function: it is now fully
  // determined by the same registry that produced the pages above, so it cannot
  // drift from them, and Google never waits on a cold start to read it.
  await fs.writeFile(path.join(DIST, 'sitemap.xml'), generateSitemap(seoData), 'utf8');

  const counts = routes.reduce((acc, route) => {
    acc[route.type] = (acc[route.type] || 0) + 1;
    return acc;
  }, {});

  console.log(`[prerender] canonical host: ${SITE_URL}`);
  console.log(`[prerender] market snapshot: ${MARKET_GENERATED_AT}`);
  console.log(`[prerender] wrote ${written} pages (${JSON.stringify(counts)})`);
  console.log('[prerender] wrote 404.html, app-shell.html, robots.txt, sitemap.xml');

  // Surfaced so a build with no provider pages is obvious in the deploy log.
  const stateCount = getStateRoutes().length;
  const cityCount = getCityRoutes().length;
  const articleCount = articles.length;
  console.log(
    `[prerender] states=${stateCount} cities=${cityCount} articles=${articleCount} providers=${providers.length}`
  );
}

main().catch((error) => {
  console.error(`[prerender] FAILED: ${error.message}`);
  process.exit(1);
});
