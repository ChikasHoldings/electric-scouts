/**
 * admin.config.js
 *
 * Lazy registry for the admin panel — the gate, the login screen and every
 * screen behind the gate.
 *
 * Separate from pages.config.js because the two answer to different rules. A
 * public page is prerendered and its chunk is preloaded before React mounts; an
 * admin screen is never prerendered, is only reachable behind auth, and must
 * stay out of the public entry chunk entirely.
 *
 * Like pages.config.js, each screen is registered as an importer rather than a
 * bare `lazy()` call, because the importer is needed twice: once to build the
 * React.lazy component, and once to start the chunk download before the router
 * renders. See `preloadAdminForPath` at the bottom.
 *
 * Keyed by the route path the screen answers to, which is the same path the nav
 * registry in lib/adminNav.js uses. A test asserts the two agree — a screen
 * with a sidebar entry and no loader would render as a permanent spinner.
 */

import { lazy } from 'react';

/** Route path → chunk importer, for every screen behind the admin gate. */
const ADMIN_PAGE_LOADERS = {
  '/admin': () => import('./pages/admin/AdminDashboard'),
  '/admin/leads': () => import('./pages/admin/AdminLeads'),
  '/admin/concierge': () => import('./pages/admin/AdminConcierge'),
  '/admin/revenue': () => import('./pages/admin/AdminRevenue'),
  '/admin/lead-buyers': () => import('./pages/admin/AdminLeadBuyers'),
  '/admin/affiliates': () => import('./pages/admin/AdminAffiliates'),
  '/admin/providers': () => import('./pages/admin/AdminProviders'),
  '/admin/plans': () => import('./pages/admin/AdminPlans'),
  '/admin/territories': () => import('./pages/admin/AdminTerritories'),
  '/admin/articles': () => import('./pages/admin/AdminArticles'),
  '/admin/users': () => import('./pages/admin/AdminUsers'),
  '/admin/settings': () => import('./pages/admin/AdminSettings'),
};

const GATE_LOADER = () => import('./components/admin/AdminRoute');
const LOGIN_LOADER = () => import('./pages/admin/AdminLogin');

/** The auth gate. Renders the shell and an <Outlet /> for the matched screen. */
export const AdminGate = lazy(GATE_LOADER);

/** The one admin screen a logged-out visitor is meant to reach. */
export const AdminLoginPage = lazy(LOGIN_LOADER);

/**
 * The child routes of the `/admin` layout route, as App.jsx needs them: an
 * absolute `path` for the registry, and the `relative` segment React Router
 * wants on a nested <Route>. `/admin` itself becomes the index route.
 */
export const ADMIN_ROUTES = Object.entries(ADMIN_PAGE_LOADERS).map(([path, loader]) => ({
  path,
  relative: path === '/admin' ? null : path.slice('/admin/'.length),
  Component: lazy(loader),
}));

/** The paths this registry can render. Exported for the parity test. */
export const ADMIN_ROUTE_PATHS = Object.keys(ADMIN_PAGE_LOADERS);

/**
 * Start the chunks an admin URL needs, before React renders.
 *
 * Two chunks, not one: the gate and the screen it will show. They are nested,
 * so left alone they load one after the other and the visitor watches the
 * full-screen boot spinner hand over to a second, smaller spinner inside the
 * shell. Requesting both up front collapses that back to a single loading
 * state, which is the whole point of AdminBoot.
 *
 * Resolves (never rejects) so a chunk that fails to load falls through to the
 * Suspense boundary rather than blocking the mount.
 *
 * @param {string} pathname
 * @returns {Promise<void>}
 */
export function preloadAdminForPath(pathname) {
  const path = (pathname || '').replace(/\/+$/, '') || '/';
  if (path !== '/admin' && !path.startsWith('/admin/')) return Promise.resolve();

  const loaders = path === '/admin/login'
    ? [LOGIN_LOADER]
    : [GATE_LOADER, ADMIN_PAGE_LOADERS[path]].filter(Boolean);

  return Promise.all(loaders.map((load) => load().catch(() => undefined))).then(
    () => undefined
  );
}
