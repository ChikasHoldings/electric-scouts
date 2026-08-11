/**
 * Landing page → /compare-rates handoff — `npm test`.
 *
 * The product rule these tests defend: a visitor is never asked for something
 * Electric Scouts already knows. Each service landing page establishes a ZIP
 * code and an intent, and the shared engine has to open on the first question
 * that is genuinely unanswered — Property Type, Business Type or Home/Business
 * — while a visitor arriving at /compare-rates cold still starts at ZIP.
 *
 * They also cover the parts of the handoff that fail silently: attribution
 * surviving the hop, a hand-edited URL normalizing instead of seeding junk, and
 * contact details staying out of browser storage.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCompareUrl,
  checkServiceZip,
  ENTRY_CONTEXTS,
  ENTRY_PARAM_KEYS,
  landingSeed,
  normalizeZip,
  parseEntryParams,
  resolveEntryContext,
  SERVICE_INTENTS,
} from '../src/components/compare/engine/entryContext.js';
import {
  createInitialState,
  resetServiceSelection,
  CUSTOMER_TYPES,
} from '../src/components/compare/engine/comparisonState.js';
import { determineNextQuestion } from '../src/components/compare/engine/nextQuestion.js';
import { buildLeadPayload, safeSessionSnapshot } from '../src/components/compare/engine/persistence.js';
import { campaignContext } from '../src/components/compare/engine/attribution.js';

/** The state a visitor lands in after submitting a ZIP on a landing page. */
function sessionFromLanding(service, zip = '75001') {
  const check = checkServiceZip(zip);
  return { ...createInitialState(), ...landingSeed(service, check) };
}

/** The state the engine bootstraps into from a handoff URL, with no prior session. */
function sessionFromUrl(url) {
  const { seed } = parseEntryParams(url.split('?')[1] || '');
  return { ...createInitialState(), ...seed };
}

describe('ZIP serviceability is one implementation', () => {
  test('a deregulated ZIP resolves to its state', () => {
    const result = checkServiceZip('75001');
    assert.equal(result.valid, true);
    assert.equal(result.zip, '75001');
    assert.equal(result.state, 'TX');
  });

  test('a short ZIP is incomplete rather than out of market', () => {
    const result = checkServiceZip('750');
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'incomplete');
    assert.match(result.message, /5-digit/);
  });

  test('a ZIP outside a competitive market says so, and says it once', () => {
    const result = checkServiceZip('99999');
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'out_of_market');
    assert.match(result.message, /don't cover this ZIP code yet/);
  });

  test('formatting and stray characters are normalized away', () => {
    assert.equal(normalizeZip(' 75001-4321 '), '75001');
    assert.equal(checkServiceZip('75001abc').valid, true);
  });

  test('no raw validator text reaches the visitor', () => {
    // The engine's messages are written for people; the validator's are not.
    for (const zip of ['', '1', '00000', 'abcde']) {
      const result = checkServiceZip(zip);
      assert.equal(result.valid, false);
      assert.ok(result.message.length > 0);
      assert.ok(!/deregulated electricity market$/.test(result.message));
    }
  });
});

describe('residential landing hands off to Property Type', () => {
  const session = sessionFromLanding('residential');

  test('ZIP and audience arrive with the visitor', () => {
    assert.equal(session.zip, '75001');
    assert.equal(session.state, 'TX');
    assert.equal(session.customerType, CUSTOMER_TYPES.RESIDENTIAL);
    assert.equal(session.entryContext, ENTRY_CONTEXTS.RESIDENTIAL_LANDING);
  });

  test('the engine opens on property type, not on ZIP or customer type', () => {
    assert.equal(determineNextQuestion(session).id, 'property_type');
  });

  test('the same result arrives through the URL alone', () => {
    const fromUrl = sessionFromUrl(buildCompareUrl('residential', '75001'));
    assert.equal(fromUrl.zip, '75001');
    assert.equal(fromUrl.customerType, CUSTOMER_TYPES.RESIDENTIAL);
    assert.equal(determineNextQuestion(fromUrl).id, 'property_type');
  });
});

