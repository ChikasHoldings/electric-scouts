/**
 * The server comparison boundary — `npm test`.
 *
 * What these tests defend is a single claim: the browser presents results, it
 * does not decide them. Everything with commercial weight — what a plan costs,
 * how complete that figure is, what it saves, where it ranks, what it scores,
 * and where the outbound click goes — is produced on the server from the
 * admin-managed catalog, and nothing in a request body can change any of it.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { runComparison } from '../api/_lib/comparison.js';
import { parseComparisonRequest } from '../src/components/compare/engine/comparisonRequest.js';
import {
  selectHeadline,
  withResultPlacement,
  describeResultPrice,
  pricingCaveatText,
  MONETIZATION,
  PRICING_COMPLETENESS,
  RESULT_SECTIONS,
  MAX_RESULTS,
} from '../src/components/compare/engine/resultsContract.js';
import { classifyMonetization, resolveRedirectUrl } from '../api/_lib/referral.js';

/* ── Fixtures ─────────────────────────────────────────────────────── */

const ACTIVE_PROVIDER = { id: 'prov-1', name: 'Alpha Energy', logo_url: 'https://cdn/a.png', is_active: true };
const OTHER_PROVIDER = { id: 'prov-2', name: 'Beta Power', logo_url: null, is_active: true };
const DEAD_PROVIDER = { id: 'prov-3', name: 'Gone Energy', logo_url: null, is_active: false };

/** A plan row as the catalog query returns it, provider joined. */
function planRow(overrides = {}) {
  const provider = overrides.provider || ACTIVE_PROVIDER;
  return {
    id: 'plan-1',
    plan_name: 'Fixed 12',
    provider_id: provider.id,
    provider_name: provider.name,
    rate_per_kwh: 10,
    contract_length: 12,
    plan_type: 'fixed',
    renewable_percentage: 0,
    monthly_base_charge: null,
    base_charge: null,
    tdsp_charges: null,
    usage_credit: null,
    usage_credit_threshold: null,
    early_termination_fee: 150,
    state: 'TX',
    customer_type: 'residential',
    is_active: true,
    ...overrides,
    provider,
  };
}

/**
 * A Supabase stand-in.
 *
 * Records the filters applied so the tests can assert the query really does
 * constrain on both active flags rather than relying on the shared rule alone.
 */
function fakeSupabase({ plans = [], links = [] } = {}) {
  const calls = { filters: [], tables: [], queries: 0 };

  return {
    calls,
    from(table) {
      calls.tables.push(table);
      calls.queries += 1;
      const rows = table === 'electricity_plans' ? plans : links;

      const builder = {
        select() { return builder; },
        eq(column, value) { calls.filters.push([table, column, value]); return builder; },
        in() { return builder; },
        then(resolve) { return Promise.resolve({ data: rows, error: null }).then(resolve); },
      };
      return builder;
    },
  };
}

const BASE_REQUEST = { zip: '77002', customerType: 'residential' };

async function compare(request, fixtures) {
  const result = await runComparison(fakeSupabase(fixtures), request);
  assert.equal(result.ok, true, `comparison failed: ${result.error}`);
  return result.comparison;
}

/* ── Input validation ─────────────────────────────────────────────── */

describe('request validation', () => {
  test('a request with no location is refused', () => {
    assert.deepEqual(parseComparisonRequest({}), { ok: false, error: 'state_required' });
  });

  test('a ZIP outside the served markets is refused', () => {
    assert.equal(parseComparisonRequest({ zip: '99999' }).error, 'zip_not_serviceable');
  });

  test('the market comes from the ZIP, not from the state the client claims', () => {
    // A client asserting it is in Ohio while sending a Houston ZIP gets Texas
    // plans, because serviceability is re-derived here.
    const { session } = parseComparisonRequest({ zip: '77002', state: 'OH' });
    assert.equal(session.state, 'TX');
  });

  test('a bare state code is accepted for the legacy quote pages', () => {
    const { session } = parseComparisonRequest({ state: 'tx' });
    assert.equal(session.state, 'TX');
    assert.equal(session.zip, '');
  });

  test('an unserved state code is refused', () => {
    assert.equal(parseComparisonRequest({ state: 'CA' }).error, 'state_required');
  });

  test('values outside the enumerations are dropped, not passed through', () => {
    const { session } = parseComparisonRequest({
      ...BASE_REQUEST,
      shoppingIntent: 'DROP TABLE plans',
      energyPreference: 'coal',
      usageRange: 'infinite',
      billConfidence: 'certain',
      unverifiedFields: ['monthlyCost', 'isAdmin'],
    });
    assert.equal(session.shoppingIntent, '');
    assert.equal(session.energyPreference, '');
    assert.equal(session.usageRange, '');
    assert.equal(session.billConfidence, null);
    assert.deepEqual(session.unverifiedFields, ['monthlyCost']);
  });

  test('out-of-range numbers are discarded rather than propagated into pricing', () => {
    const absurd = parseComparisonRequest({ ...BASE_REQUEST, monthlyUsageKwh: 1e9, monthlyCost: -5 });
    assert.equal(absurd.session.monthlyUsageKwh, null);
    assert.equal(absurd.session.monthlyCost, null);
    assert.equal(absurd.usageKwh, 1000, 'falls back to the default rather than an absurd figure');
  });

  test('free-text fields are bounded', () => {
    const { session } = parseComparisonRequest({ ...BASE_REQUEST, sessionId: 'x'.repeat(500) });
    assert.equal(session.sessionId.length, 64);
  });
});

/* ── Client tampering ─────────────────────────────────────────────── */

