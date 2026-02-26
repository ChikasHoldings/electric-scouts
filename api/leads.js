import {
  supabase,
  sendEmail,
  leadWelcomeEmail,
  adminNewLeadEmail,
  ADMIN_EMAILS,
} from "./_lib/email.js";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, zip, name, source } = req.body;

    if (!email || !source) {
      return res.status(400).json({ error: "Email and source are required" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check for existing lead with same email (prevent duplicates)
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id, status")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existingLead) {
      if (existingLead.status === "unsubscribed") {
        return res.status(200).json({
          success: true,
          message: "Thank you! We already have your information on file.",
          duplicate: true,
        });
      }
      // Update existing lead with new source info
      await supabase
        .from("leads")
        .update({ zip: zip || undefined, name: name || undefined })
        .eq("id", existingLead.id);

      return res.status(200).json({
        success: true,
        message: "Thank you! We already have your information on file.",
        duplicate: true,
      });
    }

    // Create new lead
    const { data: lead, error: insertError } = await supabase
      .from("leads")
      .insert({
        email: email.toLowerCase().trim(),
        zip: zip || null,
        name: name || null,
        source,
        status: "new",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Lead insert error:", insertError);
      return res.status(500).json({ error: "Failed to save lead" });
    }

    // Send welcome email
    const welcomeTemplate = leadWelcomeEmail(lead.email, lead.name);
    await sendEmail({
      to: lead.email,
      subject: welcomeTemplate.subject,
      html: welcomeTemplate.html,
      idempotencyKey: `lead_welcome_${lead.id}`,
      eventType: "lead_welcome",
      leadId: lead.id,
    });

    // Notify admin(s)
    if (ADMIN_EMAILS.length > 0) {
      const adminTemplate = adminNewLeadEmail(lead);
      await sendEmail({
        to: ADMIN_EMAILS,
        subject: adminTemplate.subject,
        html: adminTemplate.html,
        idempotencyKey: `admin_new_lead_${lead.id}`,
        eventType: "admin_new_lead",
        leadId: lead.id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Thank you! Check your email for next steps.",
    });
  } catch (error) {
    console.error("Leads API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
