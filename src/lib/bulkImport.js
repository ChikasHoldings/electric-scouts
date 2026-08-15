/**
 * bulkImport.js
 *
 * Turning a pasted spreadsheet into catalog rows, without letting a plausible
 * number through unchallenged.
 *
 * Delivery tariffs come off utility tariff sheets and plan rates come off
 * supplier rate cards. Both arrive as tables, both are entered rarely and in
 * bulk, and both feed straight into a savings figure a customer is asked to act
 * on. Typing seventeen tariffs into a form one at a time is how they stay
 * un-entered; pasting them in without checks is how a wrong one reaches
 * everybody in a market at once.
 *
 * So this module does three things the per-field validators deliberately do
 * not:
 *
 *   1. It reads what people actually paste — CSV or tab-separated, quoted or
 *      not, with headers spelled however the source spelled them.
 *
 *   2. It catches unit errors. This is the whole point. `validateTerritory`
 *      accepts 0.098 as a delivery charge because 0.098 is a number in range —
 *      but a rate written in dollars where the column wants cents makes every
 *      estimate in that territory wrong by a factor of a hundred, and nothing
 *      downstream can tell. A shape check cannot catch that. A plausibility
 *      check can.
 *
 *   3. It classifies each row against what is already stored, so an import
 *      says "3 new, 2 superseded, 12 unchanged" instead of silently rewriting
 *      the catalog. Superseding closes the old tariff rather than overwriting
 *      it, which is what keeps a quote from last month reconstructable.
 *
 * Pure functions, no React and no network: the admin screen previews with them
 * and the tests exercise them directly.
 */

import { validateTerritory } from './territoryValidation.js';
import { validatePlan } from './planValidation.js';
import { BILLING_MODELS } from './deliveryTariff.js';

/* ------------------------------------------------------------------ *
 * Reading what people paste
 * ------------------------------------------------------------------ */

/**
 * Split one delimited line, honouring quotes.
 *
 * Plan names contain commas — "Secure 12, Fixed" — so a naive split corrupts
 * exactly the rows a human would skim past as fine.
 */
function splitLine(line, delimiter) {
  const cells = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') { cell += '"'; i += 1; }
        else quoted = false;
      } else cell += char;
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      cells.push(cell); cell = '';
    } else cell += char;
  }
  cells.push(cell);
  return cells.map((c) => c.trim());
}

