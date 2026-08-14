/**
 * articleLinks.js
 *
 * Topical links between the 73 guides, and from the state pages into them.
 *
 * THE PROBLEM THIS SOLVES
 *
 * The guides are the deepest content on the site — 634 to 2,102 words each,
 * and the only family with no near-duplicate pairs at all. They were also the
 * worst-linked: a median of one inbound link, against thirteen for city pages
 * and eleven for the comparisons. That one link was /learning-center, which
 * lists all 73, and every guide ended with the same three links to the same
 * three hubs. Nothing pointed from one guide to another, and nothing pointed
 * into them from the pages that rank.
 *
 * A page with one inbound link is a page Google has little reason to crawl
 * often or rank well, however good it is. This is the cheapest ranking work
 * available on the site: the content already exists and is already good.
 *
 * HOW RELATEDNESS IS DECIDED
 *
 * Tags first, because they are hand-applied and mean something. But only 45 of
 * the 73 guides share a tag with any other, so tags alone would leave 28 with
 * nothing — the exact failure being fixed. Title words carry the rest: after
 * stripping the vocabulary every guide on an electricity site shares
 * ("electricity", "rates", "guide"), what remains is specific enough to rank
 * candidates sensibly.
 *
 * Scored rather than filtered, so every guide gets links whether or not its
 * tags happen to overlap with another's.
 */

import { STATE_NAMES } from './locations.js';
import { articlePath } from './articles.js';

/**
 * Words shared by so many guides that matching on them says nothing. Without
 * this, every guide's "related" list is whichever guides happen to say
 * "electricity" most often — which is all of them.
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'of', 'for', 'in', 'on', 'with', 'your', 'you',
  'how', 'what', 'why', 'when', 'is', 'are', 'can', 'do', 'does', 'guide', 'complete',
  'best', 'top', 'ultimate', 'everything', 'know', 'need', 'about', 'vs', 'versus',
  'electricity', 'electric', 'energy', 'power', 'rates', 'rate', 'plan', 'plans',
  '2026', '2025', 'save', 'saving', 'savings', 'cost', 'costs', 'bill', 'bills',
]);

function terms(text) {
  return new Set(
    String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
  );
}

function tagSet(article) {
  return new Set((article?.tags || []).map((tag) => String(tag).toLowerCase().trim()));
}

function overlap(a, b) {
  let shared = 0;
  for (const value of a) if (b.has(value)) shared += 1;
  return shared;
}

/**
 * The guides most worth reading after this one.
 *
 * A shared tag counts for three times a shared title word: tags were applied
 * deliberately, title words only happen to coincide. Ties break on the lower
 * id so the output is stable between builds — an unstable "related" block
 * would rewrite links on every deploy for no reason.
 *
 * @param {string|number} id
 * @param {Record<string, any>} articles
 * @param {number} [limit]
 */
export function relatedArticles(id, articles, limit = 5) {
  const self = articles?.[id];
  if (!self) return [];

  const scored = scoreAgainst(id, articles);

  /* Reciprocity.
   *
   * Relatedness scored this way is not symmetric: a broad guide scores highly
   * for many others while its own top five are all narrower pieces, so it
   * links out generously and receives nothing back. Taking the top five alone
   * left 17 of the 73 guides with fewer than three inbound links — a smaller
   * version of the problem this file exists to fix.
   *
   * So a guide that ranks this one among its own best matches is pulled in
   * regardless of where it sits in this one's ordering. The link was going to
   * exist in one direction anyway; making it mutual costs nothing and spreads
   * authority to the guides that were accumulating none.
   */
  const reciprocal = new Set(
    Object.keys(articles)
      .filter((other) => String(other) !== String(id))
      .filter((other) =>
        scoreAgainst(other, articles)
          .slice(0, limit)
          .some((entry) => String(entry.id) === String(id))
      )
      .map(String)
  );

  const chosen = [];
  const seen = new Set();
  for (const entry of scored) {
    if (chosen.length >= limit && !reciprocal.has(String(entry.id))) continue;
    if (seen.has(String(entry.id))) continue;
    seen.add(String(entry.id));
    chosen.push(entry);
    if (chosen.length >= limit + reciprocal.size) break;
  }

  return chosen.slice(0, limit + 3).map((entry) => ({
    id: entry.id,
    path: articlePath(entry.id),
    title: entry.article.title,
    score: entry.score,
  }));
}

/** Every other article ranked by relatedness to `id`. */
function scoreAgainst(id, articles) {
  const self = articles?.[id];
  if (!self) return [];
  const selfTags = tagSet(self);
  const selfTerms = terms(`${self.title || ''} ${(self.tags || []).join(' ')}`);

  return Object.keys(articles)
    .filter((other) => String(other) !== String(id) && articles[other]?.title)
    .map((other) => {
      const article = articles[other];
      const score =
        overlap(selfTags, tagSet(article)) * 3 +
        overlap(selfTerms, terms(`${article.title || ''} ${(article.tags || []).join(' ')}`));
      return { id: other, article, score };
    })
    .sort((a, b) => b.score - a.score || Number(a.id) - Number(b.id));
}

/**
 * Guides that name a state we publish, for links on that state's page.
 *
 * Matched on title and tags rather than body text: a guide that mentions Texas
 * once in passing is not a Texas guide, and linking it from the Texas page
 * would spend that page's authority on something a reader did not want.
 *
 * @param {string} stateCode
 * @param {Record<string, any>} articles
 * @param {number} [limit]
 */
export function articlesForState(stateCode, articles, limit = 4) {
  const stateName = STATE_NAMES[stateCode];
  if (!stateName || !articles) return [];
  const needle = stateName.toLowerCase();

  return Object.keys(articles)
    .filter((id) => {
      const article = articles[id];
      if (!article?.title) return false;
      const haystack = `${article.title} ${(article.tags || []).join(' ')}`.toLowerCase();
      return haystack.includes(needle);
    })
    .sort((a, b) => Number(a) - Number(b))
    .slice(0, limit)
    .map((id) => ({ id, path: articlePath(id), title: articles[id].title }));
}
