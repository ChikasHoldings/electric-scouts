-- ═══════════════════════════════════════════════════════════
-- 020: The revenue ledger, and access to the routing tables
--
-- Three separate failures are fixed here, all of which made a configured
-- feature look wired while doing nothing:
--
--   1. `lead_buyers` and `lead_deliveries` were created with RLS ENABLED and
--      NO POLICIES. The admin screen reads and writes them with the browser's
--      anon/authenticated key, so every read returned zero rows and every save
--      failed. Both tables are still empty in production, which is the proof.
--      Deny-by-default is the right posture; what was missing is the grant.
--
--   2. Nothing anywhere recorded what a click or a delivered lead was WORTH.
--      `click_tracking.monetized` says a destination could pay, never that it
--      did, and no commission rate existed to multiply it by. "Total platform
--      earnings" could therefore only have been invented.
--
--   3. `lead_deliveries.status` allowed 'accepted' and 'rejected' but nothing
--      could record WHEN a buyer responded or WHY they declined, so a rejected
--      lead was indistinguishable from one still in flight.
--
-- The commission terms live on the affiliate link and the buyer row — admin
-- data, not code — so changing what a partner pays is an edit, not a deploy.
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- Part 1 — Access to the routing tables
-- ═══════════════════════════════════════════════════════════
--
-- Read for anyone in the admin panel; writes for admin/editor; deletes for
-- full admins only. This mirrors exactly how providers, plans and affiliate
-- links are already governed, so there is one access model to reason about.
--
-- The service role bypasses RLS entirely, which is how /api/go, the lead
-- endpoints and delivery continue to work regardless of what is granted here.

DROP POLICY IF EXISTS "Admin staff can read lead buyers" ON public.lead_buyers;
CREATE POLICY "Admin staff can read lead buyers"
  ON public.lead_buyers FOR SELECT
  USING (public.is_admin_staff());

DROP POLICY IF EXISTS "Admin editors can insert lead buyers" ON public.lead_buyers;
CREATE POLICY "Admin editors can insert lead buyers"
  ON public.lead_buyers FOR INSERT
  WITH CHECK (public.is_admin_editor());

DROP POLICY IF EXISTS "Admin editors can update lead buyers" ON public.lead_buyers;
CREATE POLICY "Admin editors can update lead buyers"
  ON public.lead_buyers FOR UPDATE
  USING (public.is_admin_editor());

DROP POLICY IF EXISTS "Only admins can delete lead buyers" ON public.lead_buyers;
CREATE POLICY "Only admins can delete lead buyers"
  ON public.lead_buyers FOR DELETE
  USING (public.is_admin());

-- Deliveries are read-only from the browser on purpose.
--
-- A delivery row is the record of a commercial obligation: it carries the
-- price agreed at the moment of sale and it is what revenue is attributed
-- from. Every write goes through the server, which sends the lead, claims the
-- delivery before sending so a retry cannot double-sell, and writes the
-- matching ledger entry in the same operation. A browser that could edit these
-- directly could rewrite a sale price after the fact.
DROP POLICY IF EXISTS "Admin staff can read lead deliveries" ON public.lead_deliveries;
CREATE POLICY "Admin staff can read lead deliveries"
  ON public.lead_deliveries FOR SELECT
  USING (public.is_admin_staff());

-- ═══════════════════════════════════════════════════════════
-- Part 2 — What a buyer response was
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.lead_deliveries
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS response_note TEXT;

COMMENT ON COLUMN public.lead_deliveries.responded_at IS
  'When the buyer accepted or rejected. NULL while a delivered lead is still awaiting a decision.';

-- ═══════════════════════════════════════════════════════════
-- Part 3 — Commission terms, as admin-managed configuration
-- ═══════════════════════════════════════════════════════════
--
-- What a referral is worth is a property of the commercial agreement, so it
-- belongs next to the link that agreement produced.
--
--   none          the destination earns nothing. This is the honest default,
--                 and it is what most links are today: a plain provider page.
--   per_click     a fixed amount per commission-capable click.
--   per_signup    a fixed amount per completed signup. NOT accrued from a
--                 click, because a click is not a signup — recorded when the
--                 network reports the conversion.
--   revenue_share a percentage of the customer's spend, likewise recorded from
--                 the network's own figures rather than guessed at.
--
-- Only `per_click` can be accrued automatically. Everything else waits for the
-- partner to confirm, which is the difference between a ledger and a forecast.
ALTER TABLE public.affiliate_links
  ADD COLUMN IF NOT EXISTS commission_model TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS network TEXT,
  ADD COLUMN IF NOT EXISTS commission_notes TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_links_commission_model_check'
  ) THEN
    ALTER TABLE public.affiliate_links
      ADD CONSTRAINT affiliate_links_commission_model_check
      CHECK (commission_model IN ('none', 'per_click', 'per_signup', 'revenue_share'));
  END IF;
