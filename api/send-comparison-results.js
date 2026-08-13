import {
  supabase,
  sendEmail,
  APP_BASE_URL,
  LOGO_HEADER_URL,
  LOGO_EMAIL_HEADER_URL,
} from "./_lib/email.js";
import { runComparison } from "./_lib/comparison.js";
import {
  selectHeadline,
  describeResultPrice,
  pricingCaveatText,
  withResultPlacement,
  RESULT_SECTIONS,
} from "../src/components/compare/engine/resultsContract.js";

/**
 * Send comparison results by email.
 *
 * This endpoint used to price plans itself. It took whatever the browser posted
 * and computed `rate × usage + base charge` — a third pricing algorithm, after
 * the one on the page and the one in the engine — which ignored utility
 * delivery charges, bill credits and credit thresholds entirely. It then
 * ordered the cards by the array the browser sent, badged position 0 as TOP
 * PICK, and linked each one to a `plan.affiliateUrl` the browser supplied.
 *
 * Every one of those was a way for the inbox to disagree with the website, and
 * the last was a way for a crafted request to put an attacker's URL behind an
 * ElectricScouts "Get this plan" button in an email we send and sign.
 *
 * Now the request carries a reference to a comparison — where, what for, how
 * much they use — and the results are recomputed here through the same service
 * /api/comparison calls. Same catalog, same prices, same completeness, same
 * ranking, same savings, same tracked routes. Client-supplied economics are not
 * validated and rejected; they are never read.
 */

