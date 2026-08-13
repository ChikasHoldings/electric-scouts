/**
 * Utility delivery, resolved to a service territory.
 *
 * WHAT THIS FIXES
 *
 * Delivery used to be `plan.tdsp_charges` — a per-kWh number on the retail plan.
 * The catalog spans twelve states, and that model is wrong in all of them:
 *
 *   · Delivery belongs to the wires company, not the retail plan. One Texas
 *     plan is sold across five TDUs at five different delivery rates, chosen by
 *     the customer's address. There is no single correct value to put on the
 *     plan row.
 *
 *   · Every real tariff has a FIXED monthly customer charge as well as a
 *     per-kWh charge. A per-kWh-only model understates every bill by the fixed
 *     charge, every month.
 *
 * TWO MARKET STRUCTURES, ONE MODEL
 *
 * The catalog contains both kinds of retail-choice market, and they are not the
 * same product:
 *
 *   all_in (Texas / ERCOT) — the retail supplier bills the entire bill and
 *     passes the TDU's delivery charges through on it. The customer receives
 *     one bill, from the supplier.
 *
 *   supply_only (CT, IL, MA, MD, ME, NH, NJ, NY, OH, PA, RI) — competitive
 *     choice covers SUPPLY only. The incumbent utility keeps billing delivery
 *     and that charge does not change when the customer switches supplier.
 *
 * Both need the same two numbers to state a full monthly bill, which is why one
 * model serves both. What differs is the DISCLOSURE: in a supply_only market
 * the delivery portion is not something the supplier charges, so it is
 * described as the utility's, not the plan's.
 *
 * A NOTE ON WHAT THIS DELIBERATELY DOES NOT DO
 *
 * In a supply_only market a supply-to-supply comparison is valid on its own
 * terms — delivery is identical whoever supplies you, so it cancels. That would
 * let those markets produce a defensible saving without any delivery data at
 * all. It needs the customer's CURRENT supply rate, which only the bill
 * analyzer can provide, so it is not built here. Until it is, savings in every
 * market requires a full bill on both sides.
 */

/** How retail choice works in a market. */
export const BILLING_MODEL = {
  ALL_IN: 'all_in',
  SUPPLY_ONLY: 'supply_only',
};

/**
 * Named pricing components, for structured diagnostics.
 *
 * These strings are a contract: admin badges, tests and monitoring all key off
 * them, so they are stable identifiers rather than display copy.
 */
export const PRICING_COMPONENTS = {
  SUPPLY_RATE: 'supply_rate',
  UTILITY_TERRITORY: 'utility_territory',
  UTILITY_DELIVERY_RATE: 'utility_delivery_rate',
  UTILITY_FIXED_CHARGE: 'utility_fixed_charge',
};

/** Display copy for each component. One wording, every surface. */
export const COMPONENT_LABELS = {
  [PRICING_COMPONENTS.SUPPLY_RATE]: 'Supply rate',
  [PRICING_COMPONENTS.UTILITY_TERRITORY]: 'Utility service territory',
  [PRICING_COMPONENTS.UTILITY_DELIVERY_RATE]: 'Utility delivery charge',
  [PRICING_COMPONENTS.UTILITY_FIXED_CHARGE]: 'Utility fixed monthly charge',
};

/** How a territory was arrived at. */
export const TERRITORY_RESOLUTION = {
  /** The plan is pinned to one territory. */
  PLAN_PINNED: 'plan_pinned',
  /** The customer's ZIP prefix matched exactly one territory. */
  ZIP_PREFIX: 'zip_prefix',
  /** The state has exactly one active territory, so there is no ambiguity. */
  STATE_UNIQUE: 'state_unique',
  /** No territory could be determined — several candidates, or none. */
  UNRESOLVED: 'unresolved',
};

function num(value) {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : null;
}

/**
 * A charge that is genuinely known.
 *
 * Zero counts. A territory verified to have no fixed customer charge is priced
 * data, not missing data — which is exactly the distinction the legacy
 * `tdsp_charges` column could not make, because its DEFAULT 0 made "unset" and
 * "free" the same value.
 */