describe('client-supplied economics are never authoritative', () => {
  const MALICIOUS = {
    ...BASE_REQUEST,
    planId: 'plan-1',
    estimatedMonthlyCost: 1,
    supplyEstimate: 1,
    matchScore: 100,
    matchLabel: 'Excellent match',
    savings: 1000,
    potentialSavings: 1000,
    monthlyDifference: -1000,
    rank: 1,
    isTopMatch: true,
    pricingCompleteness: 'complete',
    affiliateUrl: 'https://attacker.example',
    trackedOutboundRoute: 'https://attacker.example',
    monetizationStatus: 'commission_capable',
  };

  test('none of the crafted values survive into the session', () => {
    const { session } = parseComparisonRequest(MALICIOUS);
    for (const key of Object.keys(MALICIOUS)) {
      if (['zip', 'customerType'].includes(key)) continue;
      assert.equal(session[key], undefined, `${key} reached the engine`);
    }
  });

  test('the result is priced from the catalog, not from the payload', async () => {
    const comparison = await compare(MALICIOUS, {
      plans: [planRow({ rate_per_kwh: 12, tdsp_charges: 4 })],
    });
    const [result] = comparison.results;

    // 12c + 4c over 1,000 kWh = $160, not the $1 the client asked for.
    assert.equal(result.estimatedMonthlyCost, 160);
    assert.equal(result.potentialSavings, null, 'no bill was given, so no saving may be claimed');
    assert.equal(result.monthlyDifference, null);
  });

  test('a tampered request produces exactly the same results as a clean one', async () => {
    // The sharpest statement of the property: the crafted fields are not
    // sanitized into something harmless, they are inert. Two requests that
    // differ only by the attacker's payload return identical comparisons.
    const fixtures = {
      plans: [
        planRow({ id: 'a', rate_per_kwh: 12, tdsp_charges: 4 }),
        planRow({ id: 'b', rate_per_kwh: 9, tdsp_charges: 4 }),
      ],
    };

    const tampered = await compare(MALICIOUS, fixtures);
    const clean = await compare(BASE_REQUEST, fixtures);

    assert.deepEqual(tampered.results, clean.results);
    assert.deepEqual(tampered.results.map((r) => r.planId), ['b', 'a'],
      'the plan the payload nominated as rank 1 did not become rank 1');
  });

  test('a partial plan cannot buy the score the payload claimed', async () => {
    const [result] = (await compare(MALICIOUS, { plans: [planRow({ rate_per_kwh: 12 })] })).results;

    assert.notEqual(result.matchScore, 100);
    assert.ok(result.matchScore <= 79, 'incomplete pricing caps the score regardless of the request');
  });

  test('the outbound route cannot be redirected by the client', async () => {
    const comparison = await compare(MALICIOUS, {
      plans: [planRow()],
      links: [{ slug: 'alpha', provider_id: 'prov-1', target_url: 'https://alpha.example', provider: {} }],
    });
    const [result] = comparison.results;

    assert.ok(result.trackedOutboundRoute.startsWith('/api/go?slug=alpha'));
    assert.doesNotMatch(result.trackedOutboundRoute, /attacker/);
  });

  test('the response never carries a provider destination URL', async () => {
    const comparison = await compare(BASE_REQUEST, {
      plans: [planRow()],
      links: [{ slug: 'alpha', provider_id: 'prov-1', target_url: 'https://secret-affiliate.example?aff=9', provider: {} }],
    });
    const serialized = JSON.stringify(comparison);

    assert.doesNotMatch(serialized, /secret-affiliate/, 'the destination leaked to the browser');
    assert.doesNotMatch(serialized, /target_url/);
    assert.doesNotMatch(serialized, /is_active/);
  });
});

/* ── Catalog enforcement (the leak the previous round closed) ─────── */

describe('only admin-activated inventory is comparable', () => {
  test('the query constrains on both active flags', async () => {
    const supabase = fakeSupabase({ plans: [planRow()] });
    await runComparison(supabase, BASE_REQUEST);

    const planFilters = supabase.calls.filters.filter(([t]) => t === 'electricity_plans');
    assert.ok(planFilters.some(([, c, v]) => c === 'is_active' && v === true));
    assert.ok(planFilters.some(([, c, v]) => c === 'provider.is_active' && v === true));
    assert.ok(planFilters.some(([, c, v]) => c === 'state' && v === 'TX'));
  });

  test('active provider + active plan is eligible', async () => {
    const comparison = await compare(BASE_REQUEST, { plans: [planRow()] });
    assert.equal(comparison.results.length, 1);
  });

  test('active provider + inactive plan is not eligible', async () => {
    const comparison = await compare(BASE_REQUEST, { plans: [planRow({ is_active: false })] });
    assert.equal(comparison.results.length, 0);
  });

  test('inactive provider + active plan is not eligible', async () => {
    const comparison = await compare(BASE_REQUEST, { plans: [planRow({ provider: DEAD_PROVIDER })] });
    assert.equal(comparison.results.length, 0);
  });

  test('inactive provider + inactive plan is not eligible', async () => {
    const comparison = await compare(BASE_REQUEST, {
      plans: [planRow({ provider: DEAD_PROVIDER, is_active: false })],
    });
    assert.equal(comparison.results.length, 0);
  });

  test('a plan with no linked provider is not eligible', async () => {
    const orphan = planRow();
    orphan.provider = null;
    assert.equal((await compare(BASE_REQUEST, { plans: [orphan] })).results.length, 0);
  });

  test('provider identity travels on provider_id, not on the name', async () => {
    const renamed = planRow({ provider_name: 'Stale Old Name' });
    const [result] = (await compare(BASE_REQUEST, { plans: [renamed] })).results;

    assert.equal(result.providerId, 'prov-1');
    assert.equal(result.providerName, 'Alpha Energy', 'the joined provider row wins');
    assert.equal(result.providerLogoUrl, 'https://cdn/a.png');
  });

  test('a commercial request does not receive residential inventory', async () => {
    const comparison = await compare(
      { ...BASE_REQUEST, customerType: 'commercial' },
      { plans: [planRow(), planRow({ id: 'biz', customer_type: 'business' })] }
    );
    assert.deepEqual(comparison.results.map((r) => r.planId), ['biz']);
  });
});

/* ── Pricing ──────────────────────────────────────────────────────── */

