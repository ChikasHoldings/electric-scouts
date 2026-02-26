import {
  supabase,
  sendEmail,
  leadFollowup1Email,
  leadFollowup2Email,
} from "./_lib/email.js";

export default async function handler(req, res) {
  // Allow both POST (manual trigger) and GET (cron trigger)
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional: verify cron secret for automated calls
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers["authorization"] !== `Bearer ${cronSecret}`) {
    if (req.method === "GET") {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    const now = new Date();
    const results = { followup1: 0, followup2: 0, skipped: 0, errors: 0 };

    // ─── Follow-up 1: leads created 24+ hours ago ─────────────────
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

    const { data: followup1Leads } = await supabase
      .from("leads")
      .select("id, email, name")
      .in("status", ["new", "active"])
      .lte("created_at", twentyFourHoursAgo)
      .gte("created_at", fortyEightHoursAgo);

    for (const lead of followup1Leads || []) {
      const idempotencyKey = `lead_followup_1_${lead.id}`;

      // Check if already sent
      const { data: existing } = await supabase
        .from("email_events")
        .select("id")
        .eq("idempotency_key", idempotencyKey)
        .eq("status", "sent")
        .maybeSingle();

      if (existing) {
        results.skipped++;
        continue;
      }

      const template = leadFollowup1Email(lead.email, lead.name);
      const result = await sendEmail({
        to: lead.email,
        subject: template.subject,
        html: template.html,
        idempotencyKey,
        eventType: "lead_followup_1",
        leadId: lead.id,
      });

      if (result.success) {
        results.followup1++;
        // Update lead status to active
        await supabase
          .from("leads")
          .update({ status: "active" })
          .eq("id", lead.id);
      } else {
        results.errors++;
      }
    }

    // ─── Follow-up 2: leads created 72+ hours ago ─────────────────
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();
    const ninetySixHoursAgo = new Date(now.getTime() - 96 * 60 * 60 * 1000).toISOString();

    const { data: followup2Leads } = await supabase
      .from("leads")
      .select("id, email, name")
      .in("status", ["new", "active"])
      .lte("created_at", seventyTwoHoursAgo)
      .gte("created_at", ninetySixHoursAgo);

    for (const lead of followup2Leads || []) {
      const idempotencyKey = `lead_followup_2_${lead.id}`;

      // Check if already sent
      const { data: existing } = await supabase
        .from("email_events")
        .select("id")
        .eq("idempotency_key", idempotencyKey)
        .eq("status", "sent")
        .maybeSingle();

      if (existing) {
        results.skipped++;
        continue;
      }

      const template = leadFollowup2Email(lead.email, lead.name);
      const result = await sendEmail({
        to: lead.email,
        subject: template.subject,
        html: template.html,
        idempotencyKey,
        eventType: "lead_followup_2",
        leadId: lead.id,
      });

      if (result.success) {
        results.followup2++;
        // Update lead status to nurtured
        await supabase
          .from("leads")
          .update({ status: "nurtured" })
          .eq("id", lead.id);
      } else {
        results.errors++;
      }
    }

    return res.status(200).json({
      success: true,
      results,
      message: `Processed: ${results.followup1} followup-1, ${results.followup2} followup-2, ${results.skipped} skipped, ${results.errors} errors`,
    });
  } catch (error) {
    console.error("Follow-ups error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
