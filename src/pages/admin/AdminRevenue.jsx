import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { adminPost } from "@/lib/adminApi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Loader2, AlertTriangle, CheckCircle2, Link2, Plus, Handshake, ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import {
  providerRevenueState, summarize, prioritizedGaps, BLOCKER_LABELS, BLOCKER_ACTIONS,
} from "@/lib/monetizationHealth";
import { isCommissionCapable } from "@/lib/commissionCapable";
import {
  summarizeRevenue, summarizeDeliveries, REVENUE_STATUS, STATUS_LABELS, SOURCE_LABELS,
} from "@/lib/revenue";
import AdminPage from "@/components/admin/AdminPage";

/**
 * Revenue.
 *
 * One screen for the whole money question, because it was previously two
 * half-answers: a readiness page that could tell you how much inventory was
 * capable of earning, and nothing at all that could tell you what had actually
 * been earned.
 *
 * The organising principle is the line between accrued and earned. A per-click
 * commission we have booked is activity; it becomes revenue when the partner
 * agrees it is owed. Those two numbers are never added together here, and the
 * headline figure is always the conservative one.
 */

const money = (n) =>
  `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Stat({ label, value, sub, tone = "neutral" }) {
  const toneClasses = {
    neutral: "text-gray-900",
    good: "text-[#0A7C52]",
    warn: "text-amber-700",
    muted: "text-gray-500",
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

const STATUS_STYLES = {
  [REVENUE_STATUS.PAID]: "text-[#0A7C52] border-[#0A7C52]/30 bg-[#0A7C52]/5",
  [REVENUE_STATUS.CONFIRMED]: "text-[#0A5C8C] border-[#0A5C8C]/30 bg-[#0A5C8C]/5",
  [REVENUE_STATUS.PENDING]: "text-amber-700 border-amber-300 bg-amber-50",
  [REVENUE_STATUS.REVERSED]: "text-gray-500 border-gray-300 bg-gray-50",
};

function StatusBadge({ status }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status] || "text-gray-600"}>
      {STATUS_LABELS[status] || status}
    </Badge>
  );
}

export default function AdminRevenue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [conversionOpen, setConversionOpen] = useState(false);
  const [conversionForm, setConversionForm] = useState({
    affiliateLinkId: "", amount: "", externalReference: "", occurredAt: "", description: "",
  });
  const [conversionErrors, setConversionErrors] = useState({});

  // ─── The ledger, and everything attributable to it ────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: async () => {
      const [events, deliveries, providers, plans, links] = await Promise.all([
        supabase.from("revenue_events").select("*").order("occurred_at", { ascending: false }).limit(500),
        supabase.from("lead_deliveries").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("electricity_providers").select("id, name, is_active, logo_url"),
        supabase.from("electricity_plans").select("provider_id, is_active"),
        supabase.from("affiliate_links").select("id, slug, label, provider_id, target_url, is_active, commission_model, commission_amount, network"),
      ]);

      // The ledger is the one query whose failure must be visible. If the
      // catalog side fails the readiness table degrades; if this fails, every
      // number on the page would silently read zero, which looks exactly like
      // "we earned nothing" and is the most dangerous wrong answer here.
      if (events.error) throw events.error;

      return {
        events: events.data || [],
        deliveries: deliveries.data || [],
        providers: providers.data || [],
        plans: plans.data || [],
        links: links.data || [],
      };
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ eventId, status }) => adminPost("revenue-status", { eventId, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-revenue"] });
      toast({ title: "Ledger updated" });
    },
    onError: (err) => toast({ title: "Could not update", description: err.message, variant: "destructive" }),
  });

  const recordConversion = useMutation({
    mutationFn: (payload) => adminPost("record-conversion", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-revenue"] });
      setConversionOpen(false);
      setConversionForm({ affiliateLinkId: "", amount: "", externalReference: "", occurredAt: "", description: "" });
      toast({ title: "Conversion recorded" });
    },
    onError: (err) =>
      toast({ title: "Could not record conversion", description: err.message, variant: "destructive" }),
  });

  const earnings = useMemo(() => summarizeRevenue(data?.events || []), [data]);
  const delivery = useMemo(() => summarizeDeliveries(data?.deliveries || []), [data]);

  // ─── Readiness: how much inventory could earn at all ──────
  const readiness = useMemo(() => {
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

  const visibleEvents = useMemo(() => {
    const rows = data?.events || [];
    return statusFilter === "all" ? rows : rows.filter((e) => e.status === statusFilter);
  }, [data, statusFilter]);

  // A per-click rate that has never been configured is the single most common
  // reason earnings are zero, so it is surfaced rather than left to be deduced.
  const earningLinks = useMemo(
    () => (data?.links || []).filter((l) => l.is_active && l.commission_model && l.commission_model !== "none"),
    [data]
  );

  const submitConversion = () => {
    const errors = {};
    if (!conversionForm.affiliateLinkId) errors.affiliateLinkId = "Choose the link the conversion came through.";
    const amount = Number(conversionForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) errors.amount = "Enter the amount the partner is paying.";
    if (Object.keys(errors).length) {
      setConversionErrors(errors);
      return;
    }
    setConversionErrors({});
    recordConversion.mutate({
      affiliateLinkId: conversionForm.affiliateLinkId,
      amount,
      externalReference: conversionForm.externalReference || undefined,
      occurredAt: conversionForm.occurredAt || undefined,
      description: conversionForm.description || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
        <p className="text-[15px] font-medium text-gray-900">Couldn&rsquo;t load the revenue ledger</p>
        <p className="mt-1 text-[13.5px] text-gray-600">
          No figures are shown rather than zeroes, because an empty ledger and an
          unreachable one mean very different things. Refresh to try again.
        </p>
      </div>
    );
  }

  return (
    <AdminPage>
      <p className="text-[14px] text-gray-600 leading-relaxed max-w-3xl">
        Earnings are what a partner has agreed to pay. Accrued is what we have
        booked but nobody has confirmed yet &mdash; real activity, not revenue.
        The two are never added together on this page.
      </p>

      {/* ── Earnings ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Total platform earnings"
          value={money(earnings.earned)}
          tone={earnings.earned > 0 ? "good" : "muted"}
          sub={`${money(earnings.received)} received · ${money(earnings.confirmed)} confirmed, awaiting payment`}
        />
        <Stat
          label="Accrued, not yet confirmed"
          value={money(earnings.accrued)}
          tone={earnings.accrued > 0 ? "warn" : "muted"}
          sub="Booked against partner agreements. Not counted as earnings."
        />
        <Stat
          label="Earned this month"
          value={money(earnings.earnedThisMonth)}
          sub={`${money(earnings.accruedThisMonth)} accrued this month`}
        />
        <Stat
          label="Leads sold"
          value={delivery.accepted}
          tone={delivery.accepted > 0 ? "good" : "muted"}
          sub={
            delivery.acceptanceRate === null
              ? `${delivery.awaitingDecision} awaiting a buyer decision`
              : `${delivery.acceptanceRate}% acceptance · ${money(delivery.acceptedValue)} agreed`
          }
        />
      </div>

      {earnings.events === 0 && (
        <div className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
          <AlertTriangle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-[15px] font-medium text-gray-900">Nothing on the ledger yet</p>
            <p className="mt-1 text-[13.5px] text-gray-600 leading-relaxed">
              {earningLinks.length === 0 ? (
                <>
                  No affiliate link has commission terms configured, so no click
                  can accrue anything. Set a commission model on a link under{" "}
                  <Link to="/admin/affiliates" className="text-[#0A5C8C] hover:underline">Affiliates</Link>,
                  or record a conversion a network has already reported.
                </>
              ) : (
                <>
                  {earningLinks.length} link{earningLinks.length === 1 ? " has" : "s have"} commission
                  terms configured. Earnings appear here as clicks and lead sales come in.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* ── Where it comes from ── */}
      {earnings.bySource.length > 0 && (
        <section>
          <h2 className="text-[16px] font-semibold text-gray-900 mb-3">By source</h2>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Earned</TableHead>
                    <TableHead className="text-right">Accrued</TableHead>
                    <TableHead className="text-right">Reversed</TableHead>
                    <TableHead className="text-right">Events</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.bySource.map((row) => (
                    <TableRow key={row.source}>
                      <TableCell className="font-medium text-gray-900">
                        {SOURCE_LABELS[row.source] || row.source}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{money(row.earned)}</TableCell>
                      <TableCell className="text-right tabular-nums text-amber-700">{money(row.accrued)}</TableCell>
                      <TableCell className="text-right tabular-nums text-gray-500">{money(row.reversed)}</TableCell>
                      <TableCell className="text-right tabular-nums text-gray-600">{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── The ledger ── */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-[16px] font-semibold text-gray-900">
            Ledger
            <span className="ml-2 text-[13px] font-normal text-gray-500">
              every earning event, most recent first
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value={REVENUE_STATUS.PENDING}>Accrued</SelectItem>
                <SelectItem value={REVENUE_STATUS.CONFIRMED}>Confirmed</SelectItem>
                <SelectItem value={REVENUE_STATUS.PAID}>Paid</SelectItem>
                <SelectItem value={REVENUE_STATUS.REVERSED}>Reversed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setConversionOpen(true)} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" aria-hidden="true" />
              Record conversion
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {visibleEvents.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-[15px] text-gray-600">
                  {(data?.events || []).length === 0
                    ? "No earning events recorded yet."
                    : "No events with this status."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-[13px] text-gray-600 whitespace-nowrap">
                        {new Date(event.occurred_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-700">
                        {SOURCE_LABELS[event.source] || event.source}
                      </TableCell>
                      <TableCell className="text-[13.5px] font-medium text-gray-900">
                        {event.partner_name || "—"}
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-600 max-w-[260px] truncate" title={event.description || ""}>
                        {event.description || "—"}
                        {event.external_reference && (
                          <span className="block text-[12px] text-gray-400">ref {event.external_reference}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{money(event.amount)}</TableCell>
                      <TableCell><StatusBadge status={event.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {event.status === REVENUE_STATUS.PENDING && (
                            <Button
                              variant="outline" size="sm"
                              disabled={updateStatus.isPending}
                              onClick={() => updateStatus.mutate({ eventId: event.id, status: REVENUE_STATUS.CONFIRMED })}
                            >
                              Confirm
                            </Button>
                          )}
                          {event.status === REVENUE_STATUS.CONFIRMED && (
                            <Button
                              variant="outline" size="sm"
                              disabled={updateStatus.isPending}
                              onClick={() => updateStatus.mutate({ eventId: event.id, status: REVENUE_STATUS.PAID })}
                            >
                              Mark paid
                            </Button>
                          )}
                          {event.status !== REVENUE_STATUS.REVERSED && (
                            <Button
                              variant="ghost" size="sm"
                              className="text-gray-500 hover:text-red-600"
                              disabled={updateStatus.isPending}
                              onClick={() => updateStatus.mutate({ eventId: event.id, status: REVENUE_STATUS.REVERSED })}
                            >
                              Reverse
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Readiness ── */}
      {readiness.summary && (
        <section className="space-y-4">
          <div>
            <h2 className="text-[16px] font-semibold text-gray-900">Revenue readiness</h2>
            <p className="mt-1 text-[13.5px] text-gray-600 leading-relaxed max-w-3xl">
              A tracked click and an earning click are not the same thing. Every
              outbound click is recorded against its session, plan and provider,
              but only a destination carrying real affiliate-network tracking can
              be credited to Electric Scouts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat
              label="Revenue-ready inventory"
              value={`${readiness.summary.earningPlanShare}%`}
              tone={readiness.summary.earningPlanShare >= 80 ? "good" : "warn"}
              sub={`${readiness.summary.earningPlans.toLocaleString()} of ${readiness.summary.activePlans.toLocaleString()} active plans can earn commission`}
            />
            <Stat
              label="Earning providers"
              value={`${readiness.summary.earningProviders} / ${readiness.summary.activeProviders}`}
              tone={readiness.summary.earningProviders === readiness.summary.activeProviders ? "good" : "warn"}
              sub="Active providers with a commission-capable referral URL"
            />
            <Stat
              label="Links with commission terms"
              value={`${earningLinks.length} / ${(data?.links || []).filter((l) => l.is_active).length}`}
              tone={earningLinks.length > 0 ? "good" : "warn"}
              sub="A link with no terms configured earns nothing, however well it converts"
            />
            <Stat
              label="Missing branding"
              value={readiness.summary.providersMissingLogo}
              tone={readiness.summary.providersMissingLogo === 0 ? "good" : "warn"}
              sub="Active providers with no logo — results show an initials mark"
            />
          </div>

          {readiness.gaps.length > 0 && (
            <div>
              <div className="flex items-baseline justify-between gap-4 mb-3">
                <h3 className="text-[15px] font-semibold text-gray-900">
                  Revenue gaps
                  <span className="ml-2 text-[13px] font-normal text-gray-500">
                    {readiness.gaps.length} {readiness.gaps.length === 1 ? "provider" : "providers"}, highest inventory first
                  </span>
                </h3>
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
                      {readiness.gaps.map((row) => (
                        <TableRow key={row.providerId}>
                          <TableCell className="font-medium text-gray-900">{row.providerName}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.activePlans}</TableCell>
                          <TableCell>
                            {row.tracked ? (
                              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                                Tracked, not earning
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600">Not routed</Badge>
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
            </div>
          )}

          <div>
            <h3 className="text-[15px] font-semibold text-gray-900 mb-3">All providers</h3>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead className="text-right">Active plans</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Referral links</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Logo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {readiness.states.map((row) => (
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
          </div>
        </section>
      )}

      <p className="text-[12.5px] text-gray-500 leading-relaxed max-w-3xl">
        Commission capability is detected from the destination URL: a known
        affiliate-network host, or an affiliate identifier in the query string.
        A provider&rsquo;s own public plans page is recorded and attributed but
        earns nothing, and is reported as such rather than counted as monetized.
        Lead sale prices come from{" "}
        <Link to="/admin/lead-buyers" className="inline-flex items-center gap-1 text-[#0A5C8C] hover:underline">
          <Handshake className="w-3 h-3" aria-hidden="true" />
          Lead Buyers
        </Link>
        , captured at the moment of delivery.
      </p>

      {/* ── Record a conversion the network has reported ── */}
      <Dialog open={conversionOpen} onOpenChange={setConversionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record an affiliate conversion</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <p className="text-[13px] text-gray-600 leading-relaxed">
              For per-signup and revenue-share agreements, which cannot be
              accrued from a click. Enter what the network&rsquo;s statement says.
            </p>

            <div>
              <Label className="block text-[13px] font-medium text-gray-700 mb-1.5">Affiliate link</Label>
              <Select
                value={conversionForm.affiliateLinkId}
                onValueChange={(v) => setConversionForm({ ...conversionForm, affiliateLinkId: v })}
              >
                <SelectTrigger><SelectValue placeholder="Choose a link" /></SelectTrigger>
                <SelectContent>
                  {(data?.links || []).map((link) => (
                    <SelectItem key={link.id} value={link.id}>
                      /go/{link.slug}{link.label ? ` — ${link.label}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {conversionErrors.affiliateLinkId && (
                <p role="alert" className="mt-1.5 text-[12.5px] text-red-600">{conversionErrors.affiliateLinkId}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="block text-[13px] font-medium text-gray-700 mb-1.5">Amount ($)</Label>
                <Input
                  inputMode="decimal"
                  value={conversionForm.amount}
                  onChange={(e) => setConversionForm({ ...conversionForm, amount: e.target.value })}
                />
                {conversionErrors.amount && (
                  <p role="alert" className="mt-1.5 text-[12.5px] text-red-600">{conversionErrors.amount}</p>
                )}
              </div>
              <div>
                <Label className="block text-[13px] font-medium text-gray-700 mb-1.5">Date</Label>
                <Input
                  type="date"
                  value={conversionForm.occurredAt}
                  onChange={(e) => setConversionForm({ ...conversionForm, occurredAt: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label className="block text-[13px] font-medium text-gray-700 mb-1.5">Network reference</Label>
              <Input
                value={conversionForm.externalReference}
                onChange={(e) => setConversionForm({ ...conversionForm, externalReference: e.target.value })}
                placeholder="Transaction ID from the network statement"
              />
              <p className="mt-1.5 text-[12.5px] text-gray-500">
                Recommended — it is what stops the same commission being booked twice.
              </p>
            </div>

            <div>
              <Label className="block text-[13px] font-medium text-gray-700 mb-1.5">Description</Label>
              <Input
                value={conversionForm.description}
                onChange={(e) => setConversionForm({ ...conversionForm, description: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConversionOpen(false)}>Cancel</Button>
            <Button onClick={submitConversion} disabled={recordConversion.isPending}>
              {recordConversion.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
              Record conversion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-[12px] text-gray-400">
        <a
          href="https://www.awin.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-gray-600"
        >
          Affiliate networks
          <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </a>
      </p>
    </AdminPage>
  );
}
