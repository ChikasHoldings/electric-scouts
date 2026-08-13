-- ═══════════════════════════════════════════════════════════
-- 023: Stop the schema from manufacturing a false zero
--
-- Every one of the 378 active plans has `tdsp_charges = 0`, and that single
-- fact disables the most valuable thing the site does.
--
-- The comparison engine treats a delivery charge of 0 as "not configured",
-- deliberately and correctly: nobody delivers electricity for free in any of
-- the twelve markets we serve, so a stored 0 is a missing value wearing a
-- number's clothes. With delivery unknown, `estimateMonthlyCost` returns
-- confidence PARTIAL, and PARTIAL cascades:
--
--   · `estimatedMonthlyCost` is withheld — no plan anywhere on the site can
--     show a modelled monthly bill, only a supply-only subtotal
--   · `compareToCurrentBill` refuses with `incomplete_pricing` — the customer's
--     own bill figure is collected by the questionnaire and can never produce a
--     savings comparison, which is the site's headline promise
--   · `matchScore` is capped at 79 by CONFIDENCE_CAPS, so "Excellent match"
--     (90+) and "Strong match" (80+) are unreachable for the entire catalog
--
-- Measured, not inferred: running the real `runComparison` over a snapshot of
-- this database across all 12 states, both audiences and three usage levels
-- produced 1,134 results, of which 0 were fully priced.
--
-- Where the zero came from: migration 004 added the column as
-- `NUMERIC(8,2) DEFAULT 0`. That backfilled every existing row and stamps every
-- future insert that omits the column. The application layer already had the
-- right idea — `validatePlan` maps a blank field to NULL, with the comment
-- "null means unknown; 0 would mean free delivery" — but the column default
-- overrode it for anything not written through that form.
--
-- This migration does not invent delivery rates. It makes "unknown" storable
-- and truthful, so the admin catalog screen can show which plans still need one
-- instead of displaying a configured 0¢ that is not a real price.
-- ═══════════════════════════════════════════════════════════

-- ─── Let "not configured" be representable ─────────────────
--
-- Only `tdsp_charges` is converted, because only `tdsp_charges` has the
-- property that 0 is impossible in reality. A base charge of 0, a usage credit
-- of 0 and an early termination fee of 0 are all ordinary plan terms and are
-- left exactly as they are.
ALTER TABLE public.electricity_plans
  ALTER COLUMN tdsp_charges DROP DEFAULT,
  ALTER COLUMN monthly_base_charge DROP DEFAULT,
  ALTER COLUMN base_charge DROP DEFAULT,
  ALTER COLUMN usage_credit DROP DEFAULT,
  ALTER COLUMN usage_credit_threshold DROP DEFAULT;

UPDATE public.electricity_plans
  SET tdsp_charges = NULL
  WHERE tdsp_charges = 0;

-- Nothing may re-introduce the sentinel. A row either carries a real delivery
-- rate or admits it has none; it can no longer claim delivery costs nothing.
ALTER TABLE public.electricity_plans
  DROP CONSTRAINT IF EXISTS electricity_plans_tdsp_positive;

ALTER TABLE public.electricity_plans
  ADD CONSTRAINT electricity_plans_tdsp_positive
  CHECK (tdsp_charges IS NULL OR tdsp_charges > 0);

COMMENT ON COLUMN public.electricity_plans.tdsp_charges IS
  'Utility delivery (TDSP) charge in cents per kWh. NULL means not yet researched: the plan then shows a supply-only subtotal and cannot produce a savings comparison. Never 0 — free delivery does not exist.';

-- ─── One authority for the fixed monthly charge ────────────
--
-- Two columns hold the same fact. The pricing engine reads
-- `monthly_base_charge ?? base_charge`, every public page reads
-- `monthly_base_charge`, and the admin plan form was editing `base_charge` —
-- the one nobody prefers. On the five live plans that carry a positive
-- `monthly_base_charge`, an admin correcting the base charge wrote to
-- `base_charge` and the site went on billing the old figure, with no error and
-- no visible sign the edit had been ignored.
--
-- `monthly_base_charge` becomes the authority (it is what the engine and every
-- page already prefer), and `base_charge` is backfilled from it so the legacy
-- column cannot disagree. The form now edits `monthly_base_charge`, and
-- `validatePlan` keeps `base_charge` mirrored on every save — the same
-- deliberate denormalization already used for `provider_name`.
UPDATE public.electricity_plans
  SET monthly_base_charge = base_charge
  WHERE (monthly_base_charge IS NULL OR monthly_base_charge = 0)
    AND base_charge IS NOT NULL
    AND base_charge > 0;

UPDATE public.electricity_plans
  SET base_charge = monthly_base_charge
  WHERE monthly_base_charge IS DISTINCT FROM base_charge;

COMMENT ON COLUMN public.electricity_plans.monthly_base_charge IS
  'Fixed monthly charge in dollars. The authority for this fact — the pricing engine and every public page read it. `base_charge` is a legacy mirror kept synchronized on save.';

COMMENT ON COLUMN public.electricity_plans.base_charge IS
  'Legacy mirror of monthly_base_charge, kept synchronized by validatePlan. Read monthly_base_charge instead.';
