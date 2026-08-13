import { supabaseAdmin } from "./adminAuth.js";
import { sendEmail } from "./email.js";
import { routeLead, loadActiveBuyers, alreadyDeliveredTo } from "./leadDelivery.js";
import {
  recordRevenueEvent,
  settleLeadSale,
  recordConciergeRevenue,
} from "./revenue.js";
import { summarizeCoverage } from "../../src/lib/leadBuyerRouting.js";
import { REVENUE_SOURCES, REVENUE_STATUS, money } from "../../src/lib/revenue.js";

/**
 * Every write that moves money or a lead.
 *
 * Mounted as actions on /api/admin/manage rather than as its own endpoint.
 * That is a deployment constraint, not a design preference: the plan allows 12
 * serverless functions and the project was already at 12, so a thirteenth file
 * under api/ fails the whole build. Living in _lib keeps it out of the function
 * count while staying a separate module — `manage.js` dispatches to it.
 *
 * Reads are not here. The admin panel reads the ledger and the delivery table
 * directly under RLS, and runs the same `summarizeRevenue` the tests cover, so
 * there is one implementation of the arithmetic rather than a server copy and
 * a browser copy that drift apart.
 *
 * Writes are all here, and only here, for three reasons:
 *
 *   A delivery row records a price agreed at a moment in time. If a browser
 *   could update it, a sale price could be rewritten after the fact.
 *
 *   Sending a lead needs the service key — the buyer's webhook, the buyer's
 *   inbox, the cap counter — none of which the browser may hold.
 *
 *   Every status change is stamped with who made it. Attribution is the
 *   difference between a ledger and a spreadsheet.
 */

/** Bounded free text bound for the database. */
function text(value, max = 500) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

/**
 * Monetization states that record something that already happened. A later
 * routing attempt that finds no eligible buyer must leave these alone.
 */
const TERMINAL_MONETIZATION = new Set(["delivered", "queued", "sold", "rejected"]);

