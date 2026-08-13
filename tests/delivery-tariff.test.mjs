/**
 * Delivery tariffs — `npm test`.
 *
 * The bug this module exists to fix: all 378 active plans carried a delivery
 * charge of 0, which the pricing engine reads as "not configured", so nothing
 * on the site could publish a monthly bill or a savings comparison. Storing a
 * per-territory fact on every plan is what made it unfixable in practice —
 * 378 edits of a number with about seventeen real values.
 *
 * The assertion that matters most is the billing model. Adding a delivery
 * charge to an all-in rate double-charges the customer, and a confidently wrong
 * bill is worse than an honestly incomplete one.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  selectTerritory,
  resolveDelivery,
  canPriceCompletely,
  isEffective,
  coversZip,
  BILLING_MODELS,
} from '../src/lib/deliveryTariff.js';
import { estimateMonthlyCost } from '../src/components/compare/engine/planPricing.js';

const territory = (over = {}) => ({
  id: 't-1',
  name: 'Oncor',
  state: 'TX',
  billing_model: 'supply_only',
  delivery_per_kwh_cents: 4.85,
  fixed_monthly_delivery_charge: null,
  effective_from: '2026-01-01',
  effective_to: null,
  service_zip_prefixes: null,
  is_active: true,
  ...over,
});

const plan = (over = {}) => ({
  id: 'p-1',
  rate_per_kwh: 10,
  tdsp_charges: null,
  monthly_base_charge: null,
  usage_credit: null,
  ...over,
});

// ─── Effective dating ───────────────────────────────────────

describe('a tariff is in force only within its window', () => {
  test('a current tariff applies', () => {
    assert.equal(isEffective(territory(), '2026-08-13'), true);
  });

  test('a future tariff does not apply yet', () => {
    assert.equal(isEffective(territory({ effective_from: '2026-09-01' }), '2026-08-13'), false);
  });

  test('a superseded tariff stops applying', () => {
    assert.equal(isEffective(territory({ effective_to: '2026-06-30' }), '2026-08-13'), false);
  });

  test('the last day of a window is still inside it', () => {
    assert.equal(isEffective(territory({ effective_to: '2026-08-13' }), '2026-08-13'), true);
  });

  test('an inactive tariff never applies', () => {
    assert.equal(isEffective(territory({ is_active: false }), '2026-08-13'), false);
  });
});

// ─── Territory matching ─────────────────────────────────────

describe('a tariff covers the right ZIPs', () => {
  test('no prefixes means the whole state', () => {
    assert.equal(coversZip(territory(), '77001'), true);
    assert.equal(coversZip(territory({ service_zip_prefixes: [] }), '77001'), true);
  });

  test('prefixes restrict it to matching ZIPs', () => {
    const t = territory({ service_zip_prefixes: ['770', '772'] });
    assert.equal(coversZip(t, '77001'), true);
    assert.equal(coversZip(t, '75201'), false);
  });

  test('a prefixed tariff cannot match when no ZIP is known', () => {
    // The customer gave only a state. Guessing a territory would guess a price.
    assert.equal(coversZip(territory({ service_zip_prefixes: ['770'] }), ''), false);
  });
});

describe('selecting the tariff for a market', () => {
  test('the more specific territory wins over the state-wide fallback', () => {
    const statewide = territory({ id: 'wide', name: 'TX default', delivery_per_kwh_cents: 4 });
    const centerpoint = territory({
      id: 'cp', name: 'CenterPoint', service_zip_prefixes: ['770'], delivery_per_kwh_cents: 5.2,
    });

    const picked = selectTerritory([statewide, centerpoint], { state: 'TX', zip: '77001' }, '2026-08-13');
    assert.equal(picked.name, 'CenterPoint');
  });

  test('a ZIP outside the specific territory falls back to state-wide', () => {
    const statewide = territory({ id: 'wide', name: 'TX default' });
    const centerpoint = territory({ id: 'cp', name: 'CenterPoint', service_zip_prefixes: ['770'] });

    const picked = selectTerritory([statewide, centerpoint], { state: 'TX', zip: '75201' }, '2026-08-13');
    assert.equal(picked.name, 'TX default');
  });

  test('another state never leaks in', () => {
    const ohio = territory({ id: 'oh', state: 'OH', name: 'AEP Ohio' });
    assert.equal(selectTerritory([ohio], { state: 'TX', zip: '77001' }, '2026-08-13'), null);
  });

  test('the newer of two equally specific tariffs wins', () => {
    const old = territory({ id: 'a', name: 'old', effective_from: '2026-01-01', delivery_per_kwh_cents: 4 });
    const fresh = territory({ id: 'b', name: 'new', effective_from: '2026-07-01', delivery_per_kwh_cents: 5 });

    assert.equal(selectTerritory([old, fresh], { state: 'TX', zip: '77001' }, '2026-08-13').name, 'new');
  });

  test('selection is stable rather than dependent on row order', () => {
    const a = territory({ id: 'aaa', name: 'A' });
    const b = territory({ id: 'bbb', name: 'B' });

    const first = selectTerritory([a, b], { state: 'TX', zip: '77001' }, '2026-08-13');
    const second = selectTerritory([b, a], { state: 'TX', zip: '77001' }, '2026-08-13');
    assert.equal(first.id, second.id);
  });

  test('no configured tariff is null, not a guess', () => {
    assert.equal(selectTerritory([], { state: 'TX', zip: '77001' }), null);
    assert.equal(selectTerritory(null, { state: 'TX' }), null);
  });
});

// ─── Resolution ─────────────────────────────────────────────

describe('resolving what delivery costs', () => {
  test('the territory tariff is used when the plan has none', () => {
    const d = resolveDelivery(plan(), territory());
    assert.equal(d.perKwhCents, 4.85);
    assert.equal(d.source, 'territory');
  });

  test("a plan's own charge overrides the territory", () => {
    const d = resolveDelivery(plan({ tdsp_charges: 3.2 }), territory());
    assert.equal(d.perKwhCents, 3.2);
    assert.equal(d.source, 'plan');
  });

  test('a zero on the plan is the old sentinel, not an override', () => {
    // Migration 023 removed these, but a 0 arriving from anywhere must not be
    // read as "this plan has free delivery".
    const d = resolveDelivery(plan({ tdsp_charges: 0 }), territory());
    assert.equal(d.perKwhCents, 4.85);
    assert.equal(d.source, 'territory');
  });

  test('an all-in market adds nothing, because the rate already includes it', () => {
    const d = resolveDelivery(plan(), territory({ billing_model: 'all_in' }));
    assert.equal(d.perKwhCents, null);
    assert.equal(d.source, 'included');
    assert.equal(canPriceCompletely(d), true, 'all-in is complete without a delivery rate');
  });

  test("an all-in market ignores a plan's override rather than double-charging", () => {
    const d = resolveDelivery(plan({ tdsp_charges: 3.2 }), territory({ billing_model: 'all_in' }));
    assert.equal(d.perKwhCents, null);
    assert.equal(d.source, 'included');
  });

  test('no territory and no plan charge is honestly unknown', () => {
    const d = resolveDelivery(plan(), null);
    assert.equal(d.source, 'unknown');
    assert.equal(canPriceCompletely(d), false);
  });

  test('a territory verified to have no per-kWh charge is still complete', () => {
    // 0 on a tariff row means "checked, there is none" — unlike 0 on a plan,
    // which was only ever the schema default.
    const d = resolveDelivery(plan(), territory({ delivery_per_kwh_cents: 0 }));
    assert.equal(d.perKwhCents, 0);
    assert.equal(canPriceCompletely(d), true);
  });
});

// ─── The effect on a real estimate ──────────────────────────

describe('what a tariff does to the customer-facing number', () => {
  test('without a tariff the estimate stays supply-only', () => {
    const estimate = estimateMonthlyCost(plan(), 1000);
    assert.equal(estimate.confidence, 'partial');
    assert.match(estimate.caveats.join(' '), /delivery/i);
  });

  test('one tariff row makes the same plan fully priceable', () => {
    const delivery = resolveDelivery(plan(), territory());
    const estimate = estimateMonthlyCost(plan(), 1000, { delivery });

    assert.equal(estimate.confidence, 'complete');
    // 10¢ × 1000 kWh = $100 supply, plus 4.85¢ × 1000 = $48.50 delivery.
    assert.equal(Math.round(estimate.amount * 100) / 100, 148.5);
  });

  test('an all-in tariff is complete and adds nothing', () => {
    const delivery = resolveDelivery(plan(), territory({ billing_model: 'all_in' }));
    const estimate = estimateMonthlyCost(plan(), 1000, { delivery });

    assert.equal(estimate.confidence, 'complete');
    assert.equal(estimate.amount, 100, 'the advertised rate already covered delivery');
    assert.equal(estimate.components.delivery, undefined);
  });

  test('a fixed monthly delivery charge lands in the bill', () => {
    const delivery = resolveDelivery(
      plan(),
      territory({ delivery_per_kwh_cents: 4, fixed_monthly_delivery_charge: 5.47 })
    );
    const estimate = estimateMonthlyCost(plan(), 1000, { delivery });

    assert.equal(Math.round(estimate.amount * 100) / 100, 145.47);
    assert.equal(estimate.confidence, 'complete');
  });

  test('the supply subtotal never includes delivery, so ranking stays like for like', () => {
    const delivery = resolveDelivery(plan(), territory());
    const estimate = estimateMonthlyCost(plan(), 1000, { delivery });

    assert.equal(estimate.comparableAmount, 100);
  });
});
