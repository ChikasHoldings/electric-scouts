import { useMemo, useState } from "react";
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
import { Plus, Pencil, Trash2, Search, Loader2, Zap, Leaf, Building } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { validatePlan, CUSTOMER_TYPES } from "@/lib/planValidation";

/**
 * Plans — every audience, one screen.
 *
 * This replaced three pages (residential, business, renewable) that were the
 * same 300 lines with one filter changed. Beyond the duplication, they had a
 * subtler problem: which page you happened to open decided what a plan was
 * classified as. The renewable screen listed anything at 90%+ renewable —
 * including plans classified `residential` — and its form wrote back
 * `customer_type: 'renewable'`, so opening a residential plan there and saving
 * silently reclassified it.
 *
 * Here, customer type is an explicit field the admin chooses, and "renewable"
 * is a filter over `renewable_percentage` rather than a fourth page with its
 * own opinion about what it is looking at.
 */

const emptyPlan = {
  provider_name: "", plan_name: "", plan_type: "fixed", customer_type: "residential",
  rate_per_kwh: "", contract_length: "", early_termination_fee: "",
  renewable_percentage: 0, is_active: true, monthly_base_charge: "",
  state: "TX", features: [], special_offer: "", base_charge: "",
  tdsp_charges: "", usage_credit: "", usage_credit_threshold: "",
  plan_details_url: "", facts_label_url: "", promo_code: "",
};

const CUSTOMER_TYPE_LABELS = {
  residential: "Residential",
  business: "Business",
  renewable: "Renewable",
};

/** The audience each customer type is actually shown to on the public site. */
const AUDIENCE_NOTE = {
  residential: "Shown to residential shoppers.",
  renewable: "Shown to residential shoppers alongside standard plans.",
  business: "Shown to commercial shoppers only.",
};

