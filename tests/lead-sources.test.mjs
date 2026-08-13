import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  describeSource,
  inSegment,
  countBySegment,
  LEAD_SOURCES,
  SEGMENTS,
} from '../src/lib/leadSources.js';

/**
 * Capture and admin, pinned to each other.
 *
 * These two halves had silently drifted: the forms wrote
 * `compare_rates_commercial` and `exit_intent_rate_alerts` while the admin
 * screen filtered on `business_results` and `newsletter_slideup`. Nothing
 * errored — the business segment simply always read zero, so the highest-value
 * leads looked like they did not exist.
 *
 * The last test in this file reads the capture components and asserts every
 * source string they post is one the registry knows, so adding a form without
 * registering it fails here rather than showing up as an unlabelled badge
 * months later.
 */

// ─── Describing a lead ──────────────────────────────────────

test('the quote engine is split by audience', () => {
  const residential = describeSource({ source: 'compare_rates', source_page: 'compare_rates_residential' });
  assert.equal(residential.segment, SEGMENTS.RESIDENTIAL);

  const commercial = describeSource({ source: 'compare_rates', source_page: 'compare_rates_commercial' });
  assert.equal(commercial.segment, SEGMENTS.COMMERCIAL);

  // Same `source`, different segment — which is exactly why matching on
  // `source` alone was not enough.
  assert.notEqual(residential.label, commercial.label);
});

test('a page-suffixed newsletter source resolves through its prefix', () => {
  // RateAlertsCapture posts `rate_alerts_homepage`, `rate_alerts_compare`, and
  // so on. One registry row covers all of them.
  for (const page of ['rate_alerts_homepage', 'rate_alerts_compare', 'rate_alerts_learn']) {
    const described = describeSource({ source: 'rate_alerts', source_page: page });
    assert.equal(described.segment, SEGMENTS.NEWSLETTER, `${page} should be a newsletter lead`);
    assert.equal(described.label, 'Rate alerts');
  }
});

test('exit intent is a newsletter lead, not an unknown one', () => {
  const described = describeSource({ source: 'exit_intent_rate_alerts', source_page: 'exit_intent' });
  assert.equal(described.segment, SEGMENTS.NEWSLETTER);
  assert.equal(described.label, 'Exit intent');
});

test('concierge and business quotes are their own segments', () => {
  assert.equal(describeSource({ source: 'concierge' }).segment, SEGMENTS.CONCIERGE);
  assert.equal(describeSource({ source: 'business_quote' }).segment, SEGMENTS.COMMERCIAL);
});

test('an unregistered source is described, never silently dropped', () => {
  const described = describeSource({ source: 'some_future_form', source_page: null });
  assert.equal(described.segment, null);
  // The operator should be able to see WHAT is unregistered.
  assert.match(described.label, /some_future_form/);
});

test('a lead with no source at all still renders', () => {
  const described = describeSource({});
  assert.equal(described.label, 'Unknown');
  assert.ok(described.tone, 'a badge tone is always present so the cell is not blank');
});

// ─── Filtering and counting ─────────────────────────────────

const SAMPLE = [
  { source: 'compare_rates', source_page: 'compare_rates_residential' },
  { source: 'compare_rates', source_page: 'compare_rates_commercial' },
  { source: 'business_quote', source_page: 'business_quote' },
  { source: 'rate_alerts', source_page: 'rate_alerts_homepage' },
  { source: 'exit_intent_rate_alerts', source_page: 'exit_intent' },
  { source: 'concierge', source_page: 'concierge' },
  { source: 'mystery_form', source_page: null },
];

test('the commercial segment is no longer always empty', () => {
  // The regression this whole module exists to prevent.
  const counts = countBySegment(SAMPLE);
  assert.equal(counts[SEGMENTS.COMMERCIAL], 2, 'quote-engine commercial + business quote form');
  assert.ok(counts[SEGMENTS.COMMERCIAL] > 0);
});

test('every segment counts what belongs to it', () => {
  const counts = countBySegment(SAMPLE);
  assert.equal(counts[SEGMENTS.RESIDENTIAL], 1);
  assert.equal(counts[SEGMENTS.NEWSLETTER], 2);
  assert.equal(counts[SEGMENTS.CONCIERGE], 1);
  assert.equal(counts.unknown, 1, 'unregistered sources are surfaced, not hidden');
});

test('counting an empty list gives zeroes rather than throwing', () => {
  const counts = countBySegment([]);
  assert.equal(counts[SEGMENTS.RESIDENTIAL], 0);
  assert.equal(counts.unknown, 0);
  assert.deepEqual(countBySegment(null), counts);
});

test('the "all" filter passes everything through', () => {
  assert.ok(SAMPLE.every((lead) => inSegment(lead, 'all')));
  assert.ok(SAMPLE.every((lead) => inSegment(lead, null)));
});

test('filtering by segment selects exactly that segment', () => {
  const commercial = SAMPLE.filter((l) => inSegment(l, SEGMENTS.COMMERCIAL));
  assert.equal(commercial.length, 2);
  assert.ok(commercial.every((l) => describeSource(l).segment === SEGMENTS.COMMERCIAL));
});

// ─── The anti-drift check ───────────────────────────────────

test('every source the capture forms post is registered', () => {
  const captureFiles = [
    'src/components/ExitIntentPopup.jsx',
    'src/components/RateAlertsCapture.jsx',
    'src/components/EmailCapture.jsx',
    'src/components/compare/engine/persistence.js',
  ];

  // Matches `source: "value"` and `source: 'value'` — the literal a form sends.
  // A dynamic source (a template string) is skipped rather than guessed at.
  const pattern = /\bsource:\s*['"]([a-z0-9_]+)['"]/g;

  const found = new Set();
  for (const file of captureFiles) {
    const contents = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    for (const [, value] of contents.matchAll(pattern)) found.add(value);
  }

  assert.ok(found.size > 0, 'the capture files should declare at least one source');

  const registered = new Set(LEAD_SOURCES.map((s) => s.source));
  const unregistered = [...found].filter((value) => !registered.has(value));

  assert.deepEqual(
    unregistered,
    [],
    `These sources are posted by a capture form but missing from src/lib/leadSources.js, ` +
    `so they would show as "Unknown" in admin and match no segment filter: ${unregistered.join(', ')}`
  );
});

test('the server-side submission sources are registered too', () => {
  // /api/leads writes these when mirroring a concierge request or a commercial
  // quote into `leads`.
  const contents = readFileSync(new URL('../api/leads.js', import.meta.url), 'utf8');
  const registered = new Set(LEAD_SOURCES.map((s) => s.source));

  for (const value of ['concierge', 'business_quote']) {
    assert.ok(
      contents.includes(`source: "${value}"`),
      `api/leads.js should mirror ${value} submissions into leads`
    );
    assert.ok(registered.has(value), `${value} must be in the source registry`);
  }
});
