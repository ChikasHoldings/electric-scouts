/**
 * leadCapture.js
 *
 * Whether to ask this visitor for their email, and for how long to stop asking.
 *
 * Three components ask: the inline rate-alerts block, the slide-up capture bar,
 * and the exit-intent popup. Each one kept its own note of what had already
 * happened, in its own key, and neither read the others':
 *
 *   ExitIntentPopup    exitPopupDismissed, rateAlertsSubmitted
 *   RateAlertsCapture  es_rate_alerts_captured
 *   EmailCapture       es_lead_captured, es_capture_dismissed
 *
 * So a visitor who signed up through the homepage block was still ambushed by
 * the exit popup on the way out, asked for the same address they had just
 * given. Signing up anywhere now silences all three.
 *
 * The other half is the one that makes a popup look broken. A dismissal was
 * written as `"true"` with no date and never expired, so closing it once
 * silenced it on that browser permanently. That is invisible at first and total
 * later: every returning visitor who ever hit the X is a visitor the popup can
 * never reach again, and from the inside it looks like the feature stopped
 * working. A dismissal is now a window, not a life sentence.
 *
 * Converting is different, and stays permanent. Someone who has given you their
 * email should never be asked for it again.
 */

import { readStored, writeStored } from './browser.js';

/** How long a dismissal holds. Long enough to respect a "no", not forever. */
export const DISMISS_DAYS = 30;

/**
 * Keys that mean "this visitor gave us their email".
 *
 * All three are read, and the historical ones are kept, because someone who
 * converted last week must not be prompted again just because the key they were
 * recorded under has been superseded.
 */
const CONVERSION_KEYS = ['es_email_captured', 'es_lead_captured', 'es_rate_alerts_captured', 'rateAlertsSubmitted'];

/** Where a conversion is recorded from now on. */
const CONVERSION_KEY = 'es_email_captured';

/** Has this visitor already handed over an email address, anywhere on the site? */
export function hasGivenEmail() {
  return CONVERSION_KEYS.some((key) => Boolean(readStored(key)));
}

/**
 * Record a conversion.
 *
 * Written under the shared key and the caller's own historical one, so a
 * rollback to a previous build does not start re-prompting people.
 */
export function markEmailGiven(legacyKey = null) {
  writeStored(CONVERSION_KEY, String(Date.now()));
  if (legacyKey) writeStored(legacyKey, 'true');
}

/**
 * Is a prompt still inside its dismissal window?
 *
 * A stored timestamp is the expiry. A bare `"true"` is the old
 * dismissed-forever format: it is treated as expired, so the one code change
 * that introduced windows also releases everyone the old format had silenced
 * permanently. Without that, the fix would take effect only for visitors who
 * had never dismissed — which is to say, it would not look like a fix.
 */
export function isDismissed(key) {
  const raw = readStored(key);
  if (!raw) return false;
  if (raw === 'true') return false;

  const until = Number(raw);
  if (!Number.isFinite(until)) return false;
  return Date.now() < until;
}

/** Stop asking, until `days` from now. */
export function dismissFor(key, days = DISMISS_DAYS) {
  writeStored(key, String(Date.now() + days * 24 * 60 * 60 * 1000));
}

/** Prompt keys, named here so no component invents a fourth namespace. */
export const PROMPT_KEYS = {
  exitIntent: 'exitPopupDismissed',
  slideUp: 'es_capture_dismissed',
};
