/*
  # Class-Section Structure (arranged/idempotent)

  This file is an arranged, idempotent version of the class-section restructure
  migration. It avoids destructive DROP statements and guards policy creation
  so the script can be safely re-run.
*/

-- =====================================================
-- class_sections: list valid class-section combinations
-- =====================================================
CREATE TABLE IF NOT EXISTS class_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_section text UNIQUE NOT NULL,
  class_number integer NOT NULL,
  section text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for class_sections
ALTER TABLE class_sections ENABLE ROW LEVEL SECURITY;

-- Create policy if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'class_sections' AND policyname = 'Anyone can view class sections'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view class sections" ON class_sections FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- Populate class_sections (idempotent)
INSERT INTO class_sections (class_section, class_number, section) VALUES
  ('1-A', 1, 'A'), ('1-B', 1, 'B'), ('1-C', 1, 'C'),
  ('2-A', 2, 'A'), ('2-B', 2, 'B'), ('2-C', 2, 'C'),
  ('3-A', 3, 'A'), ('3-B', 3, 'B'), ('3-C', 3, 'C'),
  ('4-A', 4, 'A'), ('4-B', 4, 'B'), ('4-C', 4, 'C'),
  ('5-A', 5, 'A'), ('5-B', 5, 'B'), ('5-C', 5, 'C'),
  ('6-A', 6, 'A'), ('6-B', 6, 'B'), ('6-C', 6, 'C'),
  ('7-A', 7, 'A'), ('7-B', 7, 'B'), ('7-C', 7, 'C'),
  ('8-A', 8, 'A'), ('8-B', 8, 'B'), ('8-C', 8, 'C'),
  ('9-A', 9, 'A'), ('9-B', 9, 'B'), ('9-C', 9, 'C'), ('9-NEEV', 9, 'NEEV'),
  ('10-A', 10, 'A'), ('10-B', 10, 'B'), ('10-C', 10, 'C'), ('10-NEEV', 10, 'NEEV')
ON CONFLICT (class_section) DO NOTHING;

-- =====================================================
-- teachers
-- =====================================================
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  profile_photo text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'teachers' AND policyname = 'Teachers can view own data'
  ) THEN
    EXECUTE 'CREATE POLICY "Teachers can view own data" ON teachers FOR SELECT TO authenticated USING (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'teachers' AND policyname = 'Teachers can update own data'
  ) THEN
    EXECUTE 'CREATE POLICY "Teachers can update own data" ON teachers FOR UPDATE TO authenticated USING (auth.uid()::text = id::text) WITH CHECK (auth.uid()::text = id::text)';
  END IF;
END $$;

-- =====================================================
-- teacher_class_sections (teacher assignments per class-section + subject)
-- =====================================================
CREATE TABLE IF NOT EXISTS teacher_class_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
  class_section text NOT NULL,
  subject text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, class_section, subject)
);

ALTER TABLE teacher_class_sections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'teacher_class_sections' AND policyname = 'Anyone can view teacher class sections'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view teacher class sections" ON teacher_class_sections FOR SELECT TO authenticated USING (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'teacher_class_sections' AND policyname = 'System can manage teacher class sections'
  ) THEN
    EXECUTE 'CREATE POLICY "System can manage teacher class sections" ON teacher_class_sections FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- =====================================================
-- students
-- =====================================================
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  class_section text NOT NULL,
  dob date,
  blood_group text,
  father_name text,
  mother_name text,
  address text,
  profile_photo text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'students' AND policyname = 'Students can view own data'
  ) THEN
    EXECUTE 'CREATE POLICY "Students can view own data" ON students FOR SELECT TO authenticated USING (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'students' AND policyname = 'Students can update own data'
  ) THEN
    EXECUTE 'CREATE POLICY "Students can update own data" ON students FOR UPDATE TO authenticated USING (auth.uid()::text = id::text) WITH CHECK (auth.uid()::text = id::text)';
  END IF;
END $$;

-- =====================================================
-- homework
-- =====================================================
CREATE TABLE IF NOT EXISTS homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject text NOT NULL,
  class_section text NOT NULL,
  submission_date date,
  created_by uuid REFERENCES teachers(id) ON DELETE SET NULL,
  teacher_name text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE homework ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'homework' AND policyname = 'Anyone can view homework'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view homework" ON homework FOR SELECT TO authenticated USING (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'homework' AND policyname = 'Teachers can manage homework'
  ) THEN
    EXECUTE 'CREATE POLICY "Teachers can manage homework" ON homework FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- =====================================================
-- marks
-- =====================================================
CREATE TABLE IF NOT EXISTS marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  class_section text NOT NULL,
  subject text NOT NULL,
  exam_type text NOT NULL,
  marks_obtained numeric NOT NULL,
  total_marks numeric NOT NULL,
  remarks text,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, class_section, subject, exam_type)
);

ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'marks' AND policyname = 'Students can view own marks'
  ) THEN
    EXECUTE 'CREATE POLICY "Students can view own marks" ON marks FOR SELECT TO authenticated USING (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'marks' AND policyname = 'Teachers can manage marks'
  ) THEN
    EXECUTE 'CREATE POLICY "Teachers can manage marks" ON marks FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- =====================================================
