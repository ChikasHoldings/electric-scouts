/**
 * Analysis screen timing — `npm test`.
 *
 * Every assertion here passes a number rather than waiting on a clock. Timing
 * tests that sleep are the flakiest tests in any suite, which is why the rules
 * live in a pure function and the component only draws.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  ANALYSIS_STAGES,
  MIN_VISIBLE_MS,
  TARGET_MAX_MS,
  FAILURE_TIMEOUT_MS,
  stageIndexAt,
  stageAt,
  resolveAnalysisPhase,
} from '../src/components/compare/engine/analysisTimeline.js';

describe('analysis stages', () => {
  test('the sequence matches the specified copy', () => {
    assert.deepEqual(
      ANALYSIS_STAGES.map((s) => s.message),
      [
        'Analyzing your electricity usage…',
        'Checking plans available at your address…',
        'Comparing estimated monthly costs…',
        'Finding your best matches…',
        'Calculating your potential savings…',
        'Preparing your results…',
      ]
    );
  });

  test('no stage claims a numeric percentage', () => {
    // A percentage here would be invented, and an invented one is what makes
    // a loader feel fake.
    for (const stage of ANALYSIS_STAGES) {
      assert.ok(!/\d+\s*%/.test(stage.message), `${stage.message} must not show a percentage`);
    }
  });

  test('starts on the first stage', () => {
    assert.equal(stageIndexAt(0), 0);
    assert.equal(stageIndexAt(-100), 0);
    assert.equal(stageAt(0).id, 'usage');
  });

  test('advances through every stage within the minimum visible period', () => {
    // A customer whose match resolved instantly still sees the whole sequence
    // rather than a flicker of the first message.
    const seen = new Set();
    for (let t = 0; t < MIN_VISIBLE_MS; t += 50) seen.add(stageIndexAt(t));
    assert.equal(seen.size, ANALYSIS_STAGES.length, 'every stage should be reachable before the minimum elapses');
  });

  test('advances monotonically — copy never goes backwards', () => {
    let previous = 0;
    for (let t = 0; t <= TARGET_MAX_MS; t += 100) {
      const index = stageIndexAt(t);
      assert.ok(index >= previous, `stage went backwards at ${t}ms`);
      previous = index;
    }
  });

  test('holds the final stage when work runs long', () => {
    const last = ANALYSIS_STAGES.length - 1;
    assert.equal(stageIndexAt(MIN_VISIBLE_MS), last);
    assert.equal(stageIndexAt(TARGET_MAX_MS), last);
    assert.equal(stageIndexAt(FAILURE_TIMEOUT_MS - 1), last);
  });
});

describe('minimum presentation period', () => {
  test('results ready immediately are still held', () => {
    // The whole point: matching that returns in 40ms must not flash past.
    const { phase, holding } = resolveAnalysisPhase({ elapsedMs: 40, ready: true });
    assert.equal(phase, 'analyzing');
    assert.equal(holding, true, 'holding distinguishes "waiting on the clock" from "still working"');
  });

  test('results are revealed once the minimum has elapsed', () => {
    assert.equal(resolveAnalysisPhase({ elapsedMs: MIN_VISIBLE_MS, ready: true }).phase, 'complete');
  });

  test('the boundary is inclusive and does not flap', () => {
    assert.equal(resolveAnalysisPhase({ elapsedMs: MIN_VISIBLE_MS - 1, ready: true }).phase, 'analyzing');
    assert.equal(resolveAnalysisPhase({ elapsedMs: MIN_VISIBLE_MS, ready: true }).phase, 'complete');
    assert.equal(resolveAnalysisPhase({ elapsedMs: MIN_VISIBLE_MS + 1, ready: true }).phase, 'complete');
  });

  test('the minimum is injectable, so tests never sleep', () => {
    const early = resolveAnalysisPhase({ elapsedMs: 10, ready: true, minVisibleMs: 5 });
    assert.equal(early.phase, 'complete');
  });

  test('the specified window is approximately five seconds', () => {
    assert.equal(MIN_VISIBLE_MS, 5000);
    assert.equal(TARGET_MAX_MS, 10000);
  });
});

describe('work that runs longer than the window', () => {
  test('real processing is never cut off at the target maximum', () => {
    // TARGET_MAX_MS is where the copy stops advancing, not a deadline that
    // abandons the request and shows a half-populated board.
    const { phase } = resolveAnalysisPhase({ elapsedMs: TARGET_MAX_MS + 5000, ready: false });
    assert.equal(phase, 'analyzing', 'still-running work must keep the loader up');
  });

  test('results appear as soon as slow work finishes', () => {
    assert.equal(
      resolveAnalysisPhase({ elapsedMs: TARGET_MAX_MS + 5000, ready: true }).phase,
      'complete'
    );
  });

  test('a customer is never shown partially computed results', () => {
    for (let t = 0; t < FAILURE_TIMEOUT_MS; t += 250) {
      const { phase } = resolveAnalysisPhase({ elapsedMs: t, ready: false });
      assert.notEqual(phase, 'complete', `results must not be revealed at ${t}ms while still working`);
    }
  });
});

describe('failure handling', () => {
  test('a reported failure surfaces immediately', () => {
    // Nothing to wait for — holding a spinner over a known error only delays
    // the recovery action.
    assert.equal(resolveAnalysisPhase({ elapsedMs: 10, ready: false, failed: true }).phase, 'failed');
  });

  test('a failure is not masked by the minimum presentation period', () => {
    assert.equal(
      resolveAnalysisPhase({ elapsedMs: MIN_VISIBLE_MS / 2, ready: true, failed: true }).phase,
      'failed'
    );
  });

  test('a hung request becomes a recovery state rather than an endless spinner', () => {
    assert.equal(resolveAnalysisPhase({ elapsedMs: FAILURE_TIMEOUT_MS, ready: false }).phase, 'failed');
  });

  test('the hard ceiling is injectable', () => {
    const { phase } = resolveAnalysisPhase({
      elapsedMs: 100,
      ready: false,
      failureTimeoutMs: 50,
    });
    assert.equal(phase, 'failed');
  });

  test('a stage is always returned, so the screen can render in any phase', () => {
    for (const input of [
      { elapsedMs: 0, ready: false },
      { elapsedMs: 999999, ready: false },
      { elapsedMs: 10, ready: false, failed: true },
    ]) {
      assert.ok(resolveAnalysisPhase(input).stage?.message, 'stage must always be present');
    }
  });
});