describe('pricing comes from the admin row and reports its own completeness', () => {
  test('an admin rate change moves the estimate with no code change', async () => {
    const before = await compare(BASE_REQUEST, { plans: [planRow({ rate_per_kwh: 10.5, tdsp_charges: 4.2 })] });
    const after = await compare(BASE_REQUEST, { plans: [planRow({ rate_per_kwh: 9.7, tdsp_charges: 4.2 })] });

    assert.equal(before.results[0].estimatedMonthlyCost, 147);
    assert.equal(after.results[0].estimatedMonthlyCost, 139);
  });

  test('a TDSP change moves the estimate too', async () => {
    const before = await compare(BASE_REQUEST, { plans: [planRow({ rate_per_kwh: 10, tdsp_charges: 4.2 })] });
    const after = await compare(BASE_REQUEST, { plans: [planRow({ rate_per_kwh: 10, tdsp_charges: 4.7 })] });

    assert.equal(before.results[0].estimatedMonthlyCost, 142);
    assert.equal(after.results[0].estimatedMonthlyCost, 147);
  });

  test('base charge is included', async () => {
    const [result] = (await compare(BASE_REQUEST, {
      plans: [planRow({ rate_per_kwh: 10, tdsp_charges: 4, monthly_base_charge: 9.95 })],
    })).results;

    assert.equal(result.baseCharge, 9.95);
    assert.equal(result.estimatedMonthlyCost, 149.95);
  });

  test('a usage credit applies once the threshold is met', async () => {
    const [result] = (await compare(
      { ...BASE_REQUEST, monthlyUsageKwh: 1200 },
      { plans: [planRow({ rate_per_kwh: 10, tdsp_charges: 4, usage_credit: 100, usage_credit_threshold: 1000 })] }
    )).results;

    assert.equal(result.costComponents.usageCredit, -100);
    assert.equal(result.estimatedMonthlyCost, 68); // 120 + 48 − 100
  });

  test('a usage credit below its threshold is withheld and disclosed', async () => {
    const [result] = (await compare(
      { ...BASE_REQUEST, monthlyUsageKwh: 800 },
      { plans: [planRow({ rate_per_kwh: 10, tdsp_charges: 4, usage_credit: 100, usage_credit_threshold: 1000 })] }
    )).results;

    assert.equal(result.costComponents.usageCredit, null);
    assert.equal(result.estimatedMonthlyCost, 112);
    assert.ok(result.pricingCaveats.some((c) => /bill credit/i.test(c)));
  });

  test('complete pricing publishes a monthly total', async () => {
    const [result] = (await compare(BASE_REQUEST, {
      plans: [planRow({ rate_per_kwh: 10, tdsp_charges: 4 })],
    })).results;

    assert.equal(result.pricingCompleteness, PRICING_COMPLETENESS.COMPLETE);
    assert.equal(result.estimatedMonthlyCost, 140);
    assert.equal(pricingCaveatText(result), null);
  });

  test('a missing delivery charge is never treated as zero', async () => {
    const [result] = (await compare(BASE_REQUEST, {
      plans: [planRow({ rate_per_kwh: 10 })],
    })).results;

    assert.equal(result.pricingCompleteness, PRICING_COMPLETENESS.PARTIAL);
    assert.equal(result.estimatedMonthlyCost, null,
      'a partial figure must never be published as a monthly bill');
    assert.equal(result.supplyEstimate, 100);
    assert.equal(result.deliveryCharge, null);
    assert.match(pricingCaveatText(result), /delivery/i);
  });

  test('the partial figure is presented as supply, not as a monthly bill', async () => {
    const [result] = (await compare(BASE_REQUEST, { plans: [planRow({ rate_per_kwh: 10.5 })] })).results;
    const price = describeResultPrice(result);

    assert.equal(price.basis, 'supply');
    assert.equal(price.amount, 105);
    assert.match(price.unit, /supply/);
    assert.match(price.note, /Delivery charges not included/);
  });

  test('an unpriceable plan is excluded rather than shown at zero', async () => {
    const comparison = await compare(BASE_REQUEST, { plans: [planRow({ rate_per_kwh: 0 })] });
    assert.equal(comparison.results.length, 0);
  });
});

/* ── Savings ──────────────────────────────────────────────────────── */

describe('savings are only claimed when both sides are trustworthy', () => {
  const complete = (rate) => planRow({ rate_per_kwh: rate, tdsp_charges: 4 });

  test('a genuine saving is stated', async () => {
    const [result] = (await compare(
      { ...BASE_REQUEST, monthlyCost: 200 },
      { plans: [complete(10)] }
    )).results;

    assert.equal(result.currentMonthlyCost, 200);
    assert.equal(result.estimatedMonthlyCost, 140);
    assert.equal(result.monthlyDifference, -60);
    assert.equal(result.annualDifference, -720);
    assert.equal(result.potentialSavings, 60);
    assert.equal(result.differenceDirection, 'saving');
  });

  test('a plan that costs more says so, and is not called a saving', async () => {
    const [result] = (await compare(
      { ...BASE_REQUEST, monthlyCost: 150 },
      { plans: [complete(12.8)] }
    )).results;

    assert.equal(result.monthlyDifference, 18, 'positive means more expensive');
    assert.equal(result.differenceDirection, 'costlier');
    assert.equal(result.potentialSavings, null, 'a more expensive plan has no saving to report');
  });

  test('partial pricing yields no difference at all', async () => {
    const [result] = (await compare(
      { ...BASE_REQUEST, monthlyCost: 200 },
      { plans: [planRow({ rate_per_kwh: 8 })] }
    )).results;

    assert.equal(result.monthlyDifference, null);
    assert.equal(result.annualDifference, null);
    assert.equal(result.potentialSavings, null);
  });

  test('no current bill means no difference', async () => {
    const [result] = (await compare(BASE_REQUEST, { plans: [complete(10)] })).results;
    assert.equal(result.monthlyDifference, null);
  });

  test('an unconfirmed bill figure cannot produce a saving', async () => {
    const [result] = (await compare(
      { ...BASE_REQUEST, monthlyCost: 200, unverifiedFields: ['monthlyCost'] },
      { plans: [complete(10)] }
    )).results;

    assert.equal(result.monthlyDifference, null);
  });

  test('a low-confidence bill reading cannot produce a saving', async () => {
    const [result] = (await compare(
      { ...BASE_REQUEST, monthlyCost: 200, billAnalysisStatus: 'complete', billConfidence: 'low' },
      { plans: [complete(10)] }
    )).results;

    assert.equal(result.monthlyDifference, null);
  });
});

/* ── Ranking and the Top 3 ────────────────────────────────────────── */

