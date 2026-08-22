#!/usr/bin/env node
/**
 * seo-url-audit.mjs — one audit row for every public URL this site can serve.
 *
 * WHY THIS EXISTS ALONGSIDE seo-audit.mjs
 *
 * seo-audit.mjs answers "are the pages we publish any good?". It crawls the
 * route registry, the sitemap, and whatever link discovery from "/" reaches —
 * which is, by construction, the set of URLs we already meant to publish. Three
 * kinds of URL are therefore invisible to it, and all three are ways a site
 * loses crawl budget or gets the wrong page indexed:
 *
 *  1. The 161 redirect sources in vercel.json. Nothing checks that they land on
 *     a 200 in one hop, that they stay out of the sitemap, or that no page
 *     still links to them. A redirect chain costs a crawl and dilutes the
 *     signal; a redirect to a 404 loses the URL entirely.
 *
 *  2. Files in dist/ that Vercel will serve at a public URL but that no route
 *     record describes — app-shell.html being the one that matters, because it
 *     is an empty React shell that returned 200 with no robots directive and no
 *     canonical. That is an app shell at a public URL: the exact shape this
 *     project spent two rebuilds removing, sitting in the one place the audit
 *     did not look.
 *
 *  3. Redirect destinations and canonical targets, checked as targets rather
 *     than as pages — a canonical pointing at a redirect is not a canonical.
 *
 * So this walks the union of every source that can put a URL in front of a
 * crawler, resolves each one through the same Vercel model the other tools use,
 * and writes one row per URL. The CSV is the artifact; the exit code is the
 * gate.
 *
 *   node scripts/seo-url-audit.mjs                  human-readable report
 *   node scripts/seo-url-audit.mjs --csv out.csv    write the per-URL ledger
 *   node scripts/seo-url-audit.mjs --strict         exit 1 on any P0/P1
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE_URL, absoluteUrl, canonicalPath } from '../src/seo/site.js';
import { getAllRoutes, getIndexableRoutes } from '../src/seo/routes.js';
import { loadSeoData } from '../src/seo/data.mjs';
import { createResolver, parseHtml, shingles, jaccard } from '../src/seo/audit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const flagValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const CSV_OUT = flagValue('--csv');

/**
 * Files dist/ contains that are served at a public URL but are not pages: the
 * generated text artifacts and the icon/manifest set. Everything else that
 * ends in .html and is not a registry route is a page a crawler can reach and
 * has to be accounted for.
 */
const NON_PAGE_FILES = new Set(['/sitemap.xml', '/robots.txt', '/site.webmanifest']);

/**
 * Redirect chains cost one crawl per hop and Google gives up after five. One
 * hop is the contract: a legacy URL points at its final destination, not at
 * another legacy URL.
 */
const MAX_REDIRECT_HOPS = 1;

const findings = [];
const flag = (severity, code, url, detail) => findings.push({ severity, code, url, detail });

/* ------------------------------------------------------------------ *
 * Inventory
 * ------------------------------------------------------------------ */

/** Every .html file in dist/, as the URL Vercel serves it at. */
function servedHtmlPaths(dir = DIST, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      servedHtmlPaths(full, out);
      continue;
    }
    if (!entry.name.endsWith('.html')) continue;
    const rel = `/${path.relative(DIST, full)}`;
    // dist/faq/index.html is served at /faq; dist/404.html only at /404.html.
    out.push(rel.replace(/\/index\.html$/, '') || '/');
  }
  return out;
}

/**
 * The union of every source that can put a URL in front of a crawler, each
 * tagged with where it came from so the report can say why a URL is in scope.
 */
function buildInventory({ routes, sitemapPaths, vercelConfig, linkTargets, canonicalTargets }) {
  /** @type {Map<string, Set<string>>} */
  const inventory = new Map();
  const add = (rawPath, source) => {
    if (!rawPath || !String(rawPath).startsWith('/')) return;
    const url = String(rawPath).split('#')[0].split('?')[0];
    if (!inventory.has(url)) inventory.set(url, new Set());
    inventory.get(url).add(source);
  };

  for (const route of routes) add(route.path, `registry:${route.type}`);
  for (const url of sitemapPaths) add(url, 'sitemap');
  for (const redirect of vercelConfig.redirects || []) {
    // Patterned sources (/learn/:id) cannot be probed as a literal URL; the
    // concrete URLs they cover arrive through the registry and link discovery.
    if (!/[:*]/.test(redirect.source)) add(redirect.source, 'redirect-source');
    if (!/[:*]/.test(redirect.destination)) add(redirect.destination, 'redirect-target');
  }
  for (const rewrite of vercelConfig.rewrites || []) {
    if (!/[:*]/.test(rewrite.source)) add(rewrite.source, 'rewrite-source');
  }
  for (const url of linkTargets) add(url, 'internal-link');
  for (const url of canonicalTargets) add(url, 'canonical-target');
  for (const url of servedHtmlPaths()) add(url, 'served-file');

  return inventory;
}

