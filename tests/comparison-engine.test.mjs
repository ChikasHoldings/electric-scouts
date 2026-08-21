/**
 * Comparison engine suite — `npm test`.
 *
 * These cover the parts of /compare-rates where a regression would be silent
 * and expensive: the question-skipping resolver (asks a question the bill
 * already answered), branch invalidation (stale residential answers leaking
 * into a commercial lead), the PII guard on analytics, and the routing that
 * decides whether a visitor is monetized or dropped.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  createInitialState,
  invalidateBranchState,
  isKnown,
  resolveUsageKwh,
  stageForQuestion,
  CUSTOMER_TYPES,
} from '../src/components/compare/engine/comparisonState.js';
import {
  determineNextQuestion,
  previousQuestion,
  remainingQuestions,
  stepBack,
} from '../src/components/compare/engine/nextQuestion.js';
import { stripPii } from '../src/components/compare/engine/analytics.js';
import {
  resolveRoute,
  scoreCommercialLead,
  ROUTES,
  QUALIFICATION,
} from '../src/components/compare/engine/monetizationRouter.js';
import {
  mapExtractionToState,
  assessConfidence,
} from '../src/components/compare/engine/billAnalysis.js';
import { buildLeadPayload } from '../src/components/compare/engine/persistence.js';
import { captureAttribution } from '../src/components/compare/engine/attribution.js';

/** A state that has progressed as far as the given fields describe. */
function stateWith(overrides) {
  return { ...createInitialState(), ...overrides };
}

const atZipDone = {
  zip: '77001',
  city: 'Houston',
  state: 'TX',
};

describe('question flow ordering', () => {
  test('ZIP is always the first question', () => {
    const next = determineNextQuestion(createInitialState());
    assert.equal(next.id, 'zip');
  });

  test('customer type follows ZIP', () => {
    const next = determineNextQuestion(stateWith(atZipDone));
    assert.equal(next.id, 'customer_type');
  });

  test('residential branch asks property type, not business type', () => {
    const next = determineNextQuestion(stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.RESIDENTIAL,
    }));
    assert.equal(next.id, 'property_type');
  });

  test('commercial branch asks business type, not property type', () => {
    const next = determineNextQuestion(stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.COMMERCIAL,
    }));
    assert.equal(next.id, 'business_type');
  });

  test('renewable selection asks home-or-business before branching', () => {
    // Choosing renewable records the preference but leaves customerType unset,
    // which is what makes the follow-up question fire.
    const next = determineNextQuestion(stateWith({
      ...atZipDone,
      energyPreference: 'renewable',
    }));
    assert.equal(next.id, 'renewable_context');
  });

  test('renewable preference survives into the residential branch', () => {
    const state = stateWith({
      ...atZipDone,
      energyPreference: 'renewable',
      customerType: CUSTOMER_TYPES.RESIDENTIAL,
    });
    assert.equal(determineNextQuestion(state).id, 'property_type');
    assert.equal(state.energyPreference, 'renewable');
  });

  test('contact questions are asked one at a time: first, last, email, phone', () => {
    const base = {
      ...atZipDone,
      customerType: CUSTOMER_TYPES.RESIDENTIAL,
      propertyType: 'house',
      billOffered: true,
      usageRange: '1000_1999',
      shoppingIntent: 'switching',
    };
    // One question per screen, in the order the brief specifies. Last name is
    // its own screen — never merged into a single full-name field.
    assert.equal(determineNextQuestion(stateWith(base)).id, 'name');
    assert.equal(determineNextQuestion(stateWith({ ...base, firstName: 'Sam' })).id, 'last_name');
    assert.equal(
      determineNextQuestion(stateWith({ ...base, firstName: 'Sam', lastName: 'Reed' })).id,
      'email'
    );
    assert.equal(
      determineNextQuestion(stateWith({
        ...base, firstName: 'Sam', lastName: 'Reed', email: 'a@b.com',
      })).id,
      'phone'
    );
  });

  test('questionnaire completes once phone is answered', () => {
    const next = determineNextQuestion(stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.RESIDENTIAL,
      propertyType: 'house',
      billOffered: true,
      usageRange: '1000_1999',
      shoppingIntent: 'switching',
      firstName: 'Sam',
      lastName: 'Reed',
      email: 'a@b.com',
      phone: '+15551234567',
    }));
    assert.equal(next, null);
  });
});

