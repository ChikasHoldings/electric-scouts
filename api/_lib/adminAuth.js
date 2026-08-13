import { createClient } from "@supabase/supabase-js";

/**
 * Who is calling an admin endpoint, and may they.
 *
 * The browser holds an anon key and a user session. Nothing about a request
 * body is evidence of anything, so every admin endpoint resolves the caller
 * from the bearer token server-side and reads their role from `profiles` with
 * the service key — never from the token's own claims, which the client
 * supplies and could stale out after a demotion.
 */

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export { supabaseAdmin };

/** Roles that may see the admin panel at all. */
export const STAFF_ROLES = ["admin", "editor", "viewer"];
/** Roles that may change catalog and routing data. */
export const EDITOR_ROLES = ["admin", "editor"];

/**
 * Resolve and authorize the caller.
 *
 * @param {object} req
 * @param {string[]} allowedRoles  roles permitted for this operation
 * @returns {Promise<{user: object, profile: object} | {error: string, status: number}>}
 */
export async function requireAdmin(req, allowedRoles = ["admin"]) {
  const header = req.headers?.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return { error: "Unauthorized. No token provided.", status: 401 };
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) return { error: "Unauthorized. No token provided.", status: 401 };

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return { error: "Unauthorized. Invalid session.", status: 401 };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, role, full_name, email")
    .eq("id", data.user.id)
    .single();

  if (!profile || !allowedRoles.includes(profile.role)) {
    return { error: "Forbidden. Insufficient privileges.", status: 403 };
  }

  return { user: data.user, profile };
}
