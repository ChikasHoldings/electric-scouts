/**
 * routes.js
 *
 * The public route registry: every URL Electric Scouts wants search engines to
 * crawl, together with the metadata that must appear in the initial HTML.
 *
 * One registry drives three things that used to disagree with each other:
 *   1. the build-time prerenderer (scripts/prerender-seo.mjs)
 *   2. /sitemap.xml (api/sitemap.js)
 *   3. the SEO regression suite (tests/seo.test.mjs)
 *
 * Static-page titles and descriptions are copied verbatim from each page's
 * <SEOHead> props so the prerendered <head> and the hydrated <head> match. The
 * regression suite asserts that parity, so changing a page title without
 * updating this file fails the test run.
 *
 * Plain ESM, no dependencies: imported by the browser bundle, by Vercel
 * serverless functions and by Node build scripts alike.
 */

import { canonicalPath } from './site.js';
import { getCities, getStates, STATE_NAMES, STATE_PAGE_PATHS } from './locations.js';
import { getArticleRoutes } from './articles.js';
import { formatRate, getStateMarket, parseRate } from './market.js';
import { COMPARE_HUB, getComparisons } from './comparisons.js';
import { UTILITY_HUB, getUtilities } from './utilities.js';

/**
 * Public, indexable pages with hand-authored metadata.
 * `page` is the pages.config.js key, used by the parity test.
 */
export const STATIC_ROUTES = [
  {
    page: "Home",
    path: "/",
    title: "Electric Scouts | Stop Overpaying for Electricity — We'll Prove It",
    description: "Compare electricity plans across the 12 US states where you can choose your supplier. Enter a ZIP code or upload a bill to see what you pay and what is available.",
    priority: 1.0,
    changefreq: "daily",
  },
  {
    page: "CompareRates",
    path: "/compare-rates",
    title: "Compare Electricity Rates Side by Side | Electric Scouts",
    description: "Enter your ZIP code and see the electricity plans sold in your area side by side — rate, contract term and early termination fee on the same row.",
    priority: 1.0,
    changefreq: "daily",
  },
  {
    page: "BillAnalyzer",
    path: "/bill-analyzer",
    title: "Electricity Bill Analyzer | Electric Scouts",
    description: "Upload an electricity bill and see the rate you really pay once base charges, delivery and credits are counted, then compare it against plans sold at your address.",
    priority: 0.9,
    changefreq: "weekly",
  },
  {
    page: "AllProviders",
    path: "/all-providers",
    title: "Electricity Supplier Directory | Electric Scouts",
    description: "Browse every electricity supplier we track across 12 deregulated states, with the plans they offer, the states they cover and their contract terms.",
    priority: 0.9,
    changefreq: "weekly",
  },
  {
    page: "AllStates",
    path: "/all-states",
    title: "Deregulated Electricity States | Electric Scouts",
    description: "Compare electricity markets in the 12 US states where households choose their own supplier — plans tracked, suppliers and rate ranges for each market.",
    priority: 0.9,
    changefreq: "weekly",
  },
  {
    page: "AllCities",
    path: "/all-cities",
    title: "Electricity Rates by City | Electric Scouts",
    description: "Local electricity rates, utilities and coverage for every city we publish, from Houston and Dallas to Chicago, Philadelphia and New York.",
    priority: 0.9,
    changefreq: "weekly",
  },
  {
    page: "LearningCenter",
    path: "/learning-center",
    title: "Electricity Guides and Tips | Electric Scouts",
    description: "Practical guides on how electricity markets work, how to read a bill and what to check before signing a contract — written for people switching supplier.",
    priority: 0.9,
    changefreq: "weekly",
  },
  {
    page: "ResidentialElectricity",
    path: "/residential-electricity",
    title: "Compare Residential Electricity Rates | Electric Scouts",
    description: "Compare the electricity plans sold to homes at your address — house, apartment or condo — with rate, contract length and early termination fee side by side.",
    priority: 0.9,
    changefreq: "weekly",
  },
  {
    page: "RenewableEnergy",
    path: "/renewable-energy",
    title: "Renewable Electricity Plans | Electric Scouts",
    description: "How 100% renewable electricity plans actually work, what they cost, and which suppliers offer them in each deregulated state we cover.",
    priority: 0.8,
    changefreq: "weekly",
  },
  {
    page: "RenewableCompareRates",
    path: "/renewable-compare-rates",
    title: "Compare Renewable Electricity Plans | Electric Scouts",
    description: "Filter the comparison down to plans backed by 100% renewable energy and rank them by rate, contract length or supplier. Enter a ZIP code to start.",
    priority: 0.8,
    changefreq: "weekly",
  },
  {
    page: "BusinessElectricity",
    path: "/business-electricity",
    title: "Business Electricity Rates and Pricing | Electric Scouts",
    description: "How commercial electricity is priced — demand charges, load profiles and contract terms — plus the business plans we track in each deregulated state.",
    priority: 0.8,
    changefreq: "weekly",
  },
  {
    page: "BusinessHub",
    path: "/business-hub",
    title: "Business Electricity by Company Size | Electric Scouts",
    description: "What a business needs from an electricity contract depends on its size and load shape. Compare the options for small, medium and industrial accounts.",
    priority: 0.8,
    changefreq: "weekly",
  },
  {
    page: "BusinessCompareRates",
    path: "/business-compare-rates",
    title: "Business Electricity Quotes | Electric Scouts",
    description: "Get commercial electricity quotes for your business. Commercial supply is priced against your load profile, so this is a quote request rather than a checkout.",
    priority: 0.8,
    changefreq: "weekly",
  },
  {
    page: "SavingsCalculator",
    path: "/savings-calculator",
    title: "Electricity Savings Calculator | Electric Scouts",
    description: "Enter your current rate and monthly usage to estimate what a different electricity plan would cost you over a year, using your own numbers.",
    priority: 0.8,
    changefreq: "weekly",
  },
  {
    page: "FAQ",
    path: "/faq",
    title: "Electricity FAQ | Honest Answers from Electric Scouts",
    description: "Straight answers on switching electricity supplier: how long it takes, what happens to your service, and why the advertised rate is not what you end up paying.",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    page: "AboutUs",
    path: "/about-us",
    title: "About Electric Scouts | Who We Are & Why We Built This",
    description: "Electric Scouts is an independent electricity comparison service covering 12 deregulated states. What we track, what we do not do, and how we make money.",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    page: "HomeConcierge",
    path: "/home-concierge",
    title: "Home Concierge | Set Up Utilities When You Move | Electric Scouts",
    description: "Moving means setting up electricity before you arrive. We handle the electricity setup and coordinate internet, water and phone so nothing starts late.",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    page: "PrivacyPolicy",
    path: "/privacy-policy",
    title: "Privacy Policy | Electric Scouts",
    description: "How Electric Scouts collects, uses and protects your information when you compare electricity plans. We do not sell your personal information.",
    priority: 0.3,
    changefreq: "yearly",
  },
  {
    page: "TermsOfService",
    path: "/terms-of-service",
    title: "Terms of Service | Electric Scouts",
    description: "The terms that apply when you use Electric Scouts to compare electricity plans, including accuracy of rates, affiliate relationships and limitation of liability.",
    priority: 0.3,
    changefreq: "yearly",
  },
];

