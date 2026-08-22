#!/usr/bin/env node
/**
 * verify-live-routes.mjs — prove a DEPLOYED site serves the right HTML.
 *
 * scripts/assert-prerender-output.mjs proves dist/ is correct. That is not the
 * same claim: between a correct dist/ and a correct response sit the output
 * directory the project is configured with, the rewrites, the redirects, the
 * CDN cache and whether the deployment being served is the one that was just
 * built. Every one of those has its own way of turning a good build into
 * /compare-rates answering with the homepage, and none of them is visible from
 * inside the repository.
 *
 * So this fetches the URLs and reads what actually came back.
 *
 *   node scripts/verify-live-routes.mjs https://deployment.example.com
 *   node scripts/verify-live-routes.mjs https://… --mode production
 *   ELECTRICSCOUTS_BASE_URL=https://… npm run verify:live
 *   ELECTRICSCOUTS_VERIFY_MODE=preview npm run verify:live -- https://…
 *
 * Node built-ins only (global fetch), so it runs in CI with no install beyond
 * the repository's own dependencies.
 *
 * Exits nonzero on any failure, and prints a table either way.
 *
 * The policy decisions are exported as pure functions and imported by
 * tests/verify-live-routes.test.mjs, so `main()` runs only when this file is
 * the process entrypoint — importing it must never make a network request.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { absoluteUrl, canonicalPath, SITE_URL } from '../src/seo/site.js';

/** The routes whose regression costs money, in the order they are reported. */
const CONTENT_ROUTES = ['/', '/compare-rates', '/bill-analyzer'];

/* ------------------------------------------------------------------ *
 * Verification mode
 *
 * A preview deployment and the production site are held to different
 * standards on exactly one point, and it is worth being precise about which.
 *
 * Vercel stamps `X-Robots-Tag: noindex` on deployment-specific URLs itself, so
 * that a preview cannot be indexed. That is the hosting platform protecting the
 * site, and failing a preview for it would mean the verifier could never be run
 * against the thing it is most useful against — a deploy that has not shipped
 * yet.
 *
 * A `noindex` in the page's own HTML is a different object entirely. It is
 * built by the application, it travels with the build, and if it is present on
 * a preview it will be present on production. So it fails everywhere.
 *
 * Nothing else relaxes: a preview must still publish production canonicals,
 * route-specific content, a real 404 and a correct sitemap.
 * ------------------------------------------------------------------ */

export const VERIFICATION_MODES = Object.freeze(['auto', 'preview', 'production']);

/** The one hostname that is the real site. Compared exactly, never by suffix. */
export function canonicalHostname(canonicalSiteUrl = SITE_URL) {
  return new URL(canonicalSiteUrl).hostname.toLowerCase();
}

/**
 * Decide whether a base URL is being verified as production or as a preview.
 *
 * `auto` resolves to production ONLY on an exact hostname match with the
 * canonical site. Substring or suffix matching would be a security-shaped bug
 * rather than a convenience: `fake-www.electricscouts.com` and
 * `www.electricscouts.com.example.org` both contain the canonical host and
 * neither is it, and treating either as production would apply production's
 * stricter rules to a host we do not control — or, worse, let a misconfigured
 * host present itself as verified production.
 *
 * Branch names, paths, deployment names and strings containing "prod" are
 * deliberately not consulted. A deployment is production because it is served
 * on the production hostname, not because of what it is called.
 *
 * @returns {'preview'|'production'}
 */
export function resolveVerificationMode({ baseUrl, requestedMode = 'auto', canonicalSiteUrl = SITE_URL } = {}) {
  const mode = String(requestedMode || 'auto').trim().toLowerCase();
  if (!VERIFICATION_MODES.includes(mode)) {
    throw new Error(
      `invalid verification mode "${requestedMode}" — expected one of ${VERIFICATION_MODES.join(', ')}`
    );
  }

  // An explicit choice is the operator saying they know what this deployment
  // is, and it wins over inference in both directions.
  if (mode !== 'auto') return mode;

  let hostname;
  try {
    hostname = new URL(baseUrl).hostname.toLowerCase();
  } catch {
    throw new Error(`cannot resolve verification mode: "${baseUrl}" is not a URL`);
  }

  return hostname === canonicalHostname(canonicalSiteUrl) ? 'production' : 'preview';
}

/** Does a robots directive list `noindex` among its comma-separated tokens? */
function declaresNoindex(value) {
  return String(value || '')
    .toLowerCase()
    .split(',')
    .some((token) => token.trim() === 'noindex');
}