describe('commercial landing hands off to Business Type', () => {
  const session = sessionFromLanding('commercial');

  test('the commercial audience is already known', () => {
    assert.equal(session.customerType, CUSTOMER_TYPES.COMMERCIAL);
    assert.equal(session.energyPreference, '');
    assert.equal(session.entryContext, ENTRY_CONTEXTS.COMMERCIAL_LANDING);
  });

  test('the engine opens on business type', () => {
    assert.equal(determineNextQuestion(session).id, 'business_type');
  });

  test('the same result arrives through the URL alone', () => {
    const fromUrl = sessionFromUrl(buildCompareUrl('commercial', '75001'));
    assert.equal(determineNextQuestion(fromUrl).id, 'business_type');
  });
});

describe('renewable landing hands off to Home or Business', () => {
  const session = sessionFromLanding('renewable');

  test('the preference is known and the audience is not', () => {
    assert.equal(session.energyPreference, 'renewable');
    assert.equal(session.customerType, '');
    assert.equal(session.entryContext, ENTRY_CONTEXTS.RENEWABLE_LANDING);
  });

  test('the engine asks home or business, never "what are you shopping for?"', () => {
    assert.equal(determineNextQuestion(session).id, 'renewable_context');
  });

  test('the renewable preference survives into the chosen branch', () => {
    const home = { ...session, customerType: CUSTOMER_TYPES.RESIDENTIAL };
    assert.equal(determineNextQuestion(home).id, 'property_type');
    assert.equal(home.energyPreference, 'renewable');
  });

  test('the same result arrives through the URL alone', () => {
    const fromUrl = sessionFromUrl(buildCompareUrl('renewable', '75001'));
    assert.equal(fromUrl.energyPreference, 'renewable');
    assert.equal(determineNextQuestion(fromUrl).id, 'renewable_context');
  });
});

describe('direct entry to /compare-rates is unchanged', () => {
  test('a visitor with no session still starts at ZIP', () => {
    const fresh = createInitialState();
    assert.equal(determineNextQuestion(fresh).id, 'zip');
    assert.equal(resolveEntryContext(fresh), ENTRY_CONTEXTS.COMPARE_RATES_DIRECT);
  });

  test('after answering ZIP they are asked what they are shopping for', () => {
    const afterZip = { ...createInitialState(), zip: '75001', state: 'TX' };
    assert.equal(determineNextQuestion(afterZip).id, 'customer_type');
  });

  test('a bare /compare-rates URL seeds nothing', () => {
    const { seed, hasEntryParams } = parseEntryParams('');
    assert.deepEqual(seed, {});
    assert.equal(hasEntryParams, false);
  });
});

describe('the bill analyzer keeps its place in the flow', () => {
  test('the bill offer follows the first branch question, not the ZIP question', () => {
    const residential = { ...sessionFromLanding('residential'), propertyType: 'house' };
    assert.equal(determineNextQuestion(residential).id, 'bill_offer');

    const commercial = { ...sessionFromLanding('commercial'), businessType: 'retail' };
    assert.equal(determineNextQuestion(commercial).id, 'bill_offer');
  });

  test('renewable reaches the bill offer through the home branch', () => {
    const session = {
      ...sessionFromLanding('renewable'),
      customerType: CUSTOMER_TYPES.RESIDENTIAL,
      propertyType: 'apartment',
    };
    assert.equal(determineNextQuestion(session).id, 'bill_offer');
  });

  test('usage measured by the analyzer is never asked for again', () => {
    const fromAnalyzer = sessionFromUrl(
      `/compare-rates?zip=75001&usage=1240&provider=TXU%20Energy&entry=${ENTRY_CONTEXTS.BILL_ANALYZER}`
    );
    assert.equal(fromAnalyzer.monthlyUsageKwh, 1240);
    assert.equal(fromAnalyzer.currentProvider, 'TXU Energy');
    assert.equal(fromAnalyzer.entryContext, ENTRY_CONTEXTS.BILL_ANALYZER);

    const residential = {
      ...fromAnalyzer,
      customerType: CUSTOMER_TYPES.RESIDENTIAL,
      propertyType: 'house',
    };
    // Usage is known, so neither the bill offer nor the usage band is asked.
    assert.equal(determineNextQuestion(residential).id, 'shopping_intent');
  });
});

