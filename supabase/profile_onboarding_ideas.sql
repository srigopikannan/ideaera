-- ====================================================================
-- IDEAERA — Profile Extensions, Onboarding, Colleges & Idea Versioning
-- Run this in your Supabase SQL Editor to enable all native columns.
-- ====================================================================

-- 1. Extend Profiles with Onboarding, Education, Age & Location details
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_age BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 2. Lookup Colleges Table
CREATE TABLE IF NOT EXISTS public.colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_colleges_name ON public.colleges(name);

-- Seed top Tamil Nadu & National Engineering / Tech Colleges
INSERT INTO public.colleges (name, city, state) VALUES
  ('PSG College of Technology', 'Coimbatore', 'Tamil Nadu'),
  ('Coimbatore Institute of Technology (CIT)', 'Coimbatore', 'Tamil Nadu'),
  ('Kumaraguru College of Technology (KCT)', 'Coimbatore', 'Tamil Nadu'),
  ('Government College of Technology (GCT)', 'Coimbatore', 'Tamil Nadu'),
  ('Sri Krishna College of Engineering & Technology (SKCET)', 'Coimbatore', 'Tamil Nadu'),
  ('College of Engineering, Guindy (CEG Anna University)', 'Chennai', 'Tamil Nadu'),
  ('Madras Institute of Technology (MIT Anna University)', 'Chennai', 'Tamil Nadu'),
  ('Indian Institute of Technology Madras (IIT Madras)', 'Chennai', 'Tamil Nadu'),
  ('SSN College of Engineering', 'Chennai', 'Tamil Nadu'),
  ('National Institute of Technology Tiruchirappalli (NIT Trichy)', 'Tiruchirappalli', 'Tamil Nadu'),
  ('Thiagarajar College of Engineering (TCE)', 'Madurai', 'Tamil Nadu'),
  ('Vellore Institute of Technology (VIT)', 'Vellore', 'Tamil Nadu'),
  ('SRM Institute of Science and Technology', 'Kattankulathur', 'Tamil Nadu'),
  ('Amrita Vishwa Vidyapeetham', 'Coimbatore', 'Tamil Nadu'),
  ('BITS Pilani', 'Pilani', 'Rajasthan'),
  ('Indian Institute of Science (IISc)', 'Bengaluru', 'Karnataka'),
  ('IIT Bombay', 'Mumbai', 'Maharashtra'),
  ('IIT Delhi', 'New Delhi', 'Delhi')
ON CONFLICT (name) DO NOTHING;

-- 3. Extend Ideas with Versioning, Goals & Protection Information
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS version_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS goals TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS skills_needed TEXT[] DEFAULT '{}';
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS collaboration_info TEXT;

-- 4. Enable RLS and Policies for Colleges
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view colleges"
  ON public.colleges FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add custom colleges"
  ON public.colleges FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 5. Indexes for fast location and skill search
CREATE INDEX IF NOT EXISTS idx_profiles_college ON public.profiles(college);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_state ON public.profiles(state);
