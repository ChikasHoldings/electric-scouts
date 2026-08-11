/**
 * SEO regression suite — `npm test` (run `npm run build` first).
 *
 * These tests exist because Electric Scouts shipped a site-wide indexing
 * failure that nothing caught: every URL served the homepage's <title> and
 * `<link rel="canonical" href="https://electricscouts.com/">`, robots.txt
 * blocked /sitemap.xml via a prefix match on `Disallow: /sitemap`, and the
 * sitemap response carried `X-Robots-Tag: noindex`.
 *
 * Each of those has a test here. The suite is deliberately blunt: it asserts on
 * the actual built output in dist/, not on intentions.
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE_URL, absoluteUrl, canonicalPath } from '../src/seo/site.js';
import { generateRobotsTxt, DISALLOWED_PATHS } from '../src/seo/robots.js';
import {
  getIndexableRoutes,
  getAllRoutes,
  getStaticRoutes,
  getStateRoutes,
  getCityRoutes,
  getNoindexRoutes,
  getAliasRoutes,
  getProviderRoutes,
  STATIC_ROUTES,
} from '../src/seo/routes.js';
import { ARTICLE_IDS } from '../src/seo/articles.js';
import { buildSitemapEntries, buildSitemapXml } from '../api/sitemap.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const CANONICAL_HOST = 'https://www.electricscouts.com';

const distExists = fs.existsSync(path.join(DIST, 'index.html'));

function readDist(relativePath) {
  return fs.readFileSync(path.join(DIST, relativePath), 'utf8');
}

/** dist file for a route path: "/" -> index.html, "/faq" -> faq/index.html */
function distFileFor(routePath) {
  return routePath === '/' ? 'index.html' : `${routePath.replace(/^\//, '')}/index.html`;
}

const tag = {
  title: (html) => html.match(/<title>([\s\S]*?)<\/title>/)?.[1],
  description: (html) => html.match(/<meta name="description" content="([\s\S]*?)"\s*\/?>/)?.[1],
  robots: (html) => html.match(/<meta name="robots" content="([\s\S]*?)"\s*\/?>/)?.[1],
  canonical: (html) => html.match(/<link rel="canonical" href="([\s\S]*?)"\s*\/?>/)?.[1],
  h1: (html) => html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1],
  jsonLd: (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]),
};

