# Full SEO audit — 22 August 2026

Every public URL Electric Scouts can serve, crawled individually, one row each.
The machine-readable ledger is `artifacts/seo/full-url-audit.csv`; regenerate it
with `npm run audit:urls -- --csv artifacts/seo/full-url-audit.csv`.

Baseline commit: `d5136cb`. Branch: `claude/electric-scouts-defects-xzqeba`.

---

## 1. What was measured

| Layer | Tool | Coverage |
| --- | --- | --- |
| Raw HTML, every URL | `npm run audit:urls` (new) | 508 URLs |
| Raw HTML, published pages | `npm run audit` | 344 routes |
| Prerender contract | `npm run verify:dist` | 335 indexable + 1 alias + 8 noindex |
| Rendered DOM | `npm run audit:render` (Playwright) | 335 indexable |
| Mobile, 375×812 | Playwright, ad hoc | 8 representative URLs |
| Registry invariants | `npm test`, `npm run test:seo` | 937 / 206 tests |

The 508-URL inventory is the union of the route registry (344), sitemap.xml
(335), every literal `vercel.json` redirect source (161) and destination, every
internal link found by crawling the built site (19,657 links), every canonical
target, and every `.html` file Vercel serves out of `dist/`.

### Baseline, before any change

| Command | Result |
| --- | --- |
| `npm run lint` | pass — 0 errors, 42 pre-existing warnings |
| `npm run typecheck` | pass |
| `npm test` | pass — 933/933 |
| `npm run build` | pass — 344 pages |
| `npm run verify:dist` | pass |
| `npm run audit` | pass — 0 P0, 0 P1, 0 P2 |
| `npm run audit:render` | **did not run** — Playwright absent, exit 2 |
| `npm run test:seo` | pass — 202/202 |

The prerender layer was in genuinely good shape: no exact duplicate bodies, no
near-duplicate pair above 0.55 within any family, no thin page, no orphan, no
broken internal link, no link to a redirect, no invalid JSON-LD, all 335
indexable URLs self-canonical and in the sitemap.

Every defect below sits in a place those green checks could not look.

---

## 2. Inventory

| Class | Count | Contract |
| --- | ---: | --- |
| Indexable pages | 335 | 200, self-canonical, `index,follow`, in sitemap |
| Alias (`/landing`) | 1 | 200, canonical → `/`, absent from sitemap, 0 inbound links |
| Noindex routes | 8 | 200, `noindex,follow`, absent from sitemap, 0 inbound links |
| Non-page files (`app-shell.html`, `404.html`) | 2 | 200, now `noindex` in meta **and** header |
| Redirect sources | 161 | 301 in one hop, absent from sitemap, 0 inbound links |
| Rewrite source (`/admin`) | 1 | noindex header, `Disallow` in robots.txt |
| **Total inventoried** | **508** | |

Redirect chains: 0. Redirect loops: 0. Redirects landing on a 404: 0.
Sitemap URLs that redirect, 404, carry noindex, or canonicalise elsewhere: 0.

Unknown URLs return a real 404 with `noindex, follow` and no canonical —
verified against `/this-page-does-not-exist`, `/learn/9999`, `/providers/nope`,
`/electricity-rates/texas/nowhere`, `/utilities/nope`, `/compare/a-vs-b`.

---

## 3. Defects found and fixed

### 3.1 An indexable app shell at a public URL — P0

`https://www.electricscouts.com/app-shell.html` returned **HTTP 200** with an
empty `<div id="root">`, `Electric Scouts` as its title, **no canonical and no
robots directive**. Vercel serves the whole output directory, so the file is
reachable whether or not anything links to it — and `vercel.json` names it as
the `/admin` rewrite target.

`dist/404.html` has the same property with a friendlier body, which is worse
rather than better: a "Page Not Found" page returning 200 at its own URL is the
textbook soft 404. It carried a noindex meta but no header.

Both now carry `noindex, follow` twice: a meta tag for renderers (SEOHead
overwrites it from the real route on mount, so it binds the raw fetch only) and
an `X-Robots-Tag` header that does not depend on rendering.

The shell still declares no canonical — it answers for whatever route is
rewritten to it, so any canonical guessed there would be wrong for that route.

Files: `scripts/prerender-seo.mjs`, `vercel.json`,
`scripts/assert-prerender-output.mjs`, `tests/seo.test.mjs`.

### 3.2 Nine pairs of our own pages competing for one query — P1

