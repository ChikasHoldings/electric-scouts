import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CustomBusinessQuote } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  MessageSquare,
  Eye,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building2,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const STATUS_OPTIONS = [
  { value: "new", label: "New", icon: AlertCircle, color: "bg-blue-100 text-blue-700" },
  { value: "pending", label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  { value: "in_progress", label: "In Progress", icon: Clock, color: "bg-orange-100 text-orange-700" },
  { value: "completed", label: "Completed", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  { value: "rejected", label: "Rejected", icon: XCircle, color: "bg-red-100 text-red-700" },
];

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

export default function AdminQuotes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewQuote, setViewQuote] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["admin-quotes"],
    queryFn: () => CustomBusinessQuote.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => CustomBusinessQuote.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
      toast({ title: "Quote updated" });
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => CustomBusinessQuote.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
      toast({ title: "Quote deleted" });
      setDeleteConfirm(null);
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleStatusChange = (quoteId, newStatus) => {
    updateMutation.mutate({ id: quoteId, data: { status: newStatus } });
  };

  const filtered = quotes.filter((q) => {
    const matchesSearch =
      q.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      q.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      q.email?.toLowerCase().includes(search.toLowerCase()) ||
      q.zip_code?.includes(search);
    const matchesStatus = filterStatus === "all" || q.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: quotes.length,
    new: quotes.filter((q) => q.status === "new").length,
    pending: quotes.filter((q) => q.status === "pending").length,
    in_progress: quotes.filter((q) => q.status === "in_progress").length,
    completed: quotes.filter((q) => q.status === "completed").length,
    rejected: quotes.filter((q) => q.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Status summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: "all", label: "All", color: "bg-gray-50" },
          { key: "new", label: "New", color: "bg-blue-50" },
          { key: "pending", label: "Pending", color: "bg-yellow-50" },
          { key: "in_progress", label: "In Progress", color: "bg-orange-50" },
          { key: "completed", label: "Completed", color: "bg-green-50" },
          { key: "rejected", label: "Rejected", color: "bg-red-50" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilterStatus(item.key)}
            className={`p-3 rounded-lg text-center transition-all ${item.color} ${
              filterStatus === item.key
                ? "ring-2 ring-[#0A5C8C] shadow-sm"
                : "hover:shadow-sm"
            }`}
          >
            <p className="text-2xl font-bold text-gray-900">{statusCounts[item.key]}</p>
            <p className="text-xs text-gray-500">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search quotes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>{search ? "No quotes match your search" : "No business quotes yet"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>ZIP</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-900 truncate max-w-[150px]">
                            {quote.business_name || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-gray-900">{quote.contact_name || "—"}</p>
                          <p className="text-xs text-gray-400">{quote.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {quote.zip_code || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Zap className="w-3 h-3 text-orange-400" />
                          {quote.monthly_usage ? `${quote.monthly_usage} kWh` : "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={quote.status || "new"}
                          onValueChange={(v) => handleStatusChange(quote.id, v)}
                        >
                          <SelectTrigger className="w-36 h-8 border-0 bg-transparent p-0">
                            <SelectValue>
                              {getStatusBadge(quote.status || "new")}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {quote.created_date
                            ? new Date(quote.created_date).toLocaleDateString()
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewQuote(quote)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteConfirm(quote)}
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
          )}
        </CardContent>
      </Card>

      {/* View Quote Detail Dialog */}
      <Dialog open={!!viewQuote} onOpenChange={() => setViewQuote(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Quote Details</DialogTitle>
          </DialogHeader>
          {viewQuote && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Business Name</Label>
                  <p className="font-medium">{viewQuote.business_name || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Contact Name</Label>
                  <p className="font-medium">{viewQuote.contact_name || "—"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <a
                    href={`mailto:${viewQuote.email}`}
                    className="flex items-center gap-1 text-[#0A5C8C] hover:underline text-sm"
                  >
                    <Mail className="w-3 h-3" />
                    {viewQuote.email}
                  </a>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <p className="flex items-center gap-1 text-sm">
                    <Phone className="w-3 h-3 text-gray-400" />
                    {viewQuote.phone || "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">ZIP Code</Label>
                  <p className="font-medium">{viewQuote.zip_code || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Monthly Usage</Label>
                  <p className="font-medium">
                    {viewQuote.monthly_usage ? `${viewQuote.monthly_usage} kWh` : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Business Type</Label>
                  <p className="font-medium">{viewQuote.business_type || "—"}</p>
                </div>
              </div>

              {viewQuote.message && (
                <div>
                  <Label className="text-xs text-gray-500">Message</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1">
                    {viewQuote.message}
                  </p>
                </div>
              )}

              {viewQuote.admin_notes && (
                <div>
                  <Label className="text-xs text-gray-500">Admin Notes</Label>
                  <p className="text-sm bg-yellow-50 p-3 rounded-lg mt-1">
                    {viewQuote.admin_notes}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(viewQuote.status || "new")}</div>
                </div>
                <div className="text-right">
                  <Label className="text-xs text-gray-500">Submitted</Label>
                  <p className="text-sm">
                    {viewQuote.created_date
                      ? new Date(viewQuote.created_date).toLocaleString()
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewQuote(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quote</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the quote from{" "}
            <strong>{deleteConfirm?.business_name || deleteConfirm?.contact_name}</strong>?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteConfirm.id)}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
