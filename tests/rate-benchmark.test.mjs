/**
 * The market benchmark — `npm test`.
 *
 * The Bill Analyzer leads with a single sentence: how the customer's current
 * bill compares to what they could buy. That sentence was wrong in two ways at
 * once, and both are the kind of wrong that reads as authoritative:
 *
 *   1. it was measured against every plan row in the database — twelve states,
 *      business inventory, deactivated plans — instead of the plans sold at the
 *      customer's own address; and
 *   2. it compared their bill's effective rate, which INCLUDES utility
 *      delivery, against a plan's advertised rate, which excludes it. Every
 *      customer therefore appeared to be overpaying by roughly the delivery
 *      charge — an error the size of the entire finding.
 *
 * These tests pin the corrected behaviour: like-for-like totals, drawn from the
 * eligible set, and silence rather than a guess wherever the comparison cannot
 * be made honestly.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  benchmarkCurrentRate,
  benchmarkLabel,
  MIN_BENCHMARK_SAMPLE,
  BENCHMARK_LABELS,
} from '../src/components/compare/engine/rateBenchmark.js';
import { currentBillTrust, compareToCurrentBill } from '../src/components/compare/engine/savings.js';
import { PRICING_COMPLETENESS } from '../src/components/compare/engine/resultsContract.js';
import { runComparison } from '../api/_lib/comparison.js';
import { parseEntryParams } from '../src/components/compare/engine/entryContext.js';

/* ── Fixtures ─────────────────────────────────────────────────────── */

const USAGE = 1000;

/**
 * A fully-priced result at `monthly` dollars.
 *
 * `effectiveRate` is the total spread back over usage, which is exactly what
 * the contract publishes for a complete estimate.
 */
function pricedResult(planId, monthly) {
  return {
    planId,
    estimatedMonthlyCost: monthly,
    effectiveRate: (monthly / USAGE) * 100,
    pricingCompleteness: PRICING_COMPLETENESS.COMPLETE,
  };
}

/** A result we could only price for supply — no total, so no comparison. */
function partialResult(planId, supply) {
  return {
    planId,
    estimatedMonthlyCost: null,
    supplyEstimate: supply,
    effectiveRate: null,
    pricingCompleteness: PRICING_COMPLETENESS.PARTIAL,
  };
}

/** Six fully-priced plans from $120 to $170 a month at 1,000 kWh. */
function market() {
  return [120, 130, 140, 150, 160, 170].map((m, i) => pricedResult(`plan-${i}`, m));
}

/* ── The correctness argument ─────────────────────────────────────── */

describe('like-for-like comparison', () => {
  test('the customer is compared on totals, not against advertised supply rates', () => {
    // The bug this module replaces: a customer paying $150 for 1,000 kWh has an
    // all-in rate of 15¢. Against the cheapest plan's ADVERTISED supply rate of
    // 10¢ they look 50% over. Against that plan's real total of $120 — 12¢ all
    // in — they are 25% over, which is the true figure and the one a switch
    // would actually recover.
    const result = benchmarkCurrentRate(market(), {
      currentMonthlyCost: 150,
      usageKwh: USAGE,
    });

    assert.equal(result.available, true);
    assert.equal(result.basis, 'total');
    assert.equal(result.currentEffectiveRate, 15);
    assert.equal(result.bestEffectiveRate, 12);
    assert.equal(result.bestMonthlyCost, 120);
    assert.equal(result.overpaymentPercent, 25);
    assert.equal(result.monthlyOverpayment, 30);
    assert.equal(result.annualOverpayment, 360);
  });

  test('a plan we could not fully price is not in the comparison', () => {
    // A partial estimate is always too low, because the missing component is
    // always a charge. Letting one set the floor would invent an overpayment.
    const withCheapPartial = [...market(), partialResult('partial', 40)];

    const result = benchmarkCurrentRate(withCheapPartial, {
      currentMonthlyCost: 150,
      usageKwh: USAGE,
    });

    assert.equal(result.bestMonthlyCost, 120, 'the $40 supply-only subtotal must not become the floor');
    assert.equal(result.comparedCount, 6);
  });

  test('a customer already on the best available plan is not overpaying', () => {
    const result = benchmarkCurrentRate(market(), {
      currentMonthlyCost: 100,
      usageKwh: USAGE,
    });

    assert.equal(result.overpaymentPercent, 0, 'never a negative overpayment');
    assert.equal(result.monthlyOverpayment, 0);
    assert.equal(result.annualOverpayment, 0);
    assert.equal(result.cheaperCount, 0);
    assert.equal(result.score, 100);
  });
});

