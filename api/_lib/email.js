import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@electricscouts.com";
const APP_BASE_URL = process.env.APP_BASE_URL || "https://electricscouts.com";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Email Templates ────────────────────────────────────────────────

function baseLayout(content) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fa;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="background:#0A5C8C;padding:24px 32px;">
  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">⚡ ElectricScouts</h1>
</td></tr>
<tr><td style="padding:32px;">
  ${content}
</td></tr>
<tr><td style="background:#f8f9fa;padding:16px 32px;text-align:center;font-size:12px;color:#6b7280;">
  <p style="margin:0;">© ${new Date().getFullYear()} ElectricScouts. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

export function leadWelcomeEmail(leadEmail, leadName) {
  const name = leadName || "there";
  const unsubUrl = `${APP_BASE_URL}/api/unsubscribe?email=${encodeURIComponent(leadEmail)}`;
  return {
    subject: "Welcome to ElectricScouts — Your Savings Journey Starts Here",
    html: baseLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">Hey ${name}!</h2>
      <p style="color:#374151;line-height:1.6;margin:0 0 16px;">Thanks for joining ElectricScouts. We help you find the best electricity rates and save money on your energy bills.</p>
      <p style="color:#374151;line-height:1.6;margin:0 0 16px;">Here's what you can do next:</p>
      <ul style="color:#374151;line-height:1.8;margin:0 0 24px;padding-left:20px;">
        <li><strong>Compare rates</strong> from top providers in your area</li>
        <li><strong>Upload your bill</strong> for a personalized savings analysis</li>
        <li><strong>Get alerts</strong> when better rates become available</li>
      </ul>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td style="background:#0A5C8C;border-radius:6px;padding:12px 28px;">
          <a href="${APP_BASE_URL}/compare-rates" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">Compare Rates Now →</a>
        </td></tr>
      </table>
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        <a href="${unsubUrl}" style="color:#9ca3af;">Unsubscribe</a>
      </p>
    `)
  };
}

export function leadFollowup1Email(leadEmail, leadName) {
  const name = leadName || "there";
  const unsubUrl = `${APP_BASE_URL}/api/unsubscribe?email=${encodeURIComponent(leadEmail)}`;
  return {
    subject: "Did You Know? Most Texans Overpay for Electricity",
    html: baseLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">Hey ${name},</h2>
      <p style="color:#374151;line-height:1.6;margin:0 0 16px;">Studies show that the average household overpays on electricity by <strong>15–30%</strong>. That's hundreds of dollars a year going to waste.</p>
      <p style="color:#374151;line-height:1.6;margin:0 0 16px;">Our Bill Analyzer can tell you exactly how much you could be saving — in under 60 seconds.</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td style="background:#0A5C8C;border-radius:6px;padding:12px 28px;">
          <a href="${APP_BASE_URL}/bill-analyzer" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">Analyze My Bill →</a>
        </td></tr>
      </table>
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        <a href="${unsubUrl}" style="color:#9ca3af;">Unsubscribe</a>
      </p>
    `)
  };
}

export function leadFollowup2Email(leadEmail, leadName) {
  const name = leadName || "there";
  const unsubUrl = `${APP_BASE_URL}/api/unsubscribe?email=${encodeURIComponent(leadEmail)}`;
  return {
    subject: "Your Personalized Rate Comparison Is Ready",
    html: baseLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">Hey ${name},</h2>
      <p style="color:#374151;line-height:1.6;margin:0 0 16px;">We've been tracking the latest electricity rates in your area. Prices change frequently — and right now there are some great deals available.</p>
      <p style="color:#374151;line-height:1.6;margin:0 0 16px;">Don't miss out on potential savings. Compare plans from top-rated providers today.</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td style="background:#0A5C8C;border-radius:6px;padding:12px 28px;">
          <a href="${APP_BASE_URL}/compare-rates" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">View Latest Rates →</a>
        </td></tr>
      </table>
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        <a href="${unsubUrl}" style="color:#9ca3af;">Unsubscribe</a>
      </p>
    `)
  };
}

export function adminNewLeadEmail(lead) {
  return {
    subject: `New Lead: ${lead.email}`,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">New Lead Captured</h2>
      <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">
        <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151;width:120px;">Email</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#374151;">${lead.email}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151;">ZIP</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#374151;">${lead.zip || "N/A"}</td></tr>
        <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151;">Source</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#374151;">${lead.source}</td></tr>
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
    subject: `Your ElectricScouts Admin Code: ${code}`,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">Password Reset Code</h2>
      <p style="color:#374151;line-height:1.6;margin:0 0 16px;">Use the following 6-digit code to reset your admin password. This code expires in 15 minutes.</p>
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
    `<tr><td style="padding:6px 12px;border:1px solid #e5e7eb;color:#374151;">${source}</td><td style="padding:6px 12px;border:1px solid #e5e7eb;color:#374151;text-align:right;">${count}</td></tr>`
  ).join("") || `<tr><td colspan="2" style="padding:6px 12px;border:1px solid #e5e7eb;color:#9ca3af;">No leads this week</td></tr>`;

  return {
    subject: `Weekly Report — ${dateRange}`,
    html: baseLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">Weekly Platform Report</h2>
      <p style="color:#6b7280;margin:0 0 20px;font-size:14px;">${dateRange}</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr><td style="padding:12px;background:#f0f9ff;border-radius:6px;text-align:center;width:33%;">
          <div style="font-size:28px;font-weight:700;color:#0A5C8C;">${totalLeads}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">New Leads</div>
        </td><td style="width:8px;"></td><td style="padding:12px;background:#f0fdf4;border-radius:6px;text-align:center;width:33%;">
          <div style="font-size:28px;font-weight:700;color:#059669;">${billUploads}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">Bill Uploads</div>
        </td><td style="width:8px;"></td><td style="padding:12px;background:#fef3c7;border-radius:6px;text-align:center;width:33%;">
          <div style="font-size:28px;font-weight:700;color:#d97706;">${affiliateClicks}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">Affiliate Clicks</div>
        </td></tr>
      </table>
      <h3 style="margin:0 0 8px;color:#1a1a1a;font-size:16px;">Leads by Source</h3>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr><th style="padding:6px 12px;border:1px solid #e5e7eb;background:#f9fafb;text-align:left;color:#374151;font-size:13px;">Source</th><th style="padding:6px 12px;border:1px solid #e5e7eb;background:#f9fafb;text-align:right;color:#374151;font-size:13px;">Count</th></tr>
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

export { supabase, ADMIN_EMAILS, APP_BASE_URL, FROM_EMAIL };
