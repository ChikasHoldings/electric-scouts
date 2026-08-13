import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parsePrefixes,
  serviceAreaShape,
  readExclusions,
  writeExclusions,
  editableStates,
} from '../src/lib/serviceAreas.js';

/**
 * Editing a provider's service area.
 *
 * The failure mode these tests exist to prevent is silent and expensive: an
 * admin edits an unrelated field, the save rebuilds `service_areas` from only
 * what was on screen, and a provider's real coverage configuration is gone.
 * Nothing errors. The provider simply starts appearing in ZIPs it does not
 * serve, or disappearing from ones it does, and there is no trace of why.
 *
 * Production carries both shapes: 30 providers on `state_config`, 8 on the
 * simple form with `utility_territories` and `notes` alongside.
 */

const MULTI_STATE = {
  supported_states: ['TX', 'OH'],
  service_areas: {
    state_config: {
      TX: { excluded_zip_prefixes: ['770'], utility_territories: ['Oncor'] },
      OH: { excluded_zip_prefixes: [] },
    },
    notes: 'Verified 2026-03',
  },
};

const SIMPLE = {
  supported_states: ['TX'],
  service_areas: {
    excluded_zip_prefixes: ['750'],
    utility_territories: ['CenterPoint'],
    notes: 'TX only',
  },
};

// ─── Reading ────────────────────────────────────────────────

test('exclusions are read per state from a state_config provider', () => {
  assert.deepEqual(readExclusions(MULTI_STATE), { TX: ['770'], OH: [] });
});

test('a simple provider reports its exclusions without inventing a state', () => {
  assert.deepEqual(readExclusions(SIMPLE), { __all__: ['750'] });
});

test('a provider with no service_areas has no exclusions', () => {
  assert.deepEqual(readExclusions({ supported_states: ['TX'] }), {});
  assert.deepEqual(readExclusions(null), {});
});

test('the stored shape is identified correctly', () => {
  assert.equal(serviceAreaShape(MULTI_STATE.service_areas), 'state_config');
  assert.equal(serviceAreaShape(SIMPLE.service_areas), 'simple');
  assert.equal(serviceAreaShape(null), 'simple');
});

// ─── Writing: the part that must never destroy data ─────────

test('editing one state preserves every other state and the sibling keys', () => {
  const next = writeExclusions(MULTI_STATE.service_areas, { TX: ['770', '772'] });

  assert.deepEqual(next.state_config.TX.excluded_zip_prefixes, ['770', '772']);
  // The utility territory on TX is not on screen, and must survive.
  assert.deepEqual(next.state_config.TX.utility_territories, ['Oncor']);
  // OH was not edited at all.
  assert.deepEqual(next.state_config.OH, { excluded_zip_prefixes: [] });
  // Top-level keys the editor never surfaces.
  assert.equal(next.notes, 'Verified 2026-03');
});

test('editing a simple provider preserves its utilities and notes', () => {
  const next = writeExclusions(SIMPLE.service_areas, { __all__: ['750', '751'] });

  assert.deepEqual(next.excluded_zip_prefixes, ['750', '751']);
  assert.deepEqual(next.utility_territories, ['CenterPoint']);
  assert.equal(next.notes, 'TX only');
});

test('a save that edits nothing changes nothing', () => {
  // The exact scenario that destroyed data: an admin edits the phone number and
  // saves, and the service area comes along untouched.
  assert.deepEqual(writeExclusions(MULTI_STATE.service_areas, {}), MULTI_STATE.service_areas);
  assert.deepEqual(writeExclusions(SIMPLE.service_areas, {}), SIMPLE.service_areas);
});

test('a state_config provider is never silently converted to the simple shape', () => {
  const next = writeExclusions(MULTI_STATE.service_areas, { __all__: ['999'] });
  assert.ok(next.state_config, 'state_config must survive');
  assert.equal(next.excluded_zip_prefixes, undefined,
    'a simple-shape key must not be grafted onto a multi-state provider');
});

test('clearing a state\'s exclusions is honoured, not ignored', () => {
  const next = writeExclusions(MULTI_STATE.service_areas, { TX: [] });
  assert.deepEqual(next.state_config.TX.excluded_zip_prefixes, []);
});

test('a provider with no stored service area gains one cleanly', () => {
  assert.deepEqual(writeExclusions(null, { __all__: ['770'] }), { excluded_zip_prefixes: ['770'] });
  // Nothing edited and nothing stored stays nothing, rather than becoming an
  // empty object that reads differently downstream.
  assert.deepEqual(writeExclusions(null, {}), {});
});

// ─── Input handling ─────────────────────────────────────────

test('prefix input is trimmed and emptied entries dropped', () => {
  assert.deepEqual(parsePrefixes(' 770, 750 ,, 787 '), ['770', '750', '787']);
  assert.deepEqual(parsePrefixes(''), []);
  assert.deepEqual(parsePrefixes(null), []);
  assert.deepEqual(parsePrefixes(['770', ' 750 ']), ['770', '750']);
});

// ─── Which states get a row ─────────────────────────────────

test('a state the provider supports but has not configured is still editable', () => {
  // Otherwise the coverage gap is invisible: the public site treats a missing
  // state_config entry as "does not serve", and an admin has no way to see it.
  const states = editableStates({
    supported_states: ['TX', 'OH', 'PA'],
    service_areas: { state_config: { TX: {}, OH: {} } },
  });
  assert.deepEqual(states, ['OH', 'PA', 'TX']);
});
