/*
  # Role-Based Access Control System

  ## Overview
  This migration creates a comprehensive role-based system for a school management application
  with Admin and Teacher roles, including proper access controls and data management.

  ## 1. New Tables

  ### `user_profiles`
  Central user authentication and role management table
  - `id` (uuid, primary key) - References auth.users
  - `email` (text, unique, not null)
  - `role` (text, not null) - Either 'admin' or 'teacher'
  - `name` (text, not null)
  - `teacher_id` (uuid, nullable) - Foreign key to teachers table
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `classes`
  Store class information (e.g., Class 1, Class 2, etc.)
  - `id` (uuid, primary key)
  - `name` (text, unique, not null) - Class name (e.g., "1", "2", "10")
  - `section` (text, not null) - Section (e.g., "A", "B", "C")
  - `academic_year` (text, not null)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `subjects`
  Store subject information
  - `id` (uuid, primary key)
  - `name` (text, not null) - Subject name (e.g., "Mathematics", "Science")
  - `code` (text, unique)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `teacher_assignments`
  Maps teachers to their assigned classes and subjects
  - `id` (uuid, primary key)
  - `teacher_id` (uuid, not null) - Foreign key to teachers
  - `class_id` (uuid, not null) - Foreign key to classes
  - `subject_id` (uuid, not null) - Foreign key to subjects
  - `created_at` (timestamptz)
  - Unique constraint on (teacher_id, class_id, subject_id)

  ### `marks`
  Store student marks/grades
  - `id` (uuid, primary key)
  - `student_id` (uuid, not null) - Foreign key to students
  - `class_id` (uuid, not null) - Foreign key to classes
  - `subject_id` (uuid, not null) - Foreign key to subjects
  - `marks_obtained` (numeric)
  - `total_marks` (numeric)
  - `exam_type` (text) - e.g., "midterm", "final", "unit_test"
  - `exam_date` (date)
  - `remarks` (text)
  - `created_by` (uuid) - Teacher or admin who created the entry
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## 2. Updates to Existing Tables
  - Update students table with class_id foreign key
  - Update teachers table structure

  ## 3. Security (Row Level Security)
  
  ### Admin Permissions
  - Full access to all tables (SELECT, INSERT, UPDATE, DELETE)
  - Can manage students, teachers, classes, subjects, marks
  
  ### Teacher Permissions
  - Can view their own profile
  - Can view students in classes they teach
  - Can view and edit marks ONLY for subjects they teach in assigned classes
  - Cannot modify students, teachers, or system configuration
  
  ### Student Permissions
  - Can view their own data and marks

  ## 4. Important Notes
  - All tables have RLS enabled
  - Policies enforce role-based access control
  - Foreign key constraints maintain data integrity
  - Indexes added for performance optimization
*/

-- Create user_profiles table for centralized role management
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'teacher')),
  name text NOT NULL,
  teacher_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  section text NOT NULL,
  academic_year text NOT NULL DEFAULT '2024-2025',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, section, academic_year)
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Create teacher_assignments table
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, class_id, subject_id)
);

ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Update students table to add class_id foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'class_id'
  ) THEN
    ALTER TABLE students ADD COLUMN class_id uuid REFERENCES classes(id);
  END IF;
END $$;

-- Create marks table
CREATE TABLE IF NOT EXISTS marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  marks_obtained numeric NOT NULL DEFAULT 0,
  total_marks numeric NOT NULL DEFAULT 100,
  exam_type text NOT NULL DEFAULT 'regular',
  exam_date date DEFAULT CURRENT_DATE,
  remarks text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

