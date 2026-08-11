/**
 * render.js
 *
 * Turns a route descriptor into the <head> tags and initial body HTML that a
 * crawler receives before any JavaScript runs.
 *
 * The generated markup is deliberately a faithful summary of what the React
 * page renders — same H1, same subject, same links. React replaces the
 * contents of #root on mount, so users see the real app; crawlers (and users
 * on a slow connection) get a readable page instead of a blank shell.
 *
 * Pure string building, no dependencies, so it is unit-testable.
 */

import { SITE_NAME, SITE_URL, absoluteUrl } from './site.js';
import { MARKET_TOTALS } from './market.js';
import {
  buildArticleSections,
  buildCitySections,
  buildProviderSections,
  buildStateSections,
  buildStaticSections,
} from './content.js';

/** Escape text for use in an HTML text node or double-quoted attribute. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape a string for embedding inside a <script> block. */
function escapeJsonLd(json) {
  return json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

/** Mirrors the per-section OG images SEOHead picks client-side. */
export function ogImageFor(route) {
  const path = route.path || '/';
  if (path.startsWith('/compare-rates')) return '/images/og-compare.jpg';
  if (path.startsWith('/bill-analyzer')) return '/images/og-bill-analyzer.jpg';
  if (path.startsWith('/providers') || path === '/all-providers') return '/images/og-providers.jpg';
  if (path.startsWith('/business')) return '/images/og-business.jpg';
  if (path.startsWith('/learn') || path === '/learning-center') return '/images/og-learn.jpg';
  if (path.startsWith('/electricity-rates') || path === '/all-cities' || path === '/all-states') {
    return '/images/og-service-areas.jpg';
  }
  return '/images/og-default.jpg';
}

const ROBOTS_INDEXABLE = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const ROBOTS_NOINDEX = 'noindex, follow';

/* ------------------------------------------------------------------ *
 * Structured data
 * ------------------------------------------------------------------ */

/**
 * Site-wide identity. No aggregateRating: Electric Scouts does not publish
 * verifiable first-party review data, and inventing one violates Google's
 * structured data policy.
 */
export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/images/logo-header.png`,
      width: 200,
      height: 60,
    },
    // Counted from the market snapshot rather than asserted. The previous copy
    // claimed "40+ providers" on all 258 pages while the snapshot holds 35 with
    // an active plan, so the one org-level fact the site repeated everywhere was
    // one it could not support.
    description:
      `Electric Scouts is a free, independent electricity comparison platform tracking ` +
      `${MARKET_TOTALS.activePlans} electricity plans from ${MARKET_TOTALS.providersWithPlans} ` +
      `suppliers across ${MARKET_TOTALS.states} deregulated US states.`,
    sameAs: [
      'https://facebook.com/electricscouts',
      'https://x.com/electricscouts',
      'https://linkedin.com/company/electricscouts',
      'https://instagram.com/electricscouts',
    ],
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/compare-rates?zip={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbSchema(trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** Breadcrumb trail for a route, matching the on-page breadcrumbs. */
export function breadcrumbsFor(route) {
  const home = { name: 'Home', path: '/' };
  switch (route.type) {
    case 'state':
      return [home, { name: 'States', path: '/all-states' }, { name: route.state.name, path: route.path }];
    case 'city':
      return [
        home,
        { name: route.city.stateName, path: route.city.statePath },
        { name: `${route.city.name}, ${route.city.stateCode}`, path: route.path },
      ];
    case 'provider':
      return [home, { name: 'Providers', path: '/all-providers' }, { name: route.heading, path: route.path }];
    case 'article':
      return [
        home,
        { name: 'Learning Center', path: '/learning-center' },
        { name: route.heading || route.title, path: route.path },
      ];
    case 'home':
      return [home];
    default:
      return [home, { name: route.heading || route.title, path: route.path }];
  }
}

/**
 * FAQPage markup for the questions a page actually renders.
 *
 * Google requires the Q&A to be visible on the page, so this is built from the
 * same content model the body renders rather than from a separate list — there
 * is no way for the markup to describe questions the page does not show.
 */
export function faqSchema(faqs) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function structuredDataFor(route, content) {
  /** @type {Record<string, any>[]} */
  const graph = [organizationSchema(), websiteSchema()];
  const trail = breadcrumbsFor(route);
  if (trail.length > 1) graph.push(breadcrumbSchema(trail));

  if (route.type === 'article') {
    graph.push({
      '@type': 'Article',
      headline: route.heading || route.title,
      description: route.description,
      mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(route.path) },
      author: { '@id': `${SITE_URL}/#organization` },
      publisher: { '@id': `${SITE_URL}/#organization` },
    });
  }

  const faqs = (content?.sections || []).flatMap((section) => section.faqs || []);
  if (faqs.length) graph.push(faqSchema(faqs));

  return { '@context': 'https://schema.org', '@graph': graph };
}

