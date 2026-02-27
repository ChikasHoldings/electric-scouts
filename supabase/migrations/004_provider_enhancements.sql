-- ============================================================
-- Migration 004: Provider & Plan Enhancements
-- Adds slug, offer_categories, phone, review_count, features
-- to electricity_providers; adds customer_type, state, and 
-- additional plan fields to electricity_plans.
-- ============================================================

-- ─── PROVIDERS: Add missing columns ─────────────────────────
ALTER TABLE public.electricity_providers
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS offer_categories TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS has_affiliate_program BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS affiliate_program_details TEXT;

CREATE INDEX IF NOT EXISTS idx_providers_slug ON public.electricity_providers(slug);

-- ─── PLANS: Add missing columns ─────────────────────────────
ALTER TABLE public.electricity_plans
  ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'residential' 
    CHECK (customer_type IN ('residential', 'business', 'renewable')),
  ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'TX',
  ADD COLUMN IF NOT EXISTS base_charge NUMERIC(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tdsp_charges NUMERIC(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_credit NUMERIC(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_credit_threshold INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plan_details_url TEXT,
  ADD COLUMN IF NOT EXISTS facts_label_url TEXT,
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS special_offer TEXT;

CREATE INDEX IF NOT EXISTS idx_plans_customer_type ON public.electricity_plans(customer_type);
CREATE INDEX IF NOT EXISTS idx_plans_state ON public.electricity_plans(state);

-- ─── CLICK TRACKING: Add resolved_url column ────────────────
ALTER TABLE public.click_tracking
  ADD COLUMN IF NOT EXISTS resolved_url TEXT,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
