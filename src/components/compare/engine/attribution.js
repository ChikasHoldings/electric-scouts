/**
 * Attribution capture for the comparison engine.
 *
 * UTM values and the referrer are only present on the first page the visitor
 * lands on. By the time they reach the end of the questionnaire the URL has
 * usually been rewritten, so the values are snapshotted into sessionStorage on
 * first sight and read back from there for the rest of the session.
 *
 * Nothing here is PII: campaign metadata only.
 */

const STORAGE_KEY = 'es_attribution';

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
];

function safeSessionStorage() {
  // Private browsing and some embedded webviews throw on access rather than
  // returning null, so every read/write goes through a guard.
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readStored() {
  const store = safeSessionStorage();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStored(value) {
  const store = safeSessionStorage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* quota or disabled storage — attribution is best-effort */
  }
}

/**
 * Read attribution from the current URL, falling back to whatever was captured
 * earlier in the session. The first landing wins: a visitor who arrives from a
 * campaign and then navigates internally keeps the original campaign.
 */
export function captureAttribution(search, referrer, href) {
  const stored = readStored();
  if (stored) return stored;

  const params = new URLSearchParams(search || '');
  const captured = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) captured[key] = value.slice(0, 255);
  }

  if (referrer) captured.referrer = String(referrer).slice(0, 500);
  if (href) captured.landing_page = String(href).split('#')[0].slice(0, 500);

  // Only persist once something worth attributing exists, otherwise a direct
  // visit would lock in an empty record and mask a later campaign hit.
  if (Object.keys(captured).length > 0) writeStored(captured);

  return captured;
}

/** Convenience wrapper reading from `window` — no-ops during SSR/prerender. */
export function captureAttributionFromWindow() {
  if (typeof window === 'undefined') return {};
  return captureAttribution(
    window.location.search,
    document.referrer,
    window.location.href
  );
}

/**
 * The campaign fields worth attaching to a funnel event.
 *
 * Source, medium and campaign are enough to segment a funnel by acquisition
 * channel; `referrer` and `landing_page` are full URLs that can carry query
 * strings from elsewhere, so they stay on the lead record and out of analytics.
 */
export function campaignContext(attribution = {}) {
  const context = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    if (attribution && attribution[key]) context[key] = attribution[key];
  }
  return context;
}

export function clearAttribution() {
  const store = safeSessionStorage();
  if (!store) return;
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export { UTM_KEYS };
