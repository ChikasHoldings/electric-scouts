import {
  filterEligible,
} from "../../src/components/compare/engine/eligibility.js";
import { parseComparisonRequest } from "../../src/components/compare/engine/comparisonRequest.js";
import { rankPlans } from "../../src/components/compare/engine/ranking.js";
import { compareToCurrentBill, currentBillTrust } from "../../src/components/compare/engine/savings.js";
import { benchmarkCurrentRate } from "../../src/components/compare/engine/rateBenchmark.js";
import {
  toResultDto,
  selectHeadline,
  MONETIZATION,
  PRICING_COMPLETENESS,
  MAX_RESULTS,
} from "../../src/components/compare/engine/resultsContract.js";
import { classifyMonetization } from "./referral.js";
import { selectTerritory } from "../../src/lib/deliveryTariff.js";

/**
 * The comparison service — the single authority for what a plan costs, where
 * it ranks, and what it is worth to the customer.
 *
 * Everything downstream of a comparison request goes through here: the results
 * board, and the comparison email. That is the point. Before this existed the
 * browser fetched raw plan rows and priced and ranked them in React, while the
 * email endpoint ran a third, cruder calculation of its own — rate × usage +
 * base charge — which ignored delivery charges, bill credits and credit
 * thresholds entirely. The same plan could therefore show one monthly figure on
 * screen, a different one in the customer's inbox, and be ranked #1 by whichever
 * of the two happened to flatter it.
 *
 * There is now one pricing truth, one ranking truth, and one outbound route,
 * computed here from the admin-managed catalog. A request carries qualification
 * inputs only; every number with commercial weight is produced on this side of
 * the boundary.
 */

/** Columns the public engine reads. Admin notes and commissions are not here. */
const PLAN_COLUMNS = `
  id, plan_name, provider_id, provider_name, rate_per_kwh, contract_length,
  plan_type, renewable_percentage, monthly_base_charge, base_charge,
  tdsp_charges, usage_credit, usage_credit_threshold, early_termination_fee,
  state, customer_type, is_active,
  provider:provider_id!inner ( id, name, logo_url, is_active )
`;

/**
 * The tallies that describe a comparison, split by what they actually measure.
 *
 * Two independent facts were previously reported in words that read as though
 * they were about the same thing, and the confusion had a price.
 *
 *   - PRICING COMPLETENESS is how much of the bill we could model.
 *     `complete`, `partial`, `pricingUnavailable`.
 *   - OUTBOUND MONETIZATION is what a click on the result is worth.
 *     `commissionCapable`, `internalTrackingOnly`, `outboundUnavailable`.
 *
 * The old field named plainly `unavailable` meant the first of those, while
 * `monetized` counted the second and third statuses together — so a result set
 * where every link was a plain provider page, earning nothing, was reported as
 * fully "monetized". Both names are kept below and marked legacy so no consumer
 * outside this repository breaks on a rename, but nothing in this repository
 * reads them any more.
 *
 * `eligible` counts every plan that matched; the rest describe the returned
 * slice, because that is the set the customer is actually looking at. The three
 * monetization counts therefore sum to `returned` exactly — a property the
 * server tests assert, since a result must have precisely one outbound status.
 */
export function countResults(allResults, returned) {
  const by = (predicate) => returned.filter(predicate).length;

  const commissionCapable = by((r) => r.monetizationStatus === MONETIZATION.COMMISSION_CAPABLE);
  const internalTrackingOnly = by((r) => r.monetizationStatus === MONETIZATION.INTERNAL_TRACKING_ONLY);
  const outboundUnavailable = by((r) => r.monetizationStatus === MONETIZATION.UNAVAILABLE);
  const pricingUnavailable = by((r) => r.pricingCompleteness === PRICING_COMPLETENESS.UNAVAILABLE);

  return {
    eligible: allResults.length,
    returned: returned.length,
    capped: allResults.length > returned.length,

    // ── Pricing completeness ──
    complete: by((r) => r.pricingCompleteness === PRICING_COMPLETENESS.COMPLETE),
    partial: by((r) => r.pricingCompleteness === PRICING_COMPLETENESS.PARTIAL),
    pricingUnavailable,

    renewable: by((r) => r.isRenewable),

    // ── Outbound monetization ──
    //
    // `commissionCapable` is the only one of these that can pay, and it is the
    // only one the monetization router is allowed to treat as revenue.
    commissionCapable,
    internalTrackingOnly,
    outboundUnavailable,
    renewableCommissionCapable: by(
      (r) => r.isRenewable && r.monetizationStatus === MONETIZATION.COMMISSION_CAPABLE
    ),

    // ── Legacy, deprecated: read the precise fields above instead ──
    /** @deprecated pricing completeness — use `pricingUnavailable`. */
    unavailable: pricingUnavailable,
    /** @deprecated counts tracked links as earning — use `commissionCapable`. */
    monetized: commissionCapable + internalTrackingOnly,
  };
}

