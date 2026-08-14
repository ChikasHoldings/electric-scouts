/**
 * Landing page → /compare-rates handoff.
 *
 * The three service landing pages qualify intent before the visitor reaches the
 * comparison engine. What they establish there — the ZIP code, whether this is
 * a home or a business, whether the visitor came looking for renewable supply —
 * is written into the same comparison session the engine already uses, so
 * `determineNextQuestion` skips what it can already answer. Nobody is asked for
 * their ZIP code twice.
 *
 * This module is the single place that turns a landing submission into engine
 * state, and the single place that reads the routing parameters back off the
 * URL. There is no second wizard and no second ZIP validator: serviceability
 * comes from `validateZipCode`, exactly as it does inside the engine, so a ZIP
 * behaves identically whichever entry point it was typed into.
 *
 * Pure and framework-free, so the handoff is testable without rendering a page.
 */

import { CUSTOMER_TYPES } from './comparisonState.js';
import { validateZipCode } from '../stateData.js';

/** Where a comparison session began. Non-PII, and the key to funnel reporting. */
export const ENTRY_CONTEXTS = {
  RESIDENTIAL_LANDING: 'residential_landing',
  COMMERCIAL_LANDING: 'commercial_landing',
  RENEWABLE_LANDING: 'renewable_landing',
  COMPARE_RATES_DIRECT: 'compare_rates_direct',
  BILL_ANALYZER: 'bill_analyzer',
};

const ENTRY_CONTEXT_VALUES = new Set(Object.values(ENTRY_CONTEXTS));

export const COMPARE_PATH = '/compare-rates';

/**
 * The three service landings, each described once.
 *
 * `customerType` and `energyPreference` are what the landing page already knows
 * about the visitor. Renewable deliberately leaves `customerType` blank: the
 * page establishes the product, not the audience, so the engine still has to
 * ask "home or business?" — and only that.
 */
export const SERVICE_INTENTS = {
  residential: {
    service: 'residential',
    landingPath: '/residential-electricity',
    entryContext: ENTRY_CONTEXTS.RESIDENTIAL_LANDING,
    customerType: CUSTOMER_TYPES.RESIDENTIAL,
    energyPreference: '',
    typeParam: 'home',
  },
  commercial: {
    service: 'commercial',
    landingPath: '/business-electricity',
    entryContext: ENTRY_CONTEXTS.COMMERCIAL_LANDING,
    customerType: CUSTOMER_TYPES.COMMERCIAL,
    energyPreference: '',
    typeParam: 'business',
  },
  renewable: {
    service: 'renewable',
    landingPath: '/renewable-energy',
    entryContext: ENTRY_CONTEXTS.RENEWABLE_LANDING,
    customerType: '',
    energyPreference: 'renewable',
    typeParam: '',
  },
};

/** Digits only, at most five — the shape every caller has to reduce input to. */
export function normalizeZip(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 5);
}

/**
 * Serviceability for a typed ZIP code.
 *
 * One implementation for the landing pages and for the engine's own ZIP
 * question, so "77001" is accepted — and "99999" refused with the same wording
 * — no matter where it was entered. Callers get a `reason` they can act on and
 * a `message` that is safe to show; raw validator output never reaches the UI.
 */
export function checkServiceZip(value) {
  const zip = normalizeZip(value);

  if (zip.length !== 5) {
    return {
      zip,
      valid: false,
      reason: 'incomplete',
      message: 'Enter a valid 5-digit ZIP code.',
    };
  }

  const result = validateZipCode(zip);

  if (!result.valid) {
    return {
      zip,
      valid: false,
      reason: result.waitlist ? 'out_of_market' : 'invalid',
      message: result.waitlist
        ? "We don't cover this ZIP code yet — electricity there isn't sold on a competitive market."
        : 'Enter a valid 5-digit ZIP code.',
    };
  }

  return {
    zip,
    valid: true,
    reason: 'ok',
    state: result.state,
    stateName: result.stateName,
    message: '',
  };
}

/**
 * The comparison state a landing page hands over.
 *
 * Only what the page genuinely established. A blank `customerType` is left out
 * rather than written as an empty string, so merging this onto a session that
 * already knows the answer cannot un-answer it.
 */
export function landingSeed(service, zipCheck) {
  const intent = SERVICE_INTENTS[service];
  if (!intent) return {};

  /** @type {Record<string, any>} */
  const seed = { entryContext: intent.entryContext };

  if (zipCheck && zipCheck.valid) {
    seed.zip = zipCheck.zip;
    seed.state = zipCheck.state;
  }
  if (intent.customerType) seed.customerType = intent.customerType;
  if (intent.energyPreference) seed.energyPreference = intent.energyPreference;

  return seed;
}

/**
 * The URL a landing page sends the visitor to.
 *
 * ZIP code and service intent are routing context, not contact details, so they
 * are safe to carry in the URL — and carrying them means the handoff still
 * works when session storage is unavailable (private browsing, some embedded
 * webviews). Nothing else goes in: no name, no email, no phone, and never the
 * comparison object itself.
 *
 * The parameters are stripped from the address bar once the engine has read
 * them, and /compare-rates canonicalizes to its clean path, so no ZIP/type
 * combination becomes an indexable URL of its own.
 */