describe('question skipping from bill data', () => {
  test('usage from a bill removes the usage question', () => {
    const withBill = stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.RESIDENTIAL,
      propertyType: 'house',
      billAnalysisStatus: 'complete',
      monthlyUsageKwh: 1240,
    });
    const ids = remainingQuestions(withBill).map((q) => q.id);
    assert.ok(!ids.includes('usage_range'), 'usage_range should be skipped');
    assert.ok(!ids.includes('bill_offer'), 'bill offer is spent once analysis completed');
    assert.equal(determineNextQuestion(withBill).id, 'shopping_intent');
  });

  test('monthly cost from a business bill removes the spend question', () => {
    const withBill = stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.COMMERCIAL,
      businessType: 'restaurant',
      billAnalysisStatus: 'complete',
      monthlyUsageKwh: 42500,
      monthlyCost: 4800,
    });
    const ids = remainingQuestions(withBill).map((q) => q.id);
    assert.ok(!ids.includes('commercial_spend'), 'spend is known from the bill');
    assert.equal(determineNextQuestion(withBill).id, 'commercial_timing');
  });

  test('a contract end date from the bill removes the timing question', () => {
    const withBill = stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.COMMERCIAL,
      businessType: 'office',
      billAnalysisStatus: 'complete',
      monthlyCost: 2000,
      contractEndDate: '2026-11-30',
    });
    const ids = remainingQuestions(withBill).map((q) => q.id);
    assert.ok(!ids.includes('commercial_timing'));
    assert.equal(determineNextQuestion(withBill).id, 'business_name');
  });

  test('a bill answering everything drops straight to contact capture', () => {
    const withBill = stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.RESIDENTIAL,
      propertyType: 'house',
      billAnalysisStatus: 'complete',
      monthlyUsageKwh: 1240,
      currentProvider: 'TXU Energy',
      shoppingIntent: 'switching',
    });
    assert.equal(determineNextQuestion(withBill).id, 'name');
  });

  test('low-confidence extraction asks only about the uncertain field', () => {
    const shaky = stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.RESIDENTIAL,
      propertyType: 'house',
      billAnalysisStatus: 'complete',
      billConfidence: 'low',
      monthlyUsageKwh: 1240,
      unverifiedFields: ['monthlyUsageKwh'],
    });
    assert.equal(determineNextQuestion(shaky).id, 'bill_verify');
  });

  test('skipping the bill still asks for usage', () => {
    const skipped = stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.RESIDENTIAL,
      propertyType: 'apartment',
      billOffered: true,
    });
    assert.equal(determineNextQuestion(skipped).id, 'usage_range');
  });
});

describe('branch invalidation', () => {
  test('switching residential to commercial clears residential-only answers', () => {
    const residential = stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.RESIDENTIAL,
      propertyType: 'house',
      shoppingIntent: 'switching',
      usageRange: '1000_1999',
    });

    const commercial = invalidateBranchState(residential, CUSTOMER_TYPES.COMMERCIAL);

    assert.equal(commercial.propertyType, '');
    assert.equal(commercial.shoppingIntent, '');
    assert.equal(commercial.usageRange, '');
    assert.equal(commercial.customerType, CUSTOMER_TYPES.COMMERCIAL);
  });

  test('switching branch keeps location and contact', () => {
    const residential = stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.RESIDENTIAL,
      propertyType: 'house',
      firstName: 'Sam',
      email: 'sam@example.com',
    });

    const commercial = invalidateBranchState(residential, CUSTOMER_TYPES.COMMERCIAL);

    assert.equal(commercial.zip, '77001');
    assert.equal(commercial.state, 'TX');
    assert.equal(commercial.firstName, 'Sam');
    assert.equal(commercial.email, 'sam@example.com');
  });

  test('switching commercial to residential clears commercial-only answers', () => {
    const commercial = stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.COMMERCIAL,
      businessType: 'retail',
      businessName: 'Acme',
      monthlySpendRange: '1500_4999',
      timing: 'now',
    });

    const residential = invalidateBranchState(commercial, CUSTOMER_TYPES.RESIDENTIAL);

    assert.equal(residential.businessType, '');
    assert.equal(residential.businessName, '');
    assert.equal(residential.monthlySpendRange, '');
    assert.equal(residential.timing, '');
  });

  test('re-selecting the same branch is a no-op', () => {
    const residential = stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.RESIDENTIAL,
      propertyType: 'house',
    });
    const same = invalidateBranchState(residential, CUSTOMER_TYPES.RESIDENTIAL);
    assert.equal(same.propertyType, 'house');
  });
});

