import {
  supabase,
  sendEmail,
  brandedFooter,
  APP_BASE_URL,
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
 * Email a bill analysis.
 *
 * This endpoint used to render whatever the browser posted. It took
 * `estimatedCost`, `annualSavings`, `savingsScore`, `overpaymentPercent` and —
 * worst of all — `affiliateUrl` straight from the request body and put them in
 * an email sent from our domain, over our logo, under a "Switch to This Plan"
 * button. Any client could therefore make Electric Scouts vouch for an
 * arbitrary saving, and put an arbitrary URL behind the button that carried it.
 *
 * It also inherited the Bill Analyzer's arithmetic, which priced supply only
 * and then subtracted it from the customer's whole bill — so even an honest
 * request produced savings overstated by roughly the utility delivery charge.
 *
 * Now the request carries a reference to a comparison — where they are, how
 * much they use, what they pay — and every figure is recomputed here through
 * the same service /api/comparison and the results page call. Client-supplied
 * economics are not validated and rejected; they are never read.
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

/** How many plans a report carries. Beyond this it stops being readable. */
const MAX_REPORT_RESULTS = 5;

/** Tone for a market-position score, matching the gauge on the page. */
function scoreTone(score) {
  if (score >= 75) return '#16a34a';
  if (score >= 50) return '#2563eb';
  if (score >= 25) return '#f59e0b';
  return '#ef4444';
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, name, zipCode, cityName } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // ── Recompute the comparison, server-side ──
    //
    // The bill figures are qualification inputs — the customer is the authority
    // on what they use and what they pay — and `parseComparisonRequest` bounds
    // them before anything is computed from them. Nothing else in the body is
    // read: a payload carrying prices, savings, scores or URLs simply does not
    // reach this calculation.
    const { ok, comparison, error: comparisonError } = await runComparison(
      supabase,
      {
        zip: zipCode,
        state: req.body?.state,
        customerType: 'residential',
        monthlyUsageKwh: req.body?.monthlyUsageKwh,
        monthlyCost: req.body?.monthlyCost,
        billAnalysisStatus: 'complete',
        billConfidence: req.body?.billConfidence,
        unverifiedFields: req.body?.unverifiedFields,
        sessionId: req.body?.sessionId,
        entryContext: 'bill_analyzer',
        attribution: req.body?.attribution,
      },
      // Absolute, because a relative href is dead in an inbox.
      { baseUrl: APP_BASE_URL }
    );

    if (!ok) {
      console.error("comparison for bill report failed:", comparisonError);
      return res.status(comparisonError === 'catalog_unavailable' ? 502 : 400).json({
        error: comparisonError === 'catalog_unavailable'
          ? "We couldn't load plans right now. Please try again."
          : "We couldn't work out which plans to send. Please check your ZIP code.",
      });
    }

    // A client may name the plans it was looking at, which is what makes the
    // email match the page. That list can only narrow the authoritative set —
    // an id that is not in it selects nothing — and the order stays the
    // server's.
    const requestedIds = Array.isArray(req.body?.planIds)
      ? new Set(req.body.planIds.filter((id) => typeof id === 'string').slice(0, 50))
      : null;

    const pool = requestedIds?.size
      ? comparison.results.filter((r) => requestedIds.has(r.planId))
      : comparison.results;

    const { headline, rest } = selectHeadline(pool);
    const sending = [...headline, ...rest].slice(0, MAX_REPORT_RESULTS);

    const usage = comparison.usageKwh;
    const benchmark = comparison.benchmark || { available: false };
    const firstName = name ? String(name).split(' ')[0].slice(0, 60) : '';
    const greeting = firstName ? `Hi ${esc(firstName)},` : 'Hi there,';

    // The current provider is the customer's own text about their own bill. It
    // is echoed back for recognition only, escaped, and never used to look
    // anything up.
    const currentProvider = String(req.body?.currentProvider || '').trim().slice(0, 120);

    // ── The one savings claim this email makes ──
    //
    // Against the cheapest plan we can price COMPLETELY at their address, on
    // the same total-bill basis as their own bill. Withheld entirely when the
    // benchmark is unavailable, which is what happens whenever their figures
    // are unconfirmed or we cannot completely price enough of their market.
    const annualSaving = benchmark.available ? benchmark.annualOverpayment : 0;

    const openingLine = annualSaving > 0
      ? `Based on the ${Math.round(usage).toLocaleString()} kWh a month you confirmed, the cheapest plan we can fully price at your address would cost about <strong style="color:#059669;">${MONEY.format(annualSaving)} a year less</strong> than your current bill.`
      : benchmark.available
        ? "Based on the figures you confirmed, nothing available at your address is cheaper than what you already pay — your current rate is competitive."
        : `Here are the plans available at your address, priced against the ${Math.round(usage).toLocaleString()} kWh a month you confirmed.`;

    const plansHtml = sending.map((result, index) => {
      const isHeadline = headline.some((h) => h.planId === result.planId);
      const section = isHeadline ? RESULT_SECTIONS.TOP_MATCH : RESULT_SECTIONS.MORE_OPTIONS;
      const href = withResultPlacement(result.trackedOutboundRoute, section, index + 1);

      const price = describeResultPrice(result);
      const caveat = pricingCaveatText(result);

      const bestBadge = index === 0
        ? `<div style="background:#FF6B35;color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:4px;display:inline-block;margin-bottom:8px;">⭐ BEST MATCH</div><br/>`
        : '';

      // Signed, and only where the server produced a figure. A plan we could
      // not fully price yields no difference, so the email cannot claim a
      // saving the page is withholding.
      const differenceLine = result.monthlyDifference === null
        ? ''
        : result.differenceDirection === 'saving'
          ? `<div style="background:#059669;color:#fff;font-size:13px;font-weight:700;padding:4px 12px;border-radius:12px;display:inline-block;margin-bottom:10px;">Save ${MONEY.format(Math.abs(result.monthlyDifference))}/mo</div>`
          : result.differenceDirection === 'costlier'
            ? `<div style="color:#b45309;font-size:13px;font-weight:600;margin-bottom:10px;">About ${MONEY.format(Math.abs(result.monthlyDifference))}/mo more than your current bill</div>`
            : `<div style="color:#6b7280;font-size:13px;margin-bottom:10px;">About the same as your current bill</div>`;

      const renewableBadge = result.isRenewable
        ? `<div style="color:#059669;font-size:13px;margin-top:6px;">🌿 ${result.renewablePercentage > 0 ? `${esc(result.renewablePercentage)}% Renewable` : 'Renewable supply'}</div>`
        : '';

      const priceBlock = price
        ? `<div style="font-size:13px;color:#6b7280;margin-top:8px;">${price.basis === 'supply' ? 'Est. supply' : 'Est. monthly'}</div>
           <div style="font-size:17px;font-weight:700;color:#1a1a1a;">${MONEY.format(price.amount)}</div>`
        : '';

      // No referral route configured for this provider: hand over to a human
      // rather than rendering a button that goes nowhere. Only identifiers
      // travel in the URL — no name, email or address.
      const ctaHref = href || (() => {
        const params = new URLSearchParams({ from: "bill_report_no_route" });
        if (result.planId) params.set("plan", String(result.planId));
        if (result.providerName) params.set("provider", String(result.providerName));
        return `${APP_BASE_URL}/home-concierge?${params.toString()}`;
      })();

      return `
        <tr><td style="padding:8px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:${index === 0 ? '2px solid #FF6B35' : '1px solid #e5e7eb'};border-radius:10px;overflow:hidden;">
            <tr><td style="padding:18px;">
              ${bestBadge}
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:top;width:58%;">
                    <div style="font-size:17px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">${esc(result.providerName || 'Provider')}</div>
                    <div style="font-size:14px;color:#6b7280;margin-bottom:8px;">${esc(result.planName || 'Plan')}</div>
                    ${differenceLine}
                    ${result.matchScore !== null ? `<div style="font-size:12.5px;color:#6b7280;">${esc(result.matchScore)}% match · ${esc(result.matchLabel || '')}</div>` : ''}
                    ${renewableBadge}
                  </td>
                  <td style="vertical-align:top;text-align:right;width:42%;">
                    <div style="font-size:13px;color:#6b7280;">Rate</div>
                    <div style="font-size:22px;font-weight:700;color:#0A5C8C;">${esc(result.ratePerKwh)}¢<span style="font-size:14px;font-weight:400;">/kWh</span></div>
                    ${priceBlock}
                    <div style="font-size:13px;color:#6b7280;margin-top:4px;">${result.termMonths > 0 ? `${esc(result.termMonths)} mo term` : 'Variable'}</div>
                  </td>
                </tr>
              </table>
              ${caveat ? `<div style="margin-top:10px;font-size:12px;color:#b45309;">${esc(caveat)}</div>` : ''}
              <table cellpadding="0" cellspacing="0" style="margin-top:14px;" width="100%">
                <tr><td style="background:${href ? '#FF6B35' : '#ffffff'};border:1px solid #FF6B35;border-radius:6px;text-align:center;padding:${href ? '12px 20px' : '11px 20px'};">
                  <a href="${esc(ctaHref)}" style="color:${href ? '#ffffff' : '#FF6B35'};text-decoration:none;font-weight:600;font-size:15px;display:block;">${href ? 'View this plan →' : 'Request this plan →'}</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>`;
    }).join('');

    // ── Summary tiles, read off the authoritative comparison ──
    const benchmarkTiles = benchmark.available
      ? `
        <td width="33%" style="padding:0 6px 0 0;vertical-align:top;">
          <div style="background:#f0f9ff;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:13px;color:#6b7280;margin-bottom:6px;">Your rate vs market</div>
            <div style="font-size:32px;font-weight:700;color:${scoreTone(benchmark.score)};">${benchmark.score}</div>
            <div style="font-size:12px;color:${scoreTone(benchmark.score)};font-weight:600;">${esc(benchmark.label)}</div>
          </div>
        </td>
        <td width="33%" style="padding:0 3px;vertical-align:top;">
          <div style="background:#fff7ed;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:13px;color:#6b7280;margin-bottom:6px;">Above best plan</div>
            <div style="font-size:32px;font-weight:700;color:${benchmark.overpaymentPercent > 20 ? '#ef4444' : benchmark.overpaymentPercent > 10 ? '#f59e0b' : '#2563eb'};">${benchmark.overpaymentPercent.toFixed(0)}%</div>
            <div style="font-size:12px;color:#6b7280;">vs cheapest available</div>
          </div>
        </td>
        <td width="33%" style="padding:0 0 0 6px;vertical-align:top;">
          <div style="background:#f0fdf4;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:13px;color:#6b7280;margin-bottom:6px;">Potential saving</div>
            <div style="font-size:32px;font-weight:700;color:#059669;">${MONEY.format(annualSaving)}</div>
            <div style="font-size:12px;color:#6b7280;">per year</div>
          </div>
        </td>`
      : `
        <td width="50%" style="padding:0 6px 0 0;vertical-align:top;">
          <div style="background:#f0f9ff;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:13px;color:#6b7280;margin-bottom:6px;">Plans at your address</div>
            <div style="font-size:32px;font-weight:700;color:#0A5C8C;">${comparison.counts.eligible}</div>
            <div style="font-size:12px;color:#6b7280;">available to you</div>
          </div>
        </td>
        <td width="50%" style="padding:0 0 0 6px;vertical-align:top;">
          <div style="background:#f0fdf4;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:13px;color:#6b7280;margin-bottom:6px;">Priced at</div>
            <div style="font-size:32px;font-weight:700;color:#059669;">${Math.round(usage).toLocaleString()}</div>
            <div style="font-size:12px;color:#6b7280;">kWh a month</div>
          </div>
        </td>`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:20px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

            <tr><td style="background-color:#0A5C8C;background:linear-gradient(135deg,#0A5C8C,#084a6f);padding:24px 30px;border-radius:12px 12px 0 0;text-align:center;">
              <img src="${LOGO_EMAIL_HEADER_URL}" alt="Electric Scouts" width="200" height="42" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
              <div style="font-size:14px;color:#ffffff;margin-top:8px;font-weight:600;">📊 Your Bill Analysis</div>
            </td></tr>

            <tr><td style="background:#fff;padding:30px;">

              <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 12px;">${greeting}</p>
              <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 24px;">
                ${openingLine}
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>${benchmarkTiles}</tr>
              </table>

              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin-bottom:24px;">
                <div style="font-size:15px;font-weight:700;color:#1a1a1a;margin-bottom:12px;">📋 Your current bill</div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${currentProvider ? `<tr>
                    <td style="padding:5px 0;font-size:14px;color:#6b7280;">Supplier</td>
                    <td style="padding:5px 0;font-size:14px;font-weight:600;color:#1a1a1a;text-align:right;">${esc(currentProvider)}</td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding:5px 0;font-size:14px;color:#6b7280;">Monthly usage</td>
                    <td style="padding:5px 0;font-size:14px;font-weight:600;color:#1a1a1a;text-align:right;">${Math.round(usage).toLocaleString()} kWh</td>
                  </tr>
                  ${benchmark.available ? `<tr>
                    <td style="padding:5px 0;font-size:14px;color:#6b7280;">You pay</td>
                    <td style="padding:5px 0;font-size:14px;font-weight:600;color:#1a1a1a;text-align:right;">${MONEY.format(benchmark.currentMonthlyCost)}/mo</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;font-size:14px;color:#6b7280;">Your rate, all in</td>
                    <td style="padding:5px 0;font-size:14px;font-weight:600;color:#1a1a1a;text-align:right;">${benchmark.currentEffectiveRate.toFixed(1)}¢/kWh</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;font-size:14px;color:#6b7280;">Best available to you</td>
                    <td style="padding:5px 0;font-size:14px;font-weight:600;color:#059669;text-align:right;">${benchmark.bestEffectiveRate.toFixed(1)}¢/kWh</td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding:5px 0;font-size:14px;color:#6b7280;">Location</td>
                    <td style="padding:5px 0;font-size:14px;font-weight:600;color:#1a1a1a;text-align:right;">${esc(cityName ? `${cityName}, ${comparison.state}` : (zipCode || comparison.state))}</td>
                  </tr>
                </table>
              </div>

              ${sending.length > 0 ? `
              <div style="font-size:17px;font-weight:700;color:#1a1a1a;margin-bottom:12px;">⚡ Plans available at your address</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${plansHtml}
              </table>
              ` : `
              <div style="background:#f8fafc;border-radius:10px;padding:20px;text-align:center;margin-bottom:16px;">
                <div style="font-size:17px;font-weight:700;color:#0A5C8C;margin-bottom:4px;">No plans are listed for your area yet</div>
                <div style="font-size:14px;color:#6b7280;">We'll be in touch as soon as options open up where you are.</div>
              </div>
              `}

              <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px;">
                <tr><td style="background:#0A5C8C;border-radius:8px;text-align:center;padding:14px 24px;">
                  <a href="${APP_BASE_URL}/compare-rates${zipCode ? `?zip=${encodeURIComponent(zipCode)}` : ''}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;display:block;">Compare all plans →</a>
                </td></tr>
              </table>

              <p style="color:#9ca3af;font-size:13px;margin-top:24px;text-align:center;line-height:1.6;">
                Estimates use the ${Math.round(usage).toLocaleString()} kWh a month you confirmed and the plan components we hold — energy charge, base charge, utility delivery and bill credits where available. Where we cannot price a plan completely we label it as supply only and withhold any comparison against your bill. Verify all details with the provider before enrolling.
              </p>
            </td></tr>

            ${brandedFooter(email, "You're receiving this because you asked us to email your bill analysis.")}

          </table>
        </td></tr>
      </table>
    </body>
    </html>`;

    // ── The lead ──
    //
    // What we actually sent, as the server priced and ranked it. Recording the
    // browser's version here was the same mistake as rendering it: the lead
    // history then disagreed with the email the customer holds.
    const { data: lead } = await supabase
      .from("leads")
      .upsert({
        email: email.toLowerCase().trim(),
        name: firstName || null,
        zip: zipCode || null,
        city: cityName || null,
        state: comparison.state || null,
        source: 'bill_analyzer_report',
        source_page: 'bill_analyzer',
        status: 'new',
        search_preferences: {
          comparisonType: 'residential',
          monthlyUsage: usage,
          monthlyCost: benchmark.available ? benchmark.currentMonthlyCost : null,
          currentProvider: currentProvider || null,
          benchmarkScore: benchmark.available ? benchmark.score : null,
          annualOverpayment: benchmark.available ? benchmark.annualOverpayment : null,
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

    const result = await sendEmail({
      to: email,
      subject: `${firstName ? firstName + ', your' : 'Your'} electricity bill analysis`,
      html,
      idempotencyKey: `bill_report_${email}_${Date.now()}`,
      eventType: 'bill_analysis_report',
      leadId: lead?.id || null,
    });

    if (result.success) {
      return res.status(200).json({ success: true, message: "Report sent successfully!" });
    }

    console.error("Failed to send bill report email:", result.error);
    return res.status(500).json({ error: "Failed to send email. Please try again." });
  } catch (error) {
    console.error("Send report error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
