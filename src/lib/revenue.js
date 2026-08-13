/**
 * What the platform earns, and what it merely hopes to earn.
 *
 * Every figure the admin earnings screen shows is produced here, from ledger
 * rows, so the browser and the server cannot disagree about the same money.
 *
 * The distinction this module exists to protect:
 *
 *   ACCRUED (pending)   we did something a partner agreed to pay for. Real
 *                       activity. Not money, and not revenue.
 *   EARNED (confirmed)  the partner has agreed the amount is owed.
 *   RECEIVED (paid)     it has actually arrived.
 *   REVERSED            clawed back, or the buyer rejected the lead.
 *
 * `pending` is never added to `confirmed` anywhere in this file. A platform
 * that reports accruals as revenue is overstating its earnings, and the number
 * it overstates is the one an acquirer checks first.
 */

export const REVENUE_SOURCES = {
  AFFILIATE_CLICK: 'affiliate_click',
  AFFILIATE_CONVERSION: 'affiliate_conversion',
  LEAD_SALE: 'lead_sale',
  CONCIERGE: 'concierge',
};

export const REVENUE_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PAID: 'paid',
  REVERSED: 'reversed',
};

export const COMMISSION_MODELS = {
  NONE: 'none',
  PER_CLICK: 'per_click',
  PER_SIGNUP: 'per_signup',
  REVENUE_SHARE: 'revenue_share',
};

export const SOURCE_LABELS = {
  [REVENUE_SOURCES.AFFILIATE_CLICK]: 'Affiliate click',
  [REVENUE_SOURCES.AFFILIATE_CONVERSION]: 'Affiliate conversion',
  [REVENUE_SOURCES.LEAD_SALE]: 'Lead sale',
  [REVENUE_SOURCES.CONCIERGE]: 'Concierge',
};

export const STATUS_LABELS = {
  [REVENUE_STATUS.PENDING]: 'Accrued',
  [REVENUE_STATUS.CONFIRMED]: 'Confirmed',
  [REVENUE_STATUS.PAID]: 'Paid',
  [REVENUE_STATUS.REVERSED]: 'Reversed',
};

export const COMMISSION_MODEL_LABELS = {
  [COMMISSION_MODELS.NONE]: 'Earns nothing',
  [COMMISSION_MODELS.PER_CLICK]: 'Per click',
  [COMMISSION_MODELS.PER_SIGNUP]: 'Per signup',
  [COMMISSION_MODELS.REVENUE_SHARE]: 'Revenue share',
};

/**
 * A finite amount rounded to cents. Never NaN into a total.
 *
 * Rounded through exponential notation rather than `Math.round(n * 100) / 100`,
 * which loses a cent on exact halves: 1.005 * 100 is 100.49999999999999 in
 * binary floating point, so the naive form rounds it *down* to 1.00. One cent
 * is immaterial once; across a ledger that is reconciled against a partner's
 * statement, a rounding rule that drifts one direction is exactly the kind of
 * discrepancy that costs an afternoon to find.
 */
export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const rounded = Number(`${Math.round(Number(`${n}e2`))}e-2`);
  return Number.isFinite(rounded) ? rounded : 0;
}

/**
 * What an outbound click accrues, if anything.
 *
 * Deliberately narrow. A click only accrues when all three hold:
 *
 *   - the link is configured `per_click` with a positive amount, and
 *   - the destination actually carries affiliate-network tracking, and
 *   - the click was recorded.
 *
 * `per_signup` and `revenue_share` accrue NOTHING here, because a click is not
 * a signup and we do not know the customer's spend. Guessing at those is how a
 * dashboard ends up reporting revenue that no partner has ever agreed to pay.
 * They are recorded when the network confirms the conversion instead.
 *
 * @param {object} link          the affiliate_links row
 * @param {boolean} commissionCapable  did the resolved destination carry tracking
 * @returns {{accrues: boolean, amount: number, reason: string}}
 */
