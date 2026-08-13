/**
 * Canonical plan validation and normalization.
 *
 * One layer shared by the residential, business and renewable admin screens.
 * Three near-identical forms with subtly different parsing is how the two bugs
 * this replaces got in:
 *
 *   1. `parseInt(form.renewable_percentage) || 100` turned a legitimate 0 into
 *      100, because 0 is falsy. A conventional plan saved through the
 *      renewable screen was published as 100% renewable.
 *
 *   2. The forms selected a provider by NAME and wrote only `provider_name`,
 *      so a new plan carried no `provider_id`. Migration 014 had to backfill
 *      hundreds of historical rows by name matching; nothing stopped the next
 *      admin-created plan from needing the same repair.
 *
 * The rule throughout: blank, zero, invalid and absent are four different
 * things and must stay that way. Never coerce an unparseable value into a
 * number a customer will be charged against.
 */

// Relative, not aliased: this module is exercised directly by `node --test`,
// which does not resolve the bundler's `@/` alias.
import { estimateMonthlyCost, COST_CONFIDENCE } from '../components/compare/engine/planPricing.js';
import { resolveTerritory, COMPONENT_LABELS } from '../components/compare/engine/utilityTerritory.js';
import { checkEligibility, REASON_LABELS } from '../components/compare/engine/eligibility.js';

/**
 * Reference load for completeness checks only.
 *
 * Completeness is a question about which components are known, not about a
 * particular customer's usage — but the engine needs a positive usage figure to
 * exercise them. 1,000 kWh is the industry-standard comparison point.
 */
const REFERENCE_USAGE_KWH = 1000;

/**
 * Parse an optional number.
 *
 * Returns `{value, error}` rather than a tagged union: `value: null` with no
 * error means "not supplied", which is a different thing from 0.
 *
 * @returns {{value: number|null, error: string|null}}
 */
export function parseOptionalNumber(input, opts = {}) {
  const { field = 'Value', min = 0, max = Number.MAX_SAFE_INTEGER, integer = false } = opts;
  if (input === null || input === undefined || String(input).trim() === '') {
    return { value: null, error: null };
  }

  const n = typeof input === 'number' ? input : Number(String(input).trim());

  if (!Number.isFinite(n)) return { value: null, error: `${field} must be a number.` };
  if (integer && !Number.isInteger(n)) return { value: null, error: `${field} must be a whole number.` };
  if (n < min) return { value: null, error: `${field} cannot be less than ${min}.` };
  if (n > max) return { value: null, error: `${field} cannot be more than ${max}.` };

  return { value: n, error: null };
}

/** Required variant — blank is an error rather than null. */
export function parseRequiredNumber(input, opts) {
  const result = parseOptionalNumber(input, opts);
  if (result.error) return result;
  if (result.value === null) return { value: null, error: `${opts.field} is required.` };
  return result;
}

/** A URL field: blank is fine, malformed is not. */
export function parseOptionalUrl(input, { field }) {
  const raw = String(input ?? '').trim();
  if (!raw) return { value: null, error: null };
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { ok: false, error: `${field} must start with http:// or https://.` };
    }
    return { ok: true, value: raw };
  } catch {
    return { ok: false, error: `${field} must be a valid URL.` };
  }
}

export const PLAN_TYPES = ['fixed', 'variable', 'indexed'];
export const CUSTOMER_TYPES = ['residential', 'business', 'renewable'];

/**
 * Validate and normalize a plan payload from any of the three admin screens.
 *
 * `providers` is the list the form offered, used to resolve the canonical
 * provider relation. `provider_id` is authoritative; `provider_name` is kept
 * synchronized for the existing display paths that still read it.
 *
 * @returns {{valid: boolean, values: object, errors: Record<string,string>}}
 */
