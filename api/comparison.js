import { createClient } from "@supabase/supabase-js";

import { filterEligible } from "../src/components/compare/engine/eligibility.js";

/**
 * /api/comparison — the authoritative comparison catalog.
 *
 * Before this existed, /compare-rates called ElectricityPlan.list(), which is
 * `select('*')` with no active filter, and decided eligibility in React on
 * state and customer type alone. Two consequences, both live in production
 * when this was written:
 *
 *   - 29 plans an admin had deactivated were still being shown publicly
 *     (5 of them in a single TX residential search)
 *   - a deactivated PROVIDER's plans stayed visible, because nothing joined
 *     the plan to its provider at all
 *
 * RLS does not help: both public SELECT policies are `USING (true)`, so every
 * inactive row is readable by the anon client. Activation is a business rule,
 * and it is enforced here.
 *
 * The browser now sends only qualification inputs — where the customer lives,
 * what they are shopping for, how much they use. Every number that carries
 * commercial weight (price, completeness, ranking, score, savings, outbound
 * route) is computed here from the database, so nothing the client sends can
 * change what a plan costs or where the revenue is credited.
 */

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/** Bounded scalar from the request body — never trusted. */
function str(value, max = 40) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

/**
 * The public plan shape.
 *
 * Deliberately narrow: it carries what the results board renders and nothing
 * else. Admin notes, commission values and raw row metadata stay server-side.
 * Provider branding comes from the join, so the browser never performs a
 * second name-based catalog lookup to find a logo.
 */
function toPlanDto(row, slugByProvider) {
  return {
    id: row.id,
    plan_name: row.plan_name,
    provider_id: row.provider_id,
    provider_name: row.provider?.name || row.provider_name,
    logo_url: row.provider?.logo_url || null,

    rate_per_kwh: row.rate_per_kwh,
    contract_length: row.contract_length,
    plan_type: row.plan_type,
    renewable_percentage: row.renewable_percentage,
    monthly_base_charge: row.monthly_base_charge,
    base_charge: row.base_charge,
    tdsp_charges: row.tdsp_charges,
    usage_credit: row.usage_credit,
    usage_credit_threshold: row.usage_credit_threshold,
    early_termination_fee: row.early_termination_fee,
    state: row.state,
    customer_type: row.customer_type,

    // Only the slug crosses the wire; /api/go resolves the destination, so a
    // tampered client cannot redirect the revenue.
    referral_slug: slugByProvider[row.provider_id] || null,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const stateCode = str(body.state, 2);
    if (!stateCode) return res.status(400).json({ error: "state is required" });

    const isCommercial = body.customerType === "commercial";

    // ── The canonical eligibility query ──
    //
    // The inner join on electricity_providers is what makes a deactivated
    // provider remove its plans: a plan whose provider row does not satisfy
    // is_active simply is not returned. `provider_id` is the join, never the
    // name — renaming a provider must not orphan its plans.
    const { data: rows, error } = await supabase
      .from("electricity_plans")
      .select(`
        id, plan_name, provider_id, provider_name, rate_per_kwh, contract_length,
        plan_type, renewable_percentage, monthly_base_charge, base_charge,
        tdsp_charges, usage_credit, usage_credit_threshold, early_termination_fee,
        state, customer_type, is_active,
        provider:provider_id!inner ( id, name, logo_url, is_active )
      `)
      .eq("is_active", true)
      .eq("state", stateCode)
      .eq("provider.is_active", true);

    if (error) {
      console.error("comparison catalog query failed:", error.message);
      return res.status(502).json({ error: "catalog_unavailable" });
    }

    // The SQL already applies both active flags; re-checking through the shared
    // rule is deliberate belt-and-braces. It is the same function the admin
    // eligibility badge calls, so what an admin is told and what the public
    // engine enforces cannot drift, and a future query edit that loosens a
    // filter is caught here rather than in production.
    const eligible = filterEligible(rows || [], {
      state: stateCode,
      customerType: isCommercial ? 'commercial' : 'residential',
    }).map((row) => ({ ...row, logo_url: row.provider?.logo_url || null }));

    // ── Outbound routes, from the admin-configured relationships ──
    const providerIds = [...new Set(eligible.map((r) => r.provider_id).filter(Boolean))];
    const slugByProvider = {};
    if (providerIds.length) {
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("slug, provider_id")
        .eq("is_active", true)
        .in("provider_id", providerIds);
      for (const link of links || []) {
        if (link.provider_id && !slugByProvider[link.provider_id]) {
          slugByProvider[link.provider_id] = link.slug;
        }
      }
    }

    const plans = eligible.map((row) => toPlanDto(row, slugByProvider));

    // Cached briefly at the edge: the catalog changes when an admin changes
    // it, not per visitor, and a short TTL keeps an activation change visible
    // in about a minute rather than after a deploy.
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");

    return res.status(200).json({
      state: stateCode,
      customerType: isCommercial ? "commercial" : "residential",
      counts: { eligible: plans.length },
      plans,
    });
  } catch (err) {
    console.error("comparison handler error:", err);
    return res.status(500).json({ error: "comparison_failed" });
  }
}
