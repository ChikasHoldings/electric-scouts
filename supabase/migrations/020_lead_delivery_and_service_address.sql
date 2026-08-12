-- ═══════════════════════════════════════════════════════════
-- 020: Make a sold lead visible, and give the bill analyzer somewhere to
--      put the address it reads.
--
-- Two gaps this closes, both of which were pipelines that ran but recorded
-- nothing an admin could see.
--
--   1. Lead delivery. `lead_deliveries` has held the authoritative record of
--      every offer since migration 017, but the leads list has no way to show
--      whether a lead was sold without a join per row. These four columns are
--      a denormalized summary of the latest delivery for display and
--      filtering; `lead_deliveries` remains the source of truth and the thing
--      the unique constraint protects.
--
--   2. Service address confidence. Migration 014 added the address columns for
--      exactly this purpose and nothing ever wrote to them, because the
--      analyzer's extraction never left the browser. The buyer payload has
--      been sending `service_address: null` on every delivery ever since.
-- ═══════════════════════════════════════════════════════════

-- ─── Delivery outcome, denormalized for the admin list ─────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_buyer_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_delivery_status TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10,2);

-- Partial index: the interesting query is "which leads went unsold", and that
-- set is small relative to the table.
CREATE INDEX IF NOT EXISTS idx_leads_delivery_status
  ON leads(lead_delivery_status)
  WHERE lead_delivery_status IS NOT NULL;

COMMENT ON COLUMN leads.lead_delivery_status IS
  'delivered | unsold. Summary of the latest lead_deliveries row; that table is authoritative.';
COMMENT ON COLUMN leads.sale_price IS
  'The buyer price agreed at the moment of delivery, not the buyer''s current price.';

-- ─── Where the address came from ───────────────────────────
-- The columns exist (014). What was missing is the vocabulary, so a reader can
-- tell an address the customer typed from one an OCR pass guessed at.
COMMENT ON COLUMN leads.service_address_source IS
  'bill_analyzer | customer_entered | customer_confirmed. A bill_analyzer value that the customer has not confirmed is a machine reading, not a fact.';
COMMENT ON COLUMN leads.service_address_confidence IS
  'high | low. Low means the extraction was incomplete or the address failed the shape check; buyers that require a serviceable address should not be sent one.';
