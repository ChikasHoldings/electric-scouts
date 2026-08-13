-- ═══════════════════════════════════════════════════════════
-- 022: Close a PII leak, and let the public actually use the
--      commercial quote form
--
-- Two policies on the public-facing forms are wrong in opposite directions,
-- and both were verified against the live database before this was written.
--
--   CONCIERGE IS WORLD-READABLE. `concierge_requests` carries a customer's
--   full name, email, phone, move-in date and the address they are moving to.
--   Its SELECT policy is USING (true) granted to `public`, so anyone holding
--   the anon key — which ships in every page's JavaScript bundle — can read
--   every row. Proven by inserting a row and reading it back as `anon`: name,
--   email and street address all returned. The table is empty today, so this
--   is a breach that has not happened yet rather than one that has.
--
--   COMMERCIAL QUOTES CANNOT BE SUBMITTED. `custom_business_quotes` has
--   INSERT WITH CHECK (auth.uid() IS NOT NULL). There is no public sign-up on
--   this site, so no business visitor ever has a session, so every commercial
--   quote request is rejected by the database. The table's zero rows are the
--   evidence.
--
-- The intent behind the concierge SELECT policy was presumably "let someone
-- see the request they just submitted". A blanket USING (true) does not
-- express that — it grants every row to everyone. The submitting browser
-- already holds the response from its own INSERT, so nothing needs a read
-- policy for that flow to work, and the policy is removed rather than
-- narrowed to a condition anon cannot satisfy anyway.
-- ═══════════════════════════════════════════════════════════

-- ─── Concierge: staff only ─────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read back their submission" ON public.concierge_requests;

-- The remaining staff read policy was also USING (true) rather than a role
-- check — correct by accident, since only staff should reach it, but it would
-- have kept the table readable if the policy above were the only one removed.
DROP POLICY IF EXISTS "Admin staff can read concierge requests" ON public.concierge_requests;
CREATE POLICY "Admin staff can read concierge requests"
  ON public.concierge_requests FOR SELECT
  USING (public.is_admin_staff());

-- Submitting stays open: this is a public form, and the INSERT policy grants
-- no read back.
DROP POLICY IF EXISTS "Anyone can submit concierge requests" ON public.concierge_requests;
CREATE POLICY "Anyone can submit concierge requests"
  ON public.concierge_requests FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE public.concierge_requests IS
  'Home-concierge requests. Contains PII (name, email, phone, destination address): readable by admin staff only, writable by anyone, which is what a public form needs.';

-- ─── Commercial quotes: a public form the public can use ───
DROP POLICY IF EXISTS "Authenticated users can create quotes" ON public.custom_business_quotes;
CREATE POLICY "Anyone can submit a business quote request"
  ON public.custom_business_quotes FOR INSERT
  WITH CHECK (true);

-- "Users can view own quotes" compares the row's email to the caller's
-- auth.users email. With no public sign-up nobody is ever authenticated here,
-- so it grants nothing and only widens the surface. Staff read stays.
DROP POLICY IF EXISTS "Users can view own quotes" ON public.custom_business_quotes;

-- Two overlapping admin policies did the same job with different predicates;
-- the inline profiles subquery is replaced by the same helper every other
-- table uses, so there is one definition of "admin" to reason about.
DROP POLICY IF EXISTS "Admins can update quotes" ON public.custom_business_quotes;
DROP POLICY IF EXISTS "Admins can manage quotes" ON public.custom_business_quotes;

COMMENT ON TABLE public.custom_business_quotes IS
  'Commercial quote requests from the public business form. Anyone may submit; only admin staff may read.';
