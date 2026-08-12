/**
 * Savings, match score and provider branding — `npm test`.
 *
 * The claims pinned here are the ones that would be most damaging to get
 * wrong: "you would save $X", "this is a 92% match", and the provider whose
 * brand sits on the card.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { estimateMonthlyCost, COST_CONFIDENCE } from '../src/components/compare/engine/planPricing.js';
import { compareToCurrentBill, describeComparison } from '../src/components/compare/engine/savings.js';
import { matchScore, scoreLabel, attainablePoints, CONFIDENCE_CAPS } from '../src/components/compare/engine/matchScore.js';
import { rankPlans, WEIGHTS } from '../src/components/compare/engine/ranking.js';
import { providerInitials, tintIndexFor } from '../src/components/compare/engine/providerBranding.js';
import { createInitialState, CUSTOMER_TYPES } from '../src/components/compare/engine/comparisonState.js';

const base = {
  ...createInitialState(),
  zip: '77001',
  state: 'TX',
  customerType: CUSTOMER_TYPES.RESIDENTIAL,
};

function plan(o) {
  return {
    id: 'p1', provider_name: 'Test Energy', plan_name: 'Test Plan',
    rate_per_kwh: 12, contract_length: 12, plan_type: 'fixed',
    renewable_percentage: 0, state: 'TX', customer_type: 'residential', ...o,
  };
}

/** A complete estimate costing exactly `target` at 1000 kWh. */
function completeEstimateFor(target) {
  return estimateMonthlyCost(
    plan({ rate_per_kwh: (target / 1000) * 100 - 2, tdsp_charges: 2 }),
    1000
  );
}

describe('savings — the specified fixtures', () => {
  test('current $200, complete new cost $150 → $50/mo, $600/yr, savings allowed', () => {
    const estimate = completeEstimateFor(150);
    const c = compareToCurrentBill(estimate, { ...base, monthlyCost: 200 });
    assert.equal(c.available, true);
    assert.equal(c.direction, 'saving');
    assert.equal(Math.round(c.monthlyDelta), -50);
    assert.equal(Math.round(c.annualDelta), -600);

    const d = describeComparison(c);
    assert.match(d.headline, /Potential savings: \$50\/mo/);
    assert.match(d.annual, /\$600\/year/);
  });

  test('current $150, new $175 → +$25/mo and NOT labelled savings', () => {
    const c = compareToCurrentBill(completeEstimateFor(175), { ...base, monthlyCost: 150 });
    assert.equal(c.direction, 'costlier');
    assert.equal(Math.round(c.monthlyDelta), 25);

    const d = describeComparison(c);
    assert.doesNotMatch(d.headline, /saving/i, 'a more expensive plan must never say savings');
    assert.match(d.headline, /\+\$25\/mo/);
  });

  test('an unfavourable difference is shown, not hidden', () => {
    // Hiding it is what makes a comparison site untrustworthy.
    const c = compareToCurrentBill(completeEstimateFor(175), { ...base, monthlyCost: 150 });
    assert.equal(c.available, true);
    assert.ok(describeComparison(c).headline);
  });

  test('partial pricing → no difference and no savings', () => {
    // The missing component is always a charge, so a partial estimate is
    // always too low and would always overstate the saving.
    const partial = estimateMonthlyCost(plan({ rate_per_kwh: 8 }), 1000);
    assert.equal(partial.confidence, COST_CONFIDENCE.PARTIAL);

    const c = compareToCurrentBill(partial, { ...base, monthlyCost: 200 });
    assert.equal(c.available, false);
    assert.equal(c.reason, 'incomplete_pricing');
    assert.equal(describeComparison(c), null);
  });
});

