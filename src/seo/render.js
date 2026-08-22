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
import { organizationSchema } from './organization.js';
import { getComparisons } from './comparisons.js';
import { articleModifiedDate, articlePublishedDate } from './articleDates.js';
import {
  buildArticleSections,
  buildCitySections,
  buildCompareHubSections,
  buildComparisonSections,
  buildUtilityHubSections,
  buildUtilitySections,
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
  // Supplier matchups are a provider-shaped question; plan-shape comparisons
  // belong with the comparison tool. /compare-rates is matched above, so this
  // only catches the /compare family.
  if (path === '/compare' || path.startsWith('/compare/')) {
    return /-vs-.*-energy$|-energy-vs-/.test(path) ? '/images/og-providers.jpg' : '/images/og-compare.jpg';
  }
  // A delivery territory is a place question, so it takes the service-areas
  // image rather than the supplier one.
  if (path === '/utilities' || path.startsWith('/utilities/')) return '/images/og-service-areas.jpg';
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

/**
 * Keeps the crawler payload out of the browser's first paint.
 *
 * The prerendered summary lives inside #root, and React mounts with
 * `createRoot().render()` — which empties the container. Left visible, that
 * produces a guaranteed three-frame flash on every public page: the plain
 * summary paints from the initial HTML, React clears it, then the real app
 * appears. It is the "unstyled old-looking page" visitors were seeing.
 *
 * The fix separates the two audiences instead of hiding a symptom. The markup
 * is still in the served HTML, unhidden by any attribute, so a crawler that
 * reads the document — which is exactly the agent this payload exists for —
 * sees every heading, link and FAQ answer as before. A browser applies this
 * render-blocking rule and never paints it, so the page goes straight from the
 * background colour to the mounted app with nothing unrelated in between.
 *
 * The `<noscript>` half is the reason `display:none` is safe here: with
 * scripting off, React never mounts, so the rule is reversed and the summary is
 * the page. Nothing is hidden from an agent that would otherwise have had it.
 */
const PRERENDER_VISIBILITY_TAGS = [
  '<style>[data-seo-prerender]{display:none}</style>',
  '<noscript><style>[data-seo-prerender]{display:block}</style></noscript>',
];

/* ------------------------------------------------------------------ *
 * Structured data
 * ------------------------------------------------------------------ */

/**
 * Site-wide identity. No aggregateRating: Electric Scouts does not publish
 * verifiable first-party review data, and inventing one violates Google's
 * structured data policy.
 */
// Re-exported so the prerendered @graph and the React pages emit one entity
// from one definition. See src/seo/organization.js for why that matters.
export { organizationSchema };

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
    case 'comparison':
      return [home, { name: 'Comparisons', path: '/compare' }, { name: route.heading, path: route.path }];
    case 'utility':
      return [home, { name: 'Utilities', path: '/utilities' }, { name: route.utility.name, path: route.path }];
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
    // Dates come from src/seo/articleDates.js, which is derived from this
    // repository's git history — the commit that introduced an article and the
    // last one that changed its own text. They were absent entirely before, and
    // a date in structured data is a claim about the world: inventing one to
    // look fresh is the kind of thing that costs a site its rich results.
    const published = articlePublishedDate(route.id);
    const modified = articleModifiedDate(route.id);
    graph.push({
      '@type': 'Article',
      headline: route.heading || route.title,
      description: route.description,
      mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(route.path) },
      // The author is the organization, not an invented byline. This site has
      // no named authors, and fabricating one is worse for E-E-A-T than being
      // straightforward about who stands behind the page.
      author: { '@id': `${SITE_URL}/#organization` },
      publisher: { '@id': `${SITE_URL}/#organization` },
      image: `${SITE_URL}${ogImageFor(route)}`,
      inLanguage: 'en-US',
      ...(published ? { datePublished: published } : {}),
      ...(modified ? { dateModified: modified } : {}),
    });
  }

  // The comparison hub is a genuine list of pages, which is the one thing
  // ItemList is for. Nothing else here gets it: an ItemList over a page's
  // internal links describes navigation, not content, and Google treats that
  // as markup that does not match the page.
  if (route.type === 'compare-hub') {
    const entries = getComparisons();
    graph.push({
      '@type': 'ItemList',
      name: 'Electricity comparisons',
      numberOfItems: entries.length,
      itemListElement: entries.map((entry, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: entry.heading,
        url: absoluteUrl(entry.path),
      })),
    });
  }

  // A page-level image, declared only where the page actually shows one.
  if (content?.image?.url) {
    graph.push({
      '@type': 'ImageObject',
      '@id': `${absoluteUrl(route.path)}#primaryimage`,
      url: content.image.url,
      contentUrl: content.image.url,
      caption: content.image.alt,
    });
  }

  const faqs = (content?.sections || []).flatMap((section) => section.faqs || []);
  if (faqs.length) graph.push(faqSchema(faqs));

  return { '@context': 'https://schema.org', '@graph': graph };
}