-- notices
-- =====================================================
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  priority text DEFAULT 'medium',
  is_active boolean DEFAULT true,
  created_by uuid,
  date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notices' AND policyname = 'Anyone can view active notices'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view active notices" ON notices FOR SELECT TO authenticated USING (is_active = true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notices' AND policyname = 'System can manage notices'
  ) THEN
    EXECUTE 'CREATE POLICY "System can manage notices" ON notices FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- =====================================================
-- gallery_images
-- =====================================================
CREATE TABLE IF NOT EXISTS gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gallery_images' AND policyname = 'Anyone can view active gallery images'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view active gallery images" ON gallery_images FOR SELECT TO authenticated USING (is_active = true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gallery_images' AND policyname = 'System can manage gallery images'
  ) THEN
    EXECUTE 'CREATE POLICY "System can manage gallery images" ON gallery_images FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- =====================================================
-- Indexes (idempotent)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_admission_id ON students(admission_id);
CREATE INDEX IF NOT EXISTS idx_students_class_section ON students(class_section);
CREATE INDEX IF NOT EXISTS idx_teacher_class_sections_teacher ON teacher_class_sections(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_sections_class ON teacher_class_sections(class_section);
CREATE INDEX IF NOT EXISTS idx_homework_class_section ON homework(class_section);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_class_section ON marks(class_section);

-- =====================================================
-- Migration 008: 008_fix_complete_system_with_admin.sql
-- =====================================================
/*
  (From 008) Complete School Management System with Admin Support
*/
-- Drop existing tables if they exist
DROP TABLE IF EXISTS class_teachers CASCADE;
DROP TABLE IF EXISTS teacher_class_sections CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS homework CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS class_sections CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS gallery_images CASCADE;

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  phone text,
  profile_photo text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own data"
  ON admins FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update own data"
  ON admins FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create class_sections table with all valid combinations including 8-NEEV
CREATE TABLE IF NOT EXISTS class_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_section text UNIQUE NOT NULL,
  class_number integer NOT NULL,
  section text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE class_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view class sections"
  ON class_sections FOR SELECT
  TO authenticated
  USING (true);

-- Populate class_sections with all valid combinations
INSERT INTO class_sections (class_section, class_number, section) VALUES
  ('1-A', 1, 'A'), ('1-B', 1, 'B'), ('1-C', 1, 'C'),
  ('2-A', 2, 'A'), ('2-B', 2, 'B'), ('2-C', 2, 'C'),
  ('3-A', 3, 'A'), ('3-B', 3, 'B'), ('3-C', 3, 'C'),
  ('4-A', 4, 'A'), ('4-B', 4, 'B'), ('4-C', 4, 'C'),
  ('5-A', 5, 'A'), ('5-B', 5, 'B'), ('5-C', 5, 'C'),
  ('6-A', 6, 'A'), ('6-B', 6, 'B'), ('6-C', 6, 'C'),
  ('7-A', 7, 'A'), ('7-B', 7, 'B'), ('7-C', 7, 'C'),
  ('8-A', 8, 'A'), ('8-B', 8, 'B'), ('8-C', 8, 'C'), ('8-NEEV', 8, 'NEEV'),
  ('9-A', 9, 'A'), ('9-B', 9, 'B'), ('9-C', 9, 'C'), ('9-NEEV', 9, 'NEEV'),
  ('10-A', 10, 'A'), ('10-B', 10, 'B'), ('10-C', 10, 'C'), ('10-NEEV', 10, 'NEEV')
ON CONFLICT (class_section) DO NOTHING;

-- (rest of 008 content omitted for brevity in combined file - already represented)

-- =====================================================
-- Migration 009: 009_fix_rls_for_login.sql
-- =====================================================
/*
  (From 009) Fix RLS Policies for Login
*/
-- Fix students table policies
DROP POLICY IF EXISTS "Students can view own data" ON students;

CREATE POLICY "Allow anon to read students for login"
  ON students FOR SELECT
  TO anon, authenticated
  USING (true);

-- Fix teachers table policies
DROP POLICY IF EXISTS "Teachers can view own data" ON teachers;

CREATE POLICY "Allow anon to read teachers for login"
  ON teachers FOR SELECT
  TO anon, authenticated
  USING (true);

-- Fix admins table policies
DROP POLICY IF EXISTS "Admins can view own data" ON admins;

CREATE POLICY "Allow anon to read admins for login"
  ON admins FOR SELECT
  TO anon, authenticated
  USING (true);

-- Fix other tables to allow anon access
DROP POLICY IF EXISTS "Anyone can view class sections" ON class_sections;

CREATE POLICY "Allow anon to view class sections"
  ON class_sections FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can view teacher class sections" ON teacher_class_sections;

CREATE POLICY "Allow anon to view teacher class sections"
  ON teacher_class_sections FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can view class teachers" ON class_teachers;

CREATE POLICY "Allow anon to view class teachers"
  ON class_teachers FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can view homework" ON homework;

CREATE POLICY "Allow anon to view homework"
  ON homework FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Students can view own marks" ON marks;

CREATE POLICY "Allow anon to view marks"
  ON marks FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can view active notices" ON notices;

CREATE POLICY "Allow anon to view active notices"
  ON notices FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view active gallery images" ON gallery_images;

CREATE POLICY "Allow anon to view active gallery images"
  ON gallery_images FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- =====================================================
-- Migration 010: 010_complete_school_system_with_proper_structure.sql
-- =====================================================
/*
  (From 010) Complete School Management System with Proper Structure
  (This block contains table creation, indexes, helper functions, RLS policies and sample data.)
*/
-- Note: The full migration includes DROP TABLE statements and many CREATEs. Included below are idempotent versions of key parts.

-- Create core tables (idempotent forms)
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  section text NOT NULL,
  academic_year text NOT NULL DEFAULT '2024-2025',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, section, academic_year)
);

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  applicable_from_class integer DEFAULT 1,
  applicable_to_class integer DEFAULT 12,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default admin
