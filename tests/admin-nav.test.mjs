/**
 * The admin nav registry — `npm test`.
 *
 * The registry is the single source of truth for three things that used to be
 * three separate lists: which links the sidebar draws, which routes the guard
 * admits, and what each screen is called. The failure that motivated it was a
 * link an editor could see and could not open — the sidebar said yes and the
 * permission table, which had no row for that path, said no.
 *
 * These tests hold the invariant that made that bug possible: a role sees a
 * link if and only if it can open it, and every path the registry names is a
 * path the router actually serves.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  ADMIN_NAV,
  ADMIN_ROLES,
  NAV_GROUPS,
  NAV_ALIASES,
  ROLE_LABELS,
  navItemForPath,
  navForRole,
  groupedNavForRole,
  canAccessPath,
  landingPathForRole,
} from '../src/lib/adminNav.js';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, '..', 'src', 'App.jsx'), 'utf8');
const adminConfigSource = readFileSync(join(here, '..', 'src', 'admin.config.js'), 'utf8');

/**
 * The paths admin.config.js can render, read out of the source rather than
 * imported: the module builds React.lazy components at load time, and this
 * suite runs under bare Node with no bundler and no JSX.
 */
const registeredRoutePaths = (() => {
  const block = adminConfigSource.match(/const ADMIN_PAGE_LOADERS = \{([\s\S]*?)\n\};/);
  assert.ok(block, 'ADMIN_PAGE_LOADERS is no longer a literal object in admin.config.js');
  return [...block[1].matchAll(/'(\/admin[^']*)':/g)].map((m) => m[1]);
})();

describe('the registry is internally coherent', () => {
  test('every entry is complete', () => {
    for (const item of ADMIN_NAV) {
      assert.ok(item.path.startsWith('/admin'), `${item.path} is not an admin path`);
      assert.ok(item.label, `${item.path} has no label`);
      assert.ok(item.description, `${item.path} has no description`);
      assert.ok(item.icon, `${item.path} has no icon`);
      assert.ok(item.roles.length > 0, `${item.path} is visible to nobody`);
    }
  });

  test('paths and labels are unique', () => {
    const paths = ADMIN_NAV.map((i) => i.path);
    const labels = ADMIN_NAV.map((i) => i.label);
    assert.equal(new Set(paths).size, paths.length, 'two entries share a path');
    assert.equal(new Set(labels).size, labels.length, 'two entries share a label');
  });

  test('every entry belongs to a declared group', () => {
    const groups = new Set(NAV_GROUPS.map((g) => g.id));
    for (const item of ADMIN_NAV) {
      assert.ok(groups.has(item.group), `${item.path} is in unknown group "${item.group}"`);
    }
  });

  test('every role named by an entry is a real role', () => {
    for (const item of ADMIN_NAV) {
      for (const role of item.roles) {
        assert.ok(ADMIN_ROLES.includes(role), `${item.path} names unknown role "${role}"`);
        assert.ok(ROLE_LABELS[role], `role "${role}" has no label`);
      }
    }
  });
});

