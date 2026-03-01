import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import AdminLayout from "./AdminLayout";

// Define which roles can access which routes
const routePermissions = {
  "/admin": ["admin", "editor", "viewer"],
  "/admin/providers": ["admin", "editor"],
  "/admin/plans": ["admin", "editor"],
  "/admin/business-plans": ["admin", "editor"],
  "/admin/renewable-plans": ["admin", "editor"],
  "/admin/articles": ["admin", "editor"],
  "/admin/quotes": ["admin", "editor"],
  "/admin/users": ["admin"],
  "/admin/affiliates": ["admin"],
  "/admin/concierge": ["admin", "editor"],
  "/admin/settings": ["admin", "editor", "viewer"],
};

export default function AdminRoute({ children }) {
  const { user, profile, isAuthenticated, isLoadingAuth, isLoadingProfile } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-[#0A5C8C] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Checking access...</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to admin login
  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Show loading while profile is being fetched
  // This prevents the "Access Denied" flash when profile hasn't loaded yet
  if (isLoadingProfile || (!profile && isAuthenticated)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-[#0A5C8C] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  const userRole = profile?.role || "user";
  const allowedRoles = ["admin", "editor", "viewer"];

  // Not an admin/editor/viewer → show access denied
  if (!allowedRoles.includes(userRole)) {
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

  // Check route-level permissions
  const currentPath = location.pathname;
  const matchedRoute = Object.keys(routePermissions).find(
    (route) => currentPath === route || (route !== "/admin" && currentPath.startsWith(route))
  );
  const allowedForRoute = matchedRoute ? routePermissions[matchedRoute] : ["admin"];

  if (!allowedForRoute.includes(userRole)) {
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
              Your role ({userRole}) does not have permission to access this page.
              Contact an administrator if you need access.
            </p>
            <a
              href="/admin"
              className="inline-flex items-center px-4 py-2 bg-[#0A5C8C] text-white rounded-lg hover:bg-[#084a6f] transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Authorized → render admin layout with content
  return <AdminLayout>{children}</AdminLayout>;
}
