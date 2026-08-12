/**
 * Referral routing and monetization classification — `npm test`.
 *
 * The distinction this file exists to protect: a click through /api/go to a
 * plain provider page is attributable to us and worth nothing to us. Treating
 * those as commission-bearing would overstate revenue and, worse, hide the
 * providers that still need a real referral URL configured.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { isCommissionCapable, resolutionOf } from '../api/_lib/referral.js';

describe('commission capability', () => {
  test('a real affiliate-network URL is commission-capable', () => {
    for (const url of [
      'https://www.awin1.com/cread.php?awinmid=68048&awinaffid=2793',
      'https://www.awin1.com/cread.php?awinmid=114744&awinaffid=279',
      'https://electricscouts.sjv.io/c/123/456/789',
      'https://partner.pxf.io/abc',
      'https://click.linksynergy.com/deeplink?id=x',
    ]) {
      assert.equal(isCommissionCapable(url), true, `${url} should be commission-capable`);
    }
  });

  test('a plain public provider page is NOT commission-capable', () => {
    // These are the 36 rows currently configured this way. They are tracked
    // internally and pay nothing.
    for (const url of [
      'https://www.txu.com/en/residential/plans-and-pricing',
      'https://www.constellation.com/solutions/for-your-home.html',
      'https://www.directenergy.com/texas/electricity-plans',
      'https://www.gexaenergy.com/electricity-plans',
      'https://chariotenergy.com/plans-pricing/',
    ]) {
      assert.equal(isCommissionCapable(url), false, `${url} should NOT be commission-capable`);
    }
  });

  test('a provider domain carrying an affiliate identifier counts', () => {
    assert.equal(
      isCommissionCapable('https://www.provider.com/plans?subid=electricscouts'),
      true
    );
  });

  test('host matching is not substring matching', () => {
    // A provider page that merely mentions a network in its path must not be
    // misread as tracked.
    assert.equal(isCommissionCapable('https://www.provider.com/awin1.com/plans'), false);
    assert.equal(isCommissionCapable('https://notawin1.com.evil.test/x'), false);
  });

  test('a subdomain of a network host still counts', () => {
    assert.equal(isCommissionCapable('https://track.awin1.com/x?awinaffid=1'), true);
  });

  test('unknown or malformed is treated as NOT capable', () => {
    // Overstating monetization is the expensive direction to be wrong in.
    for (const url of ['', null, undefined, 'not-a-url', 'javascript:alert(1)', '/relative/path']) {
      assert.equal(isCommissionCapable(url), false, `${url} should not be capable`);
    }
  });
});

describe('resolution type', () => {
  const provider = { name: 'TXU Energy', affiliate_url: 'https://aff.example/txu', website_url: 'https://txu.com' };

  test('an offer-specific link is reported as such', () => {
    const link = { offer_id: 'o1', target_url: 'https://x.test/plan', provider };
    assert.equal(resolutionOf(link, 'https://x.test/plan'), 'offer_link');
  });

  test('a provider-level link is reported as such', () => {
    const link = { offer_id: null, target_url: 'https://x.test/plan', provider };
    assert.equal(resolutionOf(link, 'https://x.test/plan'), 'provider_link');
  });

  test('falling through to the provider affiliate URL is recorded', () => {
    const link = { offer_id: null, target_url: null, provider };
    assert.equal(resolutionOf(link, 'https://aff.example/txu'), 'provider_affiliate_url');
  });

  test('falling through to the public website is recorded distinctly', () => {
    // This is the row an admin needs to find: displayed, clicked, unmonetized.
    const link = { offer_id: null, target_url: null, provider };
    assert.equal(resolutionOf(link, 'https://txu.com'), 'provider_website');
  });

  test('no destination is reported as unresolved rather than guessed', () => {
    assert.equal(resolutionOf({ provider }, null), 'unresolved');
  });
});

describe('the two states are genuinely independent', () => {
  test('a tracked internal click is not the same as a commission-capable one', () => {
    // Every /api/go hit is recorded. Only some can pay. Reporting must be able
    // to tell them apart, which is why `resolution` and `monetized` are
    // separate columns rather than one flag.
    const link = { offer_id: null, target_url: 'https://www.txu.com/plans', provider: { name: 'TXU Energy' } };
    const url = 'https://www.txu.com/plans';
    assert.equal(resolutionOf(link, url), 'provider_link', 'resolved and attributable');
    assert.equal(isCommissionCapable(url), false, 'but not commission-bearing');
  });

  test('a configured network link is both', () => {
    const url = 'https://www.awin1.com/cread.php?awinmid=68048&awinaffid=2793';
    const link = { offer_id: null, target_url: url, provider: { name: 'SmartEnergy' } };
    assert.equal(resolutionOf(link, url), 'provider_link');
    assert.equal(isCommissionCapable(url), true);
  });
});
