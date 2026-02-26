import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, adminResetCodeEmail } from "../_lib/email.js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Helpers ────────────────────────────────────────────────────────

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
}

async function logSecurityEvent(eventType, adminEmail, ip, details = {}) {
  try {
    await supabase.from("admin_security_events").insert({
      event_type: eventType,
      admin_email: adminEmail?.toLowerCase().trim() || null,
      ip_address: ip,
      details,
    });
  } catch (err) {
    console.error("Failed to log security event:", err);
  }
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const PASSWORD_REQUIREMENTS =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.";

// ─── Request Action ─────────────────────────────────────────────────

async function handleRequest(req, res) {
  const { email } = req.body;
  const ip = getClientIp(req);

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Rate limit by email: max 3 requests per email per hour
  const { count: emailCount } = await supabase
    .from("admin_reset_codes")
    .select("id", { count: "exact", head: true })
    .eq("admin_email", normalizedEmail)
    .gte("created_at", oneHourAgo);

  if (emailCount >= 3) {
    await logSecurityEvent("rate_limit_email", normalizedEmail, ip, {
      reason: "Exceeded 3 reset requests per hour for this email",
    });
    return res.status(200).json({
      success: true,
      message: "If an admin account exists with that email, a reset code has been sent.",
    });
  }

  // Rate limit by IP: max 10 requests per IP per hour (across all emails)
  const { count: ipCount } = await supabase
    .from("admin_security_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "reset_requested")
    .eq("ip_address", ip)
    .gte("created_at", oneHourAgo);

  if (ipCount >= 10) {
    await logSecurityEvent("rate_limit_ip", normalizedEmail, ip, {
      reason: "Exceeded 10 reset requests per hour from this IP",
    });
    return res.status(200).json({
      success: true,
      message: "If an admin account exists with that email, a reset code has been sent.",
    });
  }

  // Check if this email belongs to an admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("email", normalizedEmail)
    .eq("role", "admin")
    .maybeSingle();

  if (!profile) {
    await logSecurityEvent("reset_requested_nonexistent", normalizedEmail, ip);
    return res.status(200).json({
      success: true,
      message: "If an admin account exists with that email, a reset code has been sent.",
    });
  }

  // [HARDENING #1] Generate 6-digit code using crypto.randomInt (CSPRNG)
  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error: insertError } = await supabase
    .from("admin_reset_codes")
    .insert({
      admin_email: normalizedEmail,
      code,
      expires_at: expiresAt,
    });

  if (insertError) {
    console.error("Reset code insert error:", insertError);
    return res.status(500).json({ error: "Failed to generate reset code" });
  }

  const template = adminResetCodeEmail(code);
  await sendEmail({
    to: normalizedEmail,
    subject: template.subject,
    html: template.html,
    idempotencyKey: `admin_reset_${normalizedEmail}_${Date.now()}`,
    eventType: "admin_reset_code",
  });

  // [HARDENING #5] Log the reset request event
  await logSecurityEvent("reset_requested", normalizedEmail, ip);

  return res.status(200).json({
    success: true,
    message: "If an admin account exists with that email, a reset code has been sent.",
  });
}

// ─── Verify Action ──────────────────────────────────────────────────

async function handleVerify(req, res) {
  const { email, code } = req.body;
  const ip = getClientIp(req);

  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const { data: resetRecord, error: fetchError } = await supabase
    .from("admin_reset_codes")
    .select("*")
    .eq("admin_email", normalizedEmail)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error("Reset verify fetch error:", fetchError);
    return res.status(500).json({ error: "Internal server error" });
  }

  if (!resetRecord) {
    await logSecurityEvent("verify_no_record", normalizedEmail, ip);
    return res.status(400).json({ error: "Invalid or expired code. Please request a new one." });
  }

  if (resetRecord.attempts >= 5) {
    await supabase
      .from("admin_reset_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", resetRecord.id);

    // [HARDENING #5] Log lockout event
    await logSecurityEvent("verify_locked_out", normalizedEmail, ip, {
      reason: "Code locked after 5 failed attempts",
    });

    return res.status(400).json({ error: "Too many attempts. Please request a new code." });
  }

  await supabase
    .from("admin_reset_codes")
    .update({ attempts: resetRecord.attempts + 1 })
    .eq("id", resetRecord.id);

  if (new Date(resetRecord.expires_at) < new Date()) {
    await logSecurityEvent("verify_expired", normalizedEmail, ip);
    return res.status(400).json({ error: "Invalid or expired code. Please request a new one." });
  }

  if (resetRecord.code !== code.trim()) {
    // [HARDENING #2] Generic error message — no remaining attempts count
    await logSecurityEvent("verify_failed", normalizedEmail, ip, {
      attempts: resetRecord.attempts + 1,
    });
    return res.status(400).json({
      error: "Invalid or expired code. Please try again.",
    });
  }

  // Code is valid
  const verificationToken = crypto.randomUUID();

  await supabase
    .from("admin_reset_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", resetRecord.id);

  await supabase
    .from("admin_reset_codes")
    .insert({
      admin_email: normalizedEmail,
      code: `TOKEN:${verificationToken}`,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

  // [HARDENING #5] Log successful verification
  await logSecurityEvent("verify_success", normalizedEmail, ip);

  return res.status(200).json({
    success: true,
    verification_token: verificationToken,
    message: "Code verified. You may now set a new password.",
  });
}

// ─── Confirm Action ─────────────────────────────────────────────────

async function handleConfirm(req, res) {
  const { email, verification_token, new_password } = req.body;
  const ip = getClientIp(req);

  if (!email || !verification_token || !new_password) {
    return res.status(400).json({ error: "Email, verification token, and new password are required" });
  }

  // [HARDENING #4] Enforce strong password policy
  if (!PASSWORD_REGEX.test(new_password)) {
    return res.status(400).json({ error: PASSWORD_REQUIREMENTS });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const { data: tokenRecord, error: fetchError } = await supabase
    .from("admin_reset_codes")
    .select("*")
    .eq("admin_email", normalizedEmail)
    .eq("code", `TOKEN:${verification_token}`)
    .is("used_at", null)
    .maybeSingle();

  if (fetchError) {
    console.error("Reset confirm fetch error:", fetchError);
    return res.status(500).json({ error: "Internal server error" });
  }

  if (!tokenRecord) {
    await logSecurityEvent("confirm_invalid_token", normalizedEmail, ip);
    return res.status(400).json({ error: "Invalid or expired verification token" });
  }

  if (new Date(tokenRecord.expires_at) < new Date()) {
    await supabase
      .from("admin_reset_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenRecord.id);

    await logSecurityEvent("confirm_token_expired", normalizedEmail, ip);
    return res.status(400).json({ error: "Verification token has expired. Please start over." });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .eq("role", "admin")
    .maybeSingle();

  if (!profile) {
    await logSecurityEvent("confirm_admin_not_found", normalizedEmail, ip);
    return res.status(400).json({ error: "Admin account not found" });
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    profile.id,
    { password: new_password }
  );

  if (updateError) {
    console.error("Password update error:", updateError);
    await logSecurityEvent("confirm_password_update_failed", normalizedEmail, ip, {
      error: updateError.message,
    });
    return res.status(500).json({ error: "Failed to update password" });
  }

  await supabase
    .from("admin_reset_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenRecord.id);

  // [HARDENING #5] Log successful password reset
  await logSecurityEvent("password_reset_success", normalizedEmail, ip);

  return res.status(200).json({
    success: true,
    message: "Password updated successfully. You can now sign in with your new password.",
  });
}

// ─── Main Handler ───────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { action } = req.body;

    switch (action) {
      case "request":
        return await handleRequest(req, res);
      case "verify":
        return await handleVerify(req, res);
      case "confirm":
        return await handleConfirm(req, res);
      default:
        return res.status(400).json({ error: "Invalid action. Use 'request', 'verify', or 'confirm'." });
    }
  } catch (error) {
    console.error("Reset handler error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
