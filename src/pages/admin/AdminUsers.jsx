import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Profile } from "@/api/supabaseEntities";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Search,
  Loader2,
  Users,
  Shield,
  User,
  Mail,
  Calendar,
  Pencil,
  AlertTriangle,
  UserPlus,
  Eye,
  EyeOff,
  Check,
  X,
  Key,
  FileEdit,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ROLE_CONFIG = {
  admin: {
    label: "Admin",
    color: "bg-orange-100 text-orange-700",
    icon: Shield,
    description: "Full access to all features and settings",
  },
  editor: {
    label: "Editor",
    color: "bg-blue-100 text-blue-700",
    icon: FileEdit,
    description: "Can manage content: articles, plans, and providers",
  },
  viewer: {
    label: "Viewer",
    color: "bg-gray-100 text-gray-700",
    icon: Eye,
    description: "Read-only access to the dashboard",
  },
  user: {
    label: "User",
    color: "bg-gray-100 text-gray-600",
    icon: User,
    description: "Regular website user",
  },
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Edit user state
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: "", role: "user" });

  // Create user state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    full_name: "",
    password: "",
    confirmPassword: "",
    role: "editor",
  });
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => Profile.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => Profile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      toast({ title: "User updated successfully" });
      setEditingUser(null);
    },
    onError: (err) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name || "",
      role: user.role || "user",
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    updateMutation.mutate({ id: editingUser.id, data: editForm });
  };

  // Password validation for create form
  const passwordChecks = {
    length: createForm.password.length >= 8,
    uppercase: /[A-Z]/.test(createForm.password),
    lowercase: /[a-z]/.test(createForm.password),
    number: /\d/.test(createForm.password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(createForm.password),
    match:
      createForm.password &&
      createForm.confirmPassword &&
      createForm.password === createForm.confirmPassword,
  };

  const allPasswordChecksPass = Object.values(passwordChecks).every(Boolean);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError("");

    if (
      !createForm.email ||
      !createForm.full_name ||
      !createForm.password ||
      !createForm.role
    ) {
      setCreateError("All fields are required.");
      return;
    }

    if (!allPasswordChecksPass) {
      setCreateError("Please ensure all password requirements are met.");
      return;
    }

    setCreating(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setCreateError("Session expired. Please log in again.");
        return;
      }

      const resp = await fetch("/api/admin/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "create-user",
          email: createForm.email.trim(),
          full_name: createForm.full_name.trim(),
          password: createForm.password,
          role: createForm.role,
        }),
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        queryClient.invalidateQueries(["admin-users"]);
        toast({
          title: "User created successfully",
          description: data.message,
        });
        setShowCreateDialog(false);
        setCreateForm({
          email: "",
          full_name: "",
          password: "",
          confirmPassword: "",
          role: "editor",
        });
      } else {
        setCreateError(data.error || "Failed to create user.");
      }
    } catch (err) {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter((u) => u.role === "admin").length;
  const editorCount = users.filter((u) => u.role === "editor").length;
  const userCount = users.filter(
    (u) => u.role === "user" || u.role === "viewer" || !u.role
  ).length;

  const PasswordCheck = ({ passed, label }) => (
    <div className="flex items-center gap-1.5 text-xs">
      {passed ? (
        <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
      ) : (
        <X className="w-3 h-3 text-gray-300 flex-shrink-0" />
      )}
      <span className={passed ? "text-green-700" : "text-gray-500"}>
        {label}
      </span>
    </div>
  );

  const getRoleConfig = (role) => ROLE_CONFIG[role] || ROLE_CONFIG.user;

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage admin users and assign roles.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Create New User
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-slate-100">
              <Users className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-100">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{adminCount}</p>
              <p className="text-sm text-gray-500">Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <FileEdit className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{editorCount}</p>
              <p className="text-sm text-gray-500">Editors</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
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
              <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>
                {search ? "No users match your search" : "No users yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((profile) => {
                    const roleConf = getRoleConfig(profile.role);
                    const RoleIcon = roleConf.icon;
                    return (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0A5C8C] to-[#0A2540] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {(profile.full_name || profile.email || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {profile.full_name || "Unnamed User"}
                              </p>
                              {profile.id === currentUser?.id && (
                                <span className="text-xs text-[#0A5C8C]">
                                  (You)
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {profile.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`${roleConf.color} border-0`}
                          >
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {roleConf.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {profile.created_at
                              ? new Date(
                                  profile.created_at
                                ).toLocaleDateString()
                              : "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(profile)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A5C8C] to-[#0A2540] flex items-center justify-center text-white font-bold">
                  {(editingUser.full_name || editingUser.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{editingUser.email}</p>
                  <p className="text-xs text-gray-500">
                    ID: {editingUser.id?.slice(0, 8)}...
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, full_name: e.target.value })
                  }
                  placeholder="User's full name"
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, role: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-orange-600" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="editor">
                      <div className="flex items-center gap-2">
                        <FileEdit className="w-3.5 h-3.5 text-blue-600" />
                        Editor
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-gray-600" />
                        Viewer
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-500" />
                        User
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {editForm.role && (
                  <p className="text-xs text-gray-500">
                    {getRoleConfig(editForm.role).description}
                  </p>
                )}
              </div>

              {editingUser.id === currentUser?.id &&
                editForm.role !== "admin" && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Warning: Removing your own admin role will lock you out
                      of this panel.
                    </span>
                  </div>
                )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white"
                >
                  {updateMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Create New User Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setCreateError("");
            setCreateForm({
              email: "",
              full_name: "",
              password: "",
              confirmPassword: "",
              role: "editor",
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#0A5C8C]" />
              Create New User
            </DialogTitle>
            <DialogDescription>
              Create a new admin, editor, or viewer account. The user will
              receive a welcome email with login instructions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4">
            {createError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-name">Full Name</Label>
                <Input
                  id="create-name"
                  value={createForm.full_name}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      full_name: e.target.value,
                    })
                  }
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email Address</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  placeholder="john@electricscouts.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) =>
                  setCreateForm({ ...createForm, role: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-orange-600" />
                      Admin — Full access
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <FileEdit className="w-3.5 h-3.5 text-blue-600" />
                      Editor — Manage content
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-gray-600" />
                      Viewer — Read-only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {createForm.role && (
                <p className="text-xs text-gray-500">
                  {getRoleConfig(createForm.role).description}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-password">Password</Label>
                <div className="relative">
                  <Input
                    id="create-password"
                    type={showCreatePassword ? "text" : "password"}
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        password: e.target.value,
                      })
                    }
                    placeholder="Min 8 chars"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCreatePassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-confirm">Confirm Password</Label>
                <Input
                  id="create-confirm"
                  type="password"
                  value={createForm.confirmPassword}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Re-enter password"
                  required
                />
              </div>
            </div>

            {/* Password Requirements */}
            {createForm.password && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="grid grid-cols-2 gap-1">
                  <PasswordCheck
                    passed={passwordChecks.length}
                    label="8+ characters"
                  />
                  <PasswordCheck
                    passed={passwordChecks.uppercase}
                    label="Uppercase"
                  />
                  <PasswordCheck
                    passed={passwordChecks.lowercase}
                    label="Lowercase"
                  />
                  <PasswordCheck
                    passed={passwordChecks.number}
                    label="Number"
                  />
                  <PasswordCheck
                    passed={passwordChecks.special}
                    label="Special char"
                  />
                  <PasswordCheck
                    passed={passwordChecks.match}
                    label="Passwords match"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  creating ||
                  !createForm.email ||
                  !createForm.full_name ||
                  !allPasswordChecksPass
                }
                className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