/** Tab if the header line has more tabs than commas — spreadsheet paste. */
function detectDelimiter(headerLine) {
  const tabs = (headerLine.match(/\t/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return tabs > commas ? '\t' : ',';
}

const normaliseHeader = (h) => String(h).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

/**
 * @param {string} text
 * @param {Record<string, string[]>} synonyms  canonical field → accepted headers
 */
export function parseDelimited(text, synonyms = {}) {
  const lines = String(text ?? '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) return { rows: [], headers: [], unknownHeaders: [], error: 'Nothing to import.' };
  if (lines.length === 1) return { rows: [], headers: [], unknownHeaders: [], error: 'Found a header row and no data.' };

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = splitLine(lines[0], delimiter);

  // Header → canonical field. Anything unrecognised is reported rather than
  // dropped, so a misspelled column is visible instead of silently missing.
  const lookup = new Map();
  for (const [field, accepted] of Object.entries(synonyms)) {
    for (const alias of [field, ...accepted]) lookup.set(normaliseHeader(alias), field);
  }

  const headers = [];
  const unknownHeaders = [];
  for (const raw of rawHeaders) {
    const field = lookup.get(normaliseHeader(raw)) || null;
    headers.push(field);
    if (!field && raw) unknownHeaders.push(raw);
  }

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitLine(lines[i], delimiter);
    const record = {};
    headers.forEach((field, index) => {
      if (field) record[field] = cells[index] ?? '';
    });
    rows.push({ line: i + 1, raw: lines[i], record });
  }

  return { rows, headers, unknownHeaders, error: null };
}

/* ------------------------------------------------------------------ *
 * Plausibility — the checks that catch a wrong number, not a wrong shape
 * ------------------------------------------------------------------ */

/**
 * Does this look like dollars in a column that wants cents?
 *
 * US retail supply sits roughly between 3¢ and 40¢/kWh, and delivery between
 * 0¢ and 20¢. A value under 1 is therefore almost never a real cents figure and
 * almost always $0.098 pasted where 9.8 belonged — which survives every range
 * check and makes the resulting bill a hundredth of the truth.
 *
 * Reported as an error rather than a warning on purpose: a plan whose rate is
 * wrong by 100× produces a savings figure a customer would act on.
 */
function centsSanity(value, { field, min, max, allowZero = false }) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;

  if (n === 0) return allowZero ? null : `${field} is 0 — leave it blank if it was never checked.`;
  if (n > 0 && n < 1) {
    return `${field} is ${n}, which looks like dollars per kWh. This column is in cents — ${(n * 100).toFixed(2)} was probably meant.`;
  }
  if (n < min) return `${field} of ${n}¢ is below anything seen in a US market (${min}¢).`;
  if (n > max) return `${field} of ${n}¢ is above anything seen in a US market (${max}¢).`;
  return null;
}

const RANGES = {
  supplyRate: { min: 2, max: 60 },
  deliveryPerKwh: { min: 0.5, max: 25 },
};

/* ------------------------------------------------------------------ *
 * Delivery tariffs
 * ------------------------------------------------------------------ */

export const TERRITORY_COLUMNS = {
  name: ['territory', 'utility', 'utility_name', 'territory_name'],
  short_code: ['code', 'abbreviation'],
  state: ['st'],
  billing_model: ['billing', 'model', 'rate_includes_delivery'],
  delivery_per_kwh_cents: ['delivery', 'delivery_rate', 'delivery_cents', 'per_kwh', 'delivery_per_kwh'],
  fixed_monthly_delivery_charge: ['customer_charge', 'monthly_charge', 'fixed_charge', 'monthly_customer_charge'],
  effective_from: ['from', 'effective', 'start', 'effective_date'],
  effective_to: ['to', 'end', 'expires'],
  service_zip_prefixes: ['zips', 'zip_prefixes', 'zip_codes', 'prefixes'],
  source_name: ['source', 'tariff_source'],
  source_url: ['url', 'tariff_url', 'link'],
  verified_at: ['verified', 'checked_on'],
  notes: ['note', 'comment'],
};

/** Accept the spellings a tariff sheet is likely to use for the model. */
function normaliseBillingModel(raw) {
  const value = String(raw ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!value) return '';
  if (['supply_only', 'supply', 'energy_only', 'excludes_delivery', 'no', 'false'].includes(value)) {
    return BILLING_MODELS.SUPPLY_ONLY;
  }
  if (['all_in', 'allin', 'bundled', 'includes_delivery', 'yes', 'true'].includes(value)) {
    return BILLING_MODELS.ALL_IN;
  }
  return value;
}

/** Same territory, for the purpose of superseding: a utility in a state. */
const territoryKey = (row) =>
  `${String(row.name ?? '').trim().toLowerCase()}|${String(row.state ?? '').trim().toUpperCase()}`;

/**
 * @param {string} text        pasted CSV/TSV
 * @param {object[]} existing  current utility_territories rows
 */
export function importTerritories(text, existing = []) {
  const { rows, unknownHeaders, error } = parseDelimited(text, TERRITORY_COLUMNS);
  if (error) return { error, rows: [], unknownHeaders, summary: null };

  const byKey = new Map();
  for (const row of existing) byKey.set(territoryKey(row), row);

  const seenInFile = new Set();
  const results = rows.map(({ line, record }) => {
    const form = { ...record, billing_model: normaliseBillingModel(record.billing_model) };
    const { valid, values, errors } = validateTerritory(form);

    const messages = Object.values(errors);
    const warnings = [];

    // Unit errors. Only meaningful on supply_only — validateTerritory nulls the
    // delivery fields on all_in, where a rate is not just wrong but incoherent.
    if (form.billing_model === BILLING_MODELS.SUPPLY_ONLY) {
      const unit = centsSanity(record.delivery_per_kwh_cents, {
        field: 'Delivery charge', ...RANGES.deliveryPerKwh, allowZero: true,
      });
      if (unit) messages.push(unit);

      if (!String(record.delivery_per_kwh_cents ?? '').trim()
          && !String(record.fixed_monthly_delivery_charge ?? '').trim()) {
        warnings.push('No delivery charge — plans here will stay supply-only and show no saving.');
      }
    } else if (form.billing_model === BILLING_MODELS.ALL_IN
        && String(record.delivery_per_kwh_cents ?? '').trim()) {
      messages.push(
        'All-in territories bill delivery inside the advertised rate. A delivery charge here would be added on top and double-count it.'
      );
    }

    const key = territoryKey(values);
    if (seenInFile.has(key)) messages.push('This territory appears twice in the file.');
    seenInFile.add(key);

    const current = byKey.get(key) || null;
    let action = 'create';
    if (current) {
      const same =
        Number(current.delivery_per_kwh_cents ?? 0) === Number(values.delivery_per_kwh_cents ?? 0) &&
        Number(current.fixed_monthly_delivery_charge ?? 0) === Number(values.fixed_monthly_delivery_charge ?? 0) &&
        current.billing_model === values.billing_model;
      // A changed tariff opens a new effective-dated row and closes the old
      // one, so last month's quote can still be explained.
      action = same ? 'unchanged' : 'supersede';
    }

    return {
      line,
      values,
      current,
      action: messages.length ? 'invalid' : action,
      errors: messages,
      warnings,
      valid: valid && messages.length === 0,
    };
  });

  return {
    error: null,
    unknownHeaders,
    rows: results,
    summary: {
      total: results.length,
      create: results.filter((r) => r.action === 'create').length,
      supersede: results.filter((r) => r.action === 'supersede').length,
      unchanged: results.filter((r) => r.action === 'unchanged').length,
      invalid: results.filter((r) => r.action === 'invalid').length,
    },
  };
}

/* ------------------------------------------------------------------ *
 * Plan rates
 * ------------------------------------------------------------------ */

export const PLAN_COLUMNS = {
  provider_name: ['provider', 'supplier', 'supplier_name', 'rep'],
  plan_name: ['plan', 'product', 'offer', 'product_name'],
  state: ['st'],
  customer_type: ['segment', 'market', 'audience'],
  rate_per_kwh: ['rate', 'energy_rate', 'price', 'cents_per_kwh', 'rate_cents'],
  contract_length: ['term', 'term_months', 'months', 'length'],
  plan_type: ['type', 'rate_type'],
  renewable_percentage: ['renewable', 'green', 'green_percent'],
  monthly_base_charge: ['base_charge', 'monthly_fee', 'base_fee'],
  early_termination_fee: ['etf', 'cancellation_fee', 'termination_fee'],
  usage_credit: ['credit', 'bill_credit'],
  usage_credit_threshold: ['credit_threshold', 'credit_at'],
  tdsp_charges: ['tdsp', 'delivery_override'],
  plan_details_url: ['details_url', 'plan_url'],
  facts_label_url: ['efl', 'facts_label', 'efl_url'],
  is_active: ['active', 'live', 'published'],
};

const planKey = (row) =>
  [row.provider_name, row.plan_name, row.state, row.customer_type]
    .map((v) => String(v ?? '').trim().toLowerCase()).join('|');

/**
 * @param {string} text         pasted CSV/TSV
 * @param {object[]} providers  electricity_providers, to resolve names
 * @param {object[]} existing   current electricity_plans rows
 */
export function importPlans(text, providers = [], existing = []) {
  const { rows, unknownHeaders, error } = parseDelimited(text, PLAN_COLUMNS);
  if (error) return { error, rows: [], unknownHeaders, summary: null };

  const byKey = new Map();
  for (const row of existing) byKey.set(planKey(row), row);

  const seenInFile = new Set();
  const results = rows.map(({ line, record }) => {
    const { valid, values, errors } = validatePlan(record, providers);
    const messages = Object.values(errors);
    const warnings = [];

    const unit = centsSanity(record.rate_per_kwh, { field: 'Rate', ...RANGES.supplyRate });
    if (unit) messages.push(unit);

    // A per-plan delivery override is for the rare plan that bundles delivery
    // differently. Entering one on every row re-creates the problem tariffs
    // exist to solve.
    if (String(record.tdsp_charges ?? '').trim()) {
      warnings.push('Delivery override set — the territory tariff will be ignored for this plan.');
    }

    const key = planKey(values.provider_name ? values : record);
    if (seenInFile.has(key)) messages.push('This plan appears twice in the file.');
    seenInFile.add(key);

    const current = byKey.get(key) || null;
    let action = current ? 'update' : 'create';
    if (current && Number(current.rate_per_kwh) === Number(values.rate_per_kwh)
        && Number(current.contract_length ?? 0) === Number(values.contract_length ?? 0)) {
      action = 'unchanged';
    }

    return {
      line,
      values,
      current,
      action: messages.length ? 'invalid' : action,
      errors: messages,
      warnings,
      valid: valid && messages.length === 0,
      // What the customer's rate moves from and to, which is the number an
      // operator actually wants to eyeball before committing.
      rateChange: current && values.rate_per_kwh !== undefined
        ? { from: Number(current.rate_per_kwh), to: Number(values.rate_per_kwh) }
        : null,
    };
  });

  return {
    error: null,
    unknownHeaders,
    rows: results,
    summary: {
      total: results.length,
      create: results.filter((r) => r.action === 'create').length,
      update: results.filter((r) => r.action === 'update').length,
      unchanged: results.filter((r) => r.action === 'unchanged').length,
      invalid: results.filter((r) => r.action === 'invalid').length,
    },
  };
}

/**
 * The day before `date`, for closing a superseded tariff.
 *
 * A tariff runs to the day before its replacement starts. Closing it on the
 * same day leaves a date on which two tariffs are in force and the engine picks
 * whichever the query returned first.
 */
export function dayBefore(date) {
  const parsed = new Date(`${String(date).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setUTCDate(parsed.getUTCDate() - 1);
  return parsed.toISOString().slice(0, 10);
}
