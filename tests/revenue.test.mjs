import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clickAccrual,
  deliveryAccrual,
  statusForDeliveryStatus,
  summarizeRevenue,
  summarizeDeliveries,
  leadMonetizationState,
  money,
  REVENUE_STATUS,
  REVENUE_SOURCES,
} from '../src/lib/revenue.js';

/**
 * The rules that decide what the platform claims to have earned.
 *
 * The costly failure here is not a crash — it is a number that is quietly too
 * big. Most of these tests exist to pin down the cases where the honest answer
 * is "nothing", because those are the ones a permissive implementation gets
 * wrong in the flattering direction.
 */

// ─── Click accrual ──────────────────────────────────────────

test('a per-click link with a tracked destination accrues its configured rate', () => {
  const result = clickAccrual(
    { commission_model: 'per_click', commission_amount: 2.5 },
    true
  );
  assert.equal(result.accrues, true);
  assert.equal(result.amount, 2.5);
});

test('a link with no commission configured accrues nothing', () => {
  const result = clickAccrual({ commission_model: 'none' }, true);
  assert.equal(result.accrues, false);
  assert.equal(result.amount, 0);
  assert.equal(result.reason, 'no_commission_configured');
});

test('a per-click link pointing at an untracked page accrues nothing', () => {
  // Configured to pay, but the destination carries no network tracking, so the
  // network will never see the click. Accruing it would invent revenue.
  const result = clickAccrual(
    { commission_model: 'per_click', commission_amount: 2.5 },
    false
  );
  assert.equal(result.accrues, false);
  assert.equal(result.reason, 'destination_not_tracked');
});

test('per-signup and revenue-share accrue nothing from a click', () => {
  for (const model of ['per_signup', 'revenue_share']) {
    const result = clickAccrual({ commission_model: model, commission_amount: 40 }, true);
    assert.equal(result.accrues, false, `${model} must not accrue on a click`);
    assert.equal(result.reason, 'awaits_partner_confirmation');
  }
});

test('a per-click model with no rate set accrues nothing rather than zero-value rows', () => {
  const result = clickAccrual({ commission_model: 'per_click', commission_amount: null }, true);
  assert.equal(result.accrues, false);
  assert.equal(result.reason, 'no_rate_configured');
});

test('a missing link accrues nothing', () => {
  assert.equal(clickAccrual(null, true).accrues, false);
});

// ─── Delivery accrual ───────────────────────────────────────

test('a delivery accrues the price agreed at the time', () => {
  const result = deliveryAccrual({ price_at_delivery: 35 });
  assert.equal(result.accrues, true);
  assert.equal(result.amount, 35);
});

test('a delivery with no agreed price accrues nothing', () => {
  assert.equal(deliveryAccrual({ price_at_delivery: null }).accrues, false);
  assert.equal(deliveryAccrual({ price_at_delivery: 0 }).accrues, false);
});

test('a buyer response maps onto the right ledger status', () => {
  assert.equal(statusForDeliveryStatus('accepted'), REVENUE_STATUS.CONFIRMED);
  assert.equal(statusForDeliveryStatus('rejected'), REVENUE_STATUS.REVERSED);
  assert.equal(statusForDeliveryStatus('failed'), REVENUE_STATUS.REVERSED);
  assert.equal(statusForDeliveryStatus('delivered'), REVENUE_STATUS.PENDING);
});

// ─── The rollup ─────────────────────────────────────────────

const NOW = new Date('2026-08-13T12:00:00Z');

test('accrued revenue is never counted as earnings', () => {
  const summary = summarizeRevenue([
    { amount: 100, status: REVENUE_STATUS.PAID, source: 'lead_sale', occurred_at: NOW.toISOString() },
    { amount: 50, status: REVENUE_STATUS.CONFIRMED, source: 'lead_sale', occurred_at: NOW.toISOString() },
    { amount: 999, status: REVENUE_STATUS.PENDING, source: 'affiliate_click', occurred_at: NOW.toISOString() },
  ], { now: NOW });

  assert.equal(summary.received, 100);
  assert.equal(summary.confirmed, 50);
  // The whole point: 999 of accruals does not appear in earnings.
  assert.equal(summary.earned, 150);
  assert.equal(summary.accrued, 999);
});

test('reversed revenue is excluded from earnings and reported separately', () => {
  const summary = summarizeRevenue([
    { amount: 80, status: REVENUE_STATUS.CONFIRMED, source: 'lead_sale', occurred_at: NOW.toISOString() },
    { amount: 80, status: REVENUE_STATUS.REVERSED, source: 'lead_sale', occurred_at: NOW.toISOString() },
  ], { now: NOW });

  assert.equal(summary.earned, 80);
  assert.equal(summary.reversed, 80);
});

test('an empty ledger reports zero rather than NaN', () => {
  const summary = summarizeRevenue([], { now: NOW });
  assert.equal(summary.earned, 0);
  assert.equal(summary.accrued, 0);
  assert.equal(summary.events, 0);
  assert.deepEqual(summary.bySource, []);
});

