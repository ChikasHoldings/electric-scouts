-- ═══════════════════════════════════════════════════════════
-- 003: Email System — Leads, Email Events, Admin Reset Codes
-- ═══════════════════════════════════════════════════════════

-- ─── Leads Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  zip TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'active', 'nurtured', 'converted', 'unsubscribed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- ─── Email Events Table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  email_to TEXT NOT NULL,
  event_type TEXT NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  resend_id TEXT,
  idempotency_key TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_events_idempotency ON email_events(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_events_lead ON email_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);

-- ─── Admin Reset Codes Table ───────────────────────────────
CREATE TABLE IF NOT EXISTS admin_reset_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_codes_email ON admin_reset_codes(admin_email);
CREATE INDEX IF NOT EXISTS idx_reset_codes_expires ON admin_reset_codes(expires_at);

-- ─── RLS Policies ──────────────────────────────────────────
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_reset_codes ENABLE ROW LEVEL SECURITY;

-- Leads: admin full access, service role for API inserts
CREATE POLICY "Admin full access to leads"
  ON leads FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service insert leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Email Events: admin read access, service role for API inserts
CREATE POLICY "Admin full access to email_events"
  ON email_events FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service insert email_events"
  ON email_events FOR INSERT
  WITH CHECK (true);

-- Admin Reset Codes: admin access only
CREATE POLICY "Admin full access to admin_reset_codes"
  ON admin_reset_codes FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Service insert admin_reset_codes"
  ON admin_reset_codes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service select admin_reset_codes"
  ON admin_reset_codes FOR SELECT
  USING (true);

CREATE POLICY "Service update admin_reset_codes"
  ON admin_reset_codes FOR UPDATE
  USING (true)
  WITH CHECK (true);