Every per-page check passed on all of these. The damage was between pages,
which is the one thing an audit looking at one page at a time cannot see.

| Landing page | Article | Title overlap |
| --- | --- | ---: |
| `/electricity-rates/texas/austin` | `/learn/austin-energy-explained` | **1.00** |
| `/electricity-rates/texas/san-antonio` | `/learn/cps-energy-san-antonio-explained` | 0.83 |
| `/providers/green-mountain-energy` | `/learn/green-mountain-energy-review` | 0.71 |
| `/electricity-rates/new-hampshire/concord` | `/learn/concord-nh-electricity-rates` | 0.67 |
| `/electricity-rates/new-hampshire/nashua` | `/learn/nashua-nh-electricity-rates` | 0.67 |
| `/electricity-rates/rhode-island/warwick` | `/learn/warwick-ri-electricity-rates` | 0.67 |
| `/providers/just-energy` | `/learn/just-energy-review` | 0.67 |
| `/providers/octopus-energy` | `/learn/octopus-energy-review` | 0.67 |
| `/renewable-energy` | `/renewable-compare-rates` | 0.75 |

The Austin pair was exact: "Austin Electricity Rates and Austin Energy" against
"Austin Electricity Rates & Austin Energy" — the same seven words, one ampersand
apart. Google picks one of those, and not necessarily the landing page we want
ranking; the other becomes *Duplicate, Google chose different canonical*.

Resolved by intent, not by consolidation: in every pair the landing page keeps
the head term, and the article moves to the intent its own body already serves
(Austin and San Antonio are municipal-utility cities, so the guides own "can you
switch here?"; the NH/RI guides compare suppliers against a named default
service; the reviews take the differentiator from their own descriptions).
**No article body text was changed — only the `metaTitle` each publishes.**

Highest surviving cross-family overlap: 0.60, a state page against its own
in-depth guide, which is a legitimate two-tier structure.

Files: `src/components/learning/fullArticles.jsx` (8 `metaTitle` values),
`src/seo/routes.js`, `src/pages/RenewableEnergy.jsx`.

### 3.3 Share images sized for a card, not a share — P2

Three city pages passed `?w=400&h=300&fit=crop` — the card thumbnail's size — to
`og:image`, on pages declaring `twitter:card=summary_large_image`. A 400×300
file is below every platform's large-card threshold, so the card degrades.

Unsplash resizes from the query string, so the same photograph is now asked for
1200×630 rather than falling back to the generic placeholder and losing the city
from the card. Other hosts are untouched: we cannot know whether an arbitrary
URL honours resize parameters, and inventing a size the file does not have is
worse than sending its real one.

Affects `/electricity-rates/texas/austin`, `/electricity-rates/maine/portland`,
`/electricity-rates/illinois/elgin`. File: `src/seo/render.js`.

### 3.4 Sitemap `lastmod` for twelve articles was a day early — P2

`articleDates.js` recorded 2026-08-19 for articles 109–120. They were introduced
by `d2123e8`, which git dates 2026-08-20. Their content hashes are unchanged
byte for byte, so this is a recorded-date correction, not a content change.
Regenerated with the project's own `scripts/refresh-article-dates.mjs`.

### 3.5 A page whose two H1s disagreed — introduced here, then caught — P1

Retitling `/renewable-energy` (§3.2) moved `STATIC_HEADINGS`, which is the H1 in
the prerendered HTML, and left the React page's own hero prop behind. The served
HTML said "How Renewable Electricity Plans Work"; the rendered DOM said
"Renewable Energy Plans". Google indexes the second, so the new keyword would
have been on neither.

Found by the rendered-DOM audit, which is the only check that compares the two.
`h1-divergence` was P2 everywhere, so `--strict` would have let it through; it is
now P1 on static and home routes, where the two H1s are separate hand-maintained
strings that can be edited independently, and stays advisory on generated routes,
where one builder produces both and they can only drift together.

Files: `src/pages/RenewableEnergy.jsx`, `scripts/seo-render-audit.mjs`.

### 3.6 A sitemap test that failed for the right answer — P2

`lastmod reports when the content changed, not when the build ran` asserted that
no sitemap entry carries today's date. That is a proxy for the property it is
named after, and it is wrong on any day an article is genuinely edited:
`refresh-article-dates.mjs` reads dates from git history, so the eight retitled
articles were correctly stamped with today's date and the suite failed.