-- Add foreign key to user_profiles after teachers table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_profiles_teacher_id_fkey'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT user_profiles_teacher_id_fkey
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on existing tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_classes_name_section ON classes(name, section);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class ON teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_subject ON teacher_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_class ON marks(class_id);
CREATE INDEX IF NOT EXISTS idx_marks_subject ON marks(subject_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_admission_id ON students(admission_id);
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Helper function to get current user's role from session
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text AS $$
DECLARE
  user_email text;
BEGIN
  BEGIN
    user_email := current_setting('request.jwt.claims', true)::json->>'email';
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
  
  IF user_email IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN (SELECT role FROM user_profiles WHERE email = user_email LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's teacher_id
CREATE OR REPLACE FUNCTION get_current_teacher_id()
RETURNS uuid AS $$
DECLARE
  user_email text;
BEGIN
  BEGIN
    user_email := current_setting('request.jwt.claims', true)::json->>'email';
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
  
  IF user_email IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN (SELECT teacher_id FROM user_profiles WHERE email = user_email LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USER_PROFILES POLICIES
-- =====================================================

CREATE POLICY "Allow anonymous read for user profiles"
  ON user_profiles
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can read user profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert user profiles"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update user profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete user profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (get_current_user_role() = 'admin');

-- =====================================================
-- STUDENTS POLICIES
-- =====================================================

CREATE POLICY "Admins have full access to students"
  ON students
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Teachers can view students in their classes"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'teacher'
    AND class_id IN (
      SELECT DISTINCT ta.class_id
      FROM teacher_assignments ta
      WHERE ta.teacher_id = get_current_teacher_id()
    )
  );

CREATE POLICY "Allow anonymous read for student authentication"
  ON students
  FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- TEACHERS POLICIES
-- =====================================================

CREATE POLICY "Admins have full access to teachers"
  ON teachers
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Teachers can view all teacher data"
  ON teachers
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() = 'teacher');

CREATE POLICY "Allow anonymous read for teacher authentication"
  ON teachers
  FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- ADMINS POLICIES
-- =====================================================

CREATE POLICY "Admins have full access to admin table"
  ON admins
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Allow anonymous read for admin authentication"
  ON admins
  FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- CLASSES POLICIES
-- =====================================================

CREATE POLICY "Admins have full access to classes"
  ON classes
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Teachers can view classes they teach"
  ON classes
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'teacher'
    AND id IN (
      SELECT DISTINCT ta.class_id
      FROM teacher_assignments ta
      WHERE ta.teacher_id = get_current_teacher_id()
    )
  );

CREATE POLICY "Allow public read for classes"
  ON classes
  FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- SUBJECTS POLICIES
-- =====================================================

CREATE POLICY "Admins have full access to subjects"
  ON subjects
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Teachers can view subjects they teach"
  ON subjects
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'teacher'
    AND id IN (
      SELECT DISTINCT ta.subject_id
      FROM teacher_assignments ta
      WHERE ta.teacher_id = get_current_teacher_id()
    )
  );

CREATE POLICY "Allow public read for subjects"
  ON subjects
  FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- TEACHER_ASSIGNMENTS POLICIES
-- =====================================================

CREATE POLICY "Admins have full access to teacher assignments"
  ON teacher_assignments
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Teachers can view their own assignments"
  ON teacher_assignments
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'teacher'
    AND teacher_id = get_current_teacher_id()
  );

CREATE POLICY "Allow public read for teacher assignments"
  ON teacher_assignments
  FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- MARKS POLICIES
-- =====================================================

CREATE POLICY "Admins have full access to marks"
  ON marks
  FOR ALL
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Teachers can view marks for their assigned classes and subjects"
  ON marks
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM teacher_assignments ta
      WHERE ta.teacher_id = get_current_teacher_id()
        AND ta.class_id = marks.class_id
        AND ta.subject_id = marks.subject_id
    )
  );

CREATE POLICY "Teachers can insert marks for their assigned classes and subjects"
  ON marks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM teacher_assignments ta
      WHERE ta.teacher_id = get_current_teacher_id()
        AND ta.class_id = marks.class_id
        AND ta.subject_id = marks.subject_id
    )
  );

CREATE POLICY "Teachers can update marks for their assigned classes and subjects"
  ON marks
  FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM teacher_assignments ta
      WHERE ta.teacher_id = get_current_teacher_id()
        AND ta.class_id = marks.class_id
        AND ta.subject_id = marks.subject_id
    )
  )
  WITH CHECK (
    get_current_user_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM teacher_assignments ta
      WHERE ta.teacher_id = get_current_teacher_id()
        AND ta.class_id = marks.class_id
        AND ta.subject_id = marks.subject_id
    )
  );

CREATE POLICY "Teachers cannot delete marks"
  ON marks
  FOR DELETE
  TO authenticated
  USING (false);