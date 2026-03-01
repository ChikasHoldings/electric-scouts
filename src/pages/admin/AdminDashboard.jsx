import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import {
  ElectricityProvider,
  ElectricityPlan,
  Article,
  Profile,
} from "@/api/supabaseEntities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Zap,
  FileText,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Link2,
  MousePointerClick,
  UserPlus,
  BarChart3,
} from "lucide-react";

function StatCard({ title, value, icon: Icon, color, link, subtitle }) {
  const Wrapper = link ? Link : "div";
  const wrapperProps = link ? { to: link } : {};

  return (
    <Wrapper {...wrapperProps}>
      <Card className={`hover:shadow-md transition-shadow ${link ? "cursor-pointer" : ""} group`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
              )}
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
  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ["admin-providers"],
    queryFn: () => ElectricityProvider.list(),
  });

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => ElectricityPlan.list(),
  });

  const { data: articles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: () => Article.list(),
  });

  // Leads query
  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["admin-dashboard-leads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => Profile.list(),
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

  const isLoading =
    loadingProviders || loadingPlans || loadingArticles || loadingLeads || loadingUsers || loadingAffiliates;

  const activeProviders = providers.filter((p) => p.is_active);
  const publishedArticles = articles.filter((a) => a.published);
  const newLeads = leads.filter((l) => l.status === "new");
  const convertedLeads = leads.filter((l) => l.status === "converted");
  const recentLeads = leads.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A5C8C]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Providers"
          value={providers.length}
          subtitle={`${activeProviders.length} active`}
          icon={Building2}
          color="bg-blue-500"
          link="/admin/providers"
        />
        <StatCard
          title="Plans"
          value={plans.length}
          subtitle="Electricity plans"
          icon={Zap}
          color="bg-orange-500"
          link="/admin/plans"
        />
        <StatCard
          title="Articles"
          value={articles.length}
          subtitle={`${publishedArticles.length} published`}
          icon={FileText}
          color="bg-green-500"
          link="/admin/articles"
        />
        <StatCard
          title="Leads"
          value={leads.length}
          subtitle={`${newLeads.length} new`}
          icon={UserPlus}
          color="bg-purple-500"
          link="/admin/leads"
        />
        <StatCard
          title="Users"
          value={users.length}
          subtitle="Registered users"
          icon={Users}
          color="bg-slate-600"
          link="/admin/users"
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
          />
          <StatCard
            title="Active Affiliate Links"
            value={affiliateData.activeLinks}
            subtitle={`${affiliateData.monthlyClicks || 0} clicks this month`}
            icon={Link2}
            color="bg-teal-500"
            link="/admin/affiliates"
          />
          <StatCard
            title="Converted Leads"
            value={convertedLeads.length}
            subtitle={`${leads.length} total leads`}
            icon={CheckCircle2}
            color="bg-indigo-500"
            link="/admin/leads"
          />
          <StatCard
            title="New Leads"
            value={newLeads.length}
            subtitle="Awaiting follow-up"
            icon={AlertCircle}
            color="bg-rose-500"
            link="/admin/leads"
          />
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

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    Published Articles
                  </span>
                </div>
                <span className="text-lg font-bold text-green-700">
                  {publishedArticles.length} / {articles.length}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">
                    New Leads
                  </span>
                </div>
                <span className="text-lg font-bold text-purple-700">
                  {newLeads.length}
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

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-medium text-slate-900">
                    Admin Users
                  </span>
                </div>
                <span className="text-lg font-bold text-slate-700">
                  {users.filter((u) => u.role === "admin").length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
