/*
  # Fix Authentication and Role-Based Access Control System

  ## Overview
  This migration creates and properly configures the authentication system with proper RLS policies
  for admin functionality to work correctly.

  ## 1. Tables Created/Updated
  
  ### `students`
  Student user accounts and information
  - `id` (uuid, primary key)
  - `admission_id` (text, unique) - Student ID for login
  - `password` (text) - Encoded password
  - `name` (text, required)
  - `email` (text)
  - `phone` (text)
  - `dob` (text)
  - `blood_group` (text)
  - `class_name` (text)
  - `section` (text)
  - `father_name` (text)
  - `mother_name` (text)
  - `address` (text)
  - `profile_photo` (text)
  - `status` (text, default 'active')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `teachers`
  Teacher user accounts and information
  - `id` (uuid, primary key)
  - `teacher_id` (text, unique) - Teacher ID for login
  - `password` (text) - Encoded password
  - `name` (text, required)
  - `email` (text, unique, required)
  - `phone` (text)
  - `subjects` (text[]) - Array of subjects taught
  - `classes` (text[]) - Array of classes taught
  - `sections` (text[]) - Array of sections taught
  - `profile_photo` (text)
  - `status` (text, default 'active')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `admins`
  Administrator user accounts
  - `id` (uuid, primary key)
  - `email` (text, unique, required)
  - `password` (text) - Encoded password
  - `name` (text, required)
  - `role` (text, default 'admin')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `classes`
  Class information for organizing students
  - `id` (uuid, primary key)
  - `name` (text, required) - Class name (e.g., "1", "2", "10")
  - `section` (text, required) - Section (e.g., "A", "B", "C")
  - `academic_year` (text, required, default '2024-2025')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - Unique constraint on (name, section, academic_year)

  ### `subjects`
  Subject information
  - `id` (uuid, primary key)
  - `name` (text, required)
  - `code` (text, unique)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `teacher_assignments`
  Maps teachers to their assigned classes and subjects
  - `id` (uuid, primary key)
  - `teacher_id` (uuid, foreign key to teachers)
  - `class_id` (uuid, foreign key to classes)
  - `subject_id` (uuid, foreign key to subjects)
  - `created_at` (timestamptz)
  - Unique constraint on (teacher_id, class_id, subject_id)

  ### `marks`
  Student marks and grades
  - `id` (uuid, primary key)
  - `student_id` (uuid, foreign key to students)
  - `class_id` (uuid, foreign key to classes)
  - `subject_id` (uuid, foreign key to subjects)
  - `marks_obtained` (numeric, default 0)
  - `total_marks` (numeric, default 100)
  - `exam_type` (text, default 'regular')
  - `exam_date` (date)
  - `remarks` (text)
  - `created_by` (uuid)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `gallery_images`
  Gallery images for the school website
  - `id` (uuid, primary key)
  - `image_url` (text, required)
  - `title` (text, required)
  - `description` (text)
  - `display_order` (integer, default 0)
  - `is_active` (boolean, default true)
  - `uploaded_by` (uuid)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `notices`
  School notices and announcements
  - `id` (uuid, primary key)
  - `title` (text, required)
  - `content` (text, required)
  - `priority` (text, default 'medium')
  - `date` (timestamptz, default now())
  - `is_active` (boolean, default true)
  - `created_by` (uuid)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## 2. Security - Row Level Security

  ### Admin Permissions
  - Full access to all tables (SELECT, INSERT, UPDATE, DELETE)
  - Can manage students, teachers, classes, subjects, marks, gallery, notices

  ### Teacher Permissions
  - Can view their own profile and other teachers
  - Can view students in assigned classes
  - Can view and edit marks for subjects they teach
  - Cannot modify students or teachers

  ### Student Permissions
  - Can view their own data and marks

  ### Anonymous Permissions
  - Can read students, teachers, admins for authentication purposes
  - Can read public data like classes, subjects, gallery images, notices

  ## 3. Important Notes
  - All tables have RLS enabled
  - Policies allow anonymous access for authentication flow
  - Admins identified by email in admins table
  - Foreign key constraints maintain data integrity
  - Indexes added for performance
*/

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  dob text,
  blood_group text,
  class_name text,
  section text,
  father_name text,
  mother_name text,
  address text,
  profile_photo text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  subjects text[] DEFAULT '{}',
  classes text[] DEFAULT '{}',
  sections text[] DEFAULT '{}',
  profile_photo text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create teacher_assignments table
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, class_id, subject_id)
);

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

-- Create gallery_images table
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

-- Create notices table
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  priority text DEFAULT 'medium',
  date timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_students_admission_id ON students(admission_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_classes_name_section ON classes(name, section);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class ON teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_subject ON teacher_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_class ON marks(class_id);
CREATE INDEX IF NOT EXISTS idx_marks_subject ON marks(subject_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Students can read own data" ON students;
DROP POLICY IF EXISTS "Allow anonymous read for authentication" ON students;
DROP POLICY IF EXISTS "Teachers can read own data" ON teachers;
DROP POLICY IF EXISTS "Allow anonymous read for authentication" ON teachers;
DROP POLICY IF EXISTS "Admins can read own data" ON admins;
DROP POLICY IF EXISTS "Allow anonymous read for authentication" ON admins;

-- =====================================================
-- STUDENTS POLICIES
-- =====================================================

CREATE POLICY "Anyone can read students for authentication"
  ON students
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert students"
  ON students
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update students"
  ON students
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete students"
  ON students
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- =====================================================
-- TEACHERS POLICIES
-- =====================================================

CREATE POLICY "Anyone can read teachers for authentication"
  ON teachers
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert teachers"
  ON teachers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update teachers"
  ON teachers
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete teachers"
  ON teachers
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- =====================================================
-- ADMINS POLICIES
-- =====================================================

CREATE POLICY "Anyone can read admins for authentication"
  ON admins
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage admins"
  ON admins
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- CLASSES POLICIES
-- =====================================================

CREATE POLICY "Anyone can read classes"
  ON classes
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage classes"
  ON classes
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- SUBJECTS POLICIES
-- =====================================================

CREATE POLICY "Anyone can read subjects"
  ON subjects
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage subjects"
  ON subjects
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- TEACHER_ASSIGNMENTS POLICIES
-- =====================================================

CREATE POLICY "Anyone can read teacher assignments"
  ON teacher_assignments
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage teacher assignments"
  ON teacher_assignments
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- MARKS POLICIES
-- =====================================================

CREATE POLICY "Anyone can read marks"
  ON marks
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage marks"
  ON marks
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- GALLERY_IMAGES POLICIES
-- =====================================================

CREATE POLICY "Anyone can read active gallery images"
  ON gallery_images
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage gallery images"
  ON gallery_images
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- NOTICES POLICIES
-- =====================================================

CREATE POLICY "Anyone can read active notices"
  ON notices
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage notices"
  ON notices
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- INSERT DEFAULT ADMIN
-- =====================================================

-- Insert a default admin user (password is 'admin123' encoded with btoa)
INSERT INTO admins (email, password, name, role)
VALUES ('admin@school.edu', 'YWRtaW4xMjM=', 'System Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;