#!/usr/bin/env node
/**
 * seo-render-audit.mjs — crawl the built site the way Googlebot does, with a
 * browser, and report where the rendered DOM disagrees with the HTML we served.
 *
 * WHY THIS EXISTS SEPARATELY FROM seo-audit.mjs
 *
 * seo-audit.mjs reads the files in dist/. That is the right way to check what
 * the server sends, and it is blind to the failure that has now caused two
 * separate outages of this site's indexing.
 *
 * Google renders the page before it indexes it. This app mounts with
 * createRoot().render(), and main.jsx deletes the prerendered markup from #root
 * immediately before that, so whatever React puts back is what gets indexed.
 * Anywhere React disagrees with the prerender, every file-reading check passes
 * while the indexed page is something else entirely:
 *
 *   - Before #29, React rendered almost nothing on city, state and provider
 *     URLs. The served HTML was complete. Google saw close to an empty document
 *     and dropped the pages, and the audit reported zero findings throughout.
 *   - In #30, twelve new articles rendered "Article Not Found" because their
 *     ids were missing from a hand-maintained list in ArticleDetail. Correct
 *     served HTML, correct sitemap, green CI, twelve soft 404s.
 *
 * Both were found by opening a page in a browser, which is not a process. This
 * is that check, written down.
 *
 *   node scripts/seo-render-audit.mjs                every indexable URL
 *   node scripts/seo-render-audit.mjs --sample 40    a spread across page types
 *   node scripts/seo-render-audit.mjs --only /faq,/  named paths
 *   node scripts/seo-render-audit.mjs --strict       exit 1 on any P0/P1
 *   node scripts/seo-render-audit.mjs --json out     write the full dataset
 *
 * Playwright is not a dependency of this project — it is a diagnostic run
 * deliberately rather than part of `npm test`, and a browser in the install of
 * everyone who only wants to build the site is not a trade worth making. If it
 * is missing this says so and how to get it, rather than failing obscurely.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createResolver, parseHtml } from '../src/seo/audit.mjs';
import { getIndexableRoutes } from '../src/seo/routes.js';
import { loadSeoData } from '../src/seo/data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

/* Thresholds. A rendered page is allowed to differ from its served HTML — the
 * app adds its own hero and widgets — but not to lose most of it. */
const SOFT_404_RATIO = 0.4;   // rendered main words below this share of served
const THIN_RENDERED = 180;    // rendered <main> words below this is thin
const NOT_FOUND = /\b(not found|page (?:does not|doesn't) exist|404)\b/i;

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const SAMPLE = Number(flag('--sample')) || 0;
const ONLY = (flag('--only') || '').split(',').map((s) => s.trim()).filter(Boolean);
const JSON_OUT = flag('--json');

const findings = [];
const flagIt = (severity, code, url, detail) => findings.push({ severity, code, url, detail });

/* ------------------------------------------------------------------ *
 * Browser
 * ------------------------------------------------------------------ */

/**
 * Resolve playwright from the project, then from the global npm root next to
 * the running node. Sandboxes and CI images frequently install it globally, and
 * failing there would send someone off to install a browser they already have.
 */
async function loadPlaywright() {
  const candidates = [
    'playwright',
    path.join(path.dirname(path.dirname(process.execPath)), 'lib', 'node_modules', 'playwright', 'index.js'),
    '/usr/lib/node_modules/playwright/index.js',
    '/usr/local/lib/node_modules/playwright/index.js',
  ];
  for (const candidate of candidates) {
    try {
      const mod = candidate.startsWith('/')
        ? fs.existsSync(candidate) && (await import(`file://${candidate}`))
        : await import(candidate);
      // A global install is CommonJS, so the namespace is { default }.
      const chromium = mod && (mod.chromium || mod.default?.chromium);
      if (chromium) return chromium;
    } catch {
      // Try the next location; the message below covers running out of them.
    }
  }
  {
    console.error(
      'This audit needs a browser, because the whole point of it is to run the\n' +
        "page's JavaScript. Playwright is not installed.\n\n" +
        '  npm i -D playwright && npx playwright install chromium\n\n' +
        'It is deliberately not a dependency of this project: it is a diagnostic\n' +
        'you run when you change what renders, not something `npm test` needs.'
    );
    process.exit(2);
  }
}

/** Chromium ships in some sandboxes at a fixed path with no download allowed. */
function browserPath() {
  const configured = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (configured && fs.existsSync(configured)) return configured;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base || !fs.existsSync(base)) return undefined;
  for (const entry of fs.readdirSync(base)) {
    for (const candidate of [
      path.join(base, entry, 'chrome-linux', 'chrome'),
      path.join(base, entry),
    ]) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
  }
  return undefined;
}

/* ------------------------------------------------------------------ *
 * A server that resolves URLs the way Vercel does
 * ------------------------------------------------------------------ */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

/**
 * `serve -s dist` was the obvious way to do this and it is wrong: single-page
 * mode answers every URL with index.html, so every page renders the homepage
 * and the audit reports a site with one page on it. This resolves through the
 * same redirect/file/rewrite order as production, so a URL that 404s here 404s
 * there.
 */
function startServer(resolve) {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(String(req.url).split('?')[0]);

    // Real assets first — the resolver deals in pages.
    const asset = path.join(DIST, pathname.replace(/^\/+/, ''));
    if (path.extname(pathname) && fs.existsSync(asset) && fs.statSync(asset).isFile()) {
      res.writeHead(200, { 'content-type': MIME[path.extname(pathname)] || 'application/octet-stream' });
      res.end(fs.readFileSync(asset));
      return;
    }

    const hit = resolve(pathname);
    if (hit.kind === 'redirect') {
      res.writeHead(hit.status, { location: hit.location });
      res.end();
      return;
    }
    if (!hit.html) {
      res.writeHead(hit.status || 404, { 'content-type': 'text/html; charset=utf-8' });
      res.end('<!doctype html><title>404</title>');
      return;
    }
    res.writeHead(hit.status, { 'content-type': 'text/html; charset=utf-8' });
    res.end(hit.html);
  });
  return new Promise((done) => {
    server.listen(0, '127.0.0.1', () => done({ server, port: server.address().port }));
  });
}

