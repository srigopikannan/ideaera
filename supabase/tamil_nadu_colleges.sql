-- ====================================================================
-- IDEAERA — Normalized Colleges & Suggestions Schema
-- ====================================================================

-- 1. Create Normalized Colleges Table
CREATE TABLE IF NOT EXISTS public.colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  city TEXT,
  district TEXT,
  state TEXT DEFAULT 'Tamil Nadu' NOT NULL,
  state_id TEXT DEFAULT 'IN-TN' NOT NULL,
  country TEXT DEFAULT 'India' NOT NULL,
  country_id TEXT DEFAULT 'IN' NOT NULL,
  university TEXT,
  institution_type TEXT,
  is_verified BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_colleges_name UNIQUE(name)
);

-- Indexes for lightning fast partial / autocomplete searches
CREATE INDEX IF NOT EXISTS idx_colleges_normalized_name ON public.colleges(normalized_name);
CREATE INDEX IF NOT EXISTS idx_colleges_name ON public.colleges(name);
CREATE INDEX IF NOT EXISTS idx_colleges_state_id ON public.colleges(state_id);
CREATE INDEX IF NOT EXISTS idx_colleges_city ON public.colleges(city);
CREATE INDEX IF NOT EXISTS idx_colleges_district ON public.colleges(district);
CREATE INDEX IF NOT EXISTS idx_colleges_institution_type ON public.colleges(institution_type);

-- 2. Add columns to Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college TEXT;

-- 3. Create College Suggestions Table for User Feedback / Pending Review
CREATE TABLE IF NOT EXISTS public.college_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  city TEXT,
  district TEXT,
  state TEXT DEFAULT 'Tamil Nadu',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_college_suggestions_status ON public.college_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_college_suggestions_user_id ON public.college_suggestions(user_id);

-- 4. Configure RLS Policies
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_suggestions ENABLE ROW LEVEL SECURITY;

-- Colleges: Read-only for all public and authenticated users
DROP POLICY IF EXISTS "Public and authenticated users can view colleges" ON public.colleges;
CREATE POLICY "Public and authenticated users can view colleges"
  ON public.colleges FOR SELECT
  USING (true);

-- No public INSERT on official colleges
DROP POLICY IF EXISTS "Authenticated users can add colleges" ON public.colleges;

-- Suggestions: Authenticated users can insert their own suggestion
DROP POLICY IF EXISTS "Authenticated users can submit college suggestions" ON public.college_suggestions;
CREATE POLICY "Authenticated users can submit college suggestions"
  ON public.college_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own college suggestions" ON public.college_suggestions;
CREATE POLICY "Users can view their own college suggestions"
  ON public.college_suggestions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
