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
import { Plus, Pencil, Trash2, Search, Loader2, Zap, Leaf, Building, AlertTriangle, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  validatePlan, pricingCompleteness, catalogPricingCoverage, CUSTOMER_TYPES,
} from "@/lib/planValidation";
import AdminPage, { AdminPageBar } from "@/components/admin/AdminPage";
import BulkImportDialog from "@/components/admin/BulkImportDialog";
import { importPlans } from "@/lib/bulkImport";

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

/**
 * Fields the form must show as empty rather than as the string "null".
 *
 * `null` is now a real stored value — it is how a plan says "this delivery rate
 * has not been researched yet" — so spreading a row straight into form state
 * would hand a controlled <Input> a null value and make React switch it to
 * uncontrolled mid-edit.
 */
const NUMERIC_FORM_FIELDS = [
  "rate_per_kwh", "contract_length", "early_termination_fee", "monthly_base_charge",
  "base_charge", "tdsp_charges", "usage_credit", "usage_credit_threshold",
];

const TEXT_FORM_FIELDS = ["plan_details_url", "facts_label_url", "promo_code", "special_offer"];

function toFormValues(plan) {
  const values = { ...emptyPlan, ...plan };
  for (const key of [...NUMERIC_FORM_FIELDS, ...TEXT_FORM_FIELDS]) {
    if (values[key] === null || values[key] === undefined) values[key] = "";
  }
  return values;
}

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
  const [filterPricing, setFilterPricing] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState(emptyPlan);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

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
      ...toFormValues(plan),
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
    if (filterPricing !== "all") {
      const complete = pricingCompleteness(p).complete;
      if (filterPricing === "complete" && !complete) return false;
      if (filterPricing === "incomplete" && complete) return false;
    }
    return true;
  }), [allPlans, search, filterProvider, filterType, filterState, filterAudience, filterGreen, filterPricing]);

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

  // How much of the published catalog can produce a real monthly bill estimate.
  // This was 0 of 378 and nothing said so: every plan quietly fell back to a
  // supply-only subtotal, so no savings comparison could be shown anywhere on
  // the site and match scores were capped at 79.
  const coverage = useMemo(() => catalogPricingCoverage(allPlans), [allPlans]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminPage>
      <AdminPageBar
        summary={
          <>
            {allPlans.length} plans · {counts.active} active · {counts.byType.residential} residential ·{" "}
            {counts.byType.business} business · {counts.green} at 50%+ renewable
          </>
        }
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 mr-1" /> Import rates
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" /> Add Plan
            </Button>
          </div>
        }
      />

      {/*
        The pricing-coverage banner.

        A plan without a delivery (TDSP) rate cannot be priced completely, and
        the consequences are invisible from a catalog listing: the plan shows a
        supply-only subtotal instead of a monthly bill, it can never produce a
        savings figure against the customer's current bill, and its match score
        is capped at 79. Showing the count turns that from a silent ceiling into
        a work queue.
      */}
      {coverage.incomplete > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900">
                {coverage.complete} of {coverage.active} active plans can show a full monthly estimate
                {" "}({coverage.percent}%)
              </p>
              <p className="text-amber-800 mt-0.5">
                The other {coverage.incomplete} have no delivery (TDSP) charge configured, so they
                show a supply-only subtotal, cannot produce a savings comparison against a
                customer&apos;s bill, and their match score is capped at 79.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100 shrink-0"
            onClick={() => setFilterPricing("incomplete")}
          >
            Show them
          </Button>
        </div>
      )}

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
        <Select value={filterPricing} onValueChange={setFilterPricing}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Pricing" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any pricing</SelectItem>
            <SelectItem value="complete">Fully priced</SelectItem>
            <SelectItem value="incomplete">Missing delivery rate</SelectItem>
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
                  <TableHead className="text-center">Pricing</TableHead>
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
                    {/*
                      Why this plan does or does not show a monthly bill on the
                      public site. The same rule the comparison engine applies,
                      via the shared helper, so the badge cannot disagree with
                      what a customer actually sees.
                    */}
                    <TableCell className="text-center">
                      {(() => {
                        const pricing = pricingCompleteness(plan);
                        return pricing.complete ? (
                          <Badge variant="outline" className="text-[10px] text-green-700 border-green-200 bg-green-50">
                            Full estimate
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-700 border-amber-200 bg-amber-50"
                            title={`Missing: ${pricing.missing.join(", ")}. Shows a supply-only subtotal and no savings comparison.`}
                          >
                            Supply only
                          </Badge>
                        );
                      })()}
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
          {/*
            Every validation failure, guaranteed visible.

            The inline messages below cover each field, but they only work for
            errors that have a slot: `validatePlan` reported a missing provider
            as `provider_id` while this dialog rendered `provider_name`, so that
            failure was invisible — Save simply did nothing and the dialog sat
            there. This summary means a validation key without its own slot can
            never silently stall the form again.
          */}
          {Object.keys(formErrors).length > 0 && (
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-800">This plan could not be saved:</p>
              <ul className="mt-1 list-disc pl-5 text-xs text-red-700 space-y-0.5">
                {Object.entries(formErrors).map(([key, message]) => (
                  <li key={key}>{message}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Provider *</Label>
              <Select value={form.provider_name} onValueChange={(v) => setForm({ ...form, provider_name: v })}>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  {providers.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {formErrors.provider_id && (
                <p role="alert" className="mt-1 text-xs text-red-600">{formErrors.provider_id}</p>
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
            {/*
              Edits `monthly_base_charge`, not `base_charge`. This field wrote
              the legacy column while the pricing engine and every public page
              read the other one, so correcting the base charge on a plan that
              had a `monthly_base_charge` changed nothing a customer would see.
              `validatePlan` keeps the legacy column mirrored.
            */}
            <div>
              <Label>Base Charge ($/mo)</Label>
              <Input
                type="number" step="0.01" value={form.monthly_base_charge}
                onChange={(e) => setForm({ ...form, monthly_base_charge: e.target.value })}
              />
              {formErrors.monthly_base_charge && (
                <p role="alert" className="mt-1 text-xs text-red-600">{formErrors.monthly_base_charge}</p>
              )}
            </div>
            <div>
              <Label>ETF ($)</Label>
              <Input
                type="number" value={form.early_termination_fee}
                onChange={(e) => setForm({ ...form, early_termination_fee: e.target.value })}
              />
              {formErrors.early_termination_fee && (
                <p role="alert" className="mt-1 text-xs text-red-600">{formErrors.early_termination_fee}</p>
              )}
            </div>

            {/* The field that decides whether this plan can show a monthly bill. */}
            <div className="col-span-2">
              <Label>Delivery / TDSP charge (¢/kWh)</Label>
              <Input
                type="number" step="0.01" value={form.tdsp_charges}
                onChange={(e) => setForm({ ...form, tdsp_charges: e.target.value })}
                placeholder="e.g. 4.85 — leave blank if not known"
              />
              <p className="mt-1 text-xs text-gray-500">
                {Number(form.tdsp_charges) > 0
                  ? "This plan can show a full monthly estimate and a savings comparison."
                  : "Without this, the plan shows a supply-only subtotal, cannot be compared "
                    + "against a customer's current bill, and its match score is capped at 79."}
              </p>
              {formErrors.tdsp_charges && (
                <p role="alert" className="mt-1 text-xs text-red-600">{formErrors.tdsp_charges}</p>
              )}
            </div>

            {/*
              Bill credits were priced by the engine and validated on save, but
              had no field here — so a Texas bill-credit plan, one of the most
              common products in that market, could not be entered at all.
            */}
            <div>
              <Label>Bill credit ($/mo)</Label>
              <Input
                type="number" step="0.01" value={form.usage_credit}
                onChange={(e) => setForm({ ...form, usage_credit: e.target.value })}
              />
              {formErrors.usage_credit && (
                <p role="alert" className="mt-1 text-xs text-red-600">{formErrors.usage_credit}</p>
              )}
            </div>
            <div>
              <Label>Credit applies at (kWh)</Label>
              <Input
                type="number" value={form.usage_credit_threshold}
                onChange={(e) => setForm({ ...form, usage_credit_threshold: e.target.value })}
                placeholder="Blank = always"
              />
              {formErrors.usage_credit_threshold && (
                <p role="alert" className="mt-1 text-xs text-red-600">{formErrors.usage_credit_threshold}</p>
              )}
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
            {/*
              Both URLs were already validated on save but had nowhere to be
              entered. The Electricity Facts Label is the document a customer is
              legally entitled to before enrolling in Texas, so having no way to
              record it is a compliance gap, not just a missing field.
            */}
            <div className="col-span-2">
              <Label>Plan details URL</Label>
              <Input
                value={form.plan_details_url || ""}
                onChange={(e) => setForm({ ...form, plan_details_url: e.target.value })}
                placeholder="https://provider.example.com/plans/simple-rate-24"
              />
              {formErrors.plan_details_url && (
                <p role="alert" className="mt-1 text-xs text-red-600">{formErrors.plan_details_url}</p>
              )}
            </div>
            <div className="col-span-2">
              <Label>Electricity Facts Label (EFL) URL</Label>
              <Input
                value={form.facts_label_url || ""}
                onChange={(e) => setForm({ ...form, facts_label_url: e.target.value })}
                placeholder="https://provider.example.com/efl/simple-rate-24.pdf"
              />
              {formErrors.facts_label_url && (
                <p role="alert" className="mt-1 text-xs text-red-600">{formErrors.facts_label_url}</p>
              )}
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
      <BulkImportDialog
        open={importOpen}
        onOpenChange={() => setImportOpen(false)}
        title="Import plan rates"
        description="Paste a supplier rate card. Rates are in cents per kWh — a figure given in dollars is rejected rather than imported, because it would survive every other check and invent a saving a hundred times too large."
        sample={"provider_name,plan_name,state,customer_type,rate_per_kwh,contract_length,plan_type,renewable_percentage,monthly_base_charge,early_termination_fee\nNextVolt Energy,NextVolt Fixed 12,TX,residential,13.5,12,fixed,15,0,150"}
        analyze={(text) => importPlans(text, providers, allPlans)}
        onCommit={async (rows) => {
          for (const row of rows) {
            if (row.action === "update" && row.current) {
              await ElectricityPlan.update(row.current.id, row.values);
            } else {
              await ElectricityPlan.create(row.values);
            }
          }
          invalidate();
          toast({
            title: "Rates imported",
            description: `${rows.length} plan${rows.length === 1 ? "" : "s"} written.`,
          });
        }}
        describeRow={(row) =>
          `${row.values.provider_name || "(no supplier)"} · ${row.values.plan_name || "(no plan)"} · ` +
          `${row.values.state || "??"} · ${row.values.rate_per_kwh ?? "—"}¢/kWh` +
          (row.rateChange && row.rateChange.from !== row.rateChange.to
            ? ` (was ${row.rateChange.from}¢)` : "")
        }
      />

    </AdminPage>
  );
}
