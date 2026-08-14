#!/usr/bin/env node
/**
 * seo-audit.mjs — crawl the built site and report what a search engine sees.
 *
 * Runs against dist/ after `npm run build`, resolving every URL through the
 * same redirect/filesystem/rewrite order Vercel uses. It exists so claims about
 * this site's SEO are measured rather than asserted: every number in the final
 * report comes out of this script.
 *
 *   node scripts/seo-audit.mjs              human-readable report
 *   node scripts/seo-audit.mjs --json out   also write the full dataset
 *   node scripts/seo-audit.mjs --strict     exit 1 on any P0/P1 finding
 *
 * It crawls three sources so orphan and soft-404 detection actually work:
 *   1. the route registry  (what we intend to publish)
 *   2. the sitemap         (what we ask Google to crawl)
 *   3. link discovery from "/" (what a crawler can actually reach)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalPath, absoluteUrl, SITE_URL } from '../src/seo/site.js';
import { getAllRoutes, getIndexableRoutes } from '../src/seo/routes.js';
import { loadSeoData } from '../src/seo/data.mjs';
import {
  createResolver,
  parseHtml,
  duplicateGroups,
  meanSimilarity,
} from '../src/seo/audit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

/* Thresholds. Deliberately conservative: these flag pages that are genuinely
 * thin or duplicated, not pages that merely differ in style. */
const THIN_MAIN_WORDS = 180;      // unique <main> words below this is thin
const TITLE_MIN = 25;
const TITLE_MAX = 70;
const DESC_MIN = 70;
const DESC_MAX = 165;
const SIMILARITY_WARN = 0.55;     // mean pairwise shingle overlap within a family

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const jsonIndex = args.indexOf('--json');
const JSON_OUT = jsonIndex >= 0 ? args[jsonIndex + 1] : null;

const findings = [];
function flag(severity, code, url, detail) {
  findings.push({ severity, code, url, detail });
}

/* ------------------------------------------------------------------ *
 * Crawl
 * ------------------------------------------------------------------ */