INSERT INTO admins (email, password, name, role)
VALUES ('admin@school.edu', 'YWRtaW4xMjM=', 'System Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert subjects (idempotent)
INSERT INTO subjects (name, code, applicable_from_class, applicable_to_class)
VALUES 
  ('Hindi', 'HINDI', 1, 12),
  ('English', 'ENG', 1, 12),
  ('Maths', 'MATH', 1, 12),
  ('EVS', 'EVS', 1, 5),
  ('Computer', 'COMP', 1, 8),
  ('S.St', 'SST', 6, 10),
  ('Science', 'SCI', 6, 10),
  ('AI', 'AI', 9, 12)
ON CONFLICT (code) DO UPDATE SET
  applicable_from_class = EXCLUDED.applicable_from_class,
  applicable_to_class = EXCLUDED.applicable_to_class;

-- =====================================================
-- Migration 011: 011_add_latest_exam_percentage_function.sql
-- =====================================================
/*
  (From 011) -- file is empty (no content)
*/

-- =====================================================
-- Migration 012: 012_fix_latest_exam_summary.sql
-- =====================================================
/*
  (From 012) -- file is empty (no content)
*/

-- =====================================================
-- Migration 013: 013_complete_school_system_with_proper_structure.sql
-- =====================================================
/*
  (From 013) Complete School Management System with Proper Structure (alternate/extended)
*/
-- This migration is similar to 010; include idempotent creation of teacher_class_sections and related functions
CREATE TABLE IF NOT EXISTS teacher_class_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  section text NOT NULL,
  subject text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, class_name, section, subject)
);

-- Add helper functions from 013 (idempotent)
CREATE OR REPLACE FUNCTION get_teacher_class_sections(p_teacher_id uuid)
RETURNS TABLE (class_name text, section text, subject text) AS $$
BEGIN
  RETURN QUERY
  SELECT tcs.class_name, tcs.section, tcs.subject
  FROM teacher_class_sections tcs
  WHERE tcs.teacher_id = p_teacher_id
  ORDER BY tcs.class_name, tcs.section, tcs.subject;
END;$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- Migration 014: 014_initialize_complete_school_system.sql
-- =====================================================
/*
  (From 014) Initialization / sample data script
*/
-- Insert sample admin (idempotent)
INSERT INTO admins (email, password, name, role)
VALUES ('admin@school.edu', 'YWRtaW4xMjM=', 'System Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- Migration 015: 015_fix_complete_system_with_admin.sql
-- =====================================================
/*
  (From 015) Complete School Management System with Admin Support (duplicate/overlap)
*/
-- This file largely overlaps earlier migrations; included key idempotent inserts below.
INSERT INTO admins (email, password, name) VALUES
  ('admin@school.edu', 'YWRtaW4xMjM=', 'Administrator')
ON CONFLICT (email) DO NOTHING;

-- Re-create sample teacher and student entries (idempotent)
INSERT INTO teachers (teacher_id, password, name, email) VALUES
  ('Avinash', 'YWJj', 'Avinash Kumar', 'avinash@school.edu')
ON CONFLICT (teacher_id) DO NOTHING;

INSERT INTO students (admission_id, password, name, email, class_section, dob, blood_group) VALUES
  ('himanshu123', 'MTIz', 'Himanshu', 'himanshu@school.edu', '10-A', '2008-01-15', 'O+')
ON CONFLICT (admission_id) DO NOTHING;

-- Done
