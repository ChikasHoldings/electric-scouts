-- ═══════════════════════════════════════════════════════════
-- 024: Take four functions off the public API
--
-- Every function in `public` is published by PostgREST as an RPC endpoint, and
-- these four were left executable by `anon`. All four are SECURITY DEFINER, so
-- a caller reached them with the definer's privileges rather than their own.
--
-- The one that mattered:
--
--   increment_buyer_delivery(uuid) advances a lead buyer's monthly delivery
--   counter. Anyone could POST a buyer UUID to
--   /rest/v1/rpc/increment_buyer_delivery and run that counter up — tripping
--   the buyer's monthly cap so the router stopped sending them leads, and
--   corrupting the count the ledger bills against. It is only ever meant to be
--   called by api/_lib/leadDelivery.js with the service role, which holds its
--   own grant and is unaffected by this.
--
-- The other three are never called directly at all:
--
--   handle_new_user() and touch_utility_territories_updated_at() are trigger
--   functions, and rls_auto_enable() is an event-trigger function. Postgres
--   does not check EXECUTE against the invoking user when firing a trigger, so
--   revoking it costs those paths nothing.
--
-- Deliberately NOT revoked: is_admin(), is_admin_staff(), is_admin_editor().
-- The linter flags them as anon-executable too, but 42 RLS policies call them,
-- and a policy's function call is checked against the querying role — revoking
-- EXECUTE from `authenticated` would deny every one of those policies and lock
-- the admin panel out of its own tables. They report only whether the caller
-- is staff, so an anonymous caller learns nothing but "false".
-- ═══════════════════════════════════════════════════════════

-- PUBLIC first, and it is the one that actually matters. Postgres grants
-- EXECUTE on every new function to PUBLIC by default, so revoking only from
-- `anon` and `authenticated` leaves them reaching the function through the
-- PUBLIC grant and changes nothing — has_function_privilege still answers true.
-- The named roles are revoked as well so no explicit grant survives underneath.
--
-- `service_role` and `postgres` hold their own explicit grants and keep access.

REVOKE ALL ON FUNCTION public.increment_buyer_delivery(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_utility_territories_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