describe('back navigation', () => {
  test('back skips over questions that were never shown', () => {
    // Usage came from a bill, so usage_range was never displayed. History holds
    // only the screens the visitor actually saw, so Back must land on the bill
    // offer rather than on a usage question they were never asked.
    const state = stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.RESIDENTIAL,
      propertyType: 'house',
      billAnalysisStatus: 'complete',
      monthlyUsageKwh: 1240,
      history: ['zip', 'customer_type', 'property_type', 'bill_offer', 'shopping_intent'],
    });
    const prev = previousQuestion(state, 'shopping_intent');
    assert.ok(prev);
    assert.notEqual(prev.id, 'usage_range');
    assert.equal(prev.id, 'bill_offer');
  });

  test('back walks the shown questions in reverse', () => {
    const state = stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.RESIDENTIAL,
      propertyType: 'house',
      history: ['zip', 'customer_type', 'property_type'],
    });
    assert.equal(previousQuestion(state, 'property_type').id, 'customer_type');
    assert.equal(previousQuestion(state, 'customer_type').id, 'zip');
  });

  test('back never lands on a question the current branch abandoned', () => {
    // The visitor answered residential questions, then switched to commercial.
    // Those screens are still in history but no longer apply.
    const switched = invalidateBranchState(
      stateWith({
        ...atZipDone,
        customerType: CUSTOMER_TYPES.RESIDENTIAL,
        propertyType: 'house',
        history: ['zip', 'customer_type', 'property_type', 'business_type'],
      }),
      CUSTOMER_TYPES.COMMERCIAL
    );

    const prev = previousQuestion(switched, 'business_type');
    assert.ok(prev);
    assert.notEqual(prev.id, 'property_type');
    assert.equal(prev.id, 'customer_type');
  });

  test('back from the first question is null', () => {
    assert.equal(previousQuestion(stateWith({ history: ['zip'] }), 'zip'), null);
    assert.equal(previousQuestion(createInitialState(), 'zip'), null);
  });

  test('repeated backs keep walking outward after a branch change', () => {
    // Regression: history used to accumulate forward entries, so after going
    // back, switching branch and going forward again, a second Back resolved to
    // a question *ahead* of where the visitor already was — and Back silently
    // did nothing. Truncating history on each step keeps it a real stack.
    let state = stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.COMMERCIAL,
      businessType: 'office',
      history: ['zip', 'customer_type', 'business_type'],
    });

    // Back off the commercial branch.
    let back = stepBack(state, 'business_type');
    assert.equal(back.question.id, 'customer_type');
    assert.deepEqual(back.history, ['zip']);

    // Switch to residential and advance two screens.
    state = {
      ...invalidateBranchState({ ...state, history: back.history }, CUSTOMER_TYPES.RESIDENTIAL),
      propertyType: 'house',
      history: ['zip', 'customer_type', 'property_type', 'bill_offer'],
    };

    // First Back returns to property type.
    back = stepBack(state, 'bill_offer');
    assert.equal(back.question.id, 'property_type');

    // Second Back must reach customer type, not stall on a later question.
    state = { ...state, propertyType: '', history: [...back.history, 'property_type'] };
    back = stepBack(state, 'property_type');
    assert.equal(back.question.id, 'customer_type');
    assert.deepEqual(back.history, ['zip']);
  });

  test('stepBack skips questions the current branch abandoned', () => {
    const state = invalidateBranchState(
      stateWith({
        ...atZipDone,
        customerType: CUSTOMER_TYPES.RESIDENTIAL,
        history: ['zip', 'customer_type', 'property_type', 'business_type'],
      }),
      CUSTOMER_TYPES.COMMERCIAL
    );
    const back = stepBack(state, 'business_type');
    assert.equal(back.question.id, 'customer_type');
  });
});

