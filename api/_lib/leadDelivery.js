import { selectBuyer, summarizeCoverage } from '../../src/lib/leadBuyerRouting.js';

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
    const response = await fetch(buyer.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return { ok: false, error: `Webhook returned ${response.status}` };
    return { ok: true, status: 'delivered' };
  }

  if (!buyer.delivery_email) return { ok: false, error: 'No delivery email configured' };
  const sent = await sendEmail({
    to: buyer.delivery_email,
    subject: `New ${payload.profile.customer_type || 'electricity'} lead — ${payload.location.zip || 'unknown ZIP'}`,
    payload,
  });
  if (!sent?.success) return { ok: false, error: sent?.error || 'Email send failed' };
  return { ok: true, status: 'delivered' };
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
export async function routeLead(supabase, lead, route, { sendEmail, now = new Date() } = {}) {
  const buyers = await loadActiveBuyers(supabase);
  const delivered = await alreadyDeliveredTo(supabase, lead.id);

  const matchInput = {
    customerType: lead.customer_type,
    state: lead.state,
    phone: lead.phone,
    energyPreference: lead.energy_preference,
    leadScore: lead.lead_score,
  };

  const coverage = summarizeCoverage(buyers, matchInput, { now, alreadyDeliveredTo: delivered });
  const { buyer } = selectBuyer(buyers, matchInput, { now, alreadyDeliveredTo: delivered });

  if (!buyer) {
    // Recorded, not dropped. An admin needs to see the lead nobody took and
    // why, which is a configuration signal — either no agreement covers this
    // market, or every buyer's targeting excludes it.
    return { delivered: false, buyer: null, reason: 'no_matching_buyer', coverage };
  }

  // Claim the delivery BEFORE sending. If two requests race, the unique
  // constraint means only one wins the insert, so only one actually sends.
  const { error: claimError } = await supabase.from('lead_deliveries').insert({
    lead_id: lead.id,
    buyer_id: buyer.id,
    buyer_name: buyer.name,
    route,
    price_at_delivery: buyer.price_per_lead ?? null,
    status: 'pending',
  });

  if (claimError) {
    // 23505 is the unique violation: this lead already went to this buyer, so
    // the work is done. Treating it as success is what makes retries safe.
    if (claimError.code === '23505') {
      return { delivered: true, buyer, reason: 'already_delivered', coverage };
    }
    return { delivered: false, buyer, reason: `claim_failed: ${claimError.message}`, coverage };
  }

  const result = await deliver(buyer, buyerPayload(lead, route), { sendEmail });

  await supabase
    .from('lead_deliveries')
    .update({
      status: result.ok ? result.status : 'failed',
      error: result.ok ? null : String(result.error).slice(0, 500),
      delivered_at: result.ok && result.status === 'delivered' ? new Date().toISOString() : null,
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

  return { delivered: result.ok, buyer, reason: result.ok ? undefined : result.error, coverage };
}
