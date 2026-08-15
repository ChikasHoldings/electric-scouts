/**
 * Importing tariffs and rates in bulk — `npm test`.
 *
 * The delivery tariff table is empty, which is the single reason no visitor can
 * be shown a saving: without it every plan prices supply-only and the engine
 * refuses to compute a comparison it cannot defend. Getting seventeen tariffs
 * in is a paste, not a typing exercise — but a pasted number reaches every plan
 * in a market at once, so the paste has to be checked harder than a form entry,
 * not less.
 *
 * The check these tests care most about is the unit error. A rate written in
 * dollars where the column wants cents passes every range and type check that
 * exists, and then makes every estimate in that market wrong by a factor of a
 * hundred — in the direction that invents savings.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseDelimited,
  importTerritories,
  importPlans,
  dayBefore,
  TERRITORY_COLUMNS,
} from '../src/lib/bulkImport.js';

const providers = [
  { id: 'p1', name: 'NextVolt Energy' },
  { id: 'p2', name: 'SmartEnergy' },
];

const header = 'name,state,billing_model,delivery_per_kwh_cents,fixed_monthly_delivery_charge,effective_from';
const territory = (over = '') =>
  `${header}\nOncor,TX,supply_only,4.8,4.23,2026-01-01${over ? `\n${over}` : ''}`;

describe('reading what people actually paste', () => {
  test('a tab-separated spreadsheet paste is read as readily as CSV', () => {
    const tsv = 'name\tstate\tbilling_model\tdelivery_per_kwh_cents\teffective_from\n'
      + 'AEP Ohio\tOH\tsupply_only\t4.1\t2026-01-01';
    const { rows, error } = parseDelimited(tsv, TERRITORY_COLUMNS);
    assert.equal(error, null);
    assert.equal(rows[0].record.name, 'AEP Ohio');
    assert.equal(rows[0].record.delivery_per_kwh_cents, '4.1');
  });

  test('a quoted field keeps its commas', () => {
    const csv = 'name,state,billing_model,effective_from\n"CenterPoint, Houston",TX,supply_only,2026-01-01';
    const { rows } = parseDelimited(csv, TERRITORY_COLUMNS);
    assert.equal(rows[0].record.name, 'CenterPoint, Houston');
  });

  test('headers are matched however the source spelled them', () => {
    const csv = 'Utility Name,ST,Billing,Delivery Rate,Effective Date\nPECO,PA,supply,4.4,2026-01-01';
    const { rows, unknownHeaders } = parseDelimited(csv, TERRITORY_COLUMNS);
    assert.deepEqual(unknownHeaders, []);
    assert.equal(rows[0].record.name, 'PECO');
    assert.equal(rows[0].record.delivery_per_kwh_cents, '4.4');
  });

  test('a column nobody recognises is reported, not silently dropped', () => {
    const csv = 'name,state,billing_model,effective_from,rider_c\nPECO,PA,supply_only,2026-01-01,1.2';
    const { unknownHeaders } = parseDelimited(csv, TERRITORY_COLUMNS);
    assert.deepEqual(unknownHeaders, ['rider_c']);
  });

  test('a header with no rows under it is an error, not an empty success', () => {
    assert.match(parseDelimited(header, TERRITORY_COLUMNS).error, /header row and no data/);
    assert.match(parseDelimited('', TERRITORY_COLUMNS).error, /Nothing to import/);
  });
});

describe('a delivery charge in the wrong unit is refused', () => {
  test('dollars per kWh pasted into a cents column is caught and explained', () => {
    // $0.048/kWh is the same tariff as 4.8¢, and the difference is every
    // estimate in the market being 1/100th of the truth.
    const { rows } = importTerritories(
      `${header}\nOncor,TX,supply_only,0.048,4.23,2026-01-01`
    );
    assert.equal(rows[0].action, 'invalid');
    assert.match(rows[0].errors.join(' '), /looks like dollars/);
    assert.match(rows[0].errors.join(' '), /4\.80 was probably meant/);
  });

  test('a plausible cents figure passes', () => {
    const { rows, summary } = importTerritories(territory());
    assert.equal(rows[0].errors.length, 0, rows[0].errors.join('; '));
    assert.equal(summary.create, 1);
    assert.equal(rows[0].values.delivery_per_kwh_cents, 4.8);
  });

  test('a figure beyond any real US tariff is refused with the bound named', () => {
    const { rows } = importTerritories(`${header}\nOncor,TX,supply_only,48,4.23,2026-01-01`);
    assert.match(rows[0].errors.join(' '), /above anything seen in a US market/);
  });

  test('zero delivery is allowed on a tariff — it records a real finding', () => {
    const { rows } = importTerritories(`${header}\nMunicipal,TX,supply_only,0,0,2026-01-01`);
    assert.equal(rows[0].errors.length, 0, rows[0].errors.join('; '));
  });

  test('a blank delivery charge warns that no saving can be shown there', () => {
    const { rows } = importTerritories(`${header}\nUnknown Co,TX,supply_only,,,2026-01-01`);
    assert.equal(rows[0].errors.length, 0);
    assert.match(rows[0].warnings.join(' '), /supply-only and show no saving/);
  });
});

describe('the billing model that is easy to get backwards', () => {
  test('an all-in territory carrying a delivery charge is refused', () => {
    const { rows } = importTerritories(`${header}\nEversource,MA,all_in,4.8,,2026-01-01`);
    assert.equal(rows[0].action, 'invalid');
    assert.match(rows[0].errors.join(' '), /double-count/);
  });

  test('an all-in territory with no delivery charge is complete as it stands', () => {
    const { rows } = importTerritories(`${header}\nEversource,MA,all_in,,,2026-01-01`);
    assert.equal(rows[0].errors.length, 0, rows[0].errors.join('; '));
    assert.equal(rows[0].values.delivery_per_kwh_cents, null);
  });

  test('the spellings a tariff sheet would actually use are understood', () => {
    for (const [spelling, expected] of [
      ['supply only', 'supply_only'], ['energy only', 'supply_only'], ['excludes delivery', 'supply_only'],
      ['all-in', 'all_in'], ['bundled', 'all_in'], ['includes delivery', 'all_in'],
    ]) {
      const { rows } = importTerritories(`${header}\nX,TX,${spelling},,,2026-01-01`);
      assert.equal(rows[0].values.billing_model, expected, `"${spelling}"`);
    }
  });

  test('a model nobody recognises is refused rather than guessed', () => {
    const { rows } = importTerritories(`${header}\nX,TX,whatever,,,2026-01-01`);
    assert.equal(rows[0].action, 'invalid');
  });
});

describe('an import says what it will change before it changes it', () => {
  const existing = [{
    id: 't1', name: 'Oncor', state: 'TX', billing_model: 'supply_only',
    delivery_per_kwh_cents: 4.8, fixed_monthly_delivery_charge: 4.23,
    effective_from: '2026-01-01', is_active: true,
  }];

  test('the same tariff again is unchanged, not a rewrite', () => {
    const { summary, rows } = importTerritories(territory(), existing);
    assert.equal(rows[0].action, 'unchanged');
    assert.equal(summary.unchanged, 1);
    assert.equal(summary.supersede, 0);
  });

  test('a changed rate supersedes rather than overwrites', () => {
    const { rows, summary } = importTerritories(
      `${header}\nOncor,TX,supply_only,5.1,4.23,2026-09-01`, existing
    );
    assert.equal(rows[0].action, 'supersede');
    assert.equal(summary.supersede, 1);
    assert.equal(rows[0].current.delivery_per_kwh_cents, 4.8, 'the old tariff is carried for closing');
  });

  test('a superseded tariff closes the day before its replacement opens', () => {
    // Same-day closure leaves a date with two tariffs in force, and the engine
    // takes whichever the query happened to return first.
    assert.equal(dayBefore('2026-09-01'), '2026-08-31');
    assert.equal(dayBefore('2026-01-01'), '2025-12-31');
    assert.equal(dayBefore('nonsense'), null);
  });

  test('the same territory twice in one file is refused', () => {
    const { rows } = importTerritories(
      `${header}\nOncor,TX,supply_only,4.8,4.23,2026-01-01\nOncor,TX,supply_only,5.2,4.23,2026-01-01`
    );
    assert.equal(rows[1].action, 'invalid');
    assert.match(rows[1].errors.join(' '), /appears twice/);
  });

  test('effective dating runs forwards', () => {
    const { rows } = importTerritories(
      `${header},effective_to\nOncor,TX,supply_only,4.8,4.23,2026-06-01,2026-01-01`
    );
    assert.equal(rows[0].action, 'invalid');
    assert.match(rows[0].errors.join(' '), /cannot be before/);
  });
});

describe('plan rates get the same unit check', () => {
  const planHeader = 'provider_name,plan_name,state,customer_type,rate_per_kwh,contract_length,plan_type';

  test('a rate in dollars is caught before it invents a saving', () => {
    const { rows } = importPlans(
      `${planHeader}\nNextVolt Energy,Fixed 12,TX,residential,0.135,12,fixed`, providers
    );
    assert.equal(rows[0].action, 'invalid');
    assert.match(rows[0].errors.join(' '), /looks like dollars/);
    assert.match(rows[0].errors.join(' '), /13\.50 was probably meant/);
  });

  test('a real rate card imports cleanly', () => {
    const { rows, summary } = importPlans(
      `${planHeader}\nNextVolt Energy,Fixed 12,TX,residential,13.5,12,fixed`, providers
    );
    assert.equal(rows[0].errors.length, 0, rows[0].errors.join('; '));
    assert.equal(summary.create, 1);
  });

  test('a supplier the catalog does not carry is refused', () => {
    const { rows } = importPlans(
      `${planHeader}\nGhost Energy,Fixed 12,TX,residential,13.5,12,fixed`, providers
    );
    assert.equal(rows[0].action, 'invalid');
  });

  test('a changed rate is reported as a move, not just an update', () => {
    const existing = [{
      provider_name: 'NextVolt Energy', plan_name: 'Fixed 12', state: 'TX',
      customer_type: 'residential', rate_per_kwh: 13.5, contract_length: 12,
    }];
    const { rows } = importPlans(
      `${planHeader}\nNextVolt Energy,Fixed 12,TX,residential,12.9,12,fixed`, providers, existing
    );
    assert.equal(rows[0].action, 'update');
    assert.deepEqual(rows[0].rateChange, { from: 13.5, to: 12.9 });
  });

  test('an unchanged rate is left alone', () => {
    const existing = [{
      provider_name: 'NextVolt Energy', plan_name: 'Fixed 12', state: 'TX',
      customer_type: 'residential', rate_per_kwh: 13.5, contract_length: 12,
    }];
    const { rows, summary } = importPlans(
      `${planHeader}\nNextVolt Energy,Fixed 12,TX,residential,13.5,12,fixed`, providers, existing
    );
    assert.equal(rows[0].action, 'unchanged');
    assert.equal(summary.unchanged, 1);
  });

  test('a per-plan delivery override warns that it overrides the tariff', () => {
    const { rows } = importPlans(
      `${planHeader},tdsp_charges\nNextVolt Energy,Fixed 12,TX,residential,13.5,12,fixed,4.8`,
      providers
    );
    assert.match(rows[0].warnings.join(' '), /territory tariff will be ignored/);
  });
});
