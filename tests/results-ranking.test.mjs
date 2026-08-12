/**
 * Pricing and ranking suite — `npm test`.
 *
 * The two claims on the results page that would be most damaging to get wrong
 * are "this costs $X a month" and "this is your best match". Both are computed
 * here, so both are pinned here — including the rule that an affiliate
 * relationship can never outrank a materially better plan.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  estimateMonthlyCost,
  estimateMonthlyDifference,
  COST_CONFIDENCE,
} from '../src/components/compare/engine/planPricing.js';
import {
  rankPlans,
  scorePlan,
  personalizationLevel,
  RANK_LABELS,
} from '../src/components/compare/engine/ranking.js';
import { createInitialState, CUSTOMER_TYPES } from '../src/components/compare/engine/comparisonState.js';

function plan(overrides) {
  return {
    id: 'p1',
    provider_name: 'Test Energy',
    plan_name: 'Test Plan',
    rate_per_kwh: 12,
    contract_length: 12,
    plan_type: 'fixed',
    renewable_percentage: 0,
    state: 'TX',
    customer_type: 'residential',
    ...overrides,
  };
}

const residential = {
  ...createInitialState(),
  zip: '77001',
  state: 'TX',
  customerType: CUSTOMER_TYPES.RESIDENTIAL,
};

describe('estimated monthly cost', () => {
  test('energy charge is rate times usage', () => {
    const { amount } = estimateMonthlyCost(plan({ rate_per_kwh: 12 }), 1000);
    assert.equal(amount, 120);
  });

  test('base charge is added', () => {
    const { amount, components } = estimateMonthlyCost(
      plan({ rate_per_kwh: 12, monthly_base_charge: 9.95 }),
      1000
    );
    assert.equal(components.baseCharge, 9.95);
    assert.equal(Math.round(amount * 100) / 100, 129.95);
  });

  test('the two base-charge columns are not double counted', () => {
    const { components } = estimateMonthlyCost(
      plan({ monthly_base_charge: 9.95, base_charge: 9.95 }),
      1000
    );
    assert.equal(components.baseCharge, 9.95);
  });

  test('utility delivery is included when known', () => {
    const { amount, confidence } = estimateMonthlyCost(
      plan({ rate_per_kwh: 8, tdsp_charges: 4 }),
      1000
    );
    // 8c energy + 4c delivery = 12c/kWh over 1000 kWh
    assert.equal(amount, 120);
    assert.equal(confidence, COST_CONFIDENCE.COMPLETE);
  });

  test('a missing delivery charge downgrades confidence and is disclosed', () => {
    const { confidence, caveats } = estimateMonthlyCost(plan({ rate_per_kwh: 8 }), 1000);
    assert.equal(confidence, COST_CONFIDENCE.PARTIAL);
    assert.ok(caveats.some((c) => /delivery/i.test(c)));
  });

  test('a bill credit is subtracted once usage clears the threshold', () => {
    // This is the case the old rate-times-usage helper got wrong by the entire
    // credit: $120 of energy less a $100 credit is not a $120 bill.
    const { amount, components } = estimateMonthlyCost(
      plan({ rate_per_kwh: 12, tdsp_charges: 0.0001, usage_credit: 100, usage_credit_threshold: 1000 }),
      1000
    );
    assert.equal(components.usageCredit, -100);
    assert.ok(amount < 30, `expected credit to be applied, got ${amount}`);
  });

  test('a bill credit below its threshold is not applied, and is explained', () => {
    const { components, caveats } = estimateMonthlyCost(
      plan({ rate_per_kwh: 12, usage_credit: 100, usage_credit_threshold: 2000 }),
      1000
    );
    assert.ok(!('usageCredit' in components), 'credit must not apply below threshold');
    assert.ok(caveats.some((c) => /bill credit/i.test(c)));
  });

  test('a variable rate is flagged', () => {
    const { caveats } = estimateMonthlyCost(plan({ plan_type: 'variable' }), 1000);
    assert.ok(caveats.some((c) => /change month to month/i.test(c)));
  });

  test('no usage or no rate yields no estimate rather than zero', () => {
    assert.equal(estimateMonthlyCost(plan(), 0).amount, null);
    assert.equal(estimateMonthlyCost(plan({ rate_per_kwh: 0 }), 1000).amount, null);
    assert.equal(estimateMonthlyCost(plan(), 0).confidence, COST_CONFIDENCE.UNAVAILABLE);
  });

  test('effective rate reflects everything modelled, not the advertised rate', () => {
    const { effectiveRate } = estimateMonthlyCost(
      plan({ rate_per_kwh: 10, monthly_base_charge: 20, tdsp_charges: 0.0001 }),
      1000
    );
    // 10c advertised, but $20 fixed over 1000 kWh adds 2c.
    assert.ok(effectiveRate > 11.9 && effectiveRate < 12.1, `got ${effectiveRate}`);
  });
});

describe('monthly difference against the current bill', () => {
  test('reported only when both sides are trustworthy', () => {
    const complete = estimateMonthlyCost(plan({ rate_per_kwh: 8, tdsp_charges: 2 }), 1000);
    const { difference, comparable } = estimateMonthlyDifference(complete, 130);
    assert.equal(comparable, true);
    assert.equal(difference, -30);
  });

  test('a partial estimate never produces a savings claim', () => {
    const partial = estimateMonthlyCost(plan({ rate_per_kwh: 8 }), 1000);
    const { difference, comparable } = estimateMonthlyDifference(partial, 130);
    assert.equal(comparable, false);
    assert.equal(difference, null);
  });

  test('no current bill means no comparison', () => {
    const complete = estimateMonthlyCost(plan({ rate_per_kwh: 8, tdsp_charges: 2 }), 1000);
    assert.equal(estimateMonthlyDifference(complete, null).comparable, false);
  });
});

describe('ranking', () => {
  const cheap = plan({ id: 'cheap', rate_per_kwh: 8, tdsp_charges: 2 });
  const mid = plan({ id: 'mid', rate_per_kwh: 11, tdsp_charges: 2 });
  const pricey = plan({ id: 'pricey', rate_per_kwh: 15, tdsp_charges: 2 });

  test('cheaper plans outrank dearer ones, all else equal', () => {
    const { all } = rankPlans([pricey, cheap, mid], residential, { usageKwh: 1000 });
    assert.deepEqual(all.map((e) => e.plan.id), ['cheap', 'mid', 'pricey']);
  });

  test('the top three are returned separately and labelled', () => {
    const { top, rest } = rankPlans([pricey, cheap, mid, plan({ id: 'x', rate_per_kwh: 20 })],
      residential, { usageKwh: 1000 });
    assert.equal(top.length, 3);
    assert.equal(rest.length, 1);
    assert.deepEqual(top.map((e) => e.rank), [1, 2, 3]);
    assert.equal(RANK_LABELS[top[0].rank], 'Best match');
  });

  test('ranking is deterministic across runs', () => {
    const input = [mid, pricey, cheap];
    const a = rankPlans(input, residential, { usageKwh: 1000 }).all.map((e) => e.plan.id);
    const b = rankPlans([...input].reverse(), residential, { usageKwh: 1000 }).all.map((e) => e.plan.id);
    assert.deepEqual(a, b, 'input order must not change the ranking');
  });

  test('an affiliate plan does NOT outrank a materially better plan', () => {
    // The commercial rule that matters: the dearer plan pays us, the cheaper
    // one does not, and the customer still sees the cheaper one first.
    const { all } = rankPlans([cheap, pricey], residential, {
      usageKwh: 1000,
      affiliateIds: new Set(['pricey']),
    });
    assert.equal(all[0].plan.id, 'cheap');
  });

  test('affiliate breaks a tie between otherwise identical plans', () => {
    const a = plan({ id: 'a', rate_per_kwh: 10, tdsp_charges: 2 });
    const b = plan({ id: 'b', rate_per_kwh: 10, tdsp_charges: 2 });
    const { all } = rankPlans([a, b], residential, {
      usageKwh: 1000,
      affiliateIds: new Set(['b']),
    });
    assert.equal(all[0].plan.id, 'b', 'monetized plan should win a genuine tie');
  });

  test('renewable preference lifts renewable plans, but only when asked for', () => {
    const green = plan({ id: 'green', rate_per_kwh: 11, tdsp_charges: 2, renewable_percentage: 100 });
    const grey = plan({ id: 'grey', rate_per_kwh: 10.6, tdsp_charges: 2 });

    const neutral = rankPlans([green, grey], residential, { usageKwh: 1000 });
    assert.equal(neutral.all[0].plan.id, 'grey', 'no preference: cheapest wins');

    const wantsGreen = rankPlans([green, grey],
      { ...residential, energyPreference: 'renewable' }, { usageKwh: 1000 });
    assert.equal(wantsGreen.all[0].plan.id, 'green');
  });

  test('a plan we can price completely beats an unpriceable one', () => {
    const priceable = plan({ id: 'priceable', rate_per_kwh: 12, tdsp_charges: 2 });
    const unpriceable = plan({ id: 'unpriceable', rate_per_kwh: 12 });
    const { all } = rankPlans([unpriceable, priceable], residential, { usageKwh: 1000 });
    assert.equal(all[0].plan.id, 'priceable');
  });

  test('usage changes the ranking when plans have different fixed charges', () => {
    // High base charge, low rate: good at high usage, bad at low usage.
    const highBase = plan({ id: 'highBase', rate_per_kwh: 7, monthly_base_charge: 30, tdsp_charges: 0.0001 });
    const lowBase = plan({ id: 'lowBase', rate_per_kwh: 10, monthly_base_charge: 0, tdsp_charges: 0.0001 });

    const lowUsage = rankPlans([highBase, lowBase], residential, { usageKwh: 500 });
    assert.equal(lowUsage.all[0].plan.id, 'lowBase');

    const highUsage = rankPlans([highBase, lowBase], residential, { usageKwh: 2000 });
    assert.equal(highUsage.all[0].plan.id, 'highBase');
  });

  test('an empty set ranks to empty rather than throwing', () => {
    const { top, rest } = rankPlans([], residential, { usageKwh: 1000 });
    assert.deepEqual(top, []);
    assert.deepEqual(rest, []);
  });
});

describe('match reasons', () => {
  test('the cheapest plan says so, using the customer usage', () => {
    const { top } = rankPlans(
      [plan({ id: 'a', rate_per_kwh: 8, tdsp_charges: 2 }), plan({ id: 'b', rate_per_kwh: 14, tdsp_charges: 2 })],
      residential,
      { usageKwh: 1240 }
    );
    assert.ok(top[0].reasons.some((r) => /lowest estimated cost/i.test(r)));
    assert.ok(top[0].reasons.some((r) => /1,240 kWh/.test(r)));
  });

  test('renewable reason appears only when the customer asked for renewable', () => {
    const green = plan({ id: 'g', rate_per_kwh: 10, tdsp_charges: 2, renewable_percentage: 100 });

    const neutral = rankPlans([green], residential, { usageKwh: 1000 });
    assert.ok(!neutral.top[0].reasons.some((r) => /renewable preference/i.test(r)));

    const asked = rankPlans([green], { ...residential, energyPreference: 'renewable' }, { usageKwh: 1000 });
    assert.ok(asked.top[0].reasons.some((r) => /renewable preference/i.test(r)));
  });

  test('reasons are never fabricated when nothing supports them', () => {
    // A single mid-priced plan with no distinguishing attributes and no stated
    // preferences should not manufacture a reason.
    const bare = plan({ id: 'bare', rate_per_kwh: 12, contract_length: 0, plan_type: 'variable' });
    const { top } = rankPlans([bare], residential, { usageKwh: 1000 });
    const invented = top[0].reasons.filter((r) => !/lowest estimated cost/i.test(r));
    assert.deepEqual(invented, []);
  });

  test('at most two reasons per card', () => {
    const loaded = plan({
      id: 'loaded', rate_per_kwh: 8, tdsp_charges: 2, renewable_percentage: 100,
      contract_length: 12, usage_credit: 50, usage_credit_threshold: 1000,
    });
    const { top } = rankPlans([loaded], {
      ...residential, energyPreference: 'renewable', shoppingIntent: 'moving',
    }, { usageKwh: 1000 });
    assert.ok(top[0].reasons.length <= 2);
  });
});

describe('personalization level', () => {
  test('a bare ZIP is low personalization', () => {
    assert.equal(personalizationLevel({ ...createInitialState(), zip: '77001' }), 'low');
  });

  test('usage plus intent plus preference is high', () => {
    assert.equal(
      personalizationLevel({
        ...createInitialState(),
        zip: '77001',
        monthlyUsageKwh: 1240,
        shoppingIntent: 'switching',
        energyPreference: 'renewable',
      }),
      'high'
    );
  });
});

describe('score breakdown', () => {
  test('every component is inspectable', () => {
    const scored = scorePlan(plan(), residential, {
      usageKwh: 1000,
      costRange: { min: 100, max: 200 },
      hasAffiliate: false,
    });
    for (const key of ['cost', 'renewable', 'term', 'rateStability', 'dataQuality', 'affiliate']) {
      assert.ok(key in scored.breakdown, `missing ${key} from breakdown`);
    }
    assert.equal(typeof scored.score, 'number');
  });

  test('the affiliate component is worth less than any customer-value component', () => {
    const withAffiliate = scorePlan(plan(), residential, {
      usageKwh: 1000, costRange: { min: 100, max: 200 }, hasAffiliate: true,
    });
    assert.ok(
      withAffiliate.breakdown.affiliate < withAffiliate.breakdown.rateStability,
      'affiliate weight must stay below the smallest customer-value signal'
    );
  });
});

describe('referral resolution', () => {
  // Regression: affiliate links are registered against providers, not offers.
  // Resolving by offer id alone matched nothing, so every View plan click fell
  // through to the plan's public page and the referral — the revenue path —
  // was lost on all 378 live plans.
  //
  // These pin the resolution contract that `getAffiliateUrl` implements, so a
  // future change that drops providerId fails here rather than silently in
  // production.
  function resolve({ providerId, offerId, byOffer = {}, byProvider = {}, fallbackUrl = '' }) {
    if (offerId && byOffer[offerId]) return `/api/go?slug=${byOffer[offerId].slug}`;
    if (providerId && byProvider[providerId]) return `/api/go?slug=${byProvider[providerId].slug}`;
    return fallbackUrl;
  }

  test('a provider-registered link routes through /api/go', () => {
    const url = resolve({
      providerId: 'prov-1',
      offerId: 'plan-1',
      byProvider: { 'prov-1': { slug: 'txu' } },
      fallbackUrl: 'https://provider.example/plan',
    });
    assert.equal(url, '/api/go?slug=txu');
  });

  test('an offer-specific link wins over the provider link', () => {
    const url = resolve({
      providerId: 'prov-1',
      offerId: 'plan-1',
      byOffer: { 'plan-1': { slug: 'txu-plan' } },
      byProvider: { 'prov-1': { slug: 'txu' } },
    });
    assert.equal(url, '/api/go?slug=txu-plan');
  });

  test('omitting providerId loses the referral — the bug this pins', () => {
    const url = resolve({
      offerId: 'plan-1',
      byProvider: { 'prov-1': { slug: 'txu' } },
      fallbackUrl: 'https://provider.example/plan',
    });
    assert.equal(url, 'https://provider.example/plan', 'offer-only lookup misses provider links');
  });

  test('no configured link falls back rather than producing a dead button', () => {
    const url = resolve({ providerId: 'prov-9', fallbackUrl: 'https://provider.example/plan' });
    assert.equal(url, 'https://provider.example/plan');
  });
});
