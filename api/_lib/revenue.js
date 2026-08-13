import {
  REVENUE_SOURCES,
  REVENUE_STATUS,
  clickAccrual,
  deliveryAccrual,
  money,
} from "../../src/lib/revenue.js";

/**
 * Writing to the revenue ledger.
 *
 * Two rules govern everything here.
 *
 *   NEVER DOUBLE-COUNT. Every write carries a `dedupe_key` derived from the
 *   thing that earned — the click id, the delivery id, the concierge request
 *   id. The unique index makes a retry a no-op rather than a second dollar. A
 *   redelivered webhook, a re-run routing pass or a user hammering refresh
 *   cannot inflate earnings.
 *
 *   NEVER INVENT. An accrual is only written when an admin has configured what
 *   the partner pays. No configuration means no ledger row — the earnings
 *   screen then honestly shows zero rather than a modelled number, which is
 *   what the 36 untracked provider links should produce today.
 *
 * Ledger writes are non-fatal by design: a click must still redirect and a
 * lead must still be delivered even if the accounting insert fails. A missing
 * ledger row understates earnings, which is recoverable; a failed redirect
 * loses the customer, which is not.
 */

/**
 * Insert a ledger row, treating a duplicate as success.
 *
 * @returns {Promise<{ok: boolean, duplicate?: boolean, id?: string, error?: string}>}
 */
export async function recordRevenueEvent(supabase, event) {
  const row = {
    ...event,
    amount: money(event.amount),
    // A row nobody can attribute is a row nobody can audit.
    partner_name: event.partner_name || null,
  };

  const { data, error } = await supabase
    .from("revenue_events")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    // 23505: this exact earning event is already on the ledger. That is the
    // dedupe key doing its job, so it is success, not failure.
    if (error.code === "23505") return { ok: true, duplicate: true };
    // 42P01 / PGRST205: the table does not exist yet because the migration has
    // not run. The click still redirected and the lead still delivered; only
    // the accounting line is missing, and it can be rebuilt from source rows.
    console.warn("revenue ledger write skipped:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data?.id };
}

/**
 * Accrue for an outbound affiliate click.
 *
 * Called after the click row is written, with the link configuration that
 * /api/go already loaded. Silent when the link earns nothing, which is the
 * common case and the correct one.
 */
export async function recordClickRevenue(supabase, {
  click,
  link,
  commissionCapable,
  providerName,
}) {
  const accrual = clickAccrual(link, commissionCapable);
  if (!accrual.accrues) return { ok: true, skipped: accrual.reason };

  // No click id means no idempotency key, and an accrual we could write twice
  // is worse than one we never write.
  if (!click?.id) return { ok: false, error: "no_click_id" };

  return recordRevenueEvent(supabase, {
    source: REVENUE_SOURCES.AFFILIATE_CLICK,
    status: REVENUE_STATUS.PENDING,
    amount: accrual.amount,
    occurred_at: click.clicked_at || new Date().toISOString(),
    provider_id: link.provider_id || null,
    affiliate_link_id: link.id || null,
    click_id: click.id,
    partner_name: providerName || link.label || null,
    description: `Per-click commission — /go/${link.slug}`,
    dedupe_key: `click:${click.id}`,
  });
}

/**
 * Accrue for a lead sold to a buyer.
 *
 * Written as `pending`: the buyer has received the lead but has not yet said
 * whether they will pay for it. It becomes `confirmed` when an admin records
 * their acceptance, and `reversed` if they reject it.
 */
export async function recordLeadSale(supabase, { delivery, buyer, lead }) {
  const accrual = deliveryAccrual(delivery);
  if (!accrual.accrues) return { ok: true, skipped: accrual.reason };
  if (!delivery?.id) return { ok: false, error: "no_delivery_id" };

  return recordRevenueEvent(supabase, {
    source: REVENUE_SOURCES.LEAD_SALE,
    status: REVENUE_STATUS.PENDING,
    amount: accrual.amount,
    occurred_at: delivery.delivered_at || new Date().toISOString(),
    lead_id: lead?.id || delivery.lead_id || null,
    buyer_id: buyer?.id || delivery.buyer_id || null,
    delivery_id: delivery.id,
    partner_name: buyer?.name || delivery.buyer_name || null,
    description: `Lead sold — ${lead?.state || "unknown state"} ${lead?.customer_type || ""}`.trim(),
    dedupe_key: `delivery:${delivery.id}`,
  });
}

/**
 * Move a lead-sale line to match the buyer's decision.
 *
 * Upserts rather than inserts, because the accrual already exists from
 * delivery: accepting a lead must change the status of the line that is there,
 * not add a second one for the same sale.
 */
export async function settleLeadSale(supabase, { deliveryId, deliveryStatus, actorId, note }) {
  const status =
    deliveryStatus === "accepted"
      ? REVENUE_STATUS.CONFIRMED
      : deliveryStatus === "rejected"
        ? REVENUE_STATUS.REVERSED
        : REVENUE_STATUS.PENDING;

  const updates = {
    status,
    notes: note || null,
    confirmed_at: status === REVENUE_STATUS.CONFIRMED ? new Date().toISOString() : null,
    confirmed_by: status === REVENUE_STATUS.CONFIRMED ? actorId || null : null,
  };

  const { error } = await supabase
    .from("revenue_events")
    .update(updates)
    .eq("dedupe_key", `delivery:${deliveryId}`);

  if (error) {
    console.warn("revenue settle failed:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true, status };
}

/**
 * Concierge revenue, recorded when an admin enters what the request actually
 * produced.
 *
 * Upserted on the request id so correcting a figure edits the line rather than
 * stacking a second one. Concierge money is confirmed by definition — an admin
 * is entering an amount that has already been agreed with the partner, not a
 * projection.
 */
export async function recordConciergeRevenue(supabase, { request, amount, actorId }) {
  const value = money(amount);
  const dedupeKey = `concierge:${request.id}`;

  const { data: existing } = await supabase
    .from("revenue_events")
    .select("id")
    .eq("dedupe_key", dedupeKey)
    .maybeSingle();

  const row = {
    source: REVENUE_SOURCES.CONCIERGE,
    // Zero means "corrected back to nothing", which must reverse the line
    // rather than leave a confirmed zero sitting in the ledger.
    status: value > 0 ? REVENUE_STATUS.CONFIRMED : REVENUE_STATUS.REVERSED,
    amount: value,
    occurred_at: request.created_at || new Date().toISOString(),
    concierge_request_id: request.id,
    partner_name: request.revenue_source || "Concierge",
    description: `Concierge — ${request.full_name || request.email || "request"}`,
    confirmed_at: value > 0 ? new Date().toISOString() : null,
    confirmed_by: value > 0 ? actorId || null : null,
    dedupe_key: dedupeKey,
  };

  if (existing?.id) {
    const { error } = await supabase.from("revenue_events").update(row).eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: existing.id, updated: true };
  }

  return recordRevenueEvent(supabase, row);
}
