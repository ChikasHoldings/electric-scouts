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
    description:
      'Electric Scouts is a free, independent electricity comparison platform covering 40+ providers across 12 deregulated US states.',
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

export function structuredDataFor(route) {
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

  return { '@context': 'https://schema.org', '@graph': graph };
}

/* ------------------------------------------------------------------ *
 * <head>
 * ------------------------------------------------------------------ */

export function renderHead(route) {
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
    `<script type="application/ld+json">${escapeJsonLd(JSON.stringify(structuredDataFor(route)))}</script>`,
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

function section(heading, links) {
  if (!links.length) return '';
  return `<section><h2>${escapeHtml(heading)}</h2>${linkList(links)}</section>`;
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
    `<h2>Electricity Rates by State</h2>`,
    linkList(states.map((state) => [state.path, `${state.name} Electricity Rates`])),
    '</nav>',
  ].join('');
}

function renderHomeBody(route, context) {
  const { states } = context;
  const featuredCities = states
    .flatMap((state) => state.cities.slice(0, 2))
    .slice(0, 12)
    .map((city) => [city.path, `${city.name} Electricity Rates`]);

  return [
    `<p>${escapeHtml(route.description)}</p>`,
    section('Popular Cities', featuredCities),
  ].join('');
}

function renderStateBody(route) {
  const { state } = route;
  const cityLinks = state.cities.map((city) => [city.path, `${city.name} Electricity Rates`]);

  return [
    `<p>${escapeHtml(route.description)}</p>`,
    `<p>${escapeHtml(
      `Electric Scouts tracks electricity plans across ${state.name}. Compare rates by city, ` +
        `check what providers serve your address, and switch without losing power.`
    )}</p>`,
    section(`Electricity Rates in ${state.name} Cities`, cityLinks),
    section('Next Steps', [
      ['/compare-rates', 'Compare rates for your ZIP code'],
      ['/all-providers', 'Browse all electricity providers'],
      ['/all-states', 'See every deregulated state'],
    ]),
  ].join('');
}

function renderCityBody(route, context) {
  const { city } = route;
  const nearby = (context.citiesByState[city.stateCode] || [])
    .filter((other) => other.path !== city.path)
    .slice(0, 8)
    .map((other) => [other.path, `${other.name} Electricity Rates`]);

  const facts = [
    ['Average rate', city.avgRate],
    ['Estimated monthly bill', city.avgMonthlyBill],
    ['Providers serving the area', `${city.providers}+`],
    ['County', city.county],
    ['Population', city.population],
  ].filter(([, value]) => value);

  return [
    `<p>${escapeHtml(city.description)}</p>`,
    `<p>${escapeHtml(
      `Compare electricity plans from ${city.providers}+ providers serving ${city.name}, ` +
        `${city.stateName}. The average rate in ${city.county} is ${city.avgRate}, ` +
        `about ${city.avgMonthlyBill} a month for typical usage.`
    )}</p>`,
    `<h2>${escapeHtml(`${city.name} Electricity at a Glance`)}</h2>`,
    `<ul>${facts
      .map(([label, value]) => `<li>${escapeHtml(label)}: ${escapeHtml(value)}</li>`)
      .join('')}</ul>`,
    city.zipCodes.length
      ? `<p>${escapeHtml(`ZIP codes covered include ${city.zipCodes.slice(0, 8).join(', ')}.`)}</p>`
      : '',
    section(`More Cities in ${city.stateName}`, nearby),
    section('Next Steps', [
      [city.statePath, `${city.stateName} electricity rates`],
      ['/compare-rates', 'Compare rates for your ZIP code'],
      ['/all-cities', 'Browse every city we cover'],
    ]),
  ].join('');
}

function renderArticleBody(route) {
  // The article body is already trusted, hand-authored HTML from the bundled
  // article data — the same markup ArticleDetail renders.
  const body = route.content || `<p>${escapeHtml(route.description || '')}</p>`;
  return [
    route.description ? `<p>${escapeHtml(route.description)}</p>` : '',
    body,
    section('Keep Reading', [
      ['/learning-center', 'More electricity guides'],
      ['/compare-rates', 'Compare electricity rates'],
      ['/all-states', 'Electricity rates by state'],
    ]),
  ].join('');
}

function renderProviderBody(route) {
  return [
    `<p>${escapeHtml(route.description)}</p>`,
    section('Next Steps', [
      ['/all-providers', 'Compare all electricity providers'],
      ['/compare-rates', 'Compare rates for your ZIP code'],
      ['/all-states', 'Electricity rates by state'],
    ]),
  ].join('');
}

function renderStaticBody(route) {
  return `<p>${escapeHtml(route.description || '')}</p>`;
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
 * @param {{states: Array, citiesByState: Record<string, Array>}} context
 */
export function renderBody(route, context) {
  let main;
  switch (route.type) {
    case 'home': main = renderHomeBody(route, context); break;
    case 'state': main = renderStateBody(route); break;
    case 'city': main = renderCityBody(route, context); break;
    case 'article': main = renderArticleBody(route); break;
    case 'provider': main = renderProviderBody(route); break;
    default: main = renderStaticBody(route); break;
  }

  const heading = route.heading || route.title;

  return [
    '<div data-seo-prerender="true" style="max-width:1100px;margin:0 auto;padding:24px 20px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2937;line-height:1.6">',
    siteNav(context.states),
    renderBreadcrumbNav(route),
    `<main><h1>${escapeHtml(heading)}</h1>`,
    main,
    '</main>',
    `<footer><p>&copy; ${new Date().getFullYear()} ${escapeHtml(SITE_NAME)}. ` +
      `${link('/privacy-policy', 'Privacy Policy')} &middot; ${link('/terms-of-service', 'Terms of Service')}</p></footer>`,
    '</div>',
  ].join('\n');
}
