/**
 * The admin panel's shape, in one place.
 *
 * Three lists used to describe the same twelve screens: the sidebar in
 * AdminLayout, the permission table in AdminRoute, and the route elements in
 * App.jsx. Keeping them in step was a manual invariant, and it had already
 * failed once — Leads appeared in an editor's sidebar and then refused to open,
 * because the permission table had no entry for it and fell through to the
 * admin-only default. A link you can see and cannot use is worse than no link.
 *
 * So the sidebar, the guard and each page's title now all read from here. The
 * three can no longer disagree, because there is only one of them.
 *
 * `icon` is a string rather than a component so this module stays import-free:
 * the guard and the tests can load it without pulling in React. AdminLayout
 * owns the name → component mapping.
 */

/** Roles that may open the admin panel at all, most privileged first. */
export const ADMIN_ROLES = ["admin", "editor", "viewer"];

/** What a role means, for the places that explain one to a person. */
export const ROLE_LABELS = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

/**
 * Sidebar sections, in display order.
 *
 * The grouping is the business's, not the code's: what comes in and what it
 * earns, then what the public site shows, then the panel's own housekeeping.
 */
export const NAV_GROUPS = [
  { id: "overview", label: null },
  { id: "revenue", label: "Revenue" },
  { id: "catalog", label: "Catalog" },
  { id: "content", label: "Content" },
  { id: "admin", label: "Administration" },
];

/**
 * Every admin screen.
 *
 * `label` is the page's name everywhere it appears — sidebar, top bar, browser
 * title, breadcrumb. Pages used to carry a second name of their own, so
 * "Providers" in the sidebar opened a page headed "Provider Management" and
 * "Concierge" opened one headed "Home Concierge". One name per screen.
 *
 * `description` is the static one-liner under the title. Live counts belong to
 * the page, which is the only thing that has loaded them.
 */
export const ADMIN_NAV = [
  {
    path: "/admin",
    label: "Dashboard",
    description: "Catalog, leads and earnings at a glance",
    icon: "dashboard",
    group: "overview",
    roles: ["admin", "editor", "viewer"],
  },
  {
    path: "/admin/leads",
    label: "Leads",
    description: "Every captured lead, and where it was routed",
    icon: "leads",
    group: "revenue",
    roles: ["admin", "editor"],
  },
  {
    path: "/admin/concierge",
    label: "Concierge",
    description: "Utility setup requests, and how each was fulfilled",
    icon: "concierge",
    group: "revenue",
    roles: ["admin", "editor"],
  },
  {
    path: "/admin/revenue",
    label: "Revenue",
    description: "The earnings ledger — what partners have agreed to pay",
    icon: "revenue",
    group: "revenue",
    roles: ["admin"],
  },
  {
    path: "/admin/lead-buyers",
    label: "Lead Buyers",
    description: "Partners who buy qualified leads, and their targeting",
    icon: "buyers",
    group: "revenue",
    roles: ["admin"],
  },
  {
    path: "/admin/affiliates",
    label: "Affiliates",
    description: "Referral links and the commission terms behind them",
    icon: "affiliates",
    group: "revenue",
    roles: ["admin"],
  },
  {
    path: "/admin/providers",
    label: "Providers",
    description: "Electricity providers across every deregulated market",
    icon: "providers",
    group: "catalog",
    roles: ["admin", "editor"],
  },
  {
    // One plan screen for every audience. Business and renewable were separate
    // pages that differed only by a filter, and which one you opened silently
    // decided how a plan got classified.
    path: "/admin/plans",
    label: "Plans",
    description: "The rate catalog customers compare",
    icon: "plans",
    group: "catalog",
    roles: ["admin", "editor"],
  },
  {
    // Delivery tariffs sit next to Plans because they finish the price a plan
    // shows: without one, every plan in that market can only show a supply-only
    // subtotal and no savings comparison.
    path: "/admin/territories",
    label: "Delivery Tariffs",
    description: "Utility delivery charges that complete each plan's price",
    icon: "tariffs",
    group: "catalog",
    roles: ["admin", "editor"],
  },
  {
    path: "/admin/articles",
    label: "Articles",
    description: "Learning Center articles and their publication state",
    icon: "articles",
    group: "content",
    roles: ["admin", "editor"],
  },
  {
    path: "/admin/users",
    label: "Users",
    description: "Admin accounts and the roles they hold",
    icon: "users",
    group: "admin",
    roles: ["admin"],
  },
  {
    path: "/admin/settings",
    label: "Settings",
    description: "Your profile, security and notification preferences",
    icon: "settings",
    group: "admin",
    roles: ["admin", "editor", "viewer"],
  },
];

/**
 * Paths that are not their own screen but must still resolve to one.
 *
 * These are redirects kept alive because they are in browser histories and in
 * the muscle memory of whoever runs the catalog. They are listed so the guard
 * and the title lookup agree with App.jsx about where they land.
 */
export const NAV_ALIASES = {
  "/admin/business-plans": "/admin/plans",
  "/admin/renewable-plans": "/admin/plans",
  "/admin/monetization": "/admin/revenue",
};

/**
 * The nav entry a path belongs to, or null.
 *
 * Longest path first, so `/admin/lead-buyers` cannot be claimed by a shorter
 * entry, and `/admin` — a prefix of every other route — only ever matches
 * itself exactly.
 */
export function navItemForPath(pathname) {
  if (!pathname) return null;

  const resolved = NAV_ALIASES[pathname] || pathname;

  const byLength = [...ADMIN_NAV].sort((a, b) => b.path.length - a.path.length);

  return (
    byLength.find(
      (item) =>
        resolved === item.path ||
        (item.path !== "/admin" && resolved.startsWith(`${item.path}/`))
    ) || null
  );
}

/** The nav a role actually sees. */
export function navForRole(role) {
  return ADMIN_NAV.filter((item) => item.roles.includes(role));
}

/**
 * The sidebar, grouped, with empty groups dropped.
 *
 * A viewer sees Dashboard and Settings and nothing else, so three of the five
 * section headings would otherwise render above nothing at all.
 */
export function groupedNavForRole(role) {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: navForRole(role).filter((item) => item.group === group.id),
  })).filter((group) => group.items.length > 0);
}

/**
 * May this role open this path?
 *
 * An unknown admin path is admin-only, which is the safe direction to be wrong
 * in for a route someone adds later and forgets to register here.
 */
export function canAccessPath(role, pathname) {
  if (!ADMIN_ROLES.includes(role)) return false;
  const item = navItemForPath(pathname);
  return item ? item.roles.includes(role) : role === "admin";
}

/** Where to send a role that landed somewhere it may not be. */
export function landingPathForRole(role) {
  return navForRole(role)[0]?.path || "/admin";
}
