import React, { useState } from "react";
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
  Plus, Pencil, Trash2, Search, Loader2, Leaf,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const emptyPlan = {
  provider_name: "", plan_name: "", plan_type: "fixed", customer_type: "renewable",
  rate_per_kwh: "", contract_length: "", early_termination_fee: "",
  renewable_percentage: 100, is_active: true, base_charge: "",
  state: "TX", features: [], special_offer: "",
  tdsp_charges: "", plan_details_url: "", promo_code: "",
};

export default function AdminRenewablePlans() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState(emptyPlan);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: allPlans = [], isLoading } = useQuery({
    queryKey: ["admin-renewable-plans"],
    queryFn: async () => {
      const plans = await ElectricityPlan.list();
      return plans.filter(p => p.customer_type === "renewable" || (p.renewable_percentage || 0) >= 90);
    },
  });

  const { data: providers = [] } = useQuery({
    queryKey: ["admin-providers"],
    queryFn: () => ElectricityProvider.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => ElectricityPlan.create(data),
    onSuccess: () => { queryClient.invalidateQueries(["admin-renewable-plans"]); toast({ title: "Renewable plan created" }); closeDialog(); },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ElectricityPlan.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(["admin-renewable-plans"]); toast({ title: "Renewable plan updated" }); closeDialog(); },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => ElectricityPlan.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(["admin-renewable-plans"]); toast({ title: "Plan deleted" }); setDeleteConfirm(null); },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => ElectricityPlan.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries(["admin-renewable-plans"]),
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const closeDialog = () => { setDialogOpen(false); setEditingPlan(null); setForm(emptyPlan); };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setForm({ ...emptyPlan, ...plan, features: plan.features || [] });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...form,
      rate_per_kwh: parseFloat(form.rate_per_kwh) || 0,
      contract_length: parseInt(form.contract_length) || 0,
      early_termination_fee: parseFloat(form.early_termination_fee) || 0,
      base_charge: parseFloat(form.base_charge) || 0,
      renewable_percentage: parseInt(form.renewable_percentage) || 100,
      tdsp_charges: parseFloat(form.tdsp_charges) || 0,
      customer_type: "renewable",
    };
    delete data.id; delete data.created_at; delete data.updated_at;
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = allPlans.filter(p => {
    if (search && !p.plan_name?.toLowerCase().includes(search.toLowerCase()) && !p.provider_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterProvider !== "all" && p.provider_name !== filterProvider) return false;
    if (filterType !== "all" && p.plan_type !== filterType) return false;
    if (filterState !== "all" && p.state !== filterState) return false;
    return true;
  });

  const uniqueProviders = [...new Set(allPlans.map(p => p.provider_name))].sort();
  const uniqueStates = [...new Set(allPlans.map(p => p.state).filter(Boolean))].sort();
  const activeCount = allPlans.filter(p => p.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-600" /> Renewable Energy Plans
          </h2>
          <p className="text-sm text-gray-500 mt-1">{allPlans.length} plans ({activeCount} active)</p>
        </div>
        <Button size="sm" onClick={() => { setEditingPlan(null); setForm(emptyPlan); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Renewable Plan
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg border">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search renewable plans..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Provider" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {uniqueProviders.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="fixed">Fixed</SelectItem>
            <SelectItem value="variable">Variable</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterState} onValueChange={setFilterState}>
          <SelectTrigger className="w-[100px]"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {uniqueStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Leaf className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No renewable plans found. Seed data from the Providers page.</p>
        </CardContent></Card>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Plan Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="text-center">Rate</TableHead>
                <TableHead className="text-center">Term</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">State</TableHead>
                <TableHead className="text-center">Renewable %</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(plan => (
                <TableRow key={plan.id} className={!plan.is_active ? "opacity-50 bg-gray-50" : ""}>
                  <TableCell>
                    <div>
                      <span className="font-medium text-gray-900">{plan.plan_name}</span>
                      {plan.special_offer && <Badge className="ml-2 text-[10px] bg-orange-100 text-orange-700">{plan.special_offer}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{plan.provider_name}</TableCell>
                  <TableCell className="text-center"><span className="font-semibold text-green-700">{plan.rate_per_kwh}¢</span></TableCell>
                  <TableCell className="text-center text-sm">{plan.contract_length || '—'} mo</TableCell>
                  <TableCell className="text-center"><Badge variant="outline" className="text-[10px] capitalize">{plan.plan_type}</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant="secondary" className="text-[10px]">{plan.state || 'TX'}</Badge></TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Leaf className="w-3 h-3 text-green-500" />
                      <span className="text-xs font-medium text-green-700">{plan.renewable_percentage || 100}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={plan.is_active} onCheckedChange={checked => toggleMutation.mutate({ id: plan.id, is_active: checked })} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteConfirm(plan)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-2 text-xs text-gray-400 text-right border-t">
            Showing {filtered.length} of {allPlans.length} renewable plans
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPlan ? "Edit Renewable Plan" : "Add Renewable Plan"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Provider *</Label>
              <Select value={form.provider_name} onValueChange={v => setForm({ ...form, provider_name: v })}>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>{providers.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Plan Name *</Label><Input value={form.plan_name} onChange={e => setForm({ ...form, plan_name: e.target.value })} /></div>
            <div><Label>Rate (¢/kWh) *</Label><Input type="number" step="0.1" value={form.rate_per_kwh} onChange={e => setForm({ ...form, rate_per_kwh: e.target.value })} /></div>
            <div><Label>Contract (months)</Label><Input type="number" value={form.contract_length} onChange={e => setForm({ ...form, contract_length: e.target.value })} /></div>
            <div><Label>Plan Type</Label>
              <Select value={form.plan_type} onValueChange={v => setForm({ ...form, plan_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="fixed">Fixed</SelectItem><SelectItem value="variable">Variable</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>State</Label><Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value.toUpperCase() })} maxLength={2} /></div>
            <div><Label>Renewable %</Label><Input type="number" min="0" max="100" value={form.renewable_percentage} onChange={e => setForm({ ...form, renewable_percentage: e.target.value })} /></div>
            <div><Label>Base Charge ($/mo)</Label><Input type="number" step="0.01" value={form.base_charge} onChange={e => setForm({ ...form, base_charge: e.target.value })} /></div>
            <div><Label>ETF ($)</Label><Input type="number" value={form.early_termination_fee} onChange={e => setForm({ ...form, early_termination_fee: e.target.value })} /></div>
            <div><Label>Special Offer</Label><Input value={form.special_offer || ""} onChange={e => setForm({ ...form, special_offer: e.target.value })} /></div>
            <div className="col-span-2 flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /><Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.provider_name || !form.plan_name || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingPlan ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Renewable Plan</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">Delete <strong>{deleteConfirm?.plan_name}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