export function buildCompareUrl(service, zip, { entryContext } = {}) {
  const intent = SERVICE_INTENTS[service];
  const params = new URLSearchParams();

  const normalizedZip = normalizeZip(zip);
  if (normalizedZip.length === 5) params.set('zip', normalizedZip);
  if (intent?.typeParam) params.set('type', intent.typeParam);
  if (intent?.energyPreference === 'renewable') params.set('renewable', '1');

  const entry = entryContext || intent?.entryContext;
  if (entry && ENTRY_CONTEXT_VALUES.has(entry)) params.set('entry', entry);

  const query = params.toString();
  return query ? `${COMPARE_PATH}?${query}` : COMPARE_PATH;
}

/** Accepts URLSearchParams, a query string or a plain object. */
function toParams(input) {
  if (!input) return new URLSearchParams();
  if (typeof input === 'string') return new URLSearchParams(input);
  if (typeof input.get === 'function') return /** @type {URLSearchParams} */ (input);
  return new URLSearchParams(Object.entries(input).map(([k, v]) => [k, String(v ?? '')]));
}

/** Parameters this module owns, and therefore the ones worth clearing after use. */
export const ENTRY_PARAM_KEYS = ['zip', 'type', 'renewable', 'entry', 'usage', 'cost', 'provider'];

/**
 * Bounds for a handed-over monthly bill.
 *
 * Matches the server's own `MONTHLY_COST_LIMITS`. The figure is re-validated
 * there before it can reach a savings calculation, so this bound is about not
 * seeding the questionnaire with nonsense rather than about trust.
 */
const HANDOFF_COST_LIMITS = { min: 1, max: 1000000 };

/**
 * Read routing context off a /compare-rates URL into comparison state.
 *
 * Nothing arriving here is trusted: the ZIP is re-validated against the
 * deregulated-market map rather than taken at face value, `type` and `entry`
 * are matched against fixed allowlists, usage has to be a positive finite
 * number, and the free-text provider name is length-capped. Anything that fails
 * is dropped — an unrecognised value normalizes to "not supplied" rather than
 * seeding the engine with junk, so a hand-edited URL can produce an ordinary
 * session but never a malformed one.
 *
 * @returns {{seed: Record<string, any>, hasEntryParams: boolean}}
 */
export function parseEntryParams(input) {
  const params = toParams(input);
  /** @type {Record<string, any>} */
  const seed = {};

  const zipCheck = checkServiceZip(params.get('zip'));
  if (zipCheck.valid) {
    seed.zip = zipCheck.zip;
    seed.state = zipCheck.state;
  }

  const type = params.get('type');
  if (type === 'business') seed.customerType = CUSTOMER_TYPES.COMMERCIAL;
  else if (type === 'home') seed.customerType = CUSTOMER_TYPES.RESIDENTIAL;

  if (params.get('renewable') === '1') seed.energyPreference = 'renewable';

  // Handoff from the standalone Bill Analyzer: usage measured there must not be
  // asked for again.
  const usage = parseFloat(params.get('usage'));
  if (Number.isFinite(usage) && usage > 0 && usage < 10_000_000) {
    seed.monthlyUsageKwh = usage;
    seed.billAnalysisStatus = 'complete';
    seed.billConfidence = 'high';
    seed.billOffered = true;
  }

  // What they pay today, which is the other half of what the analyzer already
  // established. Without it the engine has a usage figure and no bill to
  // compare it against, so every result arrives with its savings line withheld
  // for `no_current_bill` — the one thing a visitor coming from a bill analysis
  // has most obviously already told us.
  //
  // Only meaningful alongside a usage figure: a cost with no usage cannot be
  // turned into a comparable rate, and would sit in state doing nothing.
  const cost = parseFloat(params.get('cost'));
  if (
    seed.monthlyUsageKwh &&
    Number.isFinite(cost) &&
    cost >= HANDOFF_COST_LIMITS.min &&
    cost <= HANDOFF_COST_LIMITS.max
  ) {
    seed.monthlyCost = cost;
  }

  const provider = (params.get('provider') || '').trim();
  if (provider) seed.currentProvider = provider.slice(0, 120);

  const entry = params.get('entry');
  if (entry && ENTRY_CONTEXT_VALUES.has(entry)) seed.entryContext = entry;

  const hasEntryParams = ENTRY_PARAM_KEYS.some((key) => params.get(key) !== null);

  return { seed, hasEntryParams };
}

/**
 * Entry context for a session, defaulting to a direct visit.
 *
 * A visitor who typed /compare-rates into the address bar is a real funnel
 * entry, not a missing value, so it is recorded as one.
 */
export function resolveEntryContext(state) {
  const value = state?.entryContext;
  return value && ENTRY_CONTEXT_VALUES.has(value)
    ? value
    : ENTRY_CONTEXTS.COMPARE_RATES_DIRECT;
}