describe('savings — every reason to stay silent', () => {
  test('no current bill', () => {
    const c = compareToCurrentBill(completeEstimateFor(150), { ...base });
    assert.equal(c.available, false);
    assert.equal(c.reason, 'no_current_bill');
  });

  test('a low-confidence bill reading', () => {
    const c = compareToCurrentBill(completeEstimateFor(150), {
      ...base, monthlyCost: 200, billAnalysisStatus: 'complete', billConfidence: 'low',
    });
    assert.equal(c.available, false);
    assert.equal(c.reason, 'bill_confidence_low');
  });

  test('a value the customer was asked to verify and has not', () => {
    const c = compareToCurrentBill(completeEstimateFor(150), {
      ...base, monthlyCost: 200, unverifiedFields: ['monthlyUsageKwh'],
    });
    assert.equal(c.available, false);
    assert.equal(c.reason, 'unverified_inputs');
  });

  test('a confirmed high-confidence bill reading does allow it', () => {
    const c = compareToCurrentBill(completeEstimateFor(150), {
      ...base, monthlyCost: 200, billAnalysisStatus: 'complete', billConfidence: 'high',
    });
    assert.equal(c.available, true);
  });

  test('no estimate at all', () => {
    const none = estimateMonthlyCost(plan(), 0);
    assert.equal(compareToCurrentBill(none, { ...base, monthlyCost: 200 }).available, false);
  });

  test('describeComparison never invents a claim from an unavailable comparison', () => {
    assert.equal(describeComparison({ available: false }), null);
    assert.equal(describeComparison(null), null);
  });

  test('the language is "potential", never guaranteed', () => {
    const d = describeComparison(compareToCurrentBill(completeEstimateFor(150), { ...base, monthlyCost: 200 }));
    assert.doesNotMatch(d.headline, /guarantee/i);
  });

  test('direction is carried in text, not colour alone', () => {
    const saving = describeComparison(compareToCurrentBill(completeEstimateFor(150), { ...base, monthlyCost: 200 }));
    const costlier = describeComparison(compareToCurrentBill(completeEstimateFor(175), { ...base, monthlyCost: 150 }));
    assert.match(saving.srText, /saving/i);
    assert.match(costlier.srText, /more/i);
  });
});

describe('match score', () => {
  const cheap = plan({ id: 'cheap', rate_per_kwh: 8, tdsp_charges: 2 });
  const pricey = plan({ id: 'pricey', rate_per_kwh: 15, tdsp_charges: 2 });

  test('is deterministic across runs and input order', () => {
    const a = rankPlans([cheap, pricey], base, { usageKwh: 1000 }).all.map((e) => e.match.score);
    const b = rankPlans([pricey, cheap], base, { usageKwh: 1000 }).all.map((e) => e.match.score);
    assert.deepEqual(a, b);
  });

  test('is a percentage in range', () => {
    for (const entry of rankPlans([cheap, pricey], base, { usageKwh: 1000 }).all) {
      assert.ok(entry.match.score >= 0 && entry.match.score <= 100, `${entry.match.score} out of range`);
    }
  });

  test('the best plan scores higher than a materially worse one', () => {
    const { all } = rankPlans([cheap, pricey], base, { usageKwh: 1000 });
    assert.ok(all[0].match.score > all[1].match.score);
  });

  test('incomplete pricing caps the score', () => {
    // Without the cap, a plan missing its delivery charge could show 96%
    // purely because the unknown component was treated as zero.
    const partial = plan({ id: 'partial', rate_per_kwh: 6 });
    const { all } = rankPlans([partial], base, { usageKwh: 1000 });
    const entry = all[0];
    assert.equal(entry.estimate.confidence, COST_CONFIDENCE.PARTIAL);
    assert.ok(
      entry.match.score <= CONFIDENCE_CAPS[COST_CONFIDENCE.PARTIAL],
      `partial pricing scored ${entry.match.score}, above the cap`
    );
  });

  test('an affiliate relationship does not move the score', () => {
    // A commercial relationship must never change the number a customer reads
    // as "how well this fits me".
    const withAffiliate = rankPlans([cheap], base, { usageKwh: 1000, affiliateIds: new Set(['cheap']) });
    const without = rankPlans([cheap], base, { usageKwh: 1000 });
    assert.equal(withAffiliate.all[0].match.score, without.all[0].match.score);
  });

  test('renewable weight counts only when the customer asked for it', () => {
    const neutral = attainablePoints(base, WEIGHTS);
    const green = attainablePoints({ ...base, energyPreference: 'renewable' }, WEIGHTS);
    assert.equal(green - neutral, WEIGHTS.renewable);
  });

  test('term weight counts only when an intent was stated', () => {
    const noIntent = attainablePoints(base, WEIGHTS);
    const withIntent = attainablePoints({ ...base, shoppingIntent: 'switching' }, WEIGHTS);
    assert.equal(withIntent - noIntent, WEIGHTS.term);
  });

  test('a customer who stated nothing is not capped at a low ceiling', () => {
    // Scoring against the full scale would cap this customer around 70% and
    // make a genuinely perfect match look mediocre.
    const { all } = rankPlans([cheap], base, { usageKwh: 1000 });
    assert.ok(all[0].match.score >= 90, `scored ${all[0].match.score}`);
  });

  test('labels are banded and never claim perfection', () => {
    assert.equal(scoreLabel(95), 'Excellent match');
    assert.equal(scoreLabel(85), 'Strong match');
    assert.equal(scoreLabel(75), 'Good match');
    assert.equal(scoreLabel(40), 'Possible match');
    for (const s of [100, 95, 80, 50, 0]) {
      assert.doesNotMatch(scoreLabel(s), /perfect/i);
    }
  });

  test('a plan with no usable estimate does not score high', () => {
    const { all } = rankPlans([plan({ id: 'x' })], base, { usageKwh: 0 });
    assert.ok(all[0].match.score <= CONFIDENCE_CAPS[COST_CONFIDENCE.UNAVAILABLE]);
  });
});