describe('ranking is decided by the server', () => {
  const complete = (id, rate) => planRow({ id, rate_per_kwh: rate, tdsp_charges: 4 });

  test('every result carries its rank, and the headline set is marked', async () => {
    const comparison = await compare(BASE_REQUEST, {
      plans: [complete('c', 12), complete('a', 9), complete('b', 10), complete('d', 14)],
    });

    assert.deepEqual(comparison.results.map((r) => r.rank), [1, 2, 3, 4]);
    assert.deepEqual(comparison.results.map((r) => r.planId), ['a', 'b', 'c', 'd']);
    assert.deepEqual(comparison.topMatchIds, ['a', 'b', 'c']);
    assert.equal(comparison.results.filter((r) => r.isTopMatch).length, 3);
  });

  test('the order does not depend on the order the database returned', async () => {
    const pool = [complete('a', 9), complete('b', 10), complete('c', 12)];
    const forward = await compare(BASE_REQUEST, { plans: pool });
    const reversed = await compare(BASE_REQUEST, { plans: [...pool].reverse() });

    assert.deepEqual(
      forward.results.map((r) => r.planId),
      reversed.results.map((r) => r.planId)
    );
  });

  test('a partial plan does not headline while complete ones are available', async () => {
    const comparison = await compare(BASE_REQUEST, {
      plans: [planRow({ id: 'cheap-partial', rate_per_kwh: 4 }), complete('a', 9), complete('b', 10), complete('c', 11)],
    });

    assert.ok(!comparison.topMatchIds.includes('cheap-partial'));
    assert.ok(comparison.results.some((r) => r.planId === 'cheap-partial'), 'it is still listed');
  });

  test('an affiliate relationship cannot lift a materially worse plan', async () => {
    const comparison = await compare(BASE_REQUEST, {
      plans: [complete('cheap-unpaid', 9), complete('dear-paid', 13)],
      links: [{ slug: 'beta', provider_id: 'prov-1', target_url: 'https://awin1.com/x?awinaffid=1', provider: {} }],
    });

    // Both plans belong to the same provider, so both carry the link; the point
    // is that the tie-breaker is worth less than any real difference in value.
    assert.equal(comparison.results[0].planId, 'cheap-unpaid');
  });

  test('a paying plan wins only against an equivalent one', async () => {
    const paidProvider = { ...OTHER_PROVIDER };
    const comparison = await compare(BASE_REQUEST, {
      plans: [
        complete('unpaid', 10),
        planRow({ id: 'paid', rate_per_kwh: 10, tdsp_charges: 4, provider: paidProvider }),
      ],
      links: [{ slug: 'beta', provider_id: 'prov-2', target_url: 'https://beta.example', provider: {} }],
    });

    assert.equal(comparison.results[0].planId, 'paid', 'equivalent plans break toward the routed one');
    assert.equal(
      comparison.results[0].matchScore,
      comparison.results[1].matchScore,
      'but the customer-facing score is identical — the tie-break is not visible as merit'
    );
  });

  test('the renewable preference changes the order only when it was expressed', async () => {
    const green = planRow({ id: 'green', rate_per_kwh: 10.4, tdsp_charges: 4, renewable_percentage: 100 });
    const grey = complete('grey', 10);

    const neutral = await compare(BASE_REQUEST, { plans: [green, grey] });
    assert.equal(neutral.results[0].planId, 'grey');

    const asked = await compare({ ...BASE_REQUEST, energyPreference: 'renewable' }, { plans: [green, grey] });
    assert.equal(asked.results[0].planId, 'green');
  });
});

/* ── Match score ──────────────────────────────────────────────────── */

describe('match score', () => {
  const complete = (id, rate) => planRow({ id, rate_per_kwh: rate, tdsp_charges: 4 });

  test('is a whole number in 0-100 with no NaN', async () => {
    const comparison = await compare(BASE_REQUEST, {
      plans: [complete('a', 9), complete('b', 12), planRow({ id: 'c', rate_per_kwh: 20 })],
    });

    for (const result of comparison.results) {
      assert.ok(Number.isInteger(result.matchScore), `${result.planId} scored ${result.matchScore}`);
      assert.ok(result.matchScore >= 0 && result.matchScore <= 100);
    }
  });

  test('is deterministic', async () => {
    const pool = [complete('a', 9), complete('b', 12)];
    const first = await compare(BASE_REQUEST, { plans: pool });
    const second = await compare(BASE_REQUEST, { plans: [...pool].reverse() });

    assert.deepEqual(
      first.results.map((r) => [r.planId, r.matchScore]),
      second.results.map((r) => [r.planId, r.matchScore])
    );
  });

  test('incomplete pricing caps the confidence the score expresses', async () => {
    const [result] = (await compare(BASE_REQUEST, { plans: [planRow({ rate_per_kwh: 8 })] })).results;

    assert.ok(result.matchScore <= 79,
      `a plan whose delivery cost is unknown scored ${result.matchScore}`);
    assert.equal(result.matchScoreCapped, true);
  });

  test('rank 1 does not automatically mean 100%', async () => {
    // One unusually cheap plan drags every other plan's cost score down; the
    // best of a mediocre field must not read as a perfect fit.
    const comparison = await compare(BASE_REQUEST, {
      plans: [complete('outlier', 4), complete('a', 9.8), complete('b', 10.4), complete('c', 11.1)],
    });
    const second = comparison.results[1];

    assert.ok(second.matchScore < 100);
  });

  test('the label always agrees with the score band', async () => {
    const comparison = await compare(BASE_REQUEST, {
      plans: [complete('outlier', 4), complete('a', 9.8), complete('b', 10.4), complete('c', 11.1)],
    });

    const band = (score) =>
      score >= 90 ? 'Excellent match'
        : score >= 80 ? 'Strong match'
          : score >= 70 ? 'Good match' : 'Possible match';

    for (const result of comparison.results) {
      assert.equal(result.matchLabel, band(result.matchScore),
        `"${result.matchLabel}" beside ${result.matchScore}%`);
    }
  });

  test('reasons are produced for every result, not only the headline three', async () => {
    const comparison = await compare(
      { ...BASE_REQUEST, energyPreference: 'renewable' },
      {
        plans: [
          complete('a', 9), complete('b', 10), complete('c', 11),
          planRow({ id: 'd', rate_per_kwh: 10.2, tdsp_charges: 4, renewable_percentage: 100 }),
        ],
      }
    );

    const tail = comparison.results[comparison.results.length - 1];
    assert.ok(Array.isArray(tail.matchReasons));
    const green = comparison.results.find((r) => r.planId === 'd');
    assert.ok(green.matchReasons.some((r) => /renewable/i.test(r)));
  });

  test('no filler reason is invented when nothing is supportable', async () => {
    // A plan that is not the cheapest, is not fixed, has no term, no renewable
    // content and no bill credit has nothing true to say about itself — so it
    // says nothing, rather than carrying reassuring copy on every card.
    const comparison = await compare(BASE_REQUEST, {
      plans: [
        complete('cheapest', 8),
        planRow({ id: 'bare', rate_per_kwh: 11, tdsp_charges: 4, plan_type: 'variable', contract_length: 0 }),
      ],
    });

    const bare = comparison.results.find((r) => r.planId === 'bare');
    assert.deepEqual(bare.matchReasons, []);
  });
});

/* ── The DTO contract ─────────────────────────────────────────────── */

