-- ═══════════════════════════════════════════════════════════
-- 012: Comparison sessions on /compare-rates
--
-- The comparison engine writes progressively — a lead becomes recoverable the
-- moment an email is entered, and is enriched as the visitor continues. That
-- needs somewhere to put the qualification, energy profile and routing that the
-- flow produces.
--
-- Design notes:
--   * Fields the admin panel filters, sorts or segments on become real columns.
--     Everything else rides in the existing `search_preferences` JSONB rather
--     than growing the table for data nothing queries.
--   * `email` is already uniquely indexed, so it stays the upsert key and
--     repeated writes update one row instead of creating duplicates.
-- ═══════════════════════════════════════════════════════════

-- ─── Contact ───────────────────────────────────────────────
-- Phone was captured by no existing form, so the column did not exist.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone TEXT;

-- ─── Session ───────────────────────────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS comparison_session_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS comparison_status TEXT
  CHECK (comparison_status IN ('started', 'in_progress', 'completed'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ─── Customer type ─────────────────────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS customer_type TEXT
  CHECK (customer_type IN ('residential', 'commercial'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS energy_preference TEXT;

-- ─── Qualification ─────────────────────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS shopping_intent TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS usage_range TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS monthly_spend_range TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timing TEXT;

-- ─── Energy profile ────────────────────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS monthly_usage_kwh NUMERIC(12,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS monthly_cost NUMERIC(12,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS current_provider TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS current_plan TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS effective_rate NUMERIC(8,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contract_end_date TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS renewable_percentage INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS peak_demand_kw NUMERIC(12,2);

-- ─── Bill analyzer ─────────────────────────────────────────
-- Note: no column stores the bill file or the utility account number. The
-- analyzer keeps the figures it read and discards the account identity.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bill_uploaded BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bill_analysis_status TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bill_confidence TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bill_analyzed_at TIMESTAMPTZ;

-- ─── Monetization ──────────────────────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS monetization_route TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualification TEXT
  CHECK (qualification IN ('hot', 'warm', 'nurture'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_partner TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS confirmed_revenue NUMERIC(12,2);

-- ─── Consent ───────────────────────────────────────────────
-- Auditable evidence: what was agreed to, and when.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consent_contact BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consent_recorded_at TIMESTAMPTZ;

-- ─── Attribution ───────────────────────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_term TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS landing_page TEXT;

-- ─── Indexes for the admin lead queues ─────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_customer_type ON leads(customer_type);
CREATE INDEX IF NOT EXISTS idx_leads_route ON leads(monetization_route);
CREATE INDEX IF NOT EXISTS idx_leads_qualification ON leads(qualification);
CREATE INDEX IF NOT EXISTS idx_leads_session ON leads(comparison_session_id);
CREATE INDEX IF NOT EXISTS idx_leads_utm_campaign ON leads(utm_campaign);

-- ═══════════════════════════════════════════════════════════
-- Tighten the anon write policies added in 011.
--
-- 011 granted anon UPDATE with `USING (true)`, which lets any visitor rewrite
-- any lead in the table given only its id — including someone else's contact
-- details and conversion data. Nothing needs that: every write from the site
-- goes through /api/leads, which uses the service role and bypasses RLS.
--
-- Dropping the blanket anon policies closes the hole without changing how the
-- application writes leads.
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Anon update leads by email" ON leads;
DROP POLICY IF EXISTS "Anon insert leads" ON leads;

-- Keep RLS enforced with no anon write path.
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