Rewritten to check provenance instead — a lastmod equal to today is allowed only
where the committed record in `articleDates.js` says today. A clock default
cannot satisfy that, because it would stamp all 335 URLs including the 250 with
no record at all. File: `tests/seo.test.mjs`.

### 3.7 The rendered-DOM audit had never run

`npm run audit:render` exited 2 with "Playwright is not installed". The check
that exists specifically because two indexing outages were invisible to every
file-reading audit had never executed. Installed Playwright (`--no-save`, so
`package.json` is untouched — it is deliberately a diagnostic rather than a
dependency) and ran it across all 335 indexable URLs. Results in §5.

---

## 4. Findings by Google Search Console category

| Category | Before | After | Notes |
| --- | ---: | ---: | --- |
| Soft 404 | 2 | 0 | `app-shell.html`, `404.html` — both now noindex |
| Duplicate, Google chose different canonical | 9 pairs | 0 | title cannibalization, §3.2 |
| Crawled — currently not indexed (risk) | 2 | 0 | same two files |
| Page with redirect | 161 | 161 | **intentional** — legacy aliases, one hop, none in sitemap, none linked |
| Alternate page with proper canonical | 1 | 1 | **intentional** — `/landing` → `/` |
| Excluded by noindex | 8 | 10 | **intentional** — 8 routes + the 2 files now correctly covered |
| Not found (404) | correct | correct | unknown URLs return a real 404 |
| Blocked by robots.txt | `/admin`, `/api/`, `/go/` | unchanged | **intentional**, all three also carry noindex headers |
| Indexed though blocked by robots.txt | 0 | 0 | no page that needs a noindex read is robots-blocked |
| Submitted URL marked noindex | 0 | 0 | |
| Submitted URL blocked by robots.txt | 0 | 0 | |
| Redirect error / chain | 0 | 0 | |
| Server error (5xx) | 0 | 0 | static output |
| Orphaned URL | 0 | 0 | minimum inbound links to any indexable page: 3 |
| Thin / low-value programmatic page | 0 | 0 | minimum substantive `<main>`: 352 words raw, 292 rendered |

**Not reconcilable here:** the historical GSC buckets themselves. Search Console
exports are not available in this environment, so the table above is what the
current public surface implies, not a reconciliation against what Google has
recorded. Exact per-URL reconciliation remains open — see §8.

---

## 5. Raw vs rendered parity

All 335 indexable URLs, Chromium, via the production routing model.

| Signal | Result |
| --- | --- |
| Pages that rendered | 335 / 335 |
| Rendered `<main>` collapse below 40% of served | 0 |
| Rendered "not found" over real served content | 0 |
| Served indexable, rendered noindex | 0 |
| Rendered thin (<180 words) | 0 |
| Rendered H1 count ≠ 1 | 0 |
| Served H1 ≠ rendered H1 | 0 |
| Served canonical ≠ rendered canonical | 0 |
| Rendered `<main>` words | min 516, median 1,424 |
| Lowest rendered/served ratio | 0.83 |

The React app renders the same content model the prerenderer writes into the
document (`SeoSections`), so raw and rendered agree on title, canonical, robots,
H1 and substance on every indexable URL.

**Environment note:** the rendered audit needs the app's public env vars
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) to be meaningful. Without them
the Supabase client throws at import and every page logs `supabaseUrl is
required`, which `--strict` reports as 335 P1 `page-error` findings. The run
above used placeholder values, and reported none.

Worth recording from the run without them: every page still rendered its full
indexable content with the database unreachable — min 292 words, median 1,353,
no collapse, no H1 or canonical divergence. The content a crawler indexes does
not depend on the database being up.

### Mobile, 375×812

`/`, `/compare-rates`, `/bill-analyzer`, `/texas-electricity`,
`/electricity-rates/texas/houston`, `/providers/gexa-energy`,
`/learn/how-to-read-your-electricity-bill`, `/faq`.

No horizontal page overflow on any (`scrollWidth === clientWidth === 375`);
wide tables scroll inside their own containers. Header and nav present, H1
present, form inputs labelled, 52–147 interactive elements each.

---

## 6. Content quality

