import { selectBuyer, summarizeCoverage } from '../../src/lib/leadBuyerRouting.js';
import { recordLeadSale } from './revenue.js';

/**
 * Delivering a qualified lead to its buyer.
 *
 * The monetization router says WHERE a lead should go; `leadBuyerRouting` says
 * WHO on that route takes it; this does the sending and records what happened.
 *
 * Two properties matter more than anything else here:
 *
 *   Never double-sell. A retry, a duplicate webhook or a second call for the
 *   same lead must not bill a buyer twice. The unique (lead_id, buyer_id)
 *   constraint enforces it at the database, and a conflict is treated as
 *   success rather than as an error.
 *
 *   Never silently drop. A lead nobody can take is recorded as such, with the
 *   reason each buyer declined, so an admin sees an unmonetized lead rather
 *   than nothing at all.
 */

/** Fields a buyer receives. Nothing internal, nothing commercial. */
function buyerPayload(lead, route) {
  return {
    lead_id: lead.id,
    received_at: new Date().toISOString(),
    route,
    contact: {
      first_name: lead.first_name || null,
      last_name: lead.last_name || null,
      email: lead.email || null,
      phone: lead.phone || null,
    },
    location: {
      zip: lead.zip || null,
      city: lead.city || null,
      state: lead.state || null,
      service_address: lead.service_address || null,
    },
    profile: {
      customer_type: lead.customer_type || null,
      property_type: lead.property_type || null,
      business_name: lead.business_name || null,
      energy_preference: lead.energy_preference || null,
      shopping_intent: lead.shopping_intent || null,
      monthly_usage_kwh: lead.monthly_usage_kwh ?? null,
      monthly_cost: lead.monthly_cost ?? null,
      current_provider: lead.current_provider || null,
    },
  };
}

/** Active buyers, newest configuration first. */
export async function loadActiveBuyers(supabase) {
  const { data, error } = await supabase
    .from('lead_buyers')
    .select('*')
    .eq('is_active', true);
  if (error) throw new Error(`lead_buyers query failed: ${error.message}`);
  return data || [];
}

/** Buyers this lead has already been sent to, so it is never sold twice. */
export async function alreadyDeliveredTo(supabase, leadId) {
  const { data, error } = await supabase
    .from('lead_deliveries')
    .select('buyer_id')
    .eq('lead_id', leadId);
  if (error) return [];
  return (data || []).map((row) => row.buyer_id).filter(Boolean);
}

/** HTML-escape a value bound for the buyer's inbox. */
function esc(value) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * The lead as a buyer reads it.
 *
 * A buyer paying per lead needs to act on it from their inbox — so the contact
 * details and the qualification that justified the price are both in the body,
 * not attached as JSON. The same fields the webhook receives, rendered.
 */
