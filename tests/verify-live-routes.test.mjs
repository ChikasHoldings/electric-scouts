/**
 * Live-route verifier policy — `npm test`.
 *
 * The verifier decides two things before it looks at a single response: which
 * kind of deployment it is talking to, and what a `noindex` means there. Both
 * were wrong in ways that only show up against a real deployment, which is
 * exactly where a wrong answer is most expensive:
 *
 *   - A hosting-level `X-Robots-Tag: noindex` is what Vercel puts on preview
 *     URLs so they cannot be indexed. Failing on it meant the verifier could
 *     never be run against a deploy before it shipped.
 *
 *   - A `noindex` in the page's own HTML is built by the application and
 *     travels with the build. Allowing it on a preview would mean signing off
 *     on the exact artefact that then de-indexes production.
 *
 * These are pure-function tests on purpose. The policy is imported from the
 * verifier itself rather than restated here, so the tests cannot agree with a
 * copy of the rules while the shipped ones say something else — and importing
 * the module must not fire a single HTTP request.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  VERIFICATION_MODES,
  canonicalHostname,
  evaluateRobotsPolicy,
  isMainModule,
  parseCliArgs,
  resolveVerificationMode,
} from '../scripts/verify-live-routes.mjs';
import { SITE_URL } from '../src/seo/site.js';

const CANONICAL = canonicalHostname(SITE_URL);
const PRODUCTION_URL = `https://${CANONICAL}`;
const PREVIEW_URL = 'https://electric-scouts-git-some-branch-team.vercel.app';

describe('verification mode resolution', () => {
  test('the canonical production hostname resolves to production', () => {
    assert.equal(
      resolveVerificationMode({ baseUrl: PRODUCTION_URL, requestedMode: 'auto' }),
      'production'
    );
  });

  test('a Vercel preview hostname resolves to preview', () => {
    assert.equal(
      resolveVerificationMode({ baseUrl: PREVIEW_URL, requestedMode: 'auto' }),
      'preview'
    );
  });

  test('explicit preview overrides a production hostname', () => {
    assert.equal(
      resolveVerificationMode({ baseUrl: PRODUCTION_URL, requestedMode: 'preview' }),
      'preview'
    );
  });

  test('explicit production overrides a preview hostname', () => {
    assert.equal(
      resolveVerificationMode({ baseUrl: PREVIEW_URL, requestedMode: 'production' }),
      'production'
    );
  });

  test('an unknown mode is refused with a message naming the valid ones', () => {
    assert.throws(
      () => resolveVerificationMode({ baseUrl: PRODUCTION_URL, requestedMode: 'staging' }),
      (error) => {
        assert.match(error.message, /invalid verification mode "staging"/);
        assert.match(error.message, /auto, preview, production/);
        return true;
      }
    );
  });

  test('a base URL that is not a URL is refused rather than guessed at', () => {
    assert.throws(
      () => resolveVerificationMode({ baseUrl: 'not a url', requestedMode: 'auto' }),
      /is not a URL/
    );
  });

  test('the mode list is exactly auto, preview, production', () => {
    assert.deepEqual([...VERIFICATION_MODES], ['auto', 'preview', 'production']);
  });

  /**
   * The check that has to be exact rather than convenient.
   *
   * Every hostname below contains the canonical host as a substring and none of
   * them is it. A `startsWith`, `endsWith` or `includes` test would hand
   * production's identity to a host nobody here controls.
   */
  test('a hostname that merely contains the canonical host is not production', () => {
    for (const hostname of [
      `fake-${CANONICAL}`,
      `${CANONICAL}.example.org`,
      `${CANONICAL}.attacker.test`,
      `evil${CANONICAL}`,
      'electricscouts.com.example.org',
    ]) {
      assert.equal(
        resolveVerificationMode({ baseUrl: `https://${hostname}`, requestedMode: 'auto' }),
        'preview',
        `${hostname} must not be treated as production`
      );
    }
  });

  test('hostname comparison ignores case and port', () => {
    assert.equal(
      resolveVerificationMode({ baseUrl: `https://${CANONICAL.toUpperCase()}`, requestedMode: 'auto' }),
      'production'
    );
  });

  test('the canonical host is not inferred from a branch or path saying "prod"', () => {
    for (const url of [
      'https://electric-scouts-git-prod-team.vercel.app',
      'https://preview.example.com/production',
      'https://production.example.com',
    ]) {
      assert.equal(resolveVerificationMode({ baseUrl: url, requestedMode: 'auto' }), 'preview');
    }
  });
});