function uuid(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

// ─── Forward a lead to a buyer ──────────────────────────────

/**
 * Route one lead, now.
 *
 * The same code path the automatic capture-time routing uses, so a lead
 * forwarded by hand is delivered, deduplicated, capped and accounted for
 * identically to one routed automatically. A separate "manual send" path would
 * be the one that forgets to write the ledger row.
 */
async function handleRouteLead(req, res, auth) {
  const leadId = uuid(req.body?.leadId);
  if (!leadId) return res.status(400).json({ error: "A valid leadId is required." });

  const buyerId = uuid(req.body?.buyerId); // optional: forward to a named buyer

  const { data: lead, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (error || !lead) return res.status(404).json({ error: "Lead not found." });

  // Consent is enforced here too, not only at capture. An admin clicking
  // "forward" is not consent, and this endpoint is reachable independently of
  // the flow that collected it.
  if (lead.consent_contact !== true) {
    return res.status(422).json({
      error: "This lead did not consent to being contacted, so it cannot be sold.",
      code: "no_consent",
    });
  }

  const route = lead.monetization_route || "residential_partner";
  const result = await routeLead(supabaseAdmin, lead, route, { sendEmail, buyerId });

  if (result.delivered && result.buyer) {
    await supabaseAdmin
      .from("leads")
      .update({
        assigned_partner: result.buyer.name,
        monetization_status: result.status === "delivered" ? "delivered" : "queued",
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", leadId);
  } else if (!result.buyer && !TERMINAL_MONETIZATION.has(lead.monetization_status)) {
    // Same guard as capture-time routing: a repeat "Forward" on an
    // already-delivered lead legitimately finds no new buyer, and must not
    // downgrade a completed sale to "no buyer".
    await supabaseAdmin
      .from("leads")
      .update({ monetization_status: "no_buyer" })
      .eq("id", leadId);
  }

  return res.status(200).json({
    success: result.delivered,
    // Echoed so the caller can tell whose result this is. The admin screen keeps
    // the last routing result around, and attributing one lead's rejection
    // reasons to a different lead would be worse than showing none.
    leadId,
    delivered: result.delivered,
    deliveryId: result.deliveryId,
    status: result.status,
    buyer: result.buyer ? { id: result.buyer.id, name: result.buyer.name } : null,
    reason: result.reason || null,
    // Which buyers were considered and why each declined. An admin looking at
    // a lead that went nowhere gets the answer, not an empty result.
    coverage: result.coverage,
    actor: auth.profile.email,
  });
}

// ─── Which buyers would take this lead ──────────────────────

/**
 * Dry run. Answers "what would happen if I forwarded this?" without sending.
 *
 * Worth having separately because the useful moment to know a lead is
 * unsellable is before an operator clicks the button, not after.
 */
async function handleCoverage(req, res) {
  const leadId = uuid(req.body?.leadId);
  if (!leadId) return res.status(400).json({ error: "A valid leadId is required." });

  const { data: lead, error } = await supabaseAdmin
    .from("leads")
    .select("id, customer_type, state, phone, energy_preference, lead_score, consent_contact")
    .eq("id", leadId)
    .single();

  if (error || !lead) return res.status(404).json({ error: "Lead not found." });

  const buyers = await loadActiveBuyers(supabaseAdmin);
  const delivered = await alreadyDeliveredTo(supabaseAdmin, leadId);

  const coverage = summarizeCoverage(
    buyers,
    {
      customerType: lead.customer_type,
      state: lead.state,
      phone: lead.phone,
      energyPreference: lead.energy_preference,
      leadScore: lead.lead_score,
    },
    { alreadyDeliveredTo: delivered }
  );

  return res.status(200).json({
    ...coverage,
    hasConsent: lead.consent_contact === true,
    activeBuyers: buyers.length,
  });
}

// ─── Buyer accepted or rejected the lead ────────────────────

/**
 * Record a buyer's decision, and move the money line with it.
 *
 * Both writes happen together on purpose: a delivery marked accepted whose
 * ledger row is still pending would understate earnings, and one marked
 * rejected whose ledger row stays confirmed would overstate them. Neither
 * half is useful without the other.
 */
async function handleDeliveryStatus(req, res, auth) {
  const deliveryId = uuid(req.body?.deliveryId);
  const status = req.body?.status;

  if (!deliveryId) return res.status(400).json({ error: "A valid deliveryId is required." });
  if (!["accepted", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Status must be 'accepted' or 'rejected'." });
  }

  const note = text(req.body?.note);
  const now = new Date().toISOString();

  const { data: delivery, error } = await supabaseAdmin
    .from("lead_deliveries")
    .update({ status, responded_at: now, response_note: note })
    .eq("id", deliveryId)
    .select("id, lead_id, buyer_id, buyer_name, price_at_delivery, status")
    .single();

  if (error || !delivery) {
    return res.status(404).json({ error: error?.message || "Delivery not found." });
  }

  const settled = await settleLeadSale(supabaseAdmin, {
    deliveryId,
    deliveryStatus: status,
    actorId: auth.profile.id,
    note,
  });

  // An accepted lead is a converted lead. Reflecting it on the lead row is what
  // makes the funnel numbers on the dashboard agree with the money.
  if (status === "accepted") {
    // Summed over every accepted delivery, not just this one. A lead may
    // legitimately be sold to more than one non-exclusive buyer, and writing
    // only the latest price would quietly discard the earlier sale.
    const { data: accepted } = await supabaseAdmin
      .from("lead_deliveries")
      .select("price_at_delivery")
      .eq("lead_id", delivery.lead_id)
      .eq("status", "accepted");

    const total = (accepted || []).reduce((sum, row) => sum + money(row.price_at_delivery), 0);

    await supabaseAdmin
      .from("leads")
      .update({
        status: "converted",
        converted_at: now,
        confirmed_revenue: money(total),
        monetization_status: "sold",
      })
      .eq("id", delivery.lead_id);
  } else {
    await supabaseAdmin
      .from("leads")
      .update({ monetization_status: "rejected" })
      .eq("id", delivery.lead_id);
  }

  return res.status(200).json({
    success: true,
    delivery,
    ledgerStatus: settled.status,
    actor: auth.profile.email,
  });
}

// ─── Ledger status changes ──────────────────────────────────

/**
 * Confirm, pay out or reverse a ledger line.
 *
 * This is the step where an accrual becomes revenue, and it is deliberately
 * manual: it happens when a partner's statement says so. Nothing in this
 * codebase promotes a pending line to confirmed on its own, because nothing in
 * this codebase knows what a partner has agreed to pay.
 */
async function handleRevenueStatus(req, res, auth) {
  const eventId = uuid(req.body?.eventId);
  const status = req.body?.status;

  if (!eventId) return res.status(400).json({ error: "A valid eventId is required." });
  if (![REVENUE_STATUS.CONFIRMED, REVENUE_STATUS.PAID, REVENUE_STATUS.REVERSED, REVENUE_STATUS.PENDING].includes(status)) {
    return res.status(400).json({ error: "Unknown revenue status." });
  }

  const updates = { status };

  // Only written when the caller actually sent them. The Confirm / Mark-paid /
  // Reverse buttons send just {eventId, status}, and unconditionally writing
  // these would null out the network transaction reference an earlier entry
  // recorded — destroying the one field that lets a ledger line be reconciled
  // against a partner's statement.
  if (req.body?.note !== undefined) updates.notes = text(req.body.note);
  if (req.body?.externalReference !== undefined) {
    updates.external_reference = text(req.body.externalReference, 200);
  }

  // Only stamp the confirmation when it is actually being confirmed; reversing
  // must clear it rather than leave a stale approver on a clawed-back line.
  if (status === REVENUE_STATUS.CONFIRMED || status === REVENUE_STATUS.PAID) {
    updates.confirmed_at = new Date().toISOString();
    updates.confirmed_by = auth.profile.id;
  } else {
    updates.confirmed_at = null;
    updates.confirmed_by = null;
  }

  // An amount correction is allowed alongside the status change, because a
  // network statement routinely differs from the accrual, and the ledger has to
  // be able to agree with the statement.
  if (req.body?.amount !== undefined && req.body?.amount !== null && req.body?.amount !== "") {
    const amount = money(req.body.amount);
    if (!(amount >= 0)) return res.status(400).json({ error: "Amount must be zero or more." });
    updates.amount = amount;
  }

  const { data, error } = await supabaseAdmin
    .from("revenue_events")
    .update(updates)
    .eq("id", eventId)
    .select()
    .single();

  if (error || !data) {
    return res.status(404).json({ error: error?.message || "Revenue event not found." });
  }

  return res.status(200).json({ success: true, event: data, actor: auth.profile.email });
}

// ─── Record a conversion a network has reported ─────────────

/**
 * Enter an affiliate conversion by hand.
 *
 * Per-signup and revenue-share agreements cannot be accrued from a click — we
 * do not know whether the customer signed, or what they spent. This is how
 * those become revenue: an admin reads the network's statement and records it,
 * with the network's own reference so the line can be reconciled later.
 */
async function handleRecordConversion(req, res, auth) {
  const linkId = uuid(req.body?.affiliateLinkId);
  if (!linkId) return res.status(400).json({ error: "A valid affiliateLinkId is required." });

  const amount = money(req.body?.amount);
  if (!(amount > 0)) return res.status(400).json({ error: "Amount must be greater than zero." });

  const { data: link, error: linkError } = await supabaseAdmin
    .from("affiliate_links")
    .select("id, slug, label, provider_id, network, provider:provider_id ( name )")
    .eq("id", linkId)
    .single();

  if (linkError || !link) return res.status(404).json({ error: "Affiliate link not found." });

  const externalReference = text(req.body?.externalReference, 200);
  const occurredAt = req.body?.occurredAt ? new Date(req.body.occurredAt) : new Date();
  if (Number.isNaN(occurredAt.getTime())) {
    return res.status(400).json({ error: "occurredAt is not a valid date." });
  }

  // A conversion an admin has typed in is confirmed by definition — they are
  // transcribing something the partner has already agreed to pay.
  const result = await recordRevenueEvent(supabaseAdmin, {
    source: REVENUE_SOURCES.AFFILIATE_CONVERSION,
    status: REVENUE_STATUS.CONFIRMED,
    amount,
    occurred_at: occurredAt.toISOString(),
    provider_id: link.provider_id || null,
    affiliate_link_id: link.id,
    partner_name: link.provider?.name || link.label || link.slug,
    description: text(req.body?.description, 300) || `Conversion — /go/${link.slug}`,
    external_reference: externalReference,
    notes: text(req.body?.note),
    confirmed_at: new Date().toISOString(),
    confirmed_by: auth.profile.id,
    // The network's own reference is the natural idempotency key: re-importing
    // the same statement line must not book the commission twice. Without one,
    // the entry is allowed through unkeyed rather than blocked.
    dedupe_key: externalReference ? `conversion:${link.id}:${externalReference}` : null,
  });

  if (!result.ok) return res.status(500).json({ error: result.error || "Could not record conversion." });
  if (result.duplicate) {
    return res.status(409).json({
      error: "A conversion with this reference is already recorded for this link.",
      code: "duplicate_reference",
    });
  }

  return res.status(200).json({ success: true, id: result.id, actor: auth.profile.email });
}

// ─── Concierge revenue ──────────────────────────────────────

/**
 * What a concierge request actually earned.
 *
 * Writes the request row and the ledger line together so the concierge screen
 * and the earnings screen cannot disagree. Upserted on the request, so
 * correcting a figure edits the line instead of stacking a second one.
 */
async function handleConciergeRevenue(req, res, auth) {
  const requestId = uuid(req.body?.requestId);
  if (!requestId) return res.status(400).json({ error: "A valid requestId is required." });

  const amount = money(req.body?.amount);
  if (!(amount >= 0)) return res.status(400).json({ error: "Amount must be zero or more." });

  // Presence in the body decides whether a field is written; `text()` then
  // decides the value. Gating on `text(...) !== null` instead would make an
  // empty string indistinguishable from an absent field, so clearing a note
  // would report success and silently leave the old note in place.
  const updates = { actual_revenue: amount, updated_at: new Date().toISOString() };
  if (req.body?.revenueSource !== undefined) {
    updates.revenue_source = text(req.body.revenueSource, 120);
  }
  if (req.body?.adminNotes !== undefined) {
    updates.admin_notes = text(req.body.adminNotes, 2000);
  }
  const status = text(req.body?.status, 40);
  if (status) updates.status = status;

  const { data: request, error } = await supabaseAdmin
    .from("concierge_requests")
    .update(updates)
    .eq("id", requestId)
    .select()
    .single();

  if (error || !request) {
    return res.status(404).json({ error: error?.message || "Concierge request not found." });
  }

  const ledger = await recordConciergeRevenue(supabaseAdmin, {
    request,
    amount,
    actorId: auth.profile.id,
  });

  return res.status(200).json({
    success: true,
    request,
    ledgerRecorded: ledger.ok,
    actor: auth.profile.email,
  });
}

// ─── Actions ────────────────────────────────────────────────
//
// Exported as a table rather than a handler so `manage.js` can merge these
// with its own user-management actions behind one authenticated entry point.
// Each entry carries the roles allowed to invoke it; the router enforces them.

export const MONETIZATION_ACTIONS = {
  "route-lead": { handler: handleRouteLead, roles: ["admin", "editor"] },
  coverage: { handler: handleCoverage, roles: ["admin", "editor", "viewer"] },
  "delivery-status": { handler: handleDeliveryStatus, roles: ["admin", "editor"] },
  // Money changes are admin-only. An editor may move a lead; only an admin may
  // decide what the platform earned from it.
  "revenue-status": { handler: handleRevenueStatus, roles: ["admin"] },
  "record-conversion": { handler: handleRecordConversion, roles: ["admin"] },
  "concierge-revenue": { handler: handleConciergeRevenue, roles: ["admin", "editor"] },
};