/**
 * Routes that exist and return 200 but must never be indexed: private
 * dashboards, legacy duplicates of a canonical URL, and utility pages.
 * They are prerendered with `noindex, follow` and kept out of the sitemap.
 * They are NOT blocked in robots.txt — a crawler has to fetch the page to see
 * the noindex, so blocking them would strand them in the index instead.
 */
export const NOINDEX_ROUTES = [
  { path: '/business-quote-dashboard', title: 'Business Quote Dashboard | Electric Scouts', reason: 'customer dashboard' },
  { path: '/provider-details', title: 'Electricity Providers | Electric Scouts', reason: 'legacy query-param URL, superseded by /providers/:slug' },
  { path: '/city-rates', title: 'Electricity Rates by City | Electric Scouts', reason: 'legacy query-param URL, superseded by /electricity-rates/:state/:city' },
  { path: '/article-detail', title: 'Learning Center | Electric Scouts', reason: 'legacy query-param URL, superseded by /learn/:id' },
  { path: '/sitemap', title: 'Sitemap | Electric Scouts', reason: 'HTML mirror of sitemap.xml' },
  { path: '/sitemap-xml', title: 'Sitemap XML | Electric Scouts', reason: 'HTML mirror of sitemap.xml' },
  { path: '/robots', title: 'Robots | Electric Scouts', reason: 'HTML mirror of robots.txt' },
  { path: '/not-found', title: 'Page Not Found | Electric Scouts', reason: 'error page' },
];

/**
 * Page component name for each state landing page. Titles and descriptions are
 * generated from the market snapshot rather than hand-written per state: the
 * previous hand-written set carried savings claims ("Save $800/Year") that no
 * data on this site supports, and provider counts that disagreed with what the
 * pages actually listed.
 */
