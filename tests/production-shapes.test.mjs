/**
 * Real production row shapes — `npm test`.
 *
 * The fixtures below are actual rows from the live catalog, reduced to the
 * columns the engine reads. They exist because production data does not look
 * like tidy test data, and the difference is load-bearing:
 *
 *   tdsp_charges, monthly_base_charge, base_charge, usage_credit are stored
 *   as 0, NOT as NULL.
 *
 * A zero here does not mean "this plan has no delivery charge". It means
 * nobody has entered one. Every Texas customer pays a TDU delivery charge, so
 * a plan priced as though delivery were genuinely zero would understate the
 * real bill by roughly a third — and, worse, would compute a savings figure
 * against the customer's actual bill from that understatement.
 *
 * So the rule these tests pin is: a zero cost component is treated as missing,
 * not as free. Every one of these real plans must come back PARTIAL, must
 * publish a supply estimate rather than a monthly total, and must refuse to
 * report a saving.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { runComparison } from '../api/_lib/comparison.js';
import {
  describeResultPrice,
  pricingCaveatText,
  MONETIZATION,
  PRICING_COMPLETENESS,
} from '../src/components/compare/engine/resultsContract.js';

/** Live TX residential rows, top of the rate table, as the catalog returns them. */
const PRODUCTION_PLANS = [
  {
    id: 'e2519264-3812-448c-bd1b-3a0b56887461', plan_name: 'GridPlus 12',
    provider_id: 'chariot', provider_name: 'Chariot Energy',
    rate_per_kwh: 9.5, contract_length: 12, plan_type: 'variable', renewable_percentage: 100,
    monthly_base_charge: 0, base_charge: 0, tdsp_charges: 0, usage_credit: 0,
    usage_credit_threshold: 0, early_termination_fee: 0,
    state: 'TX', customer_type: 'residential', is_active: true,
    provider: { id: 'chariot', name: 'Chariot Energy', logo_url: null, is_active: true },
  },
  {
    id: '68ff1ab5-ec0a-48b5-9d99-d9d20af06aed', plan_name: 'Digital Choice 3',
    provider_id: 'rhythm', provider_name: 'Rhythm Energy',
    rate_per_kwh: 9.5, contract_length: 3, plan_type: 'variable', renewable_percentage: 100,
    monthly_base_charge: 0, base_charge: 0, tdsp_charges: 0, usage_credit: 0,
    usage_credit_threshold: 0, early_termination_fee: 0,
    state: 'TX', customer_type: 'residential', is_active: true,
    provider: { id: 'rhythm', name: 'Rhythm Energy', logo_url: null, is_active: true },
  },
  {
    id: 'd474d0ba-f863-4ddb-963b-65dbcffaa6a6', plan_name: 'Octopus Lite 12',
    provider_id: 'octopus', provider_name: 'Octopus Energy',
    rate_per_kwh: 9.8, contract_length: 12, plan_type: 'variable', renewable_percentage: 100,
    monthly_base_charge: 0, base_charge: 0, tdsp_charges: 0, usage_credit: 0,
    usage_credit_threshold: 0, early_termination_fee: 150,
    state: 'TX', customer_type: 'residential', is_active: true,
    provider: { id: 'octopus', name: 'Octopus Energy', logo_url: null, is_active: true },
  },
  {
    id: 'f9b91d43-ab5d-4e13-a58f-c241a1942fc1', plan_name: 'Frontier Power Saver 3',
    provider_id: 'frontier', provider_name: 'Frontier Utilities',
    rate_per_kwh: 10, contract_length: 3, plan_type: 'variable', renewable_percentage: 30,
    monthly_base_charge: 0, base_charge: 0, tdsp_charges: 0, usage_credit: 0,
    usage_credit_threshold: 0, early_termination_fee: 150,
    state: 'TX', customer_type: 'residential', is_active: true,
    provider: {
      id: 'frontier', name: 'Frontier Utilities',
      logo_url: '/images/providers/frontier-utilities.png', is_active: true,
    },
  },
  // Deactivated plan AND deactivated provider — the rows the previous round
  // stopped leaking. RLS still hands these to an anon client quite happily.
  {
    id: '785a5d74-6ba4-41b1-9ccc-6028c52acce5', plan_name: 'OnPoint Saver 24',
    provider_id: 'onpoint', provider_name: 'OnPoint Energy',
    rate_per_kwh: 13.2, contract_length: 24, plan_type: 'fixed', renewable_percentage: 10,
    monthly_base_charge: 0, base_charge: 0, tdsp_charges: 0, usage_credit: 0,
    usage_credit_threshold: 0, early_termination_fee: 200,
    state: 'TX', customer_type: 'residential', is_active: false,
    provider: { id: 'onpoint', name: 'OnPoint Energy', logo_url: null, is_active: false },
  },
];

