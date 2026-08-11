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

/**
 * Public, indexable pages with hand-authored metadata.
 * `page` is the pages.config.js key, used by the parity test.
 */
export const STATIC_ROUTES = [
  {
    page: "Home",
    path: "/",
    title: "Electric Scouts | Stop Overpaying for Electricity — We'll Prove It",
    description: "Upload your bill or enter your ZIP. Electric Scouts analyzes your usage, exposes hidden charges, and matches you with the lowest rate from 40+ providers across 12 states. Free Bill Analyzer included.",
    priority: 1.0,
    changefreq: "daily",
  },
  {
    page: "CompareRates",
    path: "/compare-rates",
    title: "Side-by-Side Rate Comparison | Electric Scouts",
    description: "Enter your ZIP code and instantly see side-by-side electricity rates from dozens of providers. Filter by price, term length, or green energy. Free, fast, and built for clarity.",
    priority: 1.0,
    changefreq: "daily",
  },
  {
    page: "BillAnalyzer",
    path: "/bill-analyzer",
    title: "Bill Analyzer | Spot Hidden Savings on Your Electricity Bill | Electric Scouts",
    description: "Upload your electricity bill and get instant AI-powered analysis. Discover better rates, calculate exact savings, find personalized plan recommendations. Free bill analysis for TX, PA, NY, OH, IL & more. Compare your current rate with 40+ providers. See how much you can save.",
    priority: 0.9,
    changefreq: "weekly",
  },
  {
    page: "AllProviders",
    path: "/all-providers",
    title: "Browse All Energy Providers | Electric Scouts Directory",
    description: "Explore our full directory of energy providers across 12 deregulated states. Filter by state, plan type, or rating to find the right fit for your home or business. Transparent details, real reviews, no sales pressure.",
    priority: 0.9,
    changefreq: "weekly",
  },
  {
    page: "AllStates",
    path: "/all-states",
    title: "Deregulated Electricity States - Compare Rates in 12 Markets | Electric Scouts",
    description: "Compare electricity rates in 12 deregulated states: Texas (TX), Illinois (IL), Ohio (OH), Pennsylvania (PA), New York (NY), New Jersey (NJ), Maryland (MD), Massachusetts (MA), Maine (ME), New Hampshire (NH), Rhode Island (RI), Connecticut (CT). Choose your electricity supplier, compare 40+ providers, save up to $800/year. Free comparison across all competitive energy markets.",
    priority: 0.9,
    changefreq: "weekly",
  },
  {
    page: "AllCities",
    path: "/all-cities",
    title: "Compare Electricity Rates by City | All Cities | Electric Scouts",
    description: "Browse electricity rates and providers in cities across deregulated states. Compare plans in Houston, Dallas, Chicago, New York, Philadelphia, and more.",
    priority: 0.9,
    changefreq: "weekly",
  },
  {
    page: "LearningCenter",
    path: "/learning-center",
    title: "Energy Know-How | Guides & Tips from Electric Scouts",
    description: "Practical guides and tips to help you understand electricity markets, pick the right plan, and keep your bills low. Written by the Electric Scouts team for real people, not industry insiders.",
    priority: 0.9,
    changefreq: "weekly",
  },
  {
    page: "RenewableEnergy",
    path: "/renewable-energy",
    title: "Renewable Energy Plans | Clean Power Options in 12 States | Electric Scouts",
    description: "Compare 100% renewable energy plans from wind and solar in TX, PA, NY, OH, IL, NJ, MD, MA, ME, NH, RI, CT. Green electricity at competitive rates. 50+ clean energy plans. Reduce carbon footprint. Save money while supporting renewable energy. Fixed & variable green energy rates. Switch to solar and wind power today.",
    priority: 0.8,
    changefreq: "weekly",
  },
  {
    page: "RenewableCompareRates",
    path: "/renewable-compare-rates",
    title: "Go Green | Compare Renewable Electricity Plans | Electric Scouts",
    description: "Find the best renewable energy electricity plans in your area. Compare 100% green energy rates from wind and solar providers. Support clean energy while saving money.",
    priority: 0.8,
    changefreq: "weekly",
  },
  {
    page: "BusinessElectricity",
    path: "/business-electricity",
    title: "Business Electricity Solutions | Plans for Every Company Size | Electric Scouts",
    description: "Compare business electricity rates for small businesses, large commercial facilities, and industrial operations across 12 states. Get custom quotes for tiered pricing, demand charges, and load management. Save up to $5,000+ annually on commercial energy costs with competitive business electricity plans.",
    priority: 0.8,
    changefreq: "weekly",
  },
  {
    page: "BusinessHub",
    path: "/business-hub",
    title: "Business Electricity Plans - Commercial Energy Solutions | Electric Scouts",
    description: "Compare commercial electricity rates for your business. Custom usage tiers, volume discounts, flexible contracts. Save up to 30% on business energy costs.",
    priority: 0.8,
    changefreq: "weekly",
  },
  {
    page: "BusinessCompareRates",
    path: "/business-compare-rates",
    title: "Business Rate Finder | Commercial Electricity Plans | Electric Scouts",
    description: "Find the best electricity rates for your business. Compare commercial energy plans from 40+ providers. Fixed rates, volume discounts, and dedicated business support.",
    priority: 0.8,
    changefreq: "weekly",
  },
  {
    page: "SavingsCalculator",
    path: "/savings-calculator",
    title: "Electricity Savings Calculator - Predict Your Annual Savings | Electric Scouts",
    description: "Calculate how much you can save on electricity bills. Input your current rate and usage to get personalized savings estimates and plan recommendations for your state.",
    priority: 0.8,
    changefreq: "weekly",
  },
  {
    page: "FAQ",
    path: "/faq",
    title: "Electricity FAQ | Honest Answers from Electric Scouts",
    description: "Get answers to frequently asked questions about electricity deregulation, switching providers, plan types, rates, billing, contracts & saving money. Expert guidance for TX, PA, NY, OH, IL, NJ, MD, MA & more. Learn about fixed vs variable rates, kWh usage, early termination fees, renewable energy, deposits & more.",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    page: "AboutUs",
    path: "/about-us",
    title: "About Electric Scouts | Who We Are & Why We Built This",
    description: "Electric Scouts was built with one goal: make it dead simple to find a better electricity deal. We are an independent comparison platform covering 12 deregulated states, 40+ providers, and hundreds of plans. No hidden fees, no bias — just clarity.",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    page: "HomeConcierge",
    path: "/home-concierge",
    title: "Home Concierge | Set Up All Utilities | Electric Scouts",
    description: "Let Electric Scouts handle your electricity, internet, water, and phone setup. Free one-stop home concierge service for new movers.",
    priority: 0.7,
    changefreq: "monthly",
  },
  {
    page: "PrivacyPolicy",
    path: "/privacy-policy",
    title: "Privacy Policy - Electric Scouts | How We Protect Your Data",
    description: "Electric Scouts privacy policy. Learn how we protect your personal information and data when you compare electricity rates. We do not sell your information.",
    priority: 0.3,
    changefreq: "yearly",
  },
  {
    page: "TermsOfService",
    path: "/terms-of-service",
    title: "Terms of Service - Electric Scouts | User Agreement & Guidelines",
    description: "Electric Scouts terms of service and user agreement. Understand your rights, responsibilities, and legal terms when using our free electricity rate comparison platform.",
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

/** Metadata for the 12 state landing pages, keyed by state code. */
export const STATE_ROUTE_META = {
  TX: {
    page: "TexasElectricity",
    title: "Texas Electricity Rates - Compare 45+ Providers & Save $800/Year | Electric Scouts TX",
    description: "Compare Texas electricity rates from TXU, Reliant, Gexa & 40+ providers. Serving Houston, Dallas, Austin, San Antonio. Find cheap electricity plans for your home. Fixed & variable rates. 100% renewable options. Switch in minutes & save up to $800 annually. Free comparison, instant results.",
  },
  IL: {
    page: "IllinoisElectricity",
    title: "Illinois Electricity Rates - Compare 36+ Providers & Save $700/Year | Electric Scouts IL",
    description: "Compare Illinois electricity rates from Constellation, Direct Energy & 35+ providers. Serving Chicago, Aurora, Naperville, Rockford. Find affordable electricity plans for your home. Fixed & variable rates. 100% green energy options. Switch easily & save up to $700 annually. Free IL electricity comparison.",
  },
  OH: {
    page: "OhioElectricity",
    title: "Ohio Electricity Rates - Compare 40+ Suppliers & Save $760/Year | Electric Scouts OH",
    description: "Compare Ohio electricity rates from Constellation, Direct Energy, IGS Energy & 38+ suppliers. Serving Cleveland, Columbus, Cincinnati, Toledo, Akron. Find competitive electricity plans for your home. Fixed & variable rates. Renewable energy options. Switch & save up to $760 annually. Free Ohio electricity comparison tool.",
  },
  PA: {
    page: "PennsylvaniaElectricity",
    title: "Pennsylvania Electricity Rates - Compare 38+ Suppliers & Save $750/Year | Electric Scouts PA",
    description: "Compare Pennsylvania electricity rates from Constellation, Direct Energy, Champion Energy & 36+ suppliers. Serving Philadelphia, Pittsburgh, Allentown, Harrisburg. Find competitive electricity plans for your home. Fixed & variable rates. 100% green energy options. Switch easily & save up to $750 annually. Free PA electricity comparison.",
  },
  NY: {
    page: "NewYorkElectricity",
    title: "New York Electricity Rates - Compare 42+ ESCOs & Save $740/Year | Electric Scouts NY",
    description: "Compare New York electricity rates from Constellation, Direct Energy, Verde Energy & 40+ ESCOs. Serving NYC, Buffalo, Rochester, Albany, Syracuse. Find competitive electricity plans for your home or business. Fixed & variable rates. 100% renewable energy options. Switch from Con Edison, National Grid & save up to $740 annually. Free NY ESCO comparison.",
  },
  NJ: {
    page: "NewJerseyElectricity",
    title: "New Jersey Electricity Rates - Compare 35+ Third Party Suppliers & Save $720/Year | NJ",
    description: "Compare New Jersey electricity rates from Constellation, Direct Energy, Starion Energy & 33+ Third Party Suppliers. Serving Newark, Jersey City, Paterson, Elizabeth, Trenton. Find competitive electricity plans for your home. Fixed & variable rates. 100% renewable energy options. Switch from PSE&G, JCP&L & save up to $720 annually. Free NJ electricity comparison.",
  },
  MD: {
    page: "MarylandElectricity",
    title: "Maryland Electricity Rates - Compare 32+ Suppliers & Save $680/Year | Electric Scouts MD",
    description: "Compare Maryland electricity rates from Constellation, Direct Energy, WGL Energy & 30+ suppliers. Serving Baltimore, Columbia, Germantown, Silver Spring, Annapolis. Find competitive electricity plans for your home. Fixed & variable rates. 100% renewable energy options. Switch from BGE, Pepco, Delmarva Power & save up to $680 annually. Free MD electricity comparison.",
  },
  MA: {
    page: "MassachusettsElectricity",
    title: "Massachusetts Electricity Rates - Compare 34+ Suppliers & Save $710/Year | Electric Scouts MA",
    description: "Compare Massachusetts electricity rates from Constellation, Direct Energy, Verde Energy & 32+ competitive suppliers. Serving Boston, Worcester, Springfield, Cambridge, Lowell. Find affordable electricity plans for your home. Fixed & variable rates. 100% renewable energy options. Switch from Eversource, National Grid & save up to $710 annually. Free MA electricity comparison.",
  },
  ME: {
    page: "MaineElectricity",
    title: "Maine Electricity Rates - Compare 22+ Competitive Suppliers & Save $620/Year | Electric Scouts ME",
    description: "Compare Maine electricity rates from Constellation, Direct Energy, Verde Energy & 20+ competitive suppliers. Serving Portland, Lewiston, Bangor, Auburn, South Portland. Find affordable electricity plans for your home. Fixed & variable rates. 100% renewable energy options. Switch from CMP, Versant Power & save up to $620 annually. Free Maine electricity comparison tool.",
  },
  NH: {
    page: "NewHampshireElectricity",
    title: "New Hampshire Electricity Rates - Compare 25+ Suppliers & Save $640/Year | Electric Scouts NH",
    description: "Compare New Hampshire electricity rates from Constellation, Direct Energy, Verde Energy & 23+ competitive suppliers. Serving Manchester, Nashua, Concord, Derry, Rochester, Salem. Find affordable electricity plans for your home. Fixed & variable rates. 100% renewable energy options. Switch from Eversource, Liberty Utilities & save up to $640 annually. Free NH electricity comparison.",
  },
  RI: {
    page: "RhodeIslandElectricity",
    title: "Rhode Island Electricity Rates - Compare 26+ Suppliers & Save $660/Year | Electric Scouts RI",
    description: "Compare Rhode Island electricity rates from Constellation, Direct Energy, Verde Energy & 24+ competitive suppliers. Serving Providence, Warwick, Cranston, Pawtucket, East Providence. Find affordable electricity plans for your home. Fixed & variable rates. 100% renewable energy options. Switch from Rhode Island Energy, National Grid & save up to $660 annually. Free RI electricity comparison.",
  },
  CT: {
    page: "ConnecticutElectricity",
    title: "Connecticut Electricity Rates - Compare 30+ Suppliers & Save $690/Year | Electric Scouts CT",
    description: "Compare Connecticut electricity rates from Constellation, Direct Energy, Verde Energy & 28+ competitive suppliers. Serving Hartford, New Haven, Bridgeport, Stamford, Waterbury, Norwalk. Find competitive electricity plans for your home. Fixed & variable rates. 100% renewable energy options. Switch from Eversource, United Illuminating & save up to $690 annually. Free CT electricity comparison.",
  },
};

/* ------------------------------------------------------------------ *
 * Route builders
 * ------------------------------------------------------------------ */

/** The 12 state landing pages. */
export function getStateRoutes() {
  return getStates().map((state) => {
    const meta = STATE_ROUTE_META[state.code];
    return {
      type: 'state',
      path: canonicalPath(state.path),
      title: meta.title,
      description: meta.description,
      heading: `${state.name} Electricity Rates & Providers`,
      priority: 0.9,
      changefreq: 'weekly',
      state,
    };
  });
}

/** One route per city that has real data behind it. */
export function getCityRoutes() {
  return getCities().map((city) => ({
    type: 'city',
    path: city.path,
    // Mirrors the title CityRates renders via <SEOHead>.
    title: `${city.name}, ${city.stateCode} Electricity Rates 2025 - Compare ${city.providers}+ Providers | Electric Scouts`,
    description:
      `Compare ${city.name} electricity rates from ${city.providers}+ providers. ` +
      `Average ${city.avgRate} (est. ${city.avgMonthlyBill}/mo) in ${city.county}. ` +
      `Switch and save — 100% free comparison.`,
    heading: `Cheap Electricity Rates in ${city.name}, ${city.stateName}`,
    priority: 0.8,
    changefreq: 'weekly',
    city,
  }));
}

/**
 * One route per article. Pass the loaded `fullArticles` map to get real titles
 * and descriptions; without it the routes carry URLs only (sitemap use).
 */
export function getArticleRouteList(fullArticles) {
  return getArticleRoutes(fullArticles).map((article) => ({
    type: 'article',
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
 * Provider detail pages. Only providers the app actually renders belong here:
 * ProviderDetails resolves its slug against `is_active` providers, so an
 * inactive provider's URL would render a "Provider Not Found" shell.
 *
 * @param {Array<{name: string, updated_at?: string}>} activeProviders
 */
export function getProviderRoutes(activeProviders = []) {
  return activeProviders
    .filter((provider) => provider && provider.name)
    .map((provider) => {
      const slug = providerSlug(provider.name);
      return {
        type: 'provider',
        path: canonicalPath(`/providers/${slug}`),
        title: `${provider.name} Electricity Plans & Rates | Electric Scouts`,
        description:
          `Compare ${provider.name} electricity plans, rates and contract terms. ` +
          `See how ${provider.name} stacks up against other providers before you switch.`,
        heading: provider.name,
        priority: 0.8,
        changefreq: 'weekly',
        lastmod: provider.updated_at ? String(provider.updated_at).split('T')[0] : undefined,
        provider,
      };
    })
    .filter((route) => route.path !== '/providers/');
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
  '/': 'Compare Electricity Rates from 40+ Providers Across 12 States',
  '/compare-rates': 'Compare Electricity Rates Side by Side',
  '/bill-analyzer': 'Electricity Bill Analyzer',
  '/all-providers': 'Electricity Providers Directory',
  '/all-states': 'Electricity Rates by State',
  '/all-cities': 'Electricity Rates by City',
  '/learning-center': 'Learning Center: Electricity Guides and Tips',
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
      'Upload your bill or enter your ZIP. Electric Scouts analyzes your usage, exposes hidden charges, and matches you with the lowest rate from 40+ providers across 12 states. Free Bill Analyzer included.',
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