export const STATE_PAGE_COMPONENTS = {
  TX: 'TexasElectricity',
  IL: 'IllinoisElectricity',
  OH: 'OhioElectricity',
  PA: 'PennsylvaniaElectricity',
  NY: 'NewYorkElectricity',
  NJ: 'NewJerseyElectricity',
  MD: 'MarylandElectricity',
  MA: 'MassachusettsElectricity',
  ME: 'MaineElectricity',
  NH: 'NewHampshireElectricity',
  RI: 'RhodeIslandElectricity',
  CT: 'ConnecticutElectricity',
};

/** Title for a state landing page. Kept inside typical SERP truncation. */
export function stateTitle(stateName) {
  return `${stateName} Electricity Rates & Providers | Electric Scouts`;
}

/**
 * Description for a state landing page, built from the plans we actually hold.
 * Falls back to a claim-free sentence if the snapshot has nothing for a state,
 * so a missing market can never produce a description with a blank in it.
 */
export function stateDescription(stateName, market) {
  if (!market || !market.plans) {
    return `Compare electricity suppliers and plans in ${stateName}. See rates by city, how the market works and what to check before switching.`;
  }
  const range = `${formatRate(market.minRate)}\u2013${formatRate(market.maxRate)}`;
  return (
    `Compare ${market.plans} ${stateName} electricity plans from ${market.providers} suppliers, ` +
    `${range}. Rates by city, renewable options and how switching works.`
  );
}

/** Title for a city page: the phrasing people actually search for. */
export function cityTitle(city) {
  return `Compare Electricity Rates in ${city.name}, ${city.stateCode} | Electric Scouts`;
}

/**
 * Description for a city page. Leads with the city's own average rate and bill
 * — the two figures that differ city to city — then the size of the market it
 * sits in. No year is hard-coded: the previous titles still said "2025".
 */
export function cityDescription(city, market) {
  const local = `Electricity in ${city.name}, ${city.stateCode} averages ${city.avgRate} (about ${city.avgMonthlyBill}/mo).`;
  if (!market || !market.plans) {
    return `${local} Compare suppliers serving ${city.county} and switch for free with Electric Scouts.`;
  }
  return `${local} Compare ${market.plans} ${city.stateName} plans from ${market.providers} suppliers by ZIP code.`;
}

/** Title for a provider detail page. */
export function providerTitle(provider) {
  return `${provider.name} Electricity Plans & Rates | Electric Scouts`;
}

export function providerDescription(provider) {
  const rates =
    provider.minRate !== null && provider.maxRate !== null
      ? ` from ${formatRate(provider.minRate)} to ${formatRate(provider.maxRate)}`
      : '';
  const states = (provider.planStates || []).map((code) => STATE_NAMES[code]).filter(Boolean);
  const where = states.length ? ` in ${states.length === 1 ? states[0] : `${states.length} states`}` : '';
  // Kept inside the ~165 characters a SERP will show. Suppliers with a long
  // name, a wide footprint and a wide rate range were overflowing it.
  return (
    `Compare ${provider.plans} ${provider.name} electricity plans${where}${rates}. ` +
    `Contract terms, renewable options and where they serve.`
  );
}

/* ------------------------------------------------------------------ *
 * Route builders
 * ------------------------------------------------------------------ */

/** The 12 state landing pages. */
export function getStateRoutes() {
  return getStates().map((state) => {
    const market = getStateMarket(state.code);
    return {
      type: 'state',
      page: STATE_PAGE_COMPONENTS[state.code],
      path: canonicalPath(state.path),
      title: stateTitle(state.name),
      description: stateDescription(state.name, market),
      heading: `${state.name} Electricity Rates and Providers`,
      priority: 0.9,
      changefreq: 'weekly',
      state,
      market,
    };
  });
}

/** One route per city that has real data behind it. */
export function getCityRoutes() {
  return getCities().map((city) => {
    const market = getStateMarket(city.stateCode);
    return {
      type: 'city',
      path: city.path,
      title: cityTitle(city),
      description: cityDescription(city, market),
      heading: `Compare Electricity Rates in ${city.name}, ${city.stateName}`,
      // Cities are ranked by how much distinct data stands behind them, so the
      // ones with local market notes are crawled ahead of the thinnest.
      priority: parseRate(city.avgRate) !== null ? 0.8 : 0.7,
      changefreq: 'weekly',
      city,
      market,
    };
  });
}

/**
 * One route per article. Pass the loaded `fullArticles` map to get real titles
 * and descriptions; without it the routes carry URLs only (sitemap use).
 */
