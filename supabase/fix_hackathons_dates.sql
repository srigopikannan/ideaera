-- ====================================================================
-- IDEAERA — Hackathons Date Integrity & Nullability Fix
-- Run this in your Supabase SQL Editor to allow authentic TBD dates
-- ====================================================================

-- 1. Allow event dates to be NULL when event schedule has not been announced yet
ALTER TABLE public.hackathons ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE public.hackathons ALTER COLUMN end_date DROP NOT NULL;
ALTER TABLE public.hackathons ALTER COLUMN registration_deadline DROP NOT NULL;

-- 2. Convert any temporary sentinel dates (1970-01-01 epoch) to true NULL
UPDATE public.hackathons
SET start_date = NULL, end_date = NULL
WHERE start_date <= '1970-01-02 00:00:00+00';

-- 3. Ensure indexing for high performance on date filtering and sorting
CREATE INDEX IF NOT EXISTS idx_hackathons_start_date ON public.hackathons (start_date);
CREATE INDEX IF NOT EXISTS idx_hackathons_end_date ON public.hackathons (end_date);
CREATE INDEX IF NOT EXISTS idx_hackathons_reg_deadline ON public.hackathons (registration_deadline);
