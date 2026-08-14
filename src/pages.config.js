/**
 * pages.config.js
 *
 * Lazy-loaded page registry for optimal code splitting and fast initial load.
 * Only the Home page is eagerly loaded; all other pages are lazy-loaded.
 *
 * Each page is registered as an importer function rather than as a bare
 * `lazy()` call, because the same importer is needed twice: once to build the
 * React.lazy component, and once to start the chunk download before the router
 * ever renders. See `preloadPageForPath` at the bottom of this file.
 */

import { lazy } from 'react';
import Home from './pages/Home';
import __Layout from './Layout.jsx';
import { createPageUrl } from '@/utils';

// Lazy-loaded pages — each gets its own chunk for faster initial load
const PAGE_LOADERS = {
  AboutUs: () => import('./pages/AboutUs'),
  AllCities: () => import('./pages/AllCities'),
  AllProviders: () => import('./pages/AllProviders'),
  AllStates: () => import('./pages/AllStates'),
  ArticleDetail: () => import('./pages/ArticleDetail'),
  BillAnalyzer: () => import('./pages/BillAnalyzer'),
  BusinessCompareRates: () => import('./pages/BusinessCompareRates'),
  BusinessElectricity: () => import('./pages/BusinessElectricity'),
  BusinessHub: () => import('./pages/BusinessHub'),
  BusinessQuoteDashboard: () => import('./pages/BusinessQuoteDashboard'),
  CityRates: () => import('./pages/CityRates'),
  Compare: () => import('./pages/Compare'),
  CompareRates: () => import('./pages/CompareRates'),
  CompareVersus: () => import('./pages/CompareVersus'),
  ConnecticutElectricity: () => import('./pages/ConnecticutElectricity'),
  FAQ: () => import('./pages/FAQ'),
  HomeConcierge: () => import('./pages/HomeConcierge'),
  IllinoisElectricity: () => import('./pages/IllinoisElectricity'),
  Landing: () => import('./pages/Landing'),
  LearningCenter: () => import('./pages/LearningCenter'),
  MaineElectricity: () => import('./pages/MaineElectricity'),
  MarylandElectricity: () => import('./pages/MarylandElectricity'),
  MassachusettsElectricity: () => import('./pages/MassachusettsElectricity'),
  NewHampshireElectricity: () => import('./pages/NewHampshireElectricity'),
  NewJerseyElectricity: () => import('./pages/NewJerseyElectricity'),
  NewYorkElectricity: () => import('./pages/NewYorkElectricity'),
  NotFound: () => import('./pages/NotFound'),
  OhioElectricity: () => import('./pages/OhioElectricity'),
  PennsylvaniaElectricity: () => import('./pages/PennsylvaniaElectricity'),
  PrivacyPolicy: () => import('./pages/PrivacyPolicy'),
  ProviderDetails: () => import('./pages/ProviderDetails'),
  RenewableCompareRates: () => import('./pages/RenewableCompareRates'),
  RenewableEnergy: () => import('./pages/RenewableEnergy'),
  ResidentialElectricity: () => import('./pages/ResidentialElectricity'),
  RhodeIslandElectricity: () => import('./pages/RhodeIslandElectricity'),
  Robots: () => import('./pages/Robots'),
  SavingsCalculator: () => import('./pages/SavingsCalculator'),
  Sitemap: () => import('./pages/Sitemap'),
  SitemapXML: () => import('./pages/SitemapXML'),
  TermsOfService: () => import('./pages/TermsOfService'),
  TexasElectricity: () => import('./pages/TexasElectricity'),
};

export const PAGES = {
  // Home is eager: it is the most-landed-on route, and bundling it with the
  // entry chunk removes a round trip from the site's most common first paint.
  Home,
  ...Object.fromEntries(
    Object.entries(PAGE_LOADERS).map(([name, loader]) => [name, lazy(loader)])
  ),
};

export const pagesConfig = {
  mainPage: 'Home',
  Pages: PAGES,
  Layout: __Layout,
};

/**
 * URL prefixes for the routes App.jsx defines by hand rather than from the
 * registry. Longest-prefix-first is not needed — none of these nest.
 */
const DYNAMIC_ROUTE_PAGES = [
  ['/electricity-rates/', 'CityRates'],
  ['/learn/', 'ArticleDetail'],
  ['/providers/', 'ProviderDetails'],
  // The trailing slash matters: it keeps the hub at /compare matching the
  // registry entry below, and leaves /compare-rates alone.
  ['/compare/', 'CompareVersus'],
];

/** Which registry page renders `pathname`, or null for the eager homepage. */
export function pageNameForPath(pathname) {
  const path = (pathname || '/').replace(/\/+$/, '') || '/';
  if (path === '/') return null;

  for (const [prefix, name] of DYNAMIC_ROUTE_PAGES) {
    if (path.startsWith(prefix)) return name;
  }

  const match = Object.keys(PAGE_LOADERS).find((name) => createPageUrl(name) === path);
  return match || null;
}

/**
 * Start the current route's chunk before React renders.
 *
 * Without this, a visitor landing directly on any page other than the homepage
 * gets a guaranteed intermediate screen: the router renders, the lazy page has
 * not resolved, and the Suspense boundary paints a centred spinner over half
 * the viewport before the real page replaces it. Preloading and awaiting the
 * chunk in `main.jsx` collapses that to a single paint of the finished page.
 *
 * Resolves (never rejects) so a chunk that fails to load falls through to the
 * Suspense boundary and its retry rather than blocking the mount.
 *
 * @param {string} pathname
 * @returns {Promise<void>}
 */
export function preloadPageForPath(pathname) {
  const name = pageNameForPath(pathname);
  const loader = name && PAGE_LOADERS[name];
  if (!loader) return Promise.resolve();
  return loader().then(
    () => undefined,
    () => undefined
  );
}
