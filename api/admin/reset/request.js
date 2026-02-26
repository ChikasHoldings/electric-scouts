import { supabase, sendEmail, adminResetCodeEmail } from "../../_lib/email.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Rate limit: max 3 requests per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("admin_reset_codes")
      .select("id", { count: "exact", head: true })
      .eq("admin_email", email.toLowerCase().trim())
      .gte("created_at", oneHourAgo);

    if (count >= 3) {
      // Generic response — don't reveal rate limiting
      return res.status(200).json({
        success: true,
        message: "If an admin account exists with that email, a reset code has been sent.",
      });
    }

    // Check if this email belongs to an admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("email", email.toLowerCase().trim())
      .eq("role", "admin")
      .maybeSingle();

    if (!profile) {
      // Generic response — don't reveal account existence
      return res.status(200).json({
        success: true,
        message: "If an admin account exists with that email, a reset code has been sent.",
      });
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // Store code
    const { error: insertError } = await supabase
      .from("admin_reset_codes")
      .insert({
        admin_email: email.toLowerCase().trim(),
        code,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Reset code insert error:", insertError);
      return res.status(500).json({ error: "Failed to generate reset code" });
    }

    // Send code via Resend
    const template = adminResetCodeEmail(code);
    await sendEmail({
      to: email.toLowerCase().trim(),
      subject: template.subject,
      html: template.html,
      idempotencyKey: `admin_reset_${email}_${Date.now()}`,
      eventType: "admin_reset_code",
    });

    return res.status(200).json({
      success: true,
      message: "If an admin account exists with that email, a reset code has been sent.",
    });
  } catch (error) {
    console.error("Reset request error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