/** Escape untrusted text before it is interpolated into the email HTML. */
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const MONEY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/** How many results an email carries. Beyond this it stops being readable. */
const MAX_EMAIL_RESULTS = 6;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, name, zipCode, cityName, comparisonType } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const type = ['residential', 'business', 'renewable'].includes(comparisonType)
      ? comparisonType
      : 'residential';

    // ── Recompute the comparison, server-side ──
    //
    // The legacy quote pages describe their audience with a `comparisonType`
    // rather than the engine's own fields, so it is translated here. Renewable
    // is a residential product with a stated preference, not a third audience.
    const { ok, comparison, error: comparisonError } = await runComparison(
      supabase,
      {
        zip: zipCode,
        state: req.body?.state,
        customerType: type === 'business' ? 'commercial' : 'residential',
        energyPreference: type === 'renewable' ? 'renewable' : req.body?.energyPreference,
        shoppingIntent: req.body?.shoppingIntent,
        usageRange: req.body?.usageRange,
        monthlyUsageKwh: req.body?.monthlyUsage ?? req.body?.monthlyUsageKwh,
        monthlyCost: req.body?.monthlyCost,
        billAnalysisStatus: req.body?.billAnalysisStatus,
        billConfidence: req.body?.billConfidence,
        unverifiedFields: req.body?.unverifiedFields,
        sessionId: req.body?.sessionId,
        entryContext: req.body?.entryContext,
        attribution: req.body?.attribution,
      },
      // Absolute, because a relative href is dead in an inbox.
      { baseUrl: APP_BASE_URL }
    );

    if (!ok) {
      console.error("comparison for email failed:", comparisonError);
      return res.status(comparisonError === 'catalog_unavailable' ? 502 : 400).json({
        error: comparisonError === 'catalog_unavailable'
          ? "We couldn't load plans right now. Please try again."
          : "We couldn't work out which plans to send. Please check your ZIP code.",
      });
    }

    // ── Which results to send ──
    //
    // A client may name the plans it was looking at, which is what makes the
    // email match a filtered view of the page. That list can only ever narrow
    // the authoritative set — an id that is not in it (inactive, out of state,
    // invented) selects nothing — and the order stays the server's.
    const requestedIds = Array.isArray(req.body?.planIds)
      ? new Set(req.body.planIds.filter((id) => typeof id === 'string').slice(0, 50))
      : null;

    const pool = requestedIds?.size
      ? comparison.results.filter((r) => requestedIds.has(r.planId))
      : comparison.results;

    // The same headline selection the page makes, so the Top 3 in the inbox is
    // the Top 3 on screen rather than a re-sort by advertised rate.
    const { headline, rest } = selectHeadline(pool);
    const sending = [...headline, ...rest].slice(0, MAX_EMAIL_RESULTS);

    if (sending.length === 0) {
      return res.status(400).json({ error: "No plans to send" });
    }

    const usage = comparison.usageKwh;
    const firstName = name ? String(name).split(' ')[0].slice(0, 60) : '';
    const year = new Date().getFullYear();
    const unsubUrl = `${APP_BASE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}`;

    // Type-specific styling.
    //
    // Every "compare more" CTA points at /compare-rates. The old per-type URLs
    // sent customers into the duplicate quote engines, whose results are priced
    // by a different path than the ones in the email they just read.
    const typeConfig = {
      residential: {
        label: 'Residential',
        headerBg: 'linear-gradient(135deg,#0A5C8C,#084a6f)',
        accentColor: '#0A5C8C',
        emoji: '🏠',
        subtitle: 'Residential Electricity Plans',
      },
      business: {
        label: 'Business',
        headerBg: 'linear-gradient(135deg,#0A5C8C,#1e3a5f)',
        accentColor: '#0A5C8C',
        emoji: '🏢',
        subtitle: 'Business Electricity Plans',
      },
      renewable: {
        label: 'Renewable',
        headerBg: 'linear-gradient(135deg,#059669,#047857)',
        accentColor: '#059669',
        emoji: '🌿',
        subtitle: 'Green Energy Plans',
      },
    };

    const config = typeConfig[type];
    const compareUrl = `${APP_BASE_URL}/compare-rates${zipCode ? `?zip=${encodeURIComponent(zipCode)}` : ''}`;

    // Build plan cards from the authoritative results
    const plansHtml = sending.map((result, index) => {
      const isHeadline = headline.some((h) => h.planId === result.planId);
      const section = isHeadline ? RESULT_SECTIONS.TOP_MATCH : RESULT_SECTIONS.MORE_OPTIONS;
      const href = withResultPlacement(result.trackedOutboundRoute, section, index + 1);

      const price = describeResultPrice(result);
      const caveat = pricingCaveatText(result);

      const bestBadge = index === 0
        ? `<div style="background:#FF6B35;color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:4px;display:inline-block;margin-bottom:8px;">⭐ TOP PICK</div><br/>`
        : '';

      const renewableBadge = Number(result.renewablePercentage) >= 50
        ? `<div style="color:#059669;font-size:13px;margin-top:6px;">🌿 ${esc(result.renewablePercentage)}% Renewable</div>`
        : '';

      const contractText = result.termMonths > 0 ? `${esc(result.termMonths)} mo term` : 'Variable';

      // Savings appears only when the server produced one. A partial estimate
      // never yields a difference, so the email cannot claim a saving the page
      // is withholding.
      const savingsLine = result.monthlyDifference === null
        ? ''
        : result.differenceDirection === 'saving'
          ? `<div style="color:#0A7C52;font-size:13px;font-weight:600;margin-top:6px;">Potential savings: $${Math.abs(result.monthlyDifference).toFixed(0)}/mo</div>`
          : result.differenceDirection === 'costlier'
            ? `<div style="color:#b45309;font-size:13px;font-weight:600;margin-top:6px;">About $${Math.abs(result.monthlyDifference).toFixed(0)}/mo more than your current bill</div>`
            : `<div style="color:#6b7280;font-size:13px;margin-top:6px;">About the same as your current bill</div>`;

      const priceBlock = price
        ? `<div style="font-size:13px;color:#6b7280;margin-top:8px;">${price.basis === 'supply' ? 'Est. Supply' : 'Est. Monthly'}</div>
           <div style="font-size:17px;font-weight:700;color:#1a1a1a;">${MONEY.format(price.amount)}</div>`
        : '';

      const ctaCell = href
        ? `<table cellpadding="0" cellspacing="0" style="margin-top:14px;" width="100%">
             <tr><td style="background:#FF6B35;border-radius:6px;text-align:center;padding:12px 20px;">
               <a href="${esc(href)}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;display:block;">Get This Plan →</a>
             </td></tr>
           </table>`
        // No referral link configured for this provider yet.
        //
        // The results board already handles this by routing to the concierge
        // handover carrying the chosen plan, and the email now does the same
        // rather than saying "coming soon" — a promise with no date attached,
        // offering the customer no way to act on the plan they just picked.
        // Only identifiers travel in the URL; no name, email or address.
        : (() => {
            const params = new URLSearchParams({ from: "email_no_route" });
            if (result.planId) params.set("plan", String(result.planId));
            if (result.providerName) params.set("provider", String(result.providerName));
            const conciergeUrl = `${APP_BASE_URL}/home-concierge?${params.toString()}`;
            return `<table cellpadding="0" cellspacing="0" style="margin-top:14px;" width="100%">
             <tr><td style="border:1px solid #FF6B35;border-radius:6px;text-align:center;padding:11px 20px;">
               <a href="${esc(conciergeUrl)}" style="color:#FF6B35;text-decoration:none;font-weight:600;font-size:15px;display:block;">Request this plan →</a>
             </td></tr>
           </table>`;
          })();

      return `
        <tr><td style="padding:8px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:${index === 0 ? '2px solid #FF6B35' : '1px solid #e5e7eb'};border-radius:10px;overflow:hidden;">
            <tr><td style="padding:18px;">
              ${bestBadge}
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:top;width:55%;">
                    <div style="font-size:17px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">${esc(result.providerName || 'Provider')}</div>
                    <div style="font-size:14px;color:#6b7280;margin-bottom:8px;">${esc(result.planName || 'Plan')}</div>
                    ${result.rateType ? `<div style="background:#f3f4f6;color:#374151;font-size:12px;font-weight:600;padding:3px 10px;border-radius:10px;display:inline-block;margin-bottom:4px;">${esc(result.rateType)}</div>` : ''}
                    ${result.matchScore ? `<div style="font-size:12.5px;color:#6b7280;margin-top:6px;">${esc(result.matchScore)}% match · ${esc(result.matchLabel || '')}</div>` : ''}
                    ${renewableBadge}
                    ${savingsLine}
                  </td>
                  <td style="vertical-align:top;text-align:right;width:45%;">
                    <div style="font-size:13px;color:#6b7280;">Rate</div>
                    <div style="font-size:22px;font-weight:700;color:${config.accentColor};">${esc(result.ratePerKwh)}¢<span style="font-size:14px;font-weight:400;">/kWh</span></div>
                    ${priceBlock}
                    <div style="font-size:13px;color:#6b7280;margin-top:4px;">${contractText}</div>
                  </td>
                </tr>
              </table>
              ${caveat ? `<div style="margin-top:10px;font-size:12px;color:#b45309;">${esc(caveat)}</div>` : ''}
              ${ctaCell}
            </td></tr>
          </table>
        </td></tr>`;
    }).join('');

    // Summary figures, read off the authoritative results — never recomputed.
    const rates = sending.map((r) => Number(r.ratePerKwh)).filter(Number.isFinite);
    const lowestRate = rates.length ? Math.min(...rates) : null;
    const bestPrice = describeResultPrice(sending[0]);
    const planCount = comparison.counts.eligible;

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:20px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
            
            <!-- Header -->
            <tr><td style="background-color:${config.accentColor};background:${config.headerBg};padding:24px 30px;border-radius:12px 12px 0 0;text-align:center;">
              <img src="${LOGO_EMAIL_HEADER_URL}" alt="Electric Scouts" width="200" height="42" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
              <div style="font-size:14px;color:#ffffff;margin-top:8px;font-weight:600;">${config.emoji} ${config.subtitle}</div>
            </td></tr>

            <!-- Body -->
            <tr><td style="background:#fff;padding:30px;">
              
              <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 8px;">${firstName ? `Hi ${esc(firstName)},` : 'Hi there,'}</p>
              <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 20px;">
                Here are your personalized ${config.label.toLowerCase()} electricity plan recommendations for <strong>${esc(cityName || 'your area')}</strong> (${esc(zipCode || 'N/A')}).
              </p>

              <!-- Summary Stats -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="33%" style="padding:0 6px 0 0;vertical-align:top;">
                    <div style="background:#f0f9ff;border-radius:10px;padding:16px;text-align:center;">
                      <div style="font-size:13px;color:#6b7280;margin-bottom:6px;">Plans Found</div>
                      <div style="font-size:28px;font-weight:700;color:${config.accentColor};">${planCount}</div>
                      <div style="font-size:12px;color:#6b7280;">${config.label}</div>
                    </div>
                  </td>
                  <td width="33%" style="padding:0 3px;vertical-align:top;">
                    <div style="background:#f0fdf4;border-radius:10px;padding:16px;text-align:center;">
                      <div style="font-size:13px;color:#6b7280;margin-bottom:6px;">Lowest Rate</div>
                      <div style="font-size:28px;font-weight:700;color:#059669;">${lowestRate === null ? '—' : `${lowestRate.toFixed(1)}¢`}</div>
                      <div style="font-size:12px;color:#6b7280;">per kWh</div>
                    </div>
                  </td>
                  <td width="33%" style="padding:0 0 0 6px;vertical-align:top;">
                    <div style="background:#fff7ed;border-radius:10px;padding:16px;text-align:center;">
                      <div style="font-size:13px;color:#6b7280;margin-bottom:6px;">${bestPrice?.basis === 'supply' ? 'Top Match Supply' : 'Top Match Est.'}</div>
                      <div style="font-size:28px;font-weight:700;color:#FF6B35;">${bestPrice ? MONEY.format(bestPrice.amount) : '—'}</div>
                      <div style="font-size:12px;color:#6b7280;">@ ${Math.round(usage).toLocaleString()} kWh</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Recommended Plans -->
              <div style="font-size:17px;font-weight:700;color:#1a1a1a;margin-bottom:12px;">⚡ Top ${config.label} Plans For You</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${plansHtml}
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px;">
                <tr><td style="background:${config.accentColor};border-radius:8px;text-align:center;padding:14px 24px;">
                  <a href="${esc(compareUrl)}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;display:block;">Compare All ${config.label} Plans →</a>
                </td></tr>
              </table>

              <p style="color:#9ca3af;font-size:13px;margin-top:24px;text-align:center;line-height:1.6;">
                Estimates use ${Math.round(usage).toLocaleString()} kWh monthly usage and the plan components we hold — energy charge, base charge, delivery and bill credits where available. Where delivery charges are not published for a plan we say so rather than leaving them out silently. Verify all details with the provider before enrolling.
              </p>
            </td></tr>

            <!-- Branded Footer -->
            <tr><td style="padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #e5e7eb;">
                <!-- Logo -->
                <tr><td style="padding:28px 30px 12px;text-align:center;">
                  <a href="${APP_BASE_URL}" style="text-decoration:none;display:inline-block;">
                    <img src="${LOGO_HEADER_URL}" alt="Electric Scouts" width="200" height="41" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
                  </a>
                  <p style="margin:12px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
                    Compare electricity rates from 40+ providers.<br/>Save up to $800/year.
                  </p>
                </td></tr>
                <!-- Social Icons -->
                <tr><td style="padding:20px 30px;text-align:center;">
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                    <tr>
                      <td style="padding:0 10px;">
                        <a href="https://facebook.com/electricscouts" style="text-decoration:none;display:inline-block;">
                          <table cellpadding="0" cellspacing="0"><tr><td style="background:#0A5C8C;border-radius:50%;width:40px;height:40px;text-align:center;vertical-align:middle;">
                            <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" width="20" height="20" style="display:block;margin:0 auto;filter:brightness(0) invert(1);" />
                          </td></tr></table>
                        </a>
                      </td>
                      <td style="padding:0 10px;">
                        <a href="https://x.com/electricscouts" style="text-decoration:none;display:inline-block;">
                          <table cellpadding="0" cellspacing="0"><tr><td style="background:#0A5C8C;border-radius:50%;width:40px;height:40px;text-align:center;vertical-align:middle;">
                            <img src="https://cdn-icons-png.flaticon.com/512/5968/5968958.png" alt="X" width="20" height="20" style="display:block;margin:0 auto;filter:brightness(0) invert(1);" />
                          </td></tr></table>
                        </a>
                      </td>
                      <td style="padding:0 10px;">
                        <a href="https://linkedin.com/company/electricscouts" style="text-decoration:none;display:inline-block;">
                          <table cellpadding="0" cellspacing="0"><tr><td style="background:#0A5C8C;border-radius:50%;width:40px;height:40px;text-align:center;vertical-align:middle;">
                            <img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" alt="LinkedIn" width="20" height="20" style="display:block;margin:0 auto;filter:brightness(0) invert(1);" />
                          </td></tr></table>
                        </a>
                      </td>
                      <td style="padding:0 10px;">
                        <a href="https://instagram.com/electricscouts" style="text-decoration:none;display:inline-block;">
                          <table cellpadding="0" cellspacing="0"><tr><td style="background:#0A5C8C;border-radius:50%;width:40px;height:40px;text-align:center;vertical-align:middle;">
                            <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" width="20" height="20" style="display:block;margin:0 auto;filter:brightness(0) invert(1);" />
                          </td></tr></table>
                        </a>
                      </td>
                    </tr>
                  </table>
                </td></tr>
                <!-- Quick Links -->
                <tr><td style="padding:12px 30px;text-align:center;font-size:14px;">
                  <a href="${APP_BASE_URL}/compare-rates" style="color:#0A5C8C;text-decoration:none;font-weight:600;">Compare Rates</a>
                  <span style="color:#d1d5db;margin:0 10px;">|</span>
                  <a href="${APP_BASE_URL}/bill-analyzer" style="color:#0A5C8C;text-decoration:none;font-weight:600;">Bill Analyzer</a>
                  <span style="color:#d1d5db;margin:0 10px;">|</span>
                  <a href="${APP_BASE_URL}" style="color:#0A5C8C;text-decoration:none;font-weight:600;">www.electricscouts.com</a>
                </td></tr>
                <!-- Divider -->
                <tr><td style="padding:20px 30px 0;"><div style="border-top:1px solid #e5e7eb;"></div></td></tr>
                <!-- Copyright & Opt-out -->
                <tr><td style="padding:20px 30px 28px;text-align:center;">
                  <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">© ${year} Electric Scouts. All rights reserved.</p>
                  <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">You're receiving this because you requested comparison results.</p>
                  <p style="margin:0;font-size:13px;line-height:1.6;">
                    <a href="${unsubUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
                    <span style="color:#d1d5db;margin:0 8px;">|</span>
                    <a href="${APP_BASE_URL}/privacy-policy" style="color:#6b7280;text-decoration:underline;">Privacy Policy</a>
                  </p>
                </td></tr>
              </table>
            </td></tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>`;

    // Resolve city and state from ZIP code
    const zipToState = {
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
    const stateNames = {
      'TX': 'Texas', 'OH': 'Ohio', 'PA': 'Pennsylvania', 'NY': 'New York', 'NJ': 'New Jersey',
      'MD': 'Maryland', 'IL': 'Illinois', 'CT': 'Connecticut', 'MA': 'Massachusetts',
      'ME': 'Maine', 'NH': 'New Hampshire', 'RI': 'Rhode Island'
    };
    // The comparison already resolved the market from the ZIP with the same
    // validator the questionnaire uses, so that answer is preferred over this
    // prefix table and the table is only a fallback for a request that reached
    // here with a bare state code.
    const resolvedState =
      comparison.state ||
      (zipCode ? (zipToState[String(zipCode).substring(0, 3)] || null) : null);
    const resolvedStateName = resolvedState ? stateNames[resolvedState] : null;

    // Save lead with enhanced data
    const { data: lead } = await supabase
      .from("leads")
      .upsert({
        email: email.toLowerCase().trim(),
        name: firstName || null,
        zip: zipCode || null,
        city: cityName || null,
        state: resolvedState || null,
        source: `${type}_comparison_results`,
        source_page: `${type}_results`,
        status: 'new',
        search_preferences: {
          comparisonType: type,
          monthlyUsage: usage,
          // What we actually sent, as the server ranked and priced it. Recording
          // the browser's version here was the same mistake as rendering it:
          // the lead history then disagreed with the email the customer holds.
          topPlans: headline.slice(0, 3).map((r) => ({
            name: r.planName,
            provider: r.providerName,
            rate: r.ratePerKwh,
            rank: r.rank,
            estimatedMonthlyCost: r.estimatedMonthlyCost,
            supplyEstimate: r.supplyEstimate,
            pricingCompleteness: r.pricingCompleteness,
            matchScore: r.matchScore,
          })),
          searchedAt: new Date().toISOString(),
        },
        last_activity_at: new Date().toISOString(),
      }, { onConflict: 'email' })
      .select()
      .single();

    const leadId = lead?.id || null;

    // Send the email
    const result = await sendEmail({
      to: email,
      subject: `${firstName ? firstName + ', here are your' : 'Your'} ${config.label.toLowerCase()} electricity plan options`,
      html,
      idempotencyKey: `comparison_${type}_${email}_${Date.now()}`,
      eventType: `${type}_comparison_results`,
      leadId,
    });

    if (result.success) {
      return res.status(200).json({ success: true, message: "Results sent successfully!" });
    } else {
      console.error("Failed to send comparison results email:", result.error);
      return res.status(500).json({ error: "Failed to send email. Please try again." });
    }

  } catch (error) {
    console.error("Send comparison results error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
