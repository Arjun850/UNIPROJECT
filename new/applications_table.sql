-- applications_v2 table schema for managing student research applications
-- Run in Supabase SQL editor to enable real-time student applications.

CREATE TABLE IF NOT EXISTS applications_v2 (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT,
  student_email TEXT,
  student_year TEXT,
  student_degree TEXT,
  project_id UUID REFERENCES projects_v2(id) ON DELETE CASCADE,
  project_title TEXT,
  faculty_id UUID,
  pitch TEXT,
  status TEXT DEFAULT 'pending',
  cv_name TEXT,
  cv_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE applications_v2 ENABLE ROW LEVEL SECURITY;

-- Allow public read access to sync drawers and dashboards
DROP POLICY IF EXISTS "Anyone can select applications" ON applications_v2;
CREATE POLICY "Anyone can select applications"
  ON applications_v2 FOR SELECT
  USING (true);

-- Allow students to insert new applications
DROP POLICY IF EXISTS "Students can insert applications" ON applications_v2;
CREATE POLICY "Students can insert applications"
  ON applications_v2 FOR INSERT
  WITH CHECK (true);

-- Allow professors to approve, reject, or request interviews
DROP POLICY IF EXISTS "Professors can update applications" ON applications_v2;
CREATE POLICY "Professors can update applications"
  ON applications_v2 FOR UPDATE
  USING (true);
