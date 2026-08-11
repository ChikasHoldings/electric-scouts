/**
 * articles.js
 *
 * Article routes (/learn/:id).
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
 */

import { canonicalPath } from './site.js';

/** IDs of every published article that /learn/:id resolves. */
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

export function articlePath(idOrSlug) {
  return canonicalPath(`/learn/${idOrSlug}`);
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
      path: articlePath(id),
      title: article?.metaTitle || article?.title,
      heading: article?.title,
      description: article?.metaDescription,
      content: article?.content,
    };
  });
}
