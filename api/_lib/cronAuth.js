/**
 * Who may trigger a scheduled job.
 *
 * These endpoints send real email to real customers — the follow-up batch
 * mails up to 50 leads per invocation — so "reachable by anyone who knows the
 * URL" is not a viable posture. Two holes this closes:
 *
 *   `/api/leads?action=follow-up` had no authentication of any kind. A stranger
 *   could POST it repeatedly and mail the customer list as often as they liked.
 *
 *   `/api/admin/weekly-report` checked the secret only on GET, so a POST
 *   sailed past the check even when a secret was configured. It also treated a
 *   missing CRON_SECRET as "no auth required", which fails open — the one
 *   direction an auth check must never fail.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`, so that is the shape
 * accepted here. An admin can also trigger these by hand with a session token,
 * which is checked by the caller rather than here.
 */

/**
 * Is this request an authentic scheduled invocation?
 *
 * @returns {{ok: true} | {ok: false, status: number, error: string}}
 */
export function verifyCronRequest(req) {
  const secret = process.env.CRON_SECRET;

  // Fails closed. Without a configured secret there is no way to tell a cron
  // from a stranger, so nothing is allowed through rather than everything.
  if (!secret) {
    return {
      ok: false,
      status: 503,
      error: "Scheduled jobs are not configured. Set CRON_SECRET to enable them.",
    };
  }

  const header = req.headers?.authorization || "";
  if (header !== `Bearer ${secret}`) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true };
}