export function getArticleRouteList(fullArticles) {
  return getArticleRoutes(fullArticles).map((article) => ({
    type: 'article',
    // Carried through so the content model can find this article in the map it
    // was built from — the related-guide links are keyed on it.
    id: article.id,
    path: article.path,
    // Left undefined when article data was not supplied. No generic fallback on
    // purpose: a shared placeholder title across 73 URLs is the exact failure
    // mode this registry exists to prevent, and the prerender build aborts if
    // any route reaches it without metadata.
    title: article.title,
    description: article.description,
    heading: article.heading,
    content: article.content,
    priority: 0.7,
    changefreq: 'weekly',
  }));
}

/**
 * Provider detail pages.
 *
 * A provider earns a page only when ProviderDetails would actually render one:
 * it must be flagged active (that page filters on `is_active`, so anything else
 * renders a "Provider Not Found" shell) and it must have at least one plan.
 * Both conditions are already applied by getPublishableProviders(); this keeps
 * the guard anyway so a caller passing a raw list cannot publish empty profiles.
 *
 * @param {Array<object>} providers records from the market snapshot
 */
export function getProviderRoutes(providers = []) {
  return providers
    .filter((provider) => provider && provider.name && provider.isActive && provider.plans > 0)
    .map((provider) => ({
      type: 'provider',
      path: canonicalPath(`/providers/${provider.slug || providerSlug(provider.name)}`),
      title: providerTitle(provider),
      description: providerDescription(provider),
      heading: `${provider.name} Electricity Plans and Rates`,
      priority: 0.8,
      changefreq: 'weekly',
      lastmod: provider.updatedAt ? String(provider.updatedAt).split('T')[0] : undefined,
      provider,
    }))
    .filter((route) => route.path !== '/providers/');
}

/**
 * The comparison hub and every head-to-head page under it.
 *
 * The registry does not decide which matchups exist — src/seo/comparisons.js
 * does, and it drops any whose two suppliers have stopped overlapping. So a
 * comparison that no longer holds up disappears from the sitemap and the
 * prerender in the same build that stops rendering it.
 */
export function getComparisonRoutes() {
  const hub = {
    type: 'compare-hub',
    page: 'Compare',
    path: canonicalPath(COMPARE_HUB.path),
    title: COMPARE_HUB.title,
    description: COMPARE_HUB.description,
    heading: COMPARE_HUB.heading,
    priority: 0.9,
    changefreq: 'weekly',
  };

  const pages = getComparisons().map((comparison) => ({
    type: 'comparison',
    path: comparison.path,
    title: comparison.title,
    description: comparison.description,
    heading: comparison.heading,
    // Supplier matchups sit level with provider pages: they answer the same
    // question one step later in the decision. Plan-shape comparisons are
    // evergreen and rank for their own terms, so they sit alongside them.
    priority: 0.8,
    changefreq: 'weekly',
    comparison,
  }));

  return [hub, ...pages];
}

/**
 * The utility hub and every delivery territory under it.
 *
 * As with the comparisons, the registry does not decide which utilities exist —
 * src/seo/utilities.js does, and it publishes one only where we already cover
 * enough of its territory to say something the state page does not. A utility
 * that falls below that bar leaves the sitemap and the prerender in the same
 * build that stops rendering it.
 */
export function getUtilityRoutes() {
  const utilities = getUtilities();
  if (!utilities.length) return [];

  const hub = {
    type: 'utility-hub',
    page: 'Utilities',
    path: canonicalPath(UTILITY_HUB.path),
    title: UTILITY_HUB.title,
    description: UTILITY_HUB.description,
    heading: UTILITY_HUB.heading,
    priority: 0.8,
    changefreq: 'monthly',
  };

  const pages = utilities.map((utility) => {
    const where = utility.stateCodes.map((code) => STATE_NAMES[code]).join(', ');
    return {
      type: 'utility',
      path: utility.path,
      // The name people search is the utility's, so it leads. "Rates" is in the
      // query too, and the page does answer it — by explaining which half of the
      // bill the utility actually controls.
      // Short name in the title: "Oncor Electric Delivery Electricity Rates" ran
      // to 79 characters and was truncated in results. The name people type is
      // the short one anyway.
      // The subtitle earns its place by saying what makes the page different,
      // but not at the cost of a truncated result. Long utility names drop it.
      title:
        `${utility.shortName} Electricity Rates: Delivery vs Supply | Electric Scouts`.length <= 70
          ? `${utility.shortName} Electricity Rates: Delivery vs Supply | Electric Scouts`
          : `${utility.shortName} Electricity Rates and Delivery | Electric Scouts`,
      description:
        `${utility.shortName} delivers power in ${where} — it does not set your energy rate. ` +
        `What it charges for, and the plans you can buy instead.`,
      heading: `${utility.name} Electricity Rates`,
      // Delivery territories change far more slowly than plan prices, and the
      // page's own figures come from the state snapshot, so it does not need
      // the weekly recrawl a comparison page earns.
      priority: 0.7,
      changefreq: 'monthly',
      utility,
    };
  });

  return [hub, ...pages];
}

