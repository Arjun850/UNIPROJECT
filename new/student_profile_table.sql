-- Student profile table for fields shown on student/applications.html
-- Run in Supabase SQL editor. This creates schema only; no rows are inserted.

CREATE TABLE IF NOT EXISTS student_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  dept TEXT,
  program TEXT,
  year TEXT,
  profile_image TEXT,
  skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can read own profile" ON student_profiles;
CREATE POLICY "Students can read own profile"
  ON student_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can insert own profile" ON student_profiles;
CREATE POLICY "Students can insert own profile"
  ON student_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can update own profile" ON student_profiles;
CREATE POLICY "Students can update own profile"
  ON student_profiles FOR UPDATE
  USING (auth.uid() = user_id);
