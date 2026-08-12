-- ═══════════════════════════════════════════════════════════
-- 018: Advance a lead buyer's monthly delivery counter
--
-- Done in one statement so two concurrent deliveries cannot both read the same
-- count and write it back — the read-modify-write that would let a buyer
-- exceed a cap they are paying against. The period rolls over automatically,
-- so a cap hit in one month does not block delivery forever.
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION increment_buyer_delivery(buyer_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE lead_buyers
  SET
    delivered_this_period = CASE
      WHEN period_started_at IS NULL OR period_started_at < date_trunc('month', now())
      THEN 1 ELSE delivered_this_period + 1 END,
    period_started_at = CASE
      WHEN period_started_at IS NULL OR period_started_at < date_trunc('month', now())
      THEN date_trunc('month', now()) ELSE period_started_at END,
    updated_at = now()
  WHERE id = increment_buyer_delivery.buyer_id;
$$;

COMMENT ON FUNCTION increment_buyer_delivery IS
  'Advances a lead buyer monthly delivery counter, rolling the period over when the month changes.';