/**
 * Apply the robots policy for one content route.
 *
 * `responseRobotsHeader` may carry several directives, either comma-joined in
 * one header or joined by fetch when the response repeats the header. Both
 * arrive here as one string and are read token by token, so "nofollow, noindex"
 * is caught as surely as "noindex".
 *
 * @returns {{failures: string[], httpRobots: string, allowedByMode: boolean}}
 */
export function evaluateRobotsPolicy({ mode, htmlRobots = '', responseRobotsHeader = '' } = {}) {
  if (!VERIFICATION_MODES.includes(mode) || mode === 'auto') {
    throw new Error(`evaluateRobotsPolicy needs a resolved mode, got "${mode}"`);
  }

  const failures = [];
  const httpNoindex = declaresNoindex(responseRobotsHeader);

  // Page-level noindex is built into the application and would reach the real
  // production domain unchanged, so it is never acceptable — not even on a
  // preview, where "it is only a preview" is exactly the reasoning that ships
  // it to production.
  if (declaresNoindex(htmlRobots)) {
    failures.push(`page HTML declares robots "${htmlRobots}" — a built-in noindex reaches production`);
  }

  if (httpNoindex && mode === 'production') {
    failures.push(
      `served with X-Robots-Tag "${responseRobotsHeader}" — the production domain must not carry a hosting-level noindex`
    );
  }

  return {
    failures,
    httpRobots: httpNoindex ? 'noindex' : (String(responseRobotsHeader || '').trim() || 'none'),
    allowedByMode: httpNoindex && mode === 'preview',
  };
}

/**
 * Read the base URL and mode out of argv and the environment.
 *
 * Pure and exported so the precedence rules are tested rather than assumed:
 * a positional URL beats the environment variable, and `--mode` beats
 * ELECTRICSCOUTS_VERIFY_MODE.
 */
export function parseCliArgs(argv = [], env = {}) {
  const positional = [];
  let requestedMode = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--mode') {
      requestedMode = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--mode=')) {
      requestedMode = arg.slice('--mode='.length);
    } else {
      positional.push(arg);
    }
  }

  return {
    baseUrl: positional[0] || env.ELECTRICSCOUTS_BASE_URL || '',
    requestedMode: requestedMode || env.ELECTRICSCOUTS_VERIFY_MODE || 'auto',
  };
}

/**
 * A path that must never resolve.
 *
 * The failure it guards against is a soft 404: a catch-all that answers every
 * unknown URL with the homepage and HTTP 200. That tells a crawler the site has
 * infinite valid pages, all duplicates of each other.
 */
const UNKNOWN_ROUTE = '/definitely-not-a-real-electric-scouts-page';

const TIMEOUT_MS = 20000;

/* ------------------------------------------------------------------ *
 * HTML reading — same rules as the build-time assertion
 * ------------------------------------------------------------------ */

const ENTITIES = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
  '&apos;': "'", '&nbsp;': ' ', '&middot;': '·', '&copy;': '©', '&rsaquo;': '›',
};

function decodeEntities(value) {
  return String(value).replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp|middot|copy|rsaquo);/g, (m) => ENTITIES[m] ?? m);
}