function knownCharge(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = num(value);
  return n !== null && n >= 0 ? n : null;
}

function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Is this tariff window open on `asOf`? */
export function isEffectiveOn(territory, asOf = new Date()) {
  const when = toDate(asOf) || new Date();
  const from = toDate(territory?.effective_from);
  const to = toDate(territory?.effective_to);

  // A row with no start date is treated as always-started rather than never:
  // effective_from is NOT NULL in the schema, so this only guards hand-built
  // fixtures.
  if (from && when < from) return false;
  // `effective_to` is the last day the tariff applies, inclusive.
  if (to && when > to) return false;
  return true;
}

/**
 * Does this territory carry a usable tariff?
 *
 * Both components must be known. A territory with a per-kWh rate but no fixed
 * charge is half a tariff, and using it would understate every bill by the
 * customer charge — which is the bug this whole module exists to remove.
 */
export function hasCompleteTariff(territory) {
  if (!territory) return false;
  return (
    knownCharge(territory.delivery_per_kwh_cents) !== null &&
    knownCharge(territory.fixed_monthly_delivery_charge) !== null
  );
}

function zipPrefixOf(zip) {
  const digits = String(zip ?? '').replace(/\D/g, '');
  return digits.length >= 3 ? digits.slice(0, 3) : null;
}

/**
 * Pick the tariff window in force on `asOf`.
 *
 * Never combines two windows. If overlapping windows exist — a data error the
 * unique index cannot catch, since it only constrains the start date — the one
 * that started most recently wins, which is the one an admin most recently
 * filed.
 */
function currentWindow(candidates, asOf) {
  const open = candidates.filter((t) => isEffectiveOn(t, asOf));
  if (open.length <= 1) return open[0] || null;

  return open.reduce((best, t) => {
    const a = toDate(t.effective_from)?.getTime() ?? 0;
    const b = toDate(best.effective_from)?.getTime() ?? 0;
    return a > b ? t : best;
  }, open[0]);
}

/**
 * Resolve the utility territory that applies to a customer.
 *
 * Resolution order, most specific first:
 *
 *   1. The plan's own pin, for inventory sold inside one utility footprint.
 *   2. The customer's ZIP prefix, where an admin has mapped it.
 *   3. The state, but ONLY when it holds exactly one active territory.
 *
 * Otherwise: unresolved. That is the important case and it is deliberate. A ZIP
 * can span two utilities, and Texas has five TDUs whose delivery rates differ
 * materially — picking one on a coin flip would invent the customer's delivery
 * cost. Unresolved keeps the plan honestly partial.
 *
 * @param {object} params
 * @param {object} [params.plan]        the plan being priced
 * @param {string} [params.state]       two-letter market code
 * @param {string} [params.zip]         the customer's service ZIP
 * @param {object[]} params.territories candidate rows, any state
 * @param {Date|string} [params.asOf]   comparison date; defaults to now
 * @returns {{territory: object|null, resolution: string, candidates: number}}
 */
