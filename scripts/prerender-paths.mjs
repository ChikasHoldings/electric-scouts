/**
 * prerender-paths.mjs
 *
 * The route -> output-file rule, in one place.
 *
 * scripts/prerender-seo.mjs writes the files and
 * scripts/assert-prerender-output.mjs proves they are the right files. If each
 * of them carried its own copy of this mapping, the assertion could pass while
 * looking at a path the prerenderer no longer writes — an assertion that agrees
 * with itself and not with the build is worse than no assertion at all.
 *
 * Build-only: this describes the shape of dist/, which nothing in the browser
 * bundle has any business knowing.
 */

import path from 'node:path';

/**
 * Where a route's HTML is written inside dist.
 *
 * "/" is dist/index.html, which is also the template vite build produced.
 * Everything else is dist/<path>/index.html, so Vercel serves it for the
 * extensionless URL without needing a rewrite.
 */
export function outputPathFor(distDir, routePath) {
  if (routePath === '/') return path.join(distDir, 'index.html');
  return path.join(distDir, routePath.replace(/^\//, ''), 'index.html');
}

/** The path a browser requests to reach the file above, for reporting. */
export function servedPathFor(routePath) {
  return routePath === '/' ? '/' : routePath;
}