/* ── The score ────────────────────────────────────────────────────── */

describe('score is a percentile and nothing else', () => {
  test('it is the share of available plans the current bill beats', () => {
    // $145 beats the $150, $160 and $170 plans — three of six.
    const result = benchmarkCurrentRate(market(), {
      currentMonthlyCost: 145,
      usageKwh: USAGE,
    });

    assert.equal(result.cheaperCount, 3, 'three plans cost less than $145');
    assert.equal(result.comparedCount, 6);
    assert.equal(result.score, 50);
  });

  test('paying exactly what a plan costs is not losing to it', () => {
    // Ties count as beaten. A customer level with the cheapest plan in the
    // market has not been beaten by it.
    const result = benchmarkCurrentRate(market(), {
      currentMonthlyCost: 120,
      usageKwh: USAGE,
    });

    assert.equal(result.cheaperCount, 0);
    assert.equal(result.score, 100);
  });

  test('the worst bill in the market scores zero, not a floor', () => {
    const result = benchmarkCurrentRate(market(), {
      currentMonthlyCost: 400,
      usageKwh: USAGE,
    });

    assert.equal(result.score, 0);
    assert.equal(result.label, BENCHMARK_LABELS.poor);
  });

  test('labels band the percentile without overlapping', () => {
    assert.equal(benchmarkLabel(100), BENCHMARK_LABELS.excellent);
    assert.equal(benchmarkLabel(75), BENCHMARK_LABELS.excellent);
    assert.equal(benchmarkLabel(74), BENCHMARK_LABELS.good);
    assert.equal(benchmarkLabel(50), BENCHMARK_LABELS.good);
    assert.equal(benchmarkLabel(49), BENCHMARK_LABELS.fair);
    assert.equal(benchmarkLabel(25), BENCHMARK_LABELS.fair);
    assert.equal(benchmarkLabel(24), BENCHMARK_LABELS.poor);
    assert.equal(benchmarkLabel(0), BENCHMARK_LABELS.poor);
  });
});

/* ── Refusing to answer ───────────────────────────────────────────── */

describe('silence beats a guess', () => {
  test('too few fully-priced plans means no benchmark at all', () => {
    const thin = market().slice(0, MIN_BENCHMARK_SAMPLE - 1);
    const result = benchmarkCurrentRate(thin, { currentMonthlyCost: 150, usageKwh: USAGE });

    assert.equal(result.available, false);
    assert.equal(result.reason, 'insufficient_priced_inventory');
    assert.equal(result.pricedCount, MIN_BENCHMARK_SAMPLE - 1);
  });

  test('a market of partial estimates alone yields nothing', () => {
    const allPartial = [120, 130, 140, 150, 160, 170].map((m, i) => partialResult(`p-${i}`, m));
    const result = benchmarkCurrentRate(allPartial, { currentMonthlyCost: 150, usageKwh: USAGE });

    assert.equal(result.available, false);
    assert.equal(result.reason, 'insufficient_priced_inventory');
  });

  test('no current bill, no benchmark', () => {
    for (const cost of [null, undefined, 0, -10, 'free', NaN]) {
      const result = benchmarkCurrentRate(market(), { currentMonthlyCost: cost, usageKwh: USAGE });
      assert.equal(result.available, false, `cost ${cost} produced a benchmark`);
      assert.equal(result.reason, 'no_current_bill');
    }
  });

  test('no usage, no benchmark', () => {
    const result = benchmarkCurrentRate(market(), { currentMonthlyCost: 150, usageKwh: 0 });
    assert.equal(result.available, false);
    assert.equal(result.reason, 'no_usage');
  });

  test('a non-array result set is handled rather than thrown on', () => {
    for (const input of [null, undefined, 'plans', 42]) {
      const result = benchmarkCurrentRate(input, { currentMonthlyCost: 150, usageKwh: USAGE });
      assert.equal(result.available, false);
    }
  });
});

