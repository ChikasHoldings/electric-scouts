import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UtilityTerritory, ElectricityPlan } from "@/api/supabaseEntities";
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
import { Plus, Pencil, Trash2, Loader2, Zap, AlertTriangle, ExternalLink, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { validateTerritory, BILLING_MODEL_LABELS } from "@/lib/territoryValidation";
import { BILLING_MODELS } from "@/lib/deliveryTariff";
import AdminPage, { AdminPageBar } from "@/components/admin/AdminPage";
import BulkImportDialog from "@/components/admin/BulkImportDialog";
import { importTerritories, dayBefore } from "@/lib/bulkImport";

/**
 * Delivery tariffs, one row per utility service territory.
 *
 * This screen exists because a delivery charge is a fact about a utility, not
 * about a plan. Every retailer selling into Oncor bills the same Oncor delivery
 * charge — so holding that number on each plan meant all 378 active plans
 * carried one, every one of them was 0, and the comparison engine read 0 as
 * "not configured". The visible consequence was that no plan anywhere on the
 * site could show a monthly bill or a savings comparison, and match scores were
 * capped at 79.
 *
 * Fixing that plan by plan is 378 edits of a number with about seventeen real
 * values. Fixing it here is one row per territory.
 *
 * Two things on this screen are load-bearing rather than decorative:
 *
 *   BILLING MODEL decides whether the delivery charge is ADDED to the
 *   retailer's advertised rate or already included in it. Getting it backwards
 *   produces a confidently wrong bill, which is worse than the honest
 *   supply-only subtotal shown when nothing is configured at all.
 *
 *   PROVENANCE — source and verified date — is what makes a published tariff
 *   auditable. A delivery charge nobody can trace is a number customers are
 *   being billed against on somebody's memory.
 */

const emptyTerritory = {
  name: "", short_code: "", state: "TX",
  billing_model: BILLING_MODELS.SUPPLY_ONLY,
  delivery_per_kwh_cents: "", fixed_monthly_delivery_charge: "",
  effective_from: new Date().toISOString().slice(0, 10),
  effective_to: "",
  source_name: "", source_url: "", verified_at: "",
  service_zip_prefixes: "", notes: "", is_active: true,
};

/** The markets the platform serves. A tariff outside them prices nothing. */
const STATES = ["TX", "IL", "OH", "PA", "NY", "NJ", "MD", "MA", "ME", "NH", "RI", "CT"];

function toFormValues(row) {
  const values = { ...emptyTerritory, ...row };
  for (const key of [
    "short_code", "delivery_per_kwh_cents", "fixed_monthly_delivery_charge",
    "effective_to", "source_name", "source_url", "verified_at", "notes",
  ]) {
    if (values[key] === null || values[key] === undefined) values[key] = "";
  }
  values.service_zip_prefixes = Array.isArray(row?.service_zip_prefixes)
    ? row.service_zip_prefixes.join(", ")
    : "";
  values.effective_from = (row?.effective_from || emptyTerritory.effective_from).slice(0, 10);
  return values;
}

export default function AdminTerritories() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyTerritory);
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: territories = [], isLoading } = useQuery({
    queryKey: ["admin-territories"],
    queryFn: () => UtilityTerritory.list({ order: "state", ascending: true }),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => ElectricityPlan.list(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-territories"] });
    queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
  };

  const createMutation = useMutation({
    mutationFn: (data) => UtilityTerritory.create(data),
    onSuccess: () => { invalidate(); toast({ title: "Tariff added" }); closeDialog(); },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => UtilityTerritory.update(id, data),
    onSuccess: () => { invalidate(); toast({ title: "Tariff updated" }); closeDialog(); },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => UtilityTerritory.delete(id),
    onSuccess: () => { invalidate(); toast({ title: "Tariff deleted" }); setDeleteConfirm(null); },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => UtilityTerritory.update(id, { is_active }),
    onSuccess: invalidate,
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyTerritory);
    setFormErrors({});
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm(toFormValues(row));
    setFormErrors({});
    setDialogOpen(true);
  };

  const openCreate = (state) => {
    setEditing(null);
    setForm({ ...emptyTerritory, state: state || "TX" });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const { valid, values, errors } = validateTerritory(form);
    if (!valid) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    if (editing) updateMutation.mutate({ id: editing.id, data: values });
    else createMutation.mutate(values);
  };

  // Which markets have live plans but no delivery tariff. This is the number
  // that matters: a state in this list is a state where nothing can show a
  // monthly bill, however many plans it has.
  const uncovered = useMemo(() => {
    const covered = new Set(
      territories.filter((t) => t.is_active).map((t) => t.state)
    );
    const counts = {};
    for (const plan of plans) {
      if (!plan.is_active) continue;
      const state = plan.state;
      if (!state || covered.has(state)) continue;
      counts[state] = (counts[state] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [territories, plans]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  /**
   * Apply a pasted tariff sheet.
   *
   * A changed tariff does not overwrite the old row — it closes it the day
   * before the replacement opens and inserts a new one. That is what lets a
   * quote from last month still be explained, and it is the reason the table
   * carries an effective window at all.
   */
  const applyImport = async (rows) => {
    let created = 0;
    let superseded = 0;
    for (const row of rows) {
      if (row.action === "supersede" && row.current) {
        const closesOn = dayBefore(row.values.effective_from);
        if (closesOn) {
          await UtilityTerritory.update(row.current.id, { effective_to: closesOn });
        }
        superseded += 1;
      } else {
        created += 1;
      }
      await UtilityTerritory.create({ ...row.values, is_active: true });
    }
    queryClient.invalidateQueries({ queryKey: ["admin-territories"] });
    toast({
      title: "Tariffs imported",
      description: [
        created ? `${created} added` : null,
        superseded ? `${superseded} superseded, the previous rate closed the day before` : null,
      ].filter(Boolean).join(" · "),
    });
  };

  return (
    <AdminPage>
      <AdminPageBar
        summary={
          <>
            {territories.length} configured · {territories.filter((t) => t.is_active).length} active ·
            {" "}covering {new Set(territories.filter((t) => t.is_active).map((t) => t.state)).size} of {STATES.length} markets
          </>
        }
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 mr-1" /> Import
            </Button>
            <Button size="sm" onClick={() => openCreate()}>
              <Plus className="w-4 h-4 mr-1" /> Add tariff
            </Button>
          </div>
        }
      />

      {uncovered.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900">
                {uncovered.length} market{uncovered.length === 1 ? "" : "s"} have live plans but no delivery tariff
              </p>
              <p className="text-amber-800 mt-0.5">
                Plans in these states show a supply-only subtotal and cannot produce a savings
                comparison. One tariff row fixes every plan in the market at once.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {uncovered.map(([state, count]) => (
                  <Button
                    key={state}
                    size="sm"
                    variant="outline"
                    className="h-7 border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                    onClick={() => openCreate(state)}
                  >
                    {state} — {count} plan{count === 1 ? "" : "s"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : territories.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Zap className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 max-w-md mx-auto">
            No delivery tariffs configured yet. Until one exists for a market, plans there
            show a supply-only subtotal rather than a monthly bill.
          </p>
        </CardContent></Card>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Territory</TableHead>
                  <TableHead className="text-center">State</TableHead>
                  <TableHead className="text-center">Billing</TableHead>
                  <TableHead className="text-center">Delivery</TableHead>
                  <TableHead className="text-center">Fixed</TableHead>
                  <TableHead className="text-center">Effective</TableHead>
                  <TableHead className="text-center">Source</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {territories.map((row) => {
                  const allIn = row.billing_model === BILLING_MODELS.ALL_IN;
                  const hasRate = row.delivery_per_kwh_cents !== null && row.delivery_per_kwh_cents !== undefined;
                  return (
                    <TableRow key={row.id} className={!row.is_active ? "opacity-50 bg-gray-50" : ""}>
                      <TableCell>
                        <span className="font-medium text-gray-900">{row.name}</span>
                        {row.short_code && (
                          <Badge variant="outline" className="ml-2 text-[10px]">{row.short_code}</Badge>
                        )}
                        {Array.isArray(row.service_zip_prefixes) && row.service_zip_prefixes.length > 0 && (
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            ZIPs {row.service_zip_prefixes.join(", ")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-[10px]">{row.state}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${allIn
                            ? "text-purple-700 border-purple-200 bg-purple-50"
                            : "text-blue-700 border-blue-200 bg-blue-50"}`}
                        >
                          {BILLING_MODEL_LABELS[row.billing_model] || row.billing_model}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {allIn ? (
                          <span className="text-gray-400" title="The advertised rate already includes delivery">
                            included
                          </span>
                        ) : hasRate ? (
                          <span className="font-semibold text-green-700">{row.delivery_per_kwh_cents}¢</span>
                        ) : (
                          <span className="text-amber-600" title="No delivery rate: plans here stay supply-only">
                            not set
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {row.fixed_monthly_delivery_charge ? `$${row.fixed_monthly_delivery_charge}` : "—"}
                      </TableCell>
                      <TableCell className="text-center text-[12px] text-gray-600">
                        {String(row.effective_from).slice(0, 10)}
                        {row.effective_to ? ` → ${String(row.effective_to).slice(0, 10)}` : ""}
                      </TableCell>
                      <TableCell className="text-center text-[12px]">
                        {row.source_url ? (
                          <a
                            href={row.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            {row.source_name || "source"}
                            <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          </a>
                        ) : (
                          <span className="text-amber-600" title="An unsourced tariff cannot be audited">
                            unsourced
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={row.is_active}
                          onCheckedChange={(checked) => toggleMutation.mutate({ id: row.id, is_active: checked })}
                          aria-label={`${row.is_active ? "Deactivate" : "Activate"} ${row.name}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(row)} aria-label={`Edit ${row.name}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost" size="sm" className="text-red-500"
                            onClick={() => setDeleteConfirm(row)}
                            aria-label={`Delete ${row.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add delivery tariff"}</DialogTitle>
          </DialogHeader>

          {Object.keys(formErrors).length > 0 && (
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-800">This tariff could not be saved:</p>
              <ul className="mt-1 list-disc pl-5 text-xs text-red-700 space-y-0.5">
                {Object.entries(formErrors).map(([key, message]) => <li key={key}>{message}</li>)}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Utility / territory name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Oncor Electric Delivery"
              />
            </div>
            <div>
              <Label>Short code</Label>
              <Input
                value={form.short_code}
                onChange={(e) => setForm({ ...form, short_code: e.target.value })}
                placeholder="e.g. ONCOR"
              />
            </div>

            <div>
              <Label>State *</Label>
              <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Billing model *</Label>
              <Select value={form.billing_model} onValueChange={(v) => setForm({ ...form, billing_model: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={BILLING_MODELS.SUPPLY_ONLY}>
                    {BILLING_MODEL_LABELS[BILLING_MODELS.SUPPLY_ONLY]}
                  </SelectItem>
                  <SelectItem value={BILLING_MODELS.ALL_IN}>
                    {BILLING_MODEL_LABELS[BILLING_MODELS.ALL_IN]}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                {form.billing_model === BILLING_MODELS.ALL_IN
                  ? "Retailer rates here already include delivery, so nothing is added to the estimate."
                  : "Delivery is billed on top of the retailer's rate and is added to the estimate."}
              </p>
            </div>

            {form.billing_model === BILLING_MODELS.SUPPLY_ONLY && (
              <>
                <div>
                  <Label>Delivery charge (¢/kWh)</Label>
                  <Input
                    type="number" step="0.0001" value={form.delivery_per_kwh_cents}
                    onChange={(e) => setForm({ ...form, delivery_per_kwh_cents: e.target.value })}
                    placeholder="e.g. 4.85"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {Number(form.delivery_per_kwh_cents) >= 0 && form.delivery_per_kwh_cents !== ""
                      ? "Plans in this market can show a full monthly estimate."
                      : "Leave blank if not yet researched — plans stay supply-only until it is set."}
                  </p>
                </div>
                <div>
                  <Label>Fixed monthly delivery charge ($)</Label>
                  <Input
                    type="number" step="0.01" value={form.fixed_monthly_delivery_charge}
                    onChange={(e) => setForm({ ...form, fixed_monthly_delivery_charge: e.target.value })}
                    placeholder="e.g. 5.47"
                  />
                </div>
              </>
            )}

            <div>
              <Label>Effective from *</Label>
              <Input
                type="date" value={form.effective_from}
                onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
              />
            </div>
            <div>
              <Label>Effective to</Label>
              <Input
                type="date" value={form.effective_to}
                onChange={(e) => setForm({ ...form, effective_to: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-500">
                Blank means current. Close a superseded tariff rather than editing its rate.
              </p>
            </div>

            <div className="col-span-2">
              <Label>ZIP prefixes</Label>
              <Input
                value={form.service_zip_prefixes}
                onChange={(e) => setForm({ ...form, service_zip_prefixes: e.target.value })}
                placeholder="e.g. 770, 772, 773 — blank applies to the whole state"
              />
            </div>

            <div>
              <Label>Source name</Label>
              <Input
                value={form.source_name}
                onChange={(e) => setForm({ ...form, source_name: e.target.value })}
                placeholder="e.g. Oncor tariff schedule"
              />
            </div>
            <div>
              <Label>Verified on</Label>
              <Input
                type="date" value={form.verified_at}
                onChange={(e) => setForm({ ...form, verified_at: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Source URL</Label>
              <Input
                value={form.source_url}
                onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                placeholder="https://…"
              />
              <p className="mt-1 text-xs text-gray-500">
                Where this rate was published. A tariff nobody can trace is a number customers
                are billed against on somebody&apos;s memory.
              </p>
            </div>

            <div className="col-span-2">
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete tariff</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">
            Delete <strong>{deleteConfirm?.name}</strong>? Plans in {deleteConfirm?.state} will
            immediately fall back to supply-only estimates. Closing it with an effective-to date
            keeps the history instead.
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
        title="Import delivery tariffs"
        description="Paste the delivery charges from the utility tariff sheets. A charge given in dollars per kWh where cents are expected is rejected rather than imported — that mistake would make every estimate in the market a hundredth of the truth."
        sample={"name,state,billing_model,delivery_per_kwh_cents,fixed_monthly_delivery_charge,effective_from,service_zip_prefixes\nOncor,TX,supply_only,4.8,4.23,2026-01-01,750 751 752"}
        analyze={(text) => importTerritories(text, territories)}
        onCommit={applyImport}
        describeRow={(row) =>
          `${row.values.name || "(no name)"} · ${row.values.state || "??"} · ` +
          (row.values.billing_model === "all_in"
            ? "all-in, delivery included"
            : `${row.values.delivery_per_kwh_cents ?? "—"}¢/kWh`) +
          (row.current ? ` (was ${row.current.delivery_per_kwh_cents ?? "—"}¢)` : "")
        }
      />

    </AdminPage>
  );
}
