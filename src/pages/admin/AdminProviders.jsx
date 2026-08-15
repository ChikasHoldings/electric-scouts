import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ElectricityProvider, ElectricityPlan } from "@/api/supabaseEntities";
import { getAllDeregulatedStates } from "@/components/compare/stateData";
import { readExclusions, writeExclusions, editableStates, parsePrefixes } from "@/lib/serviceAreas";
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
  Zap, Building, AlertTriangle, Link2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import LogoUpload from "@/components/admin/LogoUpload";
import { AffiliateLink } from "@/api/supabaseEntities";
import {
  providerReadiness, catalogReadiness, toggleWarning, STATUS_LABELS,
} from "@/lib/providerReadiness";
import AdminPage, { AdminPageBar } from "@/components/admin/AdminPage";

const emptyProvider = {
  name: "", slug: "", description: "", logo_url: "", website_url: "",
  affiliate_url: "", supported_states: [], offer_categories: [],
  rating: 0, review_count: 0, features: [], is_active: true,
  has_affiliate_program: false, affiliate_program_details: "",
  phone: "", is_recommended: false,
  // Left unset: providerAvailability.jsx already reads an absent service_areas
  // as "serves every ZIP in the supported states", which is the right default
  // for a provider whose exclusions nobody has entered yet.
  service_areas: null,
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
  const [serviceExclusions, setServiceExclusions] = useState({});
  // A switch that would publish a broken page, or unpublish a working one,
  // parks here until the operator has read what it costs.
  const [pendingToggle, setPendingToggle] = useState(null);

  // Queries
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["admin-providers"],
    queryFn: () => ElectricityProvider.list(),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["admin-plans-all"],
    queryFn: () => ElectricityPlan.list(),
  });

  // Read so the Affiliate column can report a real destination rather than the
  // has_affiliate_program flag, which is a note and not a link.
  const { data: affiliateLinks = [] } = useQuery({
    queryKey: ["admin-affiliate-links"],
    queryFn: () => AffiliateLink.list(),
    placeholderData: [],
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
    onSuccess: (_data, { name, is_active }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      toast({
        title: is_active ? `${name} is live` : `${name} is off the site`,
        description: is_active
          ? "Its page and plans are available to visitors now."
          : "Its page and plans are no longer shown.",
      });
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  /**
   * Flip a provider, after saying what the flip does.
   *
   * Publishing a supplier with nothing to sell, and unpublishing one that is
   * ranking, are both a click away from each other on this screen and neither
   * used to say anything. Unremarkable changes still go straight through.
   */
  const requestToggle = (provider, nextActive) => {
    const readiness = providerReadiness(provider, plans, affiliateLinks);
    const warning = toggleWarning(provider, readiness, nextActive);
    if (warning) {
      setPendingToggle({ provider, nextActive, warning });
      return;
    }
    toggleMutation.mutate({ id: provider.id, is_active: nextActive, name: provider.name });
  };

  // Helpers
  const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProvider(null);
    setForm(emptyProvider);
    setServiceExclusions({});
  };

  const openEdit = (provider) => {
    setEditingProvider(provider);
    setForm({
      ...emptyProvider,
      ...provider,
      supported_states: provider.supported_states || [],
      offer_categories: provider.offer_categories || [],
      features: provider.features || [],
      // Kept verbatim. 30 providers store `state_config` and 8 store
      // `utility_territories` and `notes`; rebuilding this object from the
      // fields on screen would drop whichever the editor does not surface.
      service_areas: provider.service_areas || null,
    });
    setServiceExclusions(readExclusions(provider));
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...form,
      slug: form.slug || generateSlug(form.name),
      rating: parseFloat(form.rating) || 0,
      review_count: parseInt(form.review_count) || 0,
      service_areas: writeExclusions(form.service_areas, serviceExclusions),
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

  // Which states get their own exclusion row. Driven by the form's current
  // selection so ticking a new state immediately offers a field for it, and
  // only for providers stored in (or headed for) the multi-state shape.
  const serviceStates = form.service_areas?.state_config || (form.supported_states || []).length > 1
    ? [...new Set([...editableStates({ ...form, service_areas: form.service_areas }), ...(form.supported_states || [])])].sort()
    : [];

  // ─── Filtering ─────────────────────────────────────────────
  const filtered = providers.filter(p => {
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterState !== "all" && !(p.supported_states || []).includes(filterState)) return false;
    if (filterCategory !== "all" && !(p.offer_categories || []).includes(filterCategory)) return false;
    if (filterAffiliate === "yes" && !p.has_affiliate_program) return false;
    if (filterAffiliate === "no" && p.has_affiliate_program) return false;
    return true;
  });

  const catalog = catalogReadiness(providers, plans, affiliateLinks);
  const activeCount = providers.filter(p => p.is_active).length;
  const affiliateCount = providers.filter(p => p.has_affiliate_program).length;
  const planCount = plans.length;
  const statesSet = new Set(providers.flatMap(p => p.supported_states || []));
  const residentialCount = providers.filter(p => (p.offer_categories || []).includes("residential")).length;
  const businessCount = providers.filter(p => (p.offer_categories || []).includes("business")).length;
  const renewableCount = providers.filter(p => (p.offer_categories || []).includes("renewable")).length;

  return (
    <AdminPage>
      <AdminPageBar
        summary={
          <>
            {providers.length} providers · {catalog.live} live · {catalog.ready} ready to
            switch on · {statesSet.size} {statesSet.size === 1 ? "market" : "markets"}
            {catalog.incomplete > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                {catalog.incomplete} live but incomplete
              </span>
            )}
          </>
        }
        actions={
          <Button size="sm" onClick={() => { setEditingProvider(null); setForm(emptyProvider); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Provider
          </Button>
        }
      />

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
            {getAllDeregulatedStates().map(s => (
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
              {providers.length === 0
                ? "Add your first provider to start building the catalog."
                : "Try adjusting your filters."}
            </p>
            {providers.length === 0 && (
              <Button
                className="mt-4"
                onClick={() => { setEditingProvider(null); setForm(emptyProvider); setDialogOpen(true); }}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Provider
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
                <TableHead className="text-center">Sign-up link</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Live</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(provider => {
                const readiness = providerReadiness(provider, plans, affiliateLinks);
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
                      {/* Active out of total. The bare total is what made a
                          supplier with nine switched-off plans look ready. */}
                      <span className={`text-sm font-medium ${readiness.activePlans === 0 ? "text-red-600" : "text-gray-900"}`}>
                        {readiness.activePlans}
                      </span>
                      {readiness.totalPlans !== readiness.activePlans && (
                        <span className="text-xs text-gray-400"> / {readiness.totalPlans}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm">{provider.rating || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {/* Where the sign-up button actually sends a customer —
                          not the has_affiliate_program flag, which is a note to
                          self and was green on suppliers with no URL at all. */}
                      {readiness.outbound.kind === "tracked" ? (
                        <Badge className="bg-green-100 text-green-700 text-[10px]" title={readiness.outbound.url}>
                          <Link2 className="w-3 h-3 mr-0.5" />Tracked
                        </Badge>
                      ) : readiness.outbound.kind === "affiliate" ? (
                        <Badge className="bg-blue-100 text-blue-700 text-[10px]" title={readiness.outbound.url}>
                          <CheckCircle2 className="w-3 h-3 mr-0.5" />Affiliate
                        </Badge>
                      ) : readiness.outbound.kind === "website" ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-200 text-[10px]" title={readiness.outbound.url}>
                          Website only
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-500 border-red-200 text-[10px]">
                          <XCircle className="w-3 h-3 mr-0.5" />None
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* What switching this row would do, in advance. */}
                      <div className="min-w-[150px]">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            readiness.status === "live" ? "text-green-700 border-green-200 bg-green-50"
                            : readiness.status === "incomplete" ? "text-amber-700 border-amber-200 bg-amber-50"
                            : readiness.status === "ready" ? "text-blue-700 border-blue-200 bg-blue-50"
                            : "text-gray-500 border-gray-200"
                          }`}
                        >
                          {readiness.status === "incomplete" && <AlertTriangle className="w-3 h-3 mr-0.5" />}
                          {STATUS_LABELS[readiness.status]}
                        </Badge>
                        {readiness.blockers.length > 0 && (
                          <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                            {readiness.blockers[0]}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={provider.is_active}
                        aria-label={`${provider.is_active ? "Take" : "Put"} ${provider.name} ${provider.is_active ? "off" : "on"} the site`}
                        onCheckedChange={(checked) => requestToggle(provider, checked)}
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
              <Label>Provider logo</Label>
              <LogoUpload
                providerName={form.name}
                value={form.logo_url}
                onChange={(url) => setForm({ ...form, logo_url: url })}
              />
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
                {getAllDeregulatedStates().map(s => (
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
            {/* Service coverage — the exclusions the public availability
                check actually reads. It is a DENY-list: a prefix listed here
                is a ZIP the provider does NOT serve. Everything else in
                service_areas (utility territories, notes, per-state settings
                this form does not surface) is carried through untouched. */}
            <div className="col-span-2 rounded-lg border border-gray-200 bg-gray-50/60 p-4 space-y-3">
              <div>
                <Label>Service coverage</Label>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  By default a provider serves every ZIP in the states selected
                  above. List the three-digit ZIP prefixes it does <strong>not</strong> serve.
                  Leave blank for full coverage.
                </p>
              </div>

              {serviceStates.length === 0 ? (
                <div>
                  <Label className="text-xs">Excluded ZIP prefixes</Label>
                  <Input
                    value={(serviceExclusions.__all__ || []).join(", ")}
                    onChange={(e) => setServiceExclusions({
                      ...serviceExclusions,
                      __all__: parsePrefixes(e.target.value),
                    })}
                    placeholder="770, 750"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {serviceStates.map((code) => (
                    <div key={code} className="flex items-center gap-3">
                      <span className="w-9 flex-shrink-0 text-xs font-semibold text-gray-600">{code}</span>
                      <Input
                        value={(serviceExclusions[code] || []).join(", ")}
                        onChange={(e) => setServiceExclusions({
                          ...serviceExclusions,
                          [code]: parsePrefixes(e.target.value),
                        })}
                        placeholder="Excluded ZIP prefixes — blank serves the whole state"
                      />
                    </div>
                  ))}
                </div>
              )}
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

      {/* ─── Publish / Unpublish Confirm ─────────────────────────
          Only opens when the flip has a consequence worth reading: publishing a
          supplier with nothing to sell, or taking down one that is currently
          ranking. Everything else flips on the click. */}
      <Dialog open={!!pendingToggle} onOpenChange={() => setPendingToggle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" aria-hidden="true" />
              {pendingToggle?.warning.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 leading-relaxed">
            {pendingToggle?.warning.body}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingToggle(null)}>Cancel</Button>
            <Button
              onClick={() => {
                toggleMutation.mutate({
                  id: pendingToggle.provider.id,
                  is_active: pendingToggle.nextActive,
                  name: pendingToggle.provider.name,
                });
                setPendingToggle(null);
              }}
              className={pendingToggle?.nextActive ? "" : "bg-red-600 hover:bg-red-700 text-white"}
            >
              {pendingToggle?.warning.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AdminPage>
  );
}
