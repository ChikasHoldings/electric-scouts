import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
// Always use branded sender name — extract raw email from env var if set, then wrap with display name
const RAW_EMAIL = (process.env.FROM_EMAIL || "noreply@electricscouts.com").replace(/.*<(.+)>.*/, '$1').trim();
const FROM_EMAIL = `Electric Scouts <${RAW_EMAIL}>`;
const APP_BASE_URL = process.env.APP_BASE_URL || "https://www.electricscouts.com";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);

// Logo URLs (hosted on the live site)
const LOGO_HEADER_URL = `${APP_BASE_URL}/images/logo-header.png`;
const LOGO_EMAIL_HEADER_URL = `${APP_BASE_URL}/images/logo-email-header.png`;
const FAVICON_URL = `${APP_BASE_URL}/android-chrome-512x512.png`;

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Branded Footer ────────────────────────────────────────────────

function brandedFooter(recipientEmail) {
  const unsubUrl = `${APP_BASE_URL}/api/unsubscribe?email=${encodeURIComponent(recipientEmail || '')}`;
  const year = new Date().getFullYear();
  
  return `
  <!-- Branded Footer -->
  <tr><td style="padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #e5e7eb;margin-top:24px;">
      <!-- Logo -->
      <tr><td style="padding:28px 32px 12px 32px;text-align:center;">
        <a href="${APP_BASE_URL}" style="text-decoration:none;display:inline-block;">
          <img src="${LOGO_HEADER_URL}" alt="Electric Scouts" width="200" height="41" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
        </a>
        <p style="margin:12px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
          Compare electricity rates from 40+ providers.<br/>Save up to $800/year.
        </p>
      </td></tr>
      
      <!-- Social Icons -->
      <tr><td style="padding:20px 32px;text-align:center;">
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr>
            <td style="padding:0 10px;">
              <a href="https://facebook.com/electricscouts" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;">
                <table cellpadding="0" cellspacing="0">
                  <tr><td style="background:#0A5C8C;border-radius:50%;width:40px;height:40px;text-align:center;vertical-align:middle;">
                    <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" width="20" height="20" style="display:block;margin:0 auto;filter:brightness(0) invert(1);" />
                  </td></tr>
                </table>
              </a>
            </td>
            <td style="padding:0 10px;">
              <a href="https://x.com/electricscouts" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;">
                <table cellpadding="0" cellspacing="0">
                  <tr><td style="background:#0A5C8C;border-radius:50%;width:40px;height:40px;text-align:center;vertical-align:middle;">
                    <img src="https://cdn-icons-png.flaticon.com/512/5968/5968958.png" alt="X (Twitter)" width="20" height="20" style="display:block;margin:0 auto;filter:brightness(0) invert(1);" />
                  </td></tr>
                </table>
              </a>
            </td>
            <td style="padding:0 10px;">
              <a href="https://linkedin.com/company/electricscouts" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;">
                <table cellpadding="0" cellspacing="0">
                  <tr><td style="background:#0A5C8C;border-radius:50%;width:40px;height:40px;text-align:center;vertical-align:middle;">
                    <img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" alt="LinkedIn" width="20" height="20" style="display:block;margin:0 auto;filter:brightness(0) invert(1);" />
                  </td></tr>
                </table>
              </a>
            </td>
            <td style="padding:0 10px;">
              <a href="https://instagram.com/electricscouts" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;">
                <table cellpadding="0" cellspacing="0">
                  <tr><td style="background:#0A5C8C;border-radius:50%;width:40px;height:40px;text-align:center;vertical-align:middle;">
                    <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" width="20" height="20" style="display:block;margin:0 auto;filter:brightness(0) invert(1);" />
                  </td></tr>
                </table>
              </a>
            </td>
          </tr>
        </table>
      </td></tr>
      
      <!-- Quick Links -->
      <tr><td style="padding:12px 32px;text-align:center;">
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr>
            <td style="padding:0 14px;">
              <a href="${APP_BASE_URL}/compare-rates" style="color:#0A5C8C;text-decoration:none;font-size:14px;font-weight:600;">Compare Rates</a>
            </td>
            <td style="color:#d1d5db;font-size:14px;">|</td>
            <td style="padding:0 14px;">
              <a href="${APP_BASE_URL}/bill-analyzer" style="color:#0A5C8C;text-decoration:none;font-size:14px;font-weight:600;">Bill Analyzer</a>
            </td>
            <td style="color:#d1d5db;font-size:14px;">|</td>
            <td style="padding:0 14px;">
              <a href="${APP_BASE_URL}/learning-center" style="color:#0A5C8C;text-decoration:none;font-size:14px;font-weight:600;">Learning Center</a>
            </td>
          </tr>
        </table>
      </td></tr>
      
      <!-- Website Link -->
      <tr><td style="padding:8px 32px;text-align:center;">
        <a href="${APP_BASE_URL}" style="color:#0A5C8C;text-decoration:none;font-size:14px;font-weight:600;">
          www.electricscouts.com
        </a>
      </td></tr>
      
      <!-- Divider -->
      <tr><td style="padding:20px 32px 0;">
        <div style="border-top:1px solid #e5e7eb;"></div>
      </td></tr>
      
      <!-- Copyright & Opt-out -->
      <tr><td style="padding:20px 32px 28px;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
          &copy; ${year} Electric Scouts. All rights reserved.
        </p>
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
          You're receiving this email because you signed up at Electric Scouts.
        </p>
        <p style="margin:0;font-size:13px;line-height:1.6;">
          <a href="${unsubUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
          <span style="color:#d1d5db;margin:0 8px;">|</span>
          <a href="${APP_BASE_URL}/privacy-policy" style="color:#6b7280;text-decoration:underline;">Privacy Policy</a>
        </p>
      </td></tr>
    </table>
  </td></tr>`;
}

