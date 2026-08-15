/**
 * Whether a supplier can go live, and what the admin panel says before it does.
 *
 * Two real failures shape these tests.
 *
 * The first: on 2026-08-13 every provider row but two was flipped inactive in a
 * single pass. 33 provider pages stopped rendering, 372 plans stopped being
 * sellable, and the panel said nothing — the switch looked the same either way.
 *
 * The second is the trap that made the first easy to walk into. The Plans
 * column counted every plan including switched-off ones, so a supplier with
 * nine dead plans read as "9"; and the Affiliate column showed the
 * `has_affiliate_program` flag rather than a link, so a supplier with no URL at
 * all showed a green badge and a sign-up button pointing at "#".
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  providerReadiness,
  catalogReadiness,
  toggleWarning,
  outboundUrlFor,
  STATUS_LABELS,
} from '../src/lib/providerReadiness.js';

const provider = (over = {}) => ({
  id: 'p1',
  name: 'Stub Energy',
  supported_states: ['OH', 'TX'],
  affiliate_url: 'https://stub.example/plans',
  website_url: 'https://stub.example',
  is_active: true,
  has_affiliate_program: true,
  ...over,
});

const plan = (over = {}) => ({
  provider_name: 'Stub Energy', is_active: true, rate_per_kwh: 9.9, ...over,
});

describe('where the sign-up button sends a customer', () => {
  test('a tracked affiliate link wins, because it is the one that earns', () => {
    const links = [{ is_active: true, provider_id: 'p1', slug: 'stub-energy' }];
    assert.deepEqual(outboundUrlFor(provider(), links), { url: '/go/stub-energy', kind: 'tracked' });
  });

  test('an inactive tracked link is ignored', () => {
    const links = [{ is_active: false, provider_id: 'p1', slug: 'stub-energy' }];
    assert.equal(outboundUrlFor(provider(), links).kind, 'affiliate');
  });

  test('a link belonging to another provider is ignored', () => {
    const links = [{ is_active: true, provider_id: 'other', slug: 'other' }];
    assert.equal(outboundUrlFor(provider(), links).kind, 'affiliate');
  });

  test('the plain website is a fallback, and is reported as the weaker option', () => {
    assert.deepEqual(
      outboundUrlFor(provider({ affiliate_url: null })),
      { url: 'https://stub.example', kind: 'website' }
    );
  });

  test('no link at all is reported as none, not as a working destination', () => {
    assert.deepEqual(
      outboundUrlFor(provider({ affiliate_url: null, website_url: null })),
      { url: null, kind: 'none' }
    );
  });
});

describe('a supplier is only publishable when it can actually be sold', () => {
  test('plans, a link and a market — live', () => {
    const readiness = providerReadiness(provider(), [plan(), plan()]);
    assert.equal(readiness.status, 'live');
    assert.equal(readiness.activePlans, 2);
    assert.deepEqual(readiness.blockers, []);
    assert.ok(readiness.published);
  });

  test('switched-off plans do not count — the exact figure that misled', () => {
    const readiness = providerReadiness(
      provider({ is_active: false }),
      Array.from({ length: 9 }, () => plan({ is_active: false }))
    );
    assert.equal(readiness.totalPlans, 9, 'the total is still shown');
    assert.equal(readiness.activePlans, 0, 'but nothing is sellable');
    assert.equal(readiness.status, 'blocked');
    assert.match(readiness.blockers[0], /all 9 of its plans are switched off/);
  });

  test('no plans at all reads differently from plans that are switched off', () => {
    const readiness = providerReadiness(provider({ is_active: false }), []);
    assert.match(readiness.blockers[0], /no plans yet/);
  });

  test('a missing sign-up link blocks publication', () => {
    const readiness = providerReadiness(
      provider({ is_active: false, affiliate_url: null, website_url: null }),
      [plan()]
    );
    assert.equal(readiness.status, 'blocked');
    assert.match(readiness.blockers.join(' '), /no affiliate link or website/);
  });

  test('the has_affiliate_program flag alone does not make a supplier publishable', () => {
    const readiness = providerReadiness(
      provider({ is_active: false, has_affiliate_program: true, affiliate_url: null, website_url: null }),
      [plan()]
    );
    assert.equal(readiness.canPublish, false, 'a flag is not a link');
  });

  test('no states selected blocks publication', () => {
    const readiness = providerReadiness(
      provider({ is_active: false, supported_states: [] }), [plan()]
    );
    assert.match(readiness.blockers.join(' '), /no states are selected/);
  });

  test('on but broken is its own state, not "live"', () => {
    const readiness = providerReadiness(provider({ is_active: true }), []);
    assert.equal(readiness.status, 'incomplete');
    assert.equal(readiness.published, false, 'a page with nothing on it is not published work');
  });

  test('off but sound is "ready" — one click, no surprises', () => {
    const readiness = providerReadiness(provider({ is_active: false }), [plan()]);
    assert.equal(readiness.status, 'ready');
    assert.ok(readiness.canPublish);
  });

  test('every status has a label the panel can print', () => {
    for (const status of ['live', 'incomplete', 'ready', 'blocked']) {
      assert.ok(STATUS_LABELS[status], `${status} has no label`);
    }
  });
});

describe('the panel warns before a switch does something expensive', () => {
  test('taking down a live supplier names the cost, in search terms', () => {
    const p = provider();
    const warning = toggleWarning(p, providerReadiness(p, [plan(), plan()]), false);
    assert.ok(warning, 'unpublishing a working supplier must not be silent');
    assert.match(warning.body, /sitemap/);
    assert.match(warning.body, /providers\/stub-energy/);
    assert.match(warning.body, /2 plans/);
  });

  test('publishing a supplier with nothing to sell says what is missing', () => {
    const p = provider({ is_active: false });
    const warning = toggleWarning(p, providerReadiness(p, []), true);
    assert.ok(warning);
    assert.match(warning.body, /no plans yet/);
    assert.match(warning.body, /nothing to compare/);
  });

  test('publishing a ready supplier just happens', () => {
    const p = provider({ is_active: false });
    assert.equal(toggleWarning(p, providerReadiness(p, [plan()]), true), null);
  });

  test('taking down a supplier that was already broken just happens', () => {
    // Nothing was being published, so nothing is lost — do not cry wolf.
    const p = provider({ is_active: true });
    assert.equal(toggleWarning(p, providerReadiness(p, []), false), null);
  });
});

describe('the catalog summary reports the state nobody notices', () => {
  const plans = [
    plan({ provider_name: 'Live One' }),
    plan({ provider_name: 'Ready One' }),
    plan({ provider_name: 'Broken One', is_active: false }),
  ];
  const providers = [
    provider({ id: 'a', name: 'Live One', is_active: true }),
    provider({ id: 'b', name: 'Ready One', is_active: false }),
    provider({ id: 'c', name: 'Broken One', is_active: true }),
    provider({ id: 'd', name: 'Blocked One', is_active: false }),
  ];

  test('counts each state, and surfaces on-but-broken as the risk', () => {
    const summary = catalogReadiness(providers, plans);
    assert.equal(summary.total, 4);
    assert.equal(summary.live, 1);
    assert.equal(summary.ready, 1);
    assert.equal(summary.incomplete, 1, 'Broken One is on with no sellable plan');
    assert.equal(summary.blocked, 1);
    assert.equal(summary.atRisk, summary.incomplete);
  });

  test('an empty catalog does not throw', () => {
    assert.deepEqual(catalogReadiness(), { total: 0, live: 0, incomplete: 0, ready: 0, blocked: 0, atRisk: 0 });
  });
});
