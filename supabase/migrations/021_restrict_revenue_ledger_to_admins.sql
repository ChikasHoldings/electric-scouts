-- ═══════════════════════════════════════════════════════════
-- 021: Restrict the ledger and buyer terms to full admins
--
-- Migration 020 granted SELECT on `revenue_events` and `lead_buyers` to
-- `is_admin_staff()`, which includes the `viewer` and `editor` roles, while
-- every application-level gate on the Revenue and Lead Buyers screens is
-- admin-only. A UI check in front of a permissive policy is not an access
-- control — anyone with a viewer login could read earnings and buyer payout
-- terms straight from the browser client.
--
-- The database now enforces what the interface claims.
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Admin staff can read revenue events" ON public.revenue_events;
CREATE POLICY "Only admins can read revenue events"
  ON public.revenue_events FOR SELECT
  USING (public.is_admin());

-- Buyer payout terms and per-lead prices are the same class of information.
DROP POLICY IF EXISTS "Admin staff can read lead buyers" ON public.lead_buyers;
CREATE POLICY "Only admins can read lead buyers"
  ON public.lead_buyers FOR SELECT
  USING (public.is_admin());

-- Deliveries stay readable by editors. The Leads screen is an editor surface,
-- and an editor needs to see whether a lead was delivered and accepted to do
-- their job at all. The commercial terms behind a delivery live on
-- `lead_buyers`, which they can no longer read.
DROP POLICY IF EXISTS "Admin staff can read lead deliveries" ON public.lead_deliveries;
CREATE POLICY "Admin staff can read lead deliveries"
  ON public.lead_deliveries FOR SELECT
  USING (public.is_admin_staff());