describe('usage resolution', () => {
  test('a measured figure beats a selected range', () => {
    const state = stateWith({ monthlyUsageKwh: 1240, usageRange: 'under_500' });
    assert.equal(resolveUsageKwh(state), 1240);
  });

  test('ranges collapse to a midpoint', () => {
    assert.equal(resolveUsageKwh(stateWith({ usageRange: '1000_1999' })), 1500);
    assert.equal(resolveUsageKwh(stateWith({ usageRange: 'under_500' })), 350);
  });

  test('an unknown usage falls back to a default rather than zero', () => {
    assert.equal(resolveUsageKwh(createInitialState()), 1000);
    assert.equal(resolveUsageKwh(stateWith({ usageRange: 'not_sure' })), 1000);
  });
});

describe('bill extraction mapping', () => {
  test('absent fields are omitted, not written as zero', () => {
    const { fields } = mapExtractionToState({
      monthly_usage_kwh: 1240,
      monthly_cost: 0,
      provider_name: null,
    }, CUSTOMER_TYPES.RESIDENTIAL);

    assert.equal(fields.monthlyUsageKwh, 1240);
    assert.ok(!('monthlyCost' in fields), 'a zero cost must not look like a known value');
    assert.ok(!('currentProvider' in fields));
  });

  test('account identity is never carried into state', () => {
    const { fields } = mapExtractionToState({
      monthly_usage_kwh: 1240,
      account_number: '9988776655',
      customer_name: 'Sam Rivera',
      service_address: '10 Main St',
    }, CUSTOMER_TYPES.RESIDENTIAL);

    const serialized = JSON.stringify(fields);
    assert.ok(!serialized.includes('9988776655'), 'account number must be dropped');
    assert.ok(!serialized.includes('Sam Rivera'), 'customer name must be dropped');
    assert.ok(!serialized.includes('10 Main St'), 'service address must be dropped');
  });

  test('placeholder strings are treated as missing', () => {
    const { fields } = mapExtractionToState({
      monthly_usage_kwh: 900,
      provider_name: 'N/A',
      plan_name: 'unknown',
    }, CUSTOMER_TYPES.RESIDENTIAL);

    assert.ok(!('currentProvider' in fields));
    assert.ok(!('currentPlan' in fields));
  });

  test('a garbled response is low confidence rather than an exception', () => {
    const result = mapExtractionToState(null, CUSTOMER_TYPES.RESIDENTIAL);
    assert.equal(result.confidence, 'low');
    assert.deepEqual(result.fields, {});
  });

  test('missing usage is always low confidence', () => {
    const { confidence, unverified } = assessConfidence({
      monthlyUsageKwh: null,
      monthlyCost: 186,
      currentProvider: 'TXU Energy',
    }, CUSTOMER_TYPES.RESIDENTIAL);

    assert.equal(confidence, 'low');
    assert.ok(unverified.includes('monthlyUsageKwh'));
  });

  test('a rate that contradicts cost over usage is flagged', () => {
    // $186 over 1240 kWh is ~15c, so a claimed 2c/kWh is a misread.
    const { unverified } = assessConfidence({
      monthlyUsageKwh: 1240,
      monthlyCost: 186,
      effectiveRate: 2,
      currentProvider: 'TXU Energy',
    }, CUSTOMER_TYPES.RESIDENTIAL);

    assert.ok(unverified.includes('effectiveRate'));
  });

  test('a coherent bill is high confidence', () => {
    const { confidence, unverified } = assessConfidence({
      monthlyUsageKwh: 1240,
      monthlyCost: 186,
      effectiveRate: 15,
      currentProvider: 'TXU Energy',
    }, CUSTOMER_TYPES.RESIDENTIAL);

    assert.equal(confidence, 'high');
    assert.deepEqual(unverified, []);
  });

  test('implausible residential usage is queried', () => {
    const { unverified } = assessConfidence({
      monthlyUsageKwh: 45000,
      monthlyCost: 300,
      currentProvider: 'TXU Energy',
    }, CUSTOMER_TYPES.RESIDENTIAL);

    assert.ok(unverified.includes('monthlyUsageKwh'));
  });
});

