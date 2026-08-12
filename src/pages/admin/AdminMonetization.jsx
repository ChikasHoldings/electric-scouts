import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import { Loader2, AlertTriangle, CheckCircle2, Link2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import {
  providerRevenueState,
  summarize,
  prioritizedGaps,
  BLOCKER_LABELS,
  BLOCKER_ACTIONS,
} from "@/lib/monetizationHealth";
import { isCommissionCapable } from "@/lib/commissionCapable";

/**
 * Monetization health.
 *
 * The question this page answers is not "is the platform wired up" — it is
 * "how much of what a customer sees can actually pay us, and what is stopping
 * the rest". Those are different, and the gap between them was invisible
 * everywhere else in the admin.
 *
 * Every number is computed from live catalog rows on each load. Nothing here
 * is stored, cached or hardcoded, so it cannot drift from reality.
 */

/** One headline figure. */
function Stat({ label, value, sub, tone = "neutral" }) {
  const toneClasses = {
    neutral: "text-gray-900",
    good: "text-[#0A7C52]",
    warn: "text-amber-700",
  }[tone];

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-[13px] font-medium text-gray-500">{label}</p>
        <p className={`mt-1.5 text-[28px] font-semibold leading-none tracking-[-0.02em] ${toneClasses}`}>
          {value}
        </p>
        {sub && <p className="mt-2 text-[12.5px] text-gray-500 leading-relaxed">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminMonetization() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-monetization-health"],
    queryFn: async () => {
      const [providers, plans, links] = await Promise.all([
        supabase.from("electricity_providers").select("id, name, is_active, logo_url"),
        supabase.from("electricity_plans").select("provider_id, is_active"),
        supabase.from("affiliate_links").select("slug, provider_id, target_url, is_active"),
      ]);
      if (providers.error) throw providers.error;
      if (plans.error) throw plans.error;
      if (links.error) throw links.error;
      return { providers: providers.data || [], plans: plans.data || [], links: links.data || [] };
    },
  });

  const { states, summary, gaps } = useMemo(() => {
    if (!data) return { states: [], summary: null, gaps: [] };

    const activePlanCount = {};
    for (const plan of data.plans) {
      if (plan.is_active && plan.provider_id) {
        activePlanCount[plan.provider_id] = (activePlanCount[plan.provider_id] || 0) + 1;
      }
    }

    const linksByProvider = {};
    for (const link of data.links) {
      if (!link.provider_id) continue;
      (linksByProvider[link.provider_id] ||= []).push(link);
    }

    const computed = data.providers.map((provider) =>
      providerRevenueState(
        provider,
        linksByProvider[provider.id] || [],
        activePlanCount[provider.id] || 0,
        isCommissionCapable
      )
    );

    return { states: computed, summary: summarize(computed), gaps: prioritizedGaps(computed) };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
        <p className="text-[15px] font-medium text-gray-900">Couldn&rsquo;t load monetization data</p>
        <p className="mt-1 text-[13.5px] text-gray-600">Refresh to try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[14px] text-gray-600 leading-relaxed max-w-3xl">
          A tracked click and an earning click are not the same thing. Every
          outbound click is recorded against its session, plan and provider —
          but only a destination carrying real affiliate-network tracking can
          actually be credited to Electric Scouts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Revenue-ready inventory"
          value={`${summary.earningPlanShare}%`}
          tone={summary.earningPlanShare >= 80 ? "good" : "warn"}
          sub={`${summary.earningPlans.toLocaleString()} of ${summary.activePlans.toLocaleString()} active plans can earn commission`}
        />
        <Stat
          label="Earning providers"
          value={`${summary.earningProviders} / ${summary.activeProviders}`}
          tone={summary.earningProviders === summary.activeProviders ? "good" : "warn"}
          sub="Active providers with a commission-capable referral URL"
        />
        <Stat
          label="Tracked providers"
          value={`${summary.trackedProviders} / ${summary.activeProviders}`}
          sub="Clicks are attributed, whether or not they can pay"
        />
        <Stat
          label="Missing branding"
          value={summary.providersMissingLogo}
          tone={summary.providersMissingLogo === 0 ? "good" : "warn"}
          sub="Active providers with no logo — results show an initials mark"
        />
      </div>

      {gaps.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <h2 className="text-[16px] font-semibold text-gray-900">
              Revenue gaps
              <span className="ml-2 text-[13px] font-normal text-gray-500">
                {gaps.length} {gaps.length === 1 ? "provider" : "providers"}, highest inventory first
              </span>
            </h2>
            <Link to="/admin/affiliates">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                Manage links
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Active plans</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>What&rsquo;s blocking revenue</TableHead>
                    <TableHead>Next step</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gaps.map((row) => (
                    <TableRow key={row.providerId}>
                      <TableCell className="font-medium text-gray-900">{row.providerName}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.activePlans}</TableCell>
                      <TableCell>
                        {row.tracked ? (
                          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                            Tracked, not earning
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            Not routed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-[13.5px] text-gray-700">
                        {BLOCKER_LABELS[row.primaryBlocker]}
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-600">
                        {BLOCKER_ACTIONS[row.primaryBlocker]}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}

      <section>
        <h2 className="text-[16px] font-semibold text-gray-900 mb-3">All providers</h2>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Active plans</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Referral link</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Logo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {states.map((row) => (
                  <TableRow key={row.providerId} className={row.providerActive ? "" : "opacity-60"}>
                    <TableCell className="font-medium text-gray-900">{row.providerName}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.activePlans}</TableCell>
                    <TableCell>
                      {row.providerActive
                        ? <Badge variant="outline" className="text-[#0A7C52] border-[#0A7C52]/30 bg-[#0A7C52]/5">Active</Badge>
                        : <Badge variant="outline" className="text-gray-500">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="text-[13.5px] text-gray-700 tabular-nums">
                      {row.activeLinkCount > 0 ? `${row.activeLinkCount} active` : "—"}
                    </TableCell>
                    <TableCell>
                      {row.earning ? (
                        <span className="inline-flex items-center gap-1.5 text-[13px] text-[#0A7C52]">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          Can earn
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[13px] text-amber-700">
                          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                          No
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-[13px] text-gray-600">
                      {row.hasLogo ? "Yes" : "Fallback mark"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <p className="text-[12.5px] text-gray-500 leading-relaxed max-w-3xl">
        Commission capability is detected from the destination URL: a known
        affiliate-network host, or an affiliate identifier in the query string.
        A provider&rsquo;s own public plans page is recorded and attributed but
        earns nothing, and is reported here as such rather than counted as
        monetized.{" "}
        <a
          href="https://www.awin.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#0A5C8C] hover:underline"
        >
          Affiliate networks
          <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </a>
      </p>
    </div>
  );
}
