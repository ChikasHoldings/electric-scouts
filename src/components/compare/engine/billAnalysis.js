/**
 * Bill analysis → comparison state.
 *
 * The extraction backend (`/api/extract-data`, reused unchanged by both the
 * standalone Bill Analyzer and this flow) returns a loose JSON object. This
 * module is the single place that decides which of those fields we keep, how
 * much we trust them, and what they mean for the questionnaire.
 *
 * Data minimization is enforced here: the account number, customer name and
 * service address are deliberately dropped. The comparison needs usage, cost,
 * provider, rate and contract characteristics — not the visitor's utility
 * account identity.
 */

import { CUSTOMER_TYPES } from './comparisonState.js';

/** Extraction fields that are never carried into session state or persisted. */
const DROPPED_FIELDS = ['account_number', 'customer_name', 'service_address'];

/** Prompt for a residential bill — matches the existing analyzer's contract. */
export const RESIDENTIAL_PROMPT = `You are analyzing a residential electricity bill. Extract the following and return as a JSON object with these exact field names:
{
  "monthly_usage_kwh": (number, monthly electricity usage in kWh),
  "monthly_cost": (number, total monthly cost in dollars),
  "rate_per_kwh": (number, rate per kWh in CENTS),
  "provider_name": (string, current electricity provider/company name),
  "plan_name": (string, current plan/product name, or null),
  "zip_code": (string, service address ZIP code),
  "billing_period": (string, the billing period dates, or null),
  "contract_end_date": (string, contract or plan end date if clearly stated, or null),
  "renewable_percentage": (number, percentage of renewable content if stated, or null),
  "base_charge": (number, fixed monthly/base charge in dollars, or null)
}
IMPORTANT:
- monthly_usage_kwh: look for "kWh Used", "Total Usage", "Energy Used".
- monthly_cost: look for "Total Amount Due", "Total Charges", "Amount Due".
- rate_per_kwh: look for "Price per kWh" or calculate cost / usage. Express in CENTS.
- Only report contract_end_date and renewable_percentage if clearly stated on the bill. Use null otherwise.
- Do NOT guess. If a field cannot be determined, use null.
- Return JSON only, no explanation or markdown.`;

/** Commercial bills carry demand charges, which change how a plan is priced. */
export const COMMERCIAL_PROMPT = `You are analyzing a COMMERCIAL/BUSINESS electricity bill. Extract the following and return as a JSON object with these exact field names:
{
  "monthly_usage_kwh": (number, monthly electricity usage in kWh),
  "monthly_cost": (number, total monthly cost in dollars),
  "rate_per_kwh": (number, rate per kWh in CENTS),
  "provider_name": (string, current electricity provider/company name),
  "plan_name": (string, current plan/product name, or null),
  "zip_code": (string, service address ZIP code),
  "billing_period": (string, the billing period dates, or null),
  "contract_end_date": (string, contract end date if clearly stated, or null),
  "peak_demand_kw": (number, peak demand in kW if shown, or null),
  "demand_charges": (number, total demand charges in dollars if shown, or null),
  "fixed_charges": (number, fixed/customer charges in dollars, or null),
  "renewable_percentage": (number, renewable content percentage if stated, or null)
}
IMPORTANT:
- Commercial bills often show demand (kW) separately from usage (kWh). Do not confuse them.
- peak_demand_kw: look for "Peak Demand", "Billed Demand", "Max kW".
- Only report values clearly present on the bill. Use null when unsure.
- Do NOT guess. Return JSON only, no explanation or markdown.`;

export function promptFor(customerType) {
  return customerType === CUSTOMER_TYPES.COMMERCIAL ? COMMERCIAL_PROMPT : RESIDENTIAL_PROMPT;
}

function positiveNumber(value) {
  const n = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
  return Number.isFinite(n) && n > 0 ? n : null;
}

function cleanString(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || /^(n\/?a|none|unknown|null)$/i.test(trimmed)) return '';
  return trimmed.slice(0, 120);
}

/**
 * Decide how much to trust an extraction.
 *
 * Usage is the field the rest of the flow depends on, so a result without it
 * is treated as low confidence even when other fields came back. `unverified`
 * lists exactly which values to ask the visitor to confirm — the low-confidence
 * path asks about those alone rather than re-running a whole form.
 */
export function assessConfidence(mapped, customerType) {
  const unverified = [];

  const hasUsage = mapped.monthlyUsageKwh > 0;
  const hasCost = mapped.monthlyCost > 0;
  const hasProvider = Boolean(mapped.currentProvider);

  if (!hasUsage) unverified.push('monthlyUsageKwh');

  // A rate that disagrees with cost/usage means one of the three was misread.
  if (hasUsage && hasCost && mapped.effectiveRate > 0) {
    const impliedRate = (mapped.monthlyCost / mapped.monthlyUsageKwh) * 100;
    const drift = Math.abs(impliedRate - mapped.effectiveRate) / impliedRate;
    if (drift > 0.5) unverified.push('effectiveRate');
  }

  // Implausible residential usage is more likely a misread than a real figure.
  if (customerType === CUSTOMER_TYPES.RESIDENTIAL && hasUsage && mapped.monthlyUsageKwh > 10000) {
    if (!unverified.includes('monthlyUsageKwh')) unverified.push('monthlyUsageKwh');
  }

  const signalCount = [hasUsage, hasCost, hasProvider].filter(Boolean).length;
  const confidence = unverified.length === 0 && signalCount >= 2 ? 'high' : 'low';

  return { confidence, unverified };
}

/**
 * Map raw extraction output onto comparison state fields.
 *
 * Returns only fields that were confidently present — absent values are left
 * out entirely rather than written as zero, so `isKnown` keeps treating the
 * corresponding question as unanswered instead of silently skipping it.
 */
export function mapExtractionToState(output, customerType) {
  if (!output || typeof output !== 'object') {
    return { fields: {}, confidence: 'low', unverified: ['monthlyUsageKwh'] };
  }

  const mapped = {
    monthlyUsageKwh: positiveNumber(output.monthly_usage_kwh),
    monthlyCost: positiveNumber(output.monthly_cost),
    effectiveRate: positiveNumber(output.rate_per_kwh),
    currentProvider: cleanString(output.provider_name),
    currentPlan: cleanString(output.plan_name),
    contractEndDate: cleanString(output.contract_end_date),
    renewablePercentage: positiveNumber(output.renewable_percentage),
    peakDemandKw: positiveNumber(output.peak_demand_kw),
  };

  const { confidence, unverified } = assessConfidence(mapped, customerType);

  // Strip empties so partial extractions don't overwrite good state with blanks.
  const fields = {};
  for (const [key, value] of Object.entries(mapped)) {
    if (value === null || value === '') continue;
    fields[key] = value;
  }

  // ZIP is only adopted when the visitor hasn't already given one — the ZIP
  // they typed is the service location they care about.
  const billZip = cleanString(output.zip_code).replace(/\D/g, '').slice(0, 5);
  if (billZip.length === 5) fields.billZip = billZip;

  return { fields, confidence, unverified };
}

export { DROPPED_FIELDS };