/* ------------------------------------------------------------------ *
 * Comparison
 * ------------------------------------------------------------------ */

/* "&" against "and" is a typographic choice, not a divergence worth reading
 * thirty of. Folding it keeps the report to headings that actually differ. */
const norm = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const indexable = (robots) => !/noindex/i.test(String(robots || ''));

function compare(url, served, rendered, routeType) {
  /* A page that renders a fraction of what it served is the soft 404 that took
   * this site out of the index. Ratio rather than an absolute floor, because a
   * short page is allowed to be short — it is the collapse that matters. */
  if (served.mainWords >= 100 && rendered.mainWords < served.mainWords * SOFT_404_RATIO) {
    flagIt('P0', 'rendered-collapse', url,
      `served ${served.mainWords} words, rendered ${rendered.mainWords} ` +
      `(${Math.round((rendered.mainWords / served.mainWords) * 100)}%)`);
  }

  if (NOT_FOUND.test(rendered.h1 || '') && !NOT_FOUND.test((served.h1s || [])[0] || '')) {
    flagIt('P0', 'rendered-not-found', url, `renders "${rendered.h1}" over real served content`);
  }

  if (indexable(served.robots) && !indexable(rendered.robots)) {
    flagIt('P0', 'rendered-noindex', url, `served "${served.robots}", rendered "${rendered.robots}"`);
  }

  if (rendered.mainWords < THIN_RENDERED) {
    flagIt('P1', 'rendered-thin', url, `${rendered.mainWords} words in the rendered <main>`);
  }

  if (rendered.h1Count === 0) flagIt('P1', 'rendered-no-h1', url, 'no H1 after render');
  else if (rendered.h1Count > 1) flagIt('P1', 'rendered-multiple-h1', url, `${rendered.h1Count} H1s after render`);

  const servedH1 = (served.h1s || [])[0];
  if (servedH1 && rendered.h1 && norm(servedH1) !== norm(rendered.h1)) {
    /* Not automatically wrong — the app is entitled to its own headline — but
     * the H1 Google reads is the second one, so a keyword that only exists in
     * the first is a keyword on no page at all.
     *
     * On a generated route the two H1s come from one builder and can only drift
     * together, so a difference there is usually the app choosing its own
     * phrasing on purpose. On a static route they are two hand-maintained
     * strings — STATIC_HEADINGS in the registry, and the page's own hero prop —
     * with nothing tying them together, so one can be edited without the other.
     * That happened while this audit was being written: retitling
     * /renewable-energy moved the registry heading and left the hero behind.
     * Blocking there, advisory elsewhere. */
    const handMaintained = routeType === 'static' || routeType === 'home';
    flagIt(handMaintained ? 'P1' : 'P2', 'h1-divergence', url,
      `served "${servedH1}" / rendered "${rendered.h1}"`);
  }

  if (served.canonical && rendered.canonical && served.canonical !== rendered.canonical) {
    flagIt('P1', 'canonical-divergence', url, `served ${served.canonical} / rendered ${rendered.canonical}`);
  }

  if (rendered.errors.length) {
    flagIt('P1', 'page-error', url, rendered.errors[0].slice(0, 160));
  }
}