export function clickAccrual(link, commissionCapable) {
  if (!link) return { accrues: false, amount: 0, reason: 'no_link' };

  const model = link.commission_model || COMMISSION_MODELS.NONE;

  if (model === COMMISSION_MODELS.NONE) {
    return { accrues: false, amount: 0, reason: 'no_commission_configured' };
  }

  if (model !== COMMISSION_MODELS.PER_CLICK) {
    // Real agreement, but a click is not the billable event.
    return { accrues: false, amount: 0, reason: 'awaits_partner_confirmation' };
  }

  if (!commissionCapable) {
    // Configured to pay per click, but the destination carries no tracking, so
    // the network will never see this click. Accruing it would invent revenue.
    return { accrues: false, amount: 0, reason: 'destination_not_tracked' };
  }

  const amount = money(link.commission_amount);
  if (amount <= 0) {
    return { accrues: false, amount: 0, reason: 'no_rate_configured' };
  }

  return { accrues: true, amount, reason: 'per_click' };
}

/**
 * What a delivered lead accrues.
 *
 * The price agreed AT DELIVERY, not the buyer's current price — a buyer who
 * renegotiates next quarter must not retroactively change what last quarter's
 * leads were sold for.
 */
export function deliveryAccrual(delivery) {
  const amount = money(delivery?.price_at_delivery);
  if (amount <= 0) return { accrues: false, amount: 0, reason: 'no_price_agreed' };
  return { accrues: true, amount, reason: 'lead_sale' };
}

/**
 * The ledger status a buyer's response implies.
 *
 * A rejected lead is reversed, not deleted: the fact that a buyer took it and
 * sent it back is exactly what an admin needs to see when deciding whether to
 * keep routing to them.
 */
export function statusForDeliveryStatus(deliveryStatus) {
  if (deliveryStatus === 'accepted') return REVENUE_STATUS.CONFIRMED;
  if (deliveryStatus === 'rejected' || deliveryStatus === 'failed') return REVENUE_STATUS.REVERSED;
  return REVENUE_STATUS.PENDING;
}

/** Is this row money we actually have or are owed? */
export function isRealized(status) {
  return status === REVENUE_STATUS.CONFIRMED || status === REVENUE_STATUS.PAID;
}

/**
 * Roll a set of ledger rows up into the figures the earnings screen reports.
 *
 * Four totals, kept apart on purpose:
 *
 *   received   status = paid. Money in the bank.
 *   confirmed  status = confirmed. Owed, not yet arrived.
 *   earned     received + confirmed. The honest "total platform earnings".
 *   accrued    status = pending. Activity that has not been agreed yet.
 *
 * `earned` deliberately excludes `accrued`. That is the whole point.
 */