/**
 * Build the tracked outbound route for a plan.
 *
 * The browser receives a route into ElectricScouts, never a provider URL:
 * /api/go resolves the destination from the slug at click time, so a tampered
 * client cannot redirect the revenue, and a link an admin re-points takes
 * effect without anything being rebuilt.
 *
 * Only identifiers and enumerated values ride along. No name, email, phone or
 * service address is ever put on an outbound query string.
 */
function buildOutboundRoute({ slug, plan, session, matchScore, baseUrl }) {
  if (!slug) return null;

  const params = new URLSearchParams();
  params.set("slug", slug);
  if (session.sessionId) params.set("s", session.sessionId);
  if (plan.id) params.set("p", String(plan.id));
  if (plan.plan_name) params.set("pn", String(plan.plan_name).slice(0, 160));
  if (session.entryContext) params.set("ec", session.entryContext);
  if (Number.isFinite(matchScore)) params.set("ms", String(matchScore));
  if (session.attribution?.utm_source) params.set("utm_source", session.attribution.utm_source);
  if (session.attribution?.utm_campaign) params.set("utm_campaign", session.attribution.utm_campaign);

  // Relative for the page; absolute for email, where a relative href is dead.
  return `${baseUrl || ""}/api/go?${params.toString()}`;
}

/**
 * Run a comparison.
 *
 * @param {object} supabase  a service-role client
 * @param {object} body      the untrusted request body
 * @param {{baseUrl?: string}} [options]
 * @returns {Promise<{ok: true, comparison: object} | {ok: false, status: number, error: string}>}
 */
