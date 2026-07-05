-- SQL Schema script for UniProjects Blogs
-- Run this script inside your Supabase SQL Editor to initialize the project blogs table.

-- Create project_blogs table
CREATE TABLE IF NOT EXISTS project_blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects_v2(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    author_initials TEXT NOT NULL,
    author_color TEXT NOT NULL,
    author_email TEXT,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    likes_users JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add Index for high-performance retrieval
CREATE INDEX IF NOT EXISTS idx_project_blogs_project_id ON project_blogs(project_id);

-- Enable Row Level Security (RLS)
ALTER TABLE project_blogs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allowing authenticated users to select, insert, and update)
CREATE POLICY "Allow all actions for authenticated users on project_blogs"
ON project_blogs FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create project_blog_comments table
CREATE TABLE IF NOT EXISTS project_blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_id UUID REFERENCES project_blogs(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    author_initials TEXT NOT NULL,
    author_color TEXT NOT NULL,
    author_email TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE project_blog_comments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to perform all actions
CREATE POLICY "Allow all actions for authenticated users on project_blog_comments"
ON project_blog_comments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
