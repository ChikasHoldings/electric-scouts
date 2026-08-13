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
--
-- Every existing SELECT policy is dropped by enumeration rather than by name.
--
-- Naming them individually is how this fix fails silently: DROP POLICY IF
-- EXISTS on a name that does not match is a successful no-op, so a database
-- whose policy is called something slightly different keeps the world-readable
-- grant while the migration reports success. Two permissive SELECT policies
-- existed here and both had to go — a single leftover re-opens the table,
-- because RLS ORs permissive policies together.
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'concierge_requests' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.concierge_requests', pol.policyname);
  END LOOP;
END $$;

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
--
-- Same enumeration for the same reason. The INSERT policy required
-- auth.uid() IS NOT NULL and this site has no public sign-up, so every
-- anonymous submission was refused by the database; a FOR ALL policy also
-- covered INSERT and had to be removed for the new grant to take effect.
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'custom_business_quotes'
      AND cmd IN ('INSERT', 'SELECT', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.custom_business_quotes', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Anyone can submit a business quote request"
  ON public.custom_business_quotes FOR INSERT
  WITH CHECK (true);

-- Staff read, restored after the sweep above. "Users can view own quotes"
-- compared the row's email to the caller's auth.users email; with nobody ever
-- authenticated it granted nothing and only widened the surface.
CREATE POLICY "Admin staff can read quotes"
  ON public.custom_business_quotes FOR SELECT
  USING (public.is_admin_staff());

COMMENT ON TABLE public.custom_business_quotes IS
  'Commercial quote requests from the public business form. Anyone may submit; only admin staff may read.';
