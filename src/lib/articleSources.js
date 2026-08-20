/**
 * articleSources.js
 *
 * One rule for combining the two places an article can come from.
 *
 * WHY THIS EXISTS
 *
 * Articles reach the app from a Supabase table and from a static list compiled
 * into the bundle. Both ArticleDetail and LearningCenter chose between them the
 * same way:
 *
 *   const articles = dbArticles.length > 0 ? dbArticles : fallbackArticles;
 *
 * Either/or, and the database wins the moment it holds a single row. So every
 * article that exists only in the source — which is every guide added by
 * editing fullArticles.jsx — resolved to nothing in production, and
 * ArticleDetail rendered "Article Not Found" for it.
 *
 * The reason this is easy to miss twice: locally, and in any environment
 * without database credentials, the query returns nothing and the fallback is
 * used, so the same pages render perfectly. The bug is invisible exactly where
 * it is not happening.
 *
 * Merging by id removes the question of which side owns an article. A row in
 * the database is authoritative where one exists, because that is the copy an
 * editor can change without a deploy; the static list supplies everything the
 * database has never heard of. An article resolves if either side knows it.
 */

/**
 * Combine the static article list with rows loaded from the database.
 *
 * @template {{id: string|number}} T
 * @param {T[]} fallback  articles compiled into the bundle
 * @param {T[]} fromDatabase  rows already mapped to the same shape
 * @returns {T[]} every article either side knows about, database copy winning
 */
export function mergeArticleSources(fallback, fromDatabase) {
  const byId = new Map();
  for (const entry of fallback || []) {
    if (entry && entry.id !== undefined && entry.id !== null) byId.set(String(entry.id).trim(), entry);
  }
  for (const entry of fromDatabase || []) {
    if (entry && entry.id !== undefined && entry.id !== null) byId.set(String(entry.id).trim(), entry);
  }
  return [...byId.values()];
}