export function resolveTerritory({ plan, state, zip, territories = [], asOf } = {}) {
  const rows = Array.isArray(territories) ? territories.filter((t) => t?.is_active !== false) : [];

  // 1 ── An explicit pin on the plan wins outright.
  if (plan?.utility_territory_id) {
    const pinned = rows.filter((t) => t.id === plan.utility_territory_id);
    const chosen = currentWindow(pinned, asOf);
    if (chosen) {
      return { territory: chosen, resolution: TERRITORY_RESOLUTION.PLAN_PINNED, candidates: 1 };
    }
  }

  const inState = state ? rows.filter((t) => t.state === state) : rows;

  // Distinct utilities in this market, ignoring tariff windows — two windows for
  // one utility are one candidate, not two.
  const identities = new Map();
  for (const t of inState) {
    const key = String(t.short_code || t.name || t.id).toLowerCase();
    if (!identities.has(key)) identities.set(key, []);
    identities.get(key).push(t);
  }

  // 2 ── ZIP prefix, when an admin has mapped one.
  const prefix = zipPrefixOf(zip);
  if (prefix) {
    const matched = [...identities.values()].filter((windows) =>
      windows.some((t) => Array.isArray(t.service_zip_prefixes) && t.service_zip_prefixes.includes(prefix))
    );
    // Exactly one utility claims this ZIP. More than one means the ZIP spans a
    // boundary, which is precisely when we must not guess.
    if (matched.length === 1) {
      const chosen = currentWindow(matched[0], asOf);
      if (chosen) {
        return { territory: chosen, resolution: TERRITORY_RESOLUTION.ZIP_PREFIX, candidates: 1 };
      }
    }
    if (matched.length > 1) {
      return {
        territory: null,
        resolution: TERRITORY_RESOLUTION.UNRESOLVED,
        candidates: matched.length,
      };
    }
  }

  // 3 ── A state with a single utility is unambiguous without an address.
  if (identities.size === 1) {
    const chosen = currentWindow([...identities.values()][0], asOf);
    if (chosen) {
      return { territory: chosen, resolution: TERRITORY_RESOLUTION.STATE_UNIQUE, candidates: 1 };
    }
  }

  return {
    territory: null,
    resolution: TERRITORY_RESOLUTION.UNRESOLVED,
    candidates: identities.size,
  };
}

/**
 * The delivery portion of a monthly bill.
 *
 * Returns both components separately — they are different kinds of charge and
 * the customer is entitled to see which is which — plus the components we could
 * not supply.
 *
 * The arithmetic this pins down (units matter, and nothing here infers them):
 *
 *   variable = usage kWh × (delivery_per_kwh_cents ÷ 100)
 *   fixed    = fixed_monthly_delivery_charge, in dollars, unscaled
 *
 * At 1,000 kWh with 4.5¢/kWh and a $4.39 customer charge that is $49.39, not
 * $45.00.
 *
 * @returns {{variable: number|null, fixed: number|null, total: number|null,
 *            missing: string[], territory: object|null}}
 */
export function deliveryFor(territory, usageKwh) {
  const usage = num(usageKwh);
  const missing = [];

  if (!territory) {
    return {
      variable: null,
      fixed: null,
      total: null,
      missing: [
        PRICING_COMPONENTS.UTILITY_TERRITORY,
        PRICING_COMPONENTS.UTILITY_DELIVERY_RATE,
        PRICING_COMPONENTS.UTILITY_FIXED_CHARGE,
      ],
      territory: null,
    };
  }

  const perKwh = knownCharge(territory.delivery_per_kwh_cents);
  const fixed = knownCharge(territory.fixed_monthly_delivery_charge);

  if (perKwh === null) missing.push(PRICING_COMPONENTS.UTILITY_DELIVERY_RATE);
  if (fixed === null) missing.push(PRICING_COMPONENTS.UTILITY_FIXED_CHARGE);

  const variable = perKwh !== null && usage !== null && usage > 0 ? (perKwh / 100) * usage : null;

  return {
    variable,
    fixed,
    total: missing.length === 0 && variable !== null ? variable + fixed : null,
    missing,
    territory,
  };
}

/**
 * The legacy per-plan override, expressed as a pseudo-territory.
 *
 * `electricity_plans.tdsp_charges` defaults to 0, so a zero there means UNSET,
 * not free delivery — the distinction the column cannot make and the reason no
 * active plan currently prices as complete. Only a positive value is a real
 * override.
 *
 * Even then it is only half a tariff: the column has no fixed-charge
 * counterpart, so a plan carrying one still reports the fixed charge as
 * missing rather than quietly billing it at zero.
 */
export function legacyPlanOverride(plan) {
  const legacy = num(plan?.tdsp_charges);
  if (legacy === null || legacy <= 0) return null;

  return {
    id: null,
    name: 'Plan-level delivery override (legacy)',
    short_code: 'LEGACY',
    state: plan?.state || null,
    billing_model: BILLING_MODEL.ALL_IN,
    delivery_per_kwh_cents: legacy,
    // Deliberately unknown, not zero.
    fixed_monthly_delivery_charge: null,
    effective_from: null,
    effective_to: null,
    is_active: true,
    isLegacyOverride: true,
  };
}
