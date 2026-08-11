-- ═══════════════════════════════════════════════════════════
-- 013: Where a comparison began
--
-- The three service landing pages (/residential-electricity,
-- /business-electricity, /renewable-energy) now hand visitors into the shared
-- /compare-rates engine with the ZIP code and the audience already answered.
-- Without recording which door a session came through, every lead looks like it
-- arrived at /compare-rates directly, and the landing pages cannot be measured
-- against each other — or against the traffic bought to reach them.
--
-- `source_page` already distinguishes residential from commercial *outcomes*;
-- this records the *entry point*, which is a different question and the one
-- funnel reporting needs.
--
-- Values written by the client (see engine/entryContext.js):
--   residential_landing | commercial_landing | renewable_landing
--   compare_rates_direct | bill_analyzer
-- Left unconstrained on purpose: a new entry point should not need a migration
-- before it can be measured.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE leads ADD COLUMN IF NOT EXISTS entry_context TEXT;

-- Segmenting the funnel by entry point is the whole reason the column exists,
-- so the index it will always be grouped by comes with it.
CREATE INDEX IF NOT EXISTS idx_leads_entry_context ON leads(entry_context);

COMMENT ON COLUMN leads.entry_context IS
  'Which page opened this comparison session: a service landing page, the bill analyzer, or /compare-rates directly.';