describe('handoff URLs carry routing context and nothing else', () => {
  test('each service produces its own parameters', () => {
    assert.equal(buildCompareUrl('residential', '75001'), '/compare-rates?zip=75001&type=home&entry=residential_landing');
    assert.equal(buildCompareUrl('commercial', '75001'), '/compare-rates?zip=75001&type=business&entry=commercial_landing');
    assert.equal(buildCompareUrl('renewable', '75001'), '/compare-rates?zip=75001&renewable=1&entry=renewable_landing');
  });

  test('no contact detail can reach the URL', () => {
    for (const service of Object.keys(SERVICE_INTENTS)) {
      const url = buildCompareUrl(service, '75001');
      const keys = [...new URLSearchParams(url.split('?')[1]).keys()];
      for (const key of keys) assert.ok(ENTRY_PARAM_KEYS.includes(key), `unexpected parameter: ${key}`);
      assert.ok(!/name|email|phone/i.test(url));
    }
  });

  test('an unusable ZIP is left out rather than passed along', () => {
    assert.equal(buildCompareUrl('residential', '75'), '/compare-rates?type=home&entry=residential_landing');
    assert.equal(buildCompareUrl('residential', ''), '/compare-rates?type=home&entry=residential_landing');
  });

  test('the URL never carries the comparison object itself', () => {
    const url = buildCompareUrl('commercial', '75001');
    assert.ok(!url.includes('%7B'), 'a serialized object in the URL');
    assert.ok(url.length < 120);
  });
});

describe('nothing off the URL is trusted', () => {
  test('an out-of-market ZIP does not seed a session', () => {
    const { seed } = parseEntryParams('zip=99999&type=home');
    assert.ok(!('zip' in seed), 'an unserviceable ZIP must not be seeded');
    assert.equal(seed.customerType, CUSTOMER_TYPES.RESIDENTIAL);
  });

  test('a malformed ZIP normalizes to no ZIP, so the engine simply asks', () => {
    const state = sessionFromUrl('/compare-rates?zip=abc&type=home');
    assert.equal(determineNextQuestion(state).id, 'zip');
  });

  test('unrecognised intent values are dropped', () => {
    const { seed } = parseEntryParams('type=enterprise&renewable=yes&entry=hacked');
    assert.ok(!('customerType' in seed));
    assert.ok(!('energyPreference' in seed));
    assert.ok(!('entryContext' in seed));
  });

  test('an injected entry context cannot be stored', () => {
    assert.equal(
      resolveEntryContext({ entryContext: '<script>alert(1)</script>' }),
      ENTRY_CONTEXTS.COMPARE_RATES_DIRECT
    );
  });

  test('absurd or negative usage is ignored', () => {
    for (const usage of ['-5', '0', 'NaN', '99999999999']) {
      const { seed } = parseEntryParams(`usage=${usage}`);
      assert.ok(!('monthlyUsageKwh' in seed), `usage=${usage} was accepted`);
    }
  });

  test('a long provider string is capped', () => {
    const { seed } = parseEntryParams(`provider=${'x'.repeat(500)}`);
    assert.equal(seed.currentProvider.length, 120);
  });
});

describe('changing service type keeps the session', () => {
  const commercial = {
    ...sessionFromLanding('commercial'),
    businessType: 'restaurant',
    monthlySpendRange: '1500_4999',
    timing: 'now',
    businessName: 'Acme',
    monthlyUsageKwh: 4200,
    firstName: 'Sam',
    email: 'sam@example.com',
    attribution: { utm_source: 'google', utm_campaign: 'commercial_tx' },
    history: ['business_type', 'bill_offer', 'commercial_spend'],
  };

  const changed = resetServiceSelection(commercial);

  test('the visitor is asked what they are shopping for again', () => {
    assert.equal(determineNextQuestion(changed).id, 'customer_type');
  });

  test('ZIP, attribution, contact and bill figures survive', () => {
    assert.equal(changed.zip, '75001');
    assert.equal(changed.state, 'TX');
    assert.equal(changed.attribution.utm_source, 'google');
    assert.equal(changed.email, 'sam@example.com');
    assert.equal(changed.monthlyUsageKwh, 4200);
  });

  test('the abandoned branch leaves nothing behind', () => {
    assert.equal(changed.customerType, '');
    assert.equal(changed.businessType, '');
    assert.equal(changed.businessName, '');
    assert.equal(changed.monthlySpendRange, '');
    assert.equal(changed.timing, '');
  });

  test('history cannot send Back into the abandoned branch', () => {
    assert.deepEqual(changed.history, []);
  });

  test('choosing residential afterwards starts that branch cleanly', () => {
    const residential = { ...changed, customerType: CUSTOMER_TYPES.RESIDENTIAL };
    assert.equal(determineNextQuestion(residential).id, 'property_type');
  });
});

