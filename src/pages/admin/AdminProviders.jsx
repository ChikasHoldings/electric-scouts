import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ElectricityProvider } from "@/api/supabaseEntities";
import { PROVIDER_SEED_DATA } from "@/data/providerSeedData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Building2,
  ExternalLink,
  Star,
  Link2,
  Download,
  ToggleLeft,
  ToggleRight,
  Filter,
  CheckCircle2,
  XCircle,
  Leaf,
  Briefcase,
  Home,
  Globe,
  Phone,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const DEREGULATED_STATES = [
  "TX", "IL", "OH", "PA", "NY", "NJ", "MD", "MA", "CT", "RI", "DE", "ME"
];

const OFFER_CATEGORIES = [
  { value: "residential", label: "Residential", icon: Home },
  { value: "business", label: "Business", icon: Briefcase },
  { value: "renewable", label: "Renewable", icon: Leaf },
];

const emptyProvider = {
  name: "",
  slug: "",
  description: "",
  logo_url: "",
  website_url: "",
  affiliate_url: "",
  phone: "",
  rating: 4.0,
  review_count: 0,
  supported_states: [],
  offer_categories: [],
  is_active: true,
  is_recommended: false,
  has_affiliate_program: false,
  affiliate_program_details: "",
  features: [],
};

export default function AdminProviders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAffiliate, setFilterAffiliate] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [form, setForm] = useState(emptyProvider);
  const [statesInput, setStatesInput] = useState("");
  const [featuresInput, setFeaturesInput] = useState("");
  const [categoriesInput, setCategoriesInput] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [seedDialogOpen, setSeedDialogOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["admin-providers"],
    queryFn: () => ElectricityProvider.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => ElectricityProvider.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-providers"]);
      toast({ title: "Provider created successfully" });
      closeDialog();
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ElectricityProvider.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-providers"]);
      toast({ title: "Provider updated successfully" });
      closeDialog();
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => ElectricityProvider.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-providers"]);
      toast({ title: "Provider deleted" });
      setDeleteConfirm(null);
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // Quick toggle for is_active
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => ElectricityProvider.update(id, { is_active }),
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries(["admin-providers"]);
      toast({ title: is_active ? "Provider activated" : "Provider deactivated" });
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // Quick toggle for is_recommended
  const toggleRecommendedMutation = useMutation({
    mutationFn: ({ id, is_recommended }) => ElectricityProvider.update(id, { is_recommended }),
    onSuccess: (_, { is_recommended }) => {
      queryClient.invalidateQueries(["admin-providers"]);
      toast({ title: is_recommended ? "Provider marked as recommended" : "Recommendation removed" });
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // Seed providers from built-in data
  const handleSeedProviders = async () => {
    setSeeding(true);
    try {
      const existingSlugs = providers.map(p => p.slug).filter(Boolean);
      const newProviders = PROVIDER_SEED_DATA.filter(p => !existingSlugs.includes(p.slug));
      
      if (newProviders.length === 0) {
        toast({ title: "All providers already exist", description: "No new providers to add." });
        setSeedDialogOpen(false);
        setSeeding(false);
        return;
      }

      // Batch insert in chunks of 10
      for (let i = 0; i < newProviders.length; i += 10) {
        const chunk = newProviders.slice(i, i + 10);
        await ElectricityProvider.bulkCreate(chunk);
      }

      queryClient.invalidateQueries(["admin-providers"]);
      toast({ 
        title: "Providers seeded successfully", 
        description: `Added ${newProviders.length} new providers.` 
      });
      setSeedDialogOpen(false);
    } catch (err) {
      toast({ title: "Seed Error", description: err.message, variant: "destructive" });
    }
    setSeeding(false);
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const openCreate = () => {
    setEditingProvider(null);
    setForm(emptyProvider);
    setStatesInput("");
    setFeaturesInput("");
    setCategoriesInput([]);
    setDialogOpen(true);
  };

  const openEdit = (provider) => {
    setEditingProvider(provider);
    setForm({ ...provider });
    setStatesInput(Array.isArray(provider.supported_states) ? provider.supported_states.join(", ") : "");
    setFeaturesInput(Array.isArray(provider.features) ? provider.features.join(", ") : "");
    setCategoriesInput(Array.isArray(provider.offer_categories) ? provider.offer_categories : []);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProvider(null);
    setForm(emptyProvider);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      slug: form.slug || generateSlug(form.name),
      supported_states: statesInput.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean),
      features: featuresInput.split(",").map((s) => s.trim()).filter(Boolean),
      offer_categories: categoriesInput,
      rating: parseFloat(form.rating) || 0,
      review_count: parseInt(form.review_count) || 0,
    };

    // Remove id and timestamps from data
    delete data.id;
    delete data.created_at;
    delete data.updated_at;

    if (editingProvider) {
      updateMutation.mutate({ id: editingProvider.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleCategory = (cat) => {
    setCategoriesInput(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Filtering
  const filtered = providers.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesState =
      filterState === "all" || (p.supported_states || []).includes(filterState);
    const matchesCategory =
      filterCategory === "all" || (p.offer_categories || []).includes(filterCategory);
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && p.is_active) ||
      (filterStatus === "inactive" && !p.is_active);
    const matchesAffiliate =
      filterAffiliate === "all" ||
      (filterAffiliate === "yes" && p.has_affiliate_program) ||
      (filterAffiliate === "no" && !p.has_affiliate_program);
    return matchesSearch && matchesState && matchesCategory && matchesStatus && matchesAffiliate;
  });

  const activeCount = providers.filter(p => p.is_active).length;
  const affiliateCount = providers.filter(p => p.has_affiliate_program).length;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{providers.length}</p>
                <p className="text-xs text-gray-500">Total Providers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Link2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{affiliateCount}</p>
                <p className="text-xs text-gray-500">With Affiliates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50">
                <Globe className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{DEREGULATED_STATES.length}</p>
                <p className="text-xs text-gray-500">States Covered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search providers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setSeedDialogOpen(true)}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Seed Providers
            </Button>
            <Button onClick={openCreate} className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Provider
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 font-medium">Filters:</span>
          </div>
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="w-[130px] h-9 text-sm">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {DEREGULATED_STATES.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[150px] h-9 text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {OFFER_CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px] h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAffiliate} onValueChange={setFilterAffiliate}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Affiliate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="yes">Has Affiliate</SelectItem>
              <SelectItem value="no">No Affiliate</SelectItem>
            </SelectContent>
          </Select>
          {(filterState !== "all" || filterCategory !== "all" || filterStatus !== "all" || filterAffiliate !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterState("all"); setFilterCategory("all"); setFilterStatus("all"); setFilterAffiliate("all"); }}
              className="text-xs text-gray-500"
            >
              Clear filters
            </Button>
          )}
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} of {providers.length} providers</span>
        </div>
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
              <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>{search ? "No providers match your search" : "No providers yet"}</p>
              {providers.length === 0 && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSeedDialogOpen(true)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Seed 50+ Providers
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Provider</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>States</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((provider) => (
                    <TableRow key={provider.id} className={!provider.is_active ? "opacity-50 bg-gray-50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {provider.logo_url ? (
                            <img
                              src={provider.logo_url}
                              alt={provider.name}
                              className="w-9 h-9 rounded-lg object-contain bg-gray-50 border border-gray-100 p-0.5"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-500">
                                {provider.name?.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-gray-900 truncate">{provider.name}</p>
                              {provider.is_recommended && (
                                <Badge variant="outline" className="text-[10px] border-yellow-300 text-yellow-700 bg-yellow-50 px-1.5 py-0">
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {provider.website_url && (
                                <a
                                  href={provider.website_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-gray-400 hover:text-[#0A5C8C] flex items-center gap-0.5"
                                >
                                  <ExternalLink className="w-3 h-3" /> Website
                                </a>
                              )}
                              {provider.phone && (
                                <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                  <Phone className="w-3 h-3" /> {provider.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(provider.offer_categories || []).map((cat) => {
                            const catInfo = OFFER_CATEGORIES.find(c => c.value === cat);
                            const colors = {
                              residential: "bg-blue-50 text-blue-700",
                              business: "bg-amber-50 text-amber-700",
                              renewable: "bg-green-50 text-green-700",
                            };
                            return (
                              <Badge key={cat} variant="outline" className={`text-[10px] px-1.5 py-0 ${colors[cat] || ""}`}>
                                {catInfo?.label || cat}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-0.5">
                          {(provider.supported_states || []).slice(0, 3).map((s) => (
                            <Badge key={s} variant="secondary" className="text-[10px] px-1 py-0">
                              {s}
                            </Badge>
                          ))}
                          {(provider.supported_states || []).length > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              +{provider.supported_states.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium">{provider.rating || "—"}</span>
                          {provider.review_count > 0 && (
                            <span className="text-[10px] text-gray-400">({provider.review_count.toLocaleString()})</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {provider.has_affiliate_program ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-700 font-medium">Yes</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircle className="w-4 h-4 text-gray-300" />
                            <span className="text-xs text-gray-400">No</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={provider.is_active}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({ id: provider.id, is_active: checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(provider)}
                            title="Edit provider"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteConfirm(provider)}
                            title="Delete provider"
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? "Edit Provider" : "Add New Provider"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    setForm({ 
                      ...form, 
                      name: e.target.value,
                      slug: editingProvider ? form.slug : generateSlug(e.target.value)
                    });
                  }}
                  required
                  placeholder="e.g., TXU Energy"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug || ""}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="auto-generated-from-name"
                  className="text-gray-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g., 1-800-555-0123"
                />
              </div>
              <div className="space-y-2">
                <Label>Rating (0-5)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Brief description of the provider..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  value={form.logo_url || ""}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  placeholder="/images/providers/name.png or https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input
                  value={form.website_url || ""}
                  onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Offer Categories */}
            <div className="space-y-2">
              <Label>Offer Categories</Label>
              <div className="flex flex-wrap gap-2">
                {OFFER_CATEGORIES.map((cat) => {
                  const isSelected = categoriesInput.includes(cat.value);
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => toggleCategory(cat.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${
                        isSelected
                          ? "bg-[#0A5C8C] text-white border-[#0A5C8C]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Supported States (comma-separated)</Label>
              <Input
                value={statesInput}
                onChange={(e) => setStatesInput(e.target.value)}
                placeholder="TX, IL, OH, PA, NY"
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {DEREGULATED_STATES.map(s => {
                  const isSelected = statesInput.toUpperCase().split(",").map(x => x.trim()).includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        const current = statesInput.split(",").map(x => x.trim()).filter(Boolean);
                        if (current.includes(s)) {
                          setStatesInput(current.filter(x => x !== s).join(", "));
                        } else {
                          setStatesInput([...current, s].join(", "));
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-xs border transition-all ${
                        isSelected
                          ? "bg-[#0A5C8C] text-white border-[#0A5C8C]"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features (comma-separated)</Label>
              <Input
                value={featuresInput}
                onChange={(e) => setFeaturesInput(e.target.value)}
                placeholder="No deposit, Free nights, 100% renewable"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Review Count</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.review_count}
                  onChange={(e) => setForm({ ...form, review_count: e.target.value })}
                />
              </div>
            </div>

            {/* Affiliate Section */}
            <div className="border rounded-lg p-4 space-y-3 bg-purple-50/50">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-purple-600" />
                <Label className="text-purple-800 font-semibold">Affiliate Program</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.has_affiliate_program || false}
                  onCheckedChange={(checked) => setForm({ ...form, has_affiliate_program: checked })}
                />
                <Label className="text-sm text-gray-600">This provider has an affiliate program</Label>
              </div>
              {form.has_affiliate_program && (
                <>
                  <div className="space-y-2">
                    <Label>Affiliate URL</Label>
                    <Input
                      value={form.affiliate_url || ""}
                      onChange={(e) => setForm({ ...form, affiliate_url: e.target.value })}
                      placeholder="https://affiliate.provider.com/ref=..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Affiliate Program Details</Label>
                    <Textarea
                      value={form.affiliate_program_details || ""}
                      onChange={(e) => setForm({ ...form, affiliate_program_details: e.target.value })}
                      rows={2}
                      placeholder="Commission structure, payout terms, etc."
                    />
                  </div>
                </>
              )}
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-3 border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-gray-500">Visible on the public website</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.is_recommended || false}
                  onCheckedChange={(checked) => setForm({ ...form, is_recommended: checked })}
                />
                <div>
                  <Label>Recommended</Label>
                  <p className="text-xs text-gray-500">Show "Recommended" badge on comparison results</p>
                </div>
              </div>
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
                {editingProvider ? "Save Changes" : "Create Provider"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Provider</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This
            action cannot be undone. All associated plans and affiliate links will also need to be removed.
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

      {/* Seed Providers Dialog */}
      <Dialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seed Provider Database</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This will populate the database with <strong>{PROVIDER_SEED_DATA.length} electricity providers</strong> across
              all 12 deregulated states. Existing providers (matched by slug) will not be duplicated.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-gray-700">Includes:</p>
              <ul className="text-xs text-gray-500 space-y-0.5 ml-4 list-disc">
                <li>20+ Texas providers (TXU, Reliant, Gexa, Green Mountain, etc.)</li>
                <li>30+ multi-state providers (Constellation, Direct Energy, Spark, etc.)</li>
                <li>{PROVIDER_SEED_DATA.filter(p => p.has_affiliate_program).length} providers with affiliate programs</li>
                <li>Complete details: descriptions, ratings, features, phone numbers</li>
              </ul>
            </div>
            {providers.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  You already have {providers.length} providers. Only new providers (not matching existing slugs) will be added.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeedDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSeedProviders}
              disabled={seeding}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {seeding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {seeding ? "Seeding..." : "Seed Providers"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