describe('analytics PII guard', () => {
  test('known PII keys are dropped', () => {
    const clean = stripPii({
      email: 'sam@example.com',
      name: 'Sam',
      phone: '555-123-4567',
      zip: '77001',
      customer_type: 'residential',
    });

    assert.deepEqual(clean, { zip: '77001', customer_type: 'residential' });
  });

  test('an email under an unexpected key is still redacted', () => {
    const clean = stripPii({ contact_field: 'sam@example.com', state: 'TX' });
    assert.ok(!('contact_field' in clean));
    assert.equal(clean.state, 'TX');
  });

  test('a phone number under an unexpected key is still redacted', () => {
    const clean = stripPii({ ref: '+1 (555) 123-4567', state: 'TX' });
    assert.ok(!('ref' in clean));
  });

  test('nested PII is stripped', () => {
    const clean = stripPii({ session: { email: 'a@b.com', usage: 1240 } });
    assert.deepEqual(clean.session, { usage: 1240 });
  });

  test('non-PII values survive intact', () => {
    const clean = stripPii({ usage: 1240, renewable: true, tags: ['tx', 'fixed'] });
    assert.deepEqual(clean, { usage: 1240, renewable: true, tags: ['tx', 'fixed'] });
  });
});

describe('monetization routing', () => {
  const residentialBase = stateWith({
    ...atZipDone,
    customerType: CUSTOMER_TYPES.RESIDENTIAL,
  });

  const renewableBase = stateWith({
    ...atZipDone,
    customerType: CUSTOMER_TYPES.RESIDENTIAL,
    energyPreference: 'renewable',
  });

  /* ── The invariant: AFFILIATE requires a result that can actually pay ──
   *
   * Having results and having revenue are different facts. Every case below
   * that reaches AFFILIATE has at least one commission-capable result; every
   * case that does not, must not.
   */

  test('a commission-capable residential result opens the affiliate route', () => {
    const { route } = resolveRoute(residentialBase, {
      resultCount: 12,
      commissionCapableCount: 1,
      internalTrackingOnlyCount: 11,
    });
    assert.equal(route, ROUTES.AFFILIATE);
  });

  test('zero results is never affiliate', () => {
    const { route } = resolveRoute(residentialBase, { resultCount: 0 });
    assert.notEqual(route, ROUTES.AFFILIATE);
    assert.notEqual(route, ROUTES.UNROUTED);
    assert.equal(route, ROUTES.CONCIERGE);
  });

  test('results that all lack an outbound link are never affiliate', () => {
    const { route } = resolveRoute(residentialBase, {
      resultCount: 10,
      commissionCapableCount: 0,
      internalTrackingOnlyCount: 0,
    });
    assert.notEqual(route, ROUTES.AFFILIATE);
    assert.notEqual(route, ROUTES.UNROUTED);
  });

  test('tracking-only links are not commission-capable and are never affiliate', () => {
    // The regression this whole change exists for: ten clickable, attributable
    // links that earn nothing were being booked as affiliate revenue.
    const { route } = resolveRoute(residentialBase, {
      resultCount: 10,
      commissionCapableCount: 0,
      internalTrackingOnlyCount: 10,
    });
    assert.notEqual(route, ROUTES.AFFILIATE);
    assert.equal(route, ROUTES.CONCIERGE);
  });

  test('a mixed result set with nothing commission-capable is never affiliate', () => {
    const { route } = resolveRoute(residentialBase, {
      resultCount: 9,
      commissionCapableCount: 0,
      internalTrackingOnlyCount: 5,
    });
    assert.notEqual(route, ROUTES.AFFILIATE);
    assert.notEqual(route, ROUTES.UNROUTED);
  });

  test('an unmigrated caller passing no counts cannot reach affiliate', () => {
    // Defaults are zero, so a caller that has not been updated fails towards a
    // human rather than towards a revenue claim it cannot support.
    const { route } = resolveRoute(residentialBase, {});
    assert.notEqual(route, ROUTES.AFFILIATE);
  });

  /* ── Renewable: the renewable count is the one that governs ── */

  test('renewable results that cannot pay are never affiliate', () => {
    const { route } = resolveRoute(renewableBase, {
      resultCount: 10,
      renewableResultCount: 10,
      commissionCapableCount: 0,
      renewableCommissionCapableCount: 0,
    });
    assert.notEqual(route, ROUTES.AFFILIATE);
    assert.equal(route, ROUTES.RENEWABLE_PARTNER);
  });

  test('a non-renewable commission-capable result does not satisfy a renewable request', () => {
    const { route } = resolveRoute(renewableBase, {
      resultCount: 6,
      renewableResultCount: 5,
      commissionCapableCount: 1,
      renewableCommissionCapableCount: 0,
    });
    assert.notEqual(route, ROUTES.AFFILIATE);
    assert.equal(route, ROUTES.RENEWABLE_PARTNER);
  });

  test('a renewable commission-capable result opens the affiliate route', () => {
    const { route } = resolveRoute(renewableBase, {
      resultCount: 8,
      renewableResultCount: 3,
      commissionCapableCount: 3,
      renewableCommissionCapableCount: 1,
    });
    assert.equal(route, ROUTES.AFFILIATE);
  });

  test('renewable request with no renewable inventory does not dead-end', () => {
    const { route } = resolveRoute(renewableBase, {
      resultCount: 8,
      renewableResultCount: 0,
      renewableCommissionCapableCount: 0,
    });
    assert.equal(route, ROUTES.RENEWABLE_PARTNER);
  });

  test('routing records the counts it decided from', () => {
    const { signals } = resolveRoute(residentialBase, {
      resultCount: 10,
      commissionCapableCount: 0,
      internalTrackingOnlyCount: 7,
    });
    assert.equal(signals.resultCount, 10);
    assert.equal(signals.commissionCapableCount, 0);
    assert.equal(signals.internalTrackingOnlyCount, 7);
  });

  test('a large urgent commercial account scores hot', () => {
    const { qualification } = scoreCommercialLead(stateWith({
      monthlySpendRange: '20000_plus',
      timing: 'now',
    }));
    assert.equal(qualification, QUALIFICATION.HOT);
  });

  test('a small unhurried commercial account scores nurture', () => {
    const { qualification } = scoreCommercialLead(stateWith({
      monthlySpendRange: 'under_500',
      timing: 'comparing',
    }));
    assert.equal(qualification, QUALIFICATION.NURTURE);
  });

  test('a measured bill cost outranks a lower self-reported band', () => {
    const { signals } = scoreCommercialLead(stateWith({
      monthlySpendRange: 'under_500',
      monthlyCost: 24000,
      timing: 'now',
    }));
    assert.equal(signals.spendScore, 5);
  });

  test('commercial routing carries the score for admin inspection', () => {
    const result = resolveRoute(stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.COMMERCIAL,
      monthlySpendRange: '5000_19999',
      timing: '30_days',
    }));
    assert.equal(result.route, ROUTES.COMMERCIAL_PARTNER);
    assert.ok(typeof result.score === 'number');
    assert.ok(result.signals.spendScore > 0);
  });

  test('a commercial opportunity stays a broker lead even with payable inventory', () => {
    // Business supply is quoted, not clicked through. Commission-capable
    // residential-style inventory in the same territory must not divert a
    // commercial account into the affiliate flow.
    const commercial = stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.COMMERCIAL,
      monthlySpendRange: '20000_plus',
      timing: 'now',
    });
    const { route } = resolveRoute(commercial, {
      resultCount: 14,
      commissionCapableCount: 14,
      renewableResultCount: 4,
      renewableCommissionCapableCount: 4,
    });
    assert.notEqual(route, ROUTES.AFFILIATE);
    assert.equal(route, ROUTES.COMMERCIAL_PARTNER);
  });

  test('a small commercial account still nurtures rather than going affiliate', () => {
    const { route } = resolveRoute(stateWith({
      ...atZipDone,
      customerType: CUSTOMER_TYPES.COMMERCIAL,
      monthlySpendRange: 'under_500',
      timing: 'comparing',
    }), { resultCount: 10, commissionCapableCount: 10 });
    assert.notEqual(route, ROUTES.AFFILIATE);
    assert.equal(route, ROUTES.NURTURE);
  });
});

