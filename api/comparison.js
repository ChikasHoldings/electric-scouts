import { createClient } from "@supabase/supabase-js";

import { runComparison } from "./_lib/comparison.js";

/**
 * /api/comparison — the authoritative comparison endpoint.
 *
 * The browser sends qualification inputs only: where the customer lives, what
 * they are shopping for, how much they use, what they pay today. It receives
 * finished results — priced, ranked, scored and routed.
 *
 * Nothing on the response can be traced back to a number the client supplied.
 * A body carrying `estimatedMonthlyCost`, `matchScore`, `rank` or an affiliate
 * URL is not rejected, it is simply not read: `parseComparisonRequest` copies
 * across the qualification fields it recognises and discards everything else,
 * so those keys never reach the engine.
 *
 * All the real work is in `_lib/comparison.js`, which the comparison email
 * calls too — that shared call is what keeps the inbox and the webpage quoting
 * the same price for the same plan.
 */

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await runComparison(supabase, req.body || {});

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    // Not cached at the edge.
    //
    // The response is personalized — usage, the customer's current bill and
    // their stated preferences all change the prices, the ranking and the
    // scores — so a shared cache would serve one visitor's comparison to
    // another. The catalog query behind it is two indexed reads.
    res.setHeader("Cache-Control", "private, no-store");

    return res.status(200).json(result.comparison);
  } catch (err) {
    console.error("comparison handler error:", err);
    return res.status(500).json({ error: "comparison_failed" });
  }
}
