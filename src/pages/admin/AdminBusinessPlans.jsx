import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ElectricityPlan, ElectricityProvider } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Plus, Pencil, Trash2, Search, Loader2, Building, DollarSign, Leaf,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const emptyPlan = {
  provider_name: "",
  plan_name: "",
  plan_type: "fixed",
  customer_type: "business",
  rate_per_kwh: "",
  base_charge: "",
  contract_length: "",
  early_termination_fee: "",
  renewable_percentage: 0,
  is_active: true,
  tdsp_charges: "",
  usage_credit: "",
  usage_credit_threshold: "",
  plan_details_url: "",
  facts_label_url: "",
  promo_code: "",
  special_offer: "",
  state: "TX",
};

export default function AdminBusinessPlans() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState(emptyPlan);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: allPlans = [], isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => ElectricityPlan.list(),
  });

  // Filter to only show business plans
  const plans = allPlans.filter(p => {
    const ct = (p.customer_type || '').toLowerCase();
    const name = (p.plan_name || '').toLowerCase();
    return ct === 'business' || name.includes('business') || name.includes('commercial');
  });

  const { data: providers = [] } = useQuery({
    queryKey: ["admin-providers"],
    queryFn: () => ElectricityProvider.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => ElectricityPlan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-plans"]);
      toast({ title: "Business plan created successfully" });
      closeDialog();
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ElectricityPlan.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-plans"]);
      toast({ title: "Business plan updated successfully" });
      closeDialog();
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => ElectricityPlan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-plans"]);
      toast({ title: "Business plan deleted" });
      setDeleteConfirm(null);
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setEditingPlan(null);
    setForm(emptyPlan);
    setDialogOpen(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setForm({ ...plan });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPlan(null);
    setForm(emptyPlan);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      customer_type: "business",
      rate_per_kwh: parseFloat(form.rate_per_kwh) || 0,
      base_charge: parseFloat(form.base_charge) || 0,
      contract_length: parseInt(form.contract_length) || 0,
      early_termination_fee: parseFloat(form.early_termination_fee) || 0,
      renewable_percentage: parseInt(form.renewable_percentage) || 0,
      tdsp_charges: parseFloat(form.tdsp_charges) || 0,
      usage_credit: parseFloat(form.usage_credit) || 0,
      usage_credit_threshold: parseInt(form.usage_credit_threshold) || 0,
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = plans.filter((p) => {
    const matchesSearch =
      p.plan_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.provider_name?.toLowerCase().includes(search.toLowerCase());
    const matchesProvider =
      filterProvider === "all" || p.provider_name === filterProvider;
    const matchesType = filterType === "all" || p.plan_type === filterType;
    return matchesSearch && matchesProvider && matchesType;
  });

  const uniqueProviderNames = [...new Set(plans.map((p) => p.provider_name).filter(Boolean))].sort();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <Building className="w-5 h-5 text-blue-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Business Plans</h1>
          <p className="text-sm text-gray-500">Manage commercial and business electricity plans</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search business plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {uniqueProviderNames.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="fixed">Fixed</SelectItem>
            <SelectItem value="variable">Variable</SelectItem>
            <SelectItem value="indexed">Indexed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openCreate} className="bg-[#0A5C8C] hover:bg-[#084a6f]">
          <Plus className="w-4 h-4 mr-2" />
          Add Business Plan
        </Button>
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
              <Building className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No business plans found</p>
              <p className="text-sm mt-1">Add your first business plan to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contract</TableHead>
                    <TableHead>Renewable</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 max-w-[200px] truncate">
                            {plan.plan_name}
                          </p>
                          <Badge variant="outline" className="text-xs mt-1 bg-blue-50 text-blue-700 border-blue-200">
                            Business
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {plan.provider_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className="font-semibold text-green-700">
                            {plan.rate_per_kwh ? `${plan.rate_per_kwh}¢` : "N/A"}
                          </span>
                          <span className="text-xs text-gray-400">/kWh</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {plan.plan_type || "fixed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {plan.contract_length ? `${plan.contract_length} mo` : "MTM"}
                      </TableCell>
                      <TableCell>
                        {plan.renewable_percentage > 0 ? (
                          <div className="flex items-center gap-1">
                            <Leaf className="w-3 h-3 text-green-500" />
                            <span className="text-sm">{plan.renewable_percentage}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteConfirm(plan)}
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

      <p className="text-sm text-gray-400 text-right">
        Showing {filtered.length} of {plans.length} business plans
      </p>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Business Plan" : "Add New Business Plan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Name *</Label>
                <Input
                  value={form.plan_name}
                  onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
                  required
                  placeholder="e.g., Business Value 24"
                />
              </div>
              <div className="space-y-2">
                <Label>Provider Name *</Label>
                <Input
                  value={form.provider_name}
                  onChange={(e) => setForm({ ...form, provider_name: e.target.value })}
                  required
                  placeholder="e.g., TXU Energy"
                  list="provider-names-biz"
                />
                <datalist id="provider-names-biz">
                  {providers.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Rate (¢/kWh) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.rate_per_kwh}
                  onChange={(e) => setForm({ ...form, rate_per_kwh: e.target.value })}
                  required
                  placeholder="8.5"
                />
              </div>
              <div className="space-y-2">
                <Label>Base Charge ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.base_charge || ""}
                  onChange={(e) => setForm({ ...form, base_charge: e.target.value })}
                  placeholder="14.95"
                />
              </div>
              <div className="space-y-2">
                <Label>TDSP Charges (¢/kWh)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.tdsp_charges || ""}
                  onChange={(e) => setForm({ ...form, tdsp_charges: e.target.value })}
                  placeholder="4.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Plan Type</Label>
                <Select
                  value={form.plan_type || "fixed"}
                  onValueChange={(v) => setForm({ ...form, plan_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="variable">Variable</SelectItem>
                    <SelectItem value="indexed">Indexed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contract (months)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.contract_length || ""}
                  onChange={(e) => setForm({ ...form, contract_length: e.target.value })}
                  placeholder="24"
                />
              </div>
              <div className="space-y-2">
                <Label>ETF ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.early_termination_fee || ""}
                  onChange={(e) => setForm({ ...form, early_termination_fee: e.target.value })}
                  placeholder="250"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Renewable %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.renewable_percentage || ""}
                  onChange={(e) => setForm({ ...form, renewable_percentage: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={form.state || ""}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="TX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Special Offer</Label>
              <Input
                value={form.special_offer || ""}
                onChange={(e) => setForm({ ...form, special_offer: e.target.value })}
                placeholder="e.g., Free demand response monitoring"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Details URL</Label>
                <Input
                  value={form.plan_details_url || ""}
                  onChange={(e) => setForm({ ...form, plan_details_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Facts Label URL</Label>
                <Input
                  value={form.facts_label_url || ""}
                  onChange={(e) => setForm({ ...form, facts_label_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label>Active (visible on website)</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#0A5C8C] hover:bg-[#084a6f]"
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingPlan ? "Save Changes" : "Create Business Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Business Plan</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{deleteConfirm?.plan_name}</strong>?
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
