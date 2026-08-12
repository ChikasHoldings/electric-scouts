/**
 * Public eligibility — `npm test`.
 *
 * These pin the rule that was NOT being enforced when this suite was written.
 * At that moment production held 29 plans an admin had deactivated which were
 * still publicly visible, 5 of them in a single TX residential search, because
 * /compare-rates filtered on state and customer type alone and never joined
 * the provider at all.
 *
 * RLS does not cover this: both public SELECT policies are `USING (true)`.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  checkEligibility,
  filterEligible,
  INELIGIBLE_REASONS,
  REASON_LABELS,
  AUDIENCE_TYPES,
} from '../src/components/compare/engine/eligibility.js';

const activeProvider = { id: 'pr-1', name: 'Active Energy', is_active: true };
const inactiveProvider = { id: 'pr-2', name: 'Retired Energy', is_active: false };

const plan = (o = {}) => ({
  id: 'pl-1', plan_name: 'Plan', provider_id: 'pr-1', provider_name: 'Active Energy',
  rate_per_kwh: 10, state: 'TX', customer_type: 'residential', is_active: true, ...o,
});

const ctx = { state: 'TX', customerType: 'residential' };

describe('the active matrix — only one of four combinations is public', () => {
  test('active plan + active provider → eligible', () => {
    const r = checkEligibility(plan(), activeProvider, ctx);
    assert.equal(r.eligible, true);
    assert.equal(r.reason, null);
  });

  test('INACTIVE plan + active provider → blocked', () => {
    const r = checkEligibility(plan({ is_active: false }), activeProvider, ctx);
    assert.equal(r.eligible, false);
    assert.equal(r.reason, INELIGIBLE_REASONS.PLAN_INACTIVE);
  });

  test('active plan + INACTIVE provider → blocked', () => {
    // The case nothing enforced: deactivating a provider must remove its
    // plans regardless of each plan's own is_active.
    const r = checkEligibility(plan({ provider_id: 'pr-2' }), inactiveProvider, ctx);
    assert.equal(r.eligible, false);
    assert.equal(r.reason, INELIGIBLE_REASONS.PROVIDER_INACTIVE);
  });

  test('inactive plan + inactive provider → blocked, provider reported first', () => {
    // Provider is the more actionable reason for an admin: fixing the plan
    // alone would not publish it.
    const r = checkEligibility(plan({ is_active: false }), inactiveProvider, ctx);
    assert.equal(r.eligible, false);
    assert.equal(r.reason, INELIGIBLE_REASONS.PROVIDER_INACTIVE);
  });

  test('filtering a mixed set yields only the fully active plan', () => {
    const rows = [
      { ...plan({ id: 'a' }), provider: activeProvider },
      { ...plan({ id: 'b', is_active: false }), provider: activeProvider },
      { ...plan({ id: 'c' }), provider: inactiveProvider },
      { ...plan({ id: 'd', is_active: false }), provider: inactiveProvider },
    ];
    assert.deepEqual(filterEligible(rows, ctx).map((r) => r.id), ['a']);
  });
});

describe('provider linkage', () => {
  test('a plan with no provider row is blocked, not silently shown', () => {
    const r = checkEligibility(plan(), null, ctx);
    assert.equal(r.eligible, false);
    assert.equal(r.reason, INELIGIBLE_REASONS.PROVIDER_MISSING);
  });

  test('a null is_active is treated as inactive', () => {
    // An unclassified row is not something to publish by default.
    assert.equal(checkEligibility(plan(), { id: 'x', is_active: null }, ctx).eligible, false);
    assert.equal(checkEligibility(plan({ is_active: null }), activeProvider, ctx).eligible, false);
  });

  test('eligibility never depends on the provider NAME matching', () => {
    // Renaming a provider must not orphan its plans — the join is by id.
    const renamed = { id: 'pr-1', name: 'Completely New Name', is_active: true };
    const stalePlan = plan({ provider_name: 'Old Name' });
    assert.equal(checkEligibility(stalePlan, renamed, ctx).eligible, true);
  });
});

describe('market and audience', () => {
  test('a plan from another state is excluded', () => {
    assert.equal(checkEligibility(plan({ state: 'IL' }), activeProvider, ctx).reason,
      INELIGIBLE_REASONS.WRONG_STATE);
  });

  test('business plans are excluded from a residential search', () => {
    assert.equal(checkEligibility(plan({ customer_type: 'business' }), activeProvider, ctx).reason,
      INELIGIBLE_REASONS.WRONG_CUSTOMER_TYPE);
  });

  test('residential plans are excluded from a commercial search', () => {
    const r = checkEligibility(plan(), activeProvider, { state: 'TX', customerType: 'commercial' });
    assert.equal(r.reason, INELIGIBLE_REASONS.WRONG_CUSTOMER_TYPE);
  });

  test('renewable is a residential product, not a third audience', () => {
    // Matching strictly on 'residential' would hide every green plan from the
    // people who came looking for one.
    assert.equal(checkEligibility(plan({ customer_type: 'renewable' }), activeProvider, ctx).eligible, true);
    assert.ok(AUDIENCE_TYPES.residential.includes('renewable'));
  });

  test('unclassified inventory is visible to the residential audience', () => {
    assert.equal(checkEligibility(plan({ customer_type: null }), activeProvider, ctx).eligible, true);
  });

  test('omitting context checks publishability rather than a specific search', () => {
    // What admin diagnostics want: "would this ever be publishable".
    assert.equal(checkEligibility(plan({ state: 'IL' }), activeProvider, {}).eligible, true);
  });
});

describe('pricing sanity', () => {
  test('a plan with no usable rate cannot be compared', () => {
    for (const rate of [0, null, undefined, -1, 'abc']) {
      const r = checkEligibility(plan({ rate_per_kwh: rate }), activeProvider, ctx);
      assert.equal(r.eligible, false, `rate ${rate} should block`);
      assert.equal(r.reason, INELIGIBLE_REASONS.NO_RATE);
    }
  });
});

describe('admin diagnostics', () => {
  test('every reason has a human-readable label', () => {
    for (const reason of Object.values(INELIGIBLE_REASONS)) {
      assert.ok(REASON_LABELS[reason], `${reason} has no label`);
    }
  });

  test('the provider-inactive label names the actual blocker', () => {
    assert.match(REASON_LABELS[INELIGIBLE_REASONS.PROVIDER_INACTIVE], /provider/i);
  });
});
