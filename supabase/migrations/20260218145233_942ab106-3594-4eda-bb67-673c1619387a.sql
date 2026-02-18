
-- ============================================
-- The Chameleon CRM — Full Schema
-- ============================================

-- 1. Profiles table (auto-created on signup via trigger)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  business_name TEXT,
  business_type TEXT CHECK (business_type IN ('service', 'project', 'sales')),
  locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'he', 'ar')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  default_view TEXT DEFAULT 'dashboard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company TEXT,
  notes TEXT,
  last_contact_date DATE,
  contact_frequency_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Pipelines table
CREATE TABLE public.pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default Pipeline',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Pipeline stages table
CREATE TABLE public.pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Deals table
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value NUMERIC(12,2),
  due_date DATE,
  event_date DATE,
  notes TEXT,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Interactions table
CREATE TABLE public.interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'whatsapp', 'meeting', 'note')),
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_contacts_user ON public.contacts(user_id);
CREATE INDEX idx_contacts_last_contact ON public.contacts(user_id, last_contact_date);
CREATE INDEX idx_pipelines_user ON public.pipelines(user_id);
CREATE INDEX idx_stages_pipeline ON public.pipeline_stages(pipeline_id, display_order);
CREATE INDEX idx_deals_user ON public.deals(user_id);
CREATE INDEX idx_deals_stage ON public.deals(stage_id);
CREATE INDEX idx_deals_due_date ON public.deals(user_id, due_date);
CREATE INDEX idx_interactions_contact ON public.interactions(contact_id);

-- ============================================
-- Helper functions (security definer)
-- ============================================

-- Check if user owns pipeline via stage
CREATE OR REPLACE FUNCTION public.is_stage_owner(stage_row_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pipeline_stages ps
    JOIN public.pipelines p ON p.id = ps.pipeline_id
    WHERE ps.id = stage_row_id AND p.user_id = auth.uid()
  );
$$;

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());

-- contacts
CREATE POLICY "Users can view own contacts" ON public.contacts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own contacts" ON public.contacts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own contacts" ON public.contacts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own contacts" ON public.contacts FOR DELETE USING (user_id = auth.uid());

-- pipelines
CREATE POLICY "Users can view own pipelines" ON public.pipelines FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own pipelines" ON public.pipelines FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own pipelines" ON public.pipelines FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own pipelines" ON public.pipelines FOR DELETE USING (user_id = auth.uid());

-- pipeline_stages (ownership via pipeline)
CREATE POLICY "Users can view own stages" ON public.pipeline_stages FOR SELECT USING (public.is_stage_owner(id));
CREATE POLICY "Users can insert own stages" ON public.pipeline_stages FOR INSERT WITH CHECK (
  (SELECT user_id FROM public.pipelines WHERE id = pipeline_id) = auth.uid()
);
CREATE POLICY "Users can update own stages" ON public.pipeline_stages FOR UPDATE USING (public.is_stage_owner(id));
CREATE POLICY "Users can delete own stages" ON public.pipeline_stages FOR DELETE USING (public.is_stage_owner(id));

-- deals
CREATE POLICY "Users can view own deals" ON public.deals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own deals" ON public.deals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own deals" ON public.deals FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own deals" ON public.deals FOR DELETE USING (user_id = auth.uid());

-- interactions
CREATE POLICY "Users can view own interactions" ON public.interactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own interactions" ON public.interactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own interactions" ON public.interactions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own interactions" ON public.interactions FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Storage: deal-photos bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('deal-photos', 'deal-photos', true);

-- Storage RLS: users upload to their own user_id folder
CREATE POLICY "Users can upload deal photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'deal-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view deal photos" ON storage.objects FOR SELECT USING (
  bucket_id = 'deal-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete deal photos" ON storage.objects FOR DELETE USING (
  bucket_id = 'deal-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);