/* ------------------------------------------------------------------ *
 * Resolution
 * ------------------------------------------------------------------ */

/** Follow a URL to the end of its redirect chain, recording every hop. */
function followChain(resolve, startPath, max = 10) {
  const chain = [];
  let current = startPath;
  for (let i = 0; i <= max; i += 1) {
    const hit = resolve(current);
    chain.push({ path: current, status: hit.status, location: hit.location });
    if (hit.status !== 301 && hit.status !== 302) {
      return { chain, final: hit, finalPath: current, hops: chain.length - 1 };
    }
    if (!hit.location || !hit.location.startsWith('/')) {
      return { chain, final: hit, finalPath: hit.location, hops: chain.length - 1, offsite: true };
    }
    current = hit.location;
  }
  return { chain, final: null, finalPath: current, hops: max, loop: true };
}

/* ------------------------------------------------------------------ *
 * Per-page measurement
 * ------------------------------------------------------------------ */

const attrOf = (tag, name) => {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return match ? (match[2] ?? match[3] ?? '') : undefined;
};

/**
 * Images, measured the way a crawler and Core Web Vitals both care about:
 * alt text presence, and whether the box is reserved before the file loads.
 */
function measureImages(html) {
  const body = (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) || [])[1] || html;
  const tags = [...body.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  let missingAlt = 0;
  let emptyAlt = 0;
  let missingDimensions = 0;
  const alts = [];
  for (const tag of tags) {
    const alt = attrOf(tag, 'alt');
    if (alt === undefined) missingAlt += 1;
    else if (!alt.trim()) emptyAlt += 1;
    else alts.push(alt);
    if (!attrOf(tag, 'width') || !attrOf(tag, 'height')) missingDimensions += 1;
  }
  return { count: tags.length, missingAlt, emptyAlt, missingDimensions, alts };
}

