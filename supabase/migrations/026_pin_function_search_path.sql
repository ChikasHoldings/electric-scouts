-- ═══════════════════════════════════════════════════════════
-- 026: Pin search_path on the SECURITY DEFINER helpers
--
-- Flagged by the Supabase database linter (0011_function_search_path_mutable)
-- on all seven functions in `public`.
--
-- A SECURITY DEFINER function runs with its owner's privileges. If its body
-- resolves any name unqualified and the caller controls `search_path`, the
-- caller decides which object that name resolves to — and their object then
-- runs as the owner. The admin predicates are the worst place to leave that
-- open: is_admin(), is_admin_staff() and is_admin_editor() are what every RLS
-- policy on leads, revenue_events and the rest calls to decide who you are.
--
-- Pinning the path closes it. `pg_temp` is listed last on purpose — putting it
-- first would let a caller's temporary objects shadow real ones, which is the
-- same hole by another route.
--
-- EXECUTE is deliberately not revoked here. 024 already took the functions that
-- should not be callable off the RPC surface; these three must stay callable by
-- `anon` and `authenticated` because RLS policies are evaluated as the querying
-- role. Revoke EXECUTE and every anonymous read of a table carrying an admin
-- policy — articles, for one — raises a permission error instead of quietly
-- returning no rows. They return a boolean about the caller, so a non-admin
-- who calls one gets `false` and learns nothing.
-- ═══════════════════════════════════════════════════════════

alter function public.is_admin() set search_path = public, pg_temp;
alter function public.is_admin_staff() set search_path = public, pg_temp;
alter function public.is_admin_editor() set search_path = public, pg_temp;
alter function public.handle_new_user() set search_path = public, pg_temp;
alter function public.update_updated_at_column() set search_path = public, pg_temp;
alter function public.update_concierge_updated_at() set search_path = public, pg_temp;
alter function public.update_article_updated_date() set search_path = public, pg_temp;
