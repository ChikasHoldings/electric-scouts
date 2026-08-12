/**
 * Admin plan validation — `npm test`.
 *
 * Two production bugs are pinned here.
 *
 * `parseInt(form.renewable_percentage) || 100` turned a legitimate 0 into 100
 * because 0 is falsy, so a conventional plan saved through the renewable
 * screen was published as 100% renewable — a claim about the product the data
 * did not support.
 *
 * The three plan forms selected a provider by NAME and wrote only
 * `provider_name`, so new plans carried no `provider_id`. Migration 014 had to
 * backfill hundreds of historical rows by name matching, and nothing stopped
 * the next admin-created plan from needing the same repair.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  validatePlan,
  parseOptionalNumber,
  parseRequiredNumber,
  parseOptionalUrl,
  pricingCompleteness,
} from '../src/lib/planValidation.js';

const providers = [
  { id: 'pr-1', name: 'TXU Energy', is_active: true },
  { id: 'pr-2', name: 'Green Mountain Energy', is_active: true },
];

const goodForm = {
  provider_name: 'TXU Energy',
  plan_name: 'Simple Rate 12',
  state: 'TX',
  customer_type: 'residential',
  plan_type: 'fixed',
  rate_per_kwh: '10.4',
  contract_length: '12',
  renewable_percentage: '20',
  is_active: true,
};

describe('provider relation — provider_id is authoritative', () => {
  test('selecting by name resolves the canonical id', () => {
    const { valid, values } = validatePlan(goodForm, providers);
    assert.equal(valid, true);
    assert.equal(values.provider_id, 'pr-1', 'provider_id must be written, not just the name');
    assert.equal(values.provider_name, 'TXU Energy');
  });

  test('an explicit provider_id wins over a stale name', () => {
    const { values } = validatePlan(
      { ...goodForm, provider_id: 'pr-2', provider_name: 'TXU Energy' },
      providers
    );
    assert.equal(values.provider_id, 'pr-2');
    // The denormalized copy is re-synchronized from the canonical record.
    assert.equal(values.provider_name, 'Green Mountain Energy');
  });

  test('an unknown provider is rejected rather than saved without a relation', () => {
    const { valid, errors } = validatePlan(
      { ...goodForm, provider_name: 'Nonexistent Energy' },
      providers
    );
    assert.equal(valid, false);
    assert.ok(errors.provider_id);
  });

  test('a plan can never be produced without a provider_id', () => {
    const { valid, values } = validatePlan(goodForm, providers);
    assert.equal(valid, true);
    assert.ok(values.provider_id, 'this is the migration-014 failure mode');
  });

  test('name matching is case- and whitespace-insensitive', () => {
    const { values } = validatePlan({ ...goodForm, provider_name: '  txu energy ' }, providers);
    assert.equal(values.provider_id, 'pr-1');
  });
});

describe('renewable percentage — zero must survive', () => {
  test('a legitimate 0 stays 0 and does not become 100', () => {
    const { values } = validatePlan({ ...goodForm, renewable_percentage: '0' }, providers);
    assert.equal(values.renewable_percentage, 0, 'the || 100 bug');
  });

  test('0 as a number also survives', () => {
    const { values } = validatePlan({ ...goodForm, renewable_percentage: 0 }, providers);
    assert.equal(values.renewable_percentage, 0);
  });

  test('100 is accepted', () => {
    const { values } = validatePlan({ ...goodForm, renewable_percentage: '100' }, providers);
    assert.equal(values.renewable_percentage, 100);
  });

  test('blank means not supplied, not 100', () => {
    const { values } = validatePlan({ ...goodForm, renewable_percentage: '' }, providers);
    assert.equal(values.renewable_percentage, null);
  });

  test('above 100 is rejected', () => {
    const { valid, errors } = validatePlan({ ...goodForm, renewable_percentage: '150' }, providers);
    assert.equal(valid, false);
    assert.ok(errors.renewable_percentage);
  });

  test('negative is rejected', () => {
    assert.equal(validatePlan({ ...goodForm, renewable_percentage: '-5' }, providers).valid, false);
  });
});

describe('numeric parsing — blank, zero, invalid and absent are different', () => {
  test('invalid input never becomes a silent zero', () => {
    // The dangerous pattern: `parseFloat(value) || 0` turns "abc" into a
    // legitimate-looking $0 pricing component.
    const { valid, errors } = validatePlan({ ...goodForm, tdsp_charges: 'abc' }, providers);
    assert.equal(valid, false);
    assert.ok(errors.tdsp_charges);
  });

  test('a deliberate zero is preserved', () => {
    const { values } = validatePlan({ ...goodForm, monthly_base_charge: '0' }, providers);
    assert.equal(values.monthly_base_charge, 0);
  });

  test('blank optional pricing is null, not zero', () => {
    const { values } = validatePlan({ ...goodForm, tdsp_charges: '' }, providers);
    assert.equal(values.tdsp_charges, null, 'null means unknown; 0 would mean free delivery');
  });

  test('a required rate cannot be blank', () => {
    const { valid, errors } = validatePlan({ ...goodForm, rate_per_kwh: '' }, providers);
    assert.equal(valid, false);
    assert.ok(errors.rate_per_kwh);
  });

  test('negative charges are rejected', () => {
    assert.equal(validatePlan({ ...goodForm, early_termination_fee: '-50' }, providers).valid, false);
  });

  test('a non-integer term is rejected', () => {
    assert.equal(validatePlan({ ...goodForm, contract_length: '12.5' }, providers).valid, false);
  });

  test('parse helpers distinguish the four states', () => {
    assert.deepEqual(parseOptionalNumber('', { field: 'X' }), { value: null, error: null });
    assert.deepEqual(parseOptionalNumber('0', { field: 'X' }), { value: 0, error: null });
    assert.ok(parseOptionalNumber('abc', { field: 'X' }).error);
    assert.ok(parseRequiredNumber('', { field: 'X' }).error);
  });
});

describe('URLs', () => {
  test('a valid URL is kept', () => {
    const { values } = validatePlan({ ...goodForm, plan_details_url: 'https://x.test/p' }, providers);
    assert.equal(values.plan_details_url, 'https://x.test/p');
  });

  test('blank is allowed', () => {
    assert.equal(validatePlan({ ...goodForm, plan_details_url: '' }, providers).valid, true);
  });

  test('malformed is rejected', () => {
    assert.equal(validatePlan({ ...goodForm, plan_details_url: 'not a url' }, providers).valid, false);
  });

  test('a non-http scheme is rejected', () => {
    assert.ok(parseOptionalUrl('javascript:alert(1)', { field: 'X' }).error);
  });
});

describe('required identity fields', () => {
  test('customer type must be one of the known values', () => {
    assert.equal(validatePlan({ ...goodForm, customer_type: 'nonsense' }, providers).valid, false);
  });

  test('plan name is required', () => {
    assert.equal(validatePlan({ ...goodForm, plan_name: '   ' }, providers).valid, false);
  });

  test('state is required and normalized', () => {
    assert.equal(validatePlan({ ...goodForm, state: '' }, providers).valid, false);
    assert.equal(validatePlan({ ...goodForm, state: 'tx' }, providers).values.state, 'TX');
  });

  test('an invalid rate type is rejected', () => {
    assert.equal(validatePlan({ ...goodForm, plan_type: 'magic' }, providers).valid, false);
  });

  test('a threshold with no credit is flagged', () => {
    const { valid, errors } = validatePlan(
      { ...goodForm, usage_credit_threshold: '1000', usage_credit: '' },
      providers
    );
    assert.equal(valid, false);
    assert.ok(errors.usage_credit);
  });
});

describe('pricing completeness matches the comparison engine', () => {
  test('rate plus delivery is complete', () => {
    const r = pricingCompleteness({ rate_per_kwh: 10, tdsp_charges: 4 });
    assert.equal(r.complete, true);
    assert.equal(r.savingsAvailable, true);
    assert.deepEqual(r.missing, []);
  });

  test('missing delivery is partial and names the field', () => {
    const r = pricingCompleteness({ rate_per_kwh: 10, tdsp_charges: null });
    assert.equal(r.complete, false);
    assert.equal(r.savingsAvailable, false, 'partial pricing cannot produce savings');
    assert.match(r.missing.join(' '), /delivery/i);
  });

  test('a missing rate is reported too', () => {
    assert.match(pricingCompleteness({ tdsp_charges: 4 }).missing.join(' '), /rate/i);
  });
});
