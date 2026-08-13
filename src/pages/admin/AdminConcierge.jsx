import { useState } from "react";
import { ConciergeRequest } from "@/api/supabaseEntities";
import { adminPost } from "@/lib/adminApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Home, Search, Filter, Eye, Trash2, Mail,
  Phone, Calendar, Clock, CheckCircle,
  AlertCircle, Loader2, X,
  Zap, Wifi, Tv, Droplet
} from "lucide-react";

const STATUS_CONFIG = {
  new: { label: "New", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
  contacted: { label: "Contacted", color: "bg-yellow-100 text-yellow-800", icon: Phone },
  in_progress: { label: "In Progress", color: "bg-purple-100 text-purple-800", icon: Clock },
  completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-600", icon: X },
};

const SERVICE_ICONS = {
  electricity: Zap,
  internet: Wifi,
  water_gas: Droplet,
  phone_tv: Tv,
};

const SERVICE_LABELS = {
  electricity: "Electricity",
  internet: "Internet",
  water_gas: "Water & Gas",
  phone_tv: "Phone & TV",
};

export default function AdminConcierge() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editRevenue, setEditRevenue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["concierge_requests"],
    queryFn: () => ConciergeRequest.list(),
  });

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      !searchTerm ||
      req.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.zip_code?.includes(searchTerm) ||
      req.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: requests.length,
    new: requests.filter((r) => r.status === "new").length,
    in_progress: requests.filter((r) => r.status === "in_progress" || r.status === "contacted").length,
    completed: requests.filter((r) => r.status === "completed").length,
    totalRevenue: requests.reduce((sum, r) => sum + (parseFloat(r.actual_revenue) || 0), 0),
  };

  const openDetail = (req) => {
    setSelectedRequest(req);
    setEditNotes(req.admin_notes || "");
    setEditStatus(req.status);
    setEditRevenue(req.actual_revenue?.toString() || "0");
    setShowDetailDialog(true);
  };

  /**
   * Save through the server, not straight to the table.
   *
   * Concierge revenue is platform revenue, so it has to reach the same ledger
   * everything else does — otherwise "total platform earnings" quietly excludes
   * a whole product line. The endpoint writes the request row and the ledger
   * entry together, keyed on the request, so correcting a figure edits the
   * existing line rather than booking the money a second time.
   */
  const handleUpdate = async () => {
    if (!selectedRequest) return;

    const amount = parseFloat(editRevenue);
    if (editRevenue !== "" && (!Number.isFinite(amount) || amount < 0)) {
      toast({
        title: "Check the revenue figure",
        description: "Enter an amount of zero or more.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await adminPost("concierge-revenue", {
        requestId: selectedRequest.id,
        amount: Number.isFinite(amount) ? amount : 0,
        status: editStatus,
        adminNotes: editNotes,
      });
      queryClient.invalidateQueries({ queryKey: ["concierge_requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-revenue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-earnings"] });
      toast({ title: "Updated", description: "Concierge request updated successfully." });
      setShowDetailDialog(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to update request.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this request?")) return;
    try {
      await ConciergeRequest.delete(id);
      queryClient.invalidateQueries({ queryKey: ["concierge_requests"] });
      toast({ title: "Deleted", description: "Request deleted." });
      setShowDetailDialog(false);
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Concierge</h1>
          <p className="text-gray-500 text-sm mt-1">Manage utility setup requests and track revenue</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-2">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Total Requests</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.new}</p>
            <p className="text-xs text-blue-600 mt-1">New</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{stats.in_progress}</p>
            <p className="text-xs text-purple-600 mt-1">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
            <p className="text-xs text-green-600 mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-700">${stats.totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-orange-600 mt-1">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, ZIP, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-500 mt-2">Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card className="border-2">
          <CardContent className="p-12 text-center">
            <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Requests Found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your filters."
                : "Concierge requests will appear here when customers submit the form."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Location</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Services</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Move-in</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Revenue</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => {
                const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.new;
                const services = Array.isArray(req.services_requested) ? req.services_requested : [];
                const hasPartner = req.wants_home_security || req.wants_home_insurance || req.wants_moving_service || req.wants_home_warranty;
                return (
                  <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(req)}>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900">{req.full_name}</p>
                      <p className="text-xs text-gray-500">{req.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-900">{req.city || ""}{req.city && req.state ? ", " : ""}{req.state || ""}</p>
                      <p className="text-xs text-gray-500">{req.zip_code}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {services.map((s) => {
                          const Icon = SERVICE_ICONS[s] || Zap;
                          return <Icon key={s} className="w-4 h-4 text-gray-500" title={SERVICE_LABELS[s] || s} />;
                        })}
                        {hasPartner && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">+PARTNER</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {req.move_in_date ? new Date(req.move_in_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${parseFloat(req.actual_revenue) > 0 ? "text-green-700" : "text-gray-400"}`}>
                        ${parseFloat(req.actual_revenue || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openDetail(req); }}>
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail / Edit Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="w-5 h-5 text-[#0A5C8C]" />
              Concierge Request Details
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Customer</label>
                  <p className="font-semibold text-gray-900">{selectedRequest.full_name}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900">{selectedRequest.email}</p>
                    <a href={`mailto:${selectedRequest.email}`} className="text-[#0A5C8C] hover:underline">
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                {selectedRequest.phone && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                    <p className="text-gray-900">{selectedRequest.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Property Type</label>
                  <p className="text-gray-900 capitalize">{selectedRequest.property_type}</p>
                </div>
              </div>

              {/* Address */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Move-in Address</label>
                <p className="font-semibold text-gray-900">{selectedRequest.new_address}</p>
                <p className="text-sm text-gray-600">
                  {selectedRequest.city}{selectedRequest.city && selectedRequest.state ? ", " : ""}{selectedRequest.state} {selectedRequest.zip_code}
                </p>
                {selectedRequest.move_in_date && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Move-in: {new Date(selectedRequest.move_in_date).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Services */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Requested Services</label>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(selectedRequest.services_requested) ? selectedRequest.services_requested : []).map((s) => (
                    <span key={s} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-100 text-blue-800">
                      {SERVICE_LABELS[s] || s}
                    </span>
                  ))}
                </div>
                {selectedRequest.electricity_preference && selectedRequest.electricity_preference !== "no_preference" && (
                  <p className="text-sm text-gray-600 mt-2">Electricity preference: <strong className="capitalize">{selectedRequest.electricity_preference.replace(/_/g, " ")}</strong></p>
                )}
                {selectedRequest.monthly_budget && (
                  <p className="text-sm text-gray-600 mt-1">Budget: <strong>{selectedRequest.monthly_budget.replace(/_/g, " ").replace("under", "Under $").replace("over", "Over $").replace("100 200", "$100-$200").replace("200 300", "$200-$300")}</strong></p>
                )}
              </div>

              {/* Partner Services */}
              {(selectedRequest.wants_home_security || selectedRequest.wants_home_insurance || selectedRequest.wants_moving_service || selectedRequest.wants_home_warranty) && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Partner Services (Revenue Opportunities)</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.wants_home_security && <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-purple-100 text-purple-800">Home Security</span>}
                    {selectedRequest.wants_home_insurance && <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-purple-100 text-purple-800">Home Insurance</span>}
                    {selectedRequest.wants_moving_service && <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-purple-100 text-purple-800">Moving Help</span>}
                    {selectedRequest.wants_home_warranty && <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-purple-100 text-purple-800">Home Warranty</span>}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              {selectedRequest.special_instructions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <label className="text-xs font-semibold text-yellow-700 uppercase mb-1 block">Special Instructions</label>
                  <p className="text-sm text-gray-800">{selectedRequest.special_instructions}</p>
                </div>
              )}

              {/* Admin Controls */}
              <div className="border-t pt-4 space-y-4">
                <h3 className="font-bold text-gray-900">Admin Controls</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Actual Revenue ($)</label>
                    <Input type="number" step="0.01" value={editRevenue} onChange={(e) => setEditRevenue(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Admin Notes</label>
                  <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} placeholder="Internal notes about this request..." />
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-400 flex items-center justify-between">
                <span>Created: {new Date(selectedRequest.created_at).toLocaleString()}</span>
                <span>Source: {selectedRequest.source || "website"}</span>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedRequest?.id)}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={isUpdating} className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white">
                {isUpdating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
