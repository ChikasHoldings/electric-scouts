/**
 * When to ask a visitor for their email, and when to stop — `npm test`.
 *
 * Reported as "the exit intent popup seems not to be working anymore". The
 * component was fine; what was broken was the rule about when it is allowed to
 * run.
 *
 * A dismissal was stored as `"true"` with no date and never expired, so closing
 * the popup once silenced it on that browser permanently. That is invisible on
 * day one and total by month six: every returning visitor who ever hit the X is
 * one the popup can never reach again, and from the inside the feature looks
 * dead.
 *
 * And the three capture surfaces each kept their own note in their own key
 * without reading the others', so signing up through the homepage block still
 * earned you the exit popup on the way out, asking for the address you had just
 * given.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

/** A storage that behaves like the browser's, for the module under test. */
function installStorage(seed = {}) {
  const store = new Map(Object.entries(seed));
  globalThis.window = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
  };
  globalThis.window.sessionStorage = globalThis.window.localStorage;
  return store;
}

let leadCapture;
let store;

beforeEach(async () => {
  store = installStorage();
  // A fresh module per test: the storage wrapper reads `window` at call time,
  // but the query string keeps each suite honest about import caching.
  leadCapture = await import(`../src/lib/leadCapture.js?t=${Math.random()}`);
});

const DAY = 24 * 60 * 60 * 1000;

describe('a dismissal expires', () => {
  test('closing the popup silences it, but not forever', () => {
    const { dismissFor, isDismissed, PROMPT_KEYS, DISMISS_DAYS } = leadCapture;
    dismissFor(PROMPT_KEYS.exitIntent);
    assert.equal(isDismissed(PROMPT_KEYS.exitIntent), true, 'silenced right after dismissing');

    const stored = Number(store.get(PROMPT_KEYS.exitIntent));
    const expectedDays = Math.round((stored - Date.now()) / DAY);
    assert.equal(expectedDays, DISMISS_DAYS, `the window is ${DISMISS_DAYS} days`);
  });

  test('once the window has passed the visitor can be asked again', () => {
    const { isDismissed, PROMPT_KEYS } = leadCapture;
    store.set(PROMPT_KEYS.exitIntent, String(Date.now() - 1000));
    assert.equal(isDismissed(PROMPT_KEYS.exitIntent), false);
  });

  test('the old dismissed-forever value releases rather than persisting', () => {
    // This is the whole point of the change. Treating a legacy "true" as still
    // dismissed would fix the behaviour only for visitors who had never
    // dismissed — which is to say, it would not look fixed at all.
    const { isDismissed, PROMPT_KEYS } = leadCapture;
    store.set(PROMPT_KEYS.exitIntent, 'true');
    assert.equal(isDismissed(PROMPT_KEYS.exitIntent), false);
  });

  test('a corrupt value does not silence anything', () => {
    const { isDismissed, PROMPT_KEYS } = leadCapture;
    store.set(PROMPT_KEYS.exitIntent, 'not-a-timestamp');
    assert.equal(isDismissed(PROMPT_KEYS.exitIntent), false);
  });

  test('nothing stored means nothing to suppress', () => {
    assert.equal(leadCapture.isDismissed(leadCapture.PROMPT_KEYS.exitIntent), false);
  });

  test('the two prompts hold their own windows independently', () => {
    const { dismissFor, isDismissed, PROMPT_KEYS } = leadCapture;
    dismissFor(PROMPT_KEYS.slideUp);
    assert.equal(isDismissed(PROMPT_KEYS.slideUp), true);
    assert.equal(isDismissed(PROMPT_KEYS.exitIntent), false, 'dismissing one does not dismiss the other');
  });
});

describe('one signup silences every prompt', () => {
  test('converting anywhere counts everywhere', () => {
    const { markEmailGiven, hasGivenEmail } = leadCapture;
    assert.equal(hasGivenEmail(), false);
    markEmailGiven();
    assert.equal(hasGivenEmail(), true);
  });

  test('a visitor recorded under any historical key is still recognised', () => {
    // Someone who converted last week must not be re-prompted because the key
    // they were recorded under has since been superseded.
    for (const legacy of ['es_lead_captured', 'es_rate_alerts_captured', 'rateAlertsSubmitted']) {
      const fresh = installStorage({ [legacy]: 'true' });
      assert.ok(fresh.has(legacy));
      // Re-read through the same module: it consults every historical key.
      assert.equal(leadCapture.hasGivenEmail(), true, `${legacy} was not honoured`);
    }
  });

  test('a conversion is also written under the caller\'s own key', () => {
    // So that rolling back to a previous build does not restart the prompting.
    leadCapture.markEmailGiven('es_rate_alerts_captured');
    assert.equal(store.get('es_rate_alerts_captured'), 'true');
    assert.ok(store.get('es_email_captured'), 'and under the shared key');
  });

  test('conversion does not expire the way a dismissal does', () => {
    const { markEmailGiven, hasGivenEmail } = leadCapture;
    markEmailGiven();
    // Storage holds a timestamp of when, not an expiry — asking again later
    // would mean asking a customer for an address they already gave.
    assert.equal(hasGivenEmail(), true);
  });
});

describe('a browser that blocks storage still gets asked', () => {
  test('no storage means no suppression, rather than silent failure', async () => {
    const boom = () => { throw new DOMException('The operation is insecure.', 'SecurityError'); };
    globalThis.window = {
      get localStorage() { throw new Error('SecurityError'); },
      get sessionStorage() { return { getItem: boom, setItem: boom, removeItem: boom }; },
    };
    const isolated = await import(`../src/lib/leadCapture.js?blocked=${Math.random()}`);

    assert.equal(isolated.hasGivenEmail(), false);
    assert.equal(isolated.isDismissed(isolated.PROMPT_KEYS.exitIntent), false);
    // Writing cannot stick, and must not throw — the prompt simply shows again
    // next visit, which is the right failure for a browser refusing storage.
    isolated.dismissFor(isolated.PROMPT_KEYS.exitIntent);
    isolated.markEmailGiven();
  });
});
