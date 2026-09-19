-- ====================================================================
-- IDEAERA — Delete Profile & User Data RLS Policies
-- Run this in your Supabase SQL Editor to allow users to delete their own accounts
-- ====================================================================

-- 1. Allow authenticated users to delete their own profile
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- 2. Allow authenticated users to delete their own user_skills
DROP POLICY IF EXISTS "Users can delete their own user_skills" ON public.user_skills;
CREATE POLICY "Users can delete their own user_skills"
  ON public.user_skills FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Allow authenticated users to delete their own user_interests
DROP POLICY IF EXISTS "Users can delete their own user_interests" ON public.user_interests;
CREATE POLICY "Users can delete their own user_interests"
  ON public.user_interests FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Allow authenticated users to delete their own project memberships
DROP POLICY IF EXISTS "Users can leave project memberships" ON public.project_members;
CREATE POLICY "Users can leave project memberships"
  ON public.project_members FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Allow authenticated users to delete notifications sent to them
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);