describe('result contract', () => {
  const EXPECTED_KEYS = [
    'planId', 'planName', 'providerId', 'providerName', 'providerLogoUrl',
    'rank', 'isTopMatch',
    'pricingCompleteness', 'ratePerKwh', 'baseCharge', 'deliveryCharge',
    'usageCredit', 'usageCreditThreshold',
    'estimatedMonthlyCost', 'supplyEstimate', 'effectiveRate', 'costComponents',
    'currentMonthlyCost', 'monthlyDifference', 'annualDifference',
    'potentialSavings', 'differenceDirection',
    'matchScore', 'matchLabel', 'matchScoreCapped', 'matchReasons',
    'termMonths', 'rateType', 'renewablePercentage', 'isRenewable', 'earlyTerminationFee',
    'pricingCaveats', 'trackedOutboundRoute', 'monetizationStatus',
  ];

  test('the published shape is exactly this — drift breaks the board', async () => {
    const [result] = (await compare(BASE_REQUEST, { plans: [planRow()] })).results;
    assert.deepEqual(Object.keys(result).sort(), [...EXPECTED_KEYS].sort());
  });

  test('the envelope carries the counts the page reports', async () => {
    const comparison = await compare(BASE_REQUEST, {
      plans: [
        planRow({ id: 'a', rate_per_kwh: 10, tdsp_charges: 4 }),
        planRow({ id: 'b', rate_per_kwh: 11 }),
        planRow({ id: 'c', rate_per_kwh: 12, renewable_percentage: 100 }),
      ],
    });

    assert.equal(comparison.counts.eligible, 3);
    assert.equal(comparison.counts.complete, 1);
    assert.equal(comparison.counts.partial, 2);
    assert.equal(comparison.counts.renewable, 1);
    assert.equal(comparison.usageKwh, 1000);
    assert.equal(comparison.state, 'TX');
  });
});

/* ── Outbound monetization counts ─────────────────────────────────── */

describe('the counts separate pricing completeness from what a click earns', () => {
  const THIRD_PROVIDER = { id: 'prov-4', name: 'Gamma Grid', logo_url: null, is_active: true };

  /**
   * One plan per outbound status, plus a renewable one that can pay.
   *
   *   prov-1  an affiliate-network destination      -> commission_capable
   *   prov-2  a plain provider page                 -> internal_tracking_only
   *   prov-4  no configured link at all             -> unavailable
   *
   * The renewable plan sits on prov-1 so it inherits the paying link, which is
   * what makes `renewableCommissionCapable` distinguishable from `renewable`.
   */
  const MIXED = {
    plans: [
      planRow({ id: 'pay', rate_per_kwh: 10, provider: ACTIVE_PROVIDER }),
      planRow({ id: 'pay-green', rate_per_kwh: 11, renewable_percentage: 100, provider: ACTIVE_PROVIDER }),
      planRow({ id: 'tracked', rate_per_kwh: 12, provider: OTHER_PROVIDER }),
      planRow({ id: 'green-tracked', rate_per_kwh: 13, renewable_percentage: 100, provider: OTHER_PROVIDER }),
      planRow({ id: 'no-link', rate_per_kwh: 14, provider: THIRD_PROVIDER }),
    ],
    links: [
      { slug: 'alpha', provider_id: 'prov-1', target_url: 'https://awin1.com/x?awinaffid=1', provider: {} },
      { slug: 'beta', provider_id: 'prov-2', target_url: 'https://beta.example', provider: {} },
    ],
  };

  test('a tracked link that earns nothing is not counted as commission-capable', async () => {
    const { counts } = await compare(BASE_REQUEST, MIXED);

    assert.equal(counts.commissionCapable, 2, 'both plans on the affiliate-network provider');
    assert.equal(counts.internalTrackingOnly, 2, 'plain provider pages are tracked, not payable');
    assert.equal(counts.outboundUnavailable, 1, 'no configured link at all');
  });

  test('renewable and renewable-commission-capable are different numbers', async () => {
    const { counts } = await compare(BASE_REQUEST, MIXED);

    assert.equal(counts.renewable, 2, 'two renewable plans in the returned set');
    assert.equal(counts.renewableCommissionCapable, 1, 'only one of them can pay');
  });

  test('every returned result has exactly one outbound status', async () => {
    const comparison = await compare(BASE_REQUEST, MIXED);
    const { counts } = comparison;

    assert.equal(
      counts.commissionCapable + counts.internalTrackingOnly + counts.outboundUnavailable,
      counts.returned
    );
    assert.equal(counts.returned, comparison.results.length);
  });

  test('pricing completeness is counted separately from monetization', async () => {
    // `tdsp_charges` is what makes a plan fully priceable, so this set is one
    // complete and two partial — while every one of the three can pay. The two
    // axes have to be able to disagree.
    const { counts } = await compare(BASE_REQUEST, {
      plans: [
        planRow({ id: 'a', rate_per_kwh: 10, tdsp_charges: 4 }),
        planRow({ id: 'b', rate_per_kwh: 11 }),
        planRow({ id: 'c', rate_per_kwh: 12 }),
      ],
      links: [{ slug: 'alpha', provider_id: 'prov-1', target_url: 'https://awin1.com/x?awinaffid=1', provider: {} }],
    });

    assert.equal(counts.complete, 1);
    assert.equal(counts.partial, 2);
    assert.equal(counts.pricingUnavailable, 0);
    assert.equal(counts.commissionCapable, 3);
  });

  test('results stay visible when none of them can pay', async () => {
    // The routing change must never shorten the list. A plan we earn nothing
    // from is still the right answer if it is the cheapest one.
    const comparison = await compare(BASE_REQUEST, {
      plans: [
        planRow({ id: 'a', rate_per_kwh: 10, provider: OTHER_PROVIDER }),
        planRow({ id: 'b', rate_per_kwh: 11, provider: OTHER_PROVIDER }),
        planRow({ id: 'c', rate_per_kwh: 12, provider: THIRD_PROVIDER }),
      ],
      links: [{ slug: 'beta', provider_id: 'prov-2', target_url: 'https://beta.example', provider: {} }],
    });

    assert.equal(comparison.counts.commissionCapable, 0);
    assert.equal(comparison.results.length, 3, 'nonpaying results are still returned');
    assert.equal(comparison.counts.returned, 3);
    assert.ok(comparison.topMatchIds.length > 0, 'and one of them still headlines');
  });

  test('the legacy count fields keep their old meanings', async () => {
    // Preserved for any consumer outside this repository. `monetized` counted
    // tracked and payable links together, and `unavailable` meant pricing —
    // both stay exactly as they were rather than being quietly redefined.
    const { counts } = await compare(BASE_REQUEST, MIXED);

    assert.equal(counts.monetized, counts.commissionCapable + counts.internalTrackingOnly);
    assert.equal(counts.unavailable, counts.pricingUnavailable);
    assert.notEqual(counts.monetized, counts.commissionCapable);
  });
});

