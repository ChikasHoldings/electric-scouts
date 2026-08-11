import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ElectricityProvider, ElectricityPlan, AffiliateLink } from "@/api/supabaseEntities";
import { PROVIDER_SEED_DATA, PLAN_SEED_DATA, DEREGULATED_STATES } from "@/data/providerSeedData";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Plus, Pencil, Trash2, Search, Loader2, Building2, ExternalLink,
  Star, CheckCircle2, XCircle, Leaf,
  Zap, Building, AlertTriangle, Database,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const emptyProvider = {
  name: "", slug: "", description: "", logo_url: "", website_url: "",
  affiliate_url: "", supported_states: [], offer_categories: [],
  rating: 0, review_count: 0, features: [], is_active: true,
  has_affiliate_program: false, affiliate_program_details: "",
  phone: "", is_recommended: false,
};

export default function AdminProviders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAffiliate, setFilterAffiliate] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [form, setForm] = useState(emptyProvider);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [seedDialogOpen, setSeedDialogOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState("");
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  // Queries
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["admin-providers"],
    queryFn: () => ElectricityProvider.list(),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["admin-plans-all"],
    queryFn: () => ElectricityPlan.list(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => ElectricityProvider.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      toast({ title: "Provider created" });
      closeDialog();
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ElectricityProvider.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      toast({ title: "Provider updated" });
      closeDialog();
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => ElectricityProvider.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      toast({ title: "Provider deleted" });
      setDeleteConfirm(null);
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => ElectricityProvider.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-providers"] }),
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // Helpers
  const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProvider(null);
    setForm(emptyProvider);
  };

  const openEdit = (provider) => {
    setEditingProvider(provider);
    setForm({
      ...emptyProvider,
      ...provider,
      supported_states: provider.supported_states || [],
      offer_categories: provider.offer_categories || [],
      features: provider.features || [],
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...form,
      slug: form.slug || generateSlug(form.name),
      rating: parseFloat(form.rating) || 0,
      review_count: parseInt(form.review_count) || 0,
    };
    delete data.id;
    delete data.created_at;
    delete data.updated_at;
    if (editingProvider) {
      updateMutation.mutate({ id: editingProvider.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // ─── SEED ALL: Providers + Plans + Affiliate Links ─────────
  const handleSeedAll = async () => {
    setSeeding(true);
    try {
      // Step 1: Seed providers
      setSeedProgress("Seeding providers...");
      const existingSlugs = providers.map(p => p.slug).filter(Boolean);
      const newProviders = PROVIDER_SEED_DATA.filter(p => !existingSlugs.includes(p.slug));

      let addedProviders = 0;
      if (newProviders.length > 0) {
        for (let i = 0; i < newProviders.length; i += 10) {
          const chunk = newProviders.slice(i, i + 10);
          await ElectricityProvider.bulkCreate(chunk);
          addedProviders += chunk.length;
          setSeedProgress(`Seeded ${addedProviders}/${newProviders.length} providers...`);
        }
      }

      // Refresh providers list to get IDs
      await queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      const { data: allProviders } = await supabase.from("electricity_providers").select("id, name, slug, website_url, affiliate_url, has_affiliate_program").order("name");

      // Step 2: Seed plans
      setSeedProgress("Seeding plans...");
      const existingPlans = await ElectricityPlan.list();
      const existingPlanKeys = existingPlans.map(p => `${p.provider_name}|${p.plan_name}|${p.state || 'TX'}`);
      const newPlans = PLAN_SEED_DATA.filter(p => !existingPlanKeys.includes(`${p.provider_name}|${p.plan_name}|${p.state || 'TX'}`));

      let addedPlans = 0;
      if (newPlans.length > 0) {
        for (let i = 0; i < newPlans.length; i += 10) {
          const chunk = newPlans.slice(i, i + 10);
          await ElectricityPlan.bulkCreate(chunk);
          addedPlans += chunk.length;
          setSeedProgress(`Seeded ${addedPlans}/${newPlans.length} plans...`);
        }
      }

      // Step 3: Create affiliate links for providers that have affiliate programs
      setSeedProgress("Creating affiliate links...");
      const { data: existingLinks } = await supabase.from("affiliate_links").select("slug");
      const existingLinkSlugs = (existingLinks || []).map(l => l.slug);

      let addedLinks = 0;
      for (const provider of (allProviders || [])) {
        if (provider.has_affiliate_program && provider.affiliate_url) {
          const linkSlug = provider.slug || generateSlug(provider.name);
          if (!existingLinkSlugs.includes(linkSlug)) {
            try {
              await AffiliateLink.create({
                slug: linkSlug,
                target_url: provider.affiliate_url,
                label: `${provider.name} Affiliate`,
                provider_id: provider.id,
                is_active: true,
              });
              addedLinks++;
            } catch (e) {
              console.warn(`Skipped affiliate link for ${provider.name}:`, e.message);
            }
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-plans-all"] });
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-business-plans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-renewable-plans"] });

      toast({
        title: "Database seeded successfully",
        description: `Added ${addedProviders} providers, ${addedPlans} plans, ${addedLinks} affiliate links.`,
      });
      setSeedDialogOpen(false);
    } catch (err) {
      toast({ title: "Seed Error", description: err.message, variant: "destructive" });
    }
    setSeeding(false);
    setSeedProgress("");
  };

  // ─── CLEANUP: Remove all old data ─────────────────────────
  const handleCleanup = async () => {
    setCleaning(true);
    try {
      const { error: planErr } = await supabase.from("electricity_plans").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (planErr) throw planErr;
      const { error: linkErr } = await supabase.from("affiliate_links").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (linkErr) throw linkErr;
      const { error: provErr } = await supabase.from("electricity_providers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (provErr) throw provErr;

      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-plans-all"] });
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-business-plans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-renewable-plans"] });

      toast({ title: "Cleanup complete", description: "All old providers, plans, and affiliate links removed." });
      setCleanupDialogOpen(false);
    } catch (err) {
      toast({ title: "Cleanup Error", description: err.message, variant: "destructive" });
    }
    setCleaning(false);
  };

  // ─── Filtering ─────────────────────────────────────────────
  const filtered = providers.filter(p => {
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterState !== "all" && !(p.supported_states || []).includes(filterState)) return false;
    if (filterCategory !== "all" && !(p.offer_categories || []).includes(filterCategory)) return false;
    if (filterAffiliate === "yes" && !p.has_affiliate_program) return false;
    if (filterAffiliate === "no" && p.has_affiliate_program) return false;
    return true;
  });

  const activeCount = providers.filter(p => p.is_active).length;
  const affiliateCount = providers.filter(p => p.has_affiliate_program).length;
  const planCount = plans.length;
  const statesSet = new Set(providers.flatMap(p => p.supported_states || []));
  const residentialCount = providers.filter(p => (p.offer_categories || []).includes("residential")).length;
  const businessCount = providers.filter(p => (p.offer_categories || []).includes("business")).length;
  const renewableCount = providers.filter(p => (p.offer_categories || []).includes("renewable")).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Provider Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage electricity providers across all deregulated states</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setCleanupDialogOpen(true)} className="text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="w-4 h-4 mr-1" /> Clean All Data
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSeedDialogOpen(true)} className="text-blue-600 border-blue-200 hover:bg-blue-50">
            <Database className="w-4 h-4 mr-1" /> Seed All Data
          </Button>
          <Button size="sm" onClick={() => { setEditingProvider(null); setForm(emptyProvider); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Provider
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{providers.length}</p>
          <p className="text-xs text-gray-500">Total Providers</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          <p className="text-xs text-gray-500">Active</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{affiliateCount}</p>
          <p className="text-xs text-gray-500">With Affiliates</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{residentialCount}</p>
          <p className="text-xs text-gray-500">Residential</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{businessCount}</p>
          <p className="text-xs text-gray-500">Business</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{renewableCount}</p>
          <p className="text-xs text-gray-500">Renewable</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{statesSet.size}</p>
          <p className="text-xs text-gray-500">States</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg border">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search providers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterState} onValueChange={setFilterState}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {DEREGULATED_STATES.map(s => (
              <SelectItem key={s.code} value={s.code}>{s.code} - {s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="residential">Residential</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="renewable">Renewable</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAffiliate} onValueChange={setFilterAffiliate}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Affiliate" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            <SelectItem value="yes">Has Affiliate</SelectItem>
            <SelectItem value="no">No Affiliate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Provider Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No providers found</h3>
            <p className="text-sm text-gray-400 mt-1">
              {providers.length === 0 ? "Click 'Seed All Data' to populate the database with 47 providers and 80+ plans." : "Try adjusting your filters."}
            </p>
            {providers.length === 0 && (
              <Button className="mt-4" onClick={() => setSeedDialogOpen(true)}>
                <Database className="w-4 h-4 mr-2" /> Seed All Data
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[250px]">Provider</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>States</TableHead>
                <TableHead className="text-center">Plans</TableHead>
                <TableHead className="text-center">Rating</TableHead>
                <TableHead className="text-center">Affiliate</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(provider => {
                const providerPlans = plans.filter(p => p.provider_name === provider.name);
                return (
                  <TableRow key={provider.id} className={!provider.is_active ? "opacity-50 bg-gray-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                          {provider.name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-900 truncate">{provider.name}</span>
                            {provider.is_recommended && <Badge variant="outline" className="text-[10px] px-1 py-0 text-orange-600 border-orange-200">★</Badge>}
                          </div>
                          {provider.website_url && (
                            <a href={provider.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5">
                              <ExternalLink className="w-3 h-3" /> {provider.website_url.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(provider.offer_categories || []).map(cat => (
                          <Badge key={cat} variant="outline" className={`text-[10px] ${cat === 'residential' ? 'text-blue-600 border-blue-200' : cat === 'business' ? 'text-purple-600 border-purple-200' : 'text-green-600 border-green-200'}`}>
                            {cat === 'residential' ? <Zap className="w-3 h-3 mr-0.5" /> : cat === 'business' ? <Building className="w-3 h-3 mr-0.5" /> : <Leaf className="w-3 h-3 mr-0.5" />}
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-0.5">
                        {(provider.supported_states || []).slice(0, 4).map(s => (
                          <Badge key={s} variant="secondary" className="text-[10px] px-1">{s}</Badge>
                        ))}
                        {(provider.supported_states || []).length > 4 && (
                          <Badge variant="secondary" className="text-[10px] px-1">+{(provider.supported_states || []).length - 4}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium">{providerPlans.length}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm">{provider.rating || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {provider.has_affiliate_program ? (
                        <Badge className="bg-green-100 text-green-700 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-0.5" />Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-400 text-[10px]"><XCircle className="w-3 h-3 mr-0.5" />None</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={provider.is_active}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: provider.id, is_active: checked })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(provider)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setDeleteConfirm(provider)}>
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
      )}

      {/* ─── Add/Edit Provider Dialog ───────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProvider ? "Edit Provider" : "Add Provider"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Label>Provider Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} placeholder="e.g. TXU Energy" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Website URL</Label>
              <Input value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Affiliate URL</Label>
              <Input value={form.affiliate_url} onChange={e => setForm({ ...form, affiliate_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="1-800-..." />
            </div>
            <div>
              <Label>Rating (0-5)</Label>
              <Input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} />
            </div>
            <div>
              <Label>Review Count</Label>
              <Input type="number" value={form.review_count} onChange={e => setForm({ ...form, review_count: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Supported States</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {DEREGULATED_STATES.map(s => (
                  <button key={s.code} type="button"
                    className={`px-2 py-1 text-xs rounded border transition-colors ${(form.supported_states || []).includes(s.code) ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                    onClick={() => {
                      const states = form.supported_states || [];
                      setForm({ ...form, supported_states: states.includes(s.code) ? states.filter(x => x !== s.code) : [...states, s.code] });
                    }}
                  >{s.code}</button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <Label>Service Categories</Label>
              <div className="flex gap-2 mt-1">
                {["residential", "business", "renewable"].map(cat => (
                  <button key={cat} type="button"
                    className={`px-3 py-1.5 text-xs rounded border transition-colors ${(form.offer_categories || []).includes(cat) ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                    onClick={() => {
                      const cats = form.offer_categories || [];
                      setForm({ ...form, offer_categories: cats.includes(cat) ? cats.filter(x => x !== cat) : [...cats, cat] });
                    }}
                  >{cat.charAt(0).toUpperCase() + cat.slice(1)}</button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <Label>Features (comma-separated)</Label>
              <Input value={(form.features || []).join(", ")} onChange={e => setForm({ ...form, features: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="Feature 1, Feature 2, ..." />
            </div>
            <div className="col-span-2 flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_recommended} onCheckedChange={v => setForm({ ...form, is_recommended: v })} />
                <Label>Recommended</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.has_affiliate_program} onCheckedChange={v => setForm({ ...form, has_affiliate_program: v })} />
                <Label>Has Affiliate Program</Label>
              </div>
            </div>
            {form.has_affiliate_program && (
              <div className="col-span-2">
                <Label>Affiliate Program Details</Label>
                <Textarea value={form.affiliate_program_details} onChange={e => setForm({ ...form, affiliate_program_details: e.target.value })} rows={2} placeholder="Commission structure, sign-up URL, etc." />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingProvider ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm Dialog ──────────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Provider</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This will also remove all associated plans and affiliate links.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Seed All Dialog ────────────────────────────────── */}
      <Dialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Seed Provider Database</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm text-gray-600">
            <p>This will populate the database with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>{PROVIDER_SEED_DATA.length}</strong> electricity providers across 12 deregulated states</li>
              <li><strong>{PLAN_SEED_DATA.length}</strong> current electricity plans (residential, business, renewable)</li>
              <li>Affiliate links for providers with affiliate programs</li>
            </ul>
            <p className="text-xs text-gray-400">Only new entries will be added. Existing data won't be duplicated.</p>
            {seedProgress && <p className="text-blue-600 font-medium">{seedProgress}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeedDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSeedAll} disabled={seeding}>
              {seeding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {seeding ? "Seeding..." : "Seed All Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Cleanup Dialog ─────────────────────────────────── */}
      <Dialog open={cleanupDialogOpen} onOpenChange={setCleanupDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-red-600 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Clean All Data</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm text-gray-600">
            <p>This will permanently delete:</p>
            <ul className="list-disc pl-5 space-y-1 text-red-600">
              <li>All {providers.length} providers</li>
              <li>All {plans.length} plans</li>
              <li>All affiliate links</li>
            </ul>
            <p className="font-medium">This action cannot be undone. You can re-seed after cleanup.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCleanupDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleCleanup} disabled={cleaning}>
              {cleaning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {cleaning ? "Cleaning..." : "Delete All Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