function normalizeText(html) {
  return decodeEntities(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function firstMatch(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1] : null;
}

function countMatches(html, pattern) {
  return (html.match(pattern) || []).length;
}

function readPage(html) {
  const mainText = normalizeText(firstMatch(html, /<main[^>]*>([\s\S]*?)<\/main>/i) || '');
  return {
    title: decodeEntities(firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i) || '').trim(),
    canonicalCount: countMatches(html, /<link[^>]+rel=["']canonical["'][^>]*>/gi),
    canonical: firstMatch(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i),
    description: decodeEntities(
      firstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || ''
    ).trim(),
    robots: (firstMatch(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i) || '').trim(),
    h1: normalizeText(firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) || ''),
    marker: firstMatch(html, /data-prerender-route=["']([^"']*)["']/i),
    scripts: [...html.matchAll(/<script[^>]+src=["'](\/assets\/[^"']+)["']/gi)].map((m) => m[1]),
    mainText,
  };
}

/* ------------------------------------------------------------------ *
 * Fetching
 * ------------------------------------------------------------------ */

async function get(baseUrl, routePath) {
  const url = new URL(routePath, baseUrl).toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'electricscouts-verify-live-routes' },
    });
    return {
      url,
      finalUrl: response.url || url,
      status: response.status,
      contentType: response.headers.get('content-type') || '',
      robotsHeader: response.headers.get('x-robots-tag') || '',
      body: await response.text(),
    };
  } catch (error) {
    return { url, error: error.name === 'AbortError' ? `timed out after ${TIMEOUT_MS}ms` : error.message };
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ *
 * Checks
 * ------------------------------------------------------------------ */

class Report {
  constructor() {
    this.rows = [];
    this.failures = [];
  }

  fail(scope, message) {
    this.failures.push(`${scope}: ${message}`);
  }
}

/**
 * One indexable content route.
 *
 * `expectedCanonical` is built from src/seo/site.js rather than from the host
 * being tested: a preview deployment must still publish the PRODUCTION
 * canonical, because a preview-hostname canonical shipped to production is how
 * a site tells Google its real pages live on a temporary URL.
 */
function checkContentRoute(routePath, response, report, mode) {
  const scope = routePath;
  const row = {
    route: routePath,
    status: response.status ?? '—',
    title: 'no',
    canonical: 'no',
    h1: 'no',
    unique: '—',
    httpRobots: '—',
    result: 'FAIL',
  };

  if (response.error) {
    report.fail(scope, `request failed (${response.error})`);
    return { row, page: null };
  }

  if (response.status !== 200) report.fail(scope, `expected HTTP 200, got ${response.status}`);
  if (!/text\/html/i.test(response.contentType)) {
    report.fail(scope, `expected an HTML content type, got "${response.contentType}"`);
  }

  const page = readPage(response.body);
  const expectedCanonical = absoluteUrl(routePath);

  if (page.title) row.title = 'yes';
  else report.fail(scope, 'empty <title>');

  if (!page.description) report.fail(scope, 'empty meta description');

  if (page.canonicalCount !== 1) {
    report.fail(scope, `expected exactly one canonical, found ${page.canonicalCount}`);
  } else if (page.canonical !== expectedCanonical) {
    report.fail(scope, `canonical is ${page.canonical} but should be ${expectedCanonical}`);
  } else {
    row.canonical = 'yes';
  }

  if (page.h1) row.h1 = 'yes';
  else report.fail(scope, 'no <h1>');

  // Page-level and hosting-level robots are two different objects with two
  // different rules; see evaluateRobotsPolicy.
  const robots = evaluateRobotsPolicy({
    mode,
    htmlRobots: page.robots,
    responseRobotsHeader: response.robotsHeader,
  });
  row.httpRobots = robots.allowedByMode ? 'noindex*' : robots.httpRobots;
  for (const failure of robots.failures) report.fail(scope, failure);

  if (page.scripts.length === 0) report.fail(scope, 'no built application script reference');

  if (page.marker !== canonicalPath(routePath)) {
    report.fail(scope, `prerender marker is ${JSON.stringify(page.marker)} but should be ${JSON.stringify(canonicalPath(routePath))} — this route is not serving its own prerendered file`);
  }
  if (page.mainText.length < 200) {
    report.fail(scope, `main content is only ${page.mainText.length} characters — the app shell, not a prerendered page`);
  }

  return { row, page };
}

/** The three content routes must differ from one another on every axis. */
function checkDistinctness(pages, rows, report) {
  const scope = 'uniqueness';
  const named = CONTENT_ROUTES.filter((p) => pages.get(p));
  const home = pages.get('/');

  const duplicate = (field, label) => {
    const seen = new Map();
    for (const routePath of named) {
      const value = pages.get(routePath)[field];
      if (!value) continue;
      const previous = seen.get(value);
      if (previous) {
        report.fail(scope, `${routePath} and ${previous} share a ${label}`);
        for (const row of rows) if (row.route === routePath || row.route === previous) row.unique = 'NO';
      } else {
        seen.set(value, routePath);
      }
    }
  };

  duplicate('title', 'title');
  duplicate('canonical', 'canonical');
  duplicate('h1', 'H1');
  duplicate('mainText', 'main-content fingerprint');

  // Stated separately from the generic duplicate check so the message names the
  // actual failure rather than reporting it as an incidental collision.
  if (home) {
    for (const routePath of named) {
      if (routePath === '/') continue;
      const page = pages.get(routePath);
      if (page.mainText === home.mainText) {
        report.fail(scope, `${routePath} serves the homepage's content`);
      }
      if (page.canonical === home.canonical) {
        report.fail(scope, `${routePath} serves the homepage canonical`);
      }
    }
  }

  for (const row of rows) {
    if (row.unique === '—') row.unique = 'yes';
  }
}

/** An unknown path must not answer 200 with the homepage. */
function checkUnknownRoute(response, homePage, report) {
  const scope = UNKNOWN_ROUTE;
  const row = { route: 'unknown path', status: response.status ?? '—', title: '—', canonical: '—', h1: '—', unique: '—', httpRobots: '—', result: 'FAIL' };

  if (response.error) {
    report.fail(scope, `request failed (${response.error})`);
    return row;
  }

  if (response.status === 200) {
    report.fail(scope, 'an unknown path returned HTTP 200 — a soft 404 tells crawlers every URL on the site is valid');
  } else if (response.status !== 404) {
    report.fail(scope, `expected HTTP 404, got ${response.status}`);
  }

  const page = readPage(response.body || '');
  if (homePage && page.mainText && page.mainText === homePage.mainText) {
    report.fail(scope, 'an unknown path served the homepage');
  }
  const indexable = page.robots && !/noindex/i.test(page.robots);
  if (indexable && !/noindex/i.test(response.robotsHeader)) {
    report.fail(scope, `the 404 page is indexable (robots "${page.robots}")`);
  }

  return row;
}

async function checkSitemap(response, report) {
  const scope = '/sitemap.xml';
  const row = { route: '/sitemap.xml', status: response.status ?? '—', title: '—', canonical: '—', h1: '—', unique: '—', httpRobots: '—', result: 'FAIL' };

  if (response.error) {
    report.fail(scope, `request failed (${response.error})`);
    return row;
  }
  if (response.status !== 200) report.fail(scope, `expected HTTP 200, got ${response.status}`);

  const body = response.body || '';
  const looksLikeXml = /^\s*<\?xml/.test(body) || /<urlset[\s>]/.test(body);
  if (!/xml/i.test(response.contentType) && !looksLikeXml) {
    report.fail(scope, `not XML (content-type "${response.contentType}")`);
  }

  for (const routePath of ['/compare-rates', '/bill-analyzer']) {
    if (!body.includes(absoluteUrl(routePath))) {
      report.fail(scope, `does not list ${absoluteUrl(routePath)}`);
    }
  }
  // Routes that are deliberately not indexed must not be advertised.
  for (const routePath of ['/not-found', '/sitemap', '/robots', '/landing']) {
    if (body.includes(`<loc>${absoluteUrl(routePath)}</loc>`)) {
      report.fail(scope, `lists ${routePath}, which is not indexable`);
    }
  }

  return row;
}

async function checkRobots(response, report) {
  const scope = '/robots.txt';
  const row = { route: '/robots.txt', status: response.status ?? '—', title: '—', canonical: '—', h1: '—', unique: '—', httpRobots: '—', result: 'FAIL' };

  if (response.error) {
    report.fail(scope, `request failed (${response.error})`);
    return row;
  }
  if (response.status !== 200) report.fail(scope, `expected HTTP 200, got ${response.status}`);
  if (!/text\//i.test(response.contentType)) {
    report.fail(scope, `expected a text content type, got "${response.contentType}"`);
  }

  const body = response.body || '';
  if (!/user-agent:/i.test(body)) report.fail(scope, 'has no User-agent group');

  // Only the wildcard group is inspected: a rule in a named AI-crawler group is
  // meant to be a blanket Disallow and is not a search-indexing problem.
  const wildcard = body.split(/^user-agent:/im)[1] || '';
  const wildcardRules = wildcard.split(/\n(?=user-agent:)/i)[0] || '';
  for (const routePath of CONTENT_ROUTES) {
    const blocked = wildcardRules
      .split('\n')
      .map((line) => line.match(/^\s*disallow:\s*(\S+)\s*$/i))
      .filter(Boolean)
      .map((m) => m[1])
      .some((rule) => rule === '/' || (routePath !== '/' && routePath.startsWith(rule)));
    if (blocked) report.fail(scope, `blocks ${routePath} for all crawlers`);
  }

  return row;
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

/** The base URL and the resolved mode, or a usage error and exit 1. */
function resolveTarget() {
  const { baseUrl: raw, requestedMode } = parseCliArgs(process.argv.slice(2), process.env);

  if (!raw) {
    console.error('[verify:live] FAILED: no base URL.');
    console.error('  node scripts/verify-live-routes.mjs https://deployment.example.com [--mode auto|preview|production]');
    console.error('  ELECTRICSCOUTS_BASE_URL=https://… npm run verify:live');
    process.exit(1);
  }

  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let baseUrl;
  try {
    baseUrl = new URL(withScheme).origin;
  } catch {
    console.error(`[verify:live] FAILED: "${raw}" is not a URL`);
    process.exit(1);
  }

  try {
    return { baseUrl, mode: resolveVerificationMode({ baseUrl, requestedMode }) };
  } catch (error) {
    console.error(`[verify:live] FAILED: ${error.message}`);
    process.exit(1);
  }
}

function printTable(rows) {
  const columns = [
    ['ROUTE', 'route', Math.max(14, ...rows.map((r) => String(r.route).length))],
    ['STATUS', 'status', 6],
    ['TITLE', 'title', 5],
    ['CANONICAL', 'canonical', 9],
    ['H1', 'h1', 3],
    ['UNIQUE', 'unique', 6],
    // Only the robots directive is reported. No other response header is
    // printed: a verification log is not a place to leak cookies or auth.
    ['HTTP-ROBOTS', 'httpRobots', 11],
    ['RESULT', 'result', 6],
  ];

  console.log(columns.map(([label, , width]) => label.padEnd(width)).join('  '));
  for (const row of rows) {
    console.log(columns.map(([, key, width]) => String(row[key]).padEnd(width)).join('  '));
  }
}

async function main() {
  const { baseUrl, mode } = resolveTarget();
  console.log(`[verify:live] base URL: ${baseUrl}`);
  console.log(`[verify:live] mode: ${mode}`);
  console.log(`[verify:live] expected canonical host: ${absoluteUrl('/')}`);
  if (mode === 'preview') {
    console.log('[verify:live] a hosting-level X-Robots-Tag: noindex is expected here and is marked noindex*');
  }

  const report = new Report();

  const responses = await Promise.all(
    [...CONTENT_ROUTES, '/sitemap.xml', '/robots.txt', UNKNOWN_ROUTE].map((p) => get(baseUrl, p))
  );
  const byPath = new Map();
  [...CONTENT_ROUTES, '/sitemap.xml', '/robots.txt', UNKNOWN_ROUTE].forEach((p, i) => byPath.set(p, responses[i]));

  const pages = new Map();
  const rows = [];
  for (const routePath of CONTENT_ROUTES) {
    const { row, page } = checkContentRoute(routePath, byPath.get(routePath), report, mode);
    rows.push(row);
    if (page) pages.set(routePath, page);
  }

  checkDistinctness(pages, rows, report);
  rows.push(await checkSitemap(byPath.get('/sitemap.xml'), report));
  rows.push(await checkRobots(byPath.get('/robots.txt'), report));
  rows.push(checkUnknownRoute(byPath.get(UNKNOWN_ROUTE), pages.get('/'), report));

  // A row passes when nothing was reported against it. A uniqueness failure
  // names two routes, so it is attributed to both rather than to a scope no
  // row carries.
  const failedScopes = new Set(report.failures.map((failure) => failure.slice(0, failure.indexOf(':'))));
  const scopeFor = { 'unknown path': UNKNOWN_ROUTE };
  for (const row of rows) {
    const scope = scopeFor[row.route] || row.route;
    row.result = failedScopes.has(scope) || row.unique === 'NO' ? 'FAIL' : 'PASS';
  }

  console.log('');
  printTable(rows);

  if (report.failures.length) {
    console.error(`\n[verify:live] FAILED with ${report.failures.length} problem(s):`);
    for (const failure of report.failures) console.error(`  - ${failure}`);
    process.exit(1);
  }

  console.log('\n[verify:live] OK — every checked route serves its own page');
}

/**
 * True when this file is the process entrypoint rather than an import.
 *
 * Without this, importing the module to test its policy would fire six HTTP
 * requests and call process.exit — which is how a test suite ends up depending
 * on the network, and how `main()` becomes untestable in practice.
 *
 * argv[1] is compared as a resolved path so a relative invocation
 * (`node scripts/verify-live-routes.mjs`) matches, and its absence — a REPL, an
 * embedder — reads as "not the entrypoint" rather than throwing.
 */
export function isMainModule(moduleUrl = import.meta.url, argv1 = process.argv[1]) {
  if (!argv1) return false;
  try {
    return fileURLToPath(moduleUrl) === path.resolve(argv1);
  } catch {
    return false;
  }
}

if (isMainModule()) {
  main().catch((error) => {
    console.error(`[verify:live] FAILED: ${error.stack || error.message}`);
    process.exit(1);
  });
}
