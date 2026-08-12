-- Migration 016: Utility delivery pricing as first-class, territory-scoped data
--
-- WHY THIS EXISTS
--
-- Delivery charges were modelled as `electricity_plans.tdsp_charges`: one
-- numeric column, on the plan, holding a per-kWh rate. That is wrong in three
-- separate ways, and all three block a defensible monthly bill estimate.
--
--   1. WRONG OWNER. Delivery is a property of the utility that owns the wires,
--      not of the retail plan. A TXU plan sold across all five Texas TDUs has
--      five different delivery charges depending on the customer's address, and
--      every plan in a territory shares one value. Storing it per-plan means
--      the same number is duplicated across hundreds of rows and has to be
--      re-entered every time a tariff changes.
--
--   2. INCOMPLETE STRUCTURE. Every real delivery tariff in every market this
--      catalog serves has TWO components: a fixed monthly customer charge and a
--      per-kWh charge. A single per-kWh column cannot express the fixed part,
--      so an estimate built from it is short by the customer charge every
--      month.
--
--   3. WRONG VOCABULARY FOR 11 OF 12 MARKETS. "TDSP" is Texas. The catalog
--      also covers CT, IL, MA, MD, ME, NH, NJ, NY, OH, PA and RI, where retail
--      choice covers SUPPLY only and the incumbent utility keeps billing
--      delivery. Those are structurally different products and the schema has
--      to be able to say which is which — see `billing_model` below.
--
-- NULL IS NOT ZERO
--
-- `delivery_per_kwh_cents` and `fixed_monthly_delivery_charge` are nullable
-- with NO DEFAULT, deliberately. NULL means "we do not know this charge" and
-- must keep the plan out of complete pricing. 0 means "this territory verifiably
-- has no such charge" and is a known value that can produce a complete estimate.
--
-- This is the opposite of `electricity_plans.tdsp_charges`, which defaults to 0
-- and therefore cannot distinguish the two. That column is left in place and
-- keeps its existing semantics (0 = unknown) for backward compatibility; the
-- pricing engine now prefers the territory.

-- ── Territories ──

CREATE TABLE IF NOT EXISTS public.utility_territories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity. `short_code` is the operational handle an admin recognises
  -- (ONCOR, CNP, PECO); `name` is what a customer would see on their bill.
  name text NOT NULL,
  short_code text,
  state text NOT NULL,

  -- How retail choice works in this market. This decides what a complete bill
  -- estimate has to contain and how delivery is disclosed to the customer.
  --
  --   all_in      The retail supplier bills the whole bill and passes the
  --               utility's delivery charges through on it. Texas / ERCOT.
  --   supply_only The supplier bills supply; the utility bills delivery
  --               separately and switching supplier does not change it.
  --               Every non-Texas market in this catalog.
  billing_model text NOT NULL DEFAULT 'supply_only'
    CHECK (billing_model IN ('all_in', 'supply_only')),

  -- ── The tariff ──
  --
  -- UNITS ARE PART OF THE COLUMN NAME ON PURPOSE. `delivery_per_kwh_cents` is
  -- CENTS per kWh (4.65 means 4.65¢, not $4.65), matching
  -- electricity_plans.rate_per_kwh. `fixed_monthly_delivery_charge` is DOLLARS
  -- per month. The admin form, this schema and the pricing engine all agree,
  -- and nothing infers a unit.
  delivery_per_kwh_cents numeric,
  fixed_monthly_delivery_charge numeric,

  -- ── Effective dating ──
  --
  -- Utility tariffs are refiled on a schedule (twice a year in Texas), so a
  -- charge is only true for a window. The resolver picks the row whose window
  -- contains the comparison date; `effective_to` NULL means "current".
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,

  -- ── Provenance ──
  --
  -- Operational traceability for "where did this delivery charge come from?".
  -- A reference, never a copy of the source document.
  source_name text,
  source_url text,
  verified_at date,

  -- ── Service-territory resolution ──
  --
  -- Optional 3-digit ZIP prefixes this territory covers. Populated only where an
  -- admin can supply it from authoritative data. When it is empty the resolver
  -- falls back to state, and where a state has more than one territory it
  -- reports the territory as unresolved rather than guessing — a ZIP can span
  -- two utilities and picking one would fabricate the customer's delivery cost.
  service_zip_prefixes text[],

  -- Admin-only operational notes. Never exposed to the public engine: this
  -- table is not readable by the anon role at all (see RLS below).
  notes text,

  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- A tariff window has to be coherent.
  CONSTRAINT utility_territories_effective_window
    CHECK (effective_to IS NULL OR effective_to >= effective_from),

  -- Negative charges are not a tariff, they are a data-entry error. Zero is
  -- allowed on both: it is the "verified: no such charge" case.
  CONSTRAINT utility_territories_delivery_non_negative
    CHECK (delivery_per_kwh_cents IS NULL OR delivery_per_kwh_cents >= 0),
  CONSTRAINT utility_territories_fixed_non_negative
    CHECK (fixed_monthly_delivery_charge IS NULL OR fixed_monthly_delivery_charge >= 0)
);