/** Flatten a JSON-LD payload into its entity nodes, @graph included. */
function schemaNodes(jsonLd) {
  const nodes = [];
  for (const block of jsonLd) {
    if (Array.isArray(block)) nodes.push(...block);
    else if (block && block['@graph']) nodes.push(...block['@graph']);
    else if (block) nodes.push(block);
  }
  return nodes;
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

async function main() {
  if (!fs.existsSync(DIST)) {
    console.error('No dist/ — run `npm run build` first.');
    process.exit(2);
  }

  const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const resolve = createResolver({ distDir: DIST, vercelConfig });
  const seoData = await loadSeoData();

  const routes = getAllRoutes(seoData);
  const routeByPath = new Map(routes.map((r) => [r.path, r]));
  const indexablePaths = new Set(getIndexableRoutes(seoData).map((r) => r.path));

  const sitemapXml = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
  const sitemapPaths = new Set(
    [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)
  );

  /* First pass over every served page: the link graph and canonical targets are
   * themselves inventory sources, so they have to be collected before the
   * inventory is complete. */
  const linkTargets = new Set();
  const canonicalTargets = new Set();
  /** @type {Map<string, Set<string>>} target -> pages linking to it */
  const inboundLinks = new Map();
  /** @type {Map<string, {href: string, text: string}[]>} */
  const outboundLinks = new Map();

  for (const servedPath of servedHtmlPaths()) {
    const hit = resolve(servedPath);
    if (!hit.html) continue;
    const parsed = parseHtml(hit.html);
    const links = [];
    for (const link of parsed.links) {
      let href = link.href;
      if (href.startsWith(SITE_URL)) href = new URL(href).pathname;
      if (!href.startsWith('/')) continue;
      const target = href.split('#')[0].split('?')[0];
      linkTargets.add(target);
      links.push({ href: target, text: link.text });
      if (!inboundLinks.has(target)) inboundLinks.set(target, new Set());
      inboundLinks.get(target).add(servedPath);
    }
    outboundLinks.set(servedPath, links);
    if (parsed.canonical && parsed.canonical.startsWith(SITE_URL)) {
      canonicalTargets.add(new URL(parsed.canonical).pathname);
    }
  }

  const inventory = buildInventory({
    routes,
    sitemapPaths,
    vercelConfig,
    linkTargets,
    canonicalTargets,
  });

  /* ---- resolve and measure every URL in the inventory ---- */

  const rows = [];
  for (const [url, sourceSet] of [...inventory.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const result = followChain(resolve, url);
    const final = result.final;
    const parsed = final && final.html ? parseHtml(final.html) : null;
    const route = routeByPath.get(url);
    const images = final && final.html ? measureImages(final.html) : null;
    const nodes = parsed ? schemaNodes(parsed.jsonLd) : [];

    rows.push({
      url,
      sources: [...sourceSet],
      // A URL's family is what it *is*, not what it eventually resolves to: a
      // legacy alias that 301s to a city page is a redirect, not a city page.
      family:
        result.chain[0].status === 301 || result.chain[0].status === 302
          ? 'redirect'
          : route?.type || (final?.kind === 'notfound' ? '404' : final?.kind || 'unknown'),
      intendedIndexable: indexablePaths.has(url),
      status: result.chain[0].status,
      kind: result.chain[0].status === 200 ? final?.kind : 'redirect',
      finalPath: result.finalPath,
      finalStatus: final ? final.status : null,
      hops: result.hops,
      loop: Boolean(result.loop),
      inSitemap: sitemapPaths.has(url),
      robots: parsed?.robots || '',
      canonical: parsed?.canonical || '',
      title: parsed?.title || '',
      description: parsed?.description || '',
      h1Count: parsed?.h1s.length ?? 0,
      h1: parsed?.h1s[0] || '',
      h2Count: parsed?.h2s.length ?? 0,
      mainWords: parsed?.mainWords ?? 0,
      prerendered: parsed?.prerendered ?? false,
      images,
      schemaTypes: nodes.map((n) => (Array.isArray(n['@type']) ? n['@type'].join('+') : n['@type'])).filter(Boolean),
      schemaErrors: parsed?.jsonLdErrors || [],
      inboundCount: (inboundLinks.get(url) || new Set()).size,
      outboundCount: (outboundLinks.get(url) || []).length,
      mainText: parsed?.mainText || '',
    });
  }

  const byUrl = new Map(rows.map((r) => [r.url, r]));

  /* ---- 1. redirect contract ---- */
  for (const row of rows) {
    if (row.loop) {
      flag('P0', 'redirect-loop', row.url, `chain does not terminate (${row.finalPath})`);
      continue;
    }
    if (row.status !== 301 && row.status !== 302) continue;
    if (row.hops > MAX_REDIRECT_HOPS) {
      flag('P1', 'redirect-chain', row.url, `${row.hops} hops before ${row.finalPath}`);
    }
    if (row.finalStatus === 404) {
      flag('P0', 'redirect-to-404', row.url, `lands on ${row.finalPath}, which 404s`);
    }
    if (row.status === 302) {
      flag('P1', 'temporary-redirect', row.url, `302 to ${row.finalPath}; legacy URLs should be 301`);
    }
    if (row.inSitemap) {
      flag('P0', 'sitemap-redirect', row.url, `redirecting URL is in the sitemap`);
    }
  }

  /* ---- 2. sitemap contract ---- */
  for (const url of sitemapPaths) {
    const row = byUrl.get(url);
    if (!row) {
      flag('P0', 'sitemap-unresolvable', url, 'in the sitemap but not resolvable');
      continue;
    }
    if (row.status !== 200) flag('P0', 'sitemap-non-200', url, `returns ${row.status}`);
    if (/noindex/i.test(row.robots)) flag('P0', 'sitemap-noindex', url, row.robots);
    const expected = absoluteUrl(url);
    if (!row.canonical) flag('P0', 'sitemap-no-canonical', url, 'no canonical link');
    else if (row.canonical !== expected) {
      flag('P0', 'sitemap-canonical-elsewhere', url, `canonical ${row.canonical} != ${expected}`);
    }
  }

  /* ---- 3. every publicly served page is accounted for ----
   *
   * A URL that returns 200 with page-shaped HTML, is not in the registry and is
   * not covered by a noindex, is a page nobody decided to publish. That is how
   * an app shell ends up indexable. */
  for (const row of rows) {
    if (row.status !== 200) continue;
    if (!row.sources.includes('served-file')) continue;
    if (NON_PAGE_FILES.has(row.url)) continue;
    if (routeByPath.has(row.url)) continue;
    // dist/<route>/index.html is reached at /<route>, already a registry route;
    // what is left here is a bare .html file served at its own URL.
    if (!row.url.endsWith('.html')) continue;
    if (!/noindex/i.test(row.robots)) {
      flag('P0', 'unregistered-indexable-file', row.url, `served 200 with robots "${row.robots || 'none'}"`);
    }
    if (row.inSitemap) flag('P0', 'sitemap-unregistered-file', row.url, 'raw file in the sitemap');
  }

  /* ---- 4. indexable page contract ---- */
  for (const row of rows) {
    if (!row.intendedIndexable) continue;
    if (row.status !== 200) flag('P0', 'indexable-non-200', row.url, `returns ${row.status}`);
    if (!row.inSitemap) flag('P1', 'indexable-not-in-sitemap', row.url, 'indexable but absent from sitemap');
    if (/noindex/i.test(row.robots)) flag('P0', 'indexable-noindex', row.url, row.robots);
    if (!row.prerendered) flag('P0', 'indexable-no-prerender', row.url, 'no prerendered body');
    if (row.h1Count === 0) flag('P0', 'missing-h1', row.url, 'no <h1>');
    if (row.h1Count > 1) flag('P1', 'multiple-h1', row.url, `${row.h1Count} <h1> elements`);
    if (row.schemaErrors.length) flag('P0', 'invalid-json-ld', row.url, row.schemaErrors.join('; '));
    if (row.inboundCount === 0 && row.url !== '/') {
      flag('P0', 'orphan', row.url, 'no internal link points here');
    }
    if (row.images && row.images.missingAlt) {
      flag('P1', 'image-missing-alt', row.url, `${row.images.missingAlt} <img> without an alt attribute`);
    }
  }

  /* ---- 5. internal links point at final canonical URLs ---- */
  for (const [from, links] of outboundLinks) {
    for (const link of links) {
      const target = byUrl.get(link.href);
      if (!target) continue;
      if (target.status === 301 || target.status === 302) {
        flag('P1', 'link-to-redirect', from, `links to ${link.href}, which redirects to ${target.finalPath}`);
      } else if (target.status === 404) {
        flag('P0', 'link-to-404', from, `links to ${link.href}, which 404s`);
      } else if (/noindex/i.test(target.robots) && indexablePaths.has(from)) {
        flag('P1', 'link-to-noindex', from, `links to ${link.href}, which is noindex`);
      }
    }
  }

  /* ---- 6. keyword cannibalization ----
   *
   * Two indexable URLs whose titles resolve to the same query are competing
   * with each other, and Google picks one — usually not the one we would.
   * Compared across families only: two city pages differing by city name are
   * not competing, but a city page and an article with the same title are. */
  const STOP = new Set([
    'the', 'a', 'an', 'and', 'or', 'of', 'in', 'to', 'for', 'your', 'you', 'with',
    'what', 'is', 'are', 'on', 'by', 'it', 'from', 'electric', 'scouts', 'complete',
  ]);
  const titleTokens = (title) =>
    new Set(
      String(title)
        .toLowerCase()
        .replace(/\|\s*electric scouts\s*$/, '')
        .replace(/[^a-z0-9 ]/g, ' ')
        .split(/\s+/)
        .filter((word) => word && !STOP.has(word))
    );
  const indexableRows = rows.filter((r) => r.intendedIndexable && r.title);
  const tokenized = indexableRows.map((r) => ({ ...r, tokens: titleTokens(r.title) }));
  for (let i = 0; i < tokenized.length; i += 1) {
    for (let j = i + 1; j < tokenized.length; j += 1) {
      const a = tokenized[i];
      const b = tokenized[j];
      if (a.family === b.family) continue;
      let shared = 0;
      for (const token of a.tokens) if (b.tokens.has(token)) shared += 1;
      const score = shared / (a.tokens.size + b.tokens.size - shared);
      if (score >= 0.65) {
        flag('P1', 'title-cannibalization', `${a.url} | ${b.url}`,
          `title overlap ${score.toFixed(2)}: "${a.title}" vs "${b.title}"`);
      }
    }
  }

  /* ---- 7. substantive duplicate content ---- */
  const contentHashes = new Map();
  for (const row of indexableRows) {
    const key = row.mainText;
    if (!key) continue;
    if (!contentHashes.has(key)) contentHashes.set(key, []);
    contentHashes.get(key).push(row.url);
  }
  for (const [, urls] of contentHashes) {
    if (urls.length > 1) flag('P0', 'identical-main-content', urls.join(' | '), `${urls.length} URLs share one body`);
  }

  const byFamily = new Map();
  for (const row of indexableRows) {
    if (!byFamily.has(row.family)) byFamily.set(row.family, []);
    byFamily.get(row.family).push(row);
  }
  for (const [family, members] of byFamily) {
    if (members.length < 2) continue;
    const sets = members.map((m) => ({ url: m.url, set: shingles(m.mainText, 7) }));
    for (let i = 0; i < sets.length; i += 1) {
      for (let j = i + 1; j < sets.length; j += 1) {
        const score = jaccard(sets[i].set, sets[j].set);
        if (score >= 0.6) {
          flag('P1', 'near-duplicate-content', `${sets[i].url} | ${sets[j].url}`,
            `${family} pages ${score.toFixed(2)} similar after chrome removal`);
        }
      }
    }
  }

  /* ---- report ---- */

  const statusCounts = rows.reduce((acc, r) => {
    const key = r.status === 200 ? (/noindex/i.test(r.robots) ? '200 noindex' : '200') : String(r.status);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const familyCounts = rows.reduce((acc, r) => {
    acc[r.family] = (acc[r.family] || 0) + 1;
    return acc;
  }, {});

  console.log('\n=========== FULL URL AUDIT ===========');
  console.log(`canonical host   : ${SITE_URL}`);
  console.log(`URLs inventoried : ${rows.length}`);
  console.log(`sitemap URLs     : ${sitemapPaths.size}`);
  console.log(`registry routes  : ${routes.length} (${indexablePaths.size} indexable)`);
  console.log('\n-- by HTTP status --');
  for (const [status, n] of Object.entries(statusCounts).sort()) {
    console.log(`  ${String(status).padEnd(12)} ${n}`);
  }
  console.log('\n-- by family --');
  for (const [family, n] of Object.entries(familyCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${family.padEnd(14)} ${n}`);
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
      for (const item of items.slice(0, 6)) console.log(`      ${item.url} — ${item.detail}`);
      if (items.length > 6) console.log(`      … ${items.length - 6} more`);
    }
  }
  console.log('\n======================================\n');

  if (CSV_OUT) {
    const columns = [
      'url', 'family', 'sources', 'intended_indexable', 'status', 'final_path', 'final_status',
      'redirect_hops', 'in_sitemap', 'robots', 'canonical', 'canonical_is_self', 'title',
      'title_length', 'description', 'description_length', 'h1_count', 'h1', 'h2_count',
      'main_words', 'prerendered', 'images', 'images_missing_alt', 'images_missing_dimensions',
      'schema_types', 'schema_errors', 'inbound_links', 'outbound_links',
    ];
    const escape = (value) => {
      const text = value === null || value === undefined ? '' : String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const lines = [columns.join(',')];
    for (const row of rows) {
      lines.push([
        row.url,
        row.family,
        row.sources.join(' '),
        row.intendedIndexable,
        row.status,
        row.finalPath ?? '',
        row.finalStatus ?? '',
        row.hops,
        row.inSitemap,
        row.robots,
        row.canonical,
        row.canonical ? row.canonical === absoluteUrl(row.url) : '',
        row.title,
        row.title.length,
        row.description,
        row.description.length,
        row.h1Count,
        row.h1,
        row.h2Count,
        row.mainWords,
        row.prerendered,
        row.images?.count ?? '',
        row.images?.missingAlt ?? '',
        row.images?.missingDimensions ?? '',
        row.schemaTypes.join(' '),
        row.schemaErrors.join('; '),
        row.inboundCount,
        row.outboundCount,
      ].map(escape).join(','));
    }
    const out = path.resolve(CSV_OUT);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, `${lines.join('\n')}\n`);
    console.log(`wrote ${CSV_OUT} (${rows.length} rows)`);
  }

  const blocking = findings.filter((f) => f.severity === 'P0' || f.severity === 'P1');
  if (STRICT && blocking.length) {
    console.error(`${blocking.length} blocking finding(s)`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`[url-audit] FAILED: ${error.stack || error.message}`);
  process.exit(1);
});