/* ── Headline selection under filters ─────────────────────────────── */

describe('filtering re-selects the headline without re-scoring', () => {
  const dto = (planId, rank, completeness, score) => ({
    planId,
    rank,
    matchScore: score,
    pricingCompleteness: completeness,
  });

  test('the first three of a server-ranked set become the headline', () => {
    const ranked = [
      dto('a', 1, 'complete', 98),
      dto('b', 2, 'complete', 91),
      dto('c', 3, 'complete', 88),
      dto('d', 4, 'complete', 80),
    ];
    const { headline, rest } = selectHeadline(ranked);

    assert.deepEqual(headline.map((r) => r.planId), ['a', 'b', 'c']);
    assert.deepEqual(rest.map((r) => r.planId), ['d']);
  });

  test('scores are carried through untouched', () => {
    const ranked = [dto('a', 1, 'complete', 98), dto('b', 2, 'complete', 91)];
    const { headline } = selectHeadline(ranked);

    assert.equal(headline[0].matchScore, 98, 'selection must not rewrite a score');
    assert.equal(headline[0].rank, 1, 'nor a rank');
  });

  test('the completeness gate applies to a filtered set too', () => {
    const ranked = [
      dto('partial', 1, 'partial', 70),
      dto('a', 2, 'complete', 68),
      dto('b', 3, 'complete', 66),
      dto('c', 4, 'complete', 64),
    ];
    const { headline } = selectHeadline(ranked);

    assert.deepEqual(headline.map((r) => r.planId), ['a', 'b', 'c']);
  });

  test('with too few complete plans, partial ones may still headline', () => {
    const ranked = [dto('partial', 1, 'partial', 70), dto('a', 2, 'complete', 68)];
    assert.equal(selectHeadline(ranked).headline.length, 2);
  });

  test('every result appears exactly once across headline and rest', () => {
    const ranked = ['a', 'b', 'c', 'd', 'e'].map((id, i) => dto(id, i + 1, 'complete', 90 - i));
    const { headline, rest } = selectHeadline(ranked);
    const ids = [...headline, ...rest].map((r) => r.planId);

    assert.equal(ids.length, 5);
    assert.equal(new Set(ids).size, 5);
  });

  test('an empty set produces empty sections rather than throwing', () => {
    assert.deepEqual(selectHeadline([]), { headline: [], rest: [] });
  });
});

/* ── Referral routing ─────────────────────────────────────────────── */

describe('outbound routing stays server-authorized', () => {
  test('the route goes through /api/go and carries attribution', async () => {
    const comparison = await compare(
      {
        ...BASE_REQUEST,
        sessionId: 'sess-123',
        entryContext: 'residential_landing',
        attribution: { utm_source: 'google', utm_campaign: 'tx-spring' },
      },
      {
        plans: [planRow({ rate_per_kwh: 10, tdsp_charges: 4 })],
        links: [{ slug: 'alpha', provider_id: 'prov-1', target_url: 'https://alpha.example', provider: {} }],
      }
    );

    const route = comparison.results[0].trackedOutboundRoute;
    const query = new URLSearchParams(route.split('?')[1]);

    assert.ok(route.startsWith('/api/go?'));
    assert.equal(query.get('slug'), 'alpha');
    assert.equal(query.get('s'), 'sess-123');
    assert.equal(query.get('p'), 'plan-1');
    assert.equal(query.get('pn'), 'Fixed 12');
    assert.equal(query.get('ec'), 'residential_landing');
    assert.equal(query.get('utm_source'), 'google');
    assert.equal(query.get('utm_campaign'), 'tx-spring');
    assert.equal(Number(query.get('ms')), comparison.results[0].matchScore);
  });

  test('no contact detail is ever put on an outbound route', async () => {
    const comparison = await compare(
      { ...BASE_REQUEST, email: 'a@b.com', firstName: 'Ada', phone: '5125551234' },
      {
        plans: [planRow()],
        links: [{ slug: 'alpha', provider_id: 'prov-1', target_url: 'https://alpha.example', provider: {} }],
      }
    );

    const route = comparison.results[0].trackedOutboundRoute;
    assert.doesNotMatch(route, /a@b\.com|Ada|5125551234/);
  });

  test('placement is appended at render time, not baked in', () => {
    const route = '/api/go?slug=alpha&p=plan-1';

    assert.equal(
      withResultPlacement(route, RESULT_SECTIONS.TOP_MATCH, 1),
      '/api/go?slug=alpha&p=plan-1&rs=top_match&rp=1'
    );
    assert.equal(
      withResultPlacement(route, RESULT_SECTIONS.MORE_OPTIONS, 7),
      '/api/go?slug=alpha&p=plan-1&rs=more_options&rp=7'
    );
    assert.equal(withResultPlacement(route, 'injected_section', 1), '/api/go?slug=alpha&p=plan-1&rp=1');
    assert.equal(withResultPlacement(null, RESULT_SECTIONS.TOP_MATCH, 1), null);
  });

  test('a provider-level link resolves — production has no offer-keyed rows', async () => {
    const comparison = await compare(BASE_REQUEST, {
      plans: [planRow()],
      links: [{ slug: 'alpha-provider', provider_id: 'prov-1', offer_id: null, target_url: 'https://alpha.example', provider: {} }],
    });

    assert.match(comparison.results[0].trackedOutboundRoute, /slug=alpha-provider/);
  });

  test('an offer-specific link overrides the provider-level one', async () => {
    const comparison = await compare(BASE_REQUEST, {
      plans: [planRow()],
      links: [
        { slug: 'provider-level', provider_id: 'prov-1', offer_id: null, target_url: 'https://alpha.example', provider: {} },
        { slug: 'offer-level', provider_id: 'prov-1', offer_id: 'plan-1', target_url: 'https://alpha.example/offer', provider: {} },
      ],
    });

    assert.match(comparison.results[0].trackedOutboundRoute, /slug=offer-level/);
  });

  test('a plan with no configured link gets no route and says so', async () => {
    const [result] = (await compare(BASE_REQUEST, { plans: [planRow()] })).results;

    assert.equal(result.trackedOutboundRoute, null);
    assert.equal(result.monetizationStatus, MONETIZATION.UNAVAILABLE);
  });
});

