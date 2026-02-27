import {
  supabase,
  sendEmail,
  APP_BASE_URL,
  LOGO_HEADER_URL,
  LOGO_EMAIL_HEADER_URL,
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
    const { email, name, plans, zipCode, cityName, monthlyUsage, comparisonType } = req.body;

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
    const firstName = name ? name.split(' ')[0] : '';
    const year = new Date().getFullYear();
    const unsubUrl = `${APP_BASE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}`;
    
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
        ? `<div style="background:#FF6B35;color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:4px;display:inline-block;margin-bottom:8px;">⭐ TOP PICK</div><br/>`
        : '';
      
      const renewableBadge = plan.renewable_percentage >= 50 
        ? `<div style="color:#059669;font-size:13px;margin-top:6px;">🌿 ${plan.renewable_percentage}% Renewable</div>`
        : '';

      const contractText = plan.contract_length ? `${plan.contract_length} mo term` : 'Variable';

      return `
        <tr><td style="padding:8px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:${index === 0 ? '2px solid #FF6B35' : '1px solid #e5e7eb'};border-radius:10px;overflow:hidden;">
            <tr><td style="padding:18px;">
              ${bestBadge}
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:top;width:55%;">
                    <div style="font-size:17px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">${plan.provider_name || 'Provider'}</div>
                    <div style="font-size:14px;color:#6b7280;margin-bottom:8px;">${plan.plan_name || 'Plan'}</div>
                    ${plan.plan_type ? `<div style="background:#f3f4f6;color:#374151;font-size:12px;font-weight:600;padding:3px 10px;border-radius:10px;display:inline-block;margin-bottom:4px;">${plan.plan_type}</div>` : ''}
                    ${renewableBadge}
                  </td>
                  <td style="vertical-align:top;text-align:right;width:45%;">
                    <div style="font-size:13px;color:#6b7280;">Rate</div>
                    <div style="font-size:22px;font-weight:700;color:${config.accentColor};">${plan.rate_per_kwh}¢<span style="font-size:14px;font-weight:400;">/kWh</span></div>
                    <div style="font-size:13px;color:#6b7280;margin-top:8px;">Est. Monthly</div>
                    <div style="font-size:17px;font-weight:700;color:#1a1a1a;">$${estimatedCost}</div>
                    <div style="font-size:13px;color:#6b7280;margin-top:4px;">${contractText}</div>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" style="margin-top:14px;" width="100%">
                <tr><td style="background:#FF6B35;border-radius:6px;text-align:center;padding:12px 20px;">
                  <a href="${affiliateUrl}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;display:block;">Get This Plan →</a>
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
            <tr><td style="background-color:${config.accentColor};background:${config.headerBg};padding:24px 30px;border-radius:12px 12px 0 0;text-align:center;">
              <img src="${LOGO_EMAIL_HEADER_URL}" alt="Electric Scouts" width="200" height="42" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
              <div style="font-size:14px;color:#ffffff;margin-top:8px;font-weight:600;">${config.emoji} ${config.subtitle}</div>
            </td></tr>

            <!-- Body -->
            <tr><td style="background:#fff;padding:30px;">
              
              <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 8px;">${firstName ? `Hi ${firstName},` : 'Hi there,'}</p>
              <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 20px;">
                Here are your personalized ${config.label.toLowerCase()} electricity plan recommendations for <strong>${cityName || 'your area'}</strong> (${zipCode || 'N/A'}).
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
                      <div style="font-size:28px;font-weight:700;color:#059669;">${lowestRate.toFixed(1)}¢</div>
                      <div style="font-size:12px;color:#6b7280;">per kWh</div>
                    </div>
                  </td>
                  <td width="33%" style="padding:0 0 0 6px;vertical-align:top;">
                    <div style="background:#fff7ed;border-radius:10px;padding:16px;text-align:center;">
                      <div style="font-size:13px;color:#6b7280;margin-bottom:6px;">Est. Monthly</div>
                      <div style="font-size:28px;font-weight:700;color:#FF6B35;">$${lowestCost}</div>
                      <div style="font-size:12px;color:#6b7280;">@ ${usage} kWh</div>
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
                  <a href="${config.compareUrl}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;display:block;">Compare All ${config.label} Plans →</a>
                </td></tr>
              </table>

              <p style="color:#9ca3af;font-size:13px;margin-top:24px;text-align:center;line-height:1.6;">
                Rates and savings are estimates based on current market rates and ${usage} kWh monthly usage. Actual rates may vary.
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

    // Save lead
    const { data: lead } = await supabase
      .from("leads")
      .upsert({
        email: email.toLowerCase().trim(),
        name: firstName || null,
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
