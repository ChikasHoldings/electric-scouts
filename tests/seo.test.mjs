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
  getUtilityRoutes,
  getArticleRouteList,
  STATIC_ROUTES,
} from '../src/seo/routes.js';
import { ARTICLE_IDS, ARTICLE_SLUGS, articlePath } from '../src/seo/articles.js';
import { TITLE_MAX } from '../src/seo/site.js';
import { buildSitemapEntries, buildSitemapXml } from '../src/seo/sitemap.js';
import { getPublishableProviders, getAllProviders, MARKET_GENERATED_AT, MARKET_TOTALS, getStateMarket, providersInState, renewableProvidersInState } from '../src/seo/market.js';
import { buildCitySections, buildStateSections, buildProviderSections, buildComparisonSections, buildUtilitySections } from '../src/seo/content.js';
import { createResolver, parseHtml } from '../src/seo/audit.mjs';
import { buildPageContent, renderBody } from '../src/seo/render.js';
import { organizationSchema, standaloneOrganizationSchema } from '../src/seo/organization.js';
import { getStates, getCities } from '../src/seo/locations.js';
import { LOCATION_DATA } from '../src/components/location/locationData.js';
import { comparisonsForProvider, comparisonsForState } from '../src/seo/comparisons.js';
import { getUtilities, utilitiesForState, utilityForCity } from '../src/seo/utilities.js';
import { relatedArticles, articlesForState } from '../src/seo/articleLinks.js';
import { loadSeoData } from '../src/seo/data.mjs';
import { getCityUrl, stateSlugFor } from '../src/utils/cityUrls.js';