/* ── The trust gate, shared with the savings line ─────────────────── */

describe('bill trust is decided once', () => {
  const COMPLETE_ESTIMATE = { amount: 120, confidence: PRICING_COMPLETENESS.COMPLETE };

  test('a low-confidence bill reading blocks both the savings line and the benchmark', () => {
    const state = {
      monthlyCost: 150,
      billAnalysisStatus: 'complete',
      billConfidence: 'low',
    };

    assert.equal(currentBillTrust(state).trusted, false);
    assert.equal(currentBillTrust(state).reason, 'bill_confidence_low');
    // The savings line reads the same verdict through the same function.
    assert.equal(compareToCurrentBill(COMPLETE_ESTIMATE, state).available, false);
    assert.equal(compareToCurrentBill(COMPLETE_ESTIMATE, state).reason, 'bill_confidence_low');
  });

  test('a figure awaiting the customer\'s confirmation blocks both', () => {
    const state = { monthlyCost: 150, unverifiedFields: ['monthlyUsageKwh'] };

    assert.equal(currentBillTrust(state).trusted, false);
    assert.equal(currentBillTrust(state).reason, 'unverified_inputs');
    assert.equal(compareToCurrentBill(COMPLETE_ESTIMATE, state).reason, 'unverified_inputs');
  });

  test('a confirmed bill unlocks both', () => {
    const state = {
      monthlyCost: 150,
      billAnalysisStatus: 'complete',
      billConfidence: 'high',
      unverifiedFields: [],
    };

    assert.equal(currentBillTrust(state).trusted, true);
    assert.equal(currentBillTrust(state).currentMonthly, 150);
    assert.equal(compareToCurrentBill(COMPLETE_ESTIMATE, state).available, true);
  });
});

/* ── Through the server ───────────────────────────────────────────── */

const PROVIDER = { id: 'prov-1', name: 'Alpha Energy', logo_url: null, is_active: true };

function planRow(id, rate) {
  return {
    id,
    plan_name: `Fixed ${id}`,
    provider_id: PROVIDER.id,
    provider_name: PROVIDER.name,
    rate_per_kwh: rate,
    contract_length: 12,
    plan_type: 'fixed',
    renewable_percentage: 0,
    monthly_base_charge: null,
    base_charge: null,
    // A delivery charge on the plan is what makes the estimate complete, which
    // is what makes it eligible for the benchmark.
    tdsp_charges: 4,
    usage_credit: null,
    usage_credit_threshold: null,
    early_termination_fee: 150,
    state: 'TX',
    customer_type: 'residential',
    is_active: true,
    provider: PROVIDER,
  };
}

function fakeSupabase({ plans = [], links = [] } = {}) {
  return {
    from(table) {
      const rows = table === 'electricity_plans' ? plans : links;
      const builder = {
        select() { return builder; },
        eq() { return builder; },
        in() { return builder; },
        then(resolve) { return Promise.resolve({ data: rows, error: null }).then(resolve); },
      };
      return builder;
    },
  };
}

/** Six Texas plans priced from 8¢ to 13¢ supply, plus 4¢ delivery. */
const CATALOG = [8, 9, 10, 11, 12, 13].map((rate, i) => planRow(`plan-${i}`, rate));

