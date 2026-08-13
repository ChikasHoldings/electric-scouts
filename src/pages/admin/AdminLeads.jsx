import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lead } from "@/api/supabaseEntities";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { adminPost } from "@/lib/adminApi";
import { leadMonetizationState } from "@/lib/revenue";
import { REJECTION_LABELS } from "@/lib/leadBuyerRouting";
import {
  describeSource, inSegment, countBySegment, SEGMENTS, SEGMENT_LABELS,
} from "@/lib/leadSources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import LeadComparisonDetail, {
  CustomerTypeCell,
  QualificationBadge,
  RouteBadge,
} from "@/components/admin/LeadComparisonDetail";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Loader2,
  Users,
  Eye,
  Trash2,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  UserX,
  Download,
  RefreshCw,
  TrendingUp,
  Send,
  Handshake,
  ShieldAlert,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// ─── Status Config ──────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "new", label: "New", icon: AlertCircle, color: "bg-blue-100 text-blue-700" },
  { value: "active", label: "Active", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  { value: "nurtured", label: "Nurtured", icon: Send, color: "bg-purple-100 text-purple-700" },
  { value: "converted", label: "Converted", icon: TrendingUp, color: "bg-emerald-100 text-emerald-700" },
  { value: "unsubscribed", label: "Unsubscribed", icon: UserX, color: "bg-gray-100 text-gray-600" },
];

// ─── State Names ──────────────────────────────────────────
const STATE_NAMES = {
  'TX': 'Texas', 'OH': 'Ohio', 'PA': 'Pennsylvania', 'NY': 'New York',
  'NJ': 'New Jersey', 'MD': 'Maryland', 'IL': 'Illinois', 'CT': 'Connecticut',
  'MA': 'Massachusetts', 'ME': 'Maine', 'NH': 'New Hampshire', 'RI': 'Rhode Island',
};

function getStatusBadge(status) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  const Icon = opt.icon;
  return (
    <Badge variant="outline" className={`${opt.color} border-0`}>
      <Icon className="w-3 h-3 mr-1" />
      {opt.label}
    </Badge>
  );
}

/**
 * Where the lead came from, described by the shared registry.
 *
 * Previously two label maps lived here, written against source values the
 * capture forms never send — so every badge fell through to the raw string.
 */
function getSourceBadge(lead) {
  const { label, tone } = describeSource(lead);
  return (
    <Badge variant="outline" className={`${tone} border-0 text-xs`}>
      {label}
    </Badge>
  );
}

