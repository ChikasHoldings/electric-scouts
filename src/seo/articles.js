/**
 * articles.js
 *
 * Article routes (/learn/:slug).
 *
 * Articles currently live in src/components/learning/fullArticles.jsx, which is
 * a .jsx module and therefore not importable from plain Node. The build-time
 * prerenderer loads that module through Vite and passes the result to
 * `getArticleRoutes()`; the sitemap function, which has no bundler available at
 * runtime, falls back to ARTICLE_IDS.
 *
 * ARTICLE_IDS must stay in step with the keys of `fullArticles` — the SEO
 * regression suite asserts exactly that, so a new article that is not routable
 * (or an ID listed here with no article behind it) fails the test run.
 *
 * WHY THESE URLS CARRY SLUGS
 *
 * Every one of these 73 guides used to live at /learn/<number>. The URL is one
 * of the few places a page gets to state its subject in Google's own terms, and
 * "/learn/16" states nothing at all: it is not a keyword, it is not readable in
 * a SERP, it tells a person nothing about what they are about to click, and it
 * gives a link to this page no anchor context whatsoever. Seventy-three of the
 * best pages on the site were throwing that away.
 *
 * The slugs below are written by hand rather than derived from titles, for two
 * reasons. A generated slug inherits whatever is in the title at the time —
 * including the year, and including rate claims like "under-8-kwh" that are
 * wrong the moment the market moves, on a URL that then has to live forever.
 * And a title long enough to need truncating produces a slug cut mid-phrase.
 * These are permanent addresses, so they are short, keyword-first, and carry
 * nothing that expires.
 *
 * The numeric URLs still resolve: vercel.json 301s every /learn/<id> to its
 * slug, so existing links and anything Google already has keep their equity
 * instead of becoming a pair of duplicate URLs.
 */

import { canonicalPath } from './site.js';

/** IDs of every published article that /learn/:slug resolves. */
export const ARTICLE_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
  51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
  61, 62, 63, 64, 65, 66, 67, 68, 69, 70,
  106, 107, 108,
];

/**
 * The permanent URL slug for each article.
 *
 * Changing a value here changes a live URL, so a change must ship with a
 * redirect from the old slug. Adding an article means adding its id to
 * ARTICLE_IDS and its slug here; the regression suite fails if the two drift,
 * and the prerender build fails if a published id has no slug.
 */