/* ------------------------------------------------------------------ *
 * Crawl
 * ------------------------------------------------------------------ */

/** An even spread across page types rather than the first N alphabetically. */
function sampleRoutes(routes, size) {
  const byType = new Map();
  for (const route of routes) {
    const list = byType.get(route.type) || [];
    list.push(route);
    byType.set(route.type, list);
  }
  const out = [];
  let round = 0;
  while (out.length < size) {
    let added = false;
    for (const list of byType.values()) {
      if (round < list.length && out.length < size) {
        out.push(list[round]);
        added = true;
      }
    }
    if (!added) break;
    round++;
  }
  return out;
}

async function main() {
  if (!fs.existsSync(DIST)) {
    console.error('No dist/ — run `npm run build` first.');
    process.exit(2);
  }

  const chromium = await loadPlaywright();
  const data = await loadSeoData();
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const resolve = createResolver({ distDir: DIST, vercelConfig });

  let routes = getIndexableRoutes(data);
  if (ONLY.length) routes = routes.filter((r) => ONLY.includes(r.path));
  else if (SAMPLE) routes = sampleRoutes(routes, SAMPLE);

  const { server, port } = await startServer(resolve);
  const executablePath = browserPath();
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    // Network noise from a sandbox with no egress is not a page defect.
    if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) {
      errors.push(`console: ${message.text()}`);
    }
  });

  const pages = [];
  let done = 0;
  for (const route of routes) {
    const hit = resolve(route.path);
    if (!hit.html) {
      flagIt('P0', 'no-served-html', route.path, `resolver returned ${hit.status} ${hit.kind}`);
      continue;
    }
    const served = parseHtml(hit.html);

    errors.length = 0;
    let rendered;
    try {
      await page.goto(`http://127.0.0.1:${port}${route.path}`, {
        waitUntil: 'networkidle',
        timeout: 45000,
      });
      rendered = await page.evaluate(() => {
        const words = (node) => {
          const text = (node?.innerText || '').replace(/\s+/g, ' ').trim();
          return text ? text.split(' ').length : 0;
        };
        const h1s = [...document.querySelectorAll('h1')];
        return {
          h1: h1s[0]?.innerText.replace(/\s+/g, ' ').trim() || '',
          h1Count: h1s.length,
          mainWords: words(document.querySelector('main')) || words(document.body),
          title: document.title,
          robots: document.querySelector('meta[name=robots]')?.content || '',
          canonical: document.querySelector('link[rel=canonical]')?.href || '',
        };
      });
    } catch (error) {
      flagIt('P0', 'render-failed', route.path, String(error).slice(0, 160));
      continue;
    }
    rendered.errors = [...errors];

    compare(route.path, served, rendered, route.type);
    pages.push({ path: route.path, type: route.type, served: {
      mainWords: served.mainWords, h1: (served.h1s || [])[0], robots: served.robots, canonical: served.canonical,
    }, rendered });

    if (++done % 25 === 0) process.stderr.write(`  ${done}/${routes.length}\n`);
  }

  await browser.close();
  server.close();

  report(pages);
  if (JSON_OUT) {
    fs.writeFileSync(JSON_OUT, JSON.stringify({ pages, findings }, null, 2));
    console.log(`\nwrote ${JSON_OUT}`);
  }
  const blocking = findings.filter((f) => f.severity === 'P0' || f.severity === 'P1');
  if (STRICT && blocking.length) process.exit(1);
}

function report(pages) {
  const rendered = pages.map((p) => p.rendered.mainWords).sort((a, b) => a - b);
  const median = rendered[Math.floor(rendered.length / 2)] ?? 0;
  console.log('\n================ rendered-DOM audit ================\n');
  console.log(`pages rendered              ${pages.length}`);
  console.log(`median rendered <main>      ${median} words`);
  console.log(`thinnest rendered <main>    ${rendered[0] ?? 0} words`);

  for (const severity of ['P0', 'P1', 'P2']) {
    const list = findings.filter((f) => f.severity === severity);
    console.log(`\n-- ${severity} findings: ${list.length} --`);
    for (const f of list.slice(0, 40)) console.log(`  [${f.code}] ${f.url}\n      ${f.detail}`);
    if (list.length > 40) console.log(`  ... and ${list.length - 40} more`);
  }
  console.log('\n====================================================');
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
