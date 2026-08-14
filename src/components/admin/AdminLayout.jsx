import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { groupedNavForRole, navItemForPath, ROLE_LABELS } from "@/lib/adminNav";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Zap,
  Users,
  LogOut,
  Menu,
  X,
  Shield,
  ExternalLink,
  Link2,
  TrendingUp,
  Handshake,
  Settings,
  User,
  ChevronDown,
  Home,
  UserCheck,
  Gauge,
} from "lucide-react";

/**
 * Icon names from the nav registry to the components that draw them.
 *
 * The registry stays import-free so the route guard and the tests can read it
 * without React; this map is the one place that needs both.
 */
const NAV_ICONS = {
  dashboard: LayoutDashboard,
  leads: UserCheck,
  concierge: Home,
  revenue: TrendingUp,
  buyers: Handshake,
  affiliates: Link2,
  providers: Building2,
  plans: Zap,
  tariffs: Gauge,
  articles: FileText,
  users: Users,
  settings: Settings,
};

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

  const userRole = profile?.role || "viewer";
  const navGroups = groupedNavForRole(userRole);
  const currentPage = navItemForPath(location.pathname);

  // The panel's screens are the kind an operator keeps several of open at once,
  // and every tab used to be titled the same thing.
  useEffect(() => {
    const previous = document.title;
    document.title = currentPage
      ? `${currentPage.label} · Electric Scouts Admin`
      : "Electric Scouts Admin";
    return () => { document.title = previous; };
  }, [currentPage]);

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
        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
          {ROLE_LABELS[userRole] || userRole}
        </span>
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
      {/* Mobile header — carries the page name, because the mobile viewport has
          no sidebar and no top bar to carry it. It used to read "Admin Panel"
          on all twelve screens. */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-3 py-3 flex items-center gap-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 -ml-1 rounded-lg hover:bg-gray-100 flex-shrink-0"
          aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 leading-tight truncate">
            {currentPage?.label || "Admin"}
          </p>
          <p className="text-[11px] text-gray-500 leading-tight truncate">
            Electric Scouts Admin
          </p>
        </div>
        <div className="relative flex-shrink-0" ref={mobileDropdownRef}>
          <button
            onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold"
            aria-label="Account menu"
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
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-[#0A2540] text-white flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo area */}
        <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
            <picture>
              <source srcSet="/images/logo-footer.webp" type="image/webp" />
              <img
                src="/images/logo-footer.png"
                alt="Electric Scouts"
                className="h-8 w-auto"
                width="155"
                height="32"
              />
            </picture>
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">
              Admin Panel
            </span>
          </div>
        </div>

        {/* Navigation — grouped, and filtered by role */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin sections">
          {navGroups.map((group, groupIndex) => (
            <div key={group.id} className={groupIndex > 0 ? "mt-5" : ""}>
              {group.label && (
                <p className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentPage?.path === item.path;
                  const Icon = NAV_ICONS[item.icon] || LayoutDashboard;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* No account footer here. Who you are signed in as, "View Site" and
            "Sign Out" all live in the avatar menu, which the desktop top bar
            and the mobile header both render — the sidebar was repeating them
            a second time. The nav is the sidebar's whole job. */}
      </aside>

      {/* Main content */}
      <main className="lg:ml-72 min-h-screen pt-[60px] lg:pt-0">
        {/* Top bar — the single place a screen is named. Pages below it render
            their live counts and actions, never their own title. */}
        <div className="hidden lg:flex items-center justify-between gap-6 bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-30">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {currentPage?.label || "Admin"}
            </h1>
            <p className="text-sm text-gray-500 truncate">
              {currentPage?.description || "Electric Scouts Administration"}
            </p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
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
                  <p className="text-xs text-gray-500 leading-tight">{ROLE_LABELS[userRole] || userRole}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${avatarDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {avatarDropdownOpen && <AvatarDropdownMenu />}
            </div>
          </div>
        </div>

        {/* Page content. Every screen gets the same gutter and the same maximum
            column, so the content does not resize as you move between them. */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1360px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