/** Visible text inside #root, with tags and entities stripped. */
function initialText(html) {
  const start = html.indexOf('<div id="root">');
  const end = html.indexOf('</body>');
  if (start === -1 || end === -1) return '';
  return html
    .slice(start, end)
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function internalLinks(html) {
  const start = html.indexOf('<div id="root">');
  const end = html.indexOf('</body>');
  if (start === -1 || end === -1) return [];
  return [...html.slice(start, end).matchAll(/<a href="(\/[^"]*)"/g)].map((m) => m[1]);
}

/* ================================================================== *
 * Canonical host and URL normalization
 * ================================================================== */

describe('canonical host and URL normalization', () => {
  test('SITE_URL is the https canonical host with no trailing slash', () => {
    assert.equal(SITE_URL, CANONICAL_HOST);
    assert.ok(SITE_URL.startsWith('https://'), 'canonical host must be https');
    assert.ok(!SITE_URL.endsWith('/'), 'canonical host must not end in a slash');
  });

  test('canonicalPath collapses every duplicate URL variant onto one form', () => {
    assert.equal(canonicalPath('/faq/'), '/faq');
    assert.equal(canonicalPath('/FAQ'), '/faq');
    assert.equal(canonicalPath('/compare-rates?planType=fixed'), '/compare-rates');
    assert.equal(canonicalPath('/compare-rates#results'), '/compare-rates');
    assert.equal(canonicalPath('//all-states//'), '/all-states');
    assert.equal(canonicalPath('/'), '/');
    assert.equal(canonicalPath(''), '/');
  });

  test('absoluteUrl always produces an https canonical-host URL', () => {
    assert.equal(absoluteUrl('/'), `${CANONICAL_HOST}/`);
    assert.equal(absoluteUrl('/texas-electricity'), `${CANONICAL_HOST}/texas-electricity`);
    assert.equal(absoluteUrl('/faq/?utm_source=x'), `${CANONICAL_HOST}/faq`);
  });
});

/* ================================================================== *
 * robots.txt
 * ================================================================== */

describe('robots.txt', () => {
  const robots = generateRobotsTxt();

  /** Disallow rules that apply to the given user agent group. */
  function disallowsFor(text, agent) {
    const groups = [];
    let current = null;
    for (const raw of text.split('\n')) {
      const line = raw.trim();
      if (/^user-agent:/i.test(line)) {
        const name = line.split(':')[1].trim();
        if (current && current.open) current.agents.push(name);
        else { current = { agents: [name], rules: [], open: true }; groups.push(current); }
      } else if (/^(dis)?allow:/i.test(line) && current) {
        current.open = false;
        current.rules.push(line);
      }
    }
    const match = groups.find((g) => g.agents.some((a) => a.toLowerCase() === agent.toLowerCase()))
      || groups.find((g) => g.agents.includes('*'));
    return match ? match.rules.filter((r) => /^disallow:/i.test(r)).map((r) => r.split(':')[1].trim()) : [];
  }

  test('allows crawling of the site root', () => {
    assert.match(robots, /^User-agent: \*$/m);
    assert.match(robots, /^Allow: \/$/m);
  });

  test('does not block /sitemap.xml or /robots.txt (robots.txt paths are prefix matches)', () => {
    // The live regression: `Disallow: /sitemap` also matched /sitemap.xml, so
    // Google could never read the sitemap it was pointed at.
    for (const rule of robots.split('\n').filter((l) => /^Disallow:/i.test(l.trim()))) {
      const value = rule.split(':')[1].trim();
      if (value === '/') continue; // AI-crawler groups block everything by design
      assert.ok(!'/sitemap.xml'.startsWith(value), `robots.txt rule "${rule}" blocks /sitemap.xml`);
      assert.ok(!'/robots.txt'.startsWith(value), `robots.txt rule "${rule}" blocks /robots.txt`);
    }
  });

  test('references the sitemap on the canonical host', () => {
    assert.match(robots, new RegExp(`^Sitemap: ${CANONICAL_HOST}/sitemap\\.xml$`, 'm'));
  });

  test('private paths are blocked for Googlebot, not just for the wildcard group', () => {
    // A `User-agent: Googlebot` group containing only `Allow: /` silently
    // exempted Googlebot from every Disallow rule, exposing /admin and /api.
    const googlebot = disallowsFor(robots, 'Googlebot');
    for (const blocked of DISALLOWED_PATHS) {
      assert.ok(googlebot.includes(blocked), `Googlebot is not blocked from ${blocked}`);
    }
  });

  test('no public content path is disallowed', () => {
    const wildcard = disallowsFor(robots, '*');
    const publicPaths = getIndexableRoutes().map((route) => route.path);
    for (const rule of wildcard) {
      const blocked = publicPaths.filter((p) => p.startsWith(rule));
      assert.equal(blocked.length, 0, `robots.txt "Disallow: ${rule}" blocks public pages: ${blocked.slice(0, 3)}`);
    }
  });

  test('admin, api and affiliate redirects stay blocked', () => {
    const wildcard = disallowsFor(robots, '*');
    assert.deepEqual(wildcard.sort(), [...DISALLOWED_PATHS].sort());
  });
});

/* ================================================================== *
 * Route registry
 * ================================================================== */

describe('route registry', () => {
  const indexable = getIndexableRoutes();

  test('covers every public route group', () => {
    assert.ok(getStaticRoutes().length >= 18, 'static pages missing');
    assert.equal(getStateRoutes().length, 12, 'expected 12 deregulated state pages');
    assert.ok(getCityRoutes().length >= 140, 'city pages missing');
    assert.equal(ARTICLE_IDS.length, 73, 'expected 73 articles');
    assert.ok(indexable.length > 240, `expected 240+ indexable routes, got ${indexable.length}`);
  });

  test('every path is already in canonical form', () => {
    for (const route of getAllRoutes()) {
      assert.equal(route.path, canonicalPath(route.path), `${route.path} is not canonical`);
      assert.ok(!route.path.includes('?'), `${route.path} carries a query string`);
    }
  });

  test('no duplicate paths', () => {
    const paths = getAllRoutes().map((r) => r.path);
    const duplicates = paths.filter((p, i) => paths.indexOf(p) !== i);
    assert.deepEqual(duplicates, []);
  });

  // Article titles live in fullArticles.jsx and are injected at build time, so
  // the registry alone cannot supply them. Their metadata is asserted against
  // the built pages in the dist/ suite below.
  const withRegistryMetadata = indexable.filter((route) => route.type !== 'article');

  test('every indexable route has a unique, non-empty title', () => {
    const titles = new Map();
    for (const route of withRegistryMetadata) {
      assert.ok(route.title, `${route.path} has no title`);
      assert.ok(route.title.length <= 140, `${route.path} title is ${route.title.length} chars`);
      const previous = titles.get(route.title);
      assert.equal(previous, undefined, `${route.path} shares its title with ${previous}`);
      titles.set(route.title, route.path);
    }
  });

  test('every indexable route has a description and an H1', () => {
    for (const route of withRegistryMetadata) {
      assert.ok(route.description && route.description.length > 40, `${route.path} has no usable description`);
      assert.ok(route.heading, `${route.path} has no H1`);
    }
  });

  test('article routes carry no placeholder metadata when article data is absent', () => {
    // A shared fallback title across 73 URLs would recreate the original bug
    // while looking healthy; the prerender build must fail instead.
    for (const route of indexable.filter((r) => r.type === 'article')) {
      assert.equal(route.title, undefined, `${route.path} has a placeholder title`);
    }
  });

  test('provider routes are only generated for providers that render', () => {
    const routes = getProviderRoutes([{ name: 'TXU Energy' }, { name: null }, {}]);
    assert.equal(routes.length, 1);
    assert.equal(routes[0].path, '/providers/txu-energy');
  });

  test('private and legacy duplicate routes are excluded from the indexable set', () => {
    const indexablePaths = new Set(indexable.map((r) => r.path));
    for (const route of [...getNoindexRoutes(), ...getAliasRoutes()]) {
      assert.ok(!indexablePaths.has(route.path), `${route.path} must not be indexable`);
    }
    assert.ok(!indexablePaths.has('/business-quote-dashboard'));
    assert.ok(![...indexablePaths].some((p) => p.startsWith('/admin')), 'admin routes must never be indexable');
  });
});

/* ================================================================== *
 * Sitemap
 * ================================================================== */

describe('sitemap.xml', () => {
  const entries = buildSitemapEntries({
    providers: [{ name: 'NextVolt Energy', updated_at: '2026-03-03T00:00:00Z' }],
    articles: [],
  });
  const xml = buildSitemapXml(entries);

  test('contains every indexable route', () => {
    const locs = new Set(entries.map((e) => e.loc));
    for (const route of getIndexableRoutes()) {
      assert.ok(locs.has(absoluteUrl(route.path)), `${route.path} is missing from the sitemap`);
    }
  });

  test('every URL is https on the canonical host', () => {
    for (const entry of entries) {
      assert.ok(entry.loc.startsWith(`${CANONICAL_HOST}/`), `non-canonical sitemap URL: ${entry.loc}`);
      assert.ok(!/localhost|127\.0\.0\.1|vercel\.app|staging/i.test(entry.loc), `non-production URL: ${entry.loc}`);
    }
  });

  test('has no duplicate URLs', () => {
    const locs = entries.map((e) => e.loc);
    assert.deepEqual(locs.filter((l, i) => locs.indexOf(l) !== i), []);
  });

  test('contains no private, admin or noindex URLs', () => {
    const excluded = new Set([...getNoindexRoutes(), ...getAliasRoutes()].map((r) => absoluteUrl(r.path)));
    for (const entry of entries) {
      assert.ok(!excluded.has(entry.loc), `noindex URL in sitemap: ${entry.loc}`);
      assert.ok(!/\/admin|\/api\/|\/go\//.test(entry.loc), `private URL in sitemap: ${entry.loc}`);
      assert.ok(!entry.loc.includes('?'), `parameterised URL in sitemap: ${entry.loc}`);
    }
  });

  test('is well-formed XML with the sitemap namespace', () => {
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
    assert.equal((xml.match(/<url>/g) || []).length, (xml.match(/<\/url>/g) || []).length);
    assert.equal((xml.match(/<url>/g) || []).length, entries.length);
    assert.ok(xml.trimEnd().endsWith('</urlset>'));
    // Bare ampersands are the classic sitemap parse failure.
    assert.ok(!/&(?!amp;|lt;|gt;|quot;|apos;)/.test(xml), 'sitemap contains an unescaped ampersand');
  });

  test('lastmod is a valid ISO date and priority is in range', () => {
    for (const entry of entries) {
      assert.match(entry.lastmod, /^\d{4}-\d{2}-\d{2}$/, `bad lastmod: ${entry.lastmod}`);
      const priority = Number(entry.priority);
      assert.ok(priority >= 0 && priority <= 1, `bad priority: ${entry.priority}`);
    }
  });

  test('database articles are merged in without displacing bundled ones', () => {
    const merged = buildSitemapEntries({
      providers: [],
      articles: [{ id: 'uuid-1', slug: 'a-new-guide', updated_date: '2026-05-01T10:00:00Z' }],
    });
    const locs = merged.map((e) => e.loc);
    assert.ok(locs.includes(`${CANONICAL_HOST}/learn/a-new-guide`));
    assert.ok(locs.includes(`${CANONICAL_HOST}/learn/1`));
  });
});

/* ================================================================== *
 * Built output — the actual bytes a crawler receives
 * ================================================================== */

describe('prerendered output in dist/', () => {
  before(() => {
    assert.ok(
      distExists,
      'dist/index.html not found — run "npm run build" before "npm test"; these checks validate the real deploy artefacts'
    );
  });

  test('every route in the registry has a prerendered HTML file', () => {
    const missing = getAllRoutes()
      .map((route) => distFileFor(route.path))
      .filter((file) => !fs.existsSync(path.join(DIST, file)));
    assert.deepEqual(missing, [], 'routes without prerendered HTML fall through to a 404');
  });

  test('no page ships the old site-wide homepage canonical', () => {
    // The original failure: every URL claimed to be a duplicate of the homepage.
    const offenders = [];
    for (const route of getIndexableRoutes()) {
      if (route.path === '/') continue;
      const html = readDist(distFileFor(route.path));
      if (tag.canonical(html) === `${CANONICAL_HOST}/`) offenders.push(route.path);
    }
    assert.deepEqual(offenders.slice(0, 10), []);
  });

  test('no page carries a noindex it should not', () => {
    const offenders = getIndexableRoutes()
      .filter((route) => /noindex/i.test(tag.robots(readDist(distFileFor(route.path))) || ''))
      .map((route) => route.path);
    assert.deepEqual(offenders.slice(0, 10), [], 'indexable pages must not be noindexed');
  });

  test('every indexable page self-canonicalizes to its own https URL', () => {
    for (const route of getIndexableRoutes()) {
      const html = readDist(distFileFor(route.path));
      assert.equal(tag.canonical(html), absoluteUrl(route.path), `wrong canonical on ${route.path}`);
    }
  });

  test('titles are unique across the built pages', () => {
    const titles = new Map();
    for (const route of getIndexableRoutes()) {
      const title = tag.title(readDist(distFileFor(route.path)));
      assert.ok(title, `${route.path} has no <title>`);
      const previous = titles.get(title);
      assert.equal(previous, undefined, `${route.path} and ${previous} share a <title>`);
      titles.set(title, route.path);
    }
  });

  // One representative route per public group, exactly as the audit brief asks.
  const REPRESENTATIVE = [
    ['homepage', '/'],
    ['state page', '/texas-electricity'],
    ['city page', '/electricity-rates/texas/dallas'],
    ['residential comparison', '/compare-rates'],
    ['commercial page', '/business-electricity'],
    ['renewable page', '/renewable-energy'],
    ['article page', '/learn/1'],
    ['provider directory', '/all-providers'],
  ];

  for (const [label, routePath] of REPRESENTATIVE) {
    test(`${label} (${routePath}) is fully indexable`, () => {
      const html = readDist(distFileFor(routePath));

      assert.ok(tag.title(html), 'missing <title>');
      assert.ok((tag.description(html) || '').length > 40, 'missing or thin meta description');
      assert.equal(tag.canonical(html), absoluteUrl(routePath), 'wrong canonical');
      assert.match(tag.robots(html) || '', /^index, follow/, 'not marked indexable');
      assert.ok(tag.h1(html), 'missing <h1> in the initial HTML');

      const text = initialText(html);
      assert.ok(text.length > 300, `initial HTML has only ${text.length} chars of text`);

      const links = internalLinks(html);
      assert.ok(links.length >= 10, `only ${links.length} crawlable internal links`);

      const schemas = tag.jsonLd(html);
      assert.ok(schemas.length > 0, 'no JSON-LD');
      const graph = JSON.parse(schemas[0]);
      assert.equal(graph['@context'], 'https://schema.org');
      assert.ok(Array.isArray(graph['@graph']) && graph['@graph'].length > 0);
    });
  }

  test('city pages link to their state page and to sibling cities', () => {
    const html = readDist(distFileFor('/electricity-rates/texas/dallas'));
    const links = internalLinks(html);
    assert.ok(links.includes('/texas-electricity'), 'city page does not link to its state page');
    assert.ok(
      links.some((l) => l.startsWith('/electricity-rates/texas/') && l !== '/electricity-rates/texas/dallas'),
      'city page does not link to sibling cities'
    );
  });

  test('state pages link to every city we publish for that state', () => {
    const html = readDist(distFileFor('/texas-electricity'));
    const links = new Set(internalLinks(html));
    const texasCities = getCityRoutes().filter((route) => route.city.stateCode === 'TX');
    for (const city of texasCities) {
      assert.ok(links.has(city.path), `Texas page does not link to ${city.path}`);
    }
  });

  test('the homepage is reachable from, and links out to, the main hubs', () => {
    const links = new Set(internalLinks(readDist('index.html')));
    for (const hub of ['/compare-rates', '/all-providers', '/all-states', '/all-cities', '/learning-center']) {
      assert.ok(links.has(hub), `homepage does not link to ${hub}`);
    }
  });

  test('private and legacy duplicate pages are noindex', () => {
    for (const route of getNoindexRoutes()) {
      const html = readDist(distFileFor(route.path));
      assert.match(tag.robots(html) || '', /noindex/, `${route.path} is not noindexed`);
    }
  });

  test('/landing consolidates onto the homepage instead of competing with it', () => {
    const html = readDist(distFileFor('/landing'));
    assert.equal(tag.canonical(html), `${CANONICAL_HOST}/`);
  });

  test('404.html is a real, noindex error page', () => {
    const html = readDist('404.html');
    assert.match(tag.robots(html) || '', /noindex/);
    assert.match(tag.title(html) || '', /not found/i);
  });

  test('app-shell.html declares no canonical and no robots directive', () => {
    // Served only for dynamic routes created after the build; the client sets
    // both from the real route, and a guessed canonical here would be wrong.
    const html = readDist('app-shell.html');
    assert.equal(tag.canonical(html), undefined, 'app shell must not hardcode a canonical');
    assert.equal(tag.robots(html), undefined, 'app shell must not hardcode a robots directive');
  });

  test('dist/robots.txt is generated and points at the sitemap', () => {
    const robots = readDist('robots.txt');
    assert.match(robots, new RegExp(`Sitemap: ${CANONICAL_HOST}/sitemap\\.xml`));
    assert.match(robots, /^Allow: \/$/m);
  });

  test('no page contains a fabricated aggregateRating', () => {
    for (const routePath of ['/', '/texas-electricity', '/all-providers']) {
      const html = readDist(distFileFor(routePath));
      assert.ok(!/aggregateRating/.test(html), `${routePath} ships an aggregateRating`);
    }
  });

  test('prerendered pages keep the hashed application bundle', () => {
    const html = readDist(distFileFor('/electricity-rates/texas/dallas'));
    assert.match(html, /<script type="module"[^>]+src="\/assets\/[^"]+\.js"/, 'app bundle missing');
    assert.match(html, /<link rel="stylesheet"[^>]+href="\/assets\/[^"]+\.css"/, 'stylesheet missing');
    assert.match(html, /<div id="root">/, '#root container missing');
  });
});

/* ================================================================== *
 * Drift guards — keep the registry honest as content changes
 * ================================================================== */

describe('registry stays in step with app data', () => {
  test('city routes match the city data CityRates renders', () => {
    const source = fs.readFileSync(path.join(ROOT, 'src/data/cityRatesData.js'), 'utf8');
    const dataKeys = [...source.matchAll(/^ {2}"([^"]+-[A-Z]{2})": \{/gm)].map((m) => m[1]).sort();
    const routeKeys = getCityRoutes().map((r) => `${r.city.name}-${r.city.stateCode}`).sort();
    assert.deepEqual(routeKeys, dataKeys, 'city routes and cityRatesData have drifted apart');
  });

  test('ARTICLE_IDS matches the articles that actually exist', () => {
    const source = fs.readFileSync(path.join(ROOT, 'src/components/learning/fullArticles.jsx'), 'utf8');
    const ids = [...source.matchAll(/^ {2}(\d+): \{/gm)].map((m) => Number(m[1])).sort((a, b) => a - b);
    assert.deepEqual([...ARTICLE_IDS].sort((a, b) => a - b), ids, 'ARTICLE_IDS and fullArticles have drifted apart');
  });

  test('static route metadata matches each page\'s own SEOHead props', () => {
    for (const route of STATIC_ROUTES) {
      const source = fs.readFileSync(path.join(ROOT, `src/pages/${route.page}.jsx`), 'utf8');
      let found = null;
      for (let i = source.indexOf('<SEOHead'); i !== -1; i = source.indexOf('<SEOHead', i + 1)) {
        const block = source.slice(i, i + 4000);
        const title = block.match(/title="((?:[^"\\]|\\.)*)"/);
        const description = block.match(/description="((?:[^"\\]|\\.)*)"/);
        if (title && description) { found = { title: title[1], description: description[1] }; break; }
      }
      assert.ok(found, `${route.page} declares no <SEOHead> title/description`);
      assert.equal(found.title, route.title, `${route.page} title drifted from the registry`);
      assert.equal(found.description, route.description, `${route.page} description drifted from the registry`);
    }
  });
});