| Measure | Result |
| --- | --- |
| Identical substantive `<main>` bodies | 0 |
| Near-duplicate pairs ≥ 0.60 within a family | 0 |
| Mean pairwise similarity | city 0.143, state 0.208, provider 0.166, comparison 0.136, utility 0.221, article 0.007, static 0.001 |
| Substantive `<main>` words | static 188–1,711 · state 643–769 · city 620–872 · provider 401–641 · comparison 352–782 · utility 729–1,025 · article 722–2,198 |
| Duplicate titles / descriptions / H1s | 0 / 0 / 0 |
| Missing meaningful image alt in prerendered HTML | 0 of 40 |
| Invalid JSON-LD | 0 of 344 pages |
| FAQ questions in schema but absent from the page | 0 of 245 FAQPage blocks |
| Article schema dates disagreeing with visible dates | 0 of 85 |

---

## 7. Savings and ranking claims — reviewed, not changed

An initial pass flagged nine savings and superlative claims in article bodies
(`$400-800/year`, `$2,000-15,000 annually`, `$500 or more per year`, "guaranteed
savings", "#1 way people overpay", "top providers", "proven strategy") on the
grounds that no citation appeared on the page and no dataset in the repository
produces the figures.

**That pass was reverted in full at the site owner's direction, and all claim
text is byte-identical to `d5136cb`.** Two things are worth recording:

1. "Unsupported" was a statement about *provenance*, not about truth. The
   figures may well be accurate; they simply are not derivable from anything in
   this repository.

2. The project already has a considered policy here, and the initial pass had
   overridden it without checking. `tests/seo.test.mjs` → *"no unsourced savings
   or review claims reach a page"* enforces a no-savings-figures rule across
   `src/pages`, `src/components` and `src/seo` — and **deliberately exempts
   article bodies**, stating: *"Article bodies are exempt from this scan, so a
   guide may still quote a percentage it attributes to a source."* Every claim
   flagged was inside that exemption.

**Consistency check (requested).** Scanned all 344 built pages for contradictory
statements of the same claim:

- Annual savings figures: 3 distinct values, each on exactly one page, each about
  a different audience (household vs. small business vs. energy-intensive).
- Monthly savings figures: 1 value, 1 page.
- Percentage claims: 15 distinct values, each on one page, each about a different
  subject; several carry explicit attribution (U.S. Department of Energy,
  Energy.gov, Nest, Ecobee).
- Superlatives: overwhelmingly generic user-goal phrasing ("find the cheapest
  plan for you"), used consistently sitewide.

**No page contradicts another, and no page contradicts itself.** The claims are
internally consistent across the platform as they stand.

---

## 8. Verification boundaries

| Layer | Status |
| --- | --- |
| Repository | verified — lint, typecheck, 935 + 206 tests |
| Local production build | verified — 344 pages, `verify:dist` clean |
| Local crawl of built output | verified — 508 URLs, 0 P0/P1/P2 |
| Rendered DOM | verified — 335 URLs in Chromium |
| Public production domain | **not crawled** — no outbound access to `www.electricscouts.com` from this environment |
| Vercel project settings | **not inspected** — no access to the production account |
| Search Console history | **not available** |

`vercel.json` is verified as committed configuration. Whether the deployed
project matches it — primary domain, apex→www redirect, header delivery — has
not been observed and must be confirmed against the live host.

### Commands to run against production

```bash
# canonical host resolves in one hop, both ways
curl -sSI https://electricscouts.com/            | grep -Ei '^(HTTP|location)'
curl -sSI https://www.electricscouts.com/        | grep -Ei '^HTTP'

# the two files this audit fixed must carry the header
curl -sSI https://www.electricscouts.com/app-shell.html | grep -Ei '^(HTTP|x-robots-tag)'
curl -sSI https://www.electricscouts.com/404.html       | grep -Ei '^(HTTP|x-robots-tag)'

# unknown URLs must be a real 404, not a 200 shell
curl -sSI https://www.electricscouts.com/this-does-not-exist | grep -Ei '^HTTP'

# full live crawl against the deployed origin
npm run verify:live
```

---

## 9. Reproducing this audit

```bash
npm ci
npm run lint && npm run typecheck && npm test
npm run build           # includes prerender + verify:dist
npm run audit           # per-page report
npm run audit:urls      # full URL ledger (508 rows)
npm run audit:urls -- --csv artifacts/seo/full-url-audit.csv
npm run test:seo

# rendered DOM — Playwright is a deliberate non-dependency
npm i --no-save playwright
npm run audit:render
```

`--strict` on `audit`, `audit:urls` and `audit:render` exits non-zero on any
P0/P1, which is the form to use in CI.
