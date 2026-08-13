-- ═══════════════════════════════════════════════════════════
-- 016: Utility / TDSP delivery tariffs
--
-- Recovered into version control. This table was applied directly to the live
-- project on 2026-08-12 and never committed, which is why the migration
-- sequence here jumps 015 → 017. It is reproduced from the live schema exactly
-- — columns, constraints, RLS and comment — and written idempotently so
-- applying it to a database that already has the table is a no-op.
--
-- WHY THE TABLE EXISTS
--
-- A delivery charge is a fact about a utility's service territory, not about a
-- plan. Every retailer selling into Oncor bills the same Oncor delivery
-- charge; storing it per plan means the same number is copied across every
-- plan in that territory and has to be corrected in every one of them when the
-- tariff changes twice a year.
--
-- `electricity_plans.tdsp_charges` therefore stops being the place delivery
-- charges live and becomes a per-plan override for the rare plan that bundles
-- delivery differently. The tariff itself is configured once here.
--
-- `billing_model` is the field that makes this correct rather than merely
-- convenient. It records what a plan's advertised rate already covers:
--
--   supply_only  the retailer quotes energy; the utility bills delivery on top,
--                so the delivery charge must be ADDED to reach a real bill
--   all_in       the advertised rate already includes delivery, so adding
--                anything would overstate the bill
--
-- Getting that backwards produces a confidently wrong number, which is worse
-- than the supply-only subtotal shown when nothing is configured.
--
-- PROVENANCE IS PART OF THE ROW. `source_name`, `source_url` and `verified_at`
-- exist so a delivery charge can be traced to the published tariff it came
-- from. A rate nobody can source is a rate nobody should be billing customers
-- against, and effective dating means a tariff change is a new row rather than
-- an overwrite that silently rewrites history.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.utility_territories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- ─── Identity ───
  name TEXT NOT NULL,
  short_code TEXT,
  state TEXT NOT NULL,

  -- ─── What the retailer's advertised rate already covers ───
  billing_model TEXT NOT NULL DEFAULT 'supply_only'
    CHECK (billing_model IN ('all_in', 'supply_only')),

  -- ─── The tariff ───
  -- NULL means unknown. 0 is meaningful here and is deliberately allowed: it
  -- records "verified, this territory has no such charge", which is a real
  -- finding and different from never having looked.
  delivery_per_kwh_cents NUMERIC(8, 4)
    CONSTRAINT utility_territories_delivery_non_negative
    CHECK (delivery_per_kwh_cents IS NULL OR delivery_per_kwh_cents >= 0),
  fixed_monthly_delivery_charge NUMERIC(8, 2)
    CONSTRAINT utility_territories_fixed_non_negative
    CHECK (fixed_monthly_delivery_charge IS NULL OR fixed_monthly_delivery_charge >= 0),

  -- ─── Effective dating ───
  -- Delivery tariffs change on a published schedule. A superseded rate is
  -- closed out rather than overwritten, so a historical quote stays explainable.
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  CONSTRAINT utility_territories_effective_window
    CHECK (effective_to IS NULL OR effective_to >= effective_from),

  -- ─── Provenance ───
  source_name TEXT,
  source_url TEXT,
  verified_at DATE,

  -- ─── Territory matching ───
  -- Empty or NULL means the tariff applies to the whole state. Prefixes make a
  -- territory more specific, and the more specific match wins.
  service_zip_prefixes TEXT[],

  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_utility_territories_state
  ON public.utility_territories(state);
CREATE INDEX IF NOT EXISTS idx_utility_territories_active
  ON public.utility_territories(is_active);

COMMENT ON TABLE public.utility_territories IS
  'Utility/TDSP delivery tariffs, scoped to a service territory and effective-dated. NULL charge = unknown; 0 = verified no charge.';

COMMENT ON COLUMN public.utility_territories.billing_model IS
  'What a retailer''s advertised rate already covers in this territory. supply_only: delivery is billed on top and must be added. all_in: the advertised rate already includes delivery.';

COMMENT ON COLUMN public.utility_territories.service_zip_prefixes IS
  'ZIP prefixes this tariff covers. Empty or NULL applies state-wide; a prefixed row is more specific and wins over the state-wide fallback.';

-- ─── Access ───
--
-- Tariffs are commercial configuration, not public data: the browser never
-- reads this table. The comparison engine runs server-side with the service
-- role, so a customer sees the tariff's effect on their price without the
-- tariff itself ever being exposed.
ALTER TABLE public.utility_territories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin staff can read utility territories" ON public.utility_territories;
CREATE POLICY "Admin staff can read utility territories"
  ON public.utility_territories FOR SELECT
  USING (public.is_admin_staff());

DROP POLICY IF EXISTS "Admin staff can insert utility territories" ON public.utility_territories;
CREATE POLICY "Admin staff can insert utility territories"
  ON public.utility_territories FOR INSERT
  WITH CHECK (public.is_admin_editor());

DROP POLICY IF EXISTS "Admin staff can update utility territories" ON public.utility_territories;
CREATE POLICY "Admin staff can update utility territories"
  ON public.utility_territories FOR UPDATE
  USING (public.is_admin_editor());

DROP POLICY IF EXISTS "Only admins can delete utility territories" ON public.utility_territories;
CREATE POLICY "Only admins can delete utility territories"
  ON public.utility_territories FOR DELETE
  USING (public.is_admin());