describe('adversarial pricing — incompleteness must never be an advantage', () => {
  // The brief's concern is that a plan must not look cheaper SOLELY because a
  // missing charge is treated as zero. Isolating that means holding supply
  // equal — where supply genuinely differs, the cheaper supply legitimately
  // wins, and ranking already compares supply-to-supply for exactly this
  // reason (see `comparableAmount` in planPricing).
  const supplyEqualComplete = plan({ id: 'complete', rate_per_kwh: 10, tdsp_charges: 3 });
  const supplyEqualPartial = plan({ id: 'partial', rate_per_kwh: 10 });

  test('with identical supply, the completely priced plan ranks first', () => {
    const { all } = rankPlans([supplyEqualPartial, supplyEqualComplete], base, { usageKwh: 1000 });
    assert.equal(all[0].plan.id, 'complete');
  });

  test('with identical supply, the completely priced plan scores higher', () => {
    const { all } = rankPlans([supplyEqualPartial, supplyEqualComplete], base, { usageKwh: 1000 });
    const byId = Object.fromEntries(all.map((e) => [e.plan.id, e]));
    assert.ok(
      byId.complete.match.score > byId.partial.match.score,
      `complete ${byId.complete.match.score} should beat partial ${byId.partial.match.score}`
    );
  });

  test('ranking never uses the raw total, which treats missing delivery as zero', () => {
    // The partial plan's displayed total is lower than the complete plan's,
    // yet it must not win on that basis.
    const partialEstimate = estimateMonthlyCost(supplyEqualPartial, 1000);
    const completeEstimate = estimateMonthlyCost(supplyEqualComplete, 1000);
    assert.ok(partialEstimate.amount < completeEstimate.amount, 'fixture: partial total looks cheaper');
    assert.equal(partialEstimate.comparableAmount, completeEstimate.comparableAmount,
      'supply-only figures are equal, which is what ranking compares');
  });

  test('an incomplete estimate is always disclosed as incomplete', () => {
    const partialEstimate = estimateMonthlyCost(supplyEqualPartial, 1000);
    assert.equal(partialEstimate.confidence, COST_CONFIDENCE.PARTIAL);
    assert.ok(
      partialEstimate.caveats.some((c) => /delivery/i.test(c)),
      'the missing charge must be named, not silently omitted'
    );
  });

  test('and it can never produce a savings claim', () => {
    const partialEstimate = estimateMonthlyCost(supplyEqualPartial, 1000);
    assert.equal(compareToCurrentBill(partialEstimate, { ...base, monthlyCost: 200 }).available, false);
  });

  test('genuinely cheaper supply still wins, which is correct', () => {
    // The guard must not overcorrect into burying real value.
    const cheapSupply = plan({ id: 'cheap-supply', rate_per_kwh: 8, tdsp_charges: 2 });
    const dearSupply = plan({ id: 'dear-supply', rate_per_kwh: 14, tdsp_charges: 2 });
    const { all } = rankPlans([dearSupply, cheapSupply], base, { usageKwh: 1000 });
    assert.equal(all[0].plan.id, 'cheap-supply');
  });
});