export default function AdminLeads() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  // Buyer payout terms are admin-only at the row level, so an editor's query
  // would come back empty. That is a permission boundary, not evidence that no
  // buyers exist — and the difference matters, because telling an editor
  // "no buyers are configured" would send them to fix a problem that isn't
  // theirs and isn't real. Editors still forward leads; the server picks the
  // buyer with the service role.
  const canReadBuyers = profile?.role === "admin";
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [viewLead, setViewLead] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ─── Data Fetching ──────────────────────────────────────
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: () => Lead.list(),
  });

  // Where each lead actually went. Fetched alongside the leads so the list can
  // show the outcome per row — "captured" and "sold" look identical otherwise,
  // and the difference is the entire point of the page.
  const { data: deliveries = [] } = useQuery({
    queryKey: ["admin-lead-deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_deliveries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: buyers = [] } = useQuery({
    queryKey: ["admin-lead-buyers"],
    enabled: canReadBuyers,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_buyers")
        .select("id, name, is_active, price_per_lead, priority")
        .order("priority", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // ─── Mutations ──────────────────────────────────────────
  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => Lead.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      toast({ title: "Lead status updated" });
    },
  });

  const deleteLead = useMutation({
    mutationFn: (id) => Lead.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      setDeleteConfirm(null);
      toast({ title: "Lead deleted" });
    },
  });

  const refreshRouting = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
    queryClient.invalidateQueries({ queryKey: ["admin-lead-deliveries"] });
    queryClient.invalidateQueries({ queryKey: ["admin-revenue"] });
  };

  // Forwarding runs the same server path capture-time routing uses, so a lead
  // sent by hand is deduplicated, capped and put on the ledger identically.
  const forwardLead = useMutation({
    mutationFn: ({ leadId, buyerId }) =>
      adminPost("route-lead", { leadId, buyerId: buyerId || undefined }),
    onSuccess: (result) => {
      refreshRouting();
      if (result.delivered && result.buyer) {
        toast({ title: `Lead sent to ${result.buyer.name}` });
      } else {
        // A lead nobody will take is a configuration answer, not a failure, so
        // it is reported as the reason rather than as an error toast.
        toast({
          title: "No buyer took this lead",
          description:
            result.coverage?.noBuyersConfigured
              ? "No lead buyers are configured yet."
              : "Every active buyer's targeting excludes it. Open the lead for the breakdown.",
        });
      }
    },
    onError: (err) =>
      toast({ title: "Could not forward lead", description: err.message, variant: "destructive" }),
  });

  const setDeliveryStatus = useMutation({
    mutationFn: ({ deliveryId, status }) => adminPost("delivery-status", { deliveryId, status }),
    onSuccess: (_result, variables) => {
      refreshRouting();
      toast({
        title: variables.status === "accepted" ? "Marked as accepted" : "Marked as rejected",
        description:
          variables.status === "accepted"
            ? "Revenue for this sale is now confirmed on the ledger."
            : "The accrued revenue for this sale has been reversed.",
      });
    },
    onError: (err) =>
      toast({ title: "Could not update delivery", description: err.message, variant: "destructive" }),
  });

  const deliveriesByLead = useMemo(() => {
    const map = new Map();
    for (const row of deliveries) {
      if (!row.lead_id) continue;
      const list = map.get(row.lead_id) || [];
      list.push(row);
      map.set(row.lead_id, list);
    }
    return map;
  }, [deliveries]);

  // ─── Computed Stats ──────────────────────────────────────
  const stats = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter(l => l.status === 'new').length;
    const activeCount = leads.filter(l => l.status === 'active').length;
    const convertedCount = leads.filter(l => l.status === 'converted').length;
    // Segment counts come from the shared registry. The previous substring
    // tests ("source includes 'business'") never matched anything the capture
    // forms actually write, so the business tile read 0 no matter how many
    // commercial leads had arrived.
    const segments = countBySegment(leads);
    const todayCount = leads.filter(l => {
      const d = new Date(l.created_at);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length;
    // Routing outcomes, computed from deliveries rather than from a status
    // string on the lead — the delivery rows are the record of what actually
    // happened, and a label can fall out of step with them.
    const sold = new Set(deliveries.filter(d => d.status === 'accepted').map(d => d.lead_id)).size;
    const awaiting = new Set(
      deliveries.filter(d => d.status === 'delivered' || d.status === 'pending').map(d => d.lead_id)
    ).size;
    const routedIds = new Set(deliveries.map(d => d.lead_id));
    // Only leads that could be sold count as "unrouted" — an affiliate lead is
    // monetized by its click, so counting it here would invent a backlog.
    const sellable = leads.filter(l =>
      l.consent_contact === true &&
      ['residential_partner', 'commercial_partner', 'renewable_partner'].includes(l.monetization_route)
    );
    const unrouted = sellable.filter(l => !routedIds.has(l.id)).length;

    return {
      total, newCount, activeCount, convertedCount, todayCount,
      sold, awaiting, unrouted, sellable: sellable.length, segments,
    };
  }, [leads, deliveries]);

  // ─── Filtering ──────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (search) {
        const q = search.toLowerCase();
        const match = (lead.email || '').toLowerCase().includes(q) ||
          (lead.name || '').toLowerCase().includes(q) ||
          (lead.zip || '').includes(q) ||
          (lead.city || '').toLowerCase().includes(q) ||
          (lead.state || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterStatus !== 'all' && lead.status !== filterStatus) return false;
      if (!inSegment(lead, filterSource)) return false;
      if (filterState !== 'all' && lead.state !== filterState) return false;
      return true;
    });
  }, [leads, search, filterStatus, filterSource, filterState]);

  // ─── Export CSV ──────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['Name', 'Email', 'ZIP', 'City', 'State', 'Source', 'Source Page', 'Status', 'Created At'];
    const rows = filteredLeads.map(l => [
      l.name || '', l.email, l.zip || '', l.city || '',
      l.state ? STATE_NAMES[l.state] || l.state : '',
      describeSource(l).label,
      l.source_page || '',
      l.status || '',
      new Date(l.created_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `electric-scouts-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `Exported ${filteredLeads.length} leads` });
  };

  // ─── Unique States for Filter ──────────────────────────
  const uniqueStates = useMemo(() => {
    const states = [...new Set(leads.map(l => l.state).filter(Boolean))].sort();
    return states;
  }, [leads]);

  // No <AdminLayout> wrapper — AdminRoute already provides it.
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Action bar — sits right below the AdminLayout top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-500">
          {stats.total} total leads &middot; {stats.todayCount} today &middot; {stats.newCount} new
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-leads"] })}
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
          >
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Leads" value={stats.total} color="text-gray-900" border="border-l-[#0A5C8C]" />
        <StatCard label="New" value={stats.newCount} color="text-blue-600" border="border-l-blue-500" />
        <StatCard label="Sold" value={stats.sold} color="text-emerald-600" border="border-l-emerald-500" />
        <StatCard label="Awaiting buyer" value={stats.awaiting} color="text-amber-600" border="border-l-amber-500" />
        <StatCard label="Sellable, unrouted" value={stats.unrouted} color="text-rose-600" border="border-l-rose-500" />
      </div>

      {/* Where the leads came from. Clicking a segment filters the table, so the
          breakdown is a way into the data rather than a decoration. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">By source:</span>
        {Object.values(SEGMENTS).map((seg) => (
          <button
            key={seg}
            type="button"
            onClick={() => setFilterSource(filterSource === seg ? "all" : seg)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterSource === seg
                ? "bg-[#0A5C8C] text-white border-[#0A5C8C]"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
            aria-pressed={filterSource === seg}
          >
            {SEGMENT_LABELS[seg]} {stats.segments[seg]}
          </button>
        ))}
        {stats.segments.unknown > 0 && (
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
            title="Leads whose source is not in the shared registry — a capture form was added without registering it"
          >
            Unregistered {stats.segments.unknown}
          </span>
        )}
      </div>

      {stats.unrouted > 0 && canReadBuyers && buyers.filter(b => b.is_active).length === 0 && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-[15px] font-medium text-gray-900">
              {stats.unrouted} sellable {stats.unrouted === 1 ? "lead has" : "leads have"} nowhere to go
            </p>
            <p className="mt-1 text-[13.5px] text-gray-600 leading-relaxed">
              These leads consented to contact and were routed to a partner, but
              no active lead buyer is configured to receive them. Add one under
              Lead Buyers and they can be forwarded.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, ZIP, city, state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {Object.values(SEGMENTS).map((seg) => (
              <SelectItem key={seg} value={seg}>{SEGMENT_LABELS[seg]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterState} onValueChange={setFilterState}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {uniqueStates.map(s => (
              <SelectItem key={s} value={s}>{STATE_NAMES[s] || s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500">
        Showing {filteredLeads.length} of {leads.length} leads
      </p>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#0A5C8C]" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No leads found</p>
          <p className="text-sm mt-1">Leads will appear here as users sign up</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="font-semibold text-gray-700">Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Email</TableHead>
                  <TableHead className="font-semibold text-gray-700">Location</TableHead>
                  <TableHead className="font-semibold text-gray-700">Source</TableHead>
                  <TableHead className="font-semibold text-gray-700">Type</TableHead>
                  <TableHead className="font-semibold text-gray-700">Route</TableHead>
                  <TableHead className="font-semibold text-gray-700">Delivery</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700">Date</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <span className="font-medium text-gray-900">
                        {lead.name || <span className="text-gray-400 italic">No name</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate max-w-[200px]">{lead.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm">
                          {lead.city && <span className="text-gray-700">{lead.city}, </span>}
                          {lead.state && <span className="font-medium text-gray-900">{lead.state}</span>}
                          {lead.zip && <span className="text-gray-500 ml-1">({lead.zip})</span>}
                          {!lead.city && !lead.state && !lead.zip && (
                            <span className="text-gray-400 italic">Unknown</span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSourceBadge(lead)}
                    </TableCell>
                    <TableCell>
                      <CustomerTypeCell lead={lead} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <RouteBadge route={lead.monetization_route} />
                        <QualificationBadge qualification={lead.qualification} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <DeliveryCell
                        lead={lead}
                        deliveries={deliveriesByLead.get(lead.id) || []}
                      />
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(lead.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {new Date(lead.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(lead.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewLead(lead)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteConfirm(lead)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* View Lead Dialog */}
      <Dialog open={!!viewLead} onOpenChange={() => setViewLead(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#0A5C8C]" />
              Lead Details
            </DialogTitle>
          </DialogHeader>
          {viewLead && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Name</p>
                  <p className="text-sm font-medium text-gray-900">{viewLead.name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Email</p>
                  <p className="text-sm text-gray-900 break-all">{viewLead.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Phone</p>
                  <p className="text-sm text-gray-900">{viewLead.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">ZIP Code</p>
                  <p className="text-sm text-gray-900">{viewLead.zip || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">City</p>
                  <p className="text-sm text-gray-900">{viewLead.city || 'Not resolved'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">State</p>
                  <p className="text-sm text-gray-900">
                    {viewLead.state ? `${STATE_NAMES[viewLead.state] || viewLead.state} (${viewLead.state})` : 'Not resolved'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Source</p>
                  <p className="text-sm text-gray-900">{describeSource(viewLead).label}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Source Page</p>
                  {getSourceBadge(viewLead)}
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Created</p>
                  <p className="text-sm text-gray-900">{new Date(viewLead.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Comparison session — only renders when the lead came through /compare-rates */}
              <div className="border-t pt-4">
                <LeadComparisonDetail lead={viewLead} />
              </div>

              {/* Buyer routing — the step between a captured lead and revenue */}
              <div className="border-t pt-4">
                <RoutingPanel
                  lead={viewLead}
                  deliveries={deliveriesByLead.get(viewLead.id) || []}
                  buyers={buyers}
                  canChooseBuyer={canReadBuyers}
                  onForward={(buyerId) => forwardLead.mutate({ leadId: viewLead.id, buyerId })}
                  onDeliveryStatus={(deliveryId, status) =>
                    setDeliveryStatus.mutate({ deliveryId, status })}
                  isForwarding={forwardLead.isPending}
                  isUpdating={setDeliveryStatus.isPending}
                  lastResult={forwardLead.data}
                />
              </div>

              {/* Search Preferences */}
              {viewLead.search_preferences && Object.keys(viewLead.search_preferences).length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500 font-medium mb-2">Search Preferences</p>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                    {viewLead.search_preferences.comparisonType && (
                      <p><span className="text-gray-500">Type:</span> <span className="font-medium capitalize">{viewLead.search_preferences.comparisonType}</span></p>
                    )}
                    {viewLead.search_preferences.monthlyUsage && (
                      <p><span className="text-gray-500">Monthly Usage:</span> <span className="font-medium">{viewLead.search_preferences.monthlyUsage} kWh</span></p>
                    )}
                    {viewLead.search_preferences.topPlans && viewLead.search_preferences.topPlans.length > 0 && (
                      <div>
                        <p className="text-gray-500 mb-1">Top Plans Viewed:</p>
                        {viewLead.search_preferences.topPlans.map((plan, i) => (
                          <p key={i} className="ml-2 text-xs">
                            {i + 1}. {plan.provider} — {plan.name} ({plan.rate}¢/kWh)
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Follow-up Info */}
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 font-medium mb-2">Follow-up Status</p>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Follow-ups sent:</span>{' '}
                    <span className="font-medium">{viewLead.follow_up_count || 0}</span>
                  </div>
                  {viewLead.follow_up_sent_at && (
                    <div>
                      <span className="text-gray-500">Last follow-up:</span>{' '}
                      <span className="font-medium">{new Date(viewLead.follow_up_sent_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Update */}
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 font-medium mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <Button
                      key={opt.value}
                      variant={viewLead.status === opt.value ? "default" : "outline"}
                      size="sm"
                      className={viewLead.status === opt.value ? "bg-[#0A5C8C]" : ""}
                      onClick={() => {
                        updateStatus.mutate({ id: viewLead.id, status: opt.value });
                        setViewLead({ ...viewLead, status: opt.value });
                      }}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the lead for <strong>{deleteConfirm?.email}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteLead.mutate(deleteConfirm.id)}
              disabled={deleteLead.isPending}
            >
              {deleteLead.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Stat Card Component ──────────────────────────────────
function StatCard({ label, value, color, border }) {
  return (
    <div className={`bg-white rounded-lg border ${border} border-l-4 p-4`}>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ─── Routing ──────────────────────────────────────────────

/** Routes whose destination is a lead buyer, mirroring the server's rule. */
const SELLABLE_ROUTES = ["residential_partner", "commercial_partner", "renewable_partner"];

const DELIVERY_STATE_STYLES = {
  sold: "bg-emerald-100 text-emerald-700",
  delivered: "bg-amber-100 text-amber-700",
  pending: "bg-blue-100 text-blue-700",
  rejected: "bg-gray-100 text-gray-600",
  failed: "bg-red-100 text-red-700",
  unrouted: "bg-gray-100 text-gray-500",
};

/**
 * One lead's delivery state, at a glance.
 *
 * A lead that cannot be sold is shown as such rather than as "not routed" —
 * an affiliate lead earns through its click and a lead without consent may
 * never be sold, and neither is a backlog item an operator should chase.
 */
function DeliveryCell({ lead, deliveries }) {
  const state = leadMonetizationState(lead, deliveries);

  if (state.state === "unrouted") {
    if (lead.consent_contact !== true) {
      return <span className="text-xs text-gray-400 italic">No consent</span>;
    }
    if (!SELLABLE_ROUTES.includes(lead.monetization_route)) {
      return <span className="text-xs text-gray-400 italic">Not sellable</span>;
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
      <Badge variant="outline" className={`${DELIVERY_STATE_STYLES[state.state]} border-0 text-xs w-fit`}>
        {state.label}
      </Badge>
      {state.value > 0 && (
        <span className="text-xs font-medium text-emerald-700 tabular-nums">
          ${state.value.toFixed(2)}
        </span>
      )}
    </div>
  );
}

/**
 * Forward a lead, and record what the buyer said.
 *
 * Deliberately explicit about why a lead cannot be forwarded. "Nothing
 * happened" is the least useful thing an admin screen can say, and the three
 * reasons — no consent, not a sellable route, no buyer matches — each have a
 * different fix.
 */
function RoutingPanel({
  lead, deliveries, buyers, canChooseBuyer, onForward, onDeliveryStatus,
  isForwarding, isUpdating, lastResult,
}) {
  const [targetBuyer, setTargetBuyer] = useState("auto");

  const activeBuyers = buyers.filter((b) => b.is_active);
  const hasConsent = lead.consent_contact === true;
  const isSellable = SELLABLE_ROUTES.includes(lead.monetization_route);
  // An editor cannot see the buyer list, so "no buyers" is unknowable to them
  // and must not block forwarding — the server resolves the buyer either way.
  const knowsBuyers = canChooseBuyer;
  const canForward = hasConsent && isSellable && (!knowsBuyers || activeBuyers.length > 0);

  // Only show the rejection breakdown for the lead it was produced for. The
  // mutation result outlives the dialog it came from, so without the id check
  // one lead's reasons would be shown against another's.
  const rejections =
    lastResult && !lastResult.delivered && lastResult.leadId === lead.id
      ? lastResult.coverage?.rejected || []
      : [];

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
          <Handshake className="w-3.5 h-3.5" aria-hidden="true" />
          Buyer routing
        </p>
        {lead.assigned_partner && (
          <span className="text-xs text-gray-600">
            Assigned to <strong className="text-gray-900">{lead.assigned_partner}</strong>
          </span>
        )}
      </div>

      {!hasConsent && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 mb-3">
          <p className="text-sm text-gray-700">
            This lead did not consent to being contacted, so it cannot be sold to a buyer.
          </p>
        </div>
      )}

      {hasConsent && !isSellable && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 mb-3">
          <p className="text-sm text-gray-700">
            Routed to <strong>{lead.monetization_route || "no route"}</strong>, which is not sold to
            buyers. Affiliate leads earn through their outbound click; concierge leads are handled in-house.
          </p>
        </div>
      )}

      {hasConsent && isSellable && knowsBuyers && activeBuyers.length === 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-3">
          <p className="text-sm text-gray-700">
            No active lead buyers are configured, so there is nowhere to send this lead.
          </p>
        </div>
      )}

      {canForward && (
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          {knowsBuyers && (
            <Select value={targetBuyer} onValueChange={setTargetBuyer}>
              <SelectTrigger className="sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Best matching buyer</SelectItem>
                {activeBuyers.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                    {b.price_per_lead != null ? ` — $${Number(b.price_per_lead).toFixed(2)}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            size="sm"
            onClick={() => onForward(targetBuyer === "auto" ? null : targetBuyer)}
            disabled={isForwarding}
            className="bg-[#0A5C8C] hover:bg-[#084a6f]"
          >
            {isForwarding
              ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" aria-hidden="true" />
              : <Send className="w-4 h-4 mr-1.5" aria-hidden="true" />}
            Forward lead
          </Button>
        </div>
      )}

      {rejections.length > 0 && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 mb-3">
          <p className="text-xs font-medium text-gray-700 mb-1.5">Why each buyer declined</p>
          <ul className="space-y-1">
            {rejections.map((r) => (
              <li key={r.buyerId || r.name} className="text-xs text-gray-600">
                <span className="font-medium text-gray-800">{r.name}</span>
                {" — "}
                {REJECTION_LABELS[r.reason] || r.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {deliveries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Deliveries</p>
          {deliveries.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{d.buyer_name || "Unknown buyer"}</p>
                <p className="text-xs text-gray-500">
                  {d.status}
                  {d.price_at_delivery != null && ` · $${Number(d.price_at_delivery).toFixed(2)}`}
                  {d.delivered_at && ` · sent ${new Date(d.delivered_at).toLocaleDateString()}`}
                  {d.responded_at && ` · answered ${new Date(d.responded_at).toLocaleDateString()}`}
                </p>
                {d.error && <p className="text-xs text-red-600 mt-0.5">{d.error}</p>}
              </div>

              {/* A buyer can only rule on a lead they actually received. */}
              {(d.status === "delivered" || d.status === "pending") && (
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button
                    size="sm" variant="outline" disabled={isUpdating}
                    onClick={() => onDeliveryStatus(d.id, "accepted")}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                    Accepted
                  </Button>
                  <Button
                    size="sm" variant="ghost" disabled={isUpdating}
                    className="text-gray-500 hover:text-red-600"
                    onClick={() => onDeliveryStatus(d.id, "rejected")}
                  >
                    Rejected
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