describe('the comparison endpoint publishes the benchmark', () => {
  test('a confirmed bill gets a benchmark drawn from its own market', async () => {
    const { ok, comparison } = await runComparison(fakeSupabase({ plans: CATALOG }), {
      zip: '77002',
      customerType: 'residential',
      monthlyUsageKwh: 1000,
      monthlyCost: 200,
      billAnalysisStatus: 'complete',
      billConfidence: 'high',
    });

    assert.equal(ok, true);
    assert.equal(comparison.benchmark.available, true);
    // Cheapest plan: 8¢ supply + 4¢ delivery = $120 at 1,000 kWh.
    assert.equal(comparison.benchmark.bestMonthlyCost, 120);
    assert.equal(comparison.benchmark.currentEffectiveRate, 20);
    assert.equal(comparison.benchmark.monthlyOverpayment, 80);
    assert.equal(comparison.benchmark.comparedCount, 6);
  });

  test('the benchmark is withheld when the bill has not been confirmed', async () => {
    const { comparison } = await runComparison(fakeSupabase({ plans: CATALOG }), {
      zip: '77002',
      customerType: 'residential',
      monthlyUsageKwh: 1000,
      monthlyCost: 200,
      billAnalysisStatus: 'complete',
      billConfidence: 'low',
    });

    assert.equal(comparison.benchmark.available, false);
    assert.equal(comparison.benchmark.reason, 'bill_confidence_low');
  });

  test('a comparison with no current bill reports why, not a zero', async () => {
    const { comparison } = await runComparison(fakeSupabase({ plans: CATALOG }), {
      zip: '77002',
      customerType: 'residential',
      monthlyUsageKwh: 1000,
    });

    assert.equal(comparison.benchmark.available, false);
    assert.equal(comparison.benchmark.reason, 'no_current_bill');
    assert.equal(comparison.benchmark.score, undefined, 'no score is published without a bill');
  });

  test('a crafted benchmark in the request body is not read', async () => {
    const { comparison } = await runComparison(fakeSupabase({ plans: CATALOG }), {
      zip: '77002',
      customerType: 'residential',
      monthlyUsageKwh: 1000,
      monthlyCost: 200,
      billConfidence: 'high',
      // Everything a client might hope to dictate.
      benchmark: { available: true, score: 99, overpaymentPercent: 0, annualOverpayment: 9999 },
      savingsScore: 99,
      overpaymentPercent: 0,
    });

    assert.equal(comparison.benchmark.score, 0, 'the real percentile, not the requested one');
    assert.equal(comparison.benchmark.annualOverpayment, 960);
  });

  test('the benchmark measures the whole eligible market, not the returned slice', async () => {
    // Twenty plans is more than MAX_RESULTS, so the list is capped at 13 while
    // the market it is measured against stays twenty.
    const wide = Array.from({ length: 20 }, (_, i) => planRow(`wide-${i}`, 8 + i * 0.25));

    const { comparison } = await runComparison(fakeSupabase({ plans: wide }), {
      zip: '77002',
      customerType: 'residential',
      monthlyUsageKwh: 1000,
      monthlyCost: 200,
      billConfidence: 'high',
    });

    assert.ok(comparison.results.length < 20, 'the returned list is capped');
    assert.equal(comparison.benchmark.comparedCount, 20, 'the market is not');
    assert.equal(comparison.counts.eligible, 20);
  });
});

/* ── The analyzer handoff ─────────────────────────────────────────── */

describe('the Bill Analyzer hands over what it already knows', () => {
  test('the current bill travels with the usage', () => {
    const { seed } = parseEntryParams('zip=75001&usage=1240&cost=182.50&entry=bill_analyzer');

    assert.equal(seed.monthlyUsageKwh, 1240);
    assert.equal(seed.monthlyCost, 182.5);
    assert.equal(seed.entryContext, 'bill_analyzer');
  });

  test('a cost with no usage is dropped', () => {
    // Cost alone cannot be turned into a comparable rate, so it would sit in
    // state doing nothing but making the session look more informed than it is.
    const { seed } = parseEntryParams('zip=75001&cost=182.50');
    assert.ok(!('monthlyCost' in seed));
  });

  test('an absurd or hostile cost is ignored', () => {
    for (const cost of ['-5', '0', 'NaN', '99999999', 'free']) {
      const { seed } = parseEntryParams(`zip=75001&usage=1000&cost=${cost}`);
      assert.ok(!('monthlyCost' in seed), `cost=${cost} was accepted`);
    }
  });

  test('the cost parameter is cleared from the address bar with the rest', async () => {
    const { ENTRY_PARAM_KEYS } = await import('../src/components/compare/engine/entryContext.js');
    assert.ok(
      ENTRY_PARAM_KEYS.includes('cost'),
      'a bookmarked URL must not keep somebody else\'s bill on it'
    );
  });
});
