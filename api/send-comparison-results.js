import {
  supabase,
  sendEmail,
  APP_BASE_URL,
} from "./_lib/email.js";

/**
 * Send Comparison Results via Email
 * 
 * Sends a beautifully formatted HTML email with:
 * - Top recommended plans with affiliate links
 * - Rate comparison details
 * - CTA buttons to switch plans
 * 
 * Works for Residential, Business, and Renewable comparison flows
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
    const { email, plans, zipCode, cityName, monthlyUsage, comparisonType } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!plans || plans.length === 0) {
      return res.status(400).json({ error: "No plans to send" });
    }

    const usage = parseInt(monthlyUsage) || 1000;
    const type = comparisonType || 'residential';
    
    // Type-specific styling
    const typeConfig = {
      residential: {
        label: 'Residential',
        headerBg: 'linear-gradient(135deg,#0A5C8C,#084a6f)',
        accentColor: '#0A5C8C',
        emoji: '🏠',
        subtitle: 'Residential Electricity Plans',
        compareUrl: `${APP_BASE_URL}/compare-rates?zip=${zipCode || ''}`,
      },
      business: {
        label: 'Business',
        headerBg: 'linear-gradient(135deg,#0A5C8C,#1e3a5f)',
        accentColor: '#0A5C8C',
        emoji: '🏢',
        subtitle: 'Business Electricity Plans',
        compareUrl: `${APP_BASE_URL}/business-compare-rates?zip=${zipCode || ''}`,
      },
      renewable: {
        label: 'Renewable',
        headerBg: 'linear-gradient(135deg,#059669,#047857)',
        accentColor: '#059669',
        emoji: '🌿',
        subtitle: '100% Green Energy Plans',
        compareUrl: `${APP_BASE_URL}/renewable-compare-rates?zip=${zipCode || ''}`,
      },
    };

    const config = typeConfig[type] || typeConfig.residential;

    // Build plan cards HTML
    const plansHtml = plans.slice(0, 6).map((plan, index) => {
      const affiliateUrl = plan.affiliateUrl || `${APP_BASE_URL}/api/go?slug=${encodeURIComponent((plan.provider_name || '').toLowerCase().replace(/\s+/g, '-'))}`;
      const estimatedCost = ((plan.rate_per_kwh * usage) / 100 + (plan.monthly_base_charge || 0)).toFixed(2);
      
      const bestBadge = index === 0 
        ? `<div style="background:#FF6B35;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:4px;display:inline-block;margin-bottom:8px;">⭐ TOP PICK</div><br/>`
        : '';
      
      const renewableBadge = plan.renewable_percentage >= 50 
        ? `<div style="color:#059669;font-size:12px;margin-top:6px;">🌿 ${plan.renewable_percentage}% Renewable</div>`
        : '';

      const contractText = plan.contract_length ? `${plan.contract_length} mo term` : 'Variable';

      return `
        <tr><td style="padding:8px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:${index === 0 ? '2px solid #FF6B35' : '1px solid #e5e7eb'};border-radius:10px;overflow:hidden;">
            <tr><td style="padding:16px;">
              ${bestBadge}
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:top;width:55%;">
                    <div style="font-size:16px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">${plan.provider_name || 'Provider'}</div>
                    <div style="font-size:13px;color:#6b7280;margin-bottom:8px;">${plan.plan_name || 'Plan'}</div>
                    ${plan.plan_type ? `<div style="background:#f3f4f6;color:#374151;font-size:11px;font-weight:600;padding:2px 8px;border-radius:10px;display:inline-block;margin-bottom:4px;">${plan.plan_type}</div>` : ''}
                    ${renewableBadge}
                  </td>
                  <td style="vertical-align:top;text-align:right;width:45%;">
                    <div style="font-size:13px;color:#6b7280;">Rate</div>
                    <div style="font-size:22px;font-weight:700;color:${config.accentColor};">${plan.rate_per_kwh}¢<span style="font-size:13px;font-weight:400;">/kWh</span></div>
                    <div style="font-size:13px;color:#6b7280;margin-top:8px;">Est. Monthly</div>
                    <div style="font-size:16px;font-weight:700;color:#1a1a1a;">$${estimatedCost}</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:4px;">${contractText}</div>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" style="margin-top:12px;" width="100%">
                <tr><td style="background:#FF6B35;border-radius:6px;text-align:center;padding:10px 20px;">
                  <a href="${affiliateUrl}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;display:block;">Get This Plan →</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>`;
    }).join('');

    // Lowest rate for summary
    const lowestRate = Math.min(...plans.map(p => p.rate_per_kwh));
    const lowestCost = ((lowestRate * usage) / 100).toFixed(2);
    const planCount = plans.length;

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:20px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
            
            <!-- Header -->
            <tr><td style="background:${config.headerBg};padding:24px 30px;border-radius:12px 12px 0 0;text-align:center;">
              <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:4px;">⚡ Electric Scouts</div>
              <div style="font-size:14px;color:rgba(255,255,255,0.8);">${config.emoji} ${config.subtitle}</div>
            </td></tr>

            <!-- Body -->
            <tr><td style="background:#fff;padding:30px;border-radius:0 0 12px 12px;">
              
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
                Here are your personalized ${config.label.toLowerCase()} electricity plan recommendations for <strong>${cityName || 'your area'}</strong> (${zipCode || 'N/A'}).
              </p>

              <!-- Summary Stats -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="33%" style="padding:0 6px 0 0;vertical-align:top;">
                    <div style="background:#f0f9ff;border-radius:10px;padding:16px;text-align:center;">
                      <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">Plans Found</div>
                      <div style="font-size:28px;font-weight:700;color:${config.accentColor};">${planCount}</div>
                      <div style="font-size:11px;color:#6b7280;">${config.label}</div>
                    </div>
                  </td>
                  <td width="33%" style="padding:0 3px;vertical-align:top;">
                    <div style="background:#f0fdf4;border-radius:10px;padding:16px;text-align:center;">
                      <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">Lowest Rate</div>
                      <div style="font-size:28px;font-weight:700;color:#059669;">${lowestRate.toFixed(1)}¢</div>
                      <div style="font-size:11px;color:#6b7280;">per kWh</div>
                    </div>
                  </td>
                  <td width="33%" style="padding:0 0 0 6px;vertical-align:top;">
                    <div style="background:#fff7ed;border-radius:10px;padding:16px;text-align:center;">
                      <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">Est. Monthly</div>
                      <div style="font-size:28px;font-weight:700;color:#FF6B35;">$${lowestCost}</div>
                      <div style="font-size:11px;color:#6b7280;">@ ${usage} kWh</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Recommended Plans -->
              <div style="font-size:16px;font-weight:700;color:#1a1a1a;margin-bottom:12px;">⚡ Top ${config.label} Plans For You</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${plansHtml}
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px;">
                <tr><td style="background:${config.accentColor};border-radius:8px;text-align:center;padding:14px 24px;">
                  <a href="${config.compareUrl}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;display:block;">Compare All ${config.label} Plans →</a>
                </td></tr>
              </table>

              <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">
                Rates and savings are estimates based on current market rates and ${usage} kWh monthly usage. Actual rates may vary.
              </p>
            </td></tr>

            <!-- Branded Footer -->
            <tr><td style="padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #e5e7eb;">
                <!-- Logo & Tagline -->
                <tr><td style="padding:24px 30px 12px;text-align:center;">
                  <a href="${APP_BASE_URL}" style="text-decoration:none;font-size:20px;font-weight:800;color:#0A5C8C;">⚡ Electric Scouts</a>
                  <p style="margin:6px 0 0;font-size:12px;color:#6b7280;">Compare electricity rates from 40+ providers. Save up to $800/year.</p>
                </td></tr>
                <!-- Social Icons -->
                <tr><td style="padding:12px 30px;text-align:center;">
                  <a href="https://facebook.com/electricscouts" style="text-decoration:none;display:inline-block;margin:0 4px;"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" width="28" height="28" style="border-radius:50%;" /></a>
                  <a href="https://x.com/electricscouts" style="text-decoration:none;display:inline-block;margin:0 4px;"><img src="https://cdn-icons-png.flaticon.com/512/5968/5968958.png" alt="X" width="28" height="28" style="border-radius:50%;" /></a>
                  <a href="https://linkedin.com/company/electricscouts" style="text-decoration:none;display:inline-block;margin:0 4px;"><img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" alt="LinkedIn" width="28" height="28" style="border-radius:50%;" /></a>
                  <a href="https://instagram.com/electricscouts" style="text-decoration:none;display:inline-block;margin:0 4px;"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" width="28" height="28" style="border-radius:50%;" /></a>
                </td></tr>
                <!-- Quick Links -->
                <tr><td style="padding:8px 30px;text-align:center;font-size:13px;">
                  <a href="${APP_BASE_URL}/compare-rates" style="color:#0A5C8C;text-decoration:none;font-weight:600;">Compare Rates</a>
                  <span style="color:#d1d5db;margin:0 8px;">|</span>
                  <a href="${APP_BASE_URL}/bill-analyzer" style="color:#0A5C8C;text-decoration:none;font-weight:600;">Bill Analyzer</a>
                  <span style="color:#d1d5db;margin:0 8px;">|</span>
                  <a href="${APP_BASE_URL}" style="color:#0A5C8C;text-decoration:none;font-weight:600;">www.electricscouts.com</a>
                </td></tr>
                <!-- Divider -->
                <tr><td style="padding:12px 30px 0;"><div style="border-top:1px solid #e5e7eb;"></div></td></tr>
                <!-- Copyright & Opt-out -->
                <tr><td style="padding:14px 30px 20px;text-align:center;">
                  <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} Electric Scouts. All rights reserved.</p>
                  <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;">You're receiving this because you requested comparison results.</p>
                  <p style="margin:0;font-size:11px;">
                    <a href="${APP_BASE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
                    <span style="color:#d1d5db;margin:0 6px;">|</span>
                    <a href="${APP_BASE_URL}/privacy-policy" style="color:#9ca3af;text-decoration:underline;">Privacy Policy</a>
                  </p>
                </td></tr>
              </table>
            </td></tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>`;

    // Save lead
    const { data: lead } = await supabase
      .from("leads")
      .upsert({
        email: email.toLowerCase().trim(),
        zip: zipCode || null,
        source: `${type}_comparison_results`,
        status: 'new',
      }, { onConflict: 'email' })
      .select()
      .single();

    const leadId = lead?.id || null;

    // Send the email
    const result = await sendEmail({
      to: email,
      subject: `${config.emoji} Your ${config.label} Electricity Plans — Starting at ${lowestRate.toFixed(1)}¢/kWh`,
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