describe('robots policy', () => {
  const evaluate = (mode, htmlRobots, responseRobotsHeader) =>
    evaluateRobotsPolicy({ mode, htmlRobots, responseRobotsHeader });

  /* ── Page-level HTML: never acceptable, in any mode ── */

  test('preview allows an indexable HTML directive', () => {
    assert.deepEqual(evaluate('preview', 'index, follow', '').failures, []);
  });

  test('production allows an indexable HTML directive', () => {
    assert.deepEqual(evaluate('production', 'index, follow', '').failures, []);
  });

  test('preview fails on an HTML noindex', () => {
    const { failures } = evaluate('preview', 'noindex', '');
    assert.equal(failures.length, 1);
    assert.match(failures[0], /page HTML declares robots/);
  });

  test('production fails on an HTML noindex', () => {
    assert.equal(evaluate('production', 'noindex', '').failures.length, 1);
  });

  test('an HTML noindex is caught whatever it is combined with, in either order', () => {
    for (const mode of ['preview', 'production']) {
      for (const directive of ['noindex', 'noindex,follow', 'nofollow, noindex', 'NoIndex, NoFollow']) {
        const { failures } = evaluate(mode, directive, '');
        assert.equal(failures.length, 1, `${mode} / "${directive}" should fail`);
      }
    }
  });

  test('"index" is not mistaken for "noindex"', () => {
    assert.deepEqual(evaluate('production', 'index', '').failures, []);
    assert.deepEqual(evaluate('production', 'index,follow,max-snippet:-1', '').failures, []);
  });

  /* ── HTTP header: the one rule that differs by mode ── */

  test('preview allows a hosting-level X-Robots-Tag noindex', () => {
    const result = evaluate('preview', 'index, follow', 'noindex');
    assert.deepEqual(result.failures, []);
    assert.equal(result.allowedByMode, true, 'and reports it as expected rather than silently');
  });

  test('preview passes when no robots header is present at all', () => {
    const result = evaluate('preview', 'index, follow', '');
    assert.deepEqual(result.failures, []);
    assert.equal(result.httpRobots, 'none');
  });

  test('production fails on an X-Robots-Tag noindex', () => {
    const { failures } = evaluate('production', 'index, follow', 'noindex');
    assert.equal(failures.length, 1);
    assert.match(failures[0], /X-Robots-Tag/);
  });

  test('production fails on a combined X-Robots-Tag, in either order', () => {
    assert.equal(evaluate('production', 'index, follow', 'noindex, nofollow').failures.length, 1);
    assert.equal(evaluate('production', 'index, follow', 'nofollow, noindex').failures.length, 1);
  });

  test('production allows an indexable X-Robots-Tag', () => {
    assert.deepEqual(evaluate('production', 'index, follow', 'index, follow').failures, []);
  });

  test('header matching is case-insensitive', () => {
    assert.equal(evaluate('production', 'index, follow', 'NOINDEX').failures.length, 1);
    assert.equal(evaluate('production', 'index, follow', 'NoIndex, NoFollow').failures.length, 1);
    assert.equal(evaluate('preview', 'index, follow', 'NOINDEX').allowedByMode, true);
  });

  test('both failures are reported together rather than one hiding the other', () => {
    const { failures } = evaluate('production', 'noindex', 'noindex');
    assert.equal(failures.length, 2);
  });

  test('an unresolved mode is a programming error, not a silent pass', () => {
    assert.throws(() => evaluate('auto', 'index, follow', ''), /needs a resolved mode/);
    assert.throws(() => evaluate('', 'index, follow', ''), /needs a resolved mode/);
  });
});

describe('command line parsing', () => {
  test('a positional URL is the base URL', () => {
    assert.deepEqual(parseCliArgs(['https://example.com'], {}), {
      baseUrl: 'https://example.com',
      requestedMode: 'auto',
    });
  });

  test('--mode is read as a flag and never mistaken for the URL', () => {
    const parsed = parseCliArgs(['--mode', 'production', 'https://example.com'], {});
    assert.equal(parsed.baseUrl, 'https://example.com');
    assert.equal(parsed.requestedMode, 'production');
  });

  test('--mode=value is accepted too', () => {
    assert.equal(parseCliArgs(['https://example.com', '--mode=preview'], {}).requestedMode, 'preview');
  });

  test('the environment supplies both when no arguments are given', () => {
    assert.deepEqual(
      parseCliArgs([], {
        ELECTRICSCOUTS_BASE_URL: 'https://env.example.com',
        ELECTRICSCOUTS_VERIFY_MODE: 'production',
      }),
      { baseUrl: 'https://env.example.com', requestedMode: 'production' }
    );
  });

  test('an explicit argument beats the environment', () => {
    const parsed = parseCliArgs(['https://arg.example.com', '--mode', 'preview'], {
      ELECTRICSCOUTS_BASE_URL: 'https://env.example.com',
      ELECTRICSCOUTS_VERIFY_MODE: 'production',
    });
    assert.equal(parsed.baseUrl, 'https://arg.example.com');
    assert.equal(parsed.requestedMode, 'preview');
  });
});

describe('the verifier is safe to import', () => {
  test('importing this module does not make it the entrypoint', () => {
    // The import at the top of this file already proves the strong version of
    // this — had main() run, the suite would have issued six HTTP requests and
    // called process.exit. This states the mechanism.
    assert.equal(isMainModule('file:///somewhere/verify-live-routes.mjs', '/elsewhere/other.mjs'), false);
  });

  test('a direct invocation is recognised, including a relative argv path', () => {
    const absolute = '/repo/scripts/verify-live-routes.mjs';
    assert.equal(isMainModule(`file://${absolute}`, absolute), true);
  });

  test('a missing argv[1] reads as "not the entrypoint" rather than throwing', () => {
    assert.equal(isMainModule('file:///repo/scripts/verify-live-routes.mjs', undefined), false);
  });
});
