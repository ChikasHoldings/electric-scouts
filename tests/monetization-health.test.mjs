/**
 * Monetization health — `npm test`.
 *
 * These numbers go in front of investors, so the distinction they encode is
 * pinned: a click we can attribute is not the same as a click that can pay us.
 * Conflating them would overstate revenue readiness.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  providerRevenueState,
  summarize,
  prioritizedGaps,
  BLOCKERS,
  BLOCKER_LABELS,
  BLOCKER_ACTIONS,
} from '../src/lib/monetizationHealth.js';
import { isCommissionCapable } from '../api/_lib/referral.js';

const TRACKED_URL = 'https://www.awin1.com/cread.php?awinmid=68048&awinaffid=2793046';
const PLAIN_URL = 'https://www.txu.com/en/residential/plans-and-pricing';

const provider = (o = {}) => ({ id: 'pr-1', name: 'TXU Energy', is_active: true, logo_url: null, ...o });
const link = (o = {}) => ({ slug: 's', provider_id: 'pr-1', target_url: TRACKED_URL, is_active: true, ...o });

const stateOf = (p, links, plans) => providerRevenueState(p, links, plans, isCommissionCapable);

describe('tracked is not the same as earning', () => {
  test('a real affiliate-network link earns and is tracked', () => {
    const s = stateOf(provider(), [link()], 5);
    assert.equal(s.earning, true);
    assert.equal(s.tracked, true);
    assert.deepEqual(s.blockers, []);
  });

  test('a plain provider page is tracked but earns nothing', () => {
    // This is the state of 36 of the 38 configured links.
    const s = stateOf(provider(), [link({ target_url: PLAIN_URL })], 5);
    assert.equal(s.tracked, true, 'the click is still recorded');
    assert.equal(s.earning, false, 'but it cannot pay');
    assert.equal(s.primaryBlocker, BLOCKERS.NOT_COMMISSION_CAPABLE);
  });

  test('the blocker copy says plainly that it earns nothing', () => {
    assert.match(BLOCKER_LABELS[BLOCKERS.NOT_COMMISSION_CAPABLE], /earns nothing/i);
    assert.match(BLOCKER_ACTIONS[BLOCKERS.NOT_COMMISSION_CAPABLE], /tracked affiliate-network URL/i);
  });
});

describe('blockers', () => {
  test('an inactive provider cannot earn, whatever else is configured', () => {
    const s = stateOf(provider({ is_active: false }), [link()], 5);
    assert.equal(s.earning, false);
    assert.equal(s.tracked, false);
    assert.equal(s.primaryBlocker, BLOCKERS.PROVIDER_INACTIVE);
  });

  test('a provider with no active plans cannot earn', () => {
    const s = stateOf(provider(), [link()], 0);
    assert.equal(s.earning, false);
    assert.ok(s.blockers.includes(BLOCKERS.NO_ACTIVE_PLANS));
  });

  test('no configured link at all', () => {
    const s = stateOf(provider(), [], 5);
    assert.equal(s.primaryBlocker, BLOCKERS.NO_AFFILIATE_LINK);
  });

  test('a link that exists but is switched off is distinguished from none', () => {
    // Different fix: re-activate versus create.
    const s = stateOf(provider(), [link({ is_active: false })], 5);
    assert.equal(s.primaryBlocker, BLOCKERS.LINK_INACTIVE);
  });

  test('one tracked link among several plain ones is enough to earn', () => {
    const s = stateOf(provider(), [link({ target_url: PLAIN_URL }), link({ slug: 's2' })], 5);
    assert.equal(s.earning, true);
    assert.equal(s.commissionCapableCount, 1);
  });

  test('every blocker has a label and an action', () => {
    for (const b of Object.values(BLOCKERS)) {
      assert.ok(BLOCKER_LABELS[b], `${b} has no label`);
      assert.ok(BLOCKER_ACTIONS[b], `${b} has no action`);
    }
  });

  test('the primary blocker is the most blocking one', () => {
    // An inactive provider with no link should say "inactive" first — fixing
    // the link alone would still earn nothing.
    const s = stateOf(provider({ is_active: false }), [], 0);
    assert.equal(s.primaryBlocker, BLOCKERS.PROVIDER_INACTIVE);
  });
});

describe('portfolio rollup', () => {
  const states = [
    stateOf(provider({ id: 'a', name: 'Earning Co' }), [link()], 10),
    stateOf(provider({ id: 'b', name: 'Plain Co' }), [link({ target_url: PLAIN_URL })], 30),
    stateOf(provider({ id: 'c', name: 'No Link Co' }), [], 5),
    stateOf(provider({ id: 'd', name: 'Retired Co', is_active: false }), [link()], 0),
  ];

  test('counts providers by revenue state', () => {
    const s = summarize(states);
    assert.equal(s.providers, 4);
    assert.equal(s.activeProviders, 3);
    assert.equal(s.earningProviders, 1);
    assert.equal(s.trackedProviders, 2, 'Plain Co is tracked but not earning');
  });

  test('reports the share of visible inventory that can actually pay', () => {
    // The commercially meaningful number: 10 earning plans of 45 active.
    const s = summarize(states);
    assert.equal(s.activePlans, 45);
    assert.equal(s.earningPlans, 10);
    assert.equal(s.earningPlanShare, 22);
  });

  test('tracked plans exceed earning plans, which is the honest picture', () => {
    const s = summarize(states);
    assert.ok(s.trackedPlans > s.earningPlans);
    assert.equal(s.trackedPlans, 40);
  });

  test('an empty catalog reports 0 rather than NaN', () => {
    const s = summarize([]);
    assert.equal(s.earningPlanShare, 0);
    assert.equal(s.activePlans, 0);
  });

  test('counts active providers missing a logo', () => {
    assert.equal(summarize(states).providersMissingLogo, 3);
  });
});

describe('prioritized gaps', () => {
  test('the provider with the most inventory behind a blocker comes first', () => {
    const states = [
      stateOf(provider({ id: 'a' }), [], 3),
      stateOf(provider({ id: 'b' }), [link({ target_url: PLAIN_URL })], 30),
      stateOf(provider({ id: 'c' }), [], 12),
    ];
    assert.deepEqual(prioritizedGaps(states).map((r) => r.providerId), ['b', 'c', 'a']);
  });

  test('already-earning providers are not listed as gaps', () => {
    const states = [stateOf(provider({ id: 'ok' }), [link()], 10)];
    assert.deepEqual(prioritizedGaps(states), []);
  });

  test('inactive providers are not listed — retiring one is not a revenue gap', () => {
    const states = [stateOf(provider({ id: 'x', is_active: false }), [], 0)];
    assert.deepEqual(prioritizedGaps(states), []);
  });
});