END $$;

COMMENT ON COLUMN public.affiliate_links.commission_model IS
  'How this link earns. Only per_click accrues automatically; the rest are recorded when the network confirms a conversion.';
COMMENT ON COLUMN public.affiliate_links.commission_amount IS
  'Dollars for per_click and per_signup; percent of customer spend for revenue_share.';

-- ═══════════════════════════════════════════════════════════
-- Part 4 — The ledger
-- ═══════════════════════════════════════════════════════════
--
-- One row per thing that earned, or is expected to earn, money. Every figure
-- the admin earnings screen reports is a SUM over this table, so a number on
-- screen can always be traced to the click, lead or request that produced it.
--
-- Status is what keeps the reporting honest:
--
--   pending    accrued by us, not yet confirmed by the partner. Real activity,
--              but not money in the bank.
--   confirmed  the partner has agreed it is owed.
--   paid       it has been received.
--   reversed   it was clawed back, or the buyer rejected the lead.
--
-- The earnings screen never adds `pending` to `confirmed`. Presenting an
-- accrual as revenue is the specific lie this schema is shaped to prevent.
CREATE TABLE IF NOT EXISTS public.revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Where the money came from.
  source TEXT NOT NULL
    CHECK (source IN ('affiliate_click', 'affiliate_conversion', 'lead_sale', 'concierge')),

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'paid', 'reversed')),

  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- ─── What it is attributable to ──────────────────────────
  -- All nullable: an affiliate click has no buyer, a lead sale has no link.
  -- Deletes null the reference rather than removing the ledger row, because
  -- earnings history must survive a partner being removed from the catalog.
  provider_id UUID REFERENCES public.electricity_providers(id) ON DELETE SET NULL,
  affiliate_link_id UUID REFERENCES public.affiliate_links(id) ON DELETE SET NULL,
  click_id UUID REFERENCES public.click_tracking(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES public.lead_buyers(id) ON DELETE SET NULL,
  delivery_id UUID REFERENCES public.lead_deliveries(id) ON DELETE CASCADE,
  concierge_request_id UUID REFERENCES public.concierge_requests(id) ON DELETE SET NULL,

  -- Names captured at the time. A provider renamed in 2027 must not silently
  -- rewrite what a 2026 statement said.
  partner_name TEXT,
  description TEXT,

  -- The partner's own identifier for this transaction, so a line here can be
  -- reconciled against a network statement.
  external_reference TEXT,

  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,

  -- The idempotency key. One click, one lead delivery and one concierge
  -- request can each produce exactly one accrual, no matter how many times the
  -- writing code runs. Without this, a retried /api/go request or a re-run
  -- routing pass would inflate earnings, which is the failure mode nobody
  -- notices until the numbers are challenged.
  dedupe_key TEXT UNIQUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenue_events_occurred ON public.revenue_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_events_status ON public.revenue_events(status);
CREATE INDEX IF NOT EXISTS idx_revenue_events_source ON public.revenue_events(source);
CREATE INDEX IF NOT EXISTS idx_revenue_events_provider ON public.revenue_events(provider_id);
CREATE INDEX IF NOT EXISTS idx_revenue_events_buyer ON public.revenue_events(buyer_id);
CREATE INDEX IF NOT EXISTS idx_revenue_events_lead ON public.revenue_events(lead_id);

ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;

-- Read-only from the browser, for the same reason deliveries are: a ledger
-- anyone can edit from a devtools console is not a ledger. Confirming,
-- reversing and recording payouts all go through the admin API, which stamps
-- who did it and when.
DROP POLICY IF EXISTS "Admin staff can read revenue events" ON public.revenue_events;
CREATE POLICY "Admin staff can read revenue events"
  ON public.revenue_events FOR SELECT
  USING (public.is_admin_staff());

COMMENT ON TABLE public.revenue_events IS
  'Every earning event on the platform. The admin earnings report is a SUM over this table; pending accruals are never added to confirmed revenue.';
COMMENT ON COLUMN public.revenue_events.dedupe_key IS
  'Idempotency key. Guarantees one accrual per click, delivery or request however many times the writer runs.';

-- ─── Keep updated_at honest ────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_revenue_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_revenue_events_touch ON public.revenue_events;
CREATE TRIGGER trg_revenue_events_touch
  BEFORE UPDATE ON public.revenue_events
  FOR EACH ROW EXECUTE FUNCTION public.touch_revenue_event();
