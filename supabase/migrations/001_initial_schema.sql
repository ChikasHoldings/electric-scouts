-- ============================================================
-- ElectricScouts: Initial Database Schema Migration
-- Supabase / PostgreSQL
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES TABLE (extends Supabase Auth users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. ELECTRICITY PROVIDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.electricity_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  affiliate_url TEXT,
  supported_states TEXT[] DEFAULT '{}',
  rating NUMERIC(3,1) DEFAULT 4.8,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_recommended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_providers_active ON public.electricity_providers(is_active);
CREATE INDEX idx_providers_name ON public.electricity_providers(name);

-- ============================================================
-- 3. ELECTRICITY PLANS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.electricity_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_name TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  rate_per_kwh NUMERIC(8,2) NOT NULL DEFAULT 0,
  contract_length INTEGER NOT NULL DEFAULT 0,
  plan_type TEXT DEFAULT 'fixed' CHECK (plan_type IN ('fixed', 'variable', 'indexed', 'prepaid')),
  renewable_percentage INTEGER DEFAULT 0,
  monthly_base_charge NUMERIC(8,2) DEFAULT 0,
  early_termination_fee NUMERIC(8,2) DEFAULT 0,
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plans_provider ON public.electricity_plans(provider_name);
CREATE INDEX idx_plans_active ON public.electricity_plans(is_active);
CREATE INDEX idx_plans_rate ON public.electricity_plans(rate_per_kwh);

-- ============================================================
-- 4. ARTICLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  category TEXT DEFAULT 'Getting Started',
  excerpt TEXT,
  meta_description TEXT,
  featured_image TEXT,
  content TEXT,
  read_time TEXT DEFAULT '5 min',
  keywords TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  related_articles UUID[] DEFAULT '{}',
  author TEXT DEFAULT 'ElectricScouts Team',
  published BOOLEAN NOT NULL DEFAULT false,
  created_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_articles_published ON public.articles(published);
CREATE INDEX idx_articles_slug ON public.articles(slug);
CREATE INDEX idx_articles_category ON public.articles(category);
CREATE INDEX idx_articles_created ON public.articles(created_date DESC);

-- ============================================================
-- 5. CUSTOM BUSINESS QUOTES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.custom_business_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  zip_code TEXT NOT NULL,
  business_type TEXT,
  industry_type TEXT,
  monthly_usage TEXT,
  peak_demand TEXT,
  peak_demand_hours TEXT,
  number_of_locations TEXT DEFAULT '1',
  current_supplier TEXT,
  contract_end_date TEXT,
  current_rate TEXT,
  energy_goals TEXT[] DEFAULT '{}',
  bill_file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'quoted', 'accepted', 'declined')),
  admin_notes TEXT,
  created_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotes_email ON public.custom_business_quotes(email);
CREATE INDEX idx_quotes_status ON public.custom_business_quotes(status);
CREATE INDEX idx_quotes_created ON public.custom_business_quotes(created_date DESC);

-- ============================================================
-- 6. CHATBOT CONVERSATIONS TABLE (for chatbot history)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  zip_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chatbot_session ON public.chatbot_conversations(session_id);

-- ============================================================
-- 7. UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_providers
  BEFORE UPDATE ON public.electricity_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_plans
  BEFORE UPDATE ON public.electricity_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_quotes
  BEFORE UPDATE ON public.custom_business_quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_chatbot
  BEFORE UPDATE ON public.chatbot_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- For articles, use updated_date column name to match existing code
CREATE OR REPLACE FUNCTION public.update_article_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_date_articles
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.update_article_updated_date();

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electricity_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electricity_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_business_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---- ELECTRICITY PROVIDERS ----
-- Anyone can read active providers (public data)
CREATE POLICY "Anyone can view active providers"
  ON public.electricity_providers FOR SELECT
  USING (true);

-- Only admins can insert/update/delete providers
CREATE POLICY "Admins can insert providers"
  ON public.electricity_providers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update providers"
  ON public.electricity_providers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete providers"
  ON public.electricity_providers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---- ELECTRICITY PLANS ----
-- Anyone can read plans (public data)
CREATE POLICY "Anyone can view plans"
  ON public.electricity_plans FOR SELECT
  USING (true);

-- Only admins can manage plans
CREATE POLICY "Admins can insert plans"
  ON public.electricity_plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update plans"
  ON public.electricity_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete plans"
  ON public.electricity_plans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---- ARTICLES ----
-- Anyone can read published articles
CREATE POLICY "Anyone can view published articles"
  ON public.articles FOR SELECT
  USING (published = true);

-- Admins can view all articles (including drafts)
CREATE POLICY "Admins can view all articles"
  ON public.articles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can manage articles
CREATE POLICY "Admins can insert articles"
  ON public.articles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update articles"
  ON public.articles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete articles"
  ON public.articles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---- CUSTOM BUSINESS QUOTES ----
-- Authenticated users can create quotes
CREATE POLICY "Authenticated users can create quotes"
  ON public.custom_business_quotes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can view their own quotes
CREATE POLICY "Users can view own quotes"
  ON public.custom_business_quotes FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update quotes (change status, add notes)
CREATE POLICY "Admins can update quotes"
  ON public.custom_business_quotes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---- CHATBOT CONVERSATIONS ----
-- Users can manage their own conversations
CREATE POLICY "Users can insert conversations"
  ON public.chatbot_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own conversations"
  ON public.chatbot_conversations FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own conversations"
  ON public.chatbot_conversations FOR UPDATE
  USING (
    user_id = auth.uid()
    OR user_id IS NULL
  );

-- ============================================================
-- 9. STORAGE BUCKETS
-- ============================================================
-- Note: Storage buckets are created via Supabase Dashboard or API.
-- The following are the buckets needed:
--   - 'logos'       : Provider logo images (public)
--   - 'articles'    : Article featured images (public)
--   - 'bill-uploads': User-uploaded electricity bills (private)
--   - 'assets'      : General site assets like brand logos (public)

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
