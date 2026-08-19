#!/usr/bin/env node
/**
 * refresh-article-dates.mjs
 *
 * Regenerates src/seo/articleDates.js from this repository's git history.
 *
 * WHY THE DATES ARE DERIVED RATHER THAN TYPED
 *
 * Article markup wants a datePublished and a dateModified, and both are claims
 * about the world: "we published this on this day" is either true or it is a
 * lie told in structured data. Nobody had recorded those dates, so the only
 * honest source is the history of the file the articles live in — the commit
 * that first introduced an article is when it was published, and the last
 * commit that changed that article's own text is when it was modified.
 *
 * WHY THEY ARE SNAPSHOT RATHER THAN COMPUTED AT BUILD TIME
 *
 * Vercel clones at depth 1. There is no history in the build environment, so a
 * build-time `git log` would silently produce nothing and the dates would
 * quietly disappear from production while looking fine locally.
 *
 * So they are committed. To stop a snapshot going stale in the usual way — an
 * article gets edited, the date keeps saying otherwise — each entry carries a
 * hash of the article's source block, and the regression suite fails when a
 * hash no longer matches. Editing an article without re-running this script is
 * a test failure with a message telling you to run it.
 *
 *   node scripts/refresh-article-dates.mjs
 */

import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARTICLE_FILE = 'src/components/learning/fullArticles.jsx';
const OUTPUT = path.join(ROOT, 'src/seo/articleDates.js');

/** sha1 of each article's source block, keyed by id. */
export function hashBlocks(text) {
  const out = {};
  const marks = [...text.matchAll(/^ {2}(\d+): \{$/gm)].map((m) => ({ id: m[1], start: m.index }));
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1].start : text.length;
    out[marks[i].id] = crypto
      .createHash('sha1')
      .update(text.slice(marks[i].start, end))
      .digest('hex')
      .slice(0, 12);
  }
  return out;
}

function gitCommits() {
  const log = execSync(`git log --reverse --format=%H%x09%aI -- ${ARTICLE_FILE}`, {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
  if (!log) throw new Error(`no git history for ${ARTICLE_FILE} — run this in a full clone`);
  return log.split('\n').map((line) => {
    const [hash, iso] = line.split('\t');
    return { hash, date: iso.slice(0, 10) };
  });
}

async function main() {
  const commits = gitCommits();
  if (commits.length < 2) {
    throw new Error(
      `only ${commits.length} commit(s) of history for ${ARTICLE_FILE} — this is a shallow clone, ` +
        'and the dates it would produce would all be today. Run in a full clone.'
    );
  }

  const published = {};
  const modified = {};
  let previous = {};

  for (const commit of commits) {
    let text;
    try {
      text = execSync(`git show ${commit.hash}:${ARTICLE_FILE}`, {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 128 * 1024 * 1024,
      });
    } catch {
      // The file did not exist at this commit under this path.
      continue;
    }
    const current = hashBlocks(text);
    for (const [id, hash] of Object.entries(current)) {
      if (!(id in published)) {
        published[id] = commit.date;
        modified[id] = commit.date;
      } else if (previous[id] !== hash) {
        modified[id] = commit.date;
      }
    }
    previous = current;
  }

  const head = await fs.readFile(path.join(ROOT, ARTICLE_FILE), 'utf8');
  const hashes = hashBlocks(head);
  const ids = Object.keys(hashes).sort((a, b) => Number(a) - Number(b));

  const rows = ids
    .map((id) => `  ${id}: ['${published[id]}', '${modified[id]}', '${hashes[id]}'],`)
    .join('\n');

  const file = `/**
 * articleDates.js — GENERATED. Do not edit by hand.
 *
 * Run \`node scripts/refresh-article-dates.mjs\` to regenerate. See that script
 * for why these are derived from git history and then committed rather than
 * computed during the build.
 *
 * Each entry is [datePublished, dateModified, sourceHash]. The hash is of the
 * article's block in src/components/learning/fullArticles.jsx; the regression
 * suite compares it against the current file, so an article that is edited
 * without refreshing this table fails the test run rather than shipping a
 * dateModified that quietly contradicts the page.
 */

/** @type {Record<number, [published: string, modified: string, hash: string]>} */
export const ARTICLE_DATES = {
${rows}
};

/** ISO date this article was first published, or null if it is not recorded. */
export function articlePublishedDate(id) {
  return ARTICLE_DATES[id]?.[0] || null;
}

/** ISO date this article's own text last changed, or null if not recorded. */
export function articleModifiedDate(id) {
  return ARTICLE_DATES[id]?.[1] || null;
}

/** Hash of the article source the dates above were taken from. */
export function articleSourceHash(id) {
  return ARTICLE_DATES[id]?.[2] || null;
}
`;

  await fs.writeFile(OUTPUT, file, 'utf8');

  const publishedSpread = new Set(Object.values(published)).size;
  const modifiedSpread = new Set(Object.values(modified)).size;
  console.log(`[article-dates] wrote ${ids.length} entries to src/seo/articleDates.js`);
  console.log(`[article-dates] ${publishedSpread} distinct publish dates, ${modifiedSpread} distinct modified dates`);
}

main().catch((error) => {
  console.error(`[article-dates] FAILED: ${error.message}`);
  process.exit(1);
});
