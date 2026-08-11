/**
 * data.mjs
 *
 * The one place that assembles everything the SEO layer needs to describe a
 * page: article bodies, provider records and per-state market figures.
 *
 * Both the prerenderer and the audit crawler call this, so the pages that get
 * built and the pages that get measured are built from identical inputs. The
 * previous arrangement — prerenderer queried Supabase, sitemap queried Supabase
 * separately, tests queried nothing — is how the site ended up publishing a
 * sitemap full of URLs that the build had silently skipped.
 *
 * Only article bodies still need a bundler (fullArticles.jsx imports icon
 * components), so Vite is spun up for that one module and nothing else.
 */

import { getPublishableProviders } from './market.js';

/**
 * Article bodies, loaded through Vite.
 *
 * Failure is fatal by design: 73 article URLs with no title or description is
 * precisely the outcome the registry exists to prevent, and a warning in a
 * build log does not stop a deploy.
 */
export async function loadArticles() {
  const { createServer } = await import('vite');
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const module = await server.ssrLoadModule('/src/components/learning/fullArticles.jsx');
    const articles = module.fullArticles;
    if (!articles || !Object.keys(articles).length) {
      throw new Error('fullArticles resolved to an empty map');
    }
    return articles;
  } finally {
    await server.close();
  }
}

/**
 * Everything getAllRoutes()/getIndexableRoutes() need.
 *
 * `providers` comes from the checked-in market snapshot rather than a live
 * query so that the published page set is identical in every environment and
 * visible in a diff when it changes.
 */
export async function loadSeoData() {
  const fullArticles = await loadArticles();
  return { fullArticles, providers: getPublishableProviders() };
}
