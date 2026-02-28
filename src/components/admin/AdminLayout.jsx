import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Zap,
  MessageSquare,
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
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Providers", path: "/admin/providers", icon: Building2 },
  { label: "Plans", path: "/admin/plans", icon: Zap },
  { label: "Business Plans", path: "/admin/business-plans", icon: Building },
  { label: "Renewable Plans", path: "/admin/renewable-plans", icon: Leaf },
  { label: "Articles", path: "/admin/articles", icon: FileText },
  { label: "Quotes", path: "/admin/quotes", icon: MessageSquare },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Affiliates", path: "/admin/affiliates", icon: Link2 },
  { label: "Concierge", path: "/admin/concierge", icon: Home },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }) {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout(false);
    navigate("/");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAvatarDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setAvatarDropdownOpen(false);
    setSidebarOpen(false);
  }, [location.pathname]);

  const currentPage = navItems.find(
    (item) =>
      location.pathname === item.path ||
      (item.path !== "/admin" && location.pathname.startsWith(item.path))
  ) || navItems[0];

  const initials = (profile?.full_name || user?.email || "A")
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold"
          >
            {initials}
          </button>
          {avatarDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[60]">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{profile?.full_name || "Admin"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
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
          )}
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
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#0A2540] text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo area */}
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/images/logo-footer.png"
              alt="Electric Scouts"
              className="h-8 w-auto"
            />
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
              Admin Panel
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/admin" && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User info & logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all mb-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Site</span>
          </Link>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
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
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Logout"
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
            <h1 className="text-xl font-bold text-gray-900">{currentPage.label}</h1>
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
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{profile?.full_name || "Admin"}</p>
                  <p className="text-xs text-gray-500 leading-tight">{profile?.role || "admin"}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${avatarDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {avatarDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[60]">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{profile?.full_name || "Admin"}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
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
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
