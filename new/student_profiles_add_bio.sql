-- Optional migration: add bio field for profile page
ALTER TABLE IF EXISTS student_profiles
ADD COLUMN IF NOT EXISTS bio TEXT;