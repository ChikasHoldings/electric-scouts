import {
  supabase,
  sendEmail,
  weeklyReportEmail,
  ADMIN_EMAILS,
} from "../_lib/email.js";

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
    if (ADMIN_EMAILS.length === 0) {
      return res.status(200).json({ success: true, message: "No admin emails configured" });
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

    // Bill uploads (quotes with bill_file_url)
    const { count: billUploads } = await supabase
      .from("custom_quotes")
      .select("id", { count: "exact", head: true })
      .not("bill_file_url", "is", null)
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
      to: ADMIN_EMAILS,
      subject: template.subject,
      html: template.html,
      idempotencyKey,
      eventType: "weekly_report",
    });

    return res.status(200).json({
      success: true,
      data: reportData,
      emailResult: result,
    });
  } catch (error) {
    console.error("Weekly report error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
