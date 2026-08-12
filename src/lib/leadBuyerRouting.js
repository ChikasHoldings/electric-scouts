/**
 * Matching a qualified lead to a buyer.
 *
 * The monetization router decides a lead's ROUTE (residential_partner,
 * commercial_partner, renewable_partner, concierge). This decides WHO on that
 * route actually receives it — the step that did not exist, which is why a
 * routed lead was a correctly-classified dead end.
 *
 * Adding an active row to `lead_buyers` is the entire configuration step. This
 * module reads whatever is there, so a signed agreement starts receiving leads
 * without a deploy.
 *
 * Pure functions over rows already fetched: the same logic backs delivery and
 * the tests.
 */

/** Why a buyer was not eligible for a lead. Useful in admin diagnostics. */
export const REJECTION = {
  INACTIVE: 'buyer_inactive',
  WRONG_CUSTOMER_TYPE: 'customer_type_not_accepted',
  WRONG_STATE: 'state_not_covered',
  NO_RENEWABLE: 'does_not_accept_renewable',
  NEEDS_PHONE: 'lead_has_no_phone',
  BELOW_MIN_SCORE: 'lead_below_minimum_score',
  AT_CAPACITY: 'buyer_at_monthly_cap',
  ALREADY_DELIVERED: 'already_delivered_to_this_buyer',
};

export const REJECTION_LABELS = {
  [REJECTION.INACTIVE]: 'Buyer is inactive',
  [REJECTION.WRONG_CUSTOMER_TYPE]: 'Does not buy this customer type',
  [REJECTION.WRONG_STATE]: 'Does not cover this state',
  [REJECTION.NO_RENEWABLE]: 'Does not accept renewable leads',
  [REJECTION.NEEDS_PHONE]: 'Requires a phone number',
  [REJECTION.BELOW_MIN_SCORE]: 'Lead is below their minimum score',
  [REJECTION.AT_CAPACITY]: 'Monthly cap reached',
  [REJECTION.ALREADY_DELIVERED]: 'Already sent to this buyer',
};

/**
 * An empty or absent list means "no restriction".
 *
 * A buyer covering every market should not need twelve rows enumerated, and an
 * admin who leaves the field blank means "all", not "none" — treating blank as
 * "none" would silently stop a new buyer receiving anything.
 */
function accepts(list, value) {
  if (!Array.isArray(list) || list.length === 0) return true;
  if (!value) return false;
  return list.map((v) => String(v).toLowerCase()).includes(String(value).toLowerCase());
}

/**
 * Has this buyer's monthly cap been reached?
 *
 * The stored counter is only meaningful for the period it was counted in. A
 * cap counted against a previous month must not block delivery today, which is
 * the failure mode of a counter with no period attached.
 */
export function atCapacity(buyer, now = new Date()) {
  const cap = Number(buyer?.monthly_cap);
  if (!Number.isFinite(cap) || cap <= 0) return false; // no cap configured

  const started = buyer?.period_started_at ? new Date(buyer.period_started_at) : null;
  const sameMonth =
    started &&
    started.getUTCFullYear() === now.getUTCFullYear() &&
    started.getUTCMonth() === now.getUTCMonth();

  if (!sameMonth) return false; // counter belongs to a previous period

  return Number(buyer?.delivered_this_period || 0) >= cap;
}

/**
 * Can this buyer take this lead?
 *
 * @returns {{eligible: boolean, reason: string|null}}
 */
export function checkBuyer(buyer, lead, { now = new Date(), alreadyDeliveredTo = [] } = {}) {
  if (buyer?.is_active !== true) return { eligible: false, reason: REJECTION.INACTIVE };

  if (alreadyDeliveredTo.includes(buyer.id)) {
    return { eligible: false, reason: REJECTION.ALREADY_DELIVERED };
  }

  if (!accepts(buyer.customer_types, lead?.customerType)) {
    return { eligible: false, reason: REJECTION.WRONG_CUSTOMER_TYPE };
  }

  if (!accepts(buyer.states, lead?.state)) {
    return { eligible: false, reason: REJECTION.WRONG_STATE };
  }

  if (lead?.energyPreference === 'renewable' && buyer.accepts_renewable === false) {
    return { eligible: false, reason: REJECTION.NO_RENEWABLE };
  }

  if (buyer.requires_phone === true && !lead?.phone) {
    return { eligible: false, reason: REJECTION.NEEDS_PHONE };
  }

  const minScore = Number(buyer.min_lead_score);
  if (Number.isFinite(minScore) && Number(lead?.leadScore || 0) < minScore) {
    return { eligible: false, reason: REJECTION.BELOW_MIN_SCORE };
  }

  if (atCapacity(buyer, now)) return { eligible: false, reason: REJECTION.AT_CAPACITY };

  return { eligible: true, reason: null };
}

/**
 * Rank eligible buyers.
 *
 * Priority first, then price, then name for a stable order.
 *
 * Priority ahead of price is deliberate and load-bearing: routing a customer
 * to whoever pays most, rather than to whoever can actually serve them, is how
 * a comparison service stops deserving its traffic. Price only separates
 * buyers an admin has already judged equivalent.
 */
export function rankBuyers(buyers) {
  return [...buyers].sort((a, b) => {
    const priority = Number(b.priority || 0) - Number(a.priority || 0);
    if (priority !== 0) return priority;

    const price = Number(b.price_per_lead || 0) - Number(a.price_per_lead || 0);
    if (price !== 0) return price;

    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

/**
 * Pick the buyer for a lead.
 *
 * Returns the chosen buyer plus every rejection, so an admin looking at a lead
 * that went nowhere can see exactly which buyers were considered and why each
 * declined it — rather than an empty result with no explanation.
 *
 * @returns {{buyer: object|null, rejected: {buyerId: string, name: string, reason: string}[]}}
 */
export function selectBuyer(buyers, lead, options = {}) {
  const eligible = [];
  const rejected = [];

  for (const buyer of Array.isArray(buyers) ? buyers : []) {
    const { eligible: ok, reason } = checkBuyer(buyer, lead, options);
    if (ok) eligible.push(buyer);
    else rejected.push({ buyerId: buyer?.id || null, name: buyer?.name || 'Unknown', reason });
  }

  return { buyer: rankBuyers(eligible)[0] || null, rejected };
}

/**
 * Is this lead monetizable at all right now?
 *
 * Reported separately from "was it delivered" so an admin can tell a lead
 * nobody is configured to buy from a lead a buyer declined — those are
 * different problems with different fixes.
 */
export function summarizeCoverage(buyers, lead, options = {}) {
  const { buyer, rejected } = selectBuyer(buyers, lead, options);

  return {
    matched: Boolean(buyer),
    buyerId: buyer?.id || null,
    buyerName: buyer?.name || null,
    priceAtDelivery: buyer?.price_per_lead ?? null,
    consideredCount: rejected.length + (buyer ? 1 : 0),
    rejected,
    // No buyers configured at all is a setup gap, not a matching failure.
    noBuyersConfigured: (Array.isArray(buyers) ? buyers : []).length === 0,
  };
}