/* ------------------------------------------------------------------ *
 * <head>
 * ------------------------------------------------------------------ */

export function renderHead(route, content) {
  // route.canonical lets a duplicate URL point at the page it consolidates onto
  // (e.g. /landing -> /). Everything else self-canonicalizes.
  const canonical = absoluteUrl(route.canonical || route.path);
  const title = route.title;
  const description = route.description || '';
  const image = `${SITE_URL}${ogImageFor(route)}`;
  const robots = route.noindex ? ROBOTS_NOINDEX : ROBOTS_INDEXABLE;
  const ogType = route.type === 'article' ? 'article' : 'website';

  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    // The 404 page is served from many URLs and represents none of them, so it
    // declares no canonical rather than pointing at a URL that does not resolve.
    ...(route.noCanonical ? [] : [`<link rel="canonical" href="${escapeHtml(canonical)}" />`]),
    `<meta name="author" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:site" content="@electricscouts" />`,
    `<meta name="twitter:url" content="${escapeHtml(canonical)}" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<script type="application/ld+json">${escapeJsonLd(JSON.stringify(structuredDataFor(route, content)))}</script>`,
  ];

  return tags.map((tag) => `    ${tag}`).join('\n');
}

/* ------------------------------------------------------------------ *
 * Initial body content
 * ------------------------------------------------------------------ */

function link(path, label) {
  return `<a href="${escapeHtml(path)}">${escapeHtml(label)}</a>`;
}

function linkList(links) {
  if (!links.length) return '';
  return `<ul>${links.map(([path, label]) => `<li>${link(path, label)}</li>`).join('')}</ul>`;
}

/**
 * Site-wide navigation, mirroring the links the real header and footer render.
 * Gives every prerendered page a crawlable path to the main hubs.
 */
function siteNav(states) {
  const primary = [
    ['/compare-rates', 'Compare Electricity Rates'],
    ['/all-providers', 'Electricity Providers'],
    ['/all-states', 'Electricity Rates by State'],
    ['/all-cities', 'Electricity Rates by City'],
    ['/bill-analyzer', 'Bill Analyzer'],
    ['/business-electricity', 'Business Electricity'],
    ['/renewable-energy', 'Renewable Energy Plans'],
    ['/savings-calculator', 'Savings Calculator'],
    ['/learning-center', 'Learning Center'],
    ['/faq', 'FAQ'],
    ['/about-us', 'About Us'],
  ];

  return [
    '<nav aria-label="Primary">',
    `<a href="/">${escapeHtml(SITE_NAME)}</a>`,
    linkList(primary),
    linkList(states.map((state) => [state.path, `${state.name} Electricity Rates`])),
    '</nav>',
  ].join('');
}

/* ------------------------------------------------------------------ *
 * Section serialization
 *
 * The content model (src/seo/content.js) decides what a page may say; these
 * functions decide only how it is marked up. A section renders exactly the
 * parts it carries, so a city with no utility on record produces no empty
 * heading rather than a heading with nothing under it.
 * ------------------------------------------------------------------ */

/** A table cell is either a plain string or {text, path} for a linked cell. */
function renderCell(cell) {
  if (cell && typeof cell === 'object') {
    return cell.path ? link(cell.path, cell.text) : escapeHtml(cell.text);
  }
  return escapeHtml(cell);
}

