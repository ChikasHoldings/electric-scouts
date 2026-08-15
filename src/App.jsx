
import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import { AuthProvider } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import ProviderDetailsPage from '@/pages/ProviderDetails';

// Admin — lazy-loaded from its own registry, which App.jsx and main.jsx share
import AdminBoot from '@/components/admin/AdminBoot';
import { ADMIN_ROUTES, AdminGate, AdminLoginPage } from './admin.config';

// Lazy-loaded SEO redirect components
const CityRatesRedirect = lazy(() => import('@/components/CityRatesRedirect'));
const ArticleRedirect = lazy(() => import('@/components/ArticleRedirect'));

// Lazy-loaded CityRates, ArticleDetail and CompareVersus for clean URL routes
const CityRatesPage = lazy(() => import('@/pages/CityRates'));
const ArticleDetailPage = lazy(() => import('@/pages/ArticleDetail'));
const CompareVersusPage = lazy(() => import('@/pages/CompareVersus'));
const UtilityDetailPage = lazy(() => import('@/pages/UtilityDetail'));

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const PageSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0A5C8C] rounded-full animate-spin" />
  </div>
);

/**
 * Header, footer and the page between them.
 *
 * The error boundary is inside the layout and outside the Suspense boundary, so
 * it catches both a page that throws while rendering and a chunk that fails to
 * arrive — and in either case the visitor keeps the nav they came in with
 * instead of losing the whole site to a full-screen error.
 */
const LayoutWrapper = ({ children, currentPageName }) => {
  const content = (
    <RouteErrorBoundary>
      <Suspense fallback={<PageSpinner />}>{children}</Suspense>
    </RouteErrorBoundary>
  );
  return Layout ? <Layout currentPageName={currentPageName}>{content}</Layout> : content;
};

// The main app component — public pages render immediately without waiting for auth.
// Only admin routes (wrapped in AdminRoute) wait for auth to resolve.
const AppRoutes = () => {
  return (
    <Routes>
      {/* ── Admin ── */}

      {/* Login sits outside the gate — it is the one admin screen a logged-out
          visitor is supposed to reach. */}
      <Route path="/admin/login" element={
        <Suspense fallback={<AdminBoot />}>
          <AdminLoginPage />
        </Suspense>
      } />

      {/* Consolidated screens, kept as redirects rather than removed: these
          paths are in browser histories and, more importantly, in the muscle
          memory of whoever runs the catalog. Business and renewable plans were
          the residential screen with a filter changed; monetization readiness
          is one section of revenue, because "can we earn" is only useful next
          to "what did we earn". They stay outside the gate so they resolve
          without waiting on auth. */}
      <Route path="/admin/business-plans" element={<Navigate to="/admin/plans" replace />} />
      <Route path="/admin/renewable-plans" element={<Navigate to="/admin/plans" replace />} />
      <Route path="/admin/monetization" element={<Navigate to="/admin/revenue" replace />} />

      {/* One layout route for the whole panel.
          Every screen used to declare its own
          <Suspense fallback={<AdminBoot/>}><AdminRoute>…</AdminRoute></Suspense>,
          which meant moving between two admin pages tore down the gate, the
          sidebar and the header, painted the full-screen boot spinner over
          everything while the next chunk arrived, and then rebuilt the shell
          from scratch — indistinguishable from a hard refresh, and it reset
          every open menu and scroll position on the way. Nested under a single
          parent, the shell mounts once and only the content area swaps. */}
      <Route path="/admin" element={
        <Suspense fallback={<AdminBoot />}>
          <AdminGate />
        </Suspense>
      }>
        {ADMIN_ROUTES.map(({ path, relative, Component }) =>
          relative
            ? <Route key={path} path={relative} element={<Component />} />
            : <Route key={path} index element={<Component />} />
        )}
      </Route>

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

      {/* ── Clean URL: Head-to-head Pages (/compare/:slug) ── */}
      {/* The hub at /compare comes from the registry loop below; only the
          matchup pages need a hand-written route, because their path carries a
          slug the registry cannot express. Without this the prerendered HTML
          rendered for a crawler was replaced by the 404 page the moment React
          hydrated. */}
      <Route path="/compare/:slug" element={
        <LayoutWrapper currentPageName="CompareVersus">
          <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#0A5C8C] rounded-full animate-spin" /></div>}>
            <CompareVersusPage />
          </Suspense>
        </LayoutWrapper>
      } />

      {/* ── Clean URL: Utility Territories (/utilities/:slug) ── */}
      {/* The hub at /utilities comes from the registry loop below; only the
          territory pages need a hand-written route, for the same reason the
          matchup pages do — the path carries a slug the registry cannot express. */}
      <Route path="/utilities/:slug" element={
        <LayoutWrapper currentPageName="UtilityDetail">
          <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#0A5C8C] rounded-full animate-spin" /></div>}>
            <UtilityDetailPage />
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
        // CompareVersus is reached only as /compare/:slug, above. Left in the
        // loop it would also publish /compare-versus, a URL nothing links to.
        if (pageName === 'CompareVersus') return null;
        // Reached only as /utilities/:slug, above.
        if (pageName === 'UtilityDetail') return null;
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
        // CompareVersus is reached only as /compare/:slug, above. Left in the
        // loop it would also publish /compare-versus, a URL nothing links to.
        if (pageName === 'CompareVersus') return null;
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