const { fullArticles: seoArticles } = await loadSeoData();
const articleRoutes = getArticleRouteList(seoArticles);

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
    // Articles are published at their keyword slug. The sitemap must advertise
    // the canonical form only: a /learn/<id> URL in here would be asking Google
    // to crawl a redirect, and a slug with no article behind it would be the
    // soft 404 this suite exists to prevent.
    const slugs = new Set(Object.values(ARTICLE_SLUGS));
    const articleLocs = entries.map((e) => e.loc).filter((loc) => loc.includes('/learn/'));
    for (const loc of articleLocs) {
      const identifier = loc.split('/learn/')[1];
      assert.doesNotMatch(identifier, /^\d+$/, `${loc} is a legacy id URL, not the canonical slug`);
      assert.ok(slugs.has(identifier), `${loc} has no article behind it`);
    }
    assert.equal(articleLocs.length, ARTICLE_IDS.length);
  });

  test('every legacy /learn/<id> URL 301s to its slug', () => {
    // The numeric URLs are what Google already has indexed and what existing
    // links point at. Without a redirect for each one they become 73 dead URLs
    // and 73 orphaned slugs, and the equity on both halves is lost.
    const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
    const redirects = new Map(
      vercelConfig.redirects
        .filter((entry) => /^\/learn\/\d+$/.test(entry.source))
        .map((entry) => [entry.source, entry])
    );
    assert.equal(redirects.size, ARTICLE_IDS.length, 'article redirect count has drifted');
    for (const id of ARTICLE_IDS) {
      const entry = redirects.get(`/learn/${id}`);
      assert.ok(entry, `/learn/${id} has no redirect`);
      assert.equal(entry.destination, `/learn/${ARTICLE_SLUGS[id]}`, `/learn/${id} points at the wrong slug`);
      assert.equal(entry.permanent, true, `/learn/${id} must be a 301, not a 302`);
    }
  });

  test('article dates are recorded, plausible, and still describe the article', async () => {
    // src/seo/articleDates.js is a snapshot of git history (Vercel clones at
    // depth 1, so it cannot be computed during the build). The hash is what
    // stops it going stale: edit an article without re-running
    // scripts/refresh-article-dates.mjs and this fails rather than shipping a
    // dateModified that quietly contradicts the page.
    const { ARTICLE_DATES } = await import('../src/seo/articleDates.js');
    const { hashBlocks } = await import('../scripts/refresh-article-dates.mjs');
    const source = fs.readFileSync(
      path.join(ROOT, 'src/components/learning/fullArticles.jsx'),
      'utf8'
    );
    const current = hashBlocks(source);
    const today = new Date().toISOString().slice(0, 10);

    for (const id of ARTICLE_IDS) {
      const entry = ARTICLE_DATES[id];
      assert.ok(entry, `article ${id} has no recorded dates`);
      const [published, modified, hash] = entry;
      assert.match(published, /^\d{4}-\d{2}-\d{2}$/, `article ${id} datePublished is not an ISO date`);
      assert.match(modified, /^\d{4}-\d{2}-\d{2}$/, `article ${id} dateModified is not an ISO date`);
      assert.ok(published <= today, `article ${id} claims to be published in the future`);
      assert.ok(modified <= today, `article ${id} claims to be modified in the future`);
      assert.ok(modified >= published, `article ${id} was modified before it was published`);
      assert.equal(
        hash,
        current[id],
        `article ${id} has changed since its dates were recorded — run "node scripts/refresh-article-dates.mjs"`
      );
    }
  });

  test('every article has a slug, and no two share one', () => {
    const slugs = ARTICLE_IDS.map((id) => ARTICLE_SLUGS[id]);
    for (const [index, slug] of slugs.entries()) {
      assert.ok(slug, `article ${ARTICLE_IDS[index]} has no slug`);
      assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${slug} is not a clean slug`);
      assert.doesNotMatch(slug, /^\d+$/, `${slug} is still numeric`);
      // A year in a permanent URL dates the page the moment it turns over.
      assert.doesNotMatch(slug, /-20\d\d(?:-|$)/, `${slug} pins a year into a permanent URL`);
    }
    assert.equal(new Set(slugs).size, slugs.length, 'two articles share a slug');
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
    ['article page', articlePath(1)],
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
    for (const routePath of ['/', '/compare-rates', '/texas-electricity', articlePath(1)]) {
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

describe('no page offers a switch where retail choice does not exist', () => {
  // Ten cities on this site are served by a municipal utility or sit outside
  // the competitive market, and every one of their pages was telling residents
  // they could choose a supplier and offering them the statewide plan count.
  // That is the one fact those readers came to find out, answered backwards —
  // and a page that cannot deliver what its title promises is exactly what
  // Google's helpful-content systems are built to demote.
  const routes = getCityRoutes();
  const noChoice = routes.filter((route) => route.city.noRetailChoice);
  const OFFERS_A_SWITCH = /\bcompare\b|\bswitch(?:ing)?\b|\bchoose (?:your|a) supplier\b|\bcompeting (?:suppliers?|retailers?|providers?)\b|\bshop\b/i;

  test('the list is populated and every entry carries a reason', () => {
    assert.ok(noChoice.length >= 7, `only ${noChoice.length} cities flagged`);
    for (const route of noChoice) {
      const status = route.city.noRetailChoice;
      assert.ok(status.utility, `${route.path} has no utility named`);
      assert.ok(status.reason && status.reason.length > 80, `${route.path} reason is too thin to be useful`);
      assert.ok(['municipal', 'regulated'].includes(status.kind), `${route.path} has an unknown kind`);
    }
  });

  test('their titles and descriptions do not promise a comparison', () => {
    for (const route of noChoice) {
      assert.doesNotMatch(route.title, /^Compare/i, `${route.path} title offers a comparison`);
      assert.doesNotMatch(
        route.description,
        /Compare \d+ .* plans/i,
        `${route.path} description offers plans that are not sold there`
      );
      assert.doesNotMatch(route.heading, /^Compare/i, `${route.path} H1 offers a comparison`);
    }
  });

  test('they explain why instead, and say who sets the rate', () => {
    for (const route of noChoice) {
      const content = buildCitySections(route, { citiesByState: {} });
      const headings = content.sections.map((section) => section.heading);
      assert.ok(
        headings.some((heading) => /cannot switch/i.test(heading)),
        `${route.path} never explains that switching is not possible`
      );
      const faqs = content.sections.flatMap((section) => section.faqs || []);
      assert.ok(faqs.length >= 3, `${route.path} has too few FAQs`);
      assert.ok(
        faqs.some((faq) => /can i choose my electricity supplier/i.test(faq.question)),
        `${route.path} does not answer the question its readers actually have`
      );
      // The intro must not open on the statewide plan count, which reads as an offer.
      assert.ok(
        !/Electric Scouts tracks \d+ active/.test(content.intro.join(' ')),
        `${route.path} opens by advertising plans it cannot sell`
      );
    }
  });

  test('they do not link to the comparison engine as a next step', () => {
    for (const route of noChoice) {
      const content = buildCitySections(route, { citiesByState: {} });
      const links = content.sections.flatMap((section) => section.links || []).map(([href]) => href);
      for (const dead of ['/compare-rates', '/renewable-compare-rates', '/business-compare-rates']) {
        assert.ok(!links.includes(dead), `${route.path} sends the reader to ${dead}, which cannot help them`);
      }
    }
  });

  test('the prerendered page says so too', { skip: !distExists }, () => {
    for (const route of noChoice) {
      const html = readDist(distFileFor(route.path));
      assert.match(html, /cannot switch/i, `${route.path} does not say it in the served HTML`);
      assert.ok(
        html.includes(route.city.noRetailChoice.utility),
        `${route.path} does not name ${route.city.noRetailChoice.utility}`
      );
    }
  });

  test('a competitive city is untouched by all of this', () => {
    const houston = routes.find((route) => route.city.name === 'Houston');
    assert.ok(!houston.city.noRetailChoice);
    assert.match(houston.title, /^Compare/);
    const content = buildCitySections(houston, { citiesByState: {} });
    const links = content.sections.flatMap((section) => section.links || []).map(([href]) => href);
    assert.ok(links.includes('/compare-rates'), 'a competitive city lost its comparison link');
    assert.ok(OFFERS_A_SWITCH.test(JSON.stringify(content)), 'a competitive city stopped offering a switch');
  });
});

describe('metadata fits the result Google renders', () => {
  // 107 titles were over the width Google renders, every one of them because
  // of the " | Electric Scouts" suffix rather than the title itself, and 62
  // descriptions were using barely two thirds of the space available. Both are
  // enforced here so neither drifts back.
  const routes = getIndexableRoutes({
    providers: getPublishableProviders(),
    fullArticles: seoArticles,
  });

  test('no title is truncated', () => {
    const over = routes
      .filter((route) => route.title.length > TITLE_MAX)
      .map((route) => `${route.title.length} ${route.path}: ${route.title}`);
    assert.deepEqual(over, [], 'titles over the render width');
  });

  test('no description overruns the snippet', () => {
    // A couple of characters past DESCRIPTION_MAX costs a partial word at most,
    // so the enforced ceiling has a little headroom over the target.
    const over = routes
      .filter((route) => route.description.length > 160)
      .map((route) => `${route.description.length} ${route.path}`);
    assert.deepEqual(over, [], 'descriptions over the snippet width');
  });

  test('no two indexable pages share a title or a description', () => {
    for (const field of ['title', 'description']) {
      const seen = new Map();
      const clashes = [];
      for (const route of routes) {
        const value = route[field];
        if (seen.has(value)) clashes.push(`${seen.get(value)} and ${route.path} share a ${field}`);
        else seen.set(value, route.path);
      }
      assert.deepEqual(clashes, []);
    }
  });

  test('the brand is dropped only when it would not fit', () => {
    for (const route of routes) {
      if (route.title.includes('Electric Scouts')) continue;
      assert.ok(
        route.title.length + ' | Electric Scouts'.length > TITLE_MAX,
        `${route.path} dropped the brand but had room: ${route.title}`
      );
    }
  });
});

describe('city pages offer an image to the crawler', () => {
  // Every prerendered page carried zero <img> elements, so nothing on this site
  // was eligible for image search and no page could hand Google a primary image.
  //
  // The data was worse than missing, though. Two generic stock photographs were
  // shared across 105 of the 144 cities, and each page captioned the one it got
  // as that city's skyline — a single image asserting it was both Parma, Ohio
  // and Sugar Land, Texas. Publishing that is a false claim and 105 duplicate
  // images, so the shared photos were removed rather than rendered: 40 cities
  // have a photograph of their own and those are the ones that get one.
  const cityRoutes = getCityRoutes();
  const withImage = cityRoutes.filter((route) => route.city.image);

  const graphOf = (routePath) =>
    tag
      .jsonLd(readDist(distFileFor(routePath)))
      .map((raw) =>
        JSON.parse(raw.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\u0026/g, '&'))
      )
      .flatMap((doc) => doc['@graph'] || [doc]);

  test('no photograph is shared between two cities', () => {
    const seen = new Map();
    const shared = [];
    for (const route of withImage) {
      if (seen.has(route.city.image)) {
        shared.push(`${seen.get(route.city.image)} and ${route.path}`);
      } else {
        seen.set(route.city.image, route.path);
      }
    }
    assert.deepEqual(shared, [], 'the same image is published as two different cities');
  });

  test('enough cities carry one to be worth having', () => {
    assert.ok(withImage.length >= 30, `only ${withImage.length} cities have an image`);
  });

  test('the prerendered HTML renders it with alt text', { skip: !distExists }, () => {
    for (const route of withImage.slice(0, 12)) {
      const html = readDist(distFileFor(route.path));
      const img = html.match(/<img\s[^>]*>/);
      assert.ok(img, `${route.path} renders no <img>`);
      assert.match(img[0], /alt="[^"]+"/, `${route.path} image has no alt text`);
      // The src is HTML-escaped in the document, so compare against that form.
      assert.ok(
        img[0].includes(route.city.image.replace(/&/g, '&amp;')),
        `${route.path} renders an image that is not the city's own`
      );
      // "skyline" asserted what the photo shows, which we do not know.
      assert.doesNotMatch(img[0], /alt="[^"]*skyline/i, `${route.path} alt claims the photo is a skyline`);
    }
  });

  test('a city with no photograph of its own renders none', { skip: !distExists }, () => {
    const without = cityRoutes.filter((route) => !route.city.image);
    for (const route of without.slice(0, 8)) {
      const html = readDist(distFileFor(route.path));
      assert.ok(!/<img\s/.test(html), `${route.path} has no image of its own but renders one`);
    }
  });

  test('the image is declared as the page primary image', { skip: !distExists }, () => {
    for (const route of withImage.slice(0, 6)) {
      const node = graphOf(route.path).find((entry) => entry['@type'] === 'ImageObject');
      assert.ok(node, `${route.path} declares no ImageObject`);
      assert.equal(node.url, route.city.image);
      assert.ok(node.caption, `${route.path} ImageObject has no caption`);
    }
  });

  test('a page with its own photo does not claim the placeholder dimensions', { skip: !distExists }, () => {
    // og:image:width/height describe the authored 1200x630 placeholder set. A
    // city photo is a different shape, so it must ship without them rather
    // than with a size that is wrong.
    const html = readDist(distFileFor(withImage[0].path));
    assert.ok(html.includes('og:image'), 'no og:image at all');
    assert.ok(!html.includes('og:image:width'), 'city page asserts placeholder dimensions for its own photo');
  });
});

