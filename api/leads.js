import {
  supabase,
  sendEmail,
  leadWelcomeEmail,
  rateAlertsConfirmationEmail,
  adminNewLeadEmail,
  adminConciergeRequestEmail,
  conciergeConfirmationEmail,
  adminBusinessQuoteEmail,
  businessQuoteConfirmationEmail,
  APP_BASE_URL,
  LOGO_EMAIL_HEADER_URL,
  ADMIN_EMAILS,
} from "./_lib/email.js";
import { validateContact, validateFullName } from "../src/lib/contactValidation.js";
import { routeLead } from "./_lib/leadDelivery.js";
import { verifyCronRequest } from "./_lib/cronAuth.js";

// ZIP prefix to state mapping for server-side resolution
const ZIP_TO_STATE = {
  '750': 'TX', '751': 'TX', '752': 'TX', '753': 'TX', '754': 'TX', '755': 'TX', '756': 'TX', '757': 'TX', '758': 'TX', '759': 'TX',
  '760': 'TX', '761': 'TX', '762': 'TX', '763': 'TX', '764': 'TX', '765': 'TX', '766': 'TX', '767': 'TX', '768': 'TX', '769': 'TX',
  '770': 'TX', '771': 'TX', '772': 'TX', '773': 'TX', '774': 'TX', '775': 'TX', '776': 'TX', '777': 'TX', '778': 'TX', '779': 'TX',
  '780': 'TX', '781': 'TX', '782': 'TX', '783': 'TX', '784': 'TX', '785': 'TX', '786': 'TX', '787': 'TX', '788': 'TX', '789': 'TX',
  '790': 'TX', '791': 'TX', '792': 'TX', '793': 'TX', '794': 'TX', '795': 'TX', '796': 'TX', '797': 'TX', '798': 'TX', '799': 'TX',
  '430': 'OH', '431': 'OH', '432': 'OH', '433': 'OH', '434': 'OH', '435': 'OH', '436': 'OH', '437': 'OH', '438': 'OH', '439': 'OH',
  '440': 'OH', '441': 'OH', '442': 'OH', '443': 'OH', '444': 'OH', '445': 'OH', '446': 'OH', '447': 'OH', '448': 'OH', '449': 'OH',
  '450': 'OH', '451': 'OH', '452': 'OH', '453': 'OH', '454': 'OH', '455': 'OH', '456': 'OH', '457': 'OH', '458': 'OH',
  '150': 'PA', '151': 'PA', '152': 'PA', '153': 'PA', '154': 'PA', '155': 'PA', '156': 'PA', '157': 'PA', '158': 'PA', '159': 'PA',
  '160': 'PA', '161': 'PA', '162': 'PA', '163': 'PA', '164': 'PA', '165': 'PA', '166': 'PA', '167': 'PA', '168': 'PA', '169': 'PA',
  '170': 'PA', '171': 'PA', '172': 'PA', '173': 'PA', '174': 'PA', '175': 'PA', '176': 'PA', '177': 'PA', '178': 'PA', '179': 'PA',
  '180': 'PA', '181': 'PA', '182': 'PA', '183': 'PA', '184': 'PA', '185': 'PA', '186': 'PA', '187': 'PA', '188': 'PA', '189': 'PA',
  '190': 'PA', '191': 'PA',
  '100': 'NY', '101': 'NY', '102': 'NY', '103': 'NY', '104': 'NY', '105': 'NY', '106': 'NY', '107': 'NY', '108': 'NY', '109': 'NY',
  '110': 'NY', '111': 'NY', '112': 'NY', '113': 'NY', '114': 'NY', '115': 'NY', '116': 'NY', '117': 'NY', '118': 'NY', '119': 'NY',
  '120': 'NY', '121': 'NY', '122': 'NY', '123': 'NY', '124': 'NY', '125': 'NY', '126': 'NY', '127': 'NY', '128': 'NY', '129': 'NY',
  '130': 'NY', '131': 'NY', '132': 'NY', '133': 'NY', '134': 'NY', '135': 'NY', '136': 'NY', '137': 'NY', '138': 'NY', '139': 'NY',
  '140': 'NY', '141': 'NY', '142': 'NY', '143': 'NY', '144': 'NY', '145': 'NY', '146': 'NY', '147': 'NY', '148': 'NY', '149': 'NY',
  '070': 'NJ', '071': 'NJ', '072': 'NJ', '073': 'NJ', '074': 'NJ', '075': 'NJ', '076': 'NJ', '077': 'NJ', '078': 'NJ', '079': 'NJ',
  '080': 'NJ', '081': 'NJ', '082': 'NJ', '083': 'NJ', '084': 'NJ', '085': 'NJ', '086': 'NJ', '087': 'NJ', '088': 'NJ', '089': 'NJ',
  '206': 'MD', '207': 'MD', '208': 'MD', '209': 'MD', '210': 'MD', '211': 'MD', '212': 'MD', '214': 'MD', '215': 'MD', '216': 'MD', '217': 'MD', '218': 'MD', '219': 'MD',
  '600': 'IL', '601': 'IL', '602': 'IL', '603': 'IL', '604': 'IL', '605': 'IL', '606': 'IL', '607': 'IL', '608': 'IL', '609': 'IL',
  '610': 'IL', '611': 'IL', '612': 'IL', '613': 'IL', '614': 'IL', '615': 'IL', '616': 'IL', '617': 'IL', '618': 'IL', '619': 'IL',
  '620': 'IL', '621': 'IL', '622': 'IL', '623': 'IL', '624': 'IL', '625': 'IL', '626': 'IL', '627': 'IL', '628': 'IL', '629': 'IL',
  '060': 'CT', '061': 'CT', '062': 'CT', '063': 'CT', '064': 'CT', '065': 'CT', '066': 'CT', '067': 'CT', '068': 'CT', '069': 'CT',
  '010': 'MA', '011': 'MA', '012': 'MA', '013': 'MA', '014': 'MA', '015': 'MA', '016': 'MA', '017': 'MA', '018': 'MA', '019': 'MA',
  '020': 'MA', '021': 'MA', '022': 'MA', '023': 'MA', '024': 'MA', '025': 'MA', '026': 'MA', '027': 'MA',
  '039': 'ME', '040': 'ME', '041': 'ME', '042': 'ME', '043': 'ME', '044': 'ME', '045': 'ME', '046': 'ME', '047': 'ME', '048': 'ME', '049': 'ME',
  '030': 'NH', '031': 'NH', '032': 'NH', '033': 'NH', '034': 'NH', '035': 'NH', '036': 'NH', '037': 'NH', '038': 'NH',
  '028': 'RI', '029': 'RI',
};

