-- notifications_v2 table schema for real-time student updates when professor approves or rejects applications
-- Run in Supabase SQL editor to enable real-time student notifications.

CREATE TABLE IF NOT EXISTS notifications_v2 (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE notifications_v2 ENABLE ROW LEVEL SECURITY;

-- Allow students to select their own notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications_v2;
CREATE POLICY "Users can read own notifications"
  ON notifications_v2 FOR SELECT
  USING (auth.uid() = user_id);

-- Allow professors or system triggers to insert notifications for students
DROP POLICY IF EXISTS "Anyone can insert notifications" ON notifications_v2;
CREATE POLICY "Anyone can insert notifications"
  ON notifications_v2 FOR INSERT
  WITH CHECK (true);

-- Allow students to mark their own notifications as read
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications_v2;
CREATE POLICY "Users can update own notifications"
  ON notifications_v2 FOR UPDATE
  USING (auth.uid() = user_id);
