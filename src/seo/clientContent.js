/**
 * clientContent.js
 *
 * Rebuilds a page's content model in the browser, for the one case the
 * prerendered content island cannot cover: an in-app navigation, where the
 * island still describes the URL the visitor first landed on.
 *
 * It resolves the path against the same route registry the prerenderer and the
 * sitemap use, and hands the result to the same section builders, so a page
 * reached by clicking a link carries exactly the content it would have carried
 * had the visitor typed its URL. There is no second copy of the content rules
 * here — only the lookup that turns a pathname back into a route.
 *
 * This module is imported lazily (see SeoSections). It pulls in the market
 * snapshot and the city tables, which nothing on a first paint should wait for.
 */

import { canonicalPath } from './site.js';
import { getCities, getStates } from './locations.js';
import {
  getAliasRoutes,
  getArticleRouteList,
  getCityRoutes,
  getComparisonRoutes,
  getProviderRoutes,
  getStateRoutes,
  getStaticRoutes,
  getUtilityRoutes,
} from './routes.js';
import { getPublishableProviders } from './market.js';
import { buildPageContent } from './render.js';

/** Route descriptors for everything except articles, keyed by path. */
let routeIndex = null;

function getRouteIndex() {
  if (routeIndex) return routeIndex;
  routeIndex = new Map();
  const routes = [
    ...getStaticRoutes(),
    ...getStateRoutes(),
    ...getCityRoutes(),
    ...getProviderRoutes(getPublishableProviders()),
    ...getComparisonRoutes(),
    ...getUtilityRoutes(),
    ...getAliasRoutes(),
  ];
  for (const route of routes) {
    if (!routeIndex.has(route.path)) routeIndex.set(route.path, route);
  }
  return routeIndex;
}

/** Context the section builders need: sibling cities, the state list. */
let contextCache = null;

function getContext() {
  if (contextCache) return contextCache;
  const citiesByState = {};
  for (const city of getCities()) {
    (citiesByState[city.stateCode] ||= []).push(city);
  }
  contextCache = { states: getStates(), citiesByState };
  return contextCache;
}

/**
 * Content model for a path, or null when the path is not a content route.
 *
 * @param {string} pathname
 * @returns {Promise<{path: string, type: string, intro: string[], sections: object[]}|null>}
 */
export async function buildContentForPath(pathname) {
  const path = canonicalPath(pathname);

  // Articles carry their own bodies in a 200 kB chunk that only the article
  // page needs, so they are resolved separately and only when one is asked for.
  if (path.startsWith('/learn/')) {
    const { fullArticles } = await import('@/components/learning/fullArticles.jsx');
    const route = getArticleRouteList(fullArticles).find((entry) => entry.path === path);
    if (!route) return null;
    const content = buildPageContent(route, { ...getContext(), fullArticles });
    return { path, type: route.type, intro: content.intro || [], sections: content.sections || [] };
  }

  const route = getRouteIndex().get(path);
  if (!route) return null;

  const content = buildPageContent(route, getContext());
  return { path, type: route.type, intro: content.intro || [], sections: content.sections || [] };
}