describe('lead payload', () => {
  const complete = stateWith({
    ...atZipDone,
    sessionId: 'cs_test',
    customerType: CUSTOMER_TYPES.RESIDENTIAL,
    propertyType: 'house',
    usageRange: '1000_1999',
    shoppingIntent: 'switching',
    monthlyUsageKwh: 1240,
    currentProvider: 'TXU Energy',
    firstName: 'Sam',
    email: 'Sam@Example.com',
    phone: '5551234567',
    attribution: { utm_source: 'google', utm_campaign: 'tx_switch' },
  });

  test('carries the session id so repeat writes update one record', () => {
    assert.equal(buildLeadPayload(complete).comparison.session_id, 'cs_test');
  });

  test('carries attribution end to end', () => {
    const payload = buildLeadPayload(complete);
    assert.equal(payload.attribution.utm_source, 'google');
    assert.equal(payload.attribution.utm_campaign, 'tx_switch');
  });

  test('carries the energy profile the bill supplied', () => {
    const payload = buildLeadPayload(complete);
    assert.equal(payload.comparison.monthly_usage_kwh, 1240);
    assert.equal(payload.comparison.current_provider, 'TXU Energy');
  });

  test('source page distinguishes residential from commercial', () => {
    assert.equal(buildLeadPayload(complete).source_page, 'compare_rates_residential');
    const commercial = buildLeadPayload(stateWith({
      ...complete,
      customerType: CUSTOMER_TYPES.COMMERCIAL,
    }));
    assert.equal(commercial.source_page, 'compare_rates_commercial');
  });
});

