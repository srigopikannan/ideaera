-- ====================================================================
-- IDEAERA - Connections & Notifications Pipeline Fix
-- Run this in your Supabase SQL Editor to enforce RLS, deduplication,
-- and bidirectional notification field synchronization.
-- ====================================================================

-- 1. Deduplicate any existing connection rows (keeping the latest)
DELETE FROM public.connections c1
WHERE c1.id NOT IN (
  SELECT DISTINCT ON (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id)) id
  FROM public.connections
  ORDER BY LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id), updated_at DESC, created_at DESC
);

-- 2. Add connection_type column to public.connections
ALTER TABLE public.connections 
ADD COLUMN IF NOT EXISTS connection_type text DEFAULT 'private';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'connections_connection_type_check'
  ) THEN
    ALTER TABLE public.connections 
    ADD CONSTRAINT connections_connection_type_check 
    CHECK (connection_type IN ('public', 'private'));
  END IF;
END $$;

-- 3. Add unique pair index on connections to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_connections_unique_pair 
ON public.connections (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id));

-- 4. Standardize public.notifications columns
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS connection_id uuid REFERENCES public.connections(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS read boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS related_id text;

-- 5. Backfill existing notification records
UPDATE public.notifications
SET 
  recipient_id = COALESCE(recipient_id, user_id),
  user_id = COALESCE(user_id, recipient_id),
  read = COALESCE(read, is_read, false),
  is_read = COALESCE(is_read, read, false),
  connection_id = COALESCE(connection_id, entity_id),
  entity_id = COALESCE(entity_id, connection_id),
  related_id = COALESCE(related_id, entity_id::text)
WHERE recipient_id IS NULL OR user_id IS NULL OR read IS NULL OR is_read IS NULL;

-- 6. Trigger to synchronize recipient_id <-> user_id, read <-> is_read, connection_id <-> entity_id
CREATE OR REPLACE FUNCTION public.handle_notification_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recipient_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.recipient_id := NEW.user_id;
  END IF;
  IF NEW.user_id IS NULL AND NEW.recipient_id IS NOT NULL THEN
    NEW.user_id := NEW.recipient_id;
  END IF;

  IF NEW.read IS NULL AND NEW.is_read IS NOT NULL THEN
    NEW.read := NEW.is_read;
  END IF;
  IF NEW.is_read IS NULL AND NEW.read IS NOT NULL THEN
    NEW.is_read := NEW.read;
  END IF;
  IF NEW.read IS NULL AND NEW.is_read IS NULL THEN
    NEW.read := false;
    NEW.is_read := false;
  END IF;

  IF NEW.connection_id IS NULL AND NEW.entity_id IS NOT NULL THEN
    NEW.connection_id := NEW.entity_id;
  END IF;
  IF NEW.entity_id IS NULL AND NEW.connection_id IS NOT NULL THEN
    NEW.entity_id := NEW.connection_id;
  END IF;

  IF NEW.related_id IS NULL AND NEW.connection_id IS NOT NULL THEN
    NEW.related_id := NEW.connection_id::text;
  END IF;

  IF NEW.title IS NULL THEN
    IF NEW.type = 'connection_request' THEN
      NEW.title := 'Connection Request';
    ELSIF NEW.type = 'connection_accepted' THEN
      NEW.title := 'Connection Accepted';
    ELSIF NEW.type = 'message' THEN
      NEW.title := 'New Message';
    ELSIF NEW.type = 'idea_like' THEN
      NEW.title := 'Concept Endorsement';
    ELSIF NEW.type = 'idea_comment' THEN
      NEW.title := 'New Critique Note';
    ELSE
      NEW.title := 'System Signal';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notifications_sync ON public.notifications;
CREATE TRIGGER trg_notifications_sync
BEFORE INSERT OR UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.handle_notification_sync();

-- 7. Prevent duplicate notifications for connection events
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique_conn_event 
ON public.notifications (recipient_id, actor_id, connection_id, type) 
WHERE connection_id IS NOT NULL;

-- 8. Row Level Security & Policies
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Connections policies
DROP POLICY IF EXISTS "Users can view their connections" ON public.connections;
CREATE POLICY "Users can view their connections" ON public.connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can create connection requests" ON public.connections;
CREATE POLICY "Users can create connection requests" ON public.connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can update connection status" ON public.connections;
CREATE POLICY "Users can update connection status" ON public.connections
  FOR UPDATE USING (auth.uid() = receiver_id OR auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can delete connections" ON public.connections;
CREATE POLICY "Users can delete connections" ON public.connections
  FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = recipient_id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = actor_id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = recipient_id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = recipient_id OR auth.uid() = user_id);

-- 9. Enable Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
