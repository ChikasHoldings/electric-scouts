import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Article } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  FileText,
  Eye,
  EyeOff,
  Calendar,
  Image,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIES = [
  "Energy Savings",
  "Renewable Energy",
  "Market Updates",
  "How-To Guides",
  "Industry News",
  "Tips & Tricks",
  "Business Energy",
  "Texas Energy",
  "Deregulation",
  "General",
];

const emptyArticle = {
  title: "",
  slug: "",
  category: "General",
  excerpt: "",
  content: "",
  featured_image: "",
  author_name: "ElectricScouts Team",
  published: false,
  tags: [],
  meta_description: "",
  read_time: "5 min",
};

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function AdminArticles() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [form, setForm] = useState(emptyArticle);
  const [tagsInput, setTagsInput] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: () => Article.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => Article.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-articles"]);
      toast({ title: "Article created successfully" });
      closeDialog();
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => Article.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-articles"]);
      toast({ title: "Article updated successfully" });
      closeDialog();
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Article.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-articles"]);
      toast({ title: "Article deleted" });
      setDeleteConfirm(null);
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setEditingArticle(null);
    setForm(emptyArticle);
    setTagsInput("");
    setDialogOpen(true);
  };

  const openEdit = (article) => {
    setEditingArticle(article);
    setForm({ ...article });
    setTagsInput(Array.isArray(article.tags) ? article.tags.join(", ") : "");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingArticle(null);
    setForm(emptyArticle);
  };

  const handleTitleChange = (title) => {
    setForm({
      ...form,
      title,
      slug: editingArticle ? form.slug : generateSlug(title),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      read_time: (parseInt(form.read_time) || 5) + " min",
      slug: form.slug || generateSlug(form.title),
    };

    // Remove fields that shouldn't be sent
    delete data.id;
    delete data.created_date;
    delete data.updated_date;
    delete data.meta_title;

    if (editingArticle) {
      updateMutation.mutate({ id: editingArticle.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const togglePublish = async (article) => {
    try {
      await Article.update(article.id, { published: !article.published });
      queryClient.invalidateQueries(["admin-articles"]);
      toast({
        title: article.published ? "Article unpublished" : "Article published",
      });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const filtered = articles.filter((a) => {
    const matchesSearch =
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || a.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && a.published) ||
      (filterStatus === "draft" && !a.published);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openCreate} className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Article
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
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>{search ? "No articles match your search" : "No articles yet"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <div className="flex items-center gap-3 max-w-[300px]">
                          {article.featured_image ? (
                            <img
                              src={article.featured_image}
                              alt={`${article.title} featured image`}
                              className="w-12 h-8 rounded object-cover bg-gray-100 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Image className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {article.title}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              /{article.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{article.category || "General"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {article.author_name || "—"}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => togglePublish(article)}
                          className="cursor-pointer"
                        >
                          <Badge
                            variant={article.published ? "default" : "secondary"}
                            className="cursor-pointer"
                          >
                            {article.published ? (
                              <><Eye className="w-3 h-3 mr-1" /> Published</>
                            ) : (
                              <><EyeOff className="w-3 h-3 mr-1" /> Draft</>
                            )}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {article.created_date
                            ? new Date(article.created_date).toLocaleDateString()
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(article)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteConfirm(article)}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? "Edit Article" : "New Article"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                placeholder="Article title..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="auto-generated-from-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category || "General"}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea
                value={form.excerpt || ""}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={2}
                placeholder="Brief summary for previews and SEO..."
              />
            </div>

            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={form.content || ""}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={12}
                required
                placeholder="Article content (supports HTML)..."
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Featured Image URL</Label>
                <Input
                  value={form.featured_image || ""}
                  onChange={(e) => setForm({ ...form, featured_image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input
                  value={form.author_name || ""}
                  onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                  placeholder="Electric Scouts Team"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reading Time (minutes)</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.read_time || ""}
                  onChange={(e) => setForm({ ...form, read_time: e.target.value })}
                  placeholder="5"
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="solar, savings, texas"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Meta Description (SEO)</Label>
              <Textarea
                value={form.meta_description || ""}
                onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                rows={2}
                placeholder="Custom description for search engines..."
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.published}
                onCheckedChange={(checked) => setForm({ ...form, published: checked })}
              />
              <Label>Publish immediately</Label>
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
                {editingArticle ? "Save Changes" : "Create Article"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{deleteConfirm?.title}</strong>?
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
