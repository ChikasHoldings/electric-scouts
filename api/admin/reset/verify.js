import { supabase } from "../../_lib/email.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    // Find the most recent unused code for this email
    const { data: resetRecord, error: fetchError } = await supabase
      .from("admin_reset_codes")
      .select("*")
      .eq("admin_email", email.toLowerCase().trim())
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Reset verify fetch error:", fetchError);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (!resetRecord) {
      return res.status(400).json({ error: "Invalid or expired code. Please request a new one." });
    }

    // Check attempts (max 5)
    if (resetRecord.attempts >= 5) {
      // Mark as used to prevent further attempts
      await supabase
        .from("admin_reset_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", resetRecord.id);
      return res.status(400).json({ error: "Too many attempts. Please request a new code." });
    }

    // Increment attempts
    await supabase
      .from("admin_reset_codes")
      .update({ attempts: resetRecord.attempts + 1 })
      .eq("id", resetRecord.id);

    // Check expiration
    if (new Date(resetRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: "Code has expired. Please request a new one." });
    }

    // Verify code
    if (resetRecord.code !== code.trim()) {
      return res.status(400).json({
        error: `Invalid code. ${4 - resetRecord.attempts} attempts remaining.`,
      });
    }

    // Code is valid — generate a one-time verification token
    const verificationToken = crypto.randomUUID();

    // Mark code as used and store the verification token
    await supabase
      .from("admin_reset_codes")
      .update({
        used_at: new Date().toISOString(),
        // Store token in the code field since it's been verified
      })
      .eq("id", resetRecord.id);

    // Store the verification token temporarily — reuse the table with a new row
    await supabase
      .from("admin_reset_codes")
      .insert({
        admin_email: email.toLowerCase().trim(),
        code: `TOKEN:${verificationToken}`,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min to set new password
      });

    return res.status(200).json({
      success: true,
      verification_token: verificationToken,
      message: "Code verified. You may now set a new password.",
    });
  } catch (error) {
    console.error("Reset verify error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
