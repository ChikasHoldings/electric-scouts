import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Card, CardContent } from "../../components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import { Plus, Pencil, Loader2, Users, AlertTriangle } from "lucide-react";

import { parseOptionalNumber } from "@/lib/planValidation";

/**
 * Lead buyers.
 *
 * The monetization router already decides that a lead belongs to a partner
 * route; this is where an admin says who those partners are. Adding an active
 * row is the entire configuration step — matching, capacity and delivery all
 * read from this table, so a newly signed buyer starts receiving leads without
 * a deploy.
 */

const EMPTY = {
  name: "", is_active: false,
  customer_types: [], states: [], accepts_renewable: true,
  requires_phone: false, min_lead_score: "",
  price_per_lead: "", priority: "0",
  monthly_cap: "",
  delivery_method: "email", delivery_email: "", webhook_url: "",
  notes: "",
};

/** Comma-separated admin input to a clean array. Blank means "no restriction". */
function parseList(input) {
  return String(input || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AdminLeadBuyers() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const { data: buyers = [], isLoading } = useQuery({
    queryKey: ["admin-lead-buyers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_buyers")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const save = useMutation({
    mutationFn: async ({ id, values }) => {
      const query = id
        ? supabase.from("lead_buyers").update(values).eq("id", id)
        : supabase.from("lead_buyers").insert(values);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lead-buyers"] });
      setDialogOpen(false);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase.from("lead_buyers").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-lead-buyers"] }),
  });

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (buyer) => {
    setEditing(buyer);
    setForm({
      ...EMPTY,
      ...buyer,
      customer_types: buyer.customer_types || [],
      states: buyer.states || [],
      min_lead_score: buyer.min_lead_score ?? "",
      price_per_lead: buyer.price_per_lead ?? "",
      priority: String(buyer.priority ?? 0),
      monthly_cap: buyer.monthly_cap ?? "",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const submit = () => {
    const next = {};

    if (!String(form.name).trim()) next.name = "Name is required.";

    // Blank stays null rather than becoming 0 — a blank cap means "no cap",
    // and a 0 cap would stop delivery entirely.
    const numeric = {
      price_per_lead: parseOptionalNumber(form.price_per_lead, { field: "Price per lead", min: 0, max: 100000 }),
      priority: parseOptionalNumber(form.priority, { field: "Priority", min: -1000, max: 1000, integer: true }),
      monthly_cap: parseOptionalNumber(form.monthly_cap, { field: "Monthly cap", min: 1, max: 1000000, integer: true }),
      min_lead_score: parseOptionalNumber(form.min_lead_score, { field: "Minimum score", min: 0, max: 100, integer: true }),
    };
    for (const [key, result] of Object.entries(numeric)) {
      if (result.error) next[key] = result.error;
    }

    if (form.delivery_method === "email" && !String(form.delivery_email).trim()) {
      next.delivery_email = "An email address is required for email delivery.";
    }
    if (form.delivery_method === "webhook" && !String(form.webhook_url).trim()) {
      next.webhook_url = "A webhook URL is required for webhook delivery.";
    }

    // Activating a buyer with no way to reach them would silently drop every
    // lead matched to them, so it is blocked rather than warned about.
    if (form.is_active && form.delivery_method !== "manual") {
      const hasTarget = form.delivery_method === "email"
        ? String(form.delivery_email).trim()
        : String(form.webhook_url).trim();
      if (!hasTarget) next.is_active = "Configure a delivery target before activating.";
    }

    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setErrors({});
    save.mutate({
      id: editing?.id,
      values: {
        name: String(form.name).trim(),
        is_active: form.is_active === true,
        customer_types: Array.isArray(form.customer_types) ? form.customer_types : parseList(form.customer_types),
        states: (Array.isArray(form.states) ? form.states : parseList(form.states)).map((s) => s.toUpperCase()),
        accepts_renewable: form.accepts_renewable !== false,
        requires_phone: form.requires_phone === true,
        min_lead_score: numeric.min_lead_score.value,
        price_per_lead: numeric.price_per_lead.value,
        priority: numeric.priority.value ?? 0,
        monthly_cap: numeric.monthly_cap.value,
        delivery_method: form.delivery_method,
        delivery_email: String(form.delivery_email || "").trim() || null,
        webhook_url: String(form.webhook_url || "").trim() || null,
        notes: String(form.notes || "").trim() || null,
      },
    });
  };

  const activeCount = buyers.filter((b) => b.is_active).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="text-[14px] text-gray-600 leading-relaxed max-w-2xl">
          Partners who buy qualified leads. A lead is offered to the highest-priority
          active buyer whose targeting it matches — and never to the same buyer twice.
        </p>
        <Button onClick={openNew} className="gap-1.5 flex-shrink-0">
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add buyer
        </Button>
      </div>

      {activeCount === 0 && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-[15px] font-medium text-gray-900">No active lead buyers</p>
            <p className="mt-1 text-[13.5px] text-gray-600 leading-relaxed">
              Leads routed to a partner have nowhere to go. They are still captured
              and visible under Leads, but nothing is being sold. Add a buyer and
              activate it to start delivery.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {buyers.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" aria-hidden="true" />
              <p className="text-[15px] text-gray-600">No lead buyers configured yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Takes</TableHead>
                  <TableHead>Markets</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Priority</TableHead>
                  <TableHead>This month</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {buyers.map((b) => (
                  <TableRow key={b.id} className={b.is_active ? "" : "opacity-60"}>
                    <TableCell className="font-medium text-gray-900">{b.name}</TableCell>
                    <TableCell className="text-[13px] text-gray-600">
                      {b.customer_types?.length ? b.customer_types.join(", ") : "Any type"}
                      {b.accepts_renewable === false && (
                        <span className="block text-[12px] text-gray-500">No renewable</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[13px] text-gray-600">
                      {b.states?.length ? b.states.join(", ") : "All states"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[13.5px]">
                      {b.price_per_lead != null ? `$${Number(b.price_per_lead).toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[13.5px]">{b.priority ?? 0}</TableCell>
                    <TableCell className="text-[13px] text-gray-600 tabular-nums">
                      {b.monthly_cap
                        ? `${b.delivered_this_period ?? 0} / ${b.monthly_cap}`
                        : `${b.delivered_this_period ?? 0} · no cap`}
                    </TableCell>
                    <TableCell className="text-[13px] text-gray-600 capitalize">{b.delivery_method}</TableCell>
                    <TableCell>
                      <Switch
                        checked={b.is_active === true}
                        onCheckedChange={(v) => toggleActive.mutate({ id: b.id, is_active: v })}
                        aria-label={`${b.is_active ? "Deactivate" : "Activate"} ${b.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(b)} aria-label={`Edit ${b.name}`}>
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add lead buyer"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <Field label="Buyer name" error={errors.name}>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Customer types" hint="Blank means any type" >
                <Input
                  value={Array.isArray(form.customer_types) ? form.customer_types.join(", ") : form.customer_types}
                  onChange={(e) => setForm({ ...form, customer_types: parseList(e.target.value) })}
                  placeholder="residential, commercial"
                />
              </Field>
              <Field label="States" hint="Blank means every state">
                <Input
                  value={Array.isArray(form.states) ? form.states.join(", ") : form.states}
                  onChange={(e) => setForm({ ...form, states: parseList(e.target.value) })}
                  placeholder="TX, IL, OH"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Price per lead ($)" error={errors.price_per_lead}>
                <Input value={form.price_per_lead} onChange={(e) => setForm({ ...form, price_per_lead: e.target.value })} inputMode="decimal" />
              </Field>
              <Field label="Priority" hint="Higher wins" error={errors.priority}>
                <Input value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} inputMode="numeric" />
              </Field>
              <Field label="Monthly cap" hint="Blank means no cap" error={errors.monthly_cap}>
                <Input value={form.monthly_cap} onChange={(e) => setForm({ ...form, monthly_cap: e.target.value })} inputMode="numeric" />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Minimum lead score" hint="Blank accepts any" error={errors.min_lead_score}>
                <Input value={form.min_lead_score} onChange={(e) => setForm({ ...form, min_lead_score: e.target.value })} inputMode="numeric" />
              </Field>
              <Field label="Delivery method">
                <Select value={form.delivery_method} onValueChange={(v) => setForm({ ...form, delivery_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="manual">Manual handover</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {form.delivery_method === "email" && (
              <Field label="Delivery email" error={errors.delivery_email}>
                <Input value={form.delivery_email} onChange={(e) => setForm({ ...form, delivery_email: e.target.value })} type="email" />
              </Field>
            )}
            {form.delivery_method === "webhook" && (
              <Field label="Webhook URL" error={errors.webhook_url}>
                <Input value={form.webhook_url} onChange={(e) => setForm({ ...form, webhook_url: e.target.value })} />
              </Field>
            )}

            <div className="space-y-3 pt-1">
              <Toggle
                label="Accepts renewable leads"
                checked={form.accepts_renewable !== false}
                onChange={(v) => setForm({ ...form, accepts_renewable: v })}
              />
              <Toggle
                label="Requires a phone number"
                checked={form.requires_phone === true}
                onChange={(v) => setForm({ ...form, requires_phone: v })}
              />
              <Toggle
                label="Active — start receiving leads"
                checked={form.is_active === true}
                onChange={(v) => setForm({ ...form, is_active: v })}
              />
              {errors.is_active && (
                <p role="alert" className="text-[13px] text-red-600">{errors.is_active}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
              {editing ? "Save changes" : "Add buyer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div>
      <Label className="block text-[13px] font-medium text-gray-700 mb-1.5">{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-[12.5px] text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12.5px] text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 text-[14px] text-gray-700 cursor-pointer">
      <Switch checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
  );
}