// ─── Email Templates ────────────────────────────────────────────────

function baseLayout(content, recipientEmail) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fa;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);max-width:100%;">
<tr><td style="background-color:#0A5C8C;background:linear-gradient(135deg,#0A5C8C 0%,#084a6f 100%);padding:24px 32px;">
  <table cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td>
        <img src="${LOGO_EMAIL_HEADER_URL}" alt="Electric Scouts" width="200" height="42" style="display:block;max-width:200px;height:auto;" />
        <p style="margin:6px 0 0;color:#ffffff;font-size:13px;font-weight:600;">Smart Electricity Comparison</p>
      </td>
    </tr>
  </table>
</td></tr>
<tr><td style="padding:32px;">
  ${content}
</td></tr>
${brandedFooter(recipientEmail)}
</table>
</td></tr>
</table>
</body></html>`;
}

export function leadWelcomeEmail(leadEmail, leadName) {
  const name = leadName || "there";
  return {
    subject: "Welcome to Electric Scouts — Your Savings Journey Starts Here",
    html: baseLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">Hey ${name}!</h2>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">Thanks for joining Electric Scouts. We help you find the best electricity rates and save money on your energy bills.</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">Here's what you can do next:</p>
      <ul style="color:#374151;font-size:15px;line-height:2;margin:0 0 24px;padding-left:20px;">
        <li><strong>Compare rates</strong> from top providers in your area</li>
        <li><strong>Upload your bill</strong> for a personalized savings analysis</li>
        <li><strong>Get alerts</strong> when better rates become available</li>
      </ul>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td style="background:#0A5C8C;border-radius:6px;padding:12px 28px;">
          <a href="${APP_BASE_URL}/compare-rates" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">Compare Rates Now →</a>
        </td></tr>
      </table>
    `, leadEmail)
  };
}