COMMENT ON TABLE public.utility_territories IS
  'Utility/TDSP delivery tariffs, scoped to a service territory and effective-dated. NULL charge = unknown; 0 = verified no charge.';
COMMENT ON COLUMN public.utility_territories.delivery_per_kwh_cents IS
  'CENTS per kWh. NULL = unknown (blocks complete pricing). 0 = verified no per-kWh charge.';
COMMENT ON COLUMN public.utility_territories.fixed_monthly_delivery_charge IS
  'DOLLARS per month. NULL = unknown (blocks complete pricing). 0 = verified no fixed charge.';
COMMENT ON COLUMN public.utility_territories.billing_model IS
  'all_in = supplier bills delivery too (TX/ERCOT); supply_only = utility bills delivery separately.';

-- One territory identity per state, so the same utility cannot be entered twice
-- and silently produce two different delivery rates for one customer. Distinct
-- tariff WINDOWS for the same utility are still allowed — they differ on
-- effective_from.
CREATE UNIQUE INDEX IF NOT EXISTS utility_territories_identity_window_idx
  ON public.utility_territories (state, lower(name), effective_from);

-- The resolver's access path: active territories for a state, newest window
-- first.
CREATE INDEX IF NOT EXISTS utility_territories_state_active_idx
  ON public.utility_territories (state, is_active, effective_from DESC);

-- ── Plan association ──
--
-- Optional and deliberately NOT the primary resolution path.
--
-- In Texas the same plan is sold across every TDU and priced with whichever one
-- serves the customer's address, so pinning a plan to one territory would be
-- wrong for four customers out of five. Territory is therefore normally
-- resolved from the customer's service location at comparison time.
--
-- This column exists for the genuine exception: a plan that is only offered
-- inside one utility's footprint. When set it wins over location resolution.
ALTER TABLE public.electricity_plans
  ADD COLUMN IF NOT EXISTS utility_territory_id uuid
    REFERENCES public.utility_territories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS electricity_plans_utility_territory_idx
  ON public.electricity_plans (utility_territory_id)
  WHERE utility_territory_id IS NOT NULL;

COMMENT ON COLUMN public.electricity_plans.utility_territory_id IS
  'Optional territory pin for plans sold in only one utility footprint. Normally NULL: territory is resolved from the customer service location.';
COMMENT ON COLUMN public.electricity_plans.tdsp_charges IS
  'LEGACY per-kWh delivery override in cents. DEFAULT 0, so 0 means UNKNOWN, not free delivery. Superseded by utility_territories; kept as a read fallback.';
COMMENT ON COLUMN public.electricity_plans.monthly_base_charge IS
  'CANONICAL supplier base charge, DOLLARS per month. Admin writes this field. base_charge is a legacy read-only fallback.';

-- ── Keep updated_at honest ──

CREATE OR REPLACE FUNCTION public.touch_utility_territories_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS utility_territories_touch_updated_at ON public.utility_territories;
CREATE TRIGGER utility_territories_touch_updated_at
  BEFORE UPDATE ON public.utility_territories
  FOR EACH ROW EXECUTE FUNCTION public.touch_utility_territories_updated_at();

-- ── RLS ──
--
-- Admin-staff read, editor write, admin delete — the affiliate_links pattern
-- rather than the electricity_plans one.
--
-- This table is NOT publicly readable. The public never needs it: the
-- comparison API runs under the service role, resolves the territory and
-- returns only the resulting delivery figures inside the result DTO. Keeping
-- the table closed keeps admin notes and source references off the public
-- surface.

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
