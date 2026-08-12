import {
  supabase,
  sendEmail,
  weeklyReportEmail,
  ADMIN_EMAILS,
} from "../_lib/email.js";
import { adminRecipients, ADMIN_NOTIFICATIONS } from "../_lib/adminNotifications.js";

export default async function handler(req, res) {
  // Allow both POST (manual trigger) and GET (cron trigger)
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional: verify cron secret for automated calls
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers["authorization"] !== `Bearer ${cronSecret}`) {
    // Allow without auth for admin-triggered calls from the dashboard
    if (req.method === "GET") {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    // Admins who have not switched the weekly report off. An empty list here
    // is a decision, not a misconfiguration — see `adminRecipients`.
    const { recipients, source } = await adminRecipients(
      supabase,
      ADMIN_NOTIFICATIONS.WEEKLY_REPORT,
      { fallback: ADMIN_EMAILS }
    );

    if (recipients.length === 0) {
      return res.status(200).json({
        success: true,
        message: source === "opted_out"
          ? "No admin has the weekly report enabled"
          : "No admin recipients configured",
        recipientSource: source,
      });
    }

    // Calculate date range (last 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateRange = `${weekAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    // Total new leads
    const { count: totalLeads } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    // Leads by source
    const { data: leadsData } = await supabase
      .from("leads")
      .select("source")
      .gte("created_at", weekAgo.toISOString());

    const leadsBySource = {};
    (leadsData || []).forEach((lead) => {
      leadsBySource[lead.source] = (leadsBySource[lead.source] || 0) + 1;
    });

    // Bill uploads.
    //
    // Counted off `leads`, which is where a bill upload has actually been
    // recorded since the comparison engine took over the flow. This used to
    // count rows in `custom_business_quotes` — a table nothing writes to any
    // more — so the figure had been a hard zero every week regardless of how
    // many bills were analysed.
    const { count: billUploads } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("bill_uploaded", true)
      .gte("created_at", weekAgo.toISOString());

    // Affiliate clicks
    const { count: affiliateClicks } = await supabase
      .from("click_tracking")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    // Build and send report
    const reportData = {
      totalLeads: totalLeads || 0,
      leadsBySource,
      billUploads: billUploads || 0,
      affiliateClicks: affiliateClicks || 0,
      dateRange,
    };

    const template = weeklyReportEmail(reportData);
    const idempotencyKey = `weekly_report_${weekAgo.toISOString().split("T")[0]}`;

    const result = await sendEmail({
      to: recipients,
      subject: template.subject,
      html: template.html,
      idempotencyKey,
      eventType: "weekly_report",
    });

    return res.status(200).json({
      success: true,
      data: reportData,
      recipientCount: recipients.length,
      recipientSource: source,
      emailResult: result,
    });
  } catch (error) {
    console.error("Weekly report error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