export function rateAlertsConfirmationEmail(leadEmail, leadName, leadZip) {
  const name = leadName || "there";
  const zipDisplay = leadZip ? ` for ZIP code ${leadZip}` : "";
  return {
    subject: `Rate Alerts Activated${zipDisplay} — Electric Scouts`,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">Hey ${name}, you're all set! ⚡</h2>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">We've activated rate alerts for your area${zipDisplay}. Here's what that means for you:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="padding:16px 20px;background:#f0f9ff;border-radius:8px;border-left:4px solid #0A5C8C;">
            <p style="margin:0 0 8px;font-weight:600;color:#0A5C8C;font-size:15px;">🔔 What you'll receive:</p>
            <ul style="color:#374151;font-size:14px;line-height:2;margin:0;padding-left:20px;">
              <li>Notifications when electricity rates drop in your area</li>
              <li>Alerts when new plans become available from top providers</li>
              <li>Seasonal rate change updates so you never overpay</li>
            </ul>
          </td>
        </tr>
      </table>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">In the meantime, you can compare current rates right now to see if there's already a better deal waiting for you:</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td style="background:#0A5C8C;border-radius:6px;padding:12px 28px;">
          <a href="${APP_BASE_URL}/compare-rates${leadZip ? `?zip=${leadZip}` : ""}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">Compare Rates Now →</a>
        </td></tr>
      </table>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">You can unsubscribe from these alerts at any time. We respect your inbox — no spam, ever.</p>
    `, leadEmail)
  };
}

export function leadFollowup1Email(leadEmail, leadName) {
  const name = leadName || "there";
  return {
    subject: "Did You Know? Most Texans Overpay for Electricity",
    html: baseLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">Hey ${name},</h2>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">Studies show that the average household overpays on electricity by <strong>15–30%</strong>. That's hundreds of dollars a year going to waste.</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">Our Bill Analyzer can tell you exactly how much you could be saving — in under 60 seconds.</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td style="background:#0A5C8C;border-radius:6px;padding:12px 28px;">
          <a href="${APP_BASE_URL}/bill-analyzer" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">Analyze My Bill →</a>
        </td></tr>
      </table>
    `, leadEmail)
  };
}

export function leadFollowup2Email(leadEmail, leadName) {
  const name = leadName || "there";
  return {
    subject: "Your Personalized Rate Comparison Is Ready",
    html: baseLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">Hey ${name},</h2>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">We've been tracking the latest electricity rates in your area. Prices change frequently — and right now there are some great deals available.</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">Don't miss out on potential savings. Compare plans from top-rated providers today.</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td style="background:#0A5C8C;border-radius:6px;padding:12px 28px;">
          <a href="${APP_BASE_URL}/compare-rates" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">View Latest Rates →</a>
        </td></tr>
      </table>
    `, leadEmail)
  };
}

export function adminNewLeadEmail(lead) {
  return {
    subject: `New Lead: ${lead.email}`,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">New Lead Captured</h2>
      <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">
        <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151;width:120px;">Email</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#374151;">${lead.email}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151;">ZIP</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#374151;">${lead.zip || 'N/A'}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151;">Source</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#374151;">${lead.source || 'N/A'}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151;">Time</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#374151;">${new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })}</td></tr>
      </table>
      <table cellpadding="0" cellspacing="0">
        <tr><td style="background:#0A5C8C;border-radius:6px;padding:10px 24px;">
          <a href="${APP_BASE_URL}/admin" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">View in Admin →</a>
        </td></tr>
      </table>
    `)
  };
}

