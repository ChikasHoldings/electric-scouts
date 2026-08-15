-- ═══════════════════════════════════════════════════════════
-- 025: Five policies named for the service role were granted to the public
--
-- Found during launch verification, live in production, and not in any
-- migration in this directory — they were created straight against the
-- database, which is why 022_fix_public_form_access.sql did not catch them and
-- why nothing in review ever saw them.
--
-- Each was written:
--
--   CREATE POLICY "Service role full access to X" ON X
--     FOR ALL TO public USING (true) WITH CHECK (true);
--
-- `TO public` in Postgres is not "the service role", it is *every* role —
-- `anon` and `authenticated` included. RLS policies are OR'd, so one
-- PERMISSIVE policy with `USING (true)` overrides every careful admin-scoped
-- policy sitting next to it. And the anon key ships inside the browser bundle,
-- so "every role" meant anyone who viewed source.
--
-- What was actually reachable, confirmed by querying as `anon`:
--
--   leads              2 rows — real customer names, email addresses and phone
--                      numbers — readable, writable and deletable
--   admin_reset_codes  1 live admin password-reset code, readable. That is an
--                      account-takeover path, not just a disclosure.
--   email_events       34 rows of recipient addresses
--   click_tracking     insertable, and click rows are what revenue attribution
--                      is computed from
--   admin_security_events  same shape; empty, which is the only reason it did
--                      not leak as well
--
-- They are dropped rather than rewritten because a corrected version would do
-- nothing: `service_role` carries BYPASSRLS, so the server has always had full
-- access without any policy, and every write to these tables goes through an
-- API route holding that key. The policy was never load-bearing — it was pure
-- exposure.
--
-- What remains on each table is the admin-scoped set built in 020-022:
-- is_admin(), is_admin_staff(), is_admin_editor(). Verified after applying —
-- as `anon`: 0 rows from every one of these tables, 0 rows updatable or
-- deletable in `leads`, and lead inserts rejected. As the signed-in admin: all
-- 2 leads, 39 click rows and 34 email events still visible. Public forms
-- (concierge_requests, custom_business_quotes) still accept anonymous inserts,
-- which is the thing 022 existed to guarantee.
-- ═══════════════════════════════════════════════════════════

drop policy if exists "Service role full access to leads" on public.leads;
drop policy if exists "Service role full access to admin_reset_codes" on public.admin_reset_codes;
drop policy if exists "Service role full access to email_events" on public.email_events;
drop policy if exists "Service role can insert clicks" on public.click_tracking;
drop policy if exists "Service role full access" on public.admin_security_events;