test('malformed amounts do not poison the totals', () => {
  const summary = summarizeRevenue([
    { amount: 'not a number', status: REVENUE_STATUS.CONFIRMED, source: 'lead_sale', occurred_at: NOW.toISOString() },
    { amount: 25, status: REVENUE_STATUS.CONFIRMED, source: 'lead_sale', occurred_at: NOW.toISOString() },
  ], { now: NOW });

  assert.equal(summary.earned, 25);
  assert.ok(Number.isFinite(summary.earned));
});

test('this-month figures exclude prior months', () => {
  const summary = summarizeRevenue([
    { amount: 10, status: REVENUE_STATUS.CONFIRMED, source: 'lead_sale', occurred_at: '2026-08-02T00:00:00Z' },
    { amount: 500, status: REVENUE_STATUS.CONFIRMED, source: 'lead_sale', occurred_at: '2026-07-15T00:00:00Z' },
  ], { now: NOW });

  assert.equal(summary.earned, 510);
  assert.equal(summary.earnedThisMonth, 10);
});

test('source and partner breakdowns split earned from accrued', () => {
  const summary = summarizeRevenue([
    { amount: 40, status: REVENUE_STATUS.CONFIRMED, source: REVENUE_SOURCES.LEAD_SALE, partner_name: 'Broker A', occurred_at: NOW.toISOString() },
    { amount: 5, status: REVENUE_STATUS.PENDING, source: REVENUE_SOURCES.AFFILIATE_CLICK, partner_name: 'TXU', occurred_at: NOW.toISOString() },
  ], { now: NOW });

  const leadSales = summary.bySource.find((s) => s.source === REVENUE_SOURCES.LEAD_SALE);
  assert.equal(leadSales.earned, 40);
  assert.equal(leadSales.accrued, 0);

  const broker = summary.byPartner.find((p) => p.partner === 'Broker A');
  assert.equal(broker.earned, 40);

  const txu = summary.byPartner.find((p) => p.partner === 'TXU');
  assert.equal(txu.earned, 0);
  assert.equal(txu.accrued, 5);
});

test('money rounds to cents and never returns NaN', () => {
  assert.equal(money(1.005), 1.01);
  assert.equal(money('12.349'), 12.35);
  assert.equal(money(undefined), 0);
  assert.equal(money('abc'), 0);
});

// ─── Deliveries ─────────────────────────────────────────────

test('acceptance rate is measured over decided leads only', () => {
  const summary = summarizeDeliveries([
    { status: 'accepted', price_at_delivery: 30 },
    { status: 'rejected', price_at_delivery: 30 },
    // Still in flight — counting this as a rejection would make a healthy
    // buyer look bad on their first day.
    { status: 'delivered', price_at_delivery: 30 },
  ]);

  assert.equal(summary.acceptanceRate, 50);
  assert.equal(summary.awaitingDecision, 1);
  assert.equal(summary.acceptedValue, 30);
});

test('acceptance rate is null, not zero, before any buyer has decided', () => {
  const summary = summarizeDeliveries([{ status: 'delivered', price_at_delivery: 30 }]);
  // Zero would read as "every buyer rejected us", which is a very different
  // and much worse story than "nobody has answered yet".
  assert.equal(summary.acceptanceRate, null);
});

// ─── Per-lead state ─────────────────────────────────────────

test('a lead with no deliveries is unrouted', () => {
  const state = leadMonetizationState({ id: 'lead-1' }, []);
  assert.equal(state.state, 'unrouted');
  assert.equal(state.value, 0);
});

test('an accepted delivery makes a lead sold, at the agreed price', () => {
  const state = leadMonetizationState({ id: 'lead-1' }, [
    { lead_id: 'lead-1', status: 'accepted', price_at_delivery: 45 },
  ]);
  assert.equal(state.state, 'sold');
  assert.equal(state.value, 45);
});

test('another lead\'s deliveries never count toward this one', () => {
  const state = leadMonetizationState({ id: 'lead-1' }, [
    { lead_id: 'lead-2', status: 'accepted', price_at_delivery: 45 },
  ]);
  assert.equal(state.state, 'unrouted');
  assert.equal(state.value, 0);
});

test('a sale outranks a still-pending second offer', () => {
  const state = leadMonetizationState({ id: 'lead-1' }, [
    { lead_id: 'lead-1', status: 'delivered', price_at_delivery: 20 },
    { lead_id: 'lead-1', status: 'accepted', price_at_delivery: 45 },
  ]);
  assert.equal(state.state, 'sold');
  assert.equal(state.value, 45);
});

test('a lead every buyer rejected is reported as rejected', () => {
  const state = leadMonetizationState({ id: 'lead-1' }, [
    { lead_id: 'lead-1', status: 'rejected', price_at_delivery: 20 },
    { lead_id: 'lead-1', status: 'rejected', price_at_delivery: 25 },
  ]);
  assert.equal(state.state, 'rejected');
});
