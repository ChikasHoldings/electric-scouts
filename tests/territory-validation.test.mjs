/**
 * Delivery-tariff validation — `npm test`.
 *
 * A tariff applies to every plan in a market, so a bad value here is not one
 * wrong price, it is every price in that state. The rules worth pinning are the
 * ones where a plausible-looking value would be silently wrong.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { validateTerritory, parseZipPrefixes } from '../src/lib/territoryValidation.js';
import { BILLING_MODELS } from '../src/lib/deliveryTariff.js';

const good = {
  name: 'Oncor Electric Delivery',
  short_code: 'ONCOR',
  state: 'TX',
  billing_model: 'supply_only',
  delivery_per_kwh_cents: '4.85',
  fixed_monthly_delivery_charge: '5.47',
  effective_from: '2026-01-01',
  effective_to: '',
  source_name: 'Oncor tariff schedule',
  source_url: 'https://example.com/tariff.pdf',
  verified_at: '2026-08-13',
  service_zip_prefixes: '770, 772',
  notes: '',
  is_active: true,
};

describe('a tariff must identify its market', () => {
  test('a complete tariff is accepted', () => {
    const { valid, values } = validateTerritory(good);
    assert.equal(valid, true);
    assert.equal(values.delivery_per_kwh_cents, 4.85);
    assert.equal(values.state, 'TX');
  });

  test('a nameless tariff is rejected', () => {
    assert.equal(validateTerritory({ ...good, name: '  ' }).valid, false);
  });

  test('an unrecognised billing model is rejected', () => {
    const { valid, errors } = validateTerritory({ ...good, billing_model: 'whatever' });
    assert.equal(valid, false);
    assert.ok(errors.billing_model);
  });
});

describe('an all-in tariff cannot also carry a delivery charge', () => {
  test('the charge is cleared rather than stored alongside', () => {
    // Storing both invites somebody to add the charge later and double-bill
    // every customer in the market, since the advertised rate already includes
    // delivery.
    const { valid, values } = validateTerritory({
      ...good,
      billing_model: BILLING_MODELS.ALL_IN,
      delivery_per_kwh_cents: '4.85',
      fixed_monthly_delivery_charge: '5.47',
    });

    assert.equal(valid, true);
    assert.equal(values.delivery_per_kwh_cents, null);
    assert.equal(values.fixed_monthly_delivery_charge, null);
  });
});

describe('blank and zero are different answers', () => {
  test('blank means not researched', () => {
    const { values } = validateTerritory({ ...good, delivery_per_kwh_cents: '' });
    assert.equal(values.delivery_per_kwh_cents, null);
  });

  test('zero is a real finding and is kept', () => {
    // Unlike a plan, where 0 was only ever the schema default, 0 on a tariff
    // records "checked, this territory levies no per-kWh charge".
    const { valid, values } = validateTerritory({ ...good, delivery_per_kwh_cents: '0' });
    assert.equal(valid, true);
    assert.equal(values.delivery_per_kwh_cents, 0);
  });

  test('an unparseable charge never becomes a silent zero', () => {
    const { valid, errors } = validateTerritory({ ...good, delivery_per_kwh_cents: 'abc' });
    assert.equal(valid, false);
    assert.ok(errors.delivery_per_kwh_cents);
  });

  test('a negative charge is rejected', () => {
    assert.equal(validateTerritory({ ...good, delivery_per_kwh_cents: '-1' }).valid, false);
  });
});

describe('the effective window has to make sense', () => {
  test('effective from is required', () => {
    const { valid, errors } = validateTerritory({ ...good, effective_from: '' });
    assert.equal(valid, false);
    assert.ok(errors.effective_from);
  });

  test('a window that ends before it starts is rejected', () => {
    const { valid, errors } = validateTerritory({
      ...good, effective_from: '2026-06-01', effective_to: '2026-01-01',
    });
    assert.equal(valid, false);
    assert.ok(errors.effective_to);
  });

  test('an open-ended window is the normal case', () => {
    const { valid, values } = validateTerritory({ ...good, effective_to: '' });
    assert.equal(valid, true);
    assert.equal(values.effective_to, null);
  });

  test('a malformed date is rejected rather than coerced', () => {
    assert.equal(validateTerritory({ ...good, effective_from: '01/06/2026' }).valid, false);
    assert.equal(validateTerritory({ ...good, effective_from: '2026-13-45' }).valid, false);
  });
});

describe('provenance', () => {
  test('a malformed source URL is rejected', () => {
    const { valid, errors } = validateTerritory({ ...good, source_url: 'not a url' });
    assert.equal(valid, false);
    assert.ok(errors.source_url);
  });

  test('an unsourced tariff still saves — it is flagged, not blocked', () => {
    // Blocking would stop an operator recording a rate they have on paper.
    // The list marks it "unsourced" so the gap stays visible.
    const { valid, values } = validateTerritory({ ...good, source_url: '', source_name: '' });
    assert.equal(valid, true);
    assert.equal(values.source_url, null);
  });
});

describe('ZIP prefixes', () => {
  test('free text becomes a clean array', () => {
    assert.deepEqual(parseZipPrefixes('770, 772  773'), ['770', '772', '773']);
  });

  test('duplicates and junk are dropped', () => {
    assert.deepEqual(parseZipPrefixes('770, 770, abc, 772'), ['770', '772']);
  });

  test('empty means the whole state, stored as null', () => {
    const { values } = validateTerritory({ ...good, service_zip_prefixes: '' });
    assert.equal(values.service_zip_prefixes, null);
  });

  test('an array passes through', () => {
    assert.deepEqual(parseZipPrefixes(['770', ' 772 ']), ['770', '772']);
  });
});
