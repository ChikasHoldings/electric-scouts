/**
 * Lead-buyer integration presets — `npm test`.
 *
 * The promise being pinned: an admin picks a platform, pastes the credentials
 * their buyer issued, and delivery works with no code change. Every rule here
 * is one that would otherwise turn that into a developer task.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  LEAD_BUYER_PRESETS,
  PRESETS_BY_ID,
  AUTH_STYLES,
  mapPayload,
  isAccepted,
  missingConfiguration,
  deliveryIsVerifiable,
} from '../src/lib/leadBuyerPresets.js';

const canonical = {
  first_name: 'Henry', last_name: 'Kabakwu',
  email: 'henry@example.com', phone: '+14695551234',
  zip: '77001', city: 'Houston', state: 'TX',
  service_address: '123 Main St',
  monthly_usage_kwh: 1200,
};

describe('preset catalogue', () => {
  test('every preset carries what the delivery layer needs', () => {
    for (const p of LEAD_BUYER_PRESETS) {
      assert.ok(p.id && p.name, 'id and name');
      assert.ok(Object.values(AUTH_STYLES).includes(p.authStyle), `${p.id} auth style`);
      assert.ok(['json', 'form'].includes(p.contentType), `${p.id} content type`);
      assert.ok(p.successWhen?.type, `${p.id} success rule`);
      assert.ok(Array.isArray(p.requiredExtras), `${p.id} extras`);
    }
  });

  test('no per-account endpoint is hardcoded as a real URL', () => {
    // Guessing an endpoint would post a customer's personal data to an address
    // we invented. Hints carry placeholders; the admin pastes the real one.
    for (const p of LEAD_BUYER_PRESETS) {
      if (!p.endpointHint) continue;
      if (p.endpointHint.includes('<')) continue; // placeholder, fine
      assert.ok(
        /example\.com|salesforce\.com|zapier\.com|hsforms\.com/.test(p.endpointHint),
        `${p.id} hint looks like a guessed live endpoint: ${p.endpointHint}`
      );
    }
  });

  test('ids are unique and indexed', () => {
    const ids = LEAD_BUYER_PRESETS.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.ok(PRESETS_BY_ID[id]);
  });
});

describe('field mapping', () => {
  test('canonical fields become the buyer\'s names', () => {
    const out = mapPayload(PRESETS_BY_ID.boberdoo, canonical);
    assert.equal(out.email_address, 'henry@example.com');
    assert.equal(out.phone_home, '+14695551234');
    assert.equal(out.address, '123 Main St');
  });

  test('a preset with no map posts our shape unchanged', () => {
    const out = mapPayload(PRESETS_BY_ID.generic_webhook, canonical);
    assert.equal(out.email, 'henry@example.com');
    assert.equal(out.monthly_usage_kwh, 1200);
  });

  test('unmapped fields are dropped, not passed through under our names', () => {
    // Sending keys a buyer did not ask for is how a strict endpoint rejects an
    // otherwise-good lead.
    const out = mapPayload(PRESETS_BY_ID.boberdoo, canonical);
    assert.equal(out.monthly_usage_kwh, undefined);
    assert.equal(out.first_name, 'Henry', 'mapped fields still arrive');
  });

  test('empty and null values are omitted rather than sent blank', () => {
    const out = mapPayload(PRESETS_BY_ID.leadspedia, { ...canonical, city: '', state: null });
    assert.equal('city' in out, false);
    assert.equal('state' in out, false);
  });

  test('campaign extras ride alongside the mapped fields', () => {
    const out = mapPayload(PRESETS_BY_ID.boberdoo, canonical, { SRC: '42', TYPE: '7' });
    assert.equal(out.SRC, '42');
    assert.equal(out.TYPE, '7');
    assert.equal(out.first_name, 'Henry');
  });

  test('CRM presets use the CRM\'s own field names', () => {
    assert.equal(mapPayload(PRESETS_BY_ID.hubspot, canonical).firstname, 'Henry');
    assert.equal(mapPayload(PRESETS_BY_ID.salesforce_web_to_lead, canonical).street, '123 Main St');
  });
});

describe('acceptance — a 200 is not proof of acceptance', () => {
  test('LeadsPedia rejects with HTTP 200 and a status field', () => {
    const p = PRESETS_BY_ID.leadspedia;
    assert.equal(isAccepted(p, { status: 200, body: '{"status":"success"}' }), true);
    assert.equal(isAccepted(p, { status: 200, body: '{"status":"rejected"}' }), false);
  });

  test('LeadProsper duplicates come back 200 and must not count', () => {
    const p = PRESETS_BY_ID.leadprosper;
    assert.equal(isAccepted(p, { status: 200, body: '{"status":"ACCEPTED"}' }), true);
    assert.equal(isAccepted(p, { status: 200, body: '{"status":"DUPLICATE"}' }), false);
  });

  test('Boberdoo signals acceptance in the body', () => {
    const p = PRESETS_BY_ID.boberdoo;
    assert.equal(isAccepted(p, { status: 200, body: '<response>matched</response>' }), true);
    assert.equal(isAccepted(p, { status: 200, body: '<response>unmatched</response>' }), false);
  });

  test('an HTTP error is never accepted, whatever the body says', () => {
    assert.equal(isAccepted(PRESETS_BY_ID.leadspedia, { status: 500, body: '{"status":"success"}' }), false);
    assert.equal(isAccepted(PRESETS_BY_ID.generic_webhook, { status: 502, body: 'ok' }), false);
  });

  test('unparseable JSON is not accepted', () => {
    assert.equal(isAccepted(PRESETS_BY_ID.leadprosper, { status: 200, body: 'not json' }), false);
  });

  test('an already-parsed body works too', () => {
    assert.equal(isAccepted(PRESETS_BY_ID.leadprosper, { status: 200, body: { status: 'ACCEPTED' } }), true);
  });

  test('a plain webhook accepts on HTTP status alone', () => {
    assert.equal(isAccepted(PRESETS_BY_ID.generic_webhook, { status: 201, body: '' }), true);
  });
});

describe('verifiability is reported honestly', () => {
  test('Salesforce Web-to-Lead cannot be verified', () => {
    // It always returns 200 and gives no confirmation. Recording that as a
    // confirmed delivery would overstate what we know.
    assert.equal(deliveryIsVerifiable(PRESETS_BY_ID.salesforce_web_to_lead), false);
  });

  test('platforms with a status document can be verified', () => {
    assert.equal(deliveryIsVerifiable(PRESETS_BY_ID.leadspedia), true);
    assert.equal(deliveryIsVerifiable(PRESETS_BY_ID.boberdoo), true);
  });
});

describe('what the admin still has to supply', () => {
  test('an endpoint is always required, with the shape to expect', () => {
    const missing = missingConfiguration(PRESETS_BY_ID.boberdoo, {});
    assert.ok(missing.some((m) => /endpoint/i.test(m)));
    assert.ok(missing.some((m) => /boberdoo\.com/.test(m)), 'the hint should be shown');
  });

  test('campaign identifiers are listed by their real names', () => {
    const missing = missingConfiguration(PRESETS_BY_ID.boberdoo, {
      endpoint: 'https://x.boberdoo.com/api/leadPost', credential: 'k',
    });
    assert.ok(missing.some((m) => /SRC/.test(m)));
    assert.ok(missing.some((m) => /TYPE/.test(m)));
  });

  test('a fully configured buyer is missing nothing', () => {
    const missing = missingConfiguration(PRESETS_BY_ID.boberdoo, {
      endpoint: 'https://x.boberdoo.com/api/leadPost',
      credential: 'key123',
      extras: { SRC: '42', TYPE: '7' },
    });
    assert.deepEqual(missing, []);
  });

  test('a preset needing no auth does not demand a credential', () => {
    // Zapier's secret is inside the URL it issues.
    assert.deepEqual(
      missingConfiguration(PRESETS_BY_ID.zapier, { endpoint: 'https://hooks.zapier.com/hooks/catch/1/a/' }),
      []
    );
  });

  test('no preset selected is reported as such', () => {
    assert.deepEqual(missingConfiguration(null, {}), ['Select a platform.']);
  });
});

describe('substring traps in acceptance matching', () => {
  test('"unmatched" does not satisfy "matched"', () => {
    // The bug this pins: a plain includes() check accepts every rejected lead,
    // because the rejection word contains the acceptance word.
    const p = PRESETS_BY_ID.boberdoo;
    assert.equal(isAccepted(p, { status: 200, body: 'unmatched' }), false);
    assert.equal(isAccepted(p, { status: 200, body: 'UNMATCHED' }), false);
    assert.equal(isAccepted(p, { status: 200, body: 'matched' }), true);
  });

  test('the token is matched as a word inside a larger document', () => {
    const p = PRESETS_BY_ID.boberdoo;
    assert.equal(isAccepted(p, { status: 200, body: '<r><status>matched</status></r>' }), true);
    assert.equal(isAccepted(p, { status: 200, body: '<r><status>unmatched</status></r>' }), false);
  });
});
