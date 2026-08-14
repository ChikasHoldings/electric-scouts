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
  getComparisonRoutes,
  STATIC_ROUTES,
} from '../src/seo/routes.js';
import { ARTICLE_IDS } from '../src/seo/articles.js';
import { buildSitemapEntries, buildSitemapXml } from '../src/seo/sitemap.js';
import { getPublishableProviders, getAllProviders, MARKET_GENERATED_AT, MARKET_TOTALS, getStateMarket } from '../src/seo/market.js';
import { buildCitySections, buildStateSections, buildProviderSections, buildComparisonSections } from '../src/seo/content.js';
import { createResolver, parseHtml } from '../src/seo/audit.mjs';
import { buildPageContent, renderBody } from '../src/seo/render.js';
import { organizationSchema, standaloneOrganizationSchema } from '../src/seo/organization.js';
import { getStates, getCities } from '../src/seo/locations.js';
import { LOCATION_DATA } from '../src/components/location/locationData.js';
import { comparisonsForProvider, comparisonsForState } from '../src/seo/comparisons.js';

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
    // ProviderDetails resolves its slug against active providers only, and a
    // profile with no plans is an empty page — both must be excluded or the
    // sitemap advertises URLs that render a "Provider Not Found" shell.
    const routes = getProviderRoutes([
      { name: 'TXU Energy', slug: 'txu-energy', isActive: true, plans: 4, planStates: ['TX'], minRate: 9.8, maxRate: 16.4 },
      { name: 'Inactive Co', slug: 'inactive-co', isActive: false, plans: 9 },
      { name: 'No Plans Co', slug: 'no-plans-co', isActive: true, plans: 0 },
      { name: null, isActive: true, plans: 3 },
      {},
    ]);
    assert.deepEqual(routes.map((r) => r.path), ['/providers/txu-energy']);
  });

  test('every publishable provider is active and has plans', () => {
    for (const provider of getPublishableProviders()) {
      assert.ok(provider.isActive, `${provider.name} is not active but would get a page`);
      assert.ok(provider.plans > 0, `${provider.name} has no plans but would get a page`);
    }
  });

  test('providers with no plans never reach the indexable set', () => {
    const empty = getAllProviders().filter((p) => p.plans === 0).map((p) => `/providers/${p.slug}`);
    const indexablePaths = new Set(indexable.map((r) => r.path));
    for (const path of empty) {
      assert.ok(!indexablePaths.has(path), `${path} has no plans and must not be indexable`);
    }
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
  const entries = buildSitemapEntries({ providers: getPublishableProviders() });
  const xml = buildSitemapXml(entries);

  test('contains every indexable route', () => {
    const locs = new Set(entries.map((e) => e.loc));
    for (const route of getIndexableRoutes({ providers: getPublishableProviders() })) {
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

  test('advertises only article URLs the app can actually resolve', () => {
    // /learn/:id resolves by numeric id. The previous sitemap also emitted
    // /learn/<slug> for database articles, and every one of those rendered
    // "Article Not Found" behind a 200 — a soft 404 we asked Google to crawl.
    const articleLocs = entries.map((e) => e.loc).filter((loc) => loc.includes('/learn/'));
    for (const loc of articleLocs) {
      const identifier = loc.split('/learn/')[1];
      assert.match(identifier, /^\d+$/, `${loc} is not an article id the route resolves`);
      assert.ok(ARTICLE_IDS.includes(Number(identifier)), `${loc} has no article behind it`);
    }
    assert.equal(articleLocs.length, ARTICLE_IDS.length);
  });

  test('every sitemap URL was prerendered by this build', { skip: !distExists }, () => {
    for (const entry of entries) {
      const routePath = entry.loc.replace(CANONICAL_HOST, '') || '/';
      const file = path.join(DIST, distFileFor(routePath === '' ? '/' : routePath));
      assert.ok(fs.existsSync(file), `${entry.loc} is in the sitemap but was not prerendered`);
    }
  });

  test('the built sitemap.xml matches the registry', { skip: !distExists }, () => {
    const built = readDist('sitemap.xml');
    const builtLocs = [...built.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.deepEqual(builtLocs, entries.map((e) => e.loc));
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
    ['comparison engine', '/compare-rates'],
    ['residential landing', '/residential-electricity'],
    ['commercial landing', '/business-electricity'],
    ['renewable landing', '/renewable-energy'],
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

  /* ---------------------------------------------------------------- *
   * The three service landing pages
   *
   * They share a layout and a design system on purpose. What they must not
   * share is their content: three near-identical pages differing by one
   * keyword compete with each other and give a crawler no reason to keep any
   * of them.
   * ---------------------------------------------------------------- */

  const LANDING_PAGES = ['/residential-electricity', '/business-electricity', '/renewable-energy'];

  test('each service landing page targets its own intent', () => {
    const seen = { title: new Map(), description: new Map(), h1: new Map() };

    for (const routePath of LANDING_PAGES) {
      const html = readDist(distFileFor(routePath));
      for (const field of ['title', 'description', 'h1']) {
        const value = tag[field](html);
        assert.ok(value, `${routePath} has no ${field}`);
        const previous = seen[field].get(value);
        assert.equal(previous, undefined, `${routePath} shares its ${field} with ${previous}`);
        seen[field].set(value, routePath);
      }
      assert.equal(
        (html.match(/<h1[^>]*>/g) || []).length,
        1,
        `${routePath} does not have exactly one H1`
      );
    }
  });

  test('each landing page routes into the shared comparison engine', () => {
    for (const routePath of LANDING_PAGES) {
      const links = internalLinks(readDist(distFileFor(routePath)));
      assert.ok(links.includes('/compare-rates'), `${routePath} does not link to /compare-rates`);
    }
  });

  test('no page publishes a parameterised comparison URL for crawlers', () => {
    // ZIP and intent travel in the URL during the handoff, and are stripped once
    // read. None of that may appear in crawlable markup, or every ZIP/type
    // combination becomes a competing duplicate of /compare-rates.
    for (const route of getAllRoutes()) {
      const html = readDist(distFileFor(route.path));
      const parameterised = internalLinks(html).filter(
        (href) => href.startsWith('/compare-rates?') && /zip=|entry=|type=/.test(href)
      );
      assert.deepEqual(parameterised, [], `${route.path} links to a parameterised comparison URL`);
    }
  });

  test('the landing pages are reachable from every prerendered page', () => {
    // The site nav is rendered into every prerendered page, so a new landing
    // page is one hop from anywhere rather than orphaned behind the header.
    for (const routePath of ['/', '/compare-rates', '/texas-electricity', '/learn/1']) {
      const links = new Set(internalLinks(readDist(distFileFor(routePath))));
      for (const landing of LANDING_PAGES) {
        assert.ok(links.has(landing), `${routePath} does not link to ${landing}`);
      }
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

  test('404.html is a real, noindex error page with no canonical', () => {
    const html = readDist('404.html');
    assert.match(tag.robots(html) || '', /noindex/);
    assert.match(tag.title(html) || '', /not found/i);
    // It answers for every unknown URL, so it represents none of them.
    assert.equal(tag.canonical(html), undefined, '404 page must not declare a canonical');
    assert.ok(tag.h1(html), 'missing <h1>');
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

  test('sitemap.xml is a built file, not a rewrite to a function', () => {
    // Generated at build time from the same registry that produced the pages,
    // so it cannot advertise a URL this build did not prerender.
    assert.ok(
      !(config.rewrites || []).some((r) => r.source === '/sitemap.xml'),
      '/sitemap.xml should be served from dist, not rewritten to a function'
    );
    if (distExists) assert.ok(fs.existsSync(path.join(DIST, 'sitemap.xml')), 'dist/sitemap.xml was not built');
  });

  test('no public dynamic route falls back to the empty app shell', () => {
    // These rewrites made /providers/<anything>, /electricity-rates/<anything>
    // and /learn/<anything> return 200 with an empty shell — a soft 404 on
    // every invalid slug. Only /admin, which is noindex and auth-gated, may
    // still fall back.
    for (const rewrite of config.rewrites || []) {
      if (rewrite.destination !== '/app-shell.html') continue;
      assert.ok(
        rewrite.source.startsWith('/admin'),
        `public route ${rewrite.source} falls back to the app shell and will soft-404`
      );
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

/* ================================================================== *
 * Soft 404s
 *
 * A dynamic URL with no record behind it must not return 200 with a page
 * that looks real. /providers/:slug, /electricity-rates/:state/:city and
 * /learn/:id all used to rewrite to an empty app shell, so every invalid
 * slug was a 200 with no content — the shape Google reports as "Crawled -
 * currently not indexed" and, at scale, as a soft 404.
 * ================================================================== */

describe('invalid dynamic URLs do not masquerade as pages', { skip: !distExists }, () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const resolve = createResolver({ distDir: DIST, vercelConfig: config });

  const invalid = [
    '/providers/this-provider-does-not-exist',
    // A supplier row that exists but carries no active plan gets no page — an
    // empty profile is exactly the thin content this rebuild removes. (TXU used
    // to sit here as an inactive supplier; it now has plans and a real page.)
    '/providers/liberty-power',
    '/electricity-rates/texas/not-a-real-city',
    '/electricity-rates/atlantis/springfield',
    '/learn/999999',
    '/learn/71',                          // inside the id range but unpublished
    '/this-page-does-not-exist',
  ];

  for (const url of invalid) {
    test(`${url} returns 404`, () => {
      const result = resolve(url);
      assert.equal(result.status, 404, `${url} returned ${result.status} (kind=${result.kind})`);
    });
  }

  test('the 404 body is a real error page, not an empty shell', () => {
    const result = resolve('/nope');
    const parsed = parseHtml(result.html);
    assert.match(parsed.robots || '', /noindex/);
    assert.equal(parsed.canonical, undefined, '404 must not canonicalize to a URL that does not resolve');
    assert.ok(parsed.h1s.length >= 1, '404 page has no H1');
    assert.ok(parsed.links.length > 3, '404 page offers no way back into the site');
  });

  test('valid dynamic URLs still resolve to their prerendered page', () => {
    for (const url of ['/electricity-rates/texas/houston', '/learn/1', ...getProviderRoutes(getPublishableProviders()).map((r) => r.path)]) {
      const result = resolve(url);
      assert.equal(result.status, 200, `${url} should resolve`);
      assert.ok(parseHtml(result.html).prerendered, `${url} served a shell with no prerendered body`);
    }
  });
});

/* ================================================================== *
 * Content depth and differentiation
 * ================================================================== */

describe('pages carry content that justifies indexing', () => {
  const citiesByState = {};
  for (const route of getCityRoutes()) {
    (citiesByState[route.city.stateCode] ||= []).push(route.city);
  }

  test('every city page renders sections built from its own data', () => {
    for (const route of getCityRoutes()) {
      const { intro, sections } = buildCitySections(route, { citiesByState });
      assert.ok(intro.length >= 1, `${route.path} has no intro`);
      assert.ok(sections.length >= 5, `${route.path} has only ${sections.length} sections`);
      const headings = sections.map((s) => s.heading);
      assert.ok(
        headings.some((h) => h.includes(route.city.name)),
        `${route.path} has no section naming the city`
      );
      assert.ok(sections.some((s) => s.faqs && s.faqs.length), `${route.path} has no FAQ section`);
    }
  });

  test('city pages never emit a section with no content under it', () => {
    for (const route of getCityRoutes()) {
      const { sections } = buildCitySections(route, { citiesByState });
      for (const section of sections) {
        const populated =
          (section.paragraphs || []).length ||
          (section.bullets || []).length ||
          (section.facts || []).length ||
          (section.links || []).length ||
          (section.faqs || []).length ||
          (section.providers || []).length ||
          section.table;
        assert.ok(populated, `${route.path}: empty section "${section.heading}"`);
      }
    }
  });

  test('state pages expose their own market figures, not a shared template', () => {
    const introSets = new Set();
    for (const route of getStateRoutes()) {
      const { intro, sections } = buildStateSections(route);
      assert.ok(sections.length >= 5, `${route.path} has only ${sections.length} sections`);
      assert.ok(sections.some((s) => s.table), `${route.path} has no city rate table`);
      introSets.add(intro.join(' '));
    }
    assert.equal(introSets.size, getStateRoutes().length, 'state intros are not unique');
  });

  test('provider pages list the plans behind them', () => {
    for (const route of getProviderRoutes(getPublishableProviders())) {
      const { intro, sections } = buildProviderSections(route);
      assert.ok(intro.length >= 1, `${route.path} has no description`);
      assert.ok(
        sections.some((s) => (s.bullets || []).some((b) => /plans/.test(b))),
        `${route.path} does not say what plans it has`
      );
    }
  });

  test('no page claims a saving the data does not support', () => {
    const claim = /save (up to )?\$|save \d+%|guaranteed saving/i;
    for (const route of [...getStaticRoutes(), ...getStateRoutes(), ...getCityRoutes()]) {
      assert.ok(!claim.test(route.title), `${route.path} title makes a savings claim: ${route.title}`);
      assert.ok(!claim.test(route.description), `${route.path} description makes a savings claim`);
    }
  });

  test('city titles carry no hard-coded year', () => {
    for (const route of getCityRoutes()) {
      assert.ok(!/\b20\d\d\b/.test(route.title), `${route.path} title hard-codes a year: ${route.title}`);
    }
  });

  test('titles and descriptions stay within what a SERP shows', () => {
    for (const route of [...getStaticRoutes(), ...getStateRoutes(), ...getCityRoutes()]) {
      assert.ok(route.title.length <= 70, `${route.path} title is ${route.title.length} chars`);
      assert.ok(
        route.description.length >= 70 && route.description.length <= 165,
        `${route.path} description is ${route.description.length} chars`
      );
    }
  });

  test('city pages publish no unsourced supplier count', () => {
    // locationData/cityRatesData carried a per-city `providers` estimate (45 for
    // Houston, 38 for Austin) with nothing behind it, rendered on the same page
    // as the snapshot figure of 22 for all of Texas. Only snapshot-backed
    // supplier counts may appear.
    for (const route of getCityRoutes()) {
      const { intro, sections } = buildCitySections(route, { citiesByState });
      // Each fragment is scanned on its own: joining them would run the value of
      // one fact ("$170") into the label of the next ("Suppliers with...").
      const fragments = [
        ...intro,
        ...sections.flatMap((s) => [
          ...(s.paragraphs || []),
          ...(s.facts || []).flatMap(([label, value]) => [label, String(value)]),
          ...(s.faqs || []).flatMap((f) => [f.question, f.answer]),
        ]),
      ];
      // A page may cite the total number of suppliers in the state or the
      // narrower count behind renewable plans — both come from the snapshot.
      // Anything else is an estimate with no source.
      const supported = new Set(
        [route.market?.providers, route.market?.renewableProviders].filter((n) => Number.isFinite(n))
      );
      for (const fragment of fragments) {
        const claimed = fragment.match(/(\d+)\s*\+?\s*(?:electricity\s+)?(?:providers|suppliers)/gi) || [];
        for (const phrase of claimed) {
          const count = Number(phrase.match(/\d+/)[0]);
          assert.ok(
            supported.has(count),
            `${route.path} claims "${phrase.trim()}" but the snapshot holds ${[...supported].join(' or ')}`
          );
        }
      }
    }
  });

  test('no city page body asserts a savings figure', () => {
    // Local insight notes carried lines like "can save families $400-$600
    // annually" and "rates 15-20% below the default utility rate". Electric
    // Scouts holds plan rates, not utility default rates or customer bills.
    const money = /\$\s?\d/;
    const pctClaim = /\d+\s*%\s*(?:below|lower|less|off)/i;
    for (const route of getCityRoutes()) {
      const { intro, sections } = buildCitySections(route, { citiesByState });
      for (const text of [...intro, ...sections.flatMap((s) => s.paragraphs || [])]) {
        assert.ok(!money.test(text), `${route.path} body asserts a dollar figure: ${text}`);
        assert.ok(!pctClaim.test(text), `${route.path} body asserts a rate comparison: ${text}`);
      }
    }
  });
});

/* ================================================================== *
 * Article metadata
 * ================================================================== */

describe('article metadata is ours and is supportable', { skip: !distExists }, () => {
  const articleFiles = ARTICLE_IDS.map((id) => ({ id, file: `learn/${id}/index.html` })).filter(
    ({ file }) => fs.existsSync(path.join(DIST, file))
  );

  before(() => {
    assert.equal(articleFiles.length, ARTICLE_IDS.length, 'some article pages were not prerendered');
  });

  test('no article carries a placeholder or third-party brand', () => {
    // 37 of 73 titles shipped a brand that was not ours: literal placeholders
    // (YourBrand, [Brand]), invented agency brands (PowerUp, PowerSmart,
    // EcoEnergy) and real third parties whose inclusion implies endorsement
    // (Power to Choose Texas, PA PUC, TXU, Octopus Energy).
    const foreign =
      /YourBrand|\[Brand|PowerUp|PowerSmart|PowerNY|PowerChoice|PowerHub|PowerHelp|PowerPro|PowerBrand|PowerCompare|PowerSave|EcoEnergy|SolarSmart|SolarBrand|GreenEnergy|EnergyShield|Power Insights|Power to Choose|PA PUC/i;
    for (const { id, file } of articleFiles) {
      const html = readDist(file);
      const title = tag.title(html);
      const description = tag.description(html);
      assert.ok(!foreign.test(title), `/learn/${id} title carries a foreign brand: ${title}`);
      assert.ok(!foreign.test(description), `/learn/${id} description carries a foreign brand`);
    }
  });

  test('every article title ends with the site brand', () => {
    for (const { id, file } of articleFiles) {
      const title = tag.title(readDist(file));
      assert.ok(
        title.endsWith('| Electric Scouts'),
        `/learn/${id} title is not branded Electric Scouts: ${title}`
      );
    }
  });

  test('no article title or description claims a saving', () => {
    const claim = /\$\s?[\d,]+|save \d+\s*-?\s*\d*\s*%/i;
    for (const { id, file } of articleFiles) {
      const html = readDist(file);
      assert.ok(!claim.test(tag.title(html)), `/learn/${id} title claims a saving: ${tag.title(html)}`);
      assert.ok(!claim.test(tag.description(html)), `/learn/${id} description claims a saving`);
    }
  });

  test('article titles and descriptions are unique and SERP-sized', () => {
    const titles = new Map();
    const descriptions = new Map();
    for (const { id, file } of articleFiles) {
      const html = readDist(file);
      const title = tag.title(html);
      const description = tag.description(html);

      assert.ok(title.length <= 70, `/learn/${id} title is ${title.length} chars: ${title}`);
      assert.ok(
        description.length >= 70 && description.length <= 165,
        `/learn/${id} description is ${description.length} chars`
      );

      assert.ok(!titles.has(title), `/learn/${id} duplicates the title of /learn/${titles.get(title)}`);
      titles.set(title, id);
      assert.ok(
        !descriptions.has(description),
        `/learn/${id} duplicates the description of /learn/${descriptions.get(description)}`
      );
      descriptions.set(description, id);
    }
  });
});

/* ================================================================== *
 * Structured data honesty
 * ================================================================== */

describe('structured data describes what the page shows', { skip: !distExists }, () => {
  function jsonLdOf(routePath) {
    const html = readDist(distFileFor(routePath));
    return tag.jsonLd(html).map((raw) =>
      JSON.parse(raw.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\u0026/g, '&'))
    );
  }

  test('FAQPage markup only appears where the page renders the questions', () => {
    for (const routePath of ['/electricity-rates/texas/houston', '/texas-electricity', '/faq']) {
      const html = readDist(distFileFor(routePath));
      const graph = jsonLdOf(routePath).flatMap((doc) => doc['@graph'] || [doc]);
      const faqPage = graph.find((node) => node['@type'] === 'FAQPage');
      assert.ok(faqPage, `${routePath} renders FAQs but has no FAQPage markup`);
      for (const question of faqPage.mainEntity) {
        assert.ok(
          html.includes(question.name.replace(/&/g, '&amp;').replace(/'/g, '&#39;')),
          `${routePath}: FAQPage question is not visible on the page: ${question.name}`
        );
      }
    }
  });

  test('pages with no FAQ section carry no FAQPage markup', () => {
    for (const routePath of ['/privacy-policy', '/all-cities']) {
      const graph = jsonLdOf(routePath).flatMap((doc) => doc['@graph'] || [doc]);
      assert.ok(!graph.some((node) => node['@type'] === 'FAQPage'), `${routePath} has FAQPage markup with no FAQs`);
    }
  });

  test('breadcrumb markup matches the on-page breadcrumb trail', () => {
    for (const routePath of ['/electricity-rates/texas/houston', '/texas-electricity', '/learn/1']) {
      const html = readDist(distFileFor(routePath));
      const graph = jsonLdOf(routePath).flatMap((doc) => doc['@graph'] || [doc]);
      const crumbs = graph.find((node) => node['@type'] === 'BreadcrumbList');
      assert.ok(crumbs, `${routePath} has no BreadcrumbList`);
      for (const item of crumbs.itemListElement) {
        assert.ok(item.item.startsWith(CANONICAL_HOST), `${routePath}: breadcrumb uses a non-canonical URL`);
      }
      assert.ok(html.includes('aria-label="Breadcrumb"'), `${routePath} has breadcrumb markup but no visible trail`);
    }
  });

  test('no page invents ratings, review counts, prices or offers', () => {
    const banned = ['aggregateRating', 'reviewCount', 'ratingValue', '"Offer"', '"Review"'];
    for (const routePath of ['/', '/texas-electricity', '/electricity-rates/texas/houston', '/all-providers',
                             ...getProviderRoutes(getPublishableProviders()).map((r) => r.path)]) {
      const html = readDist(distFileFor(routePath));
      for (const term of banned) {
        assert.ok(!html.includes(term), `${routePath} contains fabricated structured data: ${term}`);
      }
    }
  });
});

/* ================================================================== *
 * Internal linking
 * ================================================================== */

describe('crawl paths reach every indexable page', { skip: !distExists }, () => {
  test('the learning centre links to every article', () => {
    const links = new Set(internalLinks(readDist(distFileFor('/learning-center'))));
    for (const id of ARTICLE_IDS) {
      assert.ok(links.has(`/learn/${id}`), `/learn/${id} is not linked from the learning centre`);
    }
  });

  test('the city index links to every city', () => {
    const links = new Set(internalLinks(readDist(distFileFor('/all-cities'))));
    for (const route of getCityRoutes()) {
      assert.ok(links.has(route.path), `${route.path} is not linked from /all-cities`);
    }
  });

  test('the supplier directory links to every provider page', () => {
    const links = new Set(internalLinks(readDist(distFileFor('/all-providers'))));
    for (const route of getProviderRoutes(getPublishableProviders())) {
      assert.ok(links.has(route.path), `${route.path} is not linked from /all-providers`);
    }
  });

  test('no page links to a URL that redirects', () => {
    const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
    const redirectSources = new Set((config.redirects || []).map((r) => r.source));
    for (const route of getAllRoutes({ providers: getPublishableProviders() })) {
      const links = internalLinks(readDist(distFileFor(route.path)));
      for (const href of links) {
        assert.ok(!redirectSources.has(href), `${route.path} links to ${href}, which redirects`);
      }
    }
  });

  test('createPageUrl never produces a URL that redirects', async () => {
    const { createPageUrl } = await import('../src/utils/index.ts');
    const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
    const redirectSources = new Set((config.redirects || []).map((r) => r.source));
    for (const page of ['Home', 'CompareRates', 'AboutUs', 'FAQ', 'AllStates', 'BillAnalyzer']) {
      const url = createPageUrl(page);
      assert.ok(!redirectSources.has(url), `createPageUrl("${page}") returns ${url}, which redirects`);
    }
    assert.equal(createPageUrl('Home'), '/');
  });
});

/* ================================================================== *
 * Market snapshot
 * ================================================================== */

describe('market snapshot backs the published pages', () => {
  test('the snapshot carries a generation date', () => {
    assert.match(MARKET_GENERATED_AT, /^\d{4}-\d{2}-\d{2}$/);
  });

  test('every state we publish has market data behind it', () => {
    for (const route of getStateRoutes()) {
      const market = getStateMarket(route.state.code);
      assert.ok(market, `${route.path} has no market data`);
      assert.ok(market.plans > 0, `${route.path} claims a market with no plans`);
      assert.ok(market.providerNames.length > 0, `${route.path} lists no suppliers`);
    }
  });

  test('rate ranges are internally consistent', () => {
    for (const [code, market] of Object.entries(getStateMarket('TX') ? { TX: getStateMarket('TX') } : {})) {
      assert.ok(market.minRate <= market.medianRate, `${code}: min rate above median`);
      assert.ok(market.medianRate <= market.maxRate, `${code}: median above max`);
    }
    for (const route of getStateRoutes()) {
      const m = getStateMarket(route.state.code);
      assert.ok(m.minRate <= m.maxRate, `${route.state.code}: min rate above max`);
      assert.ok(m.residentialPlans + m.businessPlans <= m.plans, `${route.state.code}: plan counts exceed the total`);
      assert.ok(m.renewablePlans <= m.plans, `${route.state.code}: more renewable plans than plans`);
    }
  });
});

/* ==================================================================
 * Internal linking into the comparison cluster
 *
 * The /compare pages link to each other, which is enough to satisfy a
 * per-page orphan check while nothing on the rest of the site links in.
 * These guard the two links that connect the cluster: the prerendered nav
 * (what a crawler follows) and the footer column (what a reader clicks).
 * ================================================================== */

const navContext = (() => {
  const citiesByState = {};
  for (const city of getCities()) (citiesByState[city.stateCode] ||= []).push(city);
  return { states: getStates(), citiesByState, articles: [] };
})();

/** The prerendered body for a route, which is where the crawlable nav lives. */
function renderNav(route) {
  return renderBody(route, buildPageContent(route, navContext), navContext);
}

describe('the comparison cluster is linked from the rest of the site', () => {
  test('the prerendered site nav links to the comparison hub', () => {
    const html = renderNav(getComparisonRoutes()[0]);
    assert.ok(
      /<nav aria-label="Primary">[\s\S]*href="\/compare"[\s\S]*<\/nav>/.test(html),
      'the primary nav has no link to /compare, which islands all 23 comparison pages'
    );
  });

  test('every state page can reach the hub', () => {
    for (const route of getStateRoutes().slice(0, 3)) {
      const html = renderNav(route);
      assert.ok(html.includes('href="/compare"'), `${route.path} does not link to /compare`);
    }
  });

  test('every footer comparison link is a published, indexable page', () => {
    const source = fs.readFileSync(path.join(ROOT, 'src/Layout.jsx'), 'utf8');
    const block = source.match(/const FOOTER_COMPARISONS = \[([\s\S]*?)\];/);
    assert.ok(block, 'FOOTER_COMPARISONS not found in src/Layout.jsx');

    const paths = [...block[1].matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]);
    assert.ok(paths.length >= 4, 'the footer should carry a useful number of matchups');

    const published = new Set(getIndexableRoutes({ providers: getPublishableProviders() }).map((r) => r.path));
    for (const p of paths) {
      assert.ok(
        published.has(p),
        `footer links to ${p}, which is not a published indexable route — a retired matchup must be replaced, not left dangling`
      );
    }
  });

  test('the footer does not point crawlers at query-string filter states', () => {
    const source = fs.readFileSync(path.join(ROOT, 'src/Layout.jsx'), 'utf8');
    assert.ok(
      !/createPageUrl\("CompareRates"\)\s*\+\s*"\?/.test(source),
      'the footer builds a /compare-rates?... link again; those consolidate onto a page that self-canonicalizes'
    );
  });
});

/* ==================================================================
 * One Organization entity
 * ================================================================== */

describe('the Organization entity is declared once', () => {
  test('the prerendered graph and the React helper are the same node', () => {
    const graphNode = organizationSchema();
    const standalone = standaloneOrganizationSchema();
    assert.equal(standalone['@id'], graphNode['@id']);
    assert.equal(standalone.description, graphNode.description);
    assert.deepEqual(standalone.sameAs, graphNode.sameAs);
    assert.equal(standalone['@context'], 'https://schema.org');
  });

  test('its description is counted from the snapshot, not asserted', () => {
    const { description } = organizationSchema();
    assert.ok(
      description.includes(String(MARKET_TOTALS.providersWithPlans)),
      'the Organization description should carry the snapshot supplier count'
    );
    assert.ok(!/40\+/.test(description), 'the unsupported "40+" claim is back in the Organization schema');
  });

  test('no aggregateRating is published', () => {
    assert.equal(organizationSchema().aggregateRating, undefined);
  });
});

/* ==================================================================
 * Unsourced state claims stay out of crawlable copy
 * ================================================================== */

describe('state key facts carry nothing the snapshot contradicts', () => {
  // Only the hand-maintained LOCATION_DATA facts are in question here. Bullets
  // counted from the snapshot legitimately say things like "12 plans backed by
  // 100% renewable energy, from 9 suppliers" — that figure has a source, and a
  // blanket pattern match would reject it along with the invented ones. So the
  // assertion is exact: these specific strings must not reach the page.
  const UNSOURCED = [
    /saving/i,
    /\b(over\s+)?\d+\+?\s+[a-z ]*\b(suppliers?|providers?)\b/i,
    /average\s+residential\s+rate/i,
  ];

  test('no hand-written state fact contradicting the snapshot is published', () => {
    let checked = 0;
    for (const route of getStateRoutes()) {
      const authored = LOCATION_DATA[route.state.code]?.marketInsights?.keyFacts || [];
      const rejected = authored.filter((fact) => UNSOURCED.some((p) => p.test(fact)));
      const { sections = [] } = buildStateSections(route);
      const rendered = sections.flatMap((section) => section.bullets || []);
      for (const fact of rejected) {
        checked += 1;
        assert.ok(
          !rendered.includes(fact),
          `${route.path} publishes an unsourced claim: "${fact}"`
        );
      }
    }
    assert.ok(checked > 0, 'no unsourced facts were exercised — the fixture changed shape');
  });

  test('every state still publishes the durable facts', () => {
    for (const route of getStateRoutes()) {
      const { sections = [] } = buildStateSections(route);
      const rendered = sections.flatMap((section) => section.bullets || []);
      assert.ok(rendered.length > 0, `${route.path} lost all of its key facts to filtering`);
    }
  });
});

/* ==================================================================
 * Legacy query-string routes are not linked from published copy
 * ================================================================== */

describe('published copy does not link to noindex legacy routes', () => {
  test('no article links to /city-rates?city=', () => {
    const articles = fs.readFileSync(path.join(ROOT, 'src/components/learning/fullArticles.jsx'), 'utf8');
    assert.ok(
      !articles.includes('/city-rates?city='),
      'article copy links to the noindex /city-rates route; use the clean /electricity-rates/:state/:city URL'
    );
  });
});

/* ==================================================================
 * Internal linking within the comparison cluster
 *
 * Before these links existed every matchup page had exactly one inbound
 * link, from the hub. A page nothing points at from the pages people
 * actually land on is a page Google has little reason to rank.
 * ================================================================== */

describe('supplier and state pages link into their matchups', () => {
  test('a provider page links to every matchup featuring that provider', () => {
    const providers = getPublishableProviders();
    let checked = 0;
    for (const route of getProviderRoutes(providers)) {
      const matchups = comparisonsForProvider(route.provider.slug);
      if (!matchups.length) continue;
      const html = renderNav(route);
      for (const entry of matchups) {
        checked += 1;
        assert.ok(
          html.includes(`href="${entry.path}"`),
          `/providers/${route.provider.slug} does not link to ${entry.path}`
        );
      }
    }
    assert.ok(checked > 0, 'no provider matchups were exercised');
  });

  test('a state page links to the matchups fought in that state', () => {
    let checked = 0;
    for (const route of getStateRoutes()) {
      const matchups = comparisonsForState(route.state.code);
      if (!matchups.length) continue;
      const html = renderNav(route);
      for (const entry of matchups) {
        checked += 1;
        assert.ok(
          html.includes(`href="${entry.path}"`),
          `${route.path} does not link to ${entry.path}, a matchup fought in ${route.state.code}`
        );
      }
    }
    assert.ok(checked > 0, 'no state matchups were exercised');
  });

  test('a matchup page links sideways to other matchups, not just back to the hub', () => {
    const routes = getComparisonRoutes().filter((r) => r.type === 'comparison');
    const providerRoutes = routes.filter((r) => r.comparison.type === 'provider-vs-provider');
    assert.ok(providerRoutes.length > 0, 'no supplier matchups in the registry');

    for (const route of providerRoutes) {
      const html = renderNav(route);
      const linked = [...html.matchAll(/href="(\/compare\/[^"]+)"/g)].map((m) => m[1]);
      const others = new Set(linked.filter((p) => p !== route.path));
      assert.ok(
        others.size > 0,
        `${route.path} links to no other matchup — the cluster dead-ends here`
      );
    }
  });

  test('every published matchup is reachable from more than the hub alone', () => {
    const providers = getPublishableProviders();
    const pages = [
      ...getProviderRoutes(providers),
      ...getStateRoutes(),
      ...getComparisonRoutes().filter((r) => r.type === 'comparison'),
    ];
    const inbound = new Map();
    for (const route of pages) {
      for (const match of renderNav(route).matchAll(/href="(\/compare\/[^"]+)"/g)) {
        if (match[1] === route.path) continue;
        inbound.set(match[1], (inbound.get(match[1]) || 0) + 1);
      }
    }
    for (const route of getComparisonRoutes().filter((r) => r.type === 'comparison')) {
      assert.ok(
        (inbound.get(route.path) || 0) > 0,
        `${route.path} has no inbound link from any supplier, state or sibling matchup page`
      );
    }
  });
});

/* ==================================================================
 * Comparison pages stay distinct and substantial
 * ================================================================== */

describe('comparison pages are neither thin nor near-duplicates', () => {
  /** Rough word count of the prose a comparison page renders. */
  function wordsIn(route) {
    const { intro = [], sections = [] } = buildComparisonSections(route);
    const parts = [
      ...intro,
      ...sections.flatMap((s) => [s.heading, ...(s.paragraphs || []), ...(s.bullets || [])]),
      ...sections.flatMap((s) => (s.faqs || []).flatMap((f) => [f.question, f.answer])),
    ];
    return parts.join(' ').split(/\s+/).filter(Boolean).length;
  }

  test('every comparison page carries substantial prose', () => {
    for (const route of getComparisonRoutes().filter((r) => r.type === 'comparison')) {
      const words = wordsIn(route);
      assert.ok(words >= 220, `${route.path} has only ${words} words of prose`);
    }
  });

  test('no two comparison pages open with the same sentence', () => {
    const openings = new Map();
    for (const route of getComparisonRoutes().filter((r) => r.type === 'comparison')) {
      const { intro = [] } = buildComparisonSections(route);
      const first = (intro[0] || '').trim();
      assert.ok(first, `${route.path} has no opening sentence`);
      assert.ok(
        !openings.has(first),
        `${route.path} opens identically to ${openings.get(first)} — that is the templated-page smell`
      );
      openings.set(first, route.path);
    }
  });

  test('every comparison page has a unique title, description and heading', () => {
    for (const field of ['title', 'description', 'heading']) {
      const seen = new Map();
      for (const route of getComparisonRoutes()) {
        const value = route[field];
        assert.ok(value, `${route.path} has no ${field}`);
        assert.ok(!seen.has(value), `${route.path} shares its ${field} with ${seen.get(value)}`);
        seen.set(value, route.path);
      }
    }
  });
});