export function validatePlan(form = {}, providers = []) {
  /** @type {Record<string, string>} */
  const errors = {};
  /** @type {Record<string, any>} */
  const values = {};

  // ── Provider relation ──
  //
  // Resolved to an id even when the form only knows a name, so a plan can
  // never again be created that depends on name matching to find its provider.
  const byId = new Map(providers.map((p) => [p.id, p]));
  const byName = new Map(
    providers.map((p) => [String(p.name || '').trim().toLowerCase(), p])
  );

  const provider =
    (form.provider_id && byId.get(form.provider_id)) ||
    byName.get(String(form.provider_name || '').trim().toLowerCase()) ||
    null;

  if (!provider) {
    errors.provider_id = 'Select a provider.';
  } else {
    values.provider_id = provider.id;
    // Denormalized copy, synchronized deliberately. A rename updates this on
    // the next save; the id is what keeps the relationship valid meanwhile.
    values.provider_name = provider.name;
  }

  // ── Identity ──
  const planName = String(form.plan_name ?? '').trim();
  if (!planName) errors.plan_name = 'Plan name is required.';
  else values.plan_name = planName.slice(0, 160);

  const state = String(form.state ?? '').trim().toUpperCase();
  if (!state) errors.state = 'State is required.';
  else values.state = state.slice(0, 2);

  const customerType = String(form.customer_type ?? '').trim();
  if (!CUSTOMER_TYPES.includes(customerType)) {
    errors.customer_type = 'Select a valid customer type.';
  } else {
    values.customer_type = customerType;
  }

  const planType = String(form.plan_type ?? '').trim();
  if (planType && !PLAN_TYPES.includes(planType)) {
    errors.plan_type = 'Select a valid rate type.';
  } else if (planType) {
    values.plan_type = planType;
  }

  // ── Pricing ──
  //
  // `monthly_base_charge` is the CANONICAL supplier base charge and the only one
  // admin writes. The legacy `base_charge` column is deliberately absent from
  // this list: two admin-editable fields for one concept is how a plan ends up
  // with a different base charge depending on which screen last saved it. It
  // stays readable — the pricing engine falls back to it — but nothing here
  // writes it, so existing values are preserved untouched.
  //
  // All money is DOLLARS per month; all per-kWh rates are CENTS per kWh.
  const numericFields = [
    { key: 'rate_per_kwh', field: 'Rate per kWh (¢)', min: 0, max: 200, required: true },
    { key: 'monthly_base_charge', field: 'Base charge ($/mo)', min: 0, max: 1000 },
    { key: 'tdsp_charges', field: 'Delivery charge (¢/kWh)', min: 0, max: 200 },
    { key: 'usage_credit', field: 'Usage credit ($)', min: 0, max: 10000 },
    { key: 'usage_credit_threshold', field: 'Usage credit threshold (kWh)', min: 0, max: 100000, integer: true },
    { key: 'early_termination_fee', field: 'Early termination fee ($)', min: 0, max: 10000 },
    { key: 'contract_length', field: 'Contract term (months)', min: 0, max: 120, integer: true },
  ];

  for (const spec of numericFields) {
    const key = spec.key;
    const result = spec.required
      ? parseRequiredNumber(form[key], spec)
      : parseOptionalNumber(form[key], spec);
    if (result.error) errors[key] = result.error;
    else values[key] = result.value;
  }

  // ── Renewable percentage ──
  //
  // Explicitly 0–100 with no default. The old `|| 100` published conventional
  // plans as fully renewable, which is a claim about the product that the
  // data did not support.
  const renewable = parseOptionalNumber(form.renewable_percentage, {
    field: 'Renewable percentage', min: 0, max: 100, integer: true,
  });
  if (renewable.error) errors.renewable_percentage = renewable.error;
  else values.renewable_percentage = renewable.value;

  // A credit with no threshold is unconditional, which is how these plans are
  // marketed — but a threshold with no credit is a form mistake worth naming.
  if (values.usage_credit_threshold && !values.usage_credit) {
    errors.usage_credit = 'Set a usage credit, or clear the threshold.';
  }

  // ── URLs ──
  for (const spec of [
    { key: 'plan_details_url', field: 'Plan details URL' },
    { key: 'facts_label_url', field: 'Facts label URL' },
  ]) {
    const key = spec.key;
    const result = parseOptionalUrl(form[key], { field: spec.field });
    if (result.error) errors[key] = result.error;
    else values[key] = result.value;
  }

  // ── Status ──
  values.is_active = form.is_active === true || form.is_active === 'true';

  return { valid: Object.keys(errors).length === 0, values, errors };
}

/**
 * Pricing completeness, computed by the SAME engine the public comparison runs.
 *
 * This calls `estimateMonthlyCost` rather than re-implementing its rule. The
 * previous version re-stated the test as `tdsp_charges > 0`, which meant the
 * badge an admin read and the classification the customer got were two separate
 * pieces of code that could disagree — and would have, the moment delivery moved
 * to the territory model.
 *
 * The usage figure is a REFERENCE load used only to exercise the components; it
 * is not a claim about any customer. Completeness depends on which components
 * are known, not on how much electricity is used.
 *
 * @param {object} plan
 * @param {object[]} [territories] territory rows for the plan's state
 * @returns {{status: string, complete: boolean, missing: string[],
 *            missingLabels: string[], savingsAvailable: boolean,
 *            territory: object|null, territoryResolution: string}}
 */
export function pricingCompleteness(plan, territories = []) {
  const resolved = resolveTerritory({
    plan,
    state: plan?.state,
    territories,
  });

  const estimate = estimateMonthlyCost(plan, REFERENCE_USAGE_KWH, {
    territory: resolved.territory,
    resolution: resolved.resolution,
  });

  const missing = estimate.missingComponents || [];

  return {
    status: estimate.confidence,
    complete: estimate.confidence === COST_CONFIDENCE.COMPLETE,
    missing,
    missingLabels: missing.map((c) => COMPONENT_LABELS[c] || c),
    // Mirrors the engine: without complete pricing there is no defensible
    // savings figure, so the admin is told that plainly.
    savingsAvailable: estimate.confidence === COST_CONFIDENCE.COMPLETE,
    territory: resolved.territory,
    territoryResolution: resolved.resolution,
  };
}

/**
 * Public eligibility, for the admin badge.
 *
 * Distinct from pricing completeness, and the two must not be conflated: a
 * partial plan is still publishable — clearly disclosed — while an inactive
 * provider blocks a perfectly priced one. An admin needs to see which of the
 * two is happening.
 */
export function publicEligibility(plan, provider) {
  const result = checkEligibility(plan, provider || plan?.provider);
  return {
    eligible: result.eligible,
    reason: result.reason,
    label: result.reason ? REASON_LABELS[result.reason] || 'Not publicly eligible' : null,
  };
}
