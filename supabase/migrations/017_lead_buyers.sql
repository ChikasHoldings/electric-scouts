-- ═══════════════════════════════════════════════════════════
-- 017: Lead buyers
--
-- The monetization router already names where a lead should go —
-- residential_partner, commercial_partner, renewable_partner, concierge — but
-- nothing defined WHO those partners are. A lead routed to
-- `residential_partner` was a label with no recipient: correctly classified,
-- and then dropped.
--
-- This is the table an admin fills in when a lead-buying agreement is signed.
-- Adding a row is the whole configuration step: matching, capacity and
-- delivery all read from here, so a new buyer starts receiving leads without
-- a deploy.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lead_buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,

  -- ─── What this buyer will take ───────────────────────────
  -- Empty/null means "no restriction", so a buyer covering every market does
  -- not need 12 rows enumerated.
  customer_types TEXT[] DEFAULT '{}',   -- residential | commercial
  states TEXT[] DEFAULT '{}',           -- two-letter codes
  accepts_renewable BOOLEAN DEFAULT true,

  -- ─── Quality gates ───────────────────────────────────────
  -- A buyer paying real money is entitled to refuse leads below a standard.
  requires_phone BOOLEAN NOT NULL DEFAULT false,
  min_lead_score INTEGER,

  -- ─── Commercials ─────────────────────────────────────────
  price_per_lead NUMERIC(10,2),
  -- Higher wins when several buyers match. Price is NOT the tiebreak by
  -- default: routing a customer to whoever pays most, rather than whoever can
  -- actually serve them, is how a comparison service loses its customers.
  priority INTEGER NOT NULL DEFAULT 0,

  -- ─── Capacity ────────────────────────────────────────────
  -- A cap that is never reset would silently stop delivery forever, so the
  -- period it applies to is stored alongside the count.
  monthly_cap INTEGER,
  delivered_this_period INTEGER NOT NULL DEFAULT 0,
  period_started_at TIMESTAMPTZ DEFAULT date_trunc('month', now()),

  -- ─── Delivery ────────────────────────────────────────────
  delivery_method TEXT NOT NULL DEFAULT 'email'
    CHECK (delivery_method IN ('email', 'webhook', 'manual')),
  delivery_email TEXT,
  webhook_url TEXT,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_buyers_active ON lead_buyers(is_active);
CREATE INDEX IF NOT EXISTS idx_lead_buyers_priority ON lead_buyers(priority DESC);

-- ─── Which buyer received which lead ───────────────────────
-- Separate from leads.assigned_partner (a free-text label) because a lead can
-- legitimately be offered to more than one buyer over its life, and because
-- revenue attribution needs the price agreed AT THE TIME, not the buyer's
-- current price.
CREATE TABLE IF NOT EXISTS lead_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES lead_buyers(id) ON DELETE SET NULL,
  buyer_name TEXT,
  route TEXT,
  price_at_delivery NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'delivered', 'failed', 'rejected', 'accepted')),
  error TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- One delivery per lead per buyer: retries must not double-bill.
  UNIQUE (lead_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_deliveries_lead ON lead_deliveries(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_deliveries_buyer ON lead_deliveries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_lead_deliveries_status ON lead_deliveries(status);

-- ─── RLS ───────────────────────────────────────────────────
-- These hold commercial terms and buyer contact details. Nothing public reads
-- them: every write and read goes through the service role, matching how
-- leads and affiliate links are already handled.
ALTER TABLE lead_buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_deliveries ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE lead_buyers IS
  'Partners who buy qualified leads. Adding an active row here is the only step needed for the router to start sending it matching leads.';
COMMENT ON COLUMN lead_buyers.priority IS
  'Higher wins among matching buyers. Price is deliberately not the default tiebreak.';
COMMENT ON TABLE lead_deliveries IS
  'One row per lead offered to a buyer, with the price agreed at that moment.';
