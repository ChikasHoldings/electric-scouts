import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { summarizeRevenue } from "@/lib/revenue";
import { ElectricityProvider, ElectricityPlan } from "@/api/supabaseEntities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminPage, { AdminSectionHeading } from "@/components/admin/AdminPage";
import { canAccessPath } from "@/lib/adminNav";
import {
  Building2,
  Zap,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Link2,
  MousePointerClick,
  UserPlus,
  BarChart3,
  Wallet,
  Activity,
} from "lucide-react";

/**
 * One dashboard figure.
 *
 * `loading` shows a placeholder bar instead of the value. Without it every tile
 * rendered its default — 0, or $0.00 — and then snapped to the real number when
 * its query landed, so the dashboard visibly counted up on every visit. A
 * placeholder says "not known yet", which is the truth, and does not move.
 */
function StatCard({ title, value, icon: Icon, color, link, subtitle, loading }) {
  const Wrapper = link ? Link : "div";
  const wrapperProps = link ? { to: link } : {};

  return (
    // h-full down the whole chain: tiles sit in a grid, and a subtitle that
    // wraps to two lines used to make its tile taller than the ones beside it,
    // so a row of four ended at four different heights.
    <Wrapper {...wrapperProps} className="block h-full">
      <Card className={`h-full flex flex-col hover:shadow-md transition-shadow ${link ? "cursor-pointer" : ""} group`}>
        <CardContent className="p-6 flex flex-col flex-1">
          {/* Title and icon share a row; the figure gets a row of its own.
              They used to sit side by side, which left the value competing for
              width with the icon — "$48,213.50" ran straight into it. */}
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-gray-500 min-w-0">{title}</p>
            <div className={`p-3 rounded-xl flex-shrink-0 ${color}`}>
              <Icon className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
          </div>

          {loading ? (
            <div className="h-9 mt-1 flex items-center" aria-live="polite" aria-busy="true">
              <span className="sr-only">Loading {title}</span>
              <span className="block h-6 w-16 rounded bg-gray-200 animate-pulse" aria-hidden="true" />
            </div>
          ) : (
            <p className="text-3xl font-bold text-gray-900 mt-1 tabular-nums break-words">
              {value}
            </p>
          )}

          {subtitle && !loading && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
          {loading && <div className="h-4 mt-1" aria-hidden="true" />}

          {link && (
            // mt-auto pins this to the bottom, so the "View all" rows across a
            // row of tiles line up regardless of how tall each subtitle ran.
            <div className="mt-auto pt-4 flex items-center text-sm text-gray-500 group-hover:text-[#0A5C8C] transition-colors">
              <span>View all</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </CardContent>
      </Card>
    </Wrapper>
  );
}

/**
 * One line of the Platform Overview card.
 *
 * The three rows were the same twelve lines of markup with a colour swapped,
 * and none of them had a loading state — so on every visit the card asserted
 * "0 / 0 active providers" until its queries landed. A ratio of nothing to
 * nothing is not a fact about the platform; it is the absence of one.
 */
function OverviewRow({ icon: Icon, label, value, tone, loading }) {
  const { bg, iconColor, labelColor, valueColor } = {
    blue: {
      bg: "bg-blue-50", iconColor: "text-blue-600",
      labelColor: "text-blue-900", valueColor: "text-blue-700",
    },
    purple: {
      bg: "bg-purple-50", iconColor: "text-purple-600",
      labelColor: "text-purple-900", valueColor: "text-purple-700",
    },
    orange: {
      bg: "bg-orange-50", iconColor: "text-orange-600",
      labelColor: "text-orange-900", valueColor: "text-orange-700",
    },
  }[tone];

  return (
    <div className={`flex items-center justify-between gap-3 p-3 rounded-lg ${bg}`}>
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} aria-hidden="true" />
        <span className={`text-sm font-medium truncate ${labelColor}`}>{label}</span>
      </div>
      {loading ? (
        <span className="block h-5 w-12 rounded bg-black/10 animate-pulse flex-shrink-0" aria-hidden="true" />
      ) : (
        <span className={`text-lg font-bold flex-shrink-0 ${valueColor}`}>{value}</span>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { profile } = useAuth();

  /**
   * The dashboard obeys the same permission table as the guard.
   *
   * Every screen here is a summary of some other screen, and the role that may
   * not open the other screen must not be handed its contents through this one.
   * Two holes this closes: a viewer, who cannot open Leads, was being shown the
   * five most recent leads by name and email address; and the affiliate tiles
   * linked to /admin/affiliates for everyone, though that screen is admin-only
   * — so an editor got a "View all" that lands on Restricted Access.
   *
   * Deriving it from canAccessPath rather than re-testing the role means this
   * cannot drift from the sidebar and the guard the way three hand-kept lists
   * already did once.
   */
  const role = profile?.role || "viewer";
  const can = (path) => canAccessPath(role, path);

  const canSeeLeads = can("/admin/leads");
  const canSeeAffiliates = can("/admin/affiliates");
  const canSeeRevenue = can("/admin/revenue");

  // A tile still shows its number to anyone who may see the dashboard; what it
  // does not do is offer a way through to a screen the role cannot open.
  const linkIf = (path) => (can(path) ? path : undefined);

  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ["admin-providers"],
    queryFn: () => ElectricityProvider.list(),
  });

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => ElectricityPlan.list(),
  });

  /**
   * Lead figures, counted rather than sampled.
   *
   * This previously fetched the 10 most recent leads and reported
   * `leads.length` as the total, with "converted" counted over the same ten
   * rows. Every lead number on the dashboard was therefore capped at 10 and
   * silently wrong the moment the eleventh lead arrived. Counts come from the
   * database now; the recent list stays a sample, because that is all it is.
   */
  const { data: leadStats = { total: 0, new: 0, converted: 0, recent: [] }, isLoading: loadingLeads } = useQuery({
    queryKey: ["admin-dashboard-leads"],
    queryFn: async () => {
      const countOf = (build) =>
        build(supabase.from("leads").select("id", { count: "exact", head: true }));

      const [total, newCount, converted, recent] = await Promise.all([
        countOf((q) => q),
        countOf((q) => q.eq("status", "new")),
        countOf((q) => q.eq("status", "converted")),
        supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      return {
        total: total.count || 0,
        new: newCount.count || 0,
        converted: converted.count || 0,
        recent: recent.data || [],
      };
    },
  });

  // Money actually earned, so the dashboard agrees with the revenue screen
  // rather than offering a second, friendlier version of the same question.
  const { data: earnings = { earned: 0, accrued: 0 }, isLoading: loadingEarnings } = useQuery({
    queryKey: ["admin-dashboard-earnings"],
    enabled: canSeeRevenue,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenue_events")
        .select("amount, status, occurred_at, source, partner_name");
      if (error) throw error;
      return summarizeRevenue(data || []);
    },
  });

  // Affiliate analytics
  const { data: affiliateData = { totalClicks: 0, topSlugs: [], activeLinks: 0 }, isLoading: loadingAffiliates } = useQuery({
    queryKey: ["admin-affiliate-analytics"],
    queryFn: async () => {
      // Get active affiliate links count
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("slug, is_active");

      const activeLinks = (links || []).filter((l) => l.is_active).length;

      // Get click tracking data
      const { data: clicks } = await supabase
        .from("click_tracking")
        .select("slug, created_at");

      const totalClicks = (clicks || []).length;

      // Count clicks per slug
      const slugCounts = {};
      (clicks || []).forEach((c) => {
        slugCounts[c.slug] = (slugCounts[c.slug] || 0) + 1;
      });

      // Top 5 slugs by click count
      const topSlugs = Object.entries(slugCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([slug, count]) => ({ slug, count }));

      // Clicks in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentClicks = (clicks || []).filter(
        (c) => new Date(c.created_at) >= sevenDaysAgo
      ).length;

      // Clicks in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyClicks = (clicks || []).filter(
        (c) => new Date(c.created_at) >= thirtyDaysAgo
      ).length;

      return { totalClicks, topSlugs, activeLinks, recentClicks, monthlyClicks };
    },
  });

  const activeProviders = providers.filter((p) => p.is_active);
  const activePlans = plans.filter((p) => p.is_active);
  const recentLeads = leadStats.recent;
  const loadingCatalog = loadingProviders || loadingPlans;

  const money = (n) =>
    `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  /**
   * The analytics row, built as data rather than markup.
   *
   * Earnings is admin-only, so this row is four tiles for an admin and three
   * for everyone else. It used to be a fixed four-column grid with the earnings
   * tile conditionally rendered inside it, which left a viewer looking at a row
   * with a hole in it where the tile they may not see would have been. Building
   * the list first means the grid can be sized to what is actually in it.
   */
  const analyticsTiles = [
    {
      key: "clicks",
      title: "Affiliate Clicks",
      value: affiliateData.totalClicks,
      subtitle: `${affiliateData.recentClicks || 0} in the last 7 days`,
      icon: MousePointerClick,
      color: "bg-cyan-500",
      link: linkIf("/admin/affiliates"),
      loading: loadingAffiliates,
    },
    {
      key: "links",
      title: "Active Affiliate Links",
      value: affiliateData.activeLinks,
      subtitle: `${affiliateData.monthlyClicks || 0} clicks in the last 30 days`,
      icon: Link2,
      color: "bg-teal-500",
      link: linkIf("/admin/affiliates"),
      loading: loadingAffiliates,
    },
    {
      // Counted by the database alongside the other lead totals. It was being
      // fetched and then never shown, so the one number that says whether any
      // of this turns into customers was missing from the dashboard.
      key: "converted",
      title: "Converted Leads",
      value: leadStats.converted,
      subtitle: `of ${leadStats.total} captured`,
      icon: Activity,
      color: "bg-emerald-500",
      link: linkIf("/admin/leads"),
      loading: loadingLeads,
    },
    canSeeRevenue && {
      key: "earnings",
      title: "Platform Earnings",
      value: money(earnings.earned),
      subtitle: `${money(earnings.accrued)} accrued, not yet confirmed`,
      icon: Wallet,
      color: "bg-indigo-500",
      link: linkIf("/admin/revenue"),
      loading: loadingEarnings,
    },
  ].filter(Boolean);

  const analyticsColumns =
    analyticsTiles.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";

  // Platform Overview is always present; the other two depend on the role. A
  // fixed three-column grid would leave a viewer's single card floating in the
  // left third of an otherwise empty row.
  const activityCardCount = 1 + (canSeeLeads ? 1 : 0) + (canSeeAffiliates ? 1 : 0);
  const activityColumns =
    activityCardCount === 3 ? "lg:grid-cols-3" : activityCardCount === 2 ? "lg:grid-cols-2" : "";

  return (
    <AdminPage>
      {/* The at-a-glance row: what the catalog holds, and what it is capturing.
          It carries no heading of its own — the top bar's title and one-liner
          already introduce it. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Providers"
          value={providers.length}
          subtitle={`${activeProviders.length} active`}
          icon={Building2}
          color="bg-blue-500"
          link={linkIf("/admin/providers")}
          loading={loadingProviders}
        />
        <StatCard
          title="Plans"
          value={plans.length}
          subtitle={`${activePlans.length} active`}
          icon={Zap}
          color="bg-orange-500"
          link={linkIf("/admin/plans")}
          loading={loadingPlans}
        />
        <StatCard
          title="Leads"
          value={leadStats.total}
          subtitle={`${leadStats.new} new`}
          icon={UserPlus}
          color="bg-purple-500"
          link={linkIf("/admin/leads")}
          loading={loadingLeads}
        />
      </div>

      {/* What the catalog is producing */}
      <section>
        <AdminSectionHeading icon={BarChart3}>Analytics Overview</AdminSectionHeading>
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${analyticsColumns} gap-4`}>
          {analyticsTiles.map(({ key, ...tile }) => (
            <StatCard key={key} {...tile} />
          ))}
        </div>
      </section>

      {/* The detail behind the numbers above. Each card is a window onto another
          screen, so each is shown only to a role that may open that screen —
          these carry named people and named links, not just totals. */}
      <section>
        <AdminSectionHeading icon={Activity}>Recent Activity</AdminSectionHeading>
        <div className={`grid grid-cols-1 ${activityColumns} gap-6 items-start`}>
          {/* Recent Leads */}
          {canSeeLeads && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Leads</CardTitle>
                <Link
                  to="/admin/leads"
                  className="text-sm text-[#0A5C8C] hover:underline"
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentLeads.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No leads captured yet
                </p>
              ) : (
                <div className="space-y-3">
                  {recentLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {lead.name || lead.email || "Unknown"}
                        </p>
                        {/* Truncated like the line above it. Without this a long
                            address widened the row past the viewport and scrolled
                            the whole dashboard sideways on a phone. */}
                        <p className="text-xs text-gray-500 truncate">
                          {lead.email}{lead.state ? ` · ${lead.state}` : ''}
                        </p>
                      </div>
                      <Badge
                        variant={
                          lead.status === "converted"
                            ? "default"
                            : lead.status === "contacted"
                            ? "secondary"
                            : "outline"
                        }
                        className="ml-3 flex-shrink-0"
                      >
                        {lead.status === "converted" && (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        )}
                        {lead.status === "contacted" && (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {lead.status === "new" && (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        )}
                        {lead.status || "new"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Top Affiliate Slugs */}
          {canSeeAffiliates && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Top Affiliate Links</CardTitle>
                <Link
                  to="/admin/affiliates"
                  className="text-sm text-[#0A5C8C] hover:underline"
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {affiliateData.topSlugs.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No affiliate clicks recorded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {affiliateData.topSlugs.map((item, index) => (
                    <div
                      key={item.slug}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                            ? "bg-gray-400"
                            : index === 2
                            ? "bg-amber-600"
                            : "bg-gray-300"
                        }`}>
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            /go/{item.slug}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-3">
                        <MousePointerClick className="w-3 h-3 text-cyan-500" />
                        <span className="text-sm font-semibold text-gray-700">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Platform Overview — totals only, so everyone who may open the
              dashboard may see it. */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Platform Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <OverviewRow
                  icon={Building2}
                  label="Active Providers"
                  value={`${activeProviders.length} / ${providers.length}`}
                  tone="blue"
                  loading={loadingProviders}
                />
                <OverviewRow
                  icon={Zap}
                  label="Active Plans"
                  value={`${activePlans.length} / ${plans.length}`}
                  tone="purple"
                  loading={loadingPlans}
                />
                <OverviewRow
                  icon={TrendingUp}
                  label="Avg Plans per Provider"
                  value={
                    providers.length > 0
                      ? (plans.length / providers.length).toFixed(1)
                      : "—"
                  }
                  tone="orange"
                  loading={loadingCatalog}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AdminPage>
  );
}