export function adminResetCodeEmail(code) {
  return {
    subject: `Your Electric Scouts Admin Code: ${code}`,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">Password Reset Code</h2>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">Use the following 6-digit code to reset your admin password. This code expires in 15 minutes.</p>
      <div style="background:#f0f9ff;border:2px solid #0A5C8C;border-radius:8px;padding:20px;text-align:center;margin:0 0 24px;">
        <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#0A5C8C;">${code}</span>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:0;">If you did not request this code, please ignore this email. Do not share this code with anyone.</p>
    `)
  };
}

export function weeklyReportEmail(data) {
  const { totalLeads, leadsBySource, billUploads, affiliateClicks, dateRange } = data;
  const sourceRows = Object.entries(leadsBySource || {}).map(([source, count]) =>
    `<tr><td style="padding:6px 12px;border:1px solid #e5e7eb;color:#374151;font-size:14px;">${source}</td><td style="padding:6px 12px;border:1px solid #e5e7eb;color:#374151;font-size:14px;text-align:right;">${count}</td></tr>`
  ).join("") || `<tr><td colspan="2" style="padding:6px 12px;border:1px solid #e5e7eb;color:#9ca3af;font-size:14px;">No leads this week</td></tr>`;

  return {
    subject: `Weekly Report — ${dateRange}`,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">Weekly Platform Report</h2>
      <p style="color:#6b7280;margin:0 0 20px;font-size:15px;">${dateRange}</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr><td style="padding:12px;background:#f0f9ff;border-radius:6px;text-align:center;width:33%;">
          <div style="font-size:28px;font-weight:700;color:#0A5C8C;">${totalLeads}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:4px;">New Leads</div>
        </td><td style="width:8px;"></td><td style="padding:12px;background:#f0fdf4;border-radius:6px;text-align:center;width:33%;">
          <div style="font-size:28px;font-weight:700;color:#059669;">${billUploads}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:4px;">Bill Uploads</div>
        </td><td style="width:8px;"></td><td style="padding:12px;background:#fef3c7;border-radius:6px;text-align:center;width:33%;">
          <div style="font-size:28px;font-weight:700;color:#d97706;">${affiliateClicks}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:4px;">Affiliate Clicks</div>
        </td></tr>
      </table>
      <h3 style="margin:0 0 8px;color:#1a1a1a;font-size:16px;">Leads by Source</h3>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr><th style="padding:6px 12px;border:1px solid #e5e7eb;background:#f9fafb;text-align:left;color:#374151;font-size:14px;">Source</th><th style="padding:6px 12px;border:1px solid #e5e7eb;background:#f9fafb;text-align:right;color:#374151;font-size:14px;">Count</th></tr>
        ${sourceRows}
      </table>
      <table cellpadding="0" cellspacing="0">
        <tr><td style="background:#0A5C8C;border-radius:6px;padding:10px 24px;">
          <a href="${APP_BASE_URL}/admin" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">View Dashboard →</a>
        </td></tr>
      </table>
    `)
  };
}

// ─── Core Send Function ─────────────────────────────────────────────

export async function sendEmail({ to, subject, html, idempotencyKey, eventType, leadId }) {
  // Check idempotency — skip if already sent
  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from("email_events")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .eq("status", "sent")
      .maybeSingle();
    if (existing) {
      return { success: true, skipped: true, message: "Already sent (idempotent)" };
    }
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    // Log success
    if (idempotencyKey) {
      await supabase.from("email_events").upsert({
        event_type: eventType || "unknown",
        lead_id: leadId || null,
        to_email: Array.isArray(to) ? to.join(",") : to,
        subject,
        status: "sent",
        idempotency_key: idempotencyKey,
      }, { onConflict: "idempotency_key" });
    }

    return { success: true, data: result };
  } catch (error) {
    // Log failure
    if (idempotencyKey) {
      await supabase.from("email_events").upsert({
        event_type: eventType || "unknown",
        lead_id: leadId || null,
        to_email: Array.isArray(to) ? to.join(",") : to,
        subject,
        status: "failed",
        error: error.message,
        idempotency_key: idempotencyKey,
      }, { onConflict: "idempotency_key" });
    }

    return { success: false, error: error.message };
  }
}

// ─── Exports ────────────────────────────────────────────────────────

export { supabase, ADMIN_EMAILS, APP_BASE_URL, FROM_EMAIL, LOGO_HEADER_URL, LOGO_EMAIL_HEADER_URL, FAVICON_URL };