/* ------------------------------------------------------------------ *
 * Content island
 * ------------------------------------------------------------------ */

/**
 * The page's content model, serialized into the document for the React app.
 *
 * WHY THIS EXISTS
 *
 * Googlebot indexes the *rendered* DOM, not the HTML we serve. This app mounts
 * with `createRoot().render()` and main.jsx removes the prerendered summary
 * before mounting, so everything the prerenderer so carefully wrote — the
 * tables, the local context, the FAQ answers the FAQPage markup describes —
 * was deleted from the page before Google's renderer ever took its snapshot.
 * What got indexed was the React shell and whatever its client-side queries had
 * managed to resolve, which on a plan-driven page is a loading state. That is
 * the soft 404, and it is why pages that look complete in "view source" were
 * being dropped from the index.
 *
 * The fix is not to hide the payload better — it is to make the app render the
 * same content. This tag carries the exact object `renderBody` was built from,
 * so <SeoSections> can render it as real, visible page content with no second
 * copy of the logic to drift out of step. Pre-render HTML and post-render DOM
 * then say the same thing, which is also the only condition under which the
 * JSON-LD on this page is truthful.
 *
 * `path` is stamped on it so a client-side navigation, which leaves this tag
 * behind pointing at the URL the visitor landed on, cannot show one page's
 * content under another page's heading.
 */
export function contentIslandTag(route, content) {
  const payload = {
    path: route.path,
    type: route.type,
    intro: content?.intro || [],
    sections: content?.sections || [],
  };
  // Serialized as application/json, which the browser never executes. Only the
  // closing-tag sequence has to be neutralized.
  const json = JSON.stringify(payload).replace(/<\/script/gi, '<\\/script');
  return `<script type="application/json" id="seo-content">${json}</script>`;
}

/* ------------------------------------------------------------------ *
 * <head>
 * ------------------------------------------------------------------ */

/**
 * Ask a city photograph for share dimensions rather than card dimensions.
 *
 * `content.image.url` is the same URL the page's own <img> renders, and three
 * of the city photographs carry the card thumbnail's size on the query string:
 * `?w=400&h=300&fit=crop`. That is the right size for a 400px-wide card and the
 * wrong size for og:image on a page that declares `twitter:card=
 * summary_large_image` — a 400x300 file is below every platform's large-card
 * threshold, so the card degrades to a small square or drops the image.
 *
 * Unsplash resizes from the query string, so the same photograph can be asked
 * for 1200x630 instead of falling back to the generic placeholder and losing
 * the city from the card entirely. Any other host is returned untouched: we
 * cannot know whether an arbitrary URL honours resize parameters, and inventing
 * a size that the file does not have is worse than sending its real one.
 */
function shareSized(url) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'images.unsplash.com') return url;
    parsed.searchParams.set('w', '1200');
    parsed.searchParams.set('h', '630');
    parsed.searchParams.set('fit', 'crop');
    return parsed.toString();
  } catch {
    // Not an absolute URL — a site-relative path, already ours to serve.
    return url;
  }
}

