-- Run this migration in the Supabase SQL editor to add the roll_number column to the students and student_profiles tables.

ALTER TABLE students ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS roll_number TEXT;
