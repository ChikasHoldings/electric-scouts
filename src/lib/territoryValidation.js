/**
 * Validation for a utility delivery tariff.
 *
 * Same discipline as `planValidation`: blank, zero, invalid and absent are four
 * different things. The distinction matters more here than anywhere else in the
 * catalog, because a delivery charge is applied to every plan in a market.
 *
 * One asymmetry worth stating plainly. On a PLAN, `tdsp_charges = 0` was the
 * schema default and meant "never configured" — migration 023 removed it and
 * the plan form refuses it. On a TARIFF, 0 is a legitimate value: it records
 * "checked, this territory levies no per-kWh delivery charge", which is a real
 * finding and different from never having looked. Blank is how you say the
 * latter.
 */

import { parseOptionalNumber, parseOptionalUrl } from './planValidation.js';
import { BILLING_MODELS } from './deliveryTariff.js';

export const BILLING_MODEL_LABELS = {
  [BILLING_MODELS.SUPPLY_ONLY]: 'Supply only — delivery added',
  [BILLING_MODELS.ALL_IN]: 'All-in — delivery included',
};

/** An ISO date (YYYY-MM-DD), or null. */
function parseOptionalDate(input, field) {
  const raw = String(input ?? '').trim();
  if (!raw) return { value: null, error: null };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { value: null, error: `${field} must be a date.` };
  }
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return { value: null, error: `${field} is not a real date.` };
  }
  return { value: raw, error: null };
}

/**
 * Parse the ZIP-prefix field.
 *
 * Free text in, a clean array out. Empty means the tariff covers the whole
 * state, which is a meaningful choice rather than an omission.
 */
export function parseZipPrefixes(input) {
  if (Array.isArray(input)) return input.map((p) => String(p).trim()).filter(Boolean);

  const parts = String(input ?? '')
    .split(/[,\s]+/)
    .map((p) => p.trim().replace(/\D/g, ''))
    .filter(Boolean);

  return [...new Set(parts)];
}

/**
 * Validate and normalize a tariff payload from the admin form.
 *
 * @returns {{valid: boolean, values: object, errors: Record<string,string>}}
 */
export function validateTerritory(form = {}) {
  /** @type {Record<string, string>} */
  const errors = {};
  /** @type {Record<string, any>} */
  const values = {};

  // ── Identity ──
  const name = String(form.name ?? '').trim();
  if (!name) errors.name = 'Territory name is required.';
  else values.name = name.slice(0, 160);

  const shortCode = String(form.short_code ?? '').trim();
  values.short_code = shortCode ? shortCode.slice(0, 40) : null;

  const state = String(form.state ?? '').trim().toUpperCase();
  if (!state) errors.state = 'State is required.';
  else values.state = state.slice(0, 2);

  // ── Billing model ──
  const billingModel = String(form.billing_model ?? '').trim();
  if (!Object.values(BILLING_MODELS).includes(billingModel)) {
    errors.billing_model = 'Select how retailer rates are billed in this territory.';
  } else {
    values.billing_model = billingModel;
  }

  // ── The tariff ──
  const perKwh = parseOptionalNumber(form.delivery_per_kwh_cents, {
    field: 'Delivery charge', min: 0, max: 200,
  });
  if (perKwh.error) errors.delivery_per_kwh_cents = perKwh.error;
  else values.delivery_per_kwh_cents = perKwh.value;

  const fixed = parseOptionalNumber(form.fixed_monthly_delivery_charge, {
    field: 'Fixed monthly delivery charge', min: 0, max: 1000,
  });
  if (fixed.error) errors.fixed_monthly_delivery_charge = fixed.error;
  else values.fixed_monthly_delivery_charge = fixed.value;

  // An all-in territory has no separate delivery charge by definition — the
  // retailer's advertised rate already covers it. Storing one invites somebody
  // to add it later and double-charge every customer in the market.
  if (values.billing_model === BILLING_MODELS.ALL_IN) {
    values.delivery_per_kwh_cents = null;
    values.fixed_monthly_delivery_charge = null;
  }

  // ── Effective window ──
  const from = parseOptionalDate(form.effective_from, 'Effective from');
  if (from.error) errors.effective_from = from.error;
  else if (!from.value) errors.effective_from = 'Effective from is required.';
  else values.effective_from = from.value;

  const to = parseOptionalDate(form.effective_to, 'Effective to');
  if (to.error) errors.effective_to = to.error;
  else values.effective_to = to.value;

  if (values.effective_from && values.effective_to && values.effective_to < values.effective_from) {
    errors.effective_to = 'Effective to cannot be before effective from.';
  }

  // ── Provenance ──
  const sourceName = String(form.source_name ?? '').trim();
  values.source_name = sourceName ? sourceName.slice(0, 160) : null;

  const sourceUrl = parseOptionalUrl(form.source_url, { field: 'Source URL' });
  if (sourceUrl.error) errors.source_url = sourceUrl.error;
  else values.source_url = sourceUrl.value ?? null;

  const verified = parseOptionalDate(form.verified_at, 'Verified on');
  if (verified.error) errors.verified_at = verified.error;
  else values.verified_at = verified.value;

  // ── Territory matching ──
  const prefixes = parseZipPrefixes(form.service_zip_prefixes);
  values.service_zip_prefixes = prefixes.length ? prefixes : null;

  const notes = String(form.notes ?? '').trim();
  values.notes = notes ? notes.slice(0, 2000) : null;

  values.is_active = form.is_active === true || form.is_active === 'true';

  return { valid: Object.keys(errors).length === 0, values, errors };
}
