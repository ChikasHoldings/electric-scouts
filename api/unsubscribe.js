import { supabase } from "./_lib/email.js";

export default async function handler(req, res) {
  // Support both GET (link click) and POST
  const email =
    req.method === "GET"
      ? req.query?.email
      : req.body?.email;

  if (!email) {
    return res.status(400).send(unsubscribePage("Missing email parameter.", false));
  }

  try {
    const { error } = await supabase
      .from("leads")
      .update({ status: "unsubscribed" })
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Unsubscribe error:", error);
    }

    // Always show success (generic response — don't reveal if email exists)
    return res.status(200).send(unsubscribePage(email, true));
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return res.status(200).send(unsubscribePage(email, true));
  }
}

function unsubscribePage(email, success) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unsubscribe — ElectricScouts</title>
<style>
  body { margin:0; padding:0; background:#f4f7fa; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; }
  .card { background:#fff; border-radius:12px; padding:48px; max-width:480px; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.08); }
  h1 { color:#0A5C8C; font-size:24px; margin:0 0 16px; }
  p { color:#374151; line-height:1.6; margin:0 0 24px; }
  a { color:#0A5C8C; text-decoration:none; font-weight:600; }
</style>
</head>
<body>
<div class="card">
  <h1>⚡ ElectricScouts</h1>
  ${success
    ? `<p>You have been successfully unsubscribed. You will no longer receive emails from us.</p>`
    : `<p>${email}</p>`
  }
  <a href="/">← Back to ElectricScouts</a>
</div>
</body>
</html>`;
}
