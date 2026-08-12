-- ═══════════════════════════════════════════════════════════
-- 014: Referral attribution, service address, and the data fixes that
--      make both of them work.
--
-- Three problems this migration closes:
--
--   1. A referral click recorded nothing but a slug, a user agent and a hashed
--      IP. There was no way to answer "which comparison session produced this
--      click, on which plan, in which result position" — so no click could be
--      attributed to a lead, and no conversion could be attributed to the
--      comparison that produced it.
--
--   2. 284 of the 378 active plans carried no `provider_id`. Every affiliate
--      link in the table is keyed on `provider_id`, so those plans could not
--      resolve to a referral link at all. The names match a provider row
--      exactly in all 284 cases, so this is a backfill rather than a schema
--      problem.
--
--   3. `electricity_providers.logo_url` was null for all 38 providers even
--      though eight provider logos ship in /public/images/providers. The
--      results board had no logo to show because nothing pointed at the files.
-- ═══════════════════════════════════════════════════════════

-- ─── Contact: first and last name ──────────────────────────
-- `name` stays the derived display name ("Henry Kabakwu") that every existing
-- email template and the admin panel already read. These two carry the parts,
-- which is what the quote flow now captures and what a partner handoff needs.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_name TEXT;

-- ─── Service address ───────────────────────────────────────
-- The electricity service location, which is what determines plan eligibility.
-- Deliberately separate from any billing address on the bill: they differ often
-- enough that treating them as one produces quotes for the wrong territory.
-- `service_address_source` records whether the customer typed it or the bill
-- analyzer read it, and `service_address_confidence` how much the extraction is
-- trusted — a low-confidence read is confirmed by the customer before it is
-- allowed to override anything.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS service_address TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS service_unit TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS service_city TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS service_state TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS service_zip TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS service_address_source TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS service_address_confidence TEXT;

-- ─── Outcome of the comparison ─────────────────────────────
-- Which plan the customer actually clicked through on, and whether that click
-- had a monetized destination. `monetization_status` is what makes "no
-- qualified lead silently falls through" a query rather than an assumption.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS selected_plan_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS selected_provider TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS selected_plan_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS selected_match_score INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referral_route TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS monetization_status TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_referral_click_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_monetization_status ON leads(monetization_status);

-- ─── Referral click attribution ────────────────────────────
-- click_tracking already existed with slug/referrer/user_agent/ip_hash. These
-- columns are what turn a row into an attributable revenue event.
ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS provider_id UUID;
ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS provider_name TEXT;
ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS plan_name TEXT;
ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS match_score INTEGER;
ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS result_position INTEGER;
-- 'top_match' | 'more_options' — whether the click came from the Top 3 or the list.
ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS result_section TEXT;
-- How the destination was resolved: offer_link | provider_link | provider_affiliate_url
-- | provider_website | concierge. The last one is the unmonetized fallback and
-- is what an admin filters on to find providers still missing a referral URL.
ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS resolution TEXT;
ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS monetized BOOLEAN;
ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS entry_context TEXT;
ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE click_tracking ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

CREATE INDEX IF NOT EXISTS idx_click_tracking_session ON click_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_lead ON click_tracking(lead_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_plan ON click_tracking(plan_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_monetized ON click_tracking(monetized);

-- ─── Backfill: plans → providers ───────────────────────────
-- Exact, case- and whitespace-insensitive name match only. A plan whose
-- provider name has no row stays null rather than being attached to a guess.
UPDATE electricity_plans ep
SET provider_id = p.id
FROM electricity_providers p
WHERE ep.provider_id IS NULL
  AND lower(btrim(p.name)) = lower(btrim(ep.provider_name));

-- ─── Backfill: provider logos ──────────────────────────────
-- Points at the assets already committed under /public/images/providers.
-- Providers with no bundled asset stay null; the results board renders a
-- designed initials mark for those rather than a broken image.
UPDATE electricity_providers SET logo_url = v.path
FROM (VALUES
  ('TXU Energy', '/images/providers/txu-energy.png'),
  ('Reliant Energy', '/images/providers/reliant-energy.png'),
  ('Green Mountain Energy', '/images/providers/green-mountain-energy.png'),
  ('Frontier Utilities', '/images/providers/frontier-utilities.png'),
  ('Direct Energy', '/images/providers/direct-energy.png'),
  ('Constellation Energy', '/images/providers/constellation-energy.png'),
  ('Champion Energy', '/images/providers/champion-energy.png'),
  ('Ambit Energy', '/images/providers/ambit-energy.png')
) AS v(name, path)
WHERE lower(btrim(electricity_providers.name)) = lower(v.name)
  AND (electricity_providers.logo_url IS NULL OR electricity_providers.logo_url = '');
