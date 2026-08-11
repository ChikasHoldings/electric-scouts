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