describe('provider branding fallback', () => {
  test('initials skip the words that carry no identity', () => {
    assert.equal(providerInitials('Green Mountain Energy'), 'GM');
    assert.equal(providerInitials('TXU Energy'), 'T');
    assert.equal(providerInitials('Direct Energy'), 'D');
    assert.equal(providerInitials('Champion Energy Services'), 'C');
  });

  test('a two-word brand keeps both initials', () => {
    assert.equal(providerInitials('Rhythm Chariot'), 'RC');
  });

  test('never returns empty, so a card can always render a mark', () => {
    for (const name of ['', null, undefined, '   ', 'Energy']) {
      assert.ok(providerInitials(name).length > 0, `${name} produced no mark`);
    }
  });

  test('a name of only generic words still produces a mark', () => {
    assert.equal(providerInitials('Energy Power'), 'EP');
  });

  test('the fallback tint is stable for a given provider', () => {
    assert.equal(tintIndexFor('TXU Energy', 5), tintIndexFor('TXU Energy', 5));
    assert.ok(tintIndexFor('TXU Energy', 5) < 5);
  });
});

describe('the Top 3 never headlines a plan we cannot fully price', () => {
  // Found by looking at the rendered board, not by a unit test: a plan with no
  // delivery charge took the #1 slot at $105 "excludes delivery" beside a
  // complete $158 plan, implying a $53 saving we have no basis for.
  const complete = (id, rate) => plan({ id, rate_per_kwh: rate, tdsp_charges: 2 });
  const partialCheap = plan({ id: 'partial-cheap', rate_per_kwh: 4 });

  test('a cheap-looking partial plan does not take the headline slot', () => {
    const pool = [partialCheap, complete('c1', 8.5), complete('c2', 9.2), complete('c3', 9.8)];
    const { top } = rankPlans(pool, base, { usageKwh: 1500 });
    assert.ok(
      top.every((e) => e.estimate.confidence === COST_CONFIDENCE.COMPLETE),
      `top 3 contained a partially priced plan: ${top.map((e) => e.plan.id).join(', ')}`
    );
  });

  test('it is still listed, not hidden', () => {
    const pool = [partialCheap, complete('c1', 8.5), complete('c2', 9.2), complete('c3', 9.8)];
    const { top, rest, all } = rankPlans(pool, base, { usageKwh: 1500 });
    assert.equal(all.length, 4);
    assert.equal(top.length + rest.length, 4, 'every plan appears exactly once');
    assert.ok(rest.some((e) => e.plan.id === 'partial-cheap'));
  });

  test('no plan is duplicated between the top three and the list', () => {
    const pool = [partialCheap, complete('c1', 8.5), complete('c2', 9.2), complete('c3', 9.8)];
    const { top, rest } = rankPlans(pool, base, { usageKwh: 1500 });
    const ids = [...top, ...rest].map((e) => e.plan.id);
    assert.equal(new Set(ids).size, ids.length, 'a plan appeared twice');
  });

  test('when too few complete plans exist, partial ones may still headline', () => {
    // Better to show the best we have than an empty board — they stay
    // disclosed as incomplete either way.
    const { top } = rankPlans([partialCheap, complete('c1', 8.5)], base, { usageKwh: 1500 });
    assert.equal(top.length, 2);
  });
});

describe('rank label and score never contradict', () => {
  test('a flattened field does not produce "#1 Best match" at a floor score', () => {
    // One unusually cheap plan drags every other plan's cost score to zero.
    // The label must follow the score, not the position.
    const mk = (id, rate) => plan({ id, rate_per_kwh: rate, tdsp_charges: 4.2 });
    const pool = [mk('outlier', 4), mk('a', 9.8), mk('b', 10.4), mk('c', 11.1)];
    const { top } = rankPlans(pool, { ...base, shoppingIntent: 'switching' }, { usageKwh: 1500 });

    for (const entry of top) {
      assert.equal(entry.match.label, scoreLabel(entry.match.score),
        `label "${entry.match.label}" does not match score ${entry.match.score}`);
    }
  });

  test('a genuinely strong leader still reads as one', () => {
    const mk = (id, rate) => plan({ id, rate_per_kwh: rate, tdsp_charges: 4.2 });
    const pool = [mk('a', 9.8), mk('b', 10.4), mk('c', 11.1)];
    const { top } = rankPlans(pool, { ...base, shoppingIntent: 'switching' }, { usageKwh: 1500 });
    assert.equal(top[0].match.score, 100);
    assert.equal(top[0].match.label, 'Excellent match');
  });
});
