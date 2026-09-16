-- ==========================================================
-- Migration: Add Idea Likes & Comments Tables
-- Run this in your Supabase SQL Editor if you want native
-- relational tables for Idea endorsements and critiques.
-- ==========================================================

-- 1. Idea Likes Table
CREATE TABLE IF NOT EXISTS public.idea_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(idea_id, user_id)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_idea_likes_idea ON public.idea_likes(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_likes_user ON public.idea_likes(user_id);

-- Enable RLS
ALTER TABLE public.idea_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view idea likes"
  ON public.idea_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create likes"
  ON public.idea_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes"
  ON public.idea_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Idea Comments Table
CREATE TABLE IF NOT EXISTS public.idea_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_idea_comments_idea ON public.idea_comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_comments_user ON public.idea_comments(user_id);

-- Enable RLS
ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view idea comments"
  ON public.idea_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can post comments"
  ON public.idea_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.idea_comments FOR DELETE
  USING (auth.uid() = user_id);