/** Live affiliate rows: all provider-keyed, none offer-keyed, all plain pages. */
const PRODUCTION_LINKS = [
  {
    slug: 'chariot-energy', provider_id: 'chariot', offer_id: null,
    target_url: 'https://chariotenergy.com/plans-pricing/',
    provider: { affiliate_url: 'https://chariotenergy.com/plans-pricing/', website_url: 'https://chariotenergy.com' },
  },
  {
    slug: 'rhythm-energy', provider_id: 'rhythm', offer_id: null,
    target_url: 'https://www.gotrhythm.com/electricity-plans',
    provider: { affiliate_url: 'https://www.gotrhythm.com/electricity-plans', website_url: 'https://www.gotrhythm.com' },
  },
  {
    slug: 'octopus-energy', provider_id: 'octopus', offer_id: null,
    target_url: 'https://octopusenergy.com/electricity',
    provider: { affiliate_url: 'https://octopusenergy.com/electricity', website_url: 'https://octopusenergy.com' },
  },
  {
    slug: 'frontier-utilities', provider_id: 'frontier', offer_id: null,
    target_url: 'https://www.frontierutilities.com/electricity-plans',
    provider: { affiliate_url: 'https://www.frontierutilities.com/electricity-plans', website_url: 'https://www.frontierutilities.com' },
  },
];

function fakeSupabase({ plans, links }) {
  return {
    from(table) {
      const rows = table === 'electricity_plans' ? plans : links;
      const builder = {
        select: () => builder,
        eq: () => builder,
        in: () => builder,
        then: (resolve) => Promise.resolve({ data: rows, error: null }).then(resolve),
      };
      return builder;
    },
  };
}

const REQUEST = {
  zip: '77002',
  customerType: 'residential',
  shoppingIntent: 'switching',
  monthlyUsageKwh: 1500,
  monthlyCost: 220,
  sessionId: 'prod-shape-session',
};

async function productionComparison(request = REQUEST) {
  const { ok, comparison } = await runComparison(
    fakeSupabase({ plans: PRODUCTION_PLANS, links: PRODUCTION_LINKS }),
    request
  );
  assert.equal(ok, true);
  return comparison;
}