async function main() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('dist/index.html not found — run "npm run build" first.');
    process.exit(2);
  }

  const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const resolve = createResolver({ distDir: DIST, vercelConfig });

  const seoData = await loadSeoData();
  const registryRoutes = getAllRoutes(seoData);
  const indexableRoutes = getIndexableRoutes(seoData);
  const sitemapPaths = new Set(indexableRoutes.map((r) => canonicalPath(r.path)));
  const registryByPath = new Map(registryRoutes.map((r) => [canonicalPath(r.path), r]));

  /** path -> record */
  const pages = new Map();
  /** target path -> set of source paths */
  const inboundLinks = new Map();

  const queue = ['/'];
  const queued = new Set(['/']);
  for (const route of registryRoutes) {
    const p = canonicalPath(route.path);
    if (!queued.has(p)) { queued.add(p); queue.push(p); }
  }
  for (const p of sitemapPaths) {
    if (!queued.has(p)) { queued.add(p); queue.push(p); }
  }

  // Probe URLs that must NOT behave like real pages. These are the soft-404
  // candidates: valid-looking dynamic paths with no record behind them.
  const SOFT_404_PROBES = [
    '/providers/this-provider-does-not-exist',
    '/electricity-rates/texas/not-a-real-city',
    '/electricity-rates/atlantis/springfield',
    '/learn/999999',
    '/this-page-does-not-exist',
  ];
  for (const p of SOFT_404_PROBES) {
    if (!queued.has(p)) { queued.add(p); queue.push(p); }
  }

  while (queue.length) {
    const current = queue.shift();
    const result = resolve(current);

    const record = {
      path: current,
      url: absoluteUrl(current),
      status: result.status,
      kind: result.kind,
      location: result.location,
      inRegistry: registryByPath.has(current),
      inSitemap: sitemapPaths.has(current),
      probe: SOFT_404_PROBES.includes(current),
      // A route that canonicalizes to a different URL is a deliberate duplicate.
      // It is expected to share its title with its canonical, to stay out of the
      // sitemap and to have no inbound links — Search Console reporting it as
      // "Alternate page with proper canonical" is the correct outcome, not a bug.
      isAlias: Boolean(registryByPath.get(current)?.canonical),
    };

    if (result.html) {
      const parsed = parseHtml(result.html);
      Object.assign(record, {
        title: parsed.title,
        description: parsed.description,
        robots: parsed.robots,
        canonical: parsed.canonical,
        ogTitle: parsed.ogTitle,
        ogImage: parsed.ogImage,
        twitterCard: parsed.twitterCard,
        h1s: parsed.h1s,
        h2s: parsed.h2s,
        h3s: parsed.h3s,
        jsonLdTypes: parsed.jsonLd.flatMap(collectTypes),
        jsonLdErrors: parsed.jsonLdErrors,
        prerendered: parsed.prerendered,
        bodyWords: parsed.bodyWords,
        mainWords: parsed.mainWords,
        mainText: parsed.mainText,
        internalLinks: parsed.links
          .map((l) => l.href)
          .filter((href) => href.startsWith('/') && !href.startsWith('//')),
      });

      for (const href of record.internalLinks) {
        const target = canonicalPath(href);
        if (!inboundLinks.has(target)) inboundLinks.set(target, new Set());
        inboundLinks.get(target).add(current);
        // Follow links only into pages we already intend to publish; the crawl
        // is for reachability, not for discovering unknown URL space.
        if (!queued.has(target) && (registryByPath.has(target) || sitemapPaths.has(target))) {
          queued.add(target);
          queue.push(target);
        }
      }
    }

    pages.set(current, record);
  }

  /* ------------------------------------------------------------------ *
   * Checks
   * ------------------------------------------------------------------ */

  const real = [...pages.values()].filter((p) => !p.probe);
  const served = real.filter((p) => p.status === 200);
  const indexable = served.filter((p) => !/noindex/i.test(p.robots || ''));
  const noindexed = served.filter((p) => /noindex/i.test(p.robots || ''));

  for (const page of real) {
    if (page.status === 301 || page.status === 302) {
      if (page.inSitemap) flag('P0', 'sitemap-redirect', page.path, `sitemap URL redirects to ${page.location}`);
      continue;
    }
    if (page.status === 404) {
      if (page.inSitemap) flag('P0', 'sitemap-404', page.path, 'sitemap URL returns 404');
      continue;
    }

    const isIndexable = !/noindex/i.test(page.robots || '');

    if (!page.title) flag('P0', 'missing-title', page.path, 'no <title>');
    if (!page.prerendered) flag('P0', 'no-ssr-content', page.path, `served ${page.kind} shell with no prerendered body`);
    if (isIndexable) {
      if (!page.description) flag('P0', 'missing-description', page.path, 'no meta description');
      if (!page.canonical) flag('P0', 'missing-canonical', page.path, 'no canonical link');
      if (!page.h1s || page.h1s.length === 0) flag('P0', 'missing-h1', page.path, 'no <h1>');
      if (page.h1s && page.h1s.length > 1) flag('P1', 'multiple-h1', page.path, `${page.h1s.length} <h1> elements`);
      if (page.mainWords < THIN_MAIN_WORDS && !page.isAlias) {
        flag('P1', 'thin-content', page.path, `${page.mainWords} unique words in <main>`);
      }
      if (!page.inSitemap && page.inRegistry && !page.isAlias) {
        flag('P1', 'indexable-not-in-sitemap', page.path, 'indexable but absent from sitemap');
      }
      const registryRoute = registryByPath.get(page.path);
      const expectedCanonical = absoluteUrl(registryRoute?.canonical || page.path);
      if (page.canonical && page.canonical !== expectedCanonical) {
        flag('P0', 'canonical-mismatch', page.path, `canonical ${page.canonical} != ${expectedCanonical}`);
      }
      if (page.title && (page.title.length < TITLE_MIN || page.title.length > TITLE_MAX)) {
        flag('P2', 'title-length', page.path, `${page.title.length} chars (target ${TITLE_MIN}-${TITLE_MAX})`);
      }
      if (page.description && (page.description.length < DESC_MIN || page.description.length > DESC_MAX)) {
        flag('P2', 'description-length', page.path, `${page.description.length} chars (target ${DESC_MIN}-${DESC_MAX})`);
      }
      if (!page.jsonLdTypes || !page.jsonLdTypes.length) {
        flag('P2', 'no-structured-data', page.path, 'no JSON-LD');
      }
    }
    if (page.jsonLdErrors && page.jsonLdErrors.length) {
      flag('P0', 'invalid-json-ld', page.path, page.jsonLdErrors.join('; '));
    }
  }

  // Soft 404s: a probe URL that renders like a real page is the failure mode.
  for (const probe of real.length ? [...pages.values()].filter((p) => p.probe) : []) {
    if (probe.status === 200 && !/noindex/i.test(probe.robots || '')) {
      flag('P0', 'soft-404', probe.path, `returns 200 and is indexable (kind=${probe.kind})`);
    }
  }

  // Internal links must not point at redirects or dead ends.
  for (const page of served) {
    for (const href of new Set(page.internalLinks || [])) {
      const target = canonicalPath(href);
      const targetPage = pages.get(target) || resolveOnce(resolve, target, pages);
      if (targetPage.status === 301 || targetPage.status === 302) {
        flag('P1', 'link-to-redirect', page.path, `links to ${href} which redirects to ${targetPage.location}`);
      } else if (targetPage.status === 404) {
        flag('P1', 'link-to-404', page.path, `links to ${href} which 404s`);
      }
    }
  }

  // Orphans: indexable and in the sitemap, but nothing links to it.
  for (const page of indexable) {
    if (page.path === '/' || page.isAlias) continue;
    const inbound = inboundLinks.get(page.path);
    const external = inbound ? [...inbound].filter((src) => src !== page.path) : [];
    page.inboundCount = external.length;
    if (!external.length) flag('P1', 'orphan', page.path, 'no internal links point here');
  }

  // Islands: a group of pages that link to each other but that nothing outside
  // links into. Every page in one has inbound links, so the orphan check above
  // passes on all of them, while a crawler starting at "/" never arrives.
  //
  // This is not hypothetical. The 23 pages under /compare linked to each other
  // — hub to matchup, matchup back to hub — and nothing else on the site linked
  // to any of them. The audit reported zero orphans while the entire cluster
  // was reachable only by reading the sitemap.
  //
  // The crawl above seeds itself from the registry and the sitemap so that
  // every page gets fetched, which means it cannot answer this question. So walk
  // the recorded link graph from "/" instead, and compare.
  const reachable = new Set(['/']);
  const walk = ['/'];
  while (walk.length) {
    const current = walk.shift();
    for (const href of new Set(pages.get(current)?.internalLinks || [])) {
      const target = canonicalPath(href);
      if (reachable.has(target)) continue;
      reachable.add(target);
      walk.push(target);
    }
  }
  for (const page of indexable) {
    if (page.path === '/' || page.isAlias || reachable.has(page.path)) continue;
    flag('P1', 'unreachable', page.path, 'in the sitemap, but no chain of links from / reaches it');
  }

  // Alias pages are excluded: sharing a title with the page you canonicalize to
  // is the point of an alias, and counting it as a duplicate would hide the
  // duplicates that actually matter.
  const canonicalPages = indexable.filter((p) => !p.isAlias);
  const titleDupes = duplicateGroups(canonicalPages, (p) => p.title);
  const descDupes = duplicateGroups(canonicalPages, (p) => p.description);
  const h1Dupes = duplicateGroups(canonicalPages, (p) => (p.h1s || [])[0]);
  for (const [value, members] of titleDupes) {
    flag('P0', 'duplicate-title', members.map((m) => m.path).join(', '), `"${value}"`);
  }
  for (const [value, members] of descDupes) {
    flag('P0', 'duplicate-description', members.map((m) => m.path).join(', '), `"${String(value).slice(0, 60)}…"`);
  }
  for (const [value, members] of h1Dupes) {
    flag('P1', 'duplicate-h1', members.map((m) => m.path).join(', '), `"${value}"`);
  }

  // Template similarity per route family.
  const families = new Map();
  for (const page of canonicalPages) {
    const route = registryByPath.get(page.path);
    const type = route?.type || 'other';
    if (!families.has(type)) families.set(type, []);
    families.get(type).push(page);
  }
  const similarity = {};
  for (const [type, members] of families) {
    if (members.length < 2) continue;
    const score = meanSimilarity(members.map((m) => m.mainText));
    similarity[type] = { pages: members.length, meanSimilarity: Number(score.toFixed(3)) };
    if (score > SIMILARITY_WARN) {
      flag('P1', 'template-similarity', type, `mean pairwise similarity ${score.toFixed(3)} across ${members.length} pages`);
    }
  }

  /* ------------------------------------------------------------------ *
   * Report
   * ------------------------------------------------------------------ */

  const summary = {
    siteUrl: SITE_URL,
    totalUrlsCrawled: real.length,
    served200: served.length,
    indexable: indexable.length,
    aliasPages: indexable.filter((p) => p.isAlias).length,
    noindex: noindexed.length,
    redirects: real.filter((p) => p.status === 301 || p.status === 302).length,
    notFound: real.filter((p) => p.status === 404).length,
    sitemapUrls: sitemapPaths.size,
    missingTitle: count('missing-title'),
    duplicateTitleGroups: titleDupes.length,
    missingDescription: count('missing-description'),
    duplicateDescriptionGroups: descDupes.length,
    missingH1: count('missing-h1'),
    multipleH1: count('multiple-h1'),
    duplicateH1Groups: h1Dupes.length,
    missingCanonical: count('missing-canonical'),
    canonicalMismatch: count('canonical-mismatch'),
    orphanPages: count('orphan'),
    unreachablePages: count('unreachable'),
    thinPages: count('thin-content'),
    pagesWithoutSsrHtml: count('no-ssr-content'),
    softFourOhFours: count('soft-404'),
    linksToRedirects: count('link-to-redirect'),
    invalidJsonLd: count('invalid-json-ld'),
    similarity,
  };

  const byType = {};
  for (const page of served) {
    const type = registryByPath.get(page.path)?.type || 'other';
    byType[type] = (byType[type] || 0) + 1;
  }

  console.log('\n=========== ELECTRIC SCOUTS SEO AUDIT ===========');
  console.log(`canonical host : ${SITE_URL}`);
  console.log(`crawled        : ${summary.totalUrlsCrawled} URLs`);
  console.log(`200 / indexable: ${summary.served200} / ${summary.indexable}`);
  console.log(`noindex        : ${summary.noindex}`);
  console.log(`redirects      : ${summary.redirects}`);
  console.log(`404            : ${summary.notFound}`);
  console.log(`sitemap URLs   : ${summary.sitemapUrls}`);
  console.log('\n-- pages by route family --');
  for (const [type, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    const sim = similarity[type] ? ` (mean similarity ${similarity[type].meanSimilarity})` : '';
    console.log(`  ${type.padEnd(10)} ${String(n).padStart(4)}${sim}`);
  }

  console.log('\n-- metadata --');
  for (const [label, value] of [
    ['missing title', summary.missingTitle],
    ['duplicate title groups', summary.duplicateTitleGroups],
    ['missing description', summary.missingDescription],
    ['duplicate description groups', summary.duplicateDescriptionGroups],
    ['missing H1', summary.missingH1],
    ['multiple H1', summary.multipleH1],
    ['duplicate H1 groups', summary.duplicateH1Groups],
    ['missing canonical', summary.missingCanonical],
    ['canonical mismatch', summary.canonicalMismatch],
    ['orphan pages', summary.orphanPages],
    ['unreachable from /', summary.unreachablePages],
    ['thin pages (<' + THIN_MAIN_WORDS + ' words)', summary.thinPages],
    ['pages without SSR HTML', summary.pagesWithoutSsrHtml],
    ['soft 404s', summary.softFourOhFours],
    ['internal links to redirects', summary.linksToRedirects],
    ['invalid JSON-LD', summary.invalidJsonLd],
  ]) {
    console.log(`  ${String(label).padEnd(34)} ${value}`);
  }

  const bySeverity = { P0: [], P1: [], P2: [] };
  for (const finding of findings) bySeverity[finding.severity].push(finding);

  for (const severity of ['P0', 'P1', 'P2']) {
    const group = bySeverity[severity];
    console.log(`\n-- ${severity} findings: ${group.length} --`);
    const byCode = new Map();
    for (const finding of group) {
      if (!byCode.has(finding.code)) byCode.set(finding.code, []);
      byCode.get(finding.code).push(finding);
    }
    for (const [code, items] of [...byCode.entries()].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${code} (${items.length})`);
      for (const item of items.slice(0, 5)) {
        console.log(`      ${item.url} — ${item.detail}`);
      }
      if (items.length > 5) console.log(`      … ${items.length - 5} more`);
    }
  }

  console.log('\n================================================\n');

  if (JSON_OUT) {
    const payload = {
      generatedAt: new Date().toISOString(),
      summary,
      byType,
      findings,
      pages: real.map(({ mainText, internalLinks, ...rest }) => ({
        ...rest,
        internalLinkCount: (internalLinks || []).length,
      })),
    };
    fs.mkdirSync(path.dirname(path.resolve(JSON_OUT)), { recursive: true });
    fs.writeFileSync(path.resolve(JSON_OUT), JSON.stringify(payload, null, 2));
    console.log(`wrote ${JSON_OUT}`);
  }

  const blocking = bySeverity.P0.length + (STRICT ? bySeverity.P1.length : 0);
  if (blocking) {
    console.error(`SEO audit failed: ${bySeverity.P0.length} P0` + (STRICT ? `, ${bySeverity.P1.length} P1` : ''));
    process.exit(1);
  }

  function count(code) {
    return findings.filter((f) => f.code === code).length;
  }
}

/** Types named anywhere in a JSON-LD document, including inside @graph. */
function collectTypes(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(collectTypes);
  const types = [];
  if (node['@type']) types.push(...[].concat(node['@type']));
  if (node['@graph']) types.push(...collectTypes(node['@graph']));
  return types;
}

/** Resolve and memoize a path we did not queue (link targets outside the set). */
function resolveOnce(resolve, target, pages) {
  const result = resolve(target);
  const record = { path: target, status: result.status, kind: result.kind, location: result.location };
  pages.set(target, record);
  return record;
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