export default function AdminPlans() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [filterAudience, setFilterAudience] = useState("all");
  const [filterGreen, setFilterGreen] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState(emptyPlan);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: allPlans = [], isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => ElectricityPlan.list(),
  });

  const { data: providers = [] } = useQuery({
    queryKey: ["admin-providers"],
    queryFn: () => ElectricityProvider.list(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-plans"] });

  const createMutation = useMutation({
    mutationFn: (data) => ElectricityPlan.create(data),
    onSuccess: () => { invalidate(); toast({ title: "Plan created" }); closeDialog(); },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ElectricityPlan.update(id, data),
    onSuccess: () => { invalidate(); toast({ title: "Plan updated" }); closeDialog(); },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => ElectricityPlan.delete(id),
    onSuccess: () => { invalidate(); toast({ title: "Plan deleted" }); setDeleteConfirm(null); },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => ElectricityPlan.update(id, { is_active }),
    onSuccess: invalidate,
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPlan(null);
    setForm(emptyPlan);
    setFormErrors({});
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setForm({
      ...emptyPlan,
      ...plan,
      // An unclassified legacy row is residential inventory, which is how the
      // public engine already treats it. Showing it as blank in the form would
      // invite an admin to guess.
      customer_type: plan.customer_type || "residential",
      features: plan.features || [],
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingPlan(null);
    // Opening "add" while filtered to business should give a business plan —
    // the filter is the admin's stated context.
    setForm({
      ...emptyPlan,
      customer_type: filterAudience === "all" ? "residential" : filterAudience,
      renewable_percentage: filterGreen === "green" ? 100 : 0,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    // One shared validation layer. It resolves the canonical provider_id from
    // the selected provider — the form selects by name, and writing name alone
    // is what left hundreds of rows needing the migration-014 backfill — and it
    // refuses to coerce blank or invalid pricing into a number a customer would
    // be charged against.
    //
    // The customer type comes from the form, not from which page this is.
    const { valid, values, errors } = validatePlan(form, providers);

    if (!valid) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    const data = { ...form, ...values };
    delete data.id; delete data.created_at; delete data.updated_at;

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = useMemo(() => allPlans.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.plan_name?.toLowerCase().includes(q) && !p.provider_name?.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filterProvider !== "all" && p.provider_name !== filterProvider) return false;
    if (filterType !== "all" && p.plan_type !== filterType) return false;
    if (filterState !== "all" && p.state !== filterState) return false;
    if (filterAudience !== "all") {
      // A null customer_type is unclassified residential inventory, matching
      // how the public eligibility rule reads it.
      const type = p.customer_type || "residential";
      if (type !== filterAudience) return false;
    }
    if (filterGreen === "green" && (p.renewable_percentage || 0) < 50) return false;
    if (filterGreen === "standard" && (p.renewable_percentage || 0) >= 50) return false;
    return true;
  }), [allPlans, search, filterProvider, filterType, filterState, filterAudience, filterGreen]);

  const uniqueProviders = useMemo(
    () => [...new Set(allPlans.map((p) => p.provider_name).filter(Boolean))].sort(),
    [allPlans]
  );
  const uniqueStates = useMemo(
    () => [...new Set(allPlans.map((p) => p.state).filter(Boolean))].sort(),
    [allPlans]
  );

  const counts = useMemo(() => {
    const byType = { residential: 0, business: 0, renewable: 0 };
    let active = 0;
    let green = 0;
    for (const p of allPlans) {
      const type = p.customer_type || "residential";
      if (type in byType) byType[type] += 1;
      if (p.is_active) active += 1;
      if ((p.renewable_percentage || 0) >= 50) green += 1;
    }
    return { byType, active, green };
  }, [allPlans]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" /> Plans
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {allPlans.length} plans · {counts.active} active · {counts.byType.residential} residential ·{" "}
            {counts.byType.business} business · {counts.green} at 50%+ renewable
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Add Plan
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg border">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search plans or providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterAudience} onValueChange={setFilterAudience}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Audience" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All audiences</SelectItem>
            <SelectItem value="residential">Residential</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="renewable">Renewable</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterGreen} onValueChange={setFilterGreen}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Green" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any renewable</SelectItem>
            <SelectItem value="green">50%+ renewable</SelectItem>
            <SelectItem value="standard">Under 50%</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Provider" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {uniqueProviders.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="fixed">Fixed</SelectItem>
            <SelectItem value="variable">Variable</SelectItem>
            <SelectItem value="indexed">Indexed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterState} onValueChange={setFilterState}>
          <SelectTrigger className="w-[100px]"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {uniqueStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Zap className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            {allPlans.length === 0
              ? "No plans yet. Add one to start building the catalog."
              : "No plans match these filters."}
          </p>
        </CardContent></Card>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-center">Audience</TableHead>
                  <TableHead className="text-center">Rate</TableHead>
                  <TableHead className="text-center">Term</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">State</TableHead>
                  <TableHead className="text-center">Green</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((plan) => (
                  <TableRow key={plan.id} className={!plan.is_active ? "opacity-50 bg-gray-50" : ""}>
                    <TableCell>
                      <div>
                        <span className="font-medium text-gray-900">{plan.plan_name}</span>
                        {plan.special_offer && (
                          <Badge className="ml-2 text-[10px] bg-orange-100 text-orange-700">
                            {plan.special_offer}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{plan.provider_name}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          (plan.customer_type || "residential") === "business"
                            ? "text-purple-700 border-purple-200 bg-purple-50"
                            : "text-blue-700 border-blue-200 bg-blue-50"
                        }`}
                      >
                        {CUSTOMER_TYPE_LABELS[plan.customer_type] || "Residential"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-green-700">{plan.rate_per_kwh}¢</span>
                    </TableCell>
                    <TableCell className="text-center text-sm">{plan.contract_length || "—"} mo</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px] capitalize">{plan.plan_type}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[10px]">{plan.state || "TX"}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {plan.renewable_percentage > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          <Leaf className="w-3 h-3 text-green-500" />
                          <span className="text-xs">{plan.renewable_percentage}%</span>
                        </div>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={plan.is_active}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: plan.id, is_active: checked })}
                        aria-label={`${plan.is_active ? "Deactivate" : "Activate"} ${plan.plan_name}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(plan)} aria-label={`Edit ${plan.plan_name}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="text-red-500"
                          onClick={() => setDeleteConfirm(plan)}
                          aria-label={`Delete ${plan.plan_name}`}
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
          <div className="px-4 py-2 text-xs text-gray-400 text-right border-t">
            Showing {filtered.length} of {allPlans.length} plans
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? `Edit ${editingPlan.plan_name}` : "Add Plan"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Provider *</Label>
              <Select value={form.provider_name} onValueChange={(v) => setForm({ ...form, provider_name: v })}>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  {providers.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {formErrors.provider_name && (
                <p role="alert" className="mt-1 text-xs text-red-600">{formErrors.provider_name}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label>Plan Name *</Label>
              <Input
                value={form.plan_name}
                onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
                placeholder="e.g. Simple Rate 24"
              />
              {formErrors.plan_name && (
                <p role="alert" className="mt-1 text-xs text-red-600">{formErrors.plan_name}</p>
              )}
            </div>

            {/* Explicit, not implied by which page you opened. */}
            <div className="col-span-2">
              <Label className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                Customer type *
              </Label>
              <Select value={form.customer_type} onValueChange={(v) => setForm({ ...form, customer_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CUSTOMER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{CUSTOMER_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                {AUDIENCE_NOTE[form.customer_type] || AUDIENCE_NOTE.residential}
              </p>
              {formErrors.customer_type && (
                <p role="alert" className="mt-1 text-xs text-red-600">{formErrors.customer_type}</p>
              )}
            </div>

            <div>
              <Label>Rate (¢/kWh) *</Label>
              <Input
                type="number" step="0.1" value={form.rate_per_kwh}
                onChange={(e) => setForm({ ...form, rate_per_kwh: e.target.value })}
              />
              {formErrors.rate_per_kwh && (
                <p role="alert" className="mt-1 text-xs text-red-600">{formErrors.rate_per_kwh}</p>
              )}
            </div>
            <div>
              <Label>Contract (months)</Label>
              <Input
                type="number" value={form.contract_length}
                onChange={(e) => setForm({ ...form, contract_length: e.target.value })}
              />
              {formErrors.contract_length && (
                <p role="alert" className="mt-1 text-xs text-red-600">{formErrors.contract_length}</p>
              )}
            </div>
            <div>
              <Label>Plan Type</Label>
              <Select value={form.plan_type} onValueChange={(v) => setForm({ ...form, plan_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="variable">Variable</SelectItem>
                  <SelectItem value="indexed">Indexed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={form.state} maxLength={2}
                onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
              />
              {formErrors.state && (
                <p role="alert" className="mt-1 text-xs text-red-600">{formErrors.state}</p>
              )}
            </div>
            <div>
              <Label>Base Charge ($/mo)</Label>
              <Input
                type="number" step="0.01" value={form.base_charge}
                onChange={(e) => setForm({ ...form, base_charge: e.target.value })}
              />
            </div>
            <div>
              <Label>ETF ($)</Label>
              <Input
                type="number" value={form.early_termination_fee}
                onChange={(e) => setForm({ ...form, early_termination_fee: e.target.value })}
              />
            </div>
            <div>
              <Label>TDSP (¢/kWh)</Label>
              <Input
                type="number" step="0.01" value={form.tdsp_charges}
                onChange={(e) => setForm({ ...form, tdsp_charges: e.target.value })}
              />
            </div>
            <div>
              <Label>Renewable %</Label>
              <Input
                type="number" min="0" max="100" value={form.renewable_percentage}
                onChange={(e) => setForm({ ...form, renewable_percentage: e.target.value })}
              />
              {formErrors.renewable_percentage && (
                <p role="alert" className="mt-1 text-xs text-red-600">{formErrors.renewable_percentage}</p>
              )}
            </div>
            <div>
              <Label>Special Offer</Label>
              <Input
                value={form.special_offer || ""}
                onChange={(e) => setForm({ ...form, special_offer: e.target.value })}
              />
            </div>
            <div>
              <Label>Promo Code</Label>
              <Input
                value={form.promo_code || ""}
                onChange={(e) => setForm({ ...form, promo_code: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Features (comma-separated)</Label>
              <Input
                value={(form.features || []).join(", ")}
                onChange={(e) => setForm({
                  ...form,
                  features: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })}
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.provider_name || !form.plan_name || isSaving}
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingPlan ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Plan</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">
            Delete <strong>{deleteConfirm?.plan_name}</strong>? It will disappear from public
            comparisons immediately. Deactivating instead keeps its history.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
