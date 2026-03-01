-- Migration 007: Update is_admin() to support role-based access control
-- Adds is_admin_staff() for any admin panel user, keeps is_admin() for full admin only

-- Create is_admin_staff() function that allows admin, editor, and viewer roles
CREATE OR REPLACE FUNCTION public.is_admin_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'editor', 'viewer')
  );
$$;

-- Create is_admin_editor() function that allows admin and editor roles (can write)
CREATE OR REPLACE FUNCTION public.is_admin_editor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'editor')
  );
$$;

-- Update RLS policies for providers: editors can read/write, viewers can only read
-- SELECT: allow all admin staff
DROP POLICY IF EXISTS "Anyone can read providers" ON public.electricity_providers;
CREATE POLICY "Anyone can read providers"
  ON public.electricity_providers FOR SELECT
  USING (true);

-- INSERT: admin and editor only
DROP POLICY IF EXISTS "Admins can insert providers" ON public.electricity_providers;
CREATE POLICY "Admin staff can insert providers"
  ON public.electricity_providers FOR INSERT
  WITH CHECK (public.is_admin_editor());

-- UPDATE: admin and editor only
DROP POLICY IF EXISTS "Admins can update providers" ON public.electricity_providers;
CREATE POLICY "Admin staff can update providers"
  ON public.electricity_providers FOR UPDATE
  USING (public.is_admin_editor());

-- DELETE: admin only
DROP POLICY IF EXISTS "Admins can delete providers" ON public.electricity_providers;
CREATE POLICY "Only admins can delete providers"
  ON public.electricity_providers FOR DELETE
  USING (public.is_admin());

-- Update RLS policies for plans: editors can read/write, viewers can only read
DROP POLICY IF EXISTS "Anyone can read plans" ON public.electricity_plans;
CREATE POLICY "Anyone can read plans"
  ON public.electricity_plans FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert plans" ON public.electricity_plans;
CREATE POLICY "Admin staff can insert plans"
  ON public.electricity_plans FOR INSERT
  WITH CHECK (public.is_admin_editor());

DROP POLICY IF EXISTS "Admins can update plans" ON public.electricity_plans;
CREATE POLICY "Admin staff can update plans"
  ON public.electricity_plans FOR UPDATE
  USING (public.is_admin_editor());

DROP POLICY IF EXISTS "Admins can delete plans" ON public.electricity_plans;
CREATE POLICY "Only admins can delete plans"
  ON public.electricity_plans FOR DELETE
  USING (public.is_admin());

-- Update RLS policies for articles: editors can read/write, viewers can only read
DROP POLICY IF EXISTS "Anyone can read articles" ON public.articles;
CREATE POLICY "Anyone can read articles"
  ON public.articles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert articles" ON public.articles;
CREATE POLICY "Admin staff can insert articles"
  ON public.articles FOR INSERT
  WITH CHECK (public.is_admin_editor());

DROP POLICY IF EXISTS "Admins can update articles" ON public.articles;
CREATE POLICY "Admin staff can update articles"
  ON public.articles FOR UPDATE
  USING (public.is_admin_editor());

DROP POLICY IF EXISTS "Admins can delete articles" ON public.articles;
CREATE POLICY "Only admins can delete articles"
  ON public.articles FOR DELETE
  USING (public.is_admin());

-- Update RLS policies for affiliate_links: editors can read/write, viewers can only read
DROP POLICY IF EXISTS "Admins can read all affiliate links" ON public.affiliate_links;
CREATE POLICY "Admin staff can read affiliate links"
  ON public.affiliate_links FOR SELECT
  USING (public.is_admin_staff());

DROP POLICY IF EXISTS "Admins can insert affiliate links" ON public.affiliate_links;
CREATE POLICY "Admin staff can insert affiliate links"
  ON public.affiliate_links FOR INSERT
  WITH CHECK (public.is_admin_editor());

DROP POLICY IF EXISTS "Admins can update affiliate links" ON public.affiliate_links;
CREATE POLICY "Admin staff can update affiliate links"
  ON public.affiliate_links FOR UPDATE
  USING (public.is_admin_editor());

DROP POLICY IF EXISTS "Admins can delete affiliate links" ON public.affiliate_links;
CREATE POLICY "Only admins can delete affiliate links"
  ON public.affiliate_links FOR DELETE
  USING (public.is_admin());

-- Update RLS policies for concierge_requests: editors can update, viewers can read
DROP POLICY IF EXISTS "Admins can manage concierge requests" ON public.concierge_requests;
CREATE POLICY "Admin staff can read concierge requests"
  ON public.concierge_requests FOR SELECT
  USING (true);

CREATE POLICY "Admin staff can update concierge requests"
  ON public.concierge_requests FOR UPDATE
  USING (public.is_admin_editor());

CREATE POLICY "Only admins can delete concierge requests"
  ON public.concierge_requests FOR DELETE
  USING (public.is_admin());

-- Update profiles RLS: admins can update any profile (for user management)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile or admin can update any"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- Allow admin staff to read all profiles (for user management page)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile or admin staff can read all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin_staff());

-- Update click_tracking read policy
DROP POLICY IF EXISTS "Admins can read click tracking" ON public.click_tracking;
CREATE POLICY "Admin staff can read click tracking"
  ON public.click_tracking FOR SELECT
  USING (public.is_admin_staff());

-- Update leads policies
DROP POLICY IF EXISTS "Admin full access to leads" ON public.leads;
CREATE POLICY "Admin staff can read leads"
  ON public.leads FOR SELECT
  USING (public.is_admin_staff());
CREATE POLICY "Admin staff can update leads"
  ON public.leads FOR UPDATE
  USING (public.is_admin_editor());
CREATE POLICY "Admin can delete leads"
  ON public.leads FOR DELETE
  USING (public.is_admin());

-- Update custom_business_quotes policies
DROP POLICY IF EXISTS "Admin full access to custom_business_quotes" ON public.custom_business_quotes;
CREATE POLICY "Admin staff can read quotes"
  ON public.custom_business_quotes FOR SELECT
  USING (public.is_admin_staff());
CREATE POLICY "Admin staff can update quotes"
  ON public.custom_business_quotes FOR UPDATE
  USING (public.is_admin_editor());
CREATE POLICY "Admin can delete quotes"
  ON public.custom_business_quotes FOR DELETE
  USING (public.is_admin());