function renderTable(table) {
  if (!table || !table.rows || !table.rows.length) return '';
  const head = `<thead><tr>${table.columns.map((c) => `<th scope="col">${escapeHtml(c)}</th>`).join('')}</tr></thead>`;
  const body = table.rows
    .map((row) => `<tr>${row.map((cell, i) => (i === 0 ? `<th scope="row">${renderCell(cell)}</th>` : `<td>${renderCell(cell)}</td>`)).join('')}</tr>`)
    .join('');
  return `<table>${head}<tbody>${body}</tbody></table>`;
}

function renderFacts(facts) {
  if (!facts || !facts.length) return '';
  return `<dl>${facts
    .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
    .join('')}</dl>`;
}

/** FAQs render as real H3/paragraph pairs — the visibility FAQPage requires. */
function renderFaqs(faqs) {
  if (!faqs || !faqs.length) return '';
  return faqs
    .map((faq) => `<h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p>`)
    .join('');
}

function renderProviders(providers) {
  if (!providers || !providers.length) return '';
  return `<ul>${providers
    .map((provider) => `<li>${provider.path ? link(provider.path, provider.name) : escapeHtml(provider.name)}</li>`)
    .join('')}</ul>`;
}

function renderSection(section) {
  const parts = [
    (section.paragraphs || []).map((text) => `<p>${escapeHtml(text)}</p>`).join(''),
    section.facts ? renderFacts(section.facts) : '',
    section.bullets && section.bullets.length
      ? `<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : '',
    section.table ? renderTable(section.table) : '',
    section.faqs ? renderFaqs(section.faqs) : '',
    section.providers ? renderProviders(section.providers) : '',
    section.links && section.links.length ? linkList(section.links) : '',
  ].filter(Boolean);

  // A heading with nothing under it is noise for a crawler and a dead end for a
  // reader, so an empty section is dropped entirely.
  if (!parts.length) return '';
  return `<section><h2>${escapeHtml(section.heading)}</h2>${parts.join('')}</section>`;
}

/**
 * The content model for a route. Exported so the prerenderer can build it once
 * and hand the same object to both renderHead (for FAQ markup) and renderBody.
 */
/**
 * @param {Record<string, any>} route
 * @param {{citiesByState?: Record<string, any[]>, states?: any[], articles?: any[]}} [context]
 */
export function buildPageContent(route, context = {}) {
  switch (route.type) {
    case 'city':
      return buildCitySections(route, { citiesByState: context.citiesByState || {} });
    case 'state':
      return buildStateSections(route);
    case 'provider':
      return buildProviderSections(route);
    case 'article':
      return buildArticleSections(route);
    default:
      return buildStaticSections(route, context);
  }
}

function renderBreadcrumbNav(route) {
  const trail = breadcrumbsFor(route);
  if (trail.length < 2) return '';
  const items = trail.map((crumb, index) =>
    index === trail.length - 1
      ? `<span aria-current="page">${escapeHtml(crumb.name)}</span>`
      : link(crumb.path, crumb.name)
  );
  return `<nav aria-label="Breadcrumb">${items.join(' &rsaquo; ')}</nav>`;
}

/**
 * Full initial HTML for a route's #root container.
 *
 * @param {object} route
 * @param {{intro: string[], sections: object[]}} content
 * @param {{states: Array, citiesByState: Record<string, Array>}} context
 */
export function renderBody(route, content, context) {
  const heading = route.heading || route.title;
  const intro = (content.intro || []).map((text) => `<p>${escapeHtml(text)}</p>`).join('');
  const sections = (content.sections || []).map(renderSection).filter(Boolean).join('');

  // Article bodies are hand-authored HTML from the bundled article data — the
  // same markup ArticleDetail renders — so they are inserted verbatim.
  const articleBody = route.type === 'article' && route.content ? route.content : '';

  return [
    '<div data-seo-prerender="true" style="max-width:1100px;margin:0 auto;padding:24px 20px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2937;line-height:1.6">',
    siteNav(context.states || []),
    renderBreadcrumbNav(route),
    `<main><h1>${escapeHtml(heading)}</h1>`,
    intro,
    articleBody,
    sections,
    '</main>',
    `<footer><p>&copy; ${new Date().getFullYear()} ${escapeHtml(SITE_NAME)}. ` +
      `${link('/privacy-policy', 'Privacy Policy')} &middot; ${link('/terms-of-service', 'Terms of Service')}</p></footer>`,
    '</div>',
  ].join('\n');
}