describe('a zero cost component means missing, never free', () => {
  test('every live plan is reported as partially priced', async () => {
    const comparison = await productionComparison();

    assert.equal(comparison.counts.complete, 0);
    assert.equal(comparison.counts.partial, comparison.results.length);
    for (const result of comparison.results) {
      assert.equal(result.pricingCompleteness, PRICING_COMPLETENESS.PARTIAL, result.planName);
    }
  });

  test('no live plan publishes a monthly total it cannot support', async () => {
    for (const result of (await productionComparison()).results) {
      assert.equal(result.estimatedMonthlyCost, null, result.planName);
      assert.ok(result.supplyEstimate > 0, `${result.planName} should still show a supply figure`);
    }
  });

  test('the figure shown is labelled supply, and says delivery is excluded', async () => {
    const [top] = (await productionComparison()).results;
    const price = describeResultPrice(top);

    // 9.5c over 1,500 kWh — supply only.
    assert.equal(price.amount, 142.5);
    assert.equal(price.basis, 'supply');
    assert.match(price.note, /Delivery charges not included/);
    assert.match(pricingCaveatText(top), /delivery charges are billed separately/i);
  });

  test('a zero delivery charge never produces a savings claim', async () => {
    // The dangerous case in one test. A $220 bill against a $142.50 supply-only
    // figure looks like $77.50/mo of savings, and it is not — the delivery
    // charge the customer will also pay is simply unknown to us.
    for (const result of (await productionComparison()).results) {
      assert.equal(result.monthlyDifference, null, result.planName);
      assert.equal(result.annualDifference, null, result.planName);
      assert.equal(result.potentialSavings, null, result.planName);
      assert.equal(result.differenceDirection, null, result.planName);
    }
  });

  test('a zero base charge is not billed as a real charge either', async () => {
    for (const result of (await productionComparison()).results) {
      assert.equal(result.baseCharge, null);
      assert.equal(result.costComponents.baseCharge, null);
      assert.equal(result.costComponents.usageCredit, null);
    }
  });

  test('confidence is capped because the economics are incomplete', async () => {
    const results = (await productionComparison()).results;

    for (const result of results) {
      assert.ok(result.matchScore <= 79, `${result.planName} scored ${result.matchScore}`);
      assert.notEqual(result.matchLabel, 'Excellent match');
      assert.notEqual(result.matchLabel, 'Strong match');
    }

    // The leader is the case that proves the ceiling is doing work rather than
    // simply sitting above every score anyway: on merit it earns full marks,
    // and it is held down because we cannot price it completely.
    // (`matchScoreCapped` records that the ceiling actually reduced the score,
    // which is only true where the raw score would have exceeded it.)
    assert.equal(results[0].matchScoreCapped, true);
    assert.equal(results[0].matchScore, 79);
  });
});

describe('live catalog and routing behaviour', () => {
  test('the deactivated plan on a deactivated provider stays out', async () => {
    const comparison = await productionComparison();
    const ids = comparison.results.map((r) => r.planId);

    assert.ok(!ids.includes('785a5d74-6ba4-41b1-9ccc-6028c52acce5'), 'inactive row leaked');
    assert.equal(comparison.results.length, 4);
  });

  test('the cheapest live plan leads, and the Top 3 is server-decided', async () => {
    const comparison = await productionComparison();

    assert.equal(comparison.results[0].planName, 'GridPlus 12');
    assert.equal(comparison.results[0].rank, 1);
    assert.equal(comparison.topMatchIds.length, 3);
    assert.equal(comparison.results.filter((r) => r.isTopMatch).length, 3);
  });

  test('every live plan resolves to a tracked route', async () => {
    for (const result of (await productionComparison()).results) {
      assert.match(result.trackedOutboundRoute, /^\/api\/go\?slug=/, result.planName);
    }
  });

  test('plain provider pages are internal tracking, not commission', async () => {
    // 36 of 38 configured links are like this. Reporting these as monetized
    // would overstate revenue and hide the providers still needing a real URL.
    for (const result of (await productionComparison()).results) {
      assert.equal(result.monetizationStatus, MONETIZATION.INTERNAL_TRACKING_ONLY, result.planName);
    }
  });

  test('a renewable request reorders the live set toward 100% plans', async () => {
    const comparison = await productionComparison({ ...REQUEST, energyPreference: 'renewable' });
    assert.equal(Number(comparison.results[0].renewablePercentage), 100);
  });

  test('a variable-rate plan says so in its caveats', async () => {
    const [top] = (await productionComparison()).results;
    assert.ok(top.pricingCaveats.some((c) => /change month to month/i.test(c)));
  });
});
