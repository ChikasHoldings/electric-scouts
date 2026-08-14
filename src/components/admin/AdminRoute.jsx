import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { ADMIN_ROLES, canAccessPath, landingPathForRole, ROLE_LABELS } from "@/lib/adminNav";
import AdminLayout from "./AdminLayout";
import AdminBoot from "./AdminBoot";

/**
 * The gate in front of every admin screen.
 *
 * Which roles may open which route is not decided here — it is decided once, in
 * the nav registry, alongside which roles see the link. The two used to be
 * separate tables that had to be edited together, and a link an editor could
 * see but not open was the failure that resulted.
 */
export default function AdminRoute({ children }) {
  const { user, profile, isAuthenticated, isLoadingAuth, isLoadingProfile } = useAuth();
  const location = useLocation();

  // One boot state covers the whole start-up, so nothing flashes between steps.
  if (isLoadingAuth) return <AdminBoot />;

  // Not logged in → redirect to admin login
  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Still the same boot state: the role decides which nav items exist, so
  // rendering the shell before the profile arrives would show an empty sidebar
  // and then populate it — a second flash in place of the one just removed.
  if (isLoadingProfile || (!profile && isAuthenticated)) return <AdminBoot />;

  const userRole = profile?.role || "user";

  // Not an admin/editor/viewer → show access denied
  if (!ADMIN_ROLES.includes(userRole)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have admin privileges. Please contact the site administrator
            to request access.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-[#0A5C8C] text-white rounded-lg hover:bg-[#084a6f] transition-colors"
          >
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }

  if (!canAccessPath(userRole, location.pathname)) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md px-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Restricted Access</h2>
            <p className="text-gray-600 mb-6">
              Your role ({ROLE_LABELS[userRole] || userRole}) does not have permission to
              open this page. Contact an administrator if you need access.
            </p>
            <a
              href={landingPathForRole(userRole)}
              className="inline-flex items-center px-4 py-2 bg-[#0A5C8C] text-white rounded-lg hover:bg-[#084a6f] transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Authorized → render admin layout with content
  return <AdminLayout>{children}</AdminLayout>;
}