describe('no unsourced savings or review claims reach a page', () => {
  // This site holds plan rates. It does not hold anybody's bill, the utility
  // default rate, a switched customer's before-and-after, or a single review —
  // so a savings figure or a star rating is not a number it can produce. These
  // had accumulated in the footer of every page, the homepage hero, the
  // Organization JSON-LD, the About page's trust strip, and as a fabricated
  // per-city "potential savings" on all 144 rows of the city index.
  //
  // For a site in a financial category these are the claims that cost trust
  // with readers and with Google's quality systems, so the rule is enforced
  // rather than remembered.
  const SOURCE_DIRS = ['src/pages', 'src/components', 'src/seo'];
  const CLAIMS = [
    { pattern: /save\s+(?:up\s+to\s+)?\$\s?\d/i, what: 'a savings figure in dollars' },
    { pattern: /\bavg\.?\s+annual\s+savings\b/i, what: 'an average annual savings claim' },
    // Only when a figure is attached: /savings-calculator computes a number
    // from the visitor's own rate and usage, which is arithmetic on their
    // input rather than a claim this site is making.
    { pattern: /\bpotential\s+savings\b[^.]{0,40}\$\s?\d|\$\s?\d[^.]{0,40}\bpotential\s+savings\b/i, what: 'a potential-savings figure' },
    { pattern: /\b\d\.\d\s*(?:★|\/\s*5\b)/, what: 'a star rating' },
    { pattern: /\b\d[\d,]*\s*\+?\s*(?:happy|satisfied)\s+customers\b/i, what: 'a customer count' },
  ];

  /** Source files that render, excluding the article bodies and the admin app. */
  function sourceFiles() {
    const out = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== 'admin' && entry.name !== 'ui') walk(full);
        } else if (/\.(jsx|js)$/.test(entry.name) && entry.name !== 'fullArticles.jsx') {
          out.push(full);
        }
      }
    };
    for (const dir of SOURCE_DIRS) walk(path.join(ROOT, dir));
    return out;
  }

  /** Strip comments so an explanation of a removed claim is not read as one. */
  function stripComments(text) {
    return text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
  }

  for (const { pattern, what } of CLAIMS) {
    test(`no source file states ${what}`, () => {
      const offenders = [];
      for (const file of sourceFiles()) {
        const body = stripComments(fs.readFileSync(file, 'utf8'));
        for (const line of body.split('\n')) {
          if (pattern.test(line)) offenders.push(`${path.relative(ROOT, file)}: ${line.trim().slice(0, 110)}`);
        }
      }
      assert.deepEqual(offenders, [], `unsourced claim(s) found:\n  ${offenders.join('\n  ')}`);
    });
  }

  test('the prerendered HTML states none of them either', { skip: !distExists }, () => {
    const offenders = [];
    for (const routePath of ['/', '/all-cities', '/all-providers', '/about-us', '/texas-electricity', '/electricity-rates/texas/houston']) {
      const html = readDist(distFileFor(routePath));
      for (const { pattern, what } of CLAIMS) {
        if (pattern.test(html)) offenders.push(`${routePath} carries ${what}`);
      }
    }
    assert.deepEqual(offenders, []);
  });
});

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
    for (const url of ['/electricity-rates/texas/houston', articlePath(1), ...getProviderRoutes(getPublishableProviders()).map((r) => r.path)]) {
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
  const articleFiles = ARTICLE_IDS.map((id) => ({ id, file: `learn/${ARTICLE_SLUGS[id]}/index.html` })).filter(
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

  test('article titles carry the brand whenever it fits, and never overflow', () => {
    // The brand is dropped rather than allowed to push a title past the width
    // Google renders — see withBrand() in src/seo/site.js. So the contract is
    // not "always branded", it is "branded unless branding would truncate it".
    // Measured decoded: "&amp;" is five characters in the source and one in the
    // result, and it is the result Google truncates.
    const decode = (value) =>
      value
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    for (const { id, file } of articleFiles) {
      const title = decode(tag.title(readDist(file)));
      assert.ok(title.length <= TITLE_MAX, `/learn/${id} title overflows at ${title.length}: ${title}`);
      if (!title.endsWith('| Electric Scouts')) {
        assert.ok(
          title.length + ' | Electric Scouts'.length > TITLE_MAX,
          `/learn/${id} dropped the brand but had room for it: ${title}`
        );
      }
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
    for (const routePath of ['/electricity-rates/texas/houston', '/texas-electricity', articlePath(1)]) {
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
      assert.ok(links.has(articlePath(id)), `${articlePath(id)} is not linked from the learning centre`);
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
function renderNav(route, extra = {}) {
  const context = { ...navContext, ...extra };
  return renderBody(route, buildPageContent(route, context), context);
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

/* ==================================================================
 * Utility territory pages
 *
 * A new cluster gets the same treatment the comparison cluster needed
 * after the fact: linked in from the pages people land on, distinct from
 * one another, and substantial enough to deserve indexing.
 * ================================================================== */

describe('utility territory pages', () => {
  const utilities = getUtilities();

  test('only utilities with real coverage are published', () => {
    assert.ok(utilities.length > 0, 'no utilities published');
    for (const utility of utilities) {
      assert.ok(
        utility.cities.length >= 3,
        `${utility.path} publishes on ${utility.cities.length} cities — below the coverage bar`
      );
      assert.ok(utility.states.length > 0, `${utility.path} has no state market behind it`);
    }
  });

  test('a shared municipal/deregulated territory is not published as one', () => {
    // "Austin Energy / Oncor" describes a city split between a municipal
    // utility and a deregulated one; which half an address falls in is a ZIP
    // question a static page cannot answer.
    for (const utility of utilities) {
      assert.ok(!utility.name.includes('/'), `${utility.name} is a shared-territory label`);
    }
  });

  test('every utility page carries substantial, distinct prose', () => {
    const openings = new Map();
    for (const route of getUtilityRoutes().filter((r) => r.type === 'utility')) {
      const { intro = [], sections = [] } = buildUtilitySections(route);
      const words = [
        ...intro,
        ...sections.flatMap((s) => [s.heading, ...(s.paragraphs || []), ...(s.bullets || [])]),
        ...sections.flatMap((s) => (s.faqs || []).flatMap((f) => [f.question, f.answer])),
      ].join(' ').split(/\s+/).filter(Boolean).length;
      assert.ok(words >= 300, `${route.path} has only ${words} words`);

      const first = (intro[0] || '').trim();
      assert.ok(first, `${route.path} has no opening sentence`);
      assert.ok(
        !openings.has(first),
        `${route.path} opens identically to ${openings.get(first)}`
      );
      openings.set(first, route.path);
    }
  });

  test('the delivery/supply explanation differs by regulatory model', () => {
    // Texas has no utility default supply at all, the Northeast sells a
    // regulated default, and Illinois and Ohio add municipal aggregation.
    // Writing one explanation for all three would be both less accurate and
    // the templated page this site keeps refusing to publish.
    const byModel = new Map();
    for (const route of getUtilityRoutes().filter((r) => r.type === 'utility')) {
      const { sections } = buildUtilitySections(route);
      const explainer = sections.find((s) => s.bullets && !s.table);
      assert.ok(explainer, `${route.path} has no delivery/supply explanation`);
      byModel.set(route.utility.model, (byModel.get(route.utility.model) || 0) + 1);
    }
    assert.ok(byModel.size >= 3, `expected three regulatory models, saw ${byModel.size}`);
  });

  test('titles and descriptions fit what Google renders', () => {
    for (const route of getUtilityRoutes()) {
      assert.ok(route.title.length <= 70, `${route.path} title is ${route.title.length} chars`);
      assert.ok(
        route.description.length >= 70 && route.description.length <= 165,
        `${route.path} description is ${route.description.length} chars`
      );
    }
  });

  test('every utility page is unique on title, description and heading', () => {
    for (const field of ['title', 'description', 'heading']) {
      const seen = new Map();
      for (const route of getUtilityRoutes()) {
        const value = route[field];
        assert.ok(value, `${route.path} has no ${field}`);
        assert.ok(!seen.has(value), `${route.path} shares its ${field} with ${seen.get(value)}`);
        seen.set(value, route.path);
      }
    }
  });

  test('state pages link to the territories that deliver there', () => {
    let checked = 0;
    for (const route of getStateRoutes()) {
      const territories = utilitiesForState(route.state.code);
      if (!territories.length) continue;
      const html = renderNav(route);
      for (const utility of territories) {
        checked += 1;
        assert.ok(html.includes(`href="${utility.path}"`), `${route.path} does not link to ${utility.path}`);
      }
    }
    assert.ok(checked > 0, 'no state/utility links were exercised');
  });

  test('the prerendered nav reaches the utility hub', () => {
    const html = renderNav(getUtilityRoutes()[0]);
    assert.ok(
      /<nav aria-label="Primary">[\s\S]*href="\/utilities"[\s\S]*<\/nav>/.test(html),
      'the primary nav has no link to /utilities, which islands the whole cluster'
    );
  });

  test('every utility page is reachable from a state or city page', () => {
    const inbound = new Set();
    for (const route of [...getStateRoutes(), ...getCityRoutes()]) {
      for (const match of renderNav(route).matchAll(/href="(\/utilities\/[^"]+)"/g)) {
        inbound.add(match[1]);
      }
    }
    for (const utility of utilities) {
      assert.ok(inbound.has(utility.path), `${utility.path} has no inbound link from a state or city page`);
    }
  });

  test('no utility page claims a delivery charge we do not hold', () => {
    // We hold plan rates, not tariffs. A number presented as a delivery charge
    // would be invented, and this is the family most likely to attract one.
    for (const route of getUtilityRoutes().filter((r) => r.type === 'utility')) {
      const { intro = [], sections = [] } = buildUtilitySections(route);
      const prose = [
        ...intro,
        ...sections.flatMap((s) => [...(s.paragraphs || []), ...(s.bullets || [])]),
        ...sections.flatMap((s) => (s.faqs || []).map((f) => f.answer)),
      ].join(' ');
      assert.ok(
        !/delivery (charge|rate)s? (of|is|are) [\d$]/i.test(prose),
        `${route.path} states a delivery charge figure`
      );
    }
  });
});

/* ==================================================================
 * City pages must not read as copies of each other
 *
 * 81 of the 144 cities share their headline rate with a same-state
 * sibling, and when the state and the rate both match, every sentence
 * derived from them matches too. Lakewood and Parma — same county, same
 * 9.5¢/kWh — once shared 70% of their main content.
 *
 * The fix was to stop restating state-level material in full on every city
 * page and to publish the fields that belong to the city alone. This pins
 * the result: the shared portion is bounded, and the local material has to
 * be there.
 * ================================================================== */

describe('city pages are distinct from their same-state siblings', () => {
  const cities = getCities();

  /** 5-gram Jaccard over a page's prose, the same measure the audit uses. */
  function shingles(text) {
    const words = String(text).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
    const out = new Set();
    for (let i = 0; i + 5 <= words.length; i++) out.add(words.slice(i, i + 5).join(' '));
    return out;
  }
  function similarity(a, b) {
    let shared = 0;
    for (const gram of a) if (b.has(gram)) shared += 1;
    return shared / (a.size + b.size - shared || 1);
  }
  function prose(city) {
    const citiesByState = { [city.stateCode]: cities.filter((c) => c.stateCode === city.stateCode) };
    const { intro = [], sections = [] } = buildCitySections({ city }, { citiesByState });
    return [
      ...intro,
      ...sections.flatMap((s) => [s.heading, ...(s.paragraphs || []), ...(s.bullets || [])]),
      ...sections.flatMap((s) => (s.faqs || []).flatMap((f) => [f.question, f.answer])),
    ].join(' ');
  }

  test('every city publishes the districts only it covers', () => {
    // getCities() used to drop `neighborhoods`, so the one sentence naming
    // them read `undefined` and never rendered on any of the 144 pages.
    for (const city of cities) {
      assert.ok(
        Array.isArray(city.neighborhoods) && city.neighborhoods.length > 0,
        `${city.path} carries no neighbourhoods — the field is being dropped again`
      );
    }
    for (const city of cities.slice(0, 12)) {
      const text = prose(city);
      assert.ok(
        city.neighborhoods.some((area) => text.includes(area)),
        `${city.path} does not name any of its own districts`
      );
    }
  });

  test('same-rate siblings do not read as one page', () => {
    // The hardest case in the data: same state, same headline rate, so every
    // figure-derived sentence is identical and only local material separates
    // them. Bounded rather than eliminated — going below this needs city-level
    // rate data we do not hold, and inventing it is not an option.
    const byState = new Map();
    for (const city of cities) {
      if (!byState.has(city.stateCode)) byState.set(city.stateCode, []);
      byState.get(city.stateCode).push(city);
    }

    let worst = 0;
    let worstPair = null;
    let compared = 0;
    for (const group of byState.values()) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          if (group[i].avgRate !== group[j].avgRate) continue;
          compared += 1;
          const value = similarity(shingles(prose(group[i])), shingles(prose(group[j])));
          if (value > worst) {
            worst = value;
            worstPair = `${group[i].path} ~ ${group[j].path}`;
          }
        }
      }
    }

    assert.ok(compared > 0, 'no same-rate sibling pairs were exercised');
    assert.ok(
      worst < 0.68,
      `${worstPair} is ${worst.toFixed(3)} similar — city pages are drifting back toward templates`
    );
  });

  test('a city page still points at its own utility where we publish one', () => {
    let checked = 0;
    for (const city of cities) {
      const utility = utilityForCity(city);
      if (!utility) continue;
      checked += 1;
      assert.ok(prose(city).includes(utility.name), `${city.path} does not name ${utility.name}`);
    }
    assert.ok(checked > 0, 'no city/utility pairs were exercised');
  });
});

/* ==================================================================
 * Internal link equity
 *
 * A page with one inbound link is a page Google has little reason to
 * crawl often or rank well, however good it is. The 73 guides were the
 * clearest case: the deepest content on the site, the only family with no
 * near-duplicate pairs, and a median of one inbound link each.
 * ================================================================== */

describe('every page family accumulates internal links', () => {
  test('an article route carries the id its related links are keyed on', () => {
    // getArticleRouteList dropped `id`, so relatedArticles() had nothing to
    // look up and the Related Guides block silently rendered empty on all 73.
    for (const route of articleRoutes) {
      assert.ok(route.id != null, `${route.path} has no id`);
    }
  });

  test('every guide links to other guides, and no guide is a dead end', () => {
    for (const route of articleRoutes) {
      const related = relatedArticles(route.id, seoArticles);
      assert.ok(related.length >= 3, `${route.path} suggests only ${related.length} related guides`);
      for (const entry of related) {
        assert.notEqual(String(entry.id), String(route.id), `${route.path} links to itself`);
      }
    }
  });

  test('every guide is suggested by at least one other guide', () => {
    // Relatedness is not symmetric: a broad guide links out generously and can
    // receive nothing back. Reciprocity in relatedArticles() is what stops
    // 17 of the 73 sitting on fewer than three inbound links.
    const suggested = new Set();
    for (const route of articleRoutes) {
      for (const entry of relatedArticles(route.id, seoArticles)) suggested.add(String(entry.id));
    }
    for (const route of articleRoutes) {
      assert.ok(
        suggested.has(String(route.id)),
        `/learn/${route.id} is suggested by no other guide — it can only be reached from the index`
      );
    }
  });

  test('state pages link to the guides written about them', () => {
    let linked = 0;
    for (const route of getStateRoutes()) {
      const guides = articlesForState(route.state.code, seoArticles);
      if (!guides.length) continue;
      linked += 1;
      const html = renderNav(route, { fullArticles: seoArticles });
      for (const guide of guides) {
        assert.ok(html.includes(`href="${guide.path}"`), `${route.path} does not link to ${guide.path}`);
      }
    }
    assert.ok(linked > 0, 'no state matched any guide');
  });

  test('a guide is only claimed by a state it is actually about', () => {
    // Matching on body text would attach any guide mentioning Texas once to
    // the Texas page, spending that page's authority on something a reader
    // did not ask for.
    for (const route of getStateRoutes()) {
      for (const guide of articlesForState(route.state.code, seoArticles)) {
        const haystack = `${guide.title} ${(seoArticles[guide.id].tags || []).join(' ')}`.toLowerCase();
        assert.ok(
          haystack.includes(route.state.name.toLowerCase()),
          `${route.path} claims ${guide.path}, which does not name the state in its title or tags`
        );
      }
    }
  });

  test('a supplier page names the rivals selling in the same states', () => {
    const providers = getPublishableProviders();
    for (const route of getProviderRoutes(providers).slice(0, 10)) {
      const { sections } = buildProviderSections(route);
      const rivals = sections.find((s) => /Other Suppliers Selling Where/.test(s.heading || ''));
      const overlapping = providers.filter(
        (other) =>
          other.slug !== route.provider.slug &&
          other.plans > 0 &&
          (other.planStates || []).some((code) => (route.provider.planStates || []).includes(code))
      );
      if (!overlapping.length) continue;
      assert.ok(rivals, `${route.path} names no overlapping suppliers`);
      for (const [path] of rivals.links) {
        assert.notEqual(path, route.path, `${route.path} lists itself as a rival`);
      }
    }
  });
});

/* ==================================================================
 * Market figures in the React UI
 *
 * The prerendered pages were corrected first, which left the React pages
 * quoting a different set of numbers to the same visitor. Every figure
 * below had drifted: state pages claimed 2-3x the suppliers we hold, and
 * the savings calculator computed against a hand-kept rate table whose
 * "cheapest" Connecticut rate was 23.5¢/kWh against a real 9.8¢.
 * ================================================================== */

describe('the React pages quote the same market figures as the prerendered ones', () => {
  const STATE_PAGES = {
    CT: 'Connecticut', IL: 'Illinois', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', NH: 'NewHampshire', NJ: 'NewJersey', NY: 'NewYork',
    OH: 'Ohio', PA: 'Pennsylvania', RI: 'RhodeIsland', TX: 'Texas',
  };

  function pageSource(file) {
    return fs.readFileSync(path.join(ROOT, `src/pages/${file}Electricity.jsx`), 'utf8');
  }

  test('no state page carries a hardcoded supplier count or rate', () => {
    for (const [code, file] of Object.entries(STATE_PAGES)) {
      const source = pageSource(file);
      for (const field of ['providerCount', 'avgRate', 'avgMonthlyBill', 'avgSavings']) {
        assert.ok(
          !new RegExp(`\\n\\s*${field}:\\s*["'\\d]`).test(source),
          `${file}Electricity.jsx has a hardcoded ${field} — it should come from the snapshot`
        );
      }
      assert.ok(
        source.includes(`getStateMarket("${code}")`),
        `${file}Electricity.jsx does not read the market snapshot`
      );
    }
  });

  test('no state page names a supplier that does not sell there', () => {
    // The hand-kept lists named Liberty Power, Residents Energy, NextEra and
    // others we hold no plans from, in 11 of the 12 states. Clicking one led
    // nowhere.
    for (const [code, file] of Object.entries(STATE_PAGES)) {
      const source = pageSource(file);
      assert.ok(
        !/\n\s*topProviders:\s*\[/.test(source),
        `${file}Electricity.jsx still carries a hand-kept topProviders list`
      );
      assert.ok(
        source.includes(`providersInState("${code}")`),
        `${file}Electricity.jsx does not source its supplier list from the snapshot`
      );
    }
  });

  test('the savings calculator computes against real plan rates', () => {
    const source = fs.readFileSync(path.join(ROOT, 'src/pages/SavingsCalculator.jsx'), 'utf8');
    assert.ok(
      !source.includes('stateData.topProviders'),
      'the calculator still derives market rates from the hand-kept provider table'
    );
    assert.ok(
      source.includes('getStateMarket(stateCode)'),
      'the calculator does not read the market snapshot'
    );
  });

  test('every state we publish has the snapshot fields these pages read', () => {
    for (const code of Object.keys(STATE_PAGES)) {
      const market = getStateMarket(code);
      assert.ok(market, `${code} has no market data`);
      for (const field of ['providers', 'plans', 'minRate', 'medianRate']) {
        assert.ok(market[field] != null, `${code} market is missing ${field}`);
      }
      assert.ok(providersInState(code).length > 0, `${code} lists no suppliers`);
    }
  });

  test('renewable supplier lists name only suppliers selling in that state', () => {
    for (const code of Object.keys(STATE_PAGES)) {
      const inState = new Set(providersInState(code));
      for (const name of renewableProvidersInState(code)) {
        assert.ok(inState.has(name), `${code} lists ${name} as renewable but it has no plans there`);
      }
    }
  });
});

/**
 * Legacy query-param URLs still resolve, and resolve somewhere real.
 *
 * `/city-rates?city=…&state=…` and `/article-detail?…` are in the wild: they
 * are what this site published before the clean URLs existed, so they are what
 * old inbound links and Google's index still point at. Both are noindex now and
 * exist only to forward.
 *
 * `getCityUrl` used to fall back to `/city-rates?city=…&state=…` when it could
 * not place the state — which is the URL the redirect component renders for.
 * Any old link that spelled the state as a slug (`state=ohio`) therefore
 * redirected to itself, forever, and the visitor got a blank page that never
 * resolved. A crawler got the same thing.
 */
describe('legacy URLs forward instead of looping', () => {
  test('a state code, slug or display name all reach the same city page', () => {
    for (const state of ['OH', 'oh', 'ohio', 'Ohio']) {
      assert.equal(
        getCityUrl('Columbus', state),
        '/electricity-rates/ohio/columbus',
        `state="${state}" did not resolve to the Ohio city page`
      );
    }
    assert.equal(getCityUrl('Corpus Christi', 'TX'), '/electricity-rates/texas/corpus-christi');
    assert.equal(getCityUrl('New York City', 'new-york'), '/electricity-rates/new-york/new-york-city');
  });

  test('no input produces a URL that redirects back into the redirect', () => {
    const inputs = [
      ['Columbus', 'ohio'], ['Columbus', 'OH'], ['Columbus', 'Ohio'],
      ['Columbus', 'ZZ'], ['Columbus', ''], ['Columbus', null], ['Columbus', undefined],
      ['', 'OH'], [null, 'OH'], [undefined, 'OH'], ['Nowhere', 'Atlantis'],
    ];
    for (const [city, state] of inputs) {
      const url = getCityUrl(city, state);
      assert.ok(
        !url.startsWith('/city-rates'),
        `getCityUrl(${JSON.stringify(city)}, ${JSON.stringify(state)}) → ${url}, ` +
          'which the redirect component would hand straight back to itself'
      );
      assert.ok(url.startsWith('/'), `${url} is not a site-relative path`);
    }
  });

  test('an unplaceable state lands on the city index rather than nowhere', () => {
    assert.equal(getCityUrl('Columbus', 'ZZ'), '/all-cities');
    assert.equal(getCityUrl('', 'OH'), '/all-cities');
  });

  test('stateSlugFor answers only for states we actually serve', () => {
    assert.equal(stateSlugFor('TX'), 'texas');
    assert.equal(stateSlugFor('rhode island'), 'rhode-island');
    assert.equal(stateSlugFor('CA'), null);
    assert.equal(stateSlugFor(''), null);
    assert.equal(stateSlugFor(null), null);
  });

  test('the redirect components guard the loop themselves', () => {
    const cityRedirect = fs.readFileSync(
      path.join(ROOT, 'src', 'components', 'CityRatesRedirect.jsx'), 'utf8');
    assert.ok(
      cityRedirect.includes('startsWith("/city-rates")'),
      'CityRatesRedirect no longer checks that its target is not itself'
    );
    const articleRedirect = fs.readFileSync(
      path.join(ROOT, 'src', 'components', 'ArticleRedirect.jsx'), 'utf8');
    assert.ok(
      articleRedirect.includes('"slug"') && articleRedirect.includes('"id"'),
      'ArticleRedirect ignores one of the two identifiers legacy links carry'
    );
  });
});

/**
 * One sitemap, and nothing generating a second one in the browser.
 *
 * /sitemap-xml used to build its own copy from the route registry without the
 * provider or article lists, so it published a fraction of the real URL set —
 * and it threw a TypeError on every load assigning to `document.contentType`,
 * which is read-only.
 */
describe('the sitemap has exactly one source', () => {
  test('the preview page reads the published file rather than rebuilding it', () => {
    const source = fs.readFileSync(path.join(ROOT, 'src', 'pages', 'SitemapXML.jsx'), 'utf8');
    assert.ok(source.includes("fetch(\"/sitemap.xml\""), 'the page no longer reads /sitemap.xml');
    // The assignment, not the word — the file explains the old bug in a comment.
    assert.ok(
      !/document\.contentType\s*=/.test(source),
      'the page still assigns to the read-only document.contentType'
    );
    assert.ok(
      !source.includes('generateDynamicSitemap'),
      'the page still builds a second sitemap in the browser'
    );
  });

  test('nothing else generates sitemap XML at runtime', () => {
    const manager = fs.readFileSync(
      path.join(ROOT, 'src', 'components', 'seo', 'SitemapManager.jsx'), 'utf8');
    assert.ok(
      !manager.includes('urlset'),
      'SitemapManager builds sitemap XML again — dist/sitemap.xml is the only sitemap'
    );
  });
});

/**
 * The two browser APIs that are allowed to throw, and must never be called bare.
 *
 * Both of these were live, site-wide crashes, and neither shows up in a desktop
 * Chromium — which is exactly why they survived every sweep until the failing
 * browsers were simulated.
 *
 *   `localStorage` is not "returns null when unavailable". Safari with "Block
 *   All Cookies", older iOS private browsing, in-app webviews and shielded
 *   browsers throw a SecurityError from the property access. Two components did
 *   this during render, and Layout renders both on every page, so the throw
 *   landed above every route and took the whole site to the root error screen.
 *
 *   `scrollTo({behavior: 'instant'})` throws a TypeError on any browser
 *   predating the 2023 enum addition, because that is what WebIDL enum
 *   conversion does with an unknown member. It ran from a Layout effect on
 *   every route change, with the same result.
 */
describe('browser APIs that can throw are never called bare', () => {
  const sourceFiles = (() => {
    const found = [];
    (function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(jsx?|mjs)$/.test(entry.name)) found.push(full);
      }
    })(path.join(ROOT, 'src'));
    return found;
  })();

  // Only the wrapper itself may touch the raw APIs. The comparison engine used
  // to be exempt because it carried its own guard — but that guard covered the
  // property access and not the getItem/setItem calls, which is precisely how
  // /compare-rates and /bill-analyzer kept failing after the first fix.
  const EXEMPT = [path.join('src', 'lib', 'browser.js')];
  const isExempt = (file) => EXEMPT.some((e) => file.includes(e));

  test('no source file reads or writes storage directly', () => {
    const offenders = [];
    for (const file of sourceFiles) {
      if (isExempt(file)) continue;
      const source = fs.readFileSync(file, 'utf8');
      for (const [index, line] of source.split('\n').entries()) {
        if (/\b(local|session)Storage\s*\./.test(line)) {
          offenders.push(`${path.relative(ROOT, file)}:${index + 1}`);
        }
      }
    }
    assert.deepEqual(
      offenders, [],
      'bare storage access — use readStored/writeStored from @/lib/browser, ' +
        'because storage throws rather than returning null when a browser blocks it'
    );
  });

  test('no source file passes behavior:"instant" to scrollTo', () => {
    const offenders = [];
    for (const file of sourceFiles) {
      if (isExempt(file)) continue;
      const source = fs.readFileSync(file, 'utf8');
      for (const [index, line] of source.split('\n').entries()) {
        if (/scrollTo\([^)]*behavior:\s*['"]instant['"]/.test(line)) {
          offenders.push(`${path.relative(ROOT, file)}:${index + 1}`);
        }
      }
    }
    assert.deepEqual(
      offenders, [],
      'use scrollToTopInstantly from @/lib/browser — a browser that does not ' +
        'know the "instant" enum member throws instead of ignoring it'
    );
  });

  test('the wrapper survives storage that throws on every operation', async () => {
    const boom = () => { throw new Error('The operation is insecure.'); };
    const throwing = { getItem: boom, setItem: boom, removeItem: boom };
    const priorWindow = globalThis.window;
    globalThis.window = {
      get localStorage() { throw new Error('SecurityError'); },
      get sessionStorage() { return throwing; },
      scrollTo: boom,
    };
    try {
      const browser = await import(`../src/lib/browser.js?case=throws`);
      assert.equal(browser.readStored('anything'), null);
      assert.equal(browser.readStored('anything', { fallback: 'x' }), 'x');
      assert.equal(browser.writeStored('k', 'v'), false);
      assert.equal(browser.removeStored('k'), false);
      assert.deepEqual(browser.readStoredJson('k', { safe: true }), { safe: true });
      assert.equal(browser.writeStoredJson('k', { a: 1 }), false);
      // Both scroll paths throw; the helper must still return normally.
      browser.scrollToTopInstantly();
    } finally {
      globalThis.window = priorWindow;
    }
  });

  test('corrupt stored JSON falls back instead of throwing', async () => {
    const store = new Map([['good', '{"a":1}'], ['bad', '{not json'], ['null', 'null']]);
    const priorWindow = globalThis.window;
    globalThis.window = {
      localStorage: {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, v),
        removeItem: (k) => store.delete(k),
      },
    };
    globalThis.window.sessionStorage = globalThis.window.localStorage;
    try {
      const browser = await import(`../src/lib/browser.js?case=corrupt`);
      assert.deepEqual(browser.readStoredJson('good', {}), { a: 1 });
      assert.deepEqual(browser.readStoredJson('bad', { fell: 'back' }), { fell: 'back' });
      assert.deepEqual(browser.readStoredJson('null', { fell: 'back' }), { fell: 'back' });
      assert.deepEqual(browser.readStoredJson('missing', []), []);
    } finally {
      globalThis.window = priorWindow;
    }
  });
});