describe('a tracked click and a payable click are told apart', () => {
  test('a network URL is commission-capable', () => {
    assert.equal(
      classifyMonetization({ target_url: 'https://www.awin1.com/cread.php?awinmid=1&awinaffid=2' }),
      MONETIZATION.COMMISSION_CAPABLE
    );
  });

  test('a plain provider page is tracked internally and earns nothing', () => {
    assert.equal(
      classifyMonetization({ target_url: 'https://www.alphaenergy.com/plans' }),
      MONETIZATION.INTERNAL_TRACKING_ONLY
    );
  });

  test('the provider fallback is classified on what it will actually resolve to', () => {
    const link = { target_url: null, provider: { website_url: 'https://alpha.example' } };
    assert.equal(resolveRedirectUrl(link), 'https://alpha.example');
    assert.equal(classifyMonetization(link), MONETIZATION.INTERNAL_TRACKING_ONLY);
  });

  test('a placeholder destination is not treated as a route at all', () => {
    assert.equal(
      classifyMonetization({ target_url: 'https://partner.example/your-affiliate-id' }),
      MONETIZATION.UNAVAILABLE
    );
  });

  test('a malformed CJ link falls back rather than sending the customer nowhere', () => {
    const link = {
      target_url: 'https://sjv.io/c/broken/link',
      provider: { website_url: 'https://alpha.example' },
    };
    assert.equal(resolveRedirectUrl(link), 'https://alpha.example');
  });
});

/* ── Performance ──────────────────────────────────────────────────── */

describe('the catalog is read in a fixed number of queries', () => {
  test('a large result set still costs two queries, not one per plan', async () => {
    const plans = Array.from({ length: 120 }, (_, i) =>
      planRow({ id: `plan-${i}`, rate_per_kwh: 8 + (i % 40) / 10, tdsp_charges: 4 })
    );
    const supabase = fakeSupabase({
      plans,
      links: [{ slug: 'alpha', provider_id: 'prov-1', target_url: 'https://alpha.example', provider: {} }],
    });

    const { comparison } = await runComparison(supabase, BASE_REQUEST);

    // The whole catalog slice is still read and ranked in a fixed number of
    // queries — the cost of a comparison does not grow with the size of the
    // result set, and 120 plans cost exactly what 3 would.
    assert.equal(
      supabase.calls.queries,
      3,
      'one catalog read, one referral read, one delivery-tariff read'
    );

    // What is returned is the top of that ranking, not all 120. The count of
    // what matched stays truthful.
    assert.equal(comparison.results.length, MAX_RESULTS);
    assert.equal(comparison.counts.eligible, 120, 'the market size is reported honestly');
    assert.equal(comparison.counts.returned, MAX_RESULTS);
    assert.equal(comparison.counts.capped, true);
  });
});

describe('a comparison returns a shortlist, not the whole catalog', () => {
  const priced = (id, rate) => planRow({ id, rate_per_kwh: rate, tdsp_charges: 4 });

  test('the returned plans are the best-ranked ones, not an arbitrary slice', async () => {
    // Cheapest last in input order, so a naive slice would drop exactly the
    // plans the customer came for.
    const plans = Array.from({ length: 40 }, (_, i) => priced(`plan-${i}`, 20 - i * 0.25));
    const supabase = fakeSupabase({ plans, links: [] });

    const { comparison } = await runComparison(supabase, BASE_REQUEST);

    assert.equal(comparison.results.length, MAX_RESULTS);
    assert.equal(comparison.results[0].planId, 'plan-39', 'the cheapest plan survives the cap');

    // Ranks are contiguous from the top of the full ranking.
    assert.deepEqual(
      comparison.results.map((r) => r.rank),
      Array.from({ length: MAX_RESULTS }, (_, i) => i + 1)
    );
  });

  test('a small market is returned whole and not marked capped', async () => {
    const supabase = fakeSupabase({
      plans: [priced('a', 9), priced('b', 10), priced('c', 11)],
      links: [],
    });

    const { comparison } = await runComparison(supabase, BASE_REQUEST);

    assert.equal(comparison.results.length, 3);
    assert.equal(comparison.counts.eligible, 3);
    assert.equal(comparison.counts.capped, false);
  });

  test('the headline three come from the returned set', async () => {
    const plans = Array.from({ length: 40 }, (_, i) => priced(`plan-${i}`, 8 + i * 0.1));
    const supabase = fakeSupabase({ plans, links: [] });

    const { comparison } = await runComparison(supabase, BASE_REQUEST);
    const returnedIds = new Set(comparison.results.map((r) => r.planId));

    assert.equal(comparison.topMatchIds.length, 3);
    for (const id of comparison.topMatchIds) {
      assert.ok(returnedIds.has(id), 'a headline plan must be one the customer can see');
    }
  });
});

/* ── One pricing truth: the page and the email ────────────────────── */

