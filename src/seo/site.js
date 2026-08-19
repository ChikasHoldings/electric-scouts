/**
 * site.js
 *
 * THE single source of truth for the production origin used by every SEO
 * surface: canonical tags, Open Graph URLs, JSON-LD, sitemap.xml and robots.txt.
 *
 * Why www: the production deployment serves the site on
 * https://www.electricscouts.com and redirects the apex (electricscouts.com)
 * to it. A canonical URL must point at a URL that returns 200 directly, so the
 * canonical host has to be the one that is actually served.
 *
 * To move the canonical host to the apex domain later, change SITE_URL below
 * AND flip the primary domain in the Vercel project so that www redirects to
 * the apex instead of the other way round. Those two changes must ship
 * together, otherwise every canonical URL points at a redirect.
 *
 * This module is plain ESM with no dependencies so it can be imported from the
 * browser bundle, from Vercel serverless functions and from Node build scripts.
 */

const DEFAULT_SITE_URL = 'https://www.electricscouts.com';

function readNodeEnv(key) {
  try {
    // Reached through globalThis so this module type-checks in the browser
    // build, where Node's `process` global does not exist.
    const env = /** @type {any} */ (globalThis).process?.env;
    if (env && env[key]) return env[key];
  } catch {
    /* not running under Node */
  }
  return undefined;
}

function normalizeOrigin(value) {
  if (!value) return DEFAULT_SITE_URL;
  let origin = String(value).trim();
  if (!/^https?:\/\//i.test(origin)) origin = `https://${origin}`;
  // Canonical URLs are always https and never carry a trailing slash.
  origin = origin.replace(/^http:\/\//i, 'https://').replace(/\/+$/, '');
  return origin || DEFAULT_SITE_URL;
}

/**
 * Production origin, e.g. "https://www.electricscouts.com" (no trailing slash).
 * SEO_SITE_URL is honoured so build scripts and tests can target another host;
 * it is deliberately not wired to preview deployments, because preview builds
 * must never publish preview-hostname canonicals.
 */
export const SITE_URL = normalizeOrigin(readNodeEnv('SEO_SITE_URL') || DEFAULT_SITE_URL);

export const SITE_NAME = 'Electric Scouts';

/**
 * Normalize a pathname into its single canonical representation:
 * leading slash, lower case, no query string, no hash, no trailing slash
 * (except the root), no duplicate slashes.
 *
 * "/Texas-Electricity/?utm_source=x" -> "/texas-electricity"
 */
export function canonicalPath(pathname) {
  if (!pathname) return '/';
  let path = String(pathname).split('#')[0].split('?')[0];
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/{2,}/g, '/').toLowerCase();
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path || '/';
}

/** Absolute canonical URL for a path: "/faq" -> "https://www.electricscouts.com/faq" */
export function absoluteUrl(pathname) {
  const path = canonicalPath(pathname);
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

/**
 * Longest title Google will render before truncating it with an ellipsis.
 *
 * Not a hard rule of the algorithm — it is a pixel width, and 60 characters is
 * the conventional proxy for it. Overflow costs nothing in ranking and a great
 * deal in clicks: the tail of the title is what distinguishes one result from
 * the next, and it is exactly the part that gets cut.
 */
export const TITLE_MAX = 60;

export const BRAND_SUFFIX = ` | ${SITE_NAME}`;

/**
 * Longest description a result will show before it is cut.
 *
 * Softer than the title limit — Google rewrites most descriptions anyway — but
 * a snippet that ends mid-word is still a snippet whose last clause was wasted,
 * and the last clause is usually the one carrying the call to action.
 */
export const DESCRIPTION_MAX = 158;

/**
 * Append the brand to a title, but only while it still fits.
 *
 * 107 of this site's indexable titles were over the limit, and every one of
 * them was over it *because* of the suffix — "Constellation Energy vs Verde
 * Energy: Rates Compared" is 52 characters and reads fine; the same title with
 * " | Electric Scouts" bolted on is 70 and reaches the SERP as
 * "…vs Verde Energy: Rates Compar…". The brand is the least informative part of
 * the string and the only optional one, so it is what gives way. Google appends
 * the site name to the result itself in most cases anyway.
 *
 * A `core` that is already too long on its own is returned untouched rather
 * than cut mid-word: silently truncating a hand-written title would hide the
 * problem instead of surfacing it, and the audit reports what remains.
 */
export function withBrand(core) {
  const title = String(core || '').trim();
  if (!title) return SITE_NAME;
  if (title.includes(SITE_NAME)) return title;
  return title.length + BRAND_SUFFIX.length <= TITLE_MAX ? `${title}${BRAND_SUFFIX}` : title;
}

/** Strip a trailing " | Electric Scouts" so a title can be re-measured. */
export function stripBrand(title) {
  const value = String(title || '').trim();
  return value.endsWith(BRAND_SUFFIX) ? value.slice(0, -BRAND_SUFFIX.length).trim() : value;
}
