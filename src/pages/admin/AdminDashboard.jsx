import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { summarizeRevenue } from "@/lib/revenue";
import { ElectricityProvider, ElectricityPlan } from "@/api/supabaseEntities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Wrapper {...wrapperProps}>
      <Card className={`hover:shadow-md transition-shadow ${link ? "cursor-pointer" : ""} group`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{title}</p>
              {loading ? (
                <div className="h-9 mt-1 flex items-center" aria-live="polite" aria-busy="true">
                  <span className="sr-only">Loading {title}</span>
                  <span className="block h-6 w-16 rounded bg-gray-200 animate-pulse" aria-hidden="true" />
                </div>
              ) : (
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
              )}
              {subtitle && !loading && (
                <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
              )}
              {loading && <div className="h-4 mt-1" aria-hidden="true" />}
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
          {link && (
            <div className="mt-4 flex items-center text-sm text-gray-500 group-hover:text-[#0A5C8C] transition-colors">
              <span>View all</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </CardContent>
      </Card>
    </Wrapper>
  );
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  // Revenue is an admin-only surface in the nav, so the dashboard must not be a
  // side door to the same figure for a viewer.
  const canSeeRevenue = profile?.role === "admin";

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
  const recentLeads = leadStats.recent;

  return (
    <div className="space-y-8">
      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Providers"
          value={providers.length}
          subtitle={`${activeProviders.length} active`}
          icon={Building2}
          color="bg-blue-500"
          link="/admin/providers"
          loading={loadingProviders}
        />
        <StatCard
          title="Plans"
          value={plans.length}
          subtitle="Electricity plans"
          icon={Zap}
          color="bg-orange-500"
          link="/admin/plans"
          loading={loadingPlans}
        />
        <StatCard
          title="Leads"
          value={leadStats.total}
          subtitle={`${leadStats.new} new`}
          icon={UserPlus}
          color="bg-purple-500"
          link="/admin/leads"
          loading={loadingLeads}
        />
      </div>

      {/* Affiliate & Lead Analytics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#0A5C8C]" />
          Analytics Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Affiliate Clicks"
            value={affiliateData.totalClicks}
            subtitle={`${affiliateData.recentClicks || 0} in last 7 days`}
            icon={MousePointerClick}
            color="bg-cyan-500"
            link="/admin/affiliates"
            loading={loadingAffiliates}
          />
          <StatCard
            title="Active Affiliate Links"
            value={affiliateData.activeLinks}
            subtitle={`${affiliateData.monthlyClicks || 0} clicks this month`}
            icon={Link2}
            color="bg-teal-500"
            link="/admin/affiliates"
            loading={loadingAffiliates}
          />
          {canSeeRevenue && (
            <StatCard
              title="Platform Earnings"
              value={`$${earnings.earned.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtitle={`$${earnings.accrued.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} accrued, not yet confirmed`}
              icon={CheckCircle2}
              color="bg-indigo-500"
              link="/admin/revenue"
              loading={loadingEarnings}
            />
          )}
        </div>
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
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
                      <p className="text-xs text-gray-500">
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

        {/* Top Affiliate Slugs */}
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

        {/* Platform Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Platform Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Active Providers
                  </span>
                </div>
                <span className="text-lg font-bold text-blue-700">
                  {activeProviders.length} / {providers.length}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">
                    Active Plans
                  </span>
                </div>
                <span className="text-lg font-bold text-purple-700">
                  {plans.filter((p) => p.is_active).length} / {plans.length}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">
                    Avg Plans per Provider
                  </span>
                </div>
                <span className="text-lg font-bold text-orange-700">
                  {providers.length > 0
                    ? (plans.length / providers.length).toFixed(1)
                    : "0"}
                </span>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
