
import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import ProviderDetailsPage from '@/pages/ProviderDetails';

// Admin imports — lazy-loaded for code-splitting
const AdminRoute = lazy(() => import('@/components/admin/AdminRoute'));
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminProviders = lazy(() => import('@/pages/admin/AdminProviders'));
const AdminPlans = lazy(() => import('@/pages/admin/AdminPlans'));
const AdminArticles = lazy(() => import('@/pages/admin/AdminArticles'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminAffiliates = lazy(() => import('@/pages/admin/AdminAffiliates'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminBusinessPlans = lazy(() => import('@/pages/admin/AdminBusinessPlans'));
const AdminRenewablePlans = lazy(() => import('@/pages/admin/AdminRenewablePlans'));
const AdminConcierge = lazy(() => import('@/pages/admin/AdminConcierge'));
const AdminLeads = lazy(() => import('@/pages/admin/AdminLeads'));
const AdminMonetization = lazy(() => import('@/pages/admin/AdminMonetization'));

// Lazy-loaded SEO redirect components
const CityRatesRedirect = lazy(() => import('@/components/CityRatesRedirect'));
const ArticleRedirect = lazy(() => import('@/components/ArticleRedirect'));

// Lazy-loaded CityRates and ArticleDetail for clean URL routes
const CityRatesPage = lazy(() => import('@/pages/CityRates'));
const ArticleDetailPage = lazy(() => import('@/pages/ArticleDetail'));

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0A5C8C] rounded-full animate-spin" />
      </div>
    }>
      {children}
    </Suspense>
  </Layout>
  : <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0A5C8C] rounded-full animate-spin" />
      </div>
    }>
      {children}
    </Suspense>;

const AdminLoading = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0A5C8C] rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-gray-500">Loading admin panel...</p>
    </div>
  </div>
);

// The main app component — public pages render immediately without waiting for auth.
// Only admin routes (wrapped in AdminRoute) wait for auth to resolve.
const AppRoutes = () => {
  return (
    <Routes>
      {/* ── Admin Routes (lazy-loaded, auth-gated by AdminRoute) ── */}
      <Route path="/admin/login" element={
        <Suspense fallback={<AdminLoading />}>
          <AdminLogin />
        </Suspense>
      } />
      <Route path="/admin" element={
        <Suspense fallback={<AdminLoading />}>
          <AdminRoute><AdminDashboard /></AdminRoute>
        </Suspense>
      } />
      <Route path="/admin/providers" element={
        <Suspense fallback={<AdminLoading />}>
          <AdminRoute><AdminProviders /></AdminRoute>
        </Suspense>
      } />
      <Route path="/admin/plans" element={
        <Suspense fallback={<AdminLoading />}>
          <AdminRoute><AdminPlans /></AdminRoute>
        </Suspense>
      } />
      <Route path="/admin/business-plans" element={
        <Suspense fallback={<AdminLoading />}>
          <AdminRoute><AdminBusinessPlans /></AdminRoute>
        </Suspense>
      } />
      <Route path="/admin/renewable-plans" element={
        <Suspense fallback={<AdminLoading />}>
          <AdminRoute><AdminRenewablePlans /></AdminRoute>
        </Suspense>
      } />
      <Route path="/admin/articles" element={
        <Suspense fallback={<AdminLoading />}>
          <AdminRoute><AdminArticles /></AdminRoute>
        </Suspense>
      } />
      <Route path="/admin/users" element={
        <Suspense fallback={<AdminLoading />}>
          <AdminRoute><AdminUsers /></AdminRoute>
        </Suspense>
      } />
      <Route path="/admin/affiliates" element={
        <Suspense fallback={<AdminLoading />}>
          <AdminRoute><AdminAffiliates /></AdminRoute>
        </Suspense>
      } />
      <Route path="/admin/settings" element={
        <Suspense fallback={<AdminLoading />}>
          <AdminRoute><AdminSettings /></AdminRoute>
        </Suspense>
      } />
      <Route path="/admin/concierge" element={
        <Suspense fallback={<AdminLoading />}>
          <AdminRoute><AdminConcierge /></AdminRoute>
        </Suspense>
      } />
      <Route path="/admin/monetization" element={
        <Suspense fallback={<AdminLoading />}>
          <AdminRoute><AdminMonetization /></AdminRoute>
        </Suspense>
      } />
      <Route path="/admin/leads" element={
        <Suspense fallback={<AdminLoading />}>
          <AdminRoute><AdminLeads /></AdminRoute>
        </Suspense>
      } />

      {/* ── Public Routes (render immediately, no auth gate) ── */}
      <Route path="/providers/:slug" element={
        <LayoutWrapper currentPageName="ProviderDetails">
          <ProviderDetailsPage />
        </LayoutWrapper>
      } />

      {/* ── Clean URL: City Pages (/electricity-rates/:state/:city) ── */}
      <Route path="/electricity-rates/:stateSlug/:citySlug" element={
        <LayoutWrapper currentPageName="CityRates">
          <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#0A5C8C] rounded-full animate-spin" /></div>}>
            <CityRatesPage />
          </Suspense>
        </LayoutWrapper>
      } />

      {/* ── Clean URL: Article Pages (/learn/:slug) ── */}
      <Route path="/learn/:articleSlug" element={
        <LayoutWrapper currentPageName="ArticleDetail">
          <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#0A5C8C] rounded-full animate-spin" /></div>}>
            <ArticleDetailPage />
          </Suspense>
        </LayoutWrapper>
      } />

      {/* ── Legacy Redirects: Old query-param URLs → Clean URLs ── */}
      <Route path="/city-rates" element={
        <Suspense fallback={null}>
          <CityRatesRedirect />
        </Suspense>
      } />
      <Route path="/article-detail" element={
        <Suspense fallback={null}>
          <ArticleRedirect />
        </Suspense>
      } />

      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([pageName, Page]) => {
        // Skip CityRates and ArticleDetail — they now have clean URL routes above
        if (pageName === 'CityRates' || pageName === 'ArticleDetail') return null;
        const seoPath = createPageUrl(pageName);
        return (
          <Route
            key={pageName}
            path={seoPath}
            element={
              <LayoutWrapper currentPageName={pageName}>
                <Page />
              </LayoutWrapper>
            }
          />
        );
      })}

      {/* Legacy PascalCase and lowercase redirects for backward compatibility */}
      {Object.keys(Pages).map((pageName) => {
        if (pageName === 'CityRates' || pageName === 'ArticleDetail') return null;
        const seoPath = createPageUrl(pageName);
        const legacyPascal = `/${pageName}`;
        const legacyLower = `/${pageName.toLowerCase()}`;
        const routes = [];
        if (legacyPascal.toLowerCase() !== seoPath) {
          routes.push(
            <Route key={`legacy-pascal-${pageName}`} path={legacyPascal}
              element={<Navigate to={seoPath} replace />} />
          );
          if (legacyLower !== seoPath && legacyLower !== legacyPascal.toLowerCase()) {
            routes.push(
              <Route key={`legacy-lower-${pageName}`} path={legacyLower}
                element={<Navigate to={seoPath} replace />} />
            );
          }
        }
        return routes;
      })}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
