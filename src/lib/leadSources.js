/**
 * Where a lead came from — one definition, used by capture and by admin.
 *
 * These two halves had drifted apart. The capture forms wrote
 * `compare_rates_commercial`, `rate_alerts_homepage` and
 * `exit_intent_rate_alerts`, while the admin screen's label map and filters
 * were written against `business_results`, `newsletter_slideup` and
 * `residential_results` — values nothing in the codebase produces. The visible
 * result: every lead rendered its raw source string as a badge, and the
 * "Business" filter and the business count matched nothing at all, so the
 * highest-value segment appeared to be empty.
 *
 * Two hand-maintained maps in two files will always drift. This is the one
 * place a source is defined, and `SOURCE_IDS` is asserted against the values
 * the capture code actually sends, so adding a form without registering it
 * fails the test run rather than quietly showing up as an unlabelled badge.
 */

/** Which part of the business a lead belongs to. Drives the admin filter. */
export const SEGMENTS = {
  RESIDENTIAL: 'residential',
  COMMERCIAL: 'commercial',
  RENEWABLE: 'renewable',
  NEWSLETTER: 'newsletter',
  CONCIERGE: 'concierge',
};

export const SEGMENT_LABELS = {
  [SEGMENTS.RESIDENTIAL]: 'Residential',
  [SEGMENTS.COMMERCIAL]: 'Commercial',
  [SEGMENTS.RENEWABLE]: 'Renewable',
  [SEGMENTS.NEWSLETTER]: 'Newsletter',
  [SEGMENTS.CONCIERGE]: 'Concierge',
};

/**
 * Every source the platform can write, with how it should be displayed.
 *
 * `source` is the coarse origin the capture form sends; `sourcePage` narrows it
 * where one form is used in several places. A row matches a lead when its
 * `sourcePage` equals the lead's `source_page`, falling back to `source`.
 */
export const LEAD_SOURCES = [
  {
    id: 'compare_rates_residential',
    source: 'compare_rates',
    sourcePage: 'compare_rates_residential',
    label: 'Quote engine',
    segment: SEGMENTS.RESIDENTIAL,
    tone: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'compare_rates_commercial',
    source: 'compare_rates',
    sourcePage: 'compare_rates_commercial',
    label: 'Quote engine (business)',
    segment: SEGMENTS.COMMERCIAL,
    tone: 'bg-indigo-100 text-indigo-700',
  },
  {
    id: 'business_quote',
    source: 'business_quote',
    sourcePage: 'business_quote',
    label: 'Business quote form',
    segment: SEGMENTS.COMMERCIAL,
    tone: 'bg-indigo-100 text-indigo-700',
  },
  {
    id: 'concierge',
    source: 'concierge',
    sourcePage: 'concierge',
    label: 'Home concierge',
    segment: SEGMENTS.CONCIERGE,
    tone: 'bg-purple-100 text-purple-700',
  },
  {
    id: 'rate_alerts',
    source: 'rate_alerts',
    sourcePage: null,
    label: 'Rate alerts',
    segment: SEGMENTS.NEWSLETTER,
    tone: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'exit_intent_rate_alerts',
    source: 'exit_intent_rate_alerts',
    sourcePage: 'exit_intent',
    label: 'Exit intent',
    segment: SEGMENTS.NEWSLETTER,
    tone: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'newsletter',
    source: 'newsletter',
    sourcePage: null,
    label: 'Newsletter',
    segment: SEGMENTS.NEWSLETTER,
    tone: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'bill_analyzer',
    source: 'bill_analyzer',
    sourcePage: 'bill_analyzer',
    label: 'Bill analyzer',
    segment: SEGMENTS.RESIDENTIAL,
    tone: 'bg-teal-100 text-teal-700',
  },
];

/** Every registered id, for the test that pins capture and admin together. */
export const SOURCE_IDS = LEAD_SOURCES.map((s) => s.id);

/**
 * Describe a lead's origin.
 *
 * Matches on `source_page` first because it is the more specific field, then
 * on `source`. An unregistered value is described rather than dropped: an
 * operator seeing "Unknown (some_new_form)" learns something, whereas a blank
 * cell just looks broken.
 */
export function describeSource(lead) {
  const sourcePage = lead?.source_page || null;
  const source = lead?.source || null;

  const byPage = sourcePage
    ? LEAD_SOURCES.find((s) => s.sourcePage === sourcePage)
    : null;
  if (byPage) return byPage;

  // A newsletter capture placed on a specific page sends `rate_alerts_homepage`
  // and similar, so a prefix match keeps one registry row covering all of them
  // rather than needing an entry per page.
  const byPagePrefix = sourcePage
    ? LEAD_SOURCES.find((s) => s.sourcePage && sourcePage.startsWith(`${s.sourcePage}_`))
    : null;
  if (byPagePrefix) return byPagePrefix;

  const bySource = source ? LEAD_SOURCES.find((s) => s.source === source) : null;
  if (bySource) return bySource;

  const bySourcePrefix = source
    ? LEAD_SOURCES.find((s) => source.startsWith(`${s.source}_`))
    : null;
  if (bySourcePrefix) return bySourcePrefix;

  return {
    id: 'unknown',
    source,
    sourcePage,
    label: sourcePage || source ? `Unknown (${sourcePage || source})` : 'Unknown',
    segment: null,
    tone: 'bg-gray-100 text-gray-600',
  };
}

/** Does this lead belong to the given segment? */
export function inSegment(lead, segment) {
  if (!segment || segment === 'all') return true;
  return describeSource(lead).segment === segment;
}

/** Count leads per segment, for the admin summary tiles. */
export function countBySegment(leads) {
  const counts = Object.fromEntries(Object.values(SEGMENTS).map((s) => [s, 0]));
  let unknown = 0;

  for (const lead of Array.isArray(leads) ? leads : []) {
    const { segment } = describeSource(lead);
    if (segment && segment in counts) counts[segment] += 1;
    else unknown += 1;
  }

  return { ...counts, unknown };
}