const STATE_NAMES = {
  'TX': 'Texas', 'OH': 'Ohio', 'PA': 'Pennsylvania', 'NY': 'New York', 'NJ': 'New Jersey',
  'MD': 'Maryland', 'IL': 'Illinois', 'CT': 'Connecticut', 'MA': 'Massachusetts',
  'ME': 'Maine', 'NH': 'New Hampshire', 'RI': 'Rhode Island'
};

function resolveState(zip) {
  if (!zip || zip.length < 3) return null;
  return ZIP_TO_STATE[zip.substring(0, 3)] || null;
}

// ─── Follow-Up Email Helpers ───

async function getRecommendedPlans(state) {
  if (!state) return [];
  const { data: plans } = await supabase
    .from('electricity_plans')
    .select('plan_name, provider_name, rate_per_kwh, contract_length, renewable_percentage')
    .eq('state', state)
    .eq('is_active', true)
    .order('rate_per_kwh', { ascending: true })
    .limit(3);
  return plans || [];
}

function buildFollowUpEmail(lead, plans, followUpNumber) {
  const firstName = lead.name ? lead.name.split(' ')[0] : '';
  const city = lead.city || '';
  const stateName = lead.state ? STATE_NAMES[lead.state] || lead.state : '';
  const location = city && stateName ? `${city}, ${stateName}` : stateName || 'your area';
  const year = new Date().getFullYear();
  const unsubUrl = `${APP_BASE_URL}/api/unsubscribe?email=${encodeURIComponent(lead.email)}`;
  const compareUrl = `${APP_BASE_URL}/compare-rates${lead.zip ? `?zip=${lead.zip}` : ''}`;
  const isFirst = followUpNumber === 1;
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
  const mainMessage = isFirst
    ? `We noticed you recently compared electricity rates${city ? ` for ${location}` : ''}. Have you had a chance to review the plans we found for you? Many of our users save an average of $50-$80 per month just by switching to a better rate.`
    : `Just a quick check-in — electricity rates in ${location} have been changing, and we wanted to make sure you're getting the best deal available. Here are the current top-rated plans for your area:`;
  const ctaText = isFirst ? 'Review Your Savings Options' : 'See Updated Rates';

  const planCards = plans.map((plan, i) => {
    const badge = i === 0 ? '<span style="background:#FF6B35;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:3px;margin-left:8px;">Best Rate</span>' : '';
    const renewableTag = plan.renewable_percentage >= 50
      ? `<span style="color:#059669;font-size:12px;margin-left:4px;">&#127807; ${plan.renewable_percentage}% Green</span>`
      : '';
    return `<tr><td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:top;">
          <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#1a1a1a;">${plan.provider_name}${badge}</p>
          <p style="margin:0;font-size:13px;color:#6b7280;">${plan.plan_name} &middot; ${plan.contract_length ? `${plan.contract_length} month term` : 'No contract'}${renewableTag}</p>
        </td>
        <td style="vertical-align:top;text-align:right;white-space:nowrap;">
          <p style="margin:0;font-size:20px;font-weight:700;color:#0A5C8C;">${plan.rate_per_kwh}&cent;</p>
          <p style="margin:0;font-size:11px;color:#9ca3af;">per kWh</p>
        </td>
      </tr></table>
    </td></tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Your Electricity Savings Update</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:#0A5C8C;padding:24px 32px;text-align:center;">
          <img src="${LOGO_EMAIL_HEADER_URL}" alt="Electric Scouts" width="180" style="display:block;margin:0 auto;" />
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#1a1a1a;font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">${mainMessage}</p>
          ${plans.length > 0 ? `
          <p style="color:#1a1a1a;font-size:16px;font-weight:600;margin:0 0 12px;">
            ${isFirst ? 'Your Top 3 Recommended Plans:' : 'Current Best Rates in ' + location + ':'}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:0 0 24px;">
            ${planCards}
          </table>
          <p style="color:#6b7280;font-size:13px;margin:0 0 24px;">* Rates based on 1,000 kWh monthly usage. Actual costs may vary.</p>
          ` : ''}
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
            <tr><td style="background:#FF6B35;border-radius:6px;padding:14px 32px;">
              <a href="${compareUrl}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;display:block;text-align:center;">${ctaText}</a>
            </td></tr>
          </table>
          <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 8px;">Switching is free and takes less than 5 minutes. Your service stays the same — only your rate changes.</p>
          <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;">If you've already switched, that's great! Just ignore this email.</p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:24px 32px;border-top:1px solid #e5e7eb;">
          <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0 0 8px;text-align:center;">
            You're receiving this because you compared electricity rates on Electric Scouts.
          </p>
          <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0 0 8px;text-align:center;">
            <a href="${unsubUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a> &middot;
            <a href="${APP_BASE_URL}" style="color:#6b7280;text-decoration:underline;">Visit Electric Scouts</a>
          </p>
          <p style="color:#d1d5db;font-size:11px;margin:0;text-align:center;">
            &copy; ${year} Electric Scouts. Helping Americans find better electricity rates.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const subject = isFirst
    ? `${firstName ? firstName + ', are' : 'Are'} you still looking for a better electricity rate?`
    : `${firstName ? firstName + ', new' : 'New'} electricity rates available in ${location}`;

  return { subject, html };
}

// ─── Follow-Up Handler ───

async function handleFollowUp(req, res) {
  // Authenticated: this mails up to 50 real customers per call, and was
  // previously reachable by anyone who knew the URL.
  const auth = verifyCronRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  try {
    const now = new Date();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const { data: eligibleLeads, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .in('status', ['new', 'active', 'nurtured'])
      .lt('follow_up_count', 2)
      .lt('created_at', threeDaysAgo.toISOString())
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('Error fetching leads:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch leads' });
    }

    if (!eligibleLeads || eligibleLeads.length === 0) {
      return res.status(200).json({ success: true, message: 'No leads eligible for follow-up', sent: 0 });
    }

    let sentCount = 0;
    let errorCount = 0;

    for (const lead of eligibleLeads) {
      const currentFollowUp = (lead.follow_up_count || 0) + 1;
      const createdAt = new Date(lead.created_at);
      if (currentFollowUp === 1 && createdAt > threeDaysAgo) continue;
      if (currentFollowUp === 2 && createdAt > sevenDaysAgo) continue;

      const state = lead.state || resolveState(lead.zip);
      const plans = await getRecommendedPlans(state);
      const { subject, html } = buildFollowUpEmail({ ...lead, state }, plans, currentFollowUp);

      const result = await sendEmail({
        to: lead.email,
        subject,
        html,
        idempotencyKey: `follow_up_${lead.id}_${currentFollowUp}`,
        eventType: `follow_up_${currentFollowUp}`,
        leadId: lead.id,
      });

      if (result.success && !result.skipped) {
        await supabase
          .from('leads')
          .update({
            follow_up_count: currentFollowUp,
            follow_up_sent_at: now.toISOString(),
            status: currentFollowUp === 1 ? 'nurtured' : lead.status,
          })
          .eq('id', lead.id);
        sentCount++;
      } else if (!result.skipped) {
        errorCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return res.status(200).json({
      success: true,
      message: `Follow-up batch complete: ${sentCount} sent, ${errorCount} errors`,
      sent: sentCount,
      errors: errorCount,
      total: eligibleLeads.length,
    });
  } catch (error) {
    console.error('Follow-up email error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── Create Lead Handler ───

/**
 * Map the comparison-engine payload onto lead columns.
 *
 * Only keys that are actually present are returned, so a progressive write
 * early in the flow cannot blank out a value a later write already recorded.
 *
 * The utility account number, customer name and service address read off a bill
 * are deliberately absent: the client never sends them, and nothing here would
 * store them if it did.
 */
function mapComparisonColumns(comparison, attribution) {
  const columns = {};
  if (!comparison || typeof comparison !== "object") return columns;

  const direct = {
    session_id: "comparison_session_id",
    status: "comparison_status",
    // Which page opened the session — a landing page, the bill analyzer, or
    // /compare-rates directly. Kept as a column rather than in the JSONB blob
    // because the funnel is grouped by it.
    entry_context: "entry_context",
    customer_type: "customer_type",
    energy_preference: "energy_preference",
    property_type: "property_type",
    shopping_intent: "shopping_intent",
    usage_range: "usage_range",
    business_type: "business_type",
    business_name: "business_name",
    monthly_spend_range: "monthly_spend_range",
    timing: "timing",
    monthly_usage_kwh: "monthly_usage_kwh",
    monthly_cost: "monthly_cost",
    current_provider: "current_provider",
    current_plan: "current_plan",
    effective_rate: "effective_rate",
    contract_end_date: "contract_end_date",
    renewable_percentage: "renewable_percentage",
    peak_demand_kw: "peak_demand_kw",
    bill_uploaded: "bill_uploaded",
    bill_analysis_status: "bill_analysis_status",
    bill_confidence: "bill_confidence",
    bill_analyzed_at: "bill_analyzed_at",
    route: "monetization_route",
    qualification: "qualification",
    lead_score: "lead_score",
  };

  for (const [key, column] of Object.entries(direct)) {
    const value = comparison[key];
    if (value === null || value === undefined || value === "") continue;
    columns[column] = value;
  }

  if (comparison.consent_contact) {
    columns.consent_contact = true;
    // Auditable evidence of when consent was given, not just that it was.
    columns.consent_recorded_at = new Date().toISOString();
  }

  if (comparison.status === "completed") {
    columns.comparison_status = "completed";
    columns.completed_at = new Date().toISOString();
  }

  if (attribution && typeof attribution === "object") {
    for (const key of [
      "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
      "referrer", "landing_page",
    ]) {
      if (attribution[key]) columns[key] = String(attribution[key]).slice(0, 500);
    }
  }

  return columns;
}

/**
 * The column PostgREST says the table does not have, or null.
 *
 * PostgREST reports an unknown column as PGRST204 with the name quoted in the
 * message: "Could not find the 'entry_context' column of 'leads' in the schema
 * cache".
 */
function missingColumnFrom(error) {
  if (!error) return null;
  const match = /Could not find the '([^']+)' column/.exec(error.message || "");
  return match ? match[1] : null;
}

/**
 * Write a lead row, dropping any column the database has not grown yet.
 *
 * Deploying the app and running a migration are two separate steps, and in
 * whichever order they happen there is a window where this code writes a column
 * the table does not have. Without this, every lead captured in that window is
 * lost to a 500 — instead of being saved minus one analytics field and enriched
 * on the next write. Bounded retries, and only for columns this payload
 * actually carries, so a genuine failure still surfaces as a failure.
 */
async function writeLeadRow(payload, run) {
  let attempt = { ...payload };

  for (let i = 0; i < 4; i += 1) {
    const result = await run(attempt);
    const missing = missingColumnFrom(result.error);
    if (!missing || !(missing in attempt)) return result;

    console.warn(`Lead write: dropping unknown column "${missing}" — migration not applied yet`);
    delete attempt[missing];
  }

  return run(attempt);
}

/**
 * Routes whose destination is a lead buyer.
 *
 * `affiliate` monetizes through the outbound click instead, and `concierge`
 * is handled by a human, so neither is offered for sale. Sending an affiliate
 * lead to a broker as well would sell a customer twice for one intention.
 */
const SELLABLE_ROUTES = new Set([
  "residential_partner",
  "commercial_partner",
  "renewable_partner",
]);

/**
 * States that record something that already happened, and must not be
 * overwritten by a later routing attempt that finds nothing left to do.
 */
const TERMINAL_MONETIZATION = new Set(["delivered", "queued", "sold", "rejected"]);

/**
 * Offer a finished lead to a buyer, if it is one we may sell.
 *
 * Three gates, all of which must pass:
 *
 *   CONSENT      the customer explicitly agreed to be contacted. Selling
 *                contact details without it is not a bug, it is a breach — so
 *                this is checked here rather than trusted from upstream.
 *   COMPLETED    a half-finished comparison is not a qualified lead, and a
 *                buyer charged for one will stop buying.
 *   SELLABLE     the router put it on a partner route.
 *
 * Never throws. A capture that succeeded must not turn into a 500 because a
 * buyer's webhook was down — the lead is saved, visible in admin, and an
 * operator can forward it by hand.
 */
async function maybeRouteLead(lead) {
  try {
    if (!lead?.id) return;
    if (lead.consent_contact !== true) return;
    if (lead.comparison_status !== "completed") return;
    if (!SELLABLE_ROUTES.has(lead.monetization_route)) return;

    const result = await routeLead(supabase, lead, lead.monetization_route, { sendEmail });

    // Record where it went on the lead itself, so the admin list can show the
    // outcome without joining deliveries for every row.
    if (result.delivered && result.buyer) {
      await supabase
        .from("leads")
        .update({
          assigned_partner: result.buyer.name,
          monetization_status: result.status === "delivered" ? "delivered" : "queued",
        })
        .eq("id", lead.id);
    } else if (!result.buyer && !TERMINAL_MONETIZATION.has(lead.monetization_status)) {
      // Nobody is configured to take it. Recorded as a state rather than left
      // blank, because "no buyer covers this market" is a signal an admin acts
      // on, and an empty field looks identical to "not tried yet".
      //
      // Guarded, because this runs on EVERY enrichment write. Once a lead has
      // been delivered, the only remaining buyer is one already excluded as a
      // duplicate, so the next write would find no match and downgrade a sold
      // lead to "no_buyer" — erasing the sale from the admin list.
      await supabase
        .from("leads")
        .update({ monetization_status: "no_buyer" })
        .eq("id", lead.id);
    }
  } catch (error) {
    console.error("Lead routing failed (lead is saved):", error?.message || error);
  }
}

async function handleCreateLead(req, res) {
  try {
    const {
      email, zip, name, source, source_page, city,
      phone, first_name, last_name, comparison, attribution,
    } = req.body;

    // Server-side validation is authoritative. The browser runs the same
    // module for inline UX, but nothing it sends is trusted: a lead reaching
    // this endpoint with a malformed phone number or an unnormalized email
    // would otherwise be persisted exactly as posted.
    const contact = validateContact(
      { firstName: first_name, lastName: last_name, email, phone },
      { require: ["email"] }
    );
    if (!contact.valid) {
      return res.status(400).json({ error: "Invalid contact details", fields: contact.errors });
    }

    if (!source) {
      return res.status(400).json({ error: "Email and source are required" });
    }

    const resolvedState = resolveState(zip);

    const { data: existingLead } = await supabase
      .from("leads")
      .select("id, status")
      .eq("email", contact.values.email)
      .maybeSingle();

    if (existingLead) {
      if (existingLead.status === "unsubscribed") {
        return res.status(200).json({
          success: true,
          message: "Thank you! We already have your information on file.",
          duplicate: true,
        });
      }
      // Progressive enrichment: the comparison engine calls this repeatedly as
      // the visitor answers more questions, so the same row gains detail
      // instead of a second row appearing.
      const updateData = mapComparisonColumns(comparison, attribution);
      if (zip) updateData.zip = zip;
      const displayName = contact.fullName || name || null;
      if (displayName) updateData.name = displayName;
      if (contact.values.firstName) updateData.first_name = contact.values.firstName;
      if (contact.values.lastName) updateData.last_name = contact.values.lastName;
      if (contact.values.phone) updateData.phone = contact.values.phone;
      if (city) updateData.city = city;
      if (resolvedState) updateData.state = resolvedState;
      if (source_page) updateData.source_page = source_page;
      updateData.last_activity_at = new Date().toISOString();

      const { data: updatedLead } = await writeLeadRow(updateData, (row) =>
        supabase.from("leads").update(row).eq("id", existingLead.id).select().single()
      );

      // Enrichment is where a lead usually becomes sellable: the visitor
      // finishes the comparison and consents on a later write, not the first
      // one. Routing only on insert would mean the qualified leads — the ones
      // worth money — were the exact ones never offered to a buyer.
      if (updatedLead) await maybeRouteLead(updatedLead);

      return res.status(200).json({
        success: true,
        message: "Thank you! We already have your information on file.",
        duplicate: true,
      });
    }

    const { data: lead, error: insertError } = await writeLeadRow(
      {
        ...mapComparisonColumns(comparison, attribution),
        email: contact.values.email,
        zip: zip || null,
        name: contact.fullName || name || null,
        first_name: contact.values.firstName,
        last_name: contact.values.lastName,
        phone: contact.values.phone,
        city: city || null,
        state: resolvedState || null,
        source,
        source_page: source_page || source,
        status: "new",
        last_activity_at: new Date().toISOString(),
      },
      (row) => supabase.from("leads").insert(row).select().single()
    );

    if (insertError) {
      console.error("Lead insert error:", insertError);
      return res.status(500).json({ error: "Failed to save lead" });
    }

    // Send rate alerts confirmation or generic welcome based on source
    const isRateAlerts = source === 'rate_alerts';
    const welcomeTemplate = isRateAlerts
      ? rateAlertsConfirmationEmail(lead.email, lead.name, lead.zip)
      : leadWelcomeEmail(lead.email, lead.name);
    await sendEmail({
      to: lead.email,
      subject: welcomeTemplate.subject,
      html: welcomeTemplate.html,
      idempotencyKey: isRateAlerts ? `rate_alerts_confirm_${lead.id}` : `lead_welcome_${lead.id}`,
      eventType: isRateAlerts ? "rate_alerts_confirmation" : "lead_welcome",
      leadId: lead.id,
    });

    if (ADMIN_EMAILS.length > 0) {
      const adminTemplate = adminNewLeadEmail(lead);
      await sendEmail({
        to: ADMIN_EMAILS,
        subject: adminTemplate.subject,
        html: adminTemplate.html,
        idempotencyKey: `admin_new_lead_${lead.id}`,
        eventType: "admin_new_lead",
        leadId: lead.id,
      });
    }

    // A lead that arrives already complete and consented — a single-shot
    // submission rather than a progressive one — is sellable immediately.
    await maybeRouteLead(lead);

    return res.status(200).json({
      success: true,
      message: "Thank you! Check your email for next steps.",
    });
  } catch (error) {
    console.error("Leads API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ─── Concierge and commercial quote submissions ───

/** Bounded text bound for the database. */
function text(value, max = 500) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

/**
 * A concierge request.
 *
 * Submitted through the server rather than straight from the browser so that
 * three things happen that could not happen client-side: the customer gets a
 * confirmation, an admin is told a revenue-bearing request has arrived, and a
 * matching row lands in `leads` so the request appears in the one place an
 * operator looks for everything that came in.
 */
async function handleConcierge(req, res) {
  try {
  const body = req.body || {};

  // The whole name goes through the full-name rule, not the first-name one.
  // Passing "John A. Smith" to validateFirstName rejected it, so a very common
  // way of writing a name could never submit this form at all.
  const name = validateFullName(body.full_name);
  const contact = validateContact(
    { email: body.email, phone: body.phone },
    { require: ["email"] }
  );
  if (!name.valid || !contact.valid) {
    // The specific field errors travel back so the form can say which one is
    // wrong, instead of a blanket "invalid contact details".
    return res.status(400).json({
      error: name.error || "Please check the details you entered.",
      fields: { ...contact.errors, ...(name.valid ? {} : { full_name: name.error }) },
    });
  }

  // These three are NOT NULL on the table. Checked here so the customer gets a
  // usable message rather than a constraint violation surfaced as "something
  // went wrong".
  const fullName = name.value;
  const newAddress = text(body.new_address, 300);
  const zip = text(body.zip_code, 10);
  const missing = [];
  if (!fullName) missing.push("full_name");
  if (!newAddress) missing.push("new_address");
  if (!zip) missing.push("zip_code");
  if (missing.length) {
    return res.status(400).json({
      error: "Name, the address you are moving to, and a ZIP code are all required.",
      fields: missing,
    });
  }

  const row = {
    full_name: fullName,
    email: contact.values.email,
    phone: contact.values.phone,
    new_address: newAddress,
    city: text(body.city, 120),
    state: text(body.state, 2) || resolveState(zip),
    zip_code: zip,
    move_in_date: body.move_in_date || null,
    property_type: text(body.property_type, 40) || "house",
    services_requested: Array.isArray(body.services_requested) ? body.services_requested : ["electricity"],
    electricity_preference: text(body.electricity_preference, 60),
    internet_speed: text(body.internet_speed, 60),
    monthly_budget: text(body.monthly_budget, 60),
    special_instructions: text(body.special_instructions, 2000),
    wants_home_security: body.wants_home_security === true,
    wants_home_insurance: body.wants_home_insurance === true,
    wants_moving_service: body.wants_moving_service === true,
    wants_home_warranty: body.wants_home_warranty === true,
    status: "new",
    source: "website",
    utm_source: text(body.utm_source, 80),
    utm_medium: text(body.utm_medium, 80),
    utm_campaign: text(body.utm_campaign, 80),
  };

  const { data: request, error } = await supabase
    .from("concierge_requests")
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error("Concierge insert failed:", error.message);
    return res.status(500).json({ error: "Could not save your request. Please try again." });
  }

  // The lead row is what makes a concierge request visible alongside every
  // other lead. Non-fatal: the request itself is already safely stored.
  await upsertLeadFromSubmission({
    email: request.email,
    name: request.full_name,
    first_name: name.firstName,
    last_name: name.lastName,
    zip: request.zip_code,
    city: request.city,
    state: request.state,
    phone: request.phone,
    source: "concierge",
    source_page: "concierge",
    monetization_route: "concierge",
  });

  await notify({
    adminTemplate: adminConciergeRequestEmail(request),
    customerTemplate: conciergeConfirmationEmail(request),
    to: request.email,
    key: `concierge_${request.id}`,
    eventType: "concierge_request",
  });

  return res.status(200).json({ success: true, id: request.id });
  } catch (error) {
    console.error("Concierge submission failed:", error);
    return res.status(500).json({ error: "Something went wrong saving your request. Please try again." });
  }
}

/**
 * A commercial quote request.
 *
 * Same reasoning as concierge, and more urgent: commercial is the highest-value
 * segment, and these submissions were reaching nobody.
 */
async function handleBusinessQuote(req, res) {
  try {
  const body = req.body || {};

  const name = validateFullName(body.contact_name);
  const contact = validateContact(
    { email: body.email, phone: body.phone },
    { require: ["email"] }
  );
  if (!name.valid || !contact.valid) {
    return res.status(400).json({
      error: name.error || "Please check the details you entered.",
      fields: { ...contact.errors, ...(name.valid ? {} : { contact_name: name.error }) },
    });
  }

  const businessName = text(body.business_name, 200);
  if (!businessName) {
    return res.status(400).json({ error: "A business name is required." });
  }
  const contactName = name.value;

  // zip_code is TEXT NOT NULL on custom_business_quotes and the form does not
  // require it, so a blank one reached the database and came back as an
  // unactionable 500 every time. Checked here, where the message can say so.
  const zip = text(body.zip_code, 10);
  if (!zip) {
    return res.status(400).json({
      error: "A service ZIP code is required so we can find suppliers for your area.",
      fields: { zip_code: "Enter the ZIP code where the business takes supply." },
    });
  }
  const row = {
    business_name: businessName,
    contact_name: contactName,
    email: contact.values.email,
    phone: contact.values.phone,
    zip_code: zip,
    business_type: text(body.business_type, 80),
    industry_type: text(body.industry_type, 80),
    monthly_usage: text(body.monthly_usage, 40),
    peak_demand: text(body.peak_demand, 40),
    peak_demand_hours: text(body.peak_demand_hours, 80),
    number_of_locations: text(body.number_of_locations, 10) || "1",
    current_supplier: text(body.current_supplier, 120),
    contract_end_date: text(body.contract_end_date, 40),
    current_rate: text(body.current_rate, 40),
    energy_goals: Array.isArray(body.energy_goals) ? body.energy_goals : [],
    bill_file_url: text(body.bill_file_url, 500),
    status: "pending",
  };

  const { data: quote, error } = await supabase
    .from("custom_business_quotes")
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error("Business quote insert failed:", error.message);
    return res.status(500).json({ error: "Could not save your request. Please try again." });
  }

  await upsertLeadFromSubmission({
    email: quote.email,
    name: quote.contact_name,
    first_name: name.firstName,
    last_name: name.lastName,
    zip: quote.zip_code,
    state: resolveState(quote.zip_code),
    phone: quote.phone,
    source: "business_quote",
    source_page: "business_quote",
    customer_type: "commercial",
    business_name: quote.business_name,
    business_type: quote.business_type,
    monetization_route: "commercial_partner",
  });

  await notify({
    adminTemplate: adminBusinessQuoteEmail(quote),
    customerTemplate: businessQuoteConfirmationEmail(quote),
    to: quote.email,
    key: `business_quote_${quote.id}`,
    eventType: "business_quote",
  });

  return res.status(200).json({ success: true, id: quote.id });
  } catch (error) {
    console.error("Business quote submission failed:", error);
    return res.status(500).json({ error: "Something went wrong sending your request. Please try again." });
  }
}

/**
 * Mirror a submission into `leads`.
 *
 * Concierge requests and commercial quotes are leads by any useful definition,
 * and an operator should not have to check three screens to see everything that
 * arrived today. Upserted on email so a visitor who fills in two forms is one
 * person, and only non-empty values are written so a later submission cannot
 * blank out detail an earlier one captured.
 */
async function upsertLeadFromSubmission(fields) {
  try {
    const row = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== null && v !== undefined && v !== "")
    );
    row.last_activity_at = new Date().toISOString();

    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("email", row.email)
      .maybeSingle();

    if (existing) {
      await writeLeadRow(row, (r) => supabase.from("leads").update(r).eq("id", existing.id));
    } else {
      await writeLeadRow({ ...row, status: "new" }, (r) => supabase.from("leads").insert(r));
    }
  } catch (error) {
    // The submission is already stored; a missing mirror row is a reporting
    // gap, not a lost customer.
    console.error("Lead mirror failed:", error?.message || error);
  }
}

/**
 * Tell the customer and tell the team.
 *
 * Never throws: a submission that was saved must return success even if the
 * mail provider is down, or the visitor sees an error for something that
 * actually worked and submits again.
 */
async function notify({ adminTemplate, customerTemplate, to, key, eventType }) {
  try {
    if (customerTemplate && to) {
      await sendEmail({
        to,
        subject: customerTemplate.subject,
        html: customerTemplate.html,
        idempotencyKey: `${key}_confirmation`,
        eventType: `${eventType}_confirmation`,
      });
    }
    if (adminTemplate && ADMIN_EMAILS.length > 0) {
      await sendEmail({
        to: ADMIN_EMAILS,
        subject: adminTemplate.subject,
        html: adminTemplate.html,
        idempotencyKey: `${key}_admin`,
        eventType: `admin_${eventType}`,
      });
    }
  } catch (error) {
    console.error(`Notification failed for ${eventType}:`, error?.message || error);
  }
}

// ─── Main Handler (routes by action query param) ───

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const action = req.query.action || req.body?.action || "create";
  const isFollowUp = action === "follow-up" || action === "followup";

  // Vercel Cron invokes with GET. Only the scheduled action accepts it, and it
  // still has to present the cron secret — without this the nightly follow-up
  // pass would have 405'd every night and nobody would have been told.
  if (req.method !== "POST" && !(req.method === "GET" && isFollowUp)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (isFollowUp) {
    return handleFollowUp(req, res);
  }
  if (action === "concierge") {
    return handleConcierge(req, res);
  }
  if (action === "business-quote") {
    return handleBusinessQuote(req, res);
  }

  return handleCreateLead(req, res);
}