describe('attribution capture', () => {
  test('reads UTM values off the landing URL', () => {
    const captured = captureAttribution(
      '?utm_source=google&utm_medium=cpc&utm_campaign=tx',
      'https://www.google.com/',
      'https://electricscouts.com/compare-rates?utm_source=google'
    );
    assert.equal(captured.utm_source, 'google');
    assert.equal(captured.utm_medium, 'cpc');
    assert.equal(captured.utm_campaign, 'tx');
    assert.equal(captured.referrer, 'https://www.google.com/');
  });

  test('a direct visit produces no fabricated campaign', () => {
    const captured = captureAttribution('', '', 'https://electricscouts.com/compare-rates');
    assert.ok(!captured.utm_source);
  });
});

describe('stage mapping', () => {
  test('every question maps to a stage the indicator can show', () => {
    const stages = ['location', 'needs', 'usage', 'details', 'matches'];
    for (const id of ['zip', 'customer_type', 'property_type', 'bill_offer', 'usage_range', 'name', 'email', 'phone']) {
      assert.ok(stages.includes(stageForQuestion(id)), `${id} has no stage`);
    }
  });
});

describe('known-value semantics', () => {
  test('zero and empty are not "known"', () => {
    assert.equal(isKnown(stateWith({ monthlyUsageKwh: 0 }), 'monthlyUsageKwh'), false);
    assert.equal(isKnown(stateWith({ currentProvider: '   ' }), 'currentProvider'), false);
    assert.equal(isKnown(stateWith({ zip: '' }), 'zip'), false);
  });

  test('real values are known', () => {
    assert.equal(isKnown(stateWith({ monthlyUsageKwh: 1240 }), 'monthlyUsageKwh'), true);
    assert.equal(isKnown(stateWith({ zip: '77001' }), 'zip'), true);
  });
});