describe('attribution survives the handoff', () => {
  test('the campaign that produced the landing visit reaches the lead', () => {
    const session = {
      ...sessionFromLanding('commercial'),
      businessType: 'office',
      firstName: 'Sam',
      email: 'sam@example.com',
      attribution: {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'tx_commercial',
        landing_page: 'https://www.electricscouts.com/business-electricity?utm_source=google',
        referrer: 'https://www.google.com/',
      },
    };

    const payload = buildLeadPayload(session);
    assert.equal(payload.attribution.utm_source, 'google');
    assert.equal(payload.attribution.utm_campaign, 'tx_commercial');
    assert.equal(payload.attribution.landing_page.includes('/business-electricity'), true);
    assert.equal(payload.comparison.entry_context, ENTRY_CONTEXTS.COMMERCIAL_LANDING);
  });

  test('a direct visit is recorded as one rather than left blank', () => {
    const session = {
      ...createInitialState(),
      zip: '75001',
      customerType: CUSTOMER_TYPES.RESIDENTIAL,
      email: 'sam@example.com',
    };
    assert.equal(buildLeadPayload(session).comparison.entry_context, ENTRY_CONTEXTS.COMPARE_RATES_DIRECT);
  });

  test('only campaign fields go to analytics, never full URLs', () => {
    const context = campaignContext({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'tx',
      referrer: 'https://www.google.com/',
      landing_page: 'https://www.electricscouts.com/residential-electricity',
    });
    assert.deepEqual(context, { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'tx' });
  });
});

describe('session recovery is safe to store', () => {
  test('contact details are never written to browser storage', () => {
    const session = {
      ...sessionFromLanding('residential'),
      propertyType: 'house',
      usageRange: '1000_1999',
      firstName: 'Sam',
      email: 'sam@example.com',
      phone: '5551234567',
      consentContact: true,
    };

    const stored = safeSessionSnapshot(session);
    const serialized = JSON.stringify(stored);

    assert.ok(!('email' in stored));
    assert.ok(!('phone' in stored));
    assert.ok(!('firstName' in stored));
    assert.ok(!serialized.includes('sam@example.com'));
    assert.ok(!serialized.includes('5551234567'));
  });

  test('what is stored still resumes the comparison rather than restarting it', () => {
    const session = {
      ...sessionFromLanding('residential'),
      propertyType: 'house',
      billOffered: true,
      usageRange: '1000_1999',
    };
    const restored = { ...createInitialState(), ...safeSessionSnapshot(session) };

    assert.equal(restored.zip, '75001');
    assert.equal(restored.customerType, CUSTOMER_TYPES.RESIDENTIAL);
    assert.equal(restored.entryContext, ENTRY_CONTEXTS.RESIDENTIAL_LANDING);
    assert.equal(determineNextQuestion(restored).id, 'shopping_intent');
  });
});

describe('service intents stay in step with the landing pages', () => {
  test('every intent points at a real landing route and a known entry context', () => {
    const paths = ['/residential-electricity', '/business-electricity', '/renewable-energy'];
    for (const [service, intent] of Object.entries(SERVICE_INTENTS)) {
      assert.equal(intent.service, service);
      assert.ok(paths.includes(intent.landingPath), `${service} points at ${intent.landingPath}`);
      assert.ok(Object.values(ENTRY_CONTEXTS).includes(intent.entryContext));
    }
  });

  test('an unknown service produces no seed instead of a broken one', () => {
    assert.deepEqual(landingSeed('nope', checkServiceZip('75001')), {});
  });
});