function buyerEmailHtml(payload) {
  const row = (label, value) => `
    <tr>
      <td style="padding:8px 0;color:#6b7280;font-size:13px;width:170px;vertical-align:top;">${label}</td>
      <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;">${esc(value)}</td>
    </tr>`;

  const name = [payload.contact.first_name, payload.contact.last_name].filter(Boolean).join(' ');
  const location = [payload.location.city, payload.location.state].filter(Boolean).join(', ');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>New lead</title></head>
<body style="margin:0;padding:24px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
    <tr><td style="background:#0A5C8C;padding:20px 28px;">
      <p style="margin:0;color:#ffffff;font-size:17px;font-weight:600;">New qualified lead</p>
      <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Electric Scouts &middot; ${esc(payload.route)}</p>
    </td></tr>
    <tr><td style="padding:24px 28px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:.04em;">Contact</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${row('Name', name)}
        ${row('Email', payload.contact.email)}
        ${row('Phone', payload.contact.phone)}
      </table>

      <p style="margin:22px 0 12px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:.04em;">Location</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${row('Service address', payload.location.service_address)}
        ${row('City / State', location)}
        ${row('ZIP', payload.location.zip)}
      </table>

      <p style="margin:22px 0 12px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:.04em;">Profile</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${row('Customer type', payload.profile.customer_type)}
        ${row('Business name', payload.profile.business_name)}
        ${row('Property type', payload.profile.property_type)}
        ${row('Energy preference', payload.profile.energy_preference)}
        ${row('Shopping intent', payload.profile.shopping_intent)}
        ${row('Monthly usage', payload.profile.monthly_usage_kwh ? `${payload.profile.monthly_usage_kwh} kWh` : null)}
        ${row('Monthly cost', payload.profile.monthly_cost ? `$${payload.profile.monthly_cost}` : null)}
        ${row('Current provider', payload.profile.current_provider)}
      </table>

      <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #f3f4f6;font-size:12px;color:#9ca3af;line-height:1.6;">
        Lead reference ${esc(payload.lead_id)} &middot; received ${esc(payload.received_at)}.
        This customer consented to be contacted about electricity supply offers.
      </p>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Send the payload.
 *
 * Webhook and email are both real delivery methods; `manual` records the
 * match and leaves an admin to hand it over, which is how most agreements
 * actually start before an integration exists.
 */
async function deliver(buyer, payload, { sendEmail }) {
  if (buyer.delivery_method === 'manual') {
    return { ok: true, status: 'pending', note: 'queued for manual handover' };
  }

  if (buyer.delivery_method === 'webhook') {
    if (!buyer.webhook_url) return { ok: false, error: 'No webhook URL configured' };

    // Every transport failure has to come back as a value, never as a throw.
    // The caller has already claimed the delivery row, and the unique
    // (lead_id, buyer_id) constraint means a claim it never gets to mark
    // 'failed' can never be retried — the sale would be wedged at 'pending'
    // forever, looking like a lead in flight rather than one that needs
    // attention. A timeout or a DNS failure is exactly that case.
    try {
      const response = await fetch(buyer.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // A buyer's endpoint that never answers must not hold this request
        // open until the platform's own function times out.
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) return { ok: false, error: `Webhook returned ${response.status}` };
      return { ok: true, status: 'delivered' };
    } catch (error) {
      const reason = error?.name === 'TimeoutError' || error?.name === 'AbortError'
        ? 'Webhook timed out after 10s'
        : `Webhook request failed: ${error?.message || error}`;
      return { ok: false, error: reason };
    }
  }

  if (!buyer.delivery_email) return { ok: false, error: 'No delivery email configured' };

  // Same reasoning as the webhook path: a throw here would strand the claimed
  // delivery at 'pending' with no error and no way to retry it.
  try {
    const sent = await sendEmail({
      to: buyer.delivery_email,
      subject: `New ${payload.profile.customer_type || 'electricity'} lead — ${payload.location.zip || 'unknown ZIP'}`,
      html: buyerEmailHtml(payload),
      // Keyed on the pair, so a retry of the same sale never mails a buyer the
      // same lead twice — the buyer-facing half of the no-double-sell rule.
      idempotencyKey: `lead_delivery_${payload.lead_id}_${buyer.id}`,
      eventType: 'lead_delivery',
      leadId: payload.lead_id,
    });
    if (!sent?.success) return { ok: false, error: sent?.error || 'Email send failed' };
    return { ok: true, status: 'delivered' };
  } catch (error) {
    return { ok: false, error: `Email send threw: ${error?.message || error}` };
  }
}

/**
 * Route and deliver one lead.
 *
 * @param {object} supabase   service-role client
 * @param {object} lead       the lead row
 * @param {string} route      from the monetization router
 * @param {{sendEmail: Function, now?: Date}} deps
 * @returns {Promise<{delivered: boolean, buyer: object|null, reason?: string, coverage: object}>}
 */
export async function routeLead(supabase, lead, route, {
  sendEmail,
  now = new Date(),
  buyerId = null,
} = {}) {
  const allBuyers = await loadActiveBuyers(supabase);
  const delivered = await alreadyDeliveredTo(supabase, lead.id);

  // An admin forwarding to a named buyer still goes through the same eligibility
  // rules — the choice narrows the candidate set, it does not bypass the
  // targeting, the phone requirement, the score floor or the monthly cap a
  // buyer negotiated. Overriding those by hand is how a buyer receives leads
  // they have explicitly refused to pay for.
  const buyers = buyerId ? allBuyers.filter((b) => b.id === buyerId) : allBuyers;

  const matchInput = {
    customerType: lead.customer_type,
    state: lead.state,
    phone: lead.phone,
    energyPreference: lead.energy_preference,
    leadScore: lead.lead_score,
  };

  // Coverage is diagnostic, so it is always computed over EVERY active buyer,
  // even when the admin narrowed delivery to one. Reporting "no buyers
  // configured" because the single chosen buyer declined would send an operator
  // to the wrong screen entirely.
  const coverage = summarizeCoverage(allBuyers, matchInput, { now, alreadyDeliveredTo: delivered });
  const { buyer } = selectBuyer(buyers, matchInput, { now, alreadyDeliveredTo: delivered });

  if (!buyer) {
    // Recorded, not dropped. An admin needs to see the lead nobody took and
    // why, which is a configuration signal — either no agreement covers this
    // market, or every buyer's targeting excludes it.
    return { delivered: false, buyer: null, reason: 'no_matching_buyer', coverage };
  }

  // Claim the delivery BEFORE sending. If two requests race, the unique
  // constraint means only one wins the insert, so only one actually sends.
  const { data: claimed, error: claimError } = await supabase
    .from('lead_deliveries')
    .insert({
      lead_id: lead.id,
      buyer_id: buyer.id,
      buyer_name: buyer.name,
      route,
      // The price agreed at THIS moment. A buyer who renegotiates next quarter
      // must not retroactively restate what this quarter's leads were sold for.
      price_at_delivery: buyer.price_per_lead ?? null,
      status: 'pending',
    })
    .select('id, lead_id, buyer_id, price_at_delivery')
    .single();

  if (claimError) {
    // 23505 is the unique violation: this lead already went to this buyer, so
    // the work is done. Treating it as success is what makes retries safe.
    if (claimError.code === '23505') {
      return { delivered: true, buyer, reason: 'already_delivered', coverage };
    }
    return { delivered: false, buyer, reason: `claim_failed: ${claimError.message}`, coverage };
  }

  const result = await deliver(buyer, buyerPayload(lead, route), { sendEmail });
  const deliveredAt = result.ok && result.status === 'delivered' ? new Date().toISOString() : null;

  await supabase
    .from('lead_deliveries')
    .update({
      status: result.ok ? result.status : 'failed',
      error: result.ok ? null : String(result.error).slice(0, 500),
      delivered_at: deliveredAt,
    })
    .eq('lead_id', lead.id)
    .eq('buyer_id', buyer.id);

  // The cap counter only advances on a real delivery, so a failed send does
  // not consume a buyer's monthly allocation.
  if (result.ok && result.status === 'delivered') {
    await supabase.rpc('increment_buyer_delivery', { buyer_id: buyer.id }).then(
      () => {},
      // The RPC is an optimization; the delivery is already recorded, and the
      // count can be rebuilt from lead_deliveries if it drifts.
      () => {}
    );
  }

  // The sale goes on the ledger as PENDING, not as revenue. The buyer has the
  // lead; they have not yet said they will pay for it. It becomes confirmed
  // when an admin records their acceptance, and reversed if they reject it —
  // so the earnings screen can never report a sale that was sent back.
  //
  // Recorded for a manual handover too, not only an automated send. A buyer on
  // `manual` has still been matched at an agreed price, and most agreements
  // start that way before an integration exists; omitting them would show
  // "leads sold" on the revenue screen with nothing behind it in the ledger.
  if (result.ok) {
    await recordLeadSale(supabase, {
      delivery: { ...claimed, delivered_at: deliveredAt },
      buyer,
      lead,
    });
  }

  return {
    delivered: result.ok,
    buyer,
    deliveryId: claimed?.id || null,
    status: result.ok ? result.status : 'failed',
    reason: result.ok ? undefined : result.error,
    coverage,
  };
}
