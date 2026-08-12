/**
 * Timing for the analysis screen.
 *
 * Split out from the component and made a pure function of elapsed time so the
 * behaviour can be tested by passing numbers instead of by sleeping. Timing
 * tests that wait on real clocks are the flakiest tests in any suite, and this
 * has real rules worth pinning.
 *
 * The rules:
 *   - the screen is visible for at least MIN_VISIBLE_MS, even when matching
 *     finished immediately
 *   - if matching is still running after that, the screen stays up rather than
 *     revealing half-computed results
 *   - real work is never cut off; TARGET_MAX_MS is the point past which we stop
 *     advancing the copy, not a deadline that abandons the request
 *   - a genuine failure surfaces a recovery state, it does not spin forever
 */

/**
 * The six stages, in order. Each names something the engine is actually doing
 * at that point, which is why there is no percentage: a percentage here would
 * be invented, and inventing progress is the thing that makes a loader feel
 * fake.
 */
export const ANALYSIS_STAGES = [
  { id: 'usage', message: 'Analyzing your electricity usage…' },
  { id: 'availability', message: 'Checking plans available at your address…' },
  { id: 'cost', message: 'Comparing estimated monthly costs…' },
  { id: 'matches', message: 'Finding your best matches…' },
  { id: 'savings', message: 'Calculating your potential savings…' },
  { id: 'results', message: 'Preparing your results…' },
];

/** Minimum time the analysis screen stays up. */
export const MIN_VISIBLE_MS = 5000;

/**
 * The point past which the copy stops advancing.
 *
 * NOT a timeout. Matching that legitimately runs longer keeps running and the
 * loader keeps showing the final stage — the customer is never shown partial
 * results because the clock ran out.
 */
export const TARGET_MAX_MS = 10000;

/**
 * Hard ceiling before a still-running match is treated as failed.
 *
 * Generous on purpose: it exists so a request that has genuinely hung produces
 * a recovery screen instead of an endless spinner, not to bound normal work.
 */
export const FAILURE_TIMEOUT_MS = 30000;

/**
 * Which stage is showing at `elapsedMs`.
 *
 * The six messages are paced across the minimum visible period so a customer
 * whose match resolved instantly still sees the whole sequence rather than a
 * flicker of the first message. Past that the last stage holds.
 */
export function stageIndexAt(elapsedMs, stageCount = ANALYSIS_STAGES.length) {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return 0;
  const perStage = MIN_VISIBLE_MS / stageCount;
  return Math.min(stageCount - 1, Math.floor(elapsedMs / perStage));
}

/** The stage object showing at `elapsedMs`. */
export function stageAt(elapsedMs) {
  return ANALYSIS_STAGES[stageIndexAt(elapsedMs)];
}

/**
 * What the analysis screen should be doing right now.
 *
 * @param {object} input
 * @param {number} input.elapsedMs      time since the screen appeared
 * @param {boolean} input.ready         matching has produced results
 * @param {boolean} [input.failed]      matching reported an error
 * @param {number} [input.minVisibleMs] injectable for tests
 * @param {number} [input.failureTimeoutMs] injectable for tests
 * @returns {{phase: 'analyzing'|'complete'|'failed', stage: object, holding: boolean}}
 */
export function resolveAnalysisPhase({
  elapsedMs,
  ready,
  failed = false,
  minVisibleMs = MIN_VISIBLE_MS,
  failureTimeoutMs = FAILURE_TIMEOUT_MS,
}) {
  const stage = stageAt(elapsedMs);

  // A reported failure surfaces immediately — there is nothing to wait for,
  // and holding a spinner over a known error only delays the recovery action.
  if (failed) return { phase: 'failed', stage, holding: false };

  // A request still running past the hard ceiling is treated as hung.
  if (!ready && elapsedMs >= failureTimeoutMs) {
    return { phase: 'failed', stage, holding: false };
  }

  if (!ready) return { phase: 'analyzing', stage, holding: false };

  // Results exist but the minimum presentation period has not elapsed.
  // `holding` distinguishes "still working" from "waiting on the clock", which
  // is the difference the tests care about.
  if (elapsedMs < minVisibleMs) {
    return { phase: 'analyzing', stage, holding: true };
  }

  return { phase: 'complete', stage, holding: false };
}
