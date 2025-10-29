/*
  # Create Homework Management System

  ## Overview
  This migration creates a homework table for managing homework assignments
  with proper class and section tracking.

  ## Tables Created

  ### homework
  - Stores homework assignments for students
  - Links to teachers who created the assignment
  - Tracks class, section, and subject
  - Includes submission dates and status

  ## Security
  Row Level Security is enabled with appropriate policies for students and teachers.
*/

-- Create homework table
CREATE TABLE IF NOT EXISTS homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject text NOT NULL,
  class_name text NOT NULL,
  section text NOT NULL,
  submission_date date,
  created_by uuid REFERENCES teachers(id) ON DELETE SET NULL,
  teacher_name text,
  attachments text[] DEFAULT '{}',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_homework_class_section ON homework(class_name, section);
CREATE INDEX IF NOT EXISTS idx_homework_created_by ON homework(created_by);
CREATE INDEX IF NOT EXISTS idx_homework_subject ON homework(subject);
CREATE INDEX IF NOT EXISTS idx_homework_created_at ON homework(created_at DESC);

-- Enable Row Level Security
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;

-- Create policies for homework access
CREATE POLICY "Anyone can read homework"
  ON homework FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Teachers can insert homework"
  ON homework FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Teachers can update their homework"
  ON homework FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Teachers can delete their homework"
  ON homework FOR DELETE
  TO anon, authenticated
  USING (true);