-- ═══════════════════════════════════════════════════════════
-- 015: Persist the Resend message id
--
-- Production email_events already uses `to_email` and `error`, which is what
-- api/_lib/email.js writes — those were consistent and must not be renamed.
-- What was genuinely missing is the provider message id, so a send could never
-- be traced back to Resend or reconciled against a delivery webhook.
-- ═══════════════════════════════════════════════════════════
ALTER TABLE email_events ADD COLUMN IF NOT EXISTS resend_id TEXT;
CREATE INDEX IF NOT EXISTS idx_email_events_resend_id ON email_events(resend_id);
COMMENT ON COLUMN email_events.resend_id IS
  'Message id returned by Resend. Null means the provider never confirmed acceptance.';