/* ================================================================== *
 * Deployment configuration
 * ================================================================== */

describe('vercel.json routing', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));

  test('no catch-all rewrite shadows the prerendered pages or masks 404s', () => {
    // `{"source": "/(.*)", "destination": "/index.html"}` is what made every URL
    // serve the homepage shell, and made unknown URLs return 200 soft 404s.
    for (const rewrite of config.rewrites || []) {
      assert.ok(
        !['/(.*)', '/:path*', '/(.*)/'].includes(rewrite.source),
        `catch-all rewrite present: ${JSON.stringify(rewrite)}`
      );
    }
  });

  test('sitemap.xml is routed to the generator', () => {
    const rewrite = (config.rewrites || []).find((r) => r.source === '/sitemap.xml');
    assert.ok(rewrite, '/sitemap.xml has no rewrite');
    assert.equal(rewrite.destination, '/api/sitemap');
  });

  test('client-routed sections fall back to the neutral app shell', () => {
    const sources = (config.rewrites || []).map((r) => r.source);
    for (const prefix of ['/admin/:path*', '/providers/:slug', '/electricity-rates/:stateSlug/:citySlug', '/learn/:slug']) {
      assert.ok(sources.includes(prefix), `${prefix} has no SPA fallback`);
    }
    for (const rewrite of config.rewrites || []) {
      if (rewrite.source.startsWith('/admin') || rewrite.source.startsWith('/providers')) {
        assert.equal(rewrite.destination, '/app-shell.html');
      }
    }
  });

  test('trailing slashes resolve to one canonical form', () => {
    assert.equal(config.trailingSlash, false);
  });

  test('admin and api responses are marked noindex at the header level', () => {
    const headerFor = (source) => (config.headers || []).find((h) => h.source === source);
    for (const source of ['/admin', '/admin/(.*)', '/api/(.*)']) {
      const entry = headerFor(source);
      assert.ok(entry, `no headers configured for ${source}`);
      assert.ok(
        entry.headers.some((h) => h.key === 'X-Robots-Tag' && /noindex/.test(h.value)),
        `${source} is missing an X-Robots-Tag: noindex`
      );
    }
  });

  test('no X-Robots-Tag noindex is applied to public pages', () => {
    // The sitemap response used to send this header, telling Google to ignore
    // the very file it had just fetched.
    for (const entry of config.headers || []) {
      const noindex = entry.headers.some((h) => h.key === 'X-Robots-Tag' && /noindex/.test(h.value));
      if (!noindex) continue;
      assert.ok(
        /^\/(admin|api|go)/.test(entry.source),
        `X-Robots-Tag: noindex applied to public path "${entry.source}"`
      );
    }
  });

  test('legacy PascalCase URLs redirect permanently to their canonical path', () => {
    const redirects = config.redirects || [];
    const find = (source) => redirects.find((r) => r.source === source);
    for (const [source, destination] of [
      ['/TexasElectricity', '/texas-electricity'],
      ['/CompareRates', '/compare-rates'],
      ['/home', '/'],
    ]) {
      const redirect = find(source);
      assert.ok(redirect, `${source} has no redirect`);
      assert.equal(redirect.destination, destination);
      assert.equal(redirect.permanent, true, `${source} should be a 301`);
    }
  });

  test('redirects never target a URL that redirects again', () => {
    const redirects = config.redirects || [];
    const sources = new Set(redirects.map((r) => r.source));
    for (const redirect of redirects) {
      assert.ok(!sources.has(redirect.destination), `redirect chain: ${redirect.source} -> ${redirect.destination}`);
    }
  });
});
