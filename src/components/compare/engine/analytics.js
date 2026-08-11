/**
 * Funnel analytics for the comparison engine.
 *
 * Events are pushed to window.dataLayer when a tag manager is present and are
 * a silent no-op otherwise, so the funnel is instrumented whether or not an
 * analytics vendor is configured.
 *
 * PII must never reach an analytics payload. `stripPii` drops the keys that
 * carry it and redacts anything that looks like an email or phone number, so a
 * careless call site cannot leak a customer's details into a third-party tool.
 */

export const EVENTS = {
  // ── Landing funnel ──
  // Each service landing reports its own view and its own ZIP submission, so
  // visits, ZIP conversions and continuations into the engine can be counted
  // per entry point instead of as one undifferentiated total.
  RESIDENTIAL_LANDING_VIEWED: 'residential_landing_viewed',
  COMMERCIAL_LANDING_VIEWED: 'commercial_landing_viewed',
  RENEWABLE_LANDING_VIEWED: 'renewable_landing_viewed',
  RESIDENTIAL_ZIP_SUBMITTED: 'residential_zip_submitted',
  COMMERCIAL_ZIP_SUBMITTED: 'commercial_zip_submitted',
  RENEWABLE_ZIP_SUBMITTED: 'renewable_zip_submitted',
  LANDING_ZIP_REJECTED: 'landing_zip_rejected',
  LANDING_COMPARISON_HANDOFF: 'landing_comparison_handoff',

  COMPARE_RATES_VIEWED: 'compare_rates_viewed',
  COMPARISON_STARTED: 'comparison_started',
  SERVICE_TYPE_CHANGED: 'service_type_changed',
  ZIP_COMPLETED: 'zip_completed',
  CUSTOMER_TYPE_SELECTED: 'customer_type_selected',
  RENEWABLE_CONTEXT_SELECTED: 'renewable_context_selected',
  PROPERTY_TYPE_SELECTED: 'property_type_selected',
  BUSINESS_TYPE_SELECTED: 'business_type_selected',
  BILL_UPLOAD_OFFERED: 'bill_upload_offered',
  BILL_UPLOAD_STARTED: 'bill_upload_started',
  BILL_ANALYSIS_COMPLETED: 'bill_analysis_completed',
  BILL_ANALYSIS_FAILED: 'bill_analysis_failed',
  BILL_SKIPPED: 'bill_skipped',
  USAGE_SELECTED: 'usage_selected',
  SHOPPING_INTENT_SELECTED: 'shopping_intent_selected',
  COMMERCIAL_SPEND_SELECTED: 'commercial_spend_selected',
  COMMERCIAL_TIMING_SELECTED: 'commercial_timing_selected',
  NAME_COMPLETED: 'name_completed',
  EMAIL_COMPLETED: 'email_completed',
  PHONE_COMPLETED: 'phone_completed',
  MATCHING_STARTED: 'matching_started',
  RESULTS_VIEWED: 'results_viewed',
  AFFILIATE_CLICKED: 'affiliate_clicked',
  COMMERCIAL_QUOTE_CREATED: 'commercial_quote_created',
  PARTNER_ROUTE_CREATED: 'partner_route_created',
  CONCIERGE_CREATED: 'concierge_created',
  COMPARISON_COMPLETED: 'comparison_completed',
};

/**
 * The two landing events for each service, resolved by service id.
 *
 * Keyed rather than assembled from strings so a typo is a missing key at the
 * call site instead of an event name nothing reports on.
 */
export const LANDING_EVENTS = {
  residential: {
    viewed: EVENTS.RESIDENTIAL_LANDING_VIEWED,
    zipSubmitted: EVENTS.RESIDENTIAL_ZIP_SUBMITTED,
  },
  commercial: {
    viewed: EVENTS.COMMERCIAL_LANDING_VIEWED,
    zipSubmitted: EVENTS.COMMERCIAL_ZIP_SUBMITTED,
  },
  renewable: {
    viewed: EVENTS.RENEWABLE_LANDING_VIEWED,
    zipSubmitted: EVENTS.RENEWABLE_ZIP_SUBMITTED,
  },
};

/** Keys that carry PII and must never be forwarded to analytics. */
const PII_KEYS = new Set([
  'email',
  'name',
  'first_name',
  'last_name',
  'phone',
  'address',
  'service_address',
  'customer_name',
  'business_name',
  'account_number',
]);

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

/**
 * Phone detection by digit count rather than by shape.
 *
 * Real numbers arrive in too many formats for a single pattern to cover
 * ("+1 (555) 123-4567", "555.123.4567", "5551234567"), so anything made only
 * of dialling characters that carries 10+ digits is treated as a phone number.
 * Over-redacting here is the safe direction to err in.
 */
function looksLikePhone(value) {
  if (!/^[\d\s()+.\-]+$/.test(value)) return false;
  return value.replace(/\D/g, '').length >= 10;
}

/**
 * Remove PII from an analytics payload.
 *
 * Both halves matter: dropping known PII keys handles the common case, and
 * redacting values that look like an email or phone catches the same data
 * arriving under an unexpected key name.
 */
export function stripPii(payload) {
  if (!payload || typeof payload !== 'object') return {};
  const clean = {};

  for (const [key, value] of Object.entries(payload)) {
    if (PII_KEYS.has(key.toLowerCase())) continue;
    if (value === null || value === undefined) continue;

    if (typeof value === 'string') {
      if (EMAIL_RE.test(value) || looksLikePhone(value)) continue;
      clean[key] = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value;
    } else if (Array.isArray(value)) {
      clean[key] = value.filter(
        (v) => typeof v === 'number' || typeof v === 'boolean' ||
          (typeof v === 'string' && !EMAIL_RE.test(v) && !looksLikePhone(v))
      );
    } else if (typeof value === 'object') {
      clean[key] = stripPii(value);
    }
  }

  return clean;
}

/**
 * Emit a funnel event. Safe to call from anywhere — never throws, and does
 * nothing when no analytics destination is configured.
 */
export function track(event, payload = {}) {
  if (!event) return;
  const data = stripPii(payload);

  if (typeof window === 'undefined') return;

  try {
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event, ...data });
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, data);
    }
  } catch {
    /* analytics must never break the funnel */
  }
}
