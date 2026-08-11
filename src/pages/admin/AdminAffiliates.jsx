import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Link2,
  ExternalLink,
  Copy,
  Check,
  MousePointerClick,
  ToggleRight,
  ToggleLeft,
  BarChart3,
} from "lucide-react";
import { useToast } from "../../components/ui/use-toast";

const emptyForm = {
  slug: "",
  target_url: "",
  label: "",
  provider_id: "",
  offer_id: "",
  is_active: true,
};

function generateSlug(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchAffiliateLinks() {
  const { data, error } = await supabase
    .from("affiliate_links")
    .select("*, electricity_providers(id, name), electricity_plans(id, plan_name, provider_name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function fetchProviders() {
  const { data } = await supabase
    .from("electricity_providers")
    .select("id, name")
    .order("name");
  return data || [];
}

async function fetchPlans() {
  const { data } = await supabase
    .from("electricity_plans")
    .select("id, plan_name, provider_name")
    .order("plan_name");
  return data || [];
}

async function fetchClickCounts() {
  const { data } = await supabase.from("click_tracking").select("slug");
  const counts = {};
  (data || []).forEach((c) => {
    counts[c.slug] = (counts[c.slug] || 0) + 1;
  });
  return counts;
}

export default function AdminAffiliates() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState(null);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["admin-affiliates"],
    queryFn: fetchAffiliateLinks,
  });

  const { data: providers = [] } = useQuery({
    queryKey: ["admin-affiliate-providers"],
    queryFn: fetchProviders,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["admin-affiliate-plans"],
    queryFn: fetchPlans,
  });

  const { data: clickCounts = {} } = useQuery({
    queryKey: ["admin-click-counts"],
    queryFn: fetchClickCounts,
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase.from("affiliate_links").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-affiliates"] });
      toast({ title: "Affiliate link created successfully" });
      closeDialog();
    },
    onError: (err) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase
        .from("affiliate_links")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-affiliates"] });
      toast({ title: "Affiliate link updated successfully" });
      closeDialog();
    },
    onError: (err) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from("affiliate_links")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["admin-click-counts"] });
      toast({ title: "Affiliate link deleted" });
      setDeleteConfirm(null);
    },
    onError: (err) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase
        .from("affiliate_links")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-affiliates"] });
      toast({ title: "Status updated" });
    },
    onError: (err) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setEditingLink(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (link) => {
    setEditingLink(link);
    setForm({
      slug: link.slug,
      target_url: link.target_url,
      label: link.label || "",
      provider_id: link.provider_id || "",
      offer_id: link.offer_id || "",
      is_active: link.is_active,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingLink(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      slug: form.slug,
      target_url: form.target_url,
      label: form.label || null,
      provider_id: form.provider_id || null,
      offer_id: form.offer_id || null,
      is_active: form.is_active,
    };

    if (editingLink) {
      updateMutation.mutate({ id: editingLink.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleLabelChange = (label) => {
    setForm({
      ...form,
      label,
      slug: editingLink ? form.slug : generateSlug(label),
    });
  };

  const copyLink = (slug) => {
    const url = `${window.location.origin}/go/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const filtered = links.filter((link) => {
    const matchesSearch =
      link.slug.toLowerCase().includes(search.toLowerCase()) ||
      (link.label || "").toLowerCase().includes(search.toLowerCase()) ||
      link.target_url.toLowerCase().includes(search.toLowerCase()) ||
      (link.electricity_providers?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && link.is_active) ||
      (filterStatus === "inactive" && !link.is_active);
    return matchesSearch && matchesStatus;
  });

  const totalClicks = Object.values(clickCounts).reduce((a, b) => a + b, 0);
  const activeCount = links.filter((l) => l.is_active).length;
  const inactiveCount = links.filter((l) => !l.is_active).length;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100">
              <Link2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{links.length}</p>
              <p className="text-sm text-gray-500">Total Links</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-100">
              <ToggleRight className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gray-100">
              <ToggleLeft className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inactiveCount}</p>
              <p className="text-sm text-gray-500">Inactive</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#0A5C8C]/10">
              <MousePointerClick className="w-5 h-5 text-[#0A5C8C]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalClicks}</p>
              <p className="text-sm text-gray-500">Total Clicks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by slug, label, URL, or provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openCreate} className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Affiliate Link
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
              <Link2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">
                {links.length === 0
                  ? "No affiliate links yet"
                  : "No links match your filters"}
              </p>
              {links.length === 0 && (
                <p className="text-sm mt-1">Create your first affiliate link to get started.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Slug / Label</TableHead>
                    <TableHead>Provider / Offer</TableHead>
                    <TableHead>Target URL</TableHead>
                    <TableHead className="text-center">Clicks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <button onClick={() => toggleMutation.mutate({ id: link.id, is_active: !link.is_active })}>
                          <Badge
                            variant={link.is_active ? "default" : "secondary"}
                            className="cursor-pointer"
                          >
                            {link.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                            /go/{link.slug}
                          </code>
                          <button
                            onClick={() => copyLink(link.slug)}
                            className="text-gray-400 hover:text-[#0A5C8C]"
                            title="Copy full URL"
                          >
                            {copiedSlug === link.slug ? (
                              <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {link.label && (
                          <p className="text-xs text-gray-500 mt-1">{link.label}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-900">
                          {link.electricity_providers?.name || (
                            <span className="text-gray-400">—</span>
                          )}
                        </p>
                        {link.electricity_plans?.plan_name && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {link.electricity_plans.plan_name}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <a
                          href={link.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0A5C8C] hover:underline text-xs flex items-center gap-1 max-w-[200px] truncate"
                          title={link.target_url}
                        >
                          {link.target_url.replace(/^https?:\/\//, "").substring(0, 40)}
                          {link.target_url.length > 48 ? "..." : ""}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium">
                          <BarChart3 className="w-3.5 h-3.5 text-[#0A5C8C]" />
                          {clickCounts[link.slug] || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(link)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteConfirm(link)}
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
        Showing {filtered.length} of {links.length} affiliate links
      </p>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingLink ? "Edit Affiliate Link" : "Add Affiliate Link"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={form.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="e.g., TXU Energy Summer Deal"
              />
            </div>

            <div className="space-y-2">
              <Label>Slug *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 whitespace-nowrap">/go/</span>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="txu-energy-summer"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target URL *</Label>
              <Input
                type="url"
                value={form.target_url}
                onChange={(e) => setForm({ ...form, target_url: e.target.value })}
                placeholder="https://partner.example.com/signup?ref=electricscouts"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Associated Provider</Label>
                <Select
                  value={form.provider_id || "none"}
                  onValueChange={(v) => setForm({ ...form, provider_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Associated Plan/Offer</Label>
                <Select
                  value={form.offer_id || "none"}
                  onValueChange={(v) => setForm({ ...form, offer_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.plan_name} ({p.provider_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label>Active (link is live)</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white"
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingLink ? "Save Changes" : "Create Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Affiliate Link</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the affiliate link{" "}
            <strong>/go/{deleteConfirm?.slug}</strong>? This action cannot be undone.
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
