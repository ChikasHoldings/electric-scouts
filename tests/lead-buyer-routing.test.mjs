/**
 * Lead buyer matching — `npm test`.
 *
 * The promise this pins: adding an active row in Admin is the ONLY step needed
 * for a signed buyer to start receiving matching leads. Every rule here is one
 * that would otherwise silently stop that from happening.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  checkBuyer,
  selectBuyer,
  rankBuyers,
  atCapacity,
  summarizeCoverage,
  REJECTION,
  REJECTION_LABELS,
} from '../src/lib/leadBuyerRouting.js';

const buyer = (o = {}) => ({
  id: 'b-1', name: 'Acme Leads', is_active: true,
  customer_types: [], states: [], accepts_renewable: true,
  requires_phone: false, min_lead_score: null,
  price_per_lead: 20, priority: 0,
  monthly_cap: null, delivered_this_period: 0, period_started_at: null,
  delivery_method: 'email', delivery_email: 'leads@acme.test',
  ...o,
});

const lead = (o = {}) => ({
  customerType: 'residential', state: 'TX', phone: '+14695551234',
  energyPreference: '', leadScore: 5, ...o,
});

describe('a newly added buyer receives leads with no extra setup', () => {
  test('an active buyer with blank restrictions matches everything', () => {
    // Blank means "no restriction". Treating it as "none" would mean a new
    // buyer silently receives nothing until every field is filled in.
    const { buyer: chosen } = selectBuyer([buyer()], lead());
    assert.equal(chosen?.id, 'b-1');
  });

  test('an inactive buyer receives nothing', () => {
    const r = checkBuyer(buyer({ is_active: false }), lead());
    assert.equal(r.eligible, false);
    assert.equal(r.reason, REJECTION.INACTIVE);
  });

  test('activating is the only change needed', () => {
    const off = buyer({ is_active: false });
    assert.equal(selectBuyer([off], lead()).buyer, null);
    assert.equal(selectBuyer([{ ...off, is_active: true }], lead()).buyer?.id, 'b-1');
  });
});

describe('targeting', () => {
  test('customer type is honoured', () => {
    const commercialOnly = buyer({ customer_types: ['commercial'] });
    assert.equal(checkBuyer(commercialOnly, lead({ customerType: 'residential' })).reason,
      REJECTION.WRONG_CUSTOMER_TYPE);
    assert.equal(checkBuyer(commercialOnly, lead({ customerType: 'commercial' })).eligible, true);
  });

  test('state coverage is honoured and case-insensitive', () => {
    const texas = buyer({ states: ['tx', 'IL'] });
    assert.equal(checkBuyer(texas, lead({ state: 'TX' })).eligible, true);
    assert.equal(checkBuyer(texas, lead({ state: 'OH' })).reason, REJECTION.WRONG_STATE);
  });

  test('a buyer can decline renewable leads', () => {
    const noGreen = buyer({ accepts_renewable: false });
    assert.equal(checkBuyer(noGreen, lead({ energyPreference: 'renewable' })).reason,
      REJECTION.NO_RENEWABLE);
    assert.equal(checkBuyer(noGreen, lead()).eligible, true);
  });
});

describe('quality gates', () => {
  test('a buyer requiring a phone rejects a lead without one', () => {
    assert.equal(checkBuyer(buyer({ requires_phone: true }), lead({ phone: null })).reason,
      REJECTION.NEEDS_PHONE);
  });

  test('a minimum score is enforced', () => {
    const picky = buyer({ min_lead_score: 7 });
    assert.equal(checkBuyer(picky, lead({ leadScore: 5 })).reason, REJECTION.BELOW_MIN_SCORE);
    assert.equal(checkBuyer(picky, lead({ leadScore: 8 })).eligible, true);
  });

  test('no minimum configured accepts any score', () => {
    assert.equal(checkBuyer(buyer({ min_lead_score: null }), lead({ leadScore: 0 })).eligible, true);
  });
});

describe('capacity', () => {
  const now = new Date('2026-08-15T00:00:00Z');

  test('no cap configured never blocks', () => {
    assert.equal(atCapacity(buyer({ monthly_cap: null, delivered_this_period: 9999 }), now), false);
  });

  test('a reached cap blocks within the same month', () => {
    const full = buyer({
      monthly_cap: 10, delivered_this_period: 10, period_started_at: '2026-08-01T00:00:00Z',
    });
    assert.equal(atCapacity(full, now), true);
    assert.equal(checkBuyer(full, lead(), { now }).reason, REJECTION.AT_CAPACITY);
  });

  test('a counter from a previous month does not block today', () => {
    // The failure mode of a counter with no period attached: delivery stops
    // forever once the cap is hit, and never resumes.
    const stale = buyer({
      monthly_cap: 10, delivered_this_period: 10, period_started_at: '2026-07-01T00:00:00Z',
    });
    assert.equal(atCapacity(stale, now), false);
  });

  test('below the cap is fine', () => {
    const room = buyer({
      monthly_cap: 10, delivered_this_period: 9, period_started_at: '2026-08-01T00:00:00Z',
    });
    assert.equal(atCapacity(room, now), false);
  });
});

describe('choosing among several buyers', () => {
  test('priority wins over price', () => {
    // Routing to whoever pays most rather than whoever can serve the customer
    // is how a comparison service stops deserving its traffic.
    const rich = buyer({ id: 'rich', name: 'Rich', price_per_lead: 100, priority: 0 });
    const preferred = buyer({ id: 'preferred', name: 'Preferred', price_per_lead: 10, priority: 5 });
    assert.equal(selectBuyer([rich, preferred], lead()).buyer.id, 'preferred');
  });

  test('price separates buyers of equal priority', () => {
    const a = buyer({ id: 'a', name: 'A', price_per_lead: 10, priority: 1 });
    const b = buyer({ id: 'b', name: 'B', price_per_lead: 30, priority: 1 });
    assert.equal(selectBuyer([a, b], lead()).buyer.id, 'b');
  });

  test('ordering is stable when priority and price tie', () => {
    const x = buyer({ id: 'x', name: 'Zeta', price_per_lead: 10 });
    const y = buyer({ id: 'y', name: 'Alpha', price_per_lead: 10 });
    assert.equal(rankBuyers([x, y])[0].id, 'y');
    assert.equal(rankBuyers([y, x])[0].id, 'y', 'input order must not matter');
  });

  test('an ineligible high-priority buyer does not block a lower one', () => {
    const blocked = buyer({ id: 'blocked', priority: 9, states: ['IL'] });
    const usable = buyer({ id: 'usable', priority: 1 });
    assert.equal(selectBuyer([blocked, usable], lead({ state: 'TX' })).buyer.id, 'usable');
  });
});

describe('no double-selling', () => {
  test('a buyer who already received this lead is skipped', () => {
    const r = checkBuyer(buyer(), lead(), { alreadyDeliveredTo: ['b-1'] });
    assert.equal(r.reason, REJECTION.ALREADY_DELIVERED);
  });

  test('a retry falls through to the next eligible buyer', () => {
    const first = buyer({ id: 'first', priority: 5 });
    const second = buyer({ id: 'second', priority: 1 });
    const { buyer: chosen } = selectBuyer([first, second], lead(), { alreadyDeliveredTo: ['first'] });
    assert.equal(chosen.id, 'second');
  });
});

describe('admin diagnostics', () => {
  test('every rejection reason has a label', () => {
    for (const reason of Object.values(REJECTION)) {
      assert.ok(REJECTION_LABELS[reason], `${reason} has no label`);
    }
  });

  test('a lead nobody can take reports why each buyer declined', () => {
    const buyers = [
      buyer({ id: 'a', name: 'A', states: ['IL'] }),
      buyer({ id: 'b', name: 'B', requires_phone: true }),
    ];
    const coverage = summarizeCoverage(buyers, lead({ state: 'TX', phone: null }));
    assert.equal(coverage.matched, false);
    assert.equal(coverage.rejected.length, 2);
    assert.deepEqual(coverage.rejected.map((r) => r.reason),
      [REJECTION.WRONG_STATE, REJECTION.NEEDS_PHONE]);
  });

  test('no buyers configured is reported distinctly from no match', () => {
    // Different problems: one needs an agreement signed, the other needs
    // targeting widened.
    assert.equal(summarizeCoverage([], lead()).noBuyersConfigured, true);
    assert.equal(summarizeCoverage([buyer({ states: ['IL'] })], lead()).noBuyersConfigured, false);
  });

  test('a match reports the price agreed at that moment', () => {
    const coverage = summarizeCoverage([buyer({ price_per_lead: 42.5 })], lead());
    assert.equal(coverage.matched, true);
    assert.equal(coverage.priceAtDelivery, 42.5);
  });
});