/** Mirrors utils/providerSlug.generateProviderSlug. */
export function providerSlug(name) {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * H1 used in the prerendered HTML of each static page. Kept short and factual —
 * it describes the same thing the React page renders.
 */
export const STATIC_HEADINGS = {
  '/': 'Compare Electricity Rates Across 12 Deregulated States',
  '/compare-rates': 'Compare Electricity Rates Side by Side',
  '/bill-analyzer': 'Electricity Bill Analyzer',
  '/all-providers': 'Electricity Providers Directory',
  '/all-states': 'Electricity Rates by State',
  '/all-cities': 'Electricity Rates by City',
  '/learning-center': 'Learning Center: Electricity Guides and Tips',
  '/residential-electricity': 'Compare Residential Electricity Options',
  '/renewable-energy': 'Renewable Energy Plans',
  '/renewable-compare-rates': 'Compare Renewable Electricity Plans',
  '/business-electricity': 'Business Electricity Rates and Plans',
  '/business-hub': 'Business Electricity Hub',
  '/business-compare-rates': 'Compare Business Electricity Rates',
  '/savings-calculator': 'Electricity Savings Calculator',
  '/faq': 'Electricity Questions, Answered',
  '/about-us': 'About Electric Scouts',
  '/home-concierge': 'Home Concierge: Set Up Every Utility in One Place',
  '/privacy-policy': 'Privacy Policy',
  '/terms-of-service': 'Terms of Service',
};

/** Static routes normalized into the same shape as the generated ones. */
export function getStaticRoutes() {
  return STATIC_ROUTES.map((route) => {
    const path = canonicalPath(route.path);
    return {
      type: path === '/' ? 'home' : 'static',
      ...route,
      path,
      heading: STATIC_HEADINGS[path],
    };
  });
}

export function getNoindexRoutes() {
  return NOINDEX_ROUTES.map((route) => ({
    type: 'noindex',
    ...route,
    path: canonicalPath(route.path),
    noindex: true,
  }));
}

/**
 * Routes that are indexable but deliberately canonicalize to another URL,
 * matching the `canonical` prop the page itself declares. /landing is an
 * alternate hero for the homepage, so it consolidates onto "/" rather than
 * being noindexed — a canonical is the correct signal for a true duplicate.
 */
export const ALIAS_ROUTES = [
  {
    type: 'alias',
    path: '/landing',
    canonical: '/',
    title: "Electric Scouts | Stop Overpaying for Electricity — We'll Prove It",
    description:
      "Compare electricity plans across the 12 US states where you can choose your supplier. Enter a ZIP code or upload a bill to see what you pay and what is available.",
    heading: 'Stop Overpaying for Electricity',
  },
];

export function getAliasRoutes() {
  return ALIAS_ROUTES.map((route) => ({ ...route, path: canonicalPath(route.path) }));
}

/**
 * Every indexable public URL, deduplicated, in sitemap order.
 * This is the list that must match what /sitemap.xml publishes.
 *
 * @param {{providers?: Array, fullArticles?: object}} [options]
 */
export function getIndexableRoutes(options = {}) {
  const { providers = [], fullArticles } = options;
  /** @type {Array<Record<string, any>>} */
  const all = [
    ...getStaticRoutes(),
    ...getStateRoutes(),
    ...getCityRoutes(),
    ...getProviderRoutes(providers),
    ...getComparisonRoutes(),
    ...getUtilityRoutes(),
    ...getArticleRouteList(fullArticles),
  ];

  const seen = new Set();
  return all.filter((route) => {
    if (route.noindex) return false;
    if (seen.has(route.path)) return false;
    seen.add(route.path);
    return true;
  });
}

/**
 * Everything the build prerenders: indexable routes, alias routes that
 * canonicalize elsewhere, and noindex routes. Alias and noindex routes are
 * prerendered so they carry the right signal, but stay out of the sitemap.
 */
export function getAllRoutes(options = {}) {
  return [...getIndexableRoutes(options), ...getAliasRoutes(), ...getNoindexRoutes()];
}

export { STATE_NAMES, STATE_PAGE_PATHS };