export const ARTICLE_SLUGS = {
  1: 'deregulated-electricity-markets',
  2: 'how-to-compare-electricity-rates',
  3: 'fixed-vs-variable-rate-electricity',
  4: 'green-energy-plans',
  5: 'business-electricity-rates-guide',
  6: 'average-electric-bill-by-state',
  7: 'how-to-switch-electricity-providers',
  8: 'cheapest-electricity-plans-texas',
  9: 'no-deposit-electricity-plans',
  10: 'how-to-read-your-electricity-bill',
  11: 'best-electricity-plans-for-apartments',
  12: 'solar-vs-traditional-electricity-cost',
  13: 'electricity-rates-forecast',
  14: 'how-to-lower-your-electric-bill',
  15: 'electricity-deregulation-explained',
  16: 'texas-electricity-rates-guide',
  17: 'illinois-electricity-rates-guide',
  18: 'ohio-electricity-rates-guide',
  19: 'pennsylvania-electricity-rates-guide',
  20: 'new-york-electricity-rates-esco-guide',
  21: 'new-jersey-electricity-rates-guide',
  22: 'maryland-electricity-rates-guide',
  23: 'massachusetts-electricity-rates-guide',
  24: 'connecticut-electricity-rates-guide',
  25: 'maine-electricity-rates-guide',
  26: 'new-hampshire-electricity-rates-guide',
  27: 'rhode-island-electricity-rates-guide',
  // 28-37: nine of these guides sat at <city>-electricity-rates, which is the
  // exact query /electricity-rates/<state>/<city> is built to win. Two of our
  // own URLs chasing one query splits the signal and we lose it twice. Each one
  // is really about the delivery utility a reader is trying to get away from —
  // "ComEd Alternatives", "PECO Alternatives" — so the slug says that instead,
  // which is both a distinct query and a truer description of the article.
  28: 'cheapest-electricity-plans-houston',
  29: 'dallas-fort-worth-electricity-plans',
  30: 'comed-alternatives-chicago',
  31: 'peco-alternatives-philadelphia',
  32: 'coned-alternatives-nyc',
  33: 'cps-energy-san-antonio-explained',
  34: 'austin-energy-explained',
  35: 'columbus-ohio-electricity-rates',
  36: 'bge-alternatives-baltimore',
  37: 'eversource-alternatives-boston',
  // Deliberately not "txu-energy-vs-reliant-energy": that is the slug of the
  // /compare page, and two of our own URLs chasing one query is a fight we lose
  // twice. This one is the opinionated guide, so it asks the question.
  38: 'txu-vs-reliant-which-is-better',
  39: 'green-mountain-energy-review',
  40: 'octopus-energy-review',
  41: 'just-energy-review',
  42: 'rhythm-energy-review',
  43: 'prepaid-electricity-plans',
  44: 'free-nights-and-weekends-electricity-plans',
  45: 'month-to-month-electricity-plans',
  46: 'summer-electricity-bills',
  47: 'winter-heating-costs-electric-vs-gas',
  48: 'best-time-to-switch-electricity-providers',
  49: 'moving-to-texas-electricity-setup',
  50: 'moving-set-up-electricity-service',
  51: 'ercot-electricity-market-explained',
  52: 'cheapest-electricity-rates-by-state',
  53: 'how-to-negotiate-your-electricity-rate',
  54: 'electricity-usage-calculator',
  55: 'smart-thermostat-savings',
  56: 'time-of-use-electricity-plans',
  57: 'what-is-a-kwh',
  58: 'electricity-delivery-charges-explained',
  59: 'ppa-vs-buying-solar',
  60: 'community-solar-explained',
  61: 'ev-charging-at-home-cost',
  62: 'electricity-scams',
  63: 'electricity-customer-rights',
  64: 'electricity-contract-expires',
  65: 'how-to-file-electricity-complaint',
  66: 'small-business-electricity-rates',
  67: 'restaurant-electricity-costs',
  68: 'office-building-electricity-rates',
  69: 'demand-charges-explained',
  70: 'business-solar-vs-grid-electricity',
  106: 'nashua-nh-electricity-rates',
  107: 'concord-nh-electricity-rates',
  108: 'warwick-ri-electricity-rates',
};

/** slug -> id, for resolving a URL back to an article. */
const ID_BY_SLUG = new Map(
  Object.entries(ARTICLE_SLUGS).map(([id, slug]) => [slug, Number(id)])
);

/** The article a /learn/ URL segment refers to, by slug or by legacy id. */
export function articleIdForSlug(segment) {
  if (segment === undefined || segment === null) return null;
  const value = String(segment).trim();
  if (ID_BY_SLUG.has(value)) return ID_BY_SLUG.get(value);
  const asNumber = Number(value);
  return ARTICLE_IDS.includes(asNumber) ? asNumber : null;
}

/** The canonical URL for an article, taking an id or a slug. */
export function articlePath(idOrSlug) {
  const slug = ARTICLE_SLUGS[idOrSlug] || idOrSlug;
  return canonicalPath(`/learn/${slug}`);
}

/** The pre-slug URL an article used to live at, for the redirect table. */
export function legacyArticlePath(id) {
  return canonicalPath(`/learn/${id}`);
}

/**
 * Build article route descriptors.
 *
 * @param {Record<string, {title?: string, metaTitle?: string, metaDescription?: string, content?: string}>} [fullArticles]
 *   The loaded fullArticles map. When omitted, routes carry IDs only and the
 *   caller is expected to use them for URLs (sitemap) rather than metadata.
 */
export function getArticleRoutes(fullArticles) {
  return ARTICLE_IDS.map((id) => {
    const article = fullArticles ? fullArticles[id] : undefined;
    return {
      id,
      slug: ARTICLE_SLUGS[id],
      path: articlePath(id),
      legacyPath: legacyArticlePath(id),
      title: article?.metaTitle || article?.title,
      heading: article?.title,
      description: article?.metaDescription,
      content: article?.content,
    };
  });
}
