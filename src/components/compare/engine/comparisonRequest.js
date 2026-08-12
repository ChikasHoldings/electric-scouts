/**
 * Validation for the server comparison request.
 *
 * Everything the comparison engine needs arrives from a browser, so none of it
 * can be believed on arrival. This module is the boundary: it takes an
 * arbitrary JSON body and returns either a rejection or a normalized session
 * object that the pricing and ranking engines can be handed safely.
 *
 * Two rules govern what is accepted:
 *
 *   1. QUALIFICATION INPUTS ONLY. Where the customer lives, what they are
 *      shopping for, how much they use, what they pay today. These describe the
 *      customer, and the customer is the authority on them.
 *
 *   2. NO ECONOMICS. A request may not carry a price, an estimated cost, a
 *      match score, a rank, a saving or an outbound URL. Those are conclusions,
 *      the server draws them, and anything of that shape in the body is dropped
 *      here rather than being allowed to reach the engine. That is what stops a
 *      crafted payload from re-pricing a plan or promoting itself to #1.
 *
 * Pure and framework-free, so the whole validation surface is testable without
 * a database or an HTTP server.
 */

import { CUSTOMER_TYPES, USAGE_RANGE_MIDPOINTS, resolveUsageKwh } from './comparisonState.js';
import { validateZipCode, DEREGULATED_STATES } from '../stateData.js';

/** Intents the ranking engine scores contract terms against. */
export const SHOPPING_INTENTS = ['moving', 'switching', 'better_rate'];

/** Usage bands, taken from the same map the questionnaire offers. */
export const USAGE_RANGES = Object.keys(USAGE_RANGE_MIDPOINTS);

export const ENERGY_PREFERENCES = ['renewable'];

export const BILL_STATUSES = ['none', 'analyzing', 'complete', 'failed'];
export const BILL_CONFIDENCES = ['high', 'low'];

/** Fields the bill analyzer can flag as needing the customer's confirmation. */
export const VERIFIABLE_FIELDS = ['monthlyCost', 'monthlyUsageKwh', 'effectiveRate'];

/**
 * Bounds for the two numbers that drive the whole comparison.
 *
 * Wide enough for a genuine outlier — an all-electric house in a Texas summer,
 * a small business on a residential meter — and narrow enough that a value
 * chosen to break the arithmetic is refused rather than propagated into a
 * cost estimate.
 */
export const USAGE_KWH_LIMITS = { min: 1, max: 100000 };
export const MONTHLY_COST_LIMITS = { min: 1, max: 1000000 };

function str(value, max) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : '';
}

/** A value from a fixed set, or '' — never the caller's arbitrary string. */
function fromSet(value, allowed) {
  const candidate = str(value, 40);
  return allowed.includes(candidate) ? candidate : '';
}

/** A finite number inside `limits`, or null. Strings are accepted and parsed. */
function bounded(value, limits) {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(n)) return null;
  if (n < limits.min || n > limits.max) return null;
  return n;
}

/**
 * Resolve the market from the request.
 *
 * The ZIP is preferred and re-validated here rather than trusting the state
 * code the browser derived from it: serviceability is a business rule, and the
 * server applies it with the same validator the questionnaire uses. A bare
 * state code is still accepted — the legacy quote pages send one — but it has
 * to name a market we actually serve.
 */
export function resolveMarket({ zip, state }) {
  const normalizedZip = String(zip ?? '').replace(/\D/g, '').slice(0, 5);

  if (normalizedZip.length === 5) {
    const result = validateZipCode(normalizedZip);
    if (result?.valid && result.state) {
      return { ok: true, zip: normalizedZip, state: result.state };
    }
    return { ok: false, error: 'zip_not_serviceable' };
  }

  const code = str(state, 2).toUpperCase();
  if (code && DEREGULATED_STATES[code]) {
    return { ok: true, zip: '', state: code };
  }

  return { ok: false, error: 'state_required' };
}

/**
 * Validate a comparison request body.
 *
 * @returns {{ok: true, session: object} | {ok: false, error: string}}
 *   `session` is the same flat shape `createInitialState` produces, so the
 *   ranking engine cannot tell whether it was built in the browser or here.
 */
export function parseComparisonRequest(body = {}) {
  const input = body && typeof body === 'object' ? body : {};

  const market = resolveMarket({ zip: input.zip, state: input.state });
  if (!market.ok) return { ok: false, error: market.error };

  const customerType = input.customerType === CUSTOMER_TYPES.COMMERCIAL
    ? CUSTOMER_TYPES.COMMERCIAL
    : CUSTOMER_TYPES.RESIDENTIAL;

  // A usage figure read off a bill outranks a self-reported band, which is the
  // same precedence `resolveUsageKwh` applies in the browser.
  const monthlyUsageKwh = bounded(input.monthlyUsageKwh, USAGE_KWH_LIMITS);
  const usageRange = fromSet(input.usageRange, USAGE_RANGES);

  const billAnalysisStatus = fromSet(input.billAnalysisStatus, BILL_STATUSES) || 'none';
  const billConfidence = fromSet(input.billConfidence, BILL_CONFIDENCES) || null;

  // Only the names of fields awaiting confirmation are accepted. This is a
  // suppression signal — it can withhold a savings figure, never produce one —
  // so an unknown field name is simply dropped.
  const unverifiedFields = Array.isArray(input.unverifiedFields)
    ? input.unverifiedFields.filter((f) => VERIFIABLE_FIELDS.includes(f)).slice(0, VERIFIABLE_FIELDS.length)
    : [];

  const session = {
    sessionId: str(input.sessionId, 64),
    zip: market.zip,
    state: market.state,
    customerType,

    energyPreference: fromSet(input.energyPreference, ENERGY_PREFERENCES),
    shoppingIntent: fromSet(input.shoppingIntent, SHOPPING_INTENTS),
    usageRange,

    monthlyUsageKwh,
    monthlyCost: bounded(input.monthlyCost, MONTHLY_COST_LIMITS),

    billAnalysisStatus,
    billConfidence,
    unverifiedFields,

    entryContext: str(input.entryContext, 60),
    attribution: {
      utm_source: str(input.attribution?.utm_source, 80),
      utm_campaign: str(input.attribution?.utm_campaign, 80),
    },
  };

  return { ok: true, session, usageKwh: resolveUsageKwh(session) };
}