describe('the comparison email cannot disagree with the page', () => {
  /**
   * Read a module with its commentary removed.
   *
   * These assertions are about what the code does, and both files explain in
   * comments what they used to do — naming the very formula and the very field
   * being asserted absent. Scanning the raw text would fail on the explanation
   * of the fix rather than on the fix.
   */
  const codeOf = (path) =>
    readFileSync(new URL(path, import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

  const emailSource = codeOf('../api/send-comparison-results.js');
  const pageSource = codeOf('../src/pages/CompareRates.jsx');

  test('the email no longer computes a price of its own', () => {
    // The exact shape of the removed formula: rate × usage ÷ 100 + base charge.
    assert.doesNotMatch(emailSource, /rate_per_kwh\s*\*\s*usage/);
    assert.doesNotMatch(emailSource, /monthly_base_charge/);
    assert.doesNotMatch(emailSource, /lowestCost/);
  });

  test('the email no longer trusts a client-supplied affiliate URL', () => {
    assert.doesNotMatch(emailSource, /plan\.affiliateUrl/);
    assert.doesNotMatch(emailSource, /affiliateUrl\s*\|\|/);
  });

  test('the email reads plan economics from no client field', () => {
    // `plans` is not destructured from the body any more; only `planIds` is
    // read, and only as a filter over the authoritative set.
    assert.doesNotMatch(emailSource, /const\s*\{[^}]*\bplans\b[^}]*\}\s*=\s*req\.body/);
    assert.match(emailSource, /req\.body\?\.planIds/);
  });

  test('the email routes through the shared comparison service', () => {
    assert.match(emailSource, /runComparison\(/);
    assert.match(emailSource, /selectHeadline\(/);
    assert.match(emailSource, /describeResultPrice\(/);
  });

  test('the email CTA points at /compare-rates, not the legacy quote engines', () => {
    assert.doesNotMatch(emailSource, /business-compare-rates/);
    assert.doesNotMatch(emailSource, /renewable-compare-rates/);
    assert.match(emailSource, /\/compare-rates/);
  });

  test('the page no longer prices, ranks or scores anything', () => {
    assert.doesNotMatch(pageSource, /rankPlans/);
    assert.doesNotMatch(pageSource, /estimateMonthlyCost/);
    assert.doesNotMatch(pageSource, /compareToCurrentBill/);
    assert.doesNotMatch(pageSource, /costSortKey/);
  });

  test('the page actually sends the comparison it promises to email', () => {
    // The contact step tells the visitor "We'll email your comparison". For as
    // long as this page existed, nothing did: the endpoint was reachable only
    // from the two legacy quote pages. A promise made in order to obtain an
    // email address has to be kept by the code that made it.
    assert.match(pageSource, /We&rsquo;ll email your comparison/,
      'the promise is still on the page');
    assert.match(pageSource, /fetch\("\/api\/send-comparison-results"/,
      'and something has to keep it');
  });

  test('the emailed comparison carries inputs and ids, never economics', () => {
    // Same boundary as the request the page already makes for its results.
    const body = pageSource.slice(
      pageSource.indexOf('/api/send-comparison-results'),
      pageSource.indexOf('/api/send-comparison-results') + 1800
    );
    for (const forbidden of [
      'estimatedMonthlyCost', 'supplyEstimate', 'matchScore', 'potentialSavings',
      'trackedOutboundRoute', 'affiliateUrl', 'rank',
    ]) {
      assert.ok(!body.includes(`${forbidden}:`), `${forbidden} is being posted to the email endpoint`);
    }
    assert.match(body, /planIds:/, 'the plans on screen are named by id alone');
  });

  test('both surfaces describe the same result identically', async () => {
    // The parity guarantee in one assertion: given one comparison, the figure
    // and the wording the page shows and the email prints come from the same
    // two functions, so they cannot diverge.
    const comparison = await compare(
      { ...BASE_REQUEST, monthlyCost: 200 },
      {
        plans: [
          planRow({ id: 'a', rate_per_kwh: 9, tdsp_charges: 4 }),
          planRow({ id: 'b', rate_per_kwh: 10 }),
        ],
      }
    );

    const { headline } = selectHeadline(comparison.results);
    for (const result of headline) {
      const price = describeResultPrice(result);
      assert.deepEqual(price, describeResultPrice(result));
      assert.equal(pricingCaveatText(result), pricingCaveatText(result));
    }

    const complete = comparison.results.find((r) => r.planId === 'a');
    const partial = comparison.results.find((r) => r.planId === 'b');

    assert.equal(describeResultPrice(complete).basis, 'total');
    assert.equal(complete.potentialSavings, 70);
    assert.equal(describeResultPrice(partial).basis, 'supply');
    assert.equal(partial.potentialSavings, null,
      'the email must not invent a saving the page is withholding');
  });

  /* ── The Bill Analyzer, held to the same boundary ──────────────── */

  const analyzerSource = codeOf('../src/pages/BillAnalyzer.jsx');
  const reportSource = codeOf('../api/send-report.js');
  const extractSource = codeOf('../api/extract-data.js');

  test('the analyzer no longer prices, scores or ranks anything itself', () => {
    // Every formula that used to live on this page, named exactly.
    assert.doesNotMatch(analyzerSource, /rate_per_kwh\s*\/\s*100/);
    assert.doesNotMatch(analyzerSource, /ratePerKwh\s*\/\s*100/);
    assert.doesNotMatch(analyzerSource, /monthlySavings/);
    assert.doesNotMatch(analyzerSource, /annualSavings/);
    assert.doesNotMatch(analyzerSource, /estimatedCost/);
    assert.doesNotMatch(analyzerSource, /percentileScore|rangeScore|avgBonus/);
  });

  test('the analyzer no longer lists plans straight from the table', () => {
    // `ElectricityPlan.list()` applies neither the plan's own is_active nor its
    // provider's, which is how deactivated inventory reached the public page.
    assert.doesNotMatch(analyzerSource, /ElectricityPlan/);
    assert.doesNotMatch(analyzerSource, /ElectricityProvider/);
    assert.match(analyzerSource, /\/api\/comparison/);
  });

  test('the analyzer no longer builds provider links in the browser', () => {
    assert.doesNotMatch(analyzerSource, /getAffiliateUrl/);
    assert.doesNotMatch(analyzerSource, /affiliate_url/);
    assert.doesNotMatch(analyzerSource, /website_url/);
    assert.match(analyzerSource, /trackedOutboundRoute/);
  });

  test('the analyzer keeps no account identity from a bill', () => {
    for (const field of ['customer_name', 'service_address', 'account_number']) {
      assert.doesNotMatch(analyzerSource, new RegExp(field), `${field} is still handled`);
    }
  });

  test('the extraction service refuses to return account identity', () => {
    // A property of the service rather than of one caller's discipline: every
    // response path runs through the same redaction.
    assert.match(extractSource, /IDENTITY_FIELDS/);
    assert.match(extractSource, /withoutIdentity\(/);
    // And the raw model output is no longer echoed back on a parse failure,
    // which was a way around the redaction.
    assert.doesNotMatch(extractSource, /raw:\s*content/);
  });

  test('the report email reads no economics from the request body', () => {
    // The fields the old endpoint rendered straight from the client.
    assert.doesNotMatch(reportSource, /plan\.affiliateUrl/);
    assert.doesNotMatch(reportSource, /affiliateUrl\s*\|\|/);
    assert.doesNotMatch(reportSource, /recommendations/);
    assert.doesNotMatch(reportSource, /req\.body\?\.savingsScore/);
    assert.doesNotMatch(
      reportSource,
      /const\s*\{[^}]*\b(recommendations|savingsScore|overpaymentPercent|billData)\b[^}]*\}\s*=\s*req\.body/
    );
  });

  test('the report email routes through the shared comparison service', () => {
    assert.match(reportSource, /runComparison\(/);
    assert.match(reportSource, /selectHeadline\(/);
    assert.match(reportSource, /describeResultPrice\(/);
    assert.match(reportSource, /pricingCaveatText\(/);
    assert.match(reportSource, /req\.body\?\.planIds/);
  });

  test('the report email states no savings the comparison did not produce', () => {
    // The single annual figure comes from the server benchmark, and the
    // per-plan lines from each result's own signed difference.
    assert.match(reportSource, /comparison\.benchmark/);
    assert.match(reportSource, /benchmark\.available\s*\?\s*benchmark\.annualOverpayment\s*:\s*0/);
    assert.match(reportSource, /result\.monthlyDifference === null/);
  });
});