export function summarizeRevenue(events, { now = new Date() } = {}) {
  const rows = Array.isArray(events) ? events : [];

  const totals = {
    received: 0,
    confirmed: 0,
    accrued: 0,
    reversed: 0,
    count: rows.length,
  };

  const bySource = {};
  const byPartner = new Map();

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  let earnedThisMonth = 0;
  let accruedThisMonth = 0;

  for (const row of rows) {
    const amount = money(row?.amount);
    const status = row?.status || REVENUE_STATUS.PENDING;
    const source = row?.source || 'unknown';

    if (status === REVENUE_STATUS.PAID) totals.received += amount;
    else if (status === REVENUE_STATUS.CONFIRMED) totals.confirmed += amount;
    else if (status === REVENUE_STATUS.PENDING) totals.accrued += amount;
    else if (status === REVENUE_STATUS.REVERSED) totals.reversed += amount;

    const bucket = (bySource[source] ||= {
      source,
      received: 0,
      confirmed: 0,
      accrued: 0,
      reversed: 0,
      count: 0,
    });
    bucket.count += 1;
    if (status === REVENUE_STATUS.PAID) bucket.received += amount;
    else if (status === REVENUE_STATUS.CONFIRMED) bucket.confirmed += amount;
    else if (status === REVENUE_STATUS.PENDING) bucket.accrued += amount;
    else if (status === REVENUE_STATUS.REVERSED) bucket.reversed += amount;

    const partner = row?.partner_name || 'Unattributed';
    const partnerRow = byPartner.get(partner) || {
      partner,
      earned: 0,
      accrued: 0,
      count: 0,
    };
    partnerRow.count += 1;
    if (isRealized(status)) partnerRow.earned += amount;
    else if (status === REVENUE_STATUS.PENDING) partnerRow.accrued += amount;
    byPartner.set(partner, partnerRow);

    const occurred = row?.occurred_at ? new Date(row.occurred_at) : null;
    if (occurred && !Number.isNaN(occurred.getTime()) && occurred >= monthStart) {
      if (isRealized(status)) earnedThisMonth += amount;
      else if (status === REVENUE_STATUS.PENDING) accruedThisMonth += amount;
    }
  }

  const earned = totals.received + totals.confirmed;

  return {
    received: money(totals.received),
    confirmed: money(totals.confirmed),
    // Total platform earnings: what a partner has agreed to pay, plus what has
    // already been received. Nothing speculative is inside this number.
    earned: money(earned),
    accrued: money(totals.accrued),
    reversed: money(totals.reversed),
    earnedThisMonth: money(earnedThisMonth),
    accruedThisMonth: money(accruedThisMonth),
    events: totals.count,
    bySource: Object.values(bySource)
      .map((b) => ({
        ...b,
        received: money(b.received),
        confirmed: money(b.confirmed),
        accrued: money(b.accrued),
        reversed: money(b.reversed),
        earned: money(b.received + b.confirmed),
      }))
      .sort((a, b) => b.earned - a.earned || b.accrued - a.accrued),
    byPartner: [...byPartner.values()]
      .map((p) => ({ ...p, earned: money(p.earned), accrued: money(p.accrued) }))
      .sort((a, b) => b.earned - a.earned || b.accrued - a.accrued)
      .slice(0, 10),
  };
}

/**
 * How lead delivery is going, from delivery rows.
 *
 * Acceptance rate is computed over leads a buyer has actually ruled on.
 * Counting still-pending deliveries as rejections would make a healthy buyer
 * look like a bad one on their first day.
 */
export function summarizeDeliveries(deliveries) {
  const rows = Array.isArray(deliveries) ? deliveries : [];

  const counts = { pending: 0, delivered: 0, accepted: 0, rejected: 0, failed: 0 };
  for (const row of rows) {
    const status = row?.status;
    if (status in counts) counts[status] += 1;
  }

  const ruled = counts.accepted + counts.rejected;

  return {
    total: rows.length,
    ...counts,
    // Awaiting a buyer decision: sent, not yet ruled on.
    awaitingDecision: counts.delivered,
    acceptanceRate: ruled ? Math.round((counts.accepted / ruled) * 100) : null,
    // Sold value uses the agreed price on accepted deliveries only.
    acceptedValue: money(
      rows
        .filter((r) => r?.status === 'accepted')
        .reduce((sum, r) => sum + money(r.price_at_delivery), 0)
    ),
  };
}

/**
 * Where a lead currently stands in the money pipeline.
 *
 * Used by the admin lead list so an operator can see, per row, whether a lead
 * went anywhere — rather than having to open each one.
 */
export function leadMonetizationState(lead, deliveries = []) {
  const mine = deliveries.filter((d) => d?.lead_id === lead?.id);

  if (mine.length === 0) {
    return { state: 'unrouted', label: 'Not routed', deliveries: [], value: 0 };
  }

  const accepted = mine.filter((d) => d.status === 'accepted');
  if (accepted.length) {
    return {
      state: 'sold',
      label: 'Sold',
      deliveries: mine,
      value: money(accepted.reduce((sum, d) => sum + money(d.price_at_delivery), 0)),
    };
  }

  if (mine.some((d) => d.status === 'delivered')) {
    return { state: 'delivered', label: 'Awaiting buyer', deliveries: mine, value: 0 };
  }
  if (mine.some((d) => d.status === 'pending')) {
    return { state: 'pending', label: 'Queued', deliveries: mine, value: 0 };
  }
  if (mine.every((d) => d.status === 'rejected')) {
    return { state: 'rejected', label: 'Rejected', deliveries: mine, value: 0 };
  }
  return { state: 'failed', label: 'Delivery failed', deliveries: mine, value: 0 };
}
