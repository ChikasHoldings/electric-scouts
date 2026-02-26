import {
  supabase,
  sendEmail,
  APP_BASE_URL,
} from "./_lib/email.js";

/**
 * Send Bill Analysis Report via Email
 * 
 * Sends a beautifully formatted HTML email with:
 * - Customer's bill analysis summary
 * - Savings score and overpayment info
 * - Top recommended plans with affiliate links
 * - CTA buttons to switch plans
 */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, billData, recommendations, savingsScore, overpaymentPercent } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!billData) {
      return res.status(400).json({ error: "Bill data is required" });
    }

    // Build recommendation cards HTML
    const recsHtml = (recommendations || []).slice(0, 5).map((plan, index) => {
      const affiliateUrl = plan.affiliateUrl || `${APP_BASE_URL}/api/go?slug=${encodeURIComponent((plan.provider_name || '').toLowerCase().replace(/\s+/g, '-'))}`;
      const savingsBadge = plan.annualSavings > 0 
        ? `<div style="background:#059669;color:#fff;font-size:12px;font-weight:700;padding:3px 10px;border-radius:12px;display:inline-block;margin-bottom:10px;">Save $${Math.round(plan.annualSavings)}/yr</div>`
        : '';
      const bestBadge = index === 0 
        ? `<div style="background:#FF6B35;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:4px;display:inline-block;margin-bottom:8px;">⭐ BEST SAVINGS</div><br/>`
        : '';
      const renewableBadge = plan.renewable_percentage >= 50 
        ? `<div style="color:#059669;font-size:12px;margin-top:6px;">🌿 ${plan.renewable_percentage}% Renewable</div>`
        : '';

      return `
        <tr><td style="padding:8px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:${index === 0 ? '2px solid #FF6B35' : '1px solid #e5e7eb'};border-radius:10px;overflow:hidden;">
            <tr><td style="padding:16px;">
              ${bestBadge}
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:top;width:60%;">
                    <div style="font-size:16px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">${plan.provider_name || 'Provider'}</div>
                    <div style="font-size:13px;color:#6b7280;margin-bottom:8px;">${plan.plan_name || 'Plan'}</div>
                    ${savingsBadge}
                    ${renewableBadge}
                  </td>
                  <td style="vertical-align:top;text-align:right;width:40%;">
                    <div style="font-size:13px;color:#6b7280;">Rate</div>
                    <div style="font-size:20px;font-weight:700;color:#0A5C8C;">${plan.rate_per_kwh}¢/kWh</div>
                    <div style="font-size:13px;color:#6b7280;margin-top:8px;">Est. Monthly</div>
                    <div style="font-size:16px;font-weight:700;color:#1a1a1a;">$${Math.round(plan.estimatedCost || 0)}</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:4px;">${plan.contract_length || 'Variable'} mo term</div>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" style="margin-top:12px;" width="100%">
                <tr><td style="background:#FF6B35;border-radius:6px;text-align:center;padding:10px 20px;">
                  <a href="${affiliateUrl}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;display:block;">Switch to This Plan →</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>`;
    }).join('');

    // Savings score color
    const getScoreColor = (score) => {
      if (score >= 75) return '#16a34a';
      if (score >= 50) return '#2563eb';
      if (score >= 25) return '#f59e0b';
      return '#ef4444';
    };

    const getScoreLabel = (score) => {
      if (score >= 75) return 'Great Rate';
      if (score >= 50) return 'Good Rate';
      if (score >= 25) return 'Fair Rate';
      return 'Overpaying';
    };

    const scoreColor = getScoreColor(savingsScore || 50);
    const scoreLabel = getScoreLabel(savingsScore || 50);
    const topSavings = recommendations?.[0]?.annualSavings || 0;
    const customerName = billData.customer_name || '';
    const greeting = customerName ? `Hi ${customerName.split(' ')[0]},` : 'Hi there,';

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:20px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
            
            <!-- Header -->
            <tr><td style="background:linear-gradient(135deg,#0A5C8C,#084a6f);padding:24px 30px;border-radius:12px 12px 0 0;text-align:center;">
              <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:4px;">⚡ ElectricScouts</div>
              <div style="font-size:14px;color:#93c5fd;">Your Bill Analysis Report</div>
            </td></tr>

            <!-- Body -->
            <tr><td style="background:#fff;padding:30px;border-radius:0 0 12px 12px;">
              
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Here's your personalized electricity bill analysis. ${topSavings > 0 ? `We found plans that could save you up to <strong style="color:#059669;">$${Math.round(topSavings)}/year</strong>!` : 'Your current rate is competitive — great job!'}
              </p>

              <!-- Score + Summary Row -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="33%" style="padding:0 6px 0 0;vertical-align:top;">
                    <div style="background:#f0f9ff;border-radius:10px;padding:16px;text-align:center;">
                      <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">Savings Score</div>
                      <div style="font-size:32px;font-weight:700;color:${scoreColor};">${savingsScore || '—'}</div>
                      <div style="font-size:11px;color:${scoreColor};font-weight:600;">${scoreLabel}</div>
                    </div>
                  </td>
                  <td width="33%" style="padding:0 3px;vertical-align:top;">
                    <div style="background:#fff7ed;border-radius:10px;padding:16px;text-align:center;">
                      <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">Overpayment</div>
                      <div style="font-size:32px;font-weight:700;color:${(overpaymentPercent || 0) > 20 ? '#ef4444' : (overpaymentPercent || 0) > 10 ? '#f59e0b' : '#2563eb'};">${overpaymentPercent || 0}%</div>
                      <div style="font-size:11px;color:#6b7280;">vs best rate</div>
                    </div>
                  </td>
                  <td width="33%" style="padding:0 0 0 6px;vertical-align:top;">
                    <div style="background:#f0fdf4;border-radius:10px;padding:16px;text-align:center;">
                      <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">Potential Savings</div>
                      <div style="font-size:32px;font-weight:700;color:#059669;">$${Math.round(topSavings)}</div>
                      <div style="font-size:11px;color:#6b7280;">per year</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Current Plan Summary -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:24px;">
                <div style="font-size:14px;font-weight:700;color:#1a1a1a;margin-bottom:12px;">📋 Your Current Plan</div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:#6b7280;">Provider</td>
                    <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1a1a1a;text-align:right;">${billData.provider_name || 'N/A'}</td>
                  </tr>
                  ${billData.plan_name ? `<tr>
                    <td style="padding:4px 0;font-size:13px;color:#6b7280;">Plan</td>
                    <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1a1a1a;text-align:right;">${billData.plan_name}</td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:#6b7280;">Monthly Usage</td>
                    <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1a1a1a;text-align:right;">${billData.monthly_usage_kwh || 0} kWh</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:#6b7280;">Current Rate</td>
                    <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1a1a1a;text-align:right;">${billData.rate_per_kwh || 0}¢/kWh</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:#6b7280;">Monthly Cost</td>
                    <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1a1a1a;text-align:right;">$${(billData.monthly_cost || 0).toFixed(2)}</td>
                  </tr>
                  ${billData.service_address ? `<tr>
                    <td style="padding:4px 0;font-size:13px;color:#6b7280;">Service Address</td>
                    <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1a1a1a;text-align:right;">${billData.service_address}</td>
                  </tr>` : ''}
                </table>
              </div>

              ${recommendations && recommendations.length > 0 ? `
              <!-- Recommended Plans -->
              <div style="font-size:16px;font-weight:700;color:#1a1a1a;margin-bottom:12px;">⚡ Recommended Plans For You</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${recsHtml}
              </table>
              ` : `
              <div style="background:#f0fdf4;border-radius:10px;padding:20px;text-align:center;margin-bottom:16px;">
                <div style="font-size:16px;font-weight:700;color:#059669;margin-bottom:4px;">✅ You Have a Great Rate!</div>
                <div style="font-size:13px;color:#6b7280;">Your current plan is competitive. We'll keep monitoring for better options.</div>
              </div>
              `}

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px;">
                <tr><td style="background:#0A5C8C;border-radius:8px;text-align:center;padding:14px 24px;">
                  <a href="${APP_BASE_URL}/compare-rates" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;display:block;">Compare All Plans →</a>
                </td></tr>
              </table>

              <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">
                This report was generated by ElectricScouts. Rates and savings are estimates based on your bill data and current market rates.
              </p>
            </td></tr>

            <!-- Footer -->
            <tr><td style="padding:20px;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} ElectricScouts. All rights reserved.<br/>
                <a href="${APP_BASE_URL}/privacy-policy" style="color:#6b7280;text-decoration:underline;">Privacy Policy</a> · 
                <a href="${APP_BASE_URL}/terms-of-service" style="color:#6b7280;text-decoration:underline;">Terms of Service</a>
              </p>
            </td></tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>`;

    // Save lead first
    const { data: lead } = await supabase
      .from("leads")
      .upsert({
        email: email.toLowerCase().trim(),
        zip: billData.zip_code || null,
        name: billData.customer_name || null,
        source: 'bill_analyzer_report',
        status: 'new',
      }, { onConflict: 'email' })
      .select()
      .single();

    const leadId = lead?.id || null;

    // Send the report email
    const result = await sendEmail({
      to: email,
      subject: `Your Electricity Savings Report${topSavings > 0 ? ` — Save up to $${Math.round(topSavings)}/yr` : ''}`,
      html,
      idempotencyKey: `bill_report_${email}_${Date.now()}`,
      eventType: 'bill_analysis_report',
      leadId,
    });

    if (result.success) {
      return res.status(200).json({ success: true, message: "Report sent successfully!" });
    } else {
      console.error("Failed to send report email:", result.error);
      return res.status(500).json({ error: "Failed to send email. Please try again." });
    }

  } catch (error) {
    console.error("Send report error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