export async function runComparison(supabase, body, options = {}) {
  const parsed = parseComparisonRequest(body);
  if (!parsed.ok) return { ok: false, status: 400, error: parsed.error };

  const { session, usageKwh } = parsed;

  // ── The canonical eligibility query ──
  //
  // One round trip for the whole catalog slice, never one per plan. The inner
  // join on electricity_providers is what makes a deactivated provider remove
  // its plans: a plan whose provider row does not satisfy is_active simply is
  // not returned. `provider_id` is the join, never the name — renaming a
  // provider must not orphan its plans.
  const { data: rows, error } = await supabase
    .from("electricity_plans")
    .select(PLAN_COLUMNS)
    .eq("is_active", true)
    .eq("state", session.state)
    .eq("provider.is_active", true);

  if (error) {
    console.error("comparison catalog query failed:", error.message);
    return { ok: false, status: 502, error: "catalog_unavailable" };
  }

  // The SQL already applies both active flags; re-checking through the shared
  // rule is deliberate belt-and-braces. It is the same function the admin
  // eligibility diagnostics call, so what an admin is told and what the public
  // engine enforces cannot drift, and a future query edit that loosens a filter
  // is caught here rather than in production.
  //
  // Branding then comes off the joined provider row rather than the plan's own
  // denormalized copy: `provider_name` on a plan is a stale snapshot, so
  // renaming a provider in admin updates one row while every plan would
  // otherwise keep advertising the old name until each was edited by hand.
  const eligible = filterEligible(rows || [], {
    state: session.state,
    customerType: session.customerType,
  }).map((row) => ({
    ...row,
    provider_name: row.provider?.name || row.provider_name,
    logo_url: row.provider?.logo_url || null,
  }));

  // ── Outbound routes, from the admin-configured relationships ──
  //
  // A second single query scoped to the providers actually in the result set,
  // joined to the provider so the destination can be resolved — and therefore
  // classified — with the same rule /api/go will apply at click time.
  const providerIds = [...new Set(eligible.map((r) => r.provider_id).filter(Boolean))];
  const linkByProvider = new Map();

  if (providerIds.length) {
    const { data: links } = await supabase
      .from("affiliate_links")
      .select("slug, provider_id, offer_id, target_url, provider:provider_id ( affiliate_url, website_url )")
      .eq("is_active", true)
      .in("provider_id", providerIds);

    for (const link of links || []) {
      // Offer-specific configuration wins; provider-level is the fallback that
      // carries production today. First write wins for equal specificity, which
      // keeps the choice stable across requests.
      const existing = linkByProvider.get(link.provider_id);
      if (!existing || (link.offer_id && !existing.offer_id)) {
        linkByProvider.set(link.provider_id, link);
      }
    }
  }

  const affiliateIds = new Set(
    eligible.filter((p) => linkByProvider.has(p.provider_id)).map((p) => p.id)
  );

  // ── The delivery tariff for this market ──
  //
  // A delivery charge belongs to a utility's service territory, not to a plan:
  // every retailer selling into Oncor bills the same Oncor delivery charge. It
  // is configured once per territory and resolved here, so one row makes every
  // plan in that market fully priceable instead of the number having to be
  // copied onto each of them.
  //
  // This table is admin-only under RLS and is read with the service role, so
  // the customer sees the tariff's effect on their price without the tariff
  // itself ever reaching the browser.
  const { data: territories, error: territoryError } = await supabase
    .from("utility_territories")
    .select(
      "id, name, state, billing_model, delivery_per_kwh_cents, fixed_monthly_delivery_charge, effective_from, effective_to, service_zip_prefixes, is_active"
    )
    .eq("is_active", true)
    .eq("state", session.state);

  // A tariff lookup that fails must not fail the comparison: without it every
  // plan simply prices supply-only, which is exactly the honest behaviour that
  // applies when no tariff is configured.
  if (territoryError) {
    console.error("utility territory lookup failed:", territoryError.message);
  }

  const territory = selectTerritory(territories || [], {
    state: session.state,
    zip: session.zip,
  });

  // ── Price, score and rank ──
  const { all } = rankPlans(eligible, session, { usageKwh, affiliateIds, territory });

  const allResults = all.map((entry) => {
    const link = linkByProvider.get(entry.plan.provider_id) || null;

    return toResultDto(entry, {
      rank: entry.rank,
      isTopMatch: entry.isTopMatch,
      // Savings is decided here, from the session's own bill figure, and is
      // withheld unless both sides are trustworthy. The browser never gets the
      // chance to compute one.
      comparison: compareToCurrentBill(entry.estimate, session),
      trackedOutboundRoute: buildOutboundRoute({
        slug: link?.slug,
        plan: entry.plan,
        session,
        matchScore: entry.match?.score,
        baseUrl: options.baseUrl,
      }),
      monetizationStatus: link ? classifyMonetization(link) : MONETIZATION.UNAVAILABLE,
    });
  });

  // ── Trim to the results worth reading ──
  //
  // Ranking has already decided what is best for this customer, so the cap
  // keeps the top of that order and drops the tail. A Texas search matches 96
  // plans; sending all 96 is not thoroughness, it is handing back the problem
  // the customer came here to have solved.
  //
  // `eligible` deliberately keeps counting every plan that matched, not the
  // number returned: "13 of 96 plans available in your area" is true and
  // useful, whereas quietly reporting 13 as the total would misstate the
  // market. The per-status counts describe the returned set, because they
  // describe the results the customer is actually looking at.
  const returned = allResults.slice(0, MAX_RESULTS);
  const { headline } = selectHeadline(returned);

  // ── Where this customer's current bill sits in their market ──
  //
  // Drawn from the full eligible set rather than the returned slice: "cheaper
  // than 62 of the 96 plans sold in your area" is a statement about the market,
  // and truncating the list for readability must not shrink the market it is
  // measured against.
  //
  // Gated on the same trust rules as the per-result savings line, so a bill we
  // are not willing to draw a savings figure from cannot produce a headline
  // score either.
  const trust = currentBillTrust(session);
  const benchmark = trust.trusted
    ? benchmarkCurrentRate(allResults, {
      currentMonthlyCost: trust.currentMonthly,
      usageKwh,
    })
    : { available: false, reason: trust.reason };

  return {
    ok: true,
    comparison: {
      state: session.state,
      customerType: session.customerType,
      usageKwh,
      benchmark,
      counts: countResults(allResults, returned),
      // The headline set, by id. The full ranked array already carries
      // `isTopMatch`; this is the same fact in the form a consumer that only
      // wants the top three can use without filtering.
      topMatchIds: headline.map((r) => r.planId),
      results: returned,
    },
  };
}