describe('the router serves every path the registry names', () => {
  test('each nav path has a screen in the admin route registry', () => {
    for (const item of ADMIN_NAV) {
      assert.ok(
        registeredRoutePaths.includes(item.path),
        `${item.path} is in the sidebar but has no loader in admin.config.js — ` +
          'the link would open a shell that never stops loading'
      );
    }
  });

  test('the registry has no screen the sidebar cannot reach', () => {
    const navPaths = new Set(ADMIN_NAV.map((i) => i.path));
    for (const path of registeredRoutePaths) {
      assert.ok(
        navPaths.has(path),
        `${path} loads a screen no sidebar entry links to — add it to ADMIN_NAV or drop it`
      );
    }
  });

  test('every screen is nested under the one /admin layout route', () => {
    // The shape matters, not just the paths: a screen given its own top-level
    // <Route> would remount the gate, the sidebar and the header on arrival,
    // which reads to an operator as the panel reloading itself.
    assert.ok(
      /<Route path="\/admin" element=\{[\s\S]*?\}>\s*\{ADMIN_ROUTES\.map/.test(appSource),
      'App.jsx no longer renders the admin screens as children of a /admin layout route'
    );
    for (const item of ADMIN_NAV) {
      assert.ok(
        !appSource.includes(`path="${item.path}"`) || item.path === '/admin',
        `${item.path} has its own top-level <Route> again, outside the layout route`
      );
    }
  });

  test('each alias has a route, and lands on a real screen', () => {
    const paths = new Set(ADMIN_NAV.map((i) => i.path));
    for (const [alias, target] of Object.entries(NAV_ALIASES)) {
      assert.ok(
        appSource.includes(`path="${alias}"`),
        `${alias} is aliased but has no <Route> in App.jsx`
      );
      assert.ok(paths.has(target), `${alias} redirects to ${target}, which is not a screen`);
    }
  });
});

describe('a path resolves to the screen it belongs to', () => {
  test('an exact path finds its own entry', () => {
    assert.equal(navItemForPath('/admin').label, 'Dashboard');
    assert.equal(navItemForPath('/admin/leads').label, 'Leads');
    assert.equal(navItemForPath('/admin/settings').label, 'Settings');
  });

  test('/admin does not swallow the routes beneath it', () => {
    // It is a prefix of every other admin path, so a naive startsWith would
    // make every screen resolve to the dashboard and light the wrong sidebar
    // link on all twelve of them.
    assert.equal(navItemForPath('/admin/revenue').label, 'Revenue');
    assert.equal(navItemForPath('/admin/lead-buyers').label, 'Lead Buyers');
  });

  test('a longer path wins over a shorter one that prefixes it', () => {
    assert.equal(navItemForPath('/admin/lead-buyers').path, '/admin/lead-buyers');
  });

  test('a child path resolves to its parent screen', () => {
    assert.equal(navItemForPath('/admin/plans/42').label, 'Plans');
  });

  test('an alias resolves to the screen it redirects to', () => {
    assert.equal(navItemForPath('/admin/business-plans').label, 'Plans');
    assert.equal(navItemForPath('/admin/renewable-plans').label, 'Plans');
    assert.equal(navItemForPath('/admin/monetization').label, 'Revenue');
  });

  test('an unknown path resolves to nothing', () => {
    assert.equal(navItemForPath('/admin/nope'), null);
    assert.equal(navItemForPath(''), null);
    assert.equal(navItemForPath(undefined), null);
  });
});

describe('a role sees exactly what it can open', () => {
  test('every visible link is openable, for every role', () => {
    // This is the invariant. A link in the sidebar that the guard refuses is
    // the exact defect the registry exists to prevent.
    for (const role of ADMIN_ROLES) {
      for (const item of navForRole(role)) {
        assert.ok(
          canAccessPath(role, item.path),
          `${role} sees ${item.path} in the sidebar but the guard refuses it`
        );
      }
    }
  });

  test('every openable screen is visible, for every role', () => {
    // The converse: a screen a role may open but cannot find is a dead end.
    for (const role of ADMIN_ROLES) {
      const visible = new Set(navForRole(role).map((i) => i.path));
      for (const item of ADMIN_NAV) {
        if (canAccessPath(role, item.path)) {
          assert.ok(visible.has(item.path), `${role} may open ${item.path} but has no link to it`);
        }
      }
    }
  });

  test('an alias obeys the permissions of the screen it lands on', () => {
    assert.equal(canAccessPath('editor', '/admin/monetization'), canAccessPath('editor', '/admin/revenue'));
    assert.equal(canAccessPath('admin', '/admin/monetization'), true);
    assert.equal(canAccessPath('editor', '/admin/business-plans'), true);
  });

  test('money is admin-only', () => {
    for (const path of ['/admin/revenue', '/admin/lead-buyers', '/admin/affiliates']) {
      assert.equal(canAccessPath('admin', path), true);
      assert.equal(canAccessPath('editor', path), false);
      assert.equal(canAccessPath('viewer', path), false);
    }
  });

  test('a viewer gets the dashboard and its own settings, and nothing else', () => {
    assert.deepEqual(navForRole('viewer').map((i) => i.path), ['/admin', '/admin/settings']);
  });

  test('an editor runs the catalog but not the ledger', () => {
    assert.equal(canAccessPath('editor', '/admin/plans'), true);
    assert.equal(canAccessPath('editor', '/admin/providers'), true);
    assert.equal(canAccessPath('editor', '/admin/territories'), true);
    assert.equal(canAccessPath('editor', '/admin/leads'), true);
    assert.equal(canAccessPath('editor', '/admin/users'), false);
  });

  test('an unknown admin path is admin-only', () => {
    // Safe direction to be wrong in: a route someone adds and forgets to
    // register is closed to everyone but an admin, rather than open to all.
    assert.equal(canAccessPath('admin', '/admin/not-registered'), true);
    assert.equal(canAccessPath('editor', '/admin/not-registered'), false);
    assert.equal(canAccessPath('viewer', '/admin/not-registered'), false);
  });

  test('a role outside the panel gets nothing at all', () => {
    for (const path of ['/admin', '/admin/settings', '/admin/revenue']) {
      assert.equal(canAccessPath('user', path), false);
      assert.equal(canAccessPath(undefined, path), false);
    }
  });
});

describe('the sidebar a role is shown', () => {
  test('no empty section headings', () => {
    for (const role of ADMIN_ROLES) {
      for (const group of groupedNavForRole(role)) {
        assert.ok(group.items.length > 0, `${role} sees an empty "${group.id}" heading`);
      }
    }
  });

  test('groups keep their declared order', () => {
    const order = NAV_GROUPS.map((g) => g.id);
    for (const role of ADMIN_ROLES) {
      const seen = groupedNavForRole(role).map((g) => g.id);
      assert.deepEqual(seen, order.filter((id) => seen.includes(id)));
    }
  });

  test('a grouped sidebar holds every link the role can see, and no more', () => {
    for (const role of ADMIN_ROLES) {
      const grouped = groupedNavForRole(role).flatMap((g) => g.items.map((i) => i.path));
      assert.deepEqual(grouped.sort(), navForRole(role).map((i) => i.path).sort());
    }
  });
});

describe('where a role lands', () => {
  test('every role lands somewhere it is allowed to be', () => {
    for (const role of ADMIN_ROLES) {
      const landing = landingPathForRole(role);
      assert.ok(canAccessPath(role, landing), `${role} lands on ${landing}, which it may not open`);
    }
  });

  test('a role with no screens still gets a path rather than undefined', () => {
    assert.equal(landingPathForRole('user'), '/admin');
  });
});
