import { supabase } from "@/lib/supabaseClient";

/**
 * Calling the admin write endpoints.
 *
 * Every mutation that moves money or a lead goes through the server, which
 * re-derives the caller's role from their token rather than trusting anything
 * the browser says about itself. This helper's only job is to attach the
 * current session so that check has something to verify.
 *
 * Errors are thrown as `Error` with the server's message intact, because the
 * server's message is the useful one — "This lead did not consent to being
 * contacted" tells an operator what to do; "Request failed" does not.
 */
export async function adminPost(action, payload = {}) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Your session has expired. Sign in again to continue.");
  }

  // One admin endpoint, dispatching by action. Not a stylistic choice: the
  // deployment plan caps serverless functions at 12 and the project uses all
  // of them, so money and routing actions ride on the existing admin router.
  const response = await fetch("/api/admin/manage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  // A non-JSON body means the function crashed or the route is missing; the
  // status is then the only thing worth reporting.
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    // The HTTP status and the server's own error code ride along on the Error
    // so a caller can distinguish "your session expired" from "this lead has no
    // consent" without string-matching the message.
    throw Object.assign(
      new Error(body?.error || `Request failed (${response.status})`),
      { status: response.status, code: body?.code || null }
    );
  }

  return body || {};
}
