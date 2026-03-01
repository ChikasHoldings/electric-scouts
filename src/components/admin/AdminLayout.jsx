import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Zap,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  ExternalLink,
  Link2,
  Settings,
  User,
  ChevronDown,
  Building,
  Leaf,
  Home,
  UserCheck,
} from "lucide-react";

// Sidebar nav items ordered by business importance.
// "admin" = full access, "editor" = content management, "viewer" = read-only dashboard
const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, roles: ["admin", "editor", "viewer"] },
  { label: "Leads", path: "/admin/leads", icon: UserCheck, roles: ["admin", "editor"] },
  { label: "Affiliates", path: "/admin/affiliates", icon: Link2, roles: ["admin"] },
  { label: "Providers", path: "/admin/providers", icon: Building2, roles: ["admin", "editor"] },
  { label: "Plans", path: "/admin/plans", icon: Zap, roles: ["admin", "editor"] },
  { label: "Business Plans", path: "/admin/business-plans", icon: Building, roles: ["admin", "editor"] },
  { label: "Renewable Plans", path: "/admin/renewable-plans", icon: Leaf, roles: ["admin", "editor"] },
  { label: "Concierge", path: "/admin/concierge", icon: Home, roles: ["admin", "editor"] },
  { label: "Articles", path: "/admin/articles", icon: FileText, roles: ["admin", "editor"] },
  { label: "Users", path: "/admin/users", icon: Users, roles: ["admin"] },
  { label: "Settings", path: "/admin/settings", icon: Settings, roles: ["admin", "editor", "viewer"] },
];

export default function AdminLayout({ children }) {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const desktopDropdownRef = useRef(null);
  const mobileDropdownRef = useRef(null);

  const handleLogout = async () => {
    setAvatarDropdownOpen(false);
    await logout(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const isOutsideDesktop = !desktopDropdownRef.current || !desktopDropdownRef.current.contains(e.target);
      const isOutsideMobile = !mobileDropdownRef.current || !mobileDropdownRef.current.contains(e.target);
      if (isOutsideDesktop && isOutsideMobile) {
        setAvatarDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown and sidebar on route change
  useEffect(() => {
    setAvatarDropdownOpen(false);
    setSidebarOpen(false);
  }, [location.pathname]);

  // Filter nav items based on user role
  const userRole = profile?.role || "viewer";
  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole));

  const currentPage = filteredNavItems.find(
    (item) =>
      location.pathname === item.path ||
      (item.path !== "/admin" && location.pathname.startsWith(item.path))
  ) || filteredNavItems[0];

  const initials = (profile?.full_name || user?.email || "A")
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const AvatarDropdownMenu = () => (
    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[60]">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900 truncate">{profile?.full_name || "Admin"}</p>
        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full capitalize">{userRole}</span>
      </div>
      <Link to="/admin/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
        <User className="w-4 h-4" /> Profile
      </Link>
      <Link to="/admin/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
        <Settings className="w-4 h-4" /> Settings
      </Link>
      <Link to="/" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
        <ExternalLink className="w-4 h-4" /> View Site
      </Link>
      <div className="border-t border-gray-100 mt-1 pt-1">
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#0A5C8C]" />
          <span className="font-bold text-gray-900">Admin Panel</span>
        </div>
        {/* Mobile avatar */}
        <div className="relative" ref={mobileDropdownRef}>
          <button
            onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold"
          >
            {initials}
          </button>
          {avatarDropdownOpen && <AvatarDropdownMenu />}
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#0A2540] text-white flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo area */}
        <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/images/logo-footer.png"
              alt="Electric Scouts"
              className="h-8 w-auto"
            />
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">
              Admin Panel
            </span>
          </div>
        </div>

        {/* Navigation — filtered by role */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {filteredNavItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/admin" && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* User info & logout — pinned to bottom */}
        <div className="flex-shrink-0 p-3 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all mb-2"
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            <span>View Site</span>
          </Link>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile?.full_name || "Admin"}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        {/* Top bar with avatar dropdown */}
        <div className="hidden lg:flex items-center justify-between bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{currentPage?.label || "Admin"}</h1>
            <p className="text-sm text-gray-500">
              Electric Scouts Administration
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-[#0A5C8C] flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              View Site
            </Link>
            {/* Profile Avatar Dropdown */}
            <div className="relative" ref={desktopDropdownRef}>
              <button
                onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{profile?.full_name || "Admin"}</p>
                  <p className="text-xs text-gray-500 leading-tight capitalize">{userRole}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${avatarDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {avatarDropdownOpen && <AvatarDropdownMenu />}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
