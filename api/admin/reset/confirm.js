import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, verification_token, new_password } = req.body;

    if (!email || !verification_token || !new_password) {
      return res.status(400).json({ error: "Email, verification token, and new password are required" });
    }

    // Validate password strength
    if (new_password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    // Verify the token
    const { data: tokenRecord, error: fetchError } = await supabase
      .from("admin_reset_codes")
      .select("*")
      .eq("admin_email", email.toLowerCase().trim())
      .eq("code", `TOKEN:${verification_token}`)
      .is("used_at", null)
      .maybeSingle();

    if (fetchError) {
      console.error("Reset confirm fetch error:", fetchError);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (!tokenRecord) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }

    // Check expiration
    if (new Date(tokenRecord.expires_at) < new Date()) {
      await supabase
        .from("admin_reset_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", tokenRecord.id);
      return res.status(400).json({ error: "Verification token has expired. Please start over." });
    }

    // Find the admin user in Supabase Auth
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .eq("role", "admin")
      .maybeSingle();

    if (!profile) {
      return res.status(400).json({ error: "Admin account not found" });
    }

    // Update the password via Supabase Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      profile.id,
      { password: new_password }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return res.status(500).json({ error: "Failed to update password" });
    }

    // Mark token as used
    await supabase
      .from("admin_reset_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenRecord.id);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset confirm error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
