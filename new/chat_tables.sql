-- SQL Schema script for UniProjects Chat Workspace
-- Run this script inside your Supabase SQL Editor to initialize the chat system tables.

-- 1. Create project_updates table
CREATE TABLE IF NOT EXISTS project_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects_v2(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    author_initials TEXT NOT NULL,
    author_color TEXT NOT NULL,
    author_email TEXT,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    likes_users JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create project_comments table
CREATE TABLE IF NOT EXISTS project_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    update_id UUID REFERENCES project_updates(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    author_initials TEXT NOT NULL,
    author_color TEXT NOT NULL,
    author_email TEXT,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Add Indexes for high-performance retrieval
CREATE INDEX IF NOT EXISTS idx_project_updates_project_id ON project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_update_id ON project_comments(update_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Allowing authenticated users to select, insert, and update)
CREATE POLICY "Allow all actions for authenticated users on project_updates"
ON project_updates FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all actions for authenticated users on project_comments"
ON project_comments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