export function renderHead(route, content) {
  // route.canonical lets a duplicate URL point at the page it consolidates onto
  // (e.g. /landing -> /). Everything else self-canonicalizes.
  const canonical = absoluteUrl(route.canonical || route.path);
  const title = route.title;
  const description = route.description || '';
  // A city's own photograph beats the section-wide placeholder in a share card.
  // The dimensions below only describe the placeholder set, which is authored at
  // 1200x630; a city photo is a different shape, so it goes out without them
  // rather than with a size that is wrong.
  const ownImage = shareSized(content?.image?.url) || null;
  const image = ownImage || `${SITE_URL}${ogImageFor(route)}`;
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
    ...(ownImage
      ? []
      : [`<meta property="og:image:width" content="1200" />`, `<meta property="og:image:height" content="630" />`]),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:site" content="@electricscouts" />`,
    `<meta name="twitter:url" content="${escapeHtml(canonical)}" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<script type="application/ld+json">${escapeJsonLd(JSON.stringify(structuredDataFor(route, content)))}</script>`,
    // The same content model the body below is built from, handed to the React
    // app so it can render this content itself. See contentIslandTag().
    contentIslandTag(route, content),
    ...PRERENDER_VISIBILITY_TAGS,
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
    // The hub, and through it all 22 matchup pages. Without this line the
    // comparison cluster is an island: those pages link to each other, so every
    // one of them has inbound links and the orphan check passes, while nothing
    // on the rest of the site links in and the only way to reach them is the
    // sitemap. It mirrors the "Compare Head to Head" column in the real footer.
    ['/compare', 'Compare Suppliers Head to Head'],
    ['/all-providers', 'Electricity Providers'],
    ['/all-states', 'Electricity Rates by State'],
    ['/all-cities', 'Electricity Rates by City'],
    // Same lesson as /compare: a cluster nothing links to is reachable only by
    // sitemap, and the orphan check passes anyway because its pages link to
    // each other.
    ['/utilities', 'Electricity Utilities by Territory'],
    ['/bill-analyzer', 'Bill Analyzer'],
    ['/residential-electricity', 'Residential Electricity'],
    ['/business-electricity', 'Business Electricity'],
    // Both are linked from the real header and footer; the prerendered nav is
    // meant to mirror them and was missing these two, which left them with one
    // and two inbound links respectively.
    ['/business-hub', 'Business Electricity by Company Size'],
    ['/home-concierge', 'Home Concierge'],
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
 * `articles` is the route list; `fullArticles` is the raw map, which is the
 * only one carrying the tags the related-guide links are scored on.
 * @param {{citiesByState?: Record<string, any[]>, states?: any[], articles?: any[], fullArticles?: Record<string, any>}} [context]
 */
export function buildPageContent(route, context = {}) {
  switch (route.type) {
    case 'city':
      return buildCitySections(route, { citiesByState: context.citiesByState || {} });
    case 'state':
      return buildStateSections(route, context);
    case 'provider':
      return buildProviderSections(route);
    case 'comparison':
      return buildComparisonSections(route);
    case 'compare-hub':
      return buildCompareHubSections();
    case 'utility':
      return buildUtilitySections(route);
    case 'utility-hub':
      return buildUtilityHubSections();
    case 'article':
      return buildArticleSections(route, { articles: context.fullArticles });
    default:
      return buildStaticSections(route, context);
  }
}

/**
 * "Published 1 March 2026 · Last updated 14 August 2026" for an article.
 *
 * Rendered from src/seo/articleDates.js, the same table the Article markup
 * reads, so the visible date and the structured one cannot disagree.
 */
export function articleByline(id) {
  const published = articlePublishedDate(id);
  const modified = articleModifiedDate(id);
  if (!published && !modified) return '';
  const format = (iso) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  const parts = [];
  if (published) parts.push(`Published <time datetime="${escapeHtml(published)}">${escapeHtml(format(published))}</time>`);
  if (modified && modified !== published) {
    parts.push(`Last updated <time datetime="${escapeHtml(modified)}">${escapeHtml(format(modified))}</time>`);
  }
  return `<p class="article-byline">${parts.join(' &middot; ')}</p>`;
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
 * @param {{intro: string[], sections: object[], image?: {url: string, alt: string}|null}} content
 * @param {{states: Array, citiesByState: Record<string, Array>}} context
 */
export function renderBody(route, content, context) {
  const heading = route.heading || route.title;
  const intro = (content.intro || []).map((text) => `<p>${escapeHtml(text)}</p>`).join('');
  const sections = (content.sections || []).map(renderSection).filter(Boolean).join('');

  // Article bodies are hand-authored HTML from the bundled article data — the
  // same markup ArticleDetail renders — so they are inserted verbatim.
  const articleBody = route.type === 'article' && route.content ? route.content : '';

  // Google will not use a date it cannot see on the page, and structured data
  // that states one the page does not show is a mismatch. This renders the same
  // two dates the Article markup carries, from the same source.
  const byline = route.type === 'article' ? articleByline(route.id) : '';

  // The city photograph, in the crawlable HTML. Width and height are declared
  // so the browser reserves the space instead of shifting the page under the
  // reader, and it is eager rather than lazy because it sits at the top.
  const figure = content.image
    ? `<figure><img src="${escapeHtml(content.image.url)}" alt="${escapeHtml(content.image.alt)}" ` +
      `decoding="async" style="max-width:100%;height:auto" /></figure>`
    : '';

  return [
    // `data-prerender-route` names the route this payload was built for. It is
    // what the build-time assertion and the post-deploy verifier read to prove a
    // URL is serving its OWN prerendered file rather than the homepage or the
    // neutral app shell — a check that file existence alone cannot make. It sits
    // on the existing wrapper rather than in a second tree, so main.jsx removes
    // it with the rest of the payload and the mounted app never sees it.
    `<div data-seo-prerender="true" data-prerender-route="${escapeHtml(route.path)}" style="max-width:1100px;margin:0 auto;padding:24px 20px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2937;line-height:1.6">`,
    siteNav(context.states || []),
    renderBreadcrumbNav(route),
    `<main><h1>${escapeHtml(heading)}</h1>`,
    byline,
    figure,
    intro,
    articleBody,
    sections,
    '</main>',
    `<footer><p>&copy; ${new Date().getFullYear()} ${escapeHtml(SITE_NAME)}. ` +
      `${link('/privacy-policy', 'Privacy Policy')} &middot; ${link('/terms-of-service', 'Terms of Service')}</p></footer>`,
    '</div>',
  ].join('\n');
}
