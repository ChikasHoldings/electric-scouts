import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { isCommissionCapable, resolutionOf, resolveRedirectUrl } from "./_lib/referral.js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Affiliate redirect handler: /api/go?slug=xxx
 * 1. Looks up the affiliate_links table for a matching active slug
 * 2. Validates the target_url is a proper URL
 * 3. Falls back to the provider's website_url if affiliate URL is invalid
 * 4. Records the click in click_tracking
 * 5. Redirects to the resolved URL
 */
/** Bounded, safe scalar from a query param — never trusted, never PII. */
function param(value, max = 120) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function intParam(value, max = 10000) {
  const n = parseInt(param(value) || "", 10);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}

/** UUID or null. Anything else is discarded rather than written. */
function uuidParam(value) {
  const v = param(value, 40);
  return v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? v : null;
}

export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    return res.status(400).send(buildFallbackPage("Missing Link", "No affiliate link was specified."));
  }

  try {
    // Look up the affiliate link
    const { data: link, error } = await supabase
      .from("affiliate_links")
      .select("*, provider:provider_id(name, website_url, affiliate_url)")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !link) {
      return res.status(404).send(buildFallbackPage(
        "Link Not Found",
        "This affiliate link is no longer available or has expired."
      ));
    }

    // Resolve the best available URL
    let redirectUrl = resolveRedirectUrl(link);

    if (!redirectUrl) {
      return res.status(404).send(buildFallbackPage(
        "Provider Link Unavailable",
        "We couldn't find a valid link for this provider. Please try again later."
      ));
    }

    // Record the click (non-blocking — don't await)
    const referrer = req.headers.referer || req.headers.referrer || null;
    const userAgent = req.headers["user-agent"] || null;
    const ipRaw = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || req.socket?.remoteAddress || "";
    const ipHash = crypto.createHash("sha256").update(ipRaw).digest("hex").substring(0, 16);

    // Attribution. Migration 014 added these columns; without them a click was
    // a slug, a user agent and a hashed IP — impossible to tie to the
    // comparison that produced it, so no conversion could be attributed.
    //
    // Everything here is a non-PII identifier or an enumerated value. No name,
    // email, phone or service address is accepted, and anything malformed is
    // discarded rather than written.
    const resolution = resolutionOf(link, redirectUrl);

    supabase
      .from("click_tracking")
      .insert({
        slug: link.slug,
        referrer,
        user_agent: userAgent,
        ip_hash: ipHash,
        resolved_url: redirectUrl,

        session_id: param(req.query.s, 64),
        provider_id: link.provider_id || null,
        provider_name: link.provider?.name || null,
        plan_id: uuidParam(req.query.p),
        plan_name: param(req.query.pn, 160),
        match_score: intParam(req.query.ms, 100),
        result_position: intParam(req.query.rp, 500),
        result_section: ["top_match", "more_options"].includes(req.query.rs) ? req.query.rs : null,
        entry_context: param(req.query.ec, 60),
        utm_source: param(req.query.utm_source, 80),
        utm_campaign: param(req.query.utm_campaign, 80),

        resolution,
        // The distinction the business needs: a click through /api/go to a
        // plain provider page is attributable internally, but it is NOT
        // commission-bearing unless the destination carries real network
        // tracking. Recording them as the same thing would overstate revenue.
        monetized: isCommissionCapable(redirectUrl),
      })
      .then(() => {})
      .catch(() => {});

    // Redirect to resolved URL
    res.setHeader("Location", redirectUrl);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.status(302).end();

  } catch (err) {
    console.error("Affiliate redirect error:", err);
    return res.status(500).send(buildFallbackPage(
      "Something Went Wrong",
      "We encountered an error processing this link. Please try again later."
    ));
  }
}

function buildFallbackPage(title, message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ElectricScouts</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a2332 0%, #0f1923 100%);
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 480px;
    }
    .icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
    }
    h1 {
      font-size: 1.75rem;
      margin-bottom: 1rem;
      color: #f97316;
    }
    p {
      font-size: 1.1rem;
      color: #94a3b8;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    a {
      display: inline-block;
      background: #f97316;
      color: #fff;
      text-decoration: none;
      padding: 0.75rem 2rem;
      border-radius: 0.5rem;
      font-weight: 600;
      transition: background 0.2s;
    }
    a:hover { background: #ea580c; }
    .brand {
      margin-top: 3rem;
      font-size: 0.85rem;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⚡</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">Back to ElectricScouts</a>
    <div class="brand">ElectricScouts — Compare. Save. Go Green.</div>
  </div>
</body>
</html>`;
}
