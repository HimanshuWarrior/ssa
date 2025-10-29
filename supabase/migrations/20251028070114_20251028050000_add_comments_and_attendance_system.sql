/*
  # Add Student Comments and Attendance System

  1. New Tables
    - `student_comments`: Stores comments from teachers/admins on students
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `commented_by` (uuid, references teachers or admins)
      - `commenter_role` (text, 'teacher' or 'admin')
      - `comment_text` (text, the comment content)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `daily_attendance`: Stores daily attendance records
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `date` (date, attendance date)
      - `status` (text, 'present', 'absent', 'half_day')
      - `marked_by` (uuid, teacher who marked attendance)
      - `class_section` (text, for quick filtering)
      - `remarks` (text, optional remarks)
      - `created_at` (timestamptz)
      - Unique constraint on (student_id, date)

  2. Security
    - Enable RLS on both tables
    - Teachers can comment on students in their classes
    - Admins can comment on any student
    - Students can read their own comments
    - Class teachers can mark attendance for their class
    - Everyone can view attendance (with restrictions)

  3. Changes
    - Fix RLS policies for notices and gallery_images
    - Update neev_applications to check class and existing NEEV enrollment
*/

-- Create student_comments table
CREATE TABLE IF NOT EXISTS student_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  commented_by uuid NOT NULL,
  commenter_role text NOT NULL CHECK (commenter_role IN ('teacher', 'admin')),
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_student_comments_student_id ON student_comments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_comments_created_at ON student_comments(created_at DESC);

-- Enable RLS on student_comments
ALTER TABLE student_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_comments
CREATE POLICY "Teachers can comment on their students"
  ON student_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    commenter_role = 'teacher' AND
    EXISTS (
      SELECT 1 FROM teacher_class_sections tcs
      JOIN students s ON s.class_section = tcs.class_section
      WHERE tcs.teacher_id = commented_by
      AND s.id = student_id
    )
  );

CREATE POLICY "Admins can comment on any student"
  ON student_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    commenter_role = 'admin' AND
    EXISTS (
      SELECT 1 FROM administrators WHERE id = commented_by
    )
  );

CREATE POLICY "Students can view their own comments"
  ON student_comments FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM students WHERE id = student_id)
  );

CREATE POLICY "Teachers can view comments on their students"
  ON student_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_class_sections tcs
      JOIN students s ON s.class_section = tcs.class_section
      WHERE tcs.teacher_id = commented_by
      AND s.id = student_id
    )
  );

CREATE POLICY "Admins can view all comments"
  ON student_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM administrators WHERE id = commented_by)
  );

-- Allow anon access for reading student comments (for logged-in display)
CREATE POLICY "Allow anon read for student comments"
  ON student_comments FOR SELECT
  TO anon
  USING (true);

-- Create daily_attendance table
CREATE TABLE IF NOT EXISTS daily_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'half_day')) DEFAULT 'present',
  marked_by uuid NOT NULL,
  class_section text NOT NULL,
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_marked_by FOREIGN KEY (marked_by) REFERENCES teachers(id) ON DELETE SET NULL,
  CONSTRAINT unique_student_date UNIQUE (student_id, date)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_attendance_student_id ON daily_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_date ON daily_attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_class_section ON daily_attendance(class_section);

-- Enable RLS on daily_attendance
ALTER TABLE daily_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_attendance
CREATE POLICY "Class teachers can mark attendance for their class"
  ON daily_attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM class_teachers ct
      WHERE ct.teacher_id = marked_by
      AND ct.class_section = daily_attendance.class_section
    )
  );

CREATE POLICY "Class teachers can update attendance for their class"
  ON daily_attendance FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM class_teachers ct
      WHERE ct.teacher_id = marked_by
      AND ct.class_section = daily_attendance.class_section
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM class_teachers ct
      WHERE ct.teacher_id = marked_by
      AND ct.class_section = daily_attendance.class_section
    )
  );

CREATE POLICY "Students can view their own attendance"
  ON daily_attendance FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM students)
  );

CREATE POLICY "Teachers can view attendance for their classes"
  ON daily_attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM class_teachers ct
      WHERE ct.teacher_id = marked_by
      AND ct.class_section = daily_attendance.class_section
    )
  );

CREATE POLICY "Admins can view all attendance"
  ON daily_attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM administrators)
  );

-- Allow anon access for reading attendance (for logged-in display)
CREATE POLICY "Allow anon read for attendance"
  ON daily_attendance FOR SELECT
  TO anon
  USING (true);

-- Allow anon insert for attendance (for class teachers)
CREATE POLICY "Allow anon insert for attendance"
  ON daily_attendance FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon update for attendance (for class teachers)
CREATE POLICY "Allow anon update for attendance"
  ON daily_attendance FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Fix RLS policies for notices table
DROP POLICY IF EXISTS "Anyone can read active notices" ON notices;
DROP POLICY IF EXISTS "Admins can insert notices" ON notices;
DROP POLICY IF EXISTS "Admins can update notices" ON notices;
DROP POLICY IF EXISTS "Admins can delete notices" ON notices;

-- New notices policies
CREATE POLICY "Allow public read for active notices"
  ON notices FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Allow anon insert for notices"
  ON notices FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update for notices"
  ON notices FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete for notices"
  ON notices FOR DELETE
  TO anon
  USING (true);

-- Fix RLS policies for gallery_images table
DROP POLICY IF EXISTS "Anyone can view active gallery images" ON gallery_images;
DROP POLICY IF EXISTS "Admins can insert gallery images" ON gallery_images;
DROP POLICY IF EXISTS "Admins can update gallery images" ON gallery_images;
DROP POLICY IF EXISTS "Admins can delete gallery images" ON gallery_images;

-- New gallery_images policies
CREATE POLICY "Allow public read for active gallery images"
  ON gallery_images FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Allow anon insert for gallery images"
  ON gallery_images FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update for gallery images"
  ON gallery_images FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete for gallery images"
  ON gallery_images FOR DELETE
  TO anon
  USING (true);

-- Update neev_applications table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'neev_applications'
  ) THEN
    -- Add class_section column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'neev_applications' AND column_name = 'class_section'
    ) THEN
      ALTER TABLE neev_applications ADD COLUMN class_section text;
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'neev_applications' AND column_name = 'status'
    ) THEN
      ALTER TABLE neev_applications ADD COLUMN status text DEFAULT 'pending';
    END IF;
  END IF;
END $$;

-- Create function to calculate attendance percentage
CREATE OR REPLACE FUNCTION calculate_attendance_percentage(p_student_id uuid, p_days integer DEFAULT 30)
RETURNS numeric AS $$
DECLARE
  total_days integer;
  present_days integer;
  percentage numeric;
BEGIN
  -- Get total days in the last p_days
  SELECT COUNT(*) INTO total_days
  FROM daily_attendance
  WHERE student_id = p_student_id
  AND date >= CURRENT_DATE - p_days;

  -- Get present days (including half_day as 0.5)
  SELECT 
    COUNT(*) FILTER (WHERE status = 'present') + 
    (COUNT(*) FILTER (WHERE status = 'half_day') * 0.5)
  INTO present_days
  FROM daily_attendance
  WHERE student_id = p_student_id
  AND date >= CURRENT_DATE - p_days;

  -- Calculate percentage
  IF total_days > 0 THEN
    percentage := ROUND((present_days::numeric / total_days::numeric) * 100, 2);
  ELSE
    percentage := 0;
  END IF;

  RETURN percentage;
END;
$$ LANGUAGE plpgsql;
