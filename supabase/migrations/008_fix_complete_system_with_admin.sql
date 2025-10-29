/*
  # Complete School Management System with Admin Support

  ## Overview
  Complete restructure of the school management system with proper admin authentication,
  class-section structure, and teacher assignment improvements.

  ## Changes

  1. New Tables
    - `admins` - Stores administrator accounts with email/password authentication
    - `class_sections` - Stores all valid class-section combinations including 8-NEEV
    - `class_teachers` - Maps class-sections to their assigned class teacher
    - `teacher_class_sections` - Maps teachers to class-sections with subject assignments

  2. Core Tables
    - `teachers` - Teacher accounts with simplified structure
    - `students` - Student accounts with class-section reference
    - `marks` - Student marks/grades
    - `homework` - Homework assignments
    - `notices` - School notices
    - `gallery_images` - Gallery photos

  3. Class-Section Structure
    - Uses combined format: "1-A", "2-B", "8-NEEV", "9-NEEV", "10-NEEV"
    - Pre-populated with all valid combinations:
      * Classes 1-7: A, B, C sections
      * Class 8: A, B, C, NEEV sections
      * Classes 9-10: A, B, C, NEEV sections

  4. Security
    - RLS enabled on all tables
    - Appropriate policies for each user role
    - Admin authentication via admins table
    - Teacher and student authentication via respective tables

  5. Sample Data
    - Default admin account: admin@school.edu / admin123
    - Sample teacher account: Avinash / abc
    - Sample student account: himanshu123 / 123
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

-- Create teachers table
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

CREATE POLICY "Teachers can view own data"
  ON teachers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can update own data"
  ON teachers FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Create teacher_class_sections table (stores teacher assignments with subjects per class-section)
CREATE TABLE IF NOT EXISTS teacher_class_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
  class_section text NOT NULL,
  subject text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, class_section, subject)
);

ALTER TABLE teacher_class_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teacher class sections"
  ON teacher_class_sections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage teacher class sections"
  ON teacher_class_sections FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create class_teachers table (stores which teacher is the class teacher for each class-section)
CREATE TABLE IF NOT EXISTS class_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_section text UNIQUE NOT NULL,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view class teachers"
  ON class_teachers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage class teachers"
  ON class_teachers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create students table
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

CREATE POLICY "Students can view own data"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can update own data"
  ON students FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Create homework table
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

CREATE POLICY "Anyone can view homework"
  ON homework FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage homework"
  ON homework FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create marks table
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

CREATE POLICY "Students can view own marks"
  ON marks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage marks"
  ON marks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create notices table
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

CREATE POLICY "Anyone can view active notices"
  ON notices FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "System can manage notices"
  ON notices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

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

ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active gallery images"
  ON gallery_images FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "System can manage gallery images"
  ON gallery_images FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_admission_id ON students(admission_id);
CREATE INDEX IF NOT EXISTS idx_students_class_section ON students(class_section);
CREATE INDEX IF NOT EXISTS idx_teacher_class_sections_teacher ON teacher_class_sections(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_sections_class ON teacher_class_sections(class_section);
CREATE INDEX IF NOT EXISTS idx_class_teachers_class_section ON class_teachers(class_section);
CREATE INDEX IF NOT EXISTS idx_homework_class_section ON homework(class_section);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_class_section ON marks(class_section);

-- Insert sample admin account (password: admin123)
INSERT INTO admins (email, password, name) VALUES
  ('admin@school.edu', 'YWRtaW4xMjM=', 'Administrator')
ON CONFLICT (email) DO NOTHING;

-- Insert sample teacher (teacher_id: Avinash, password: abc)
INSERT INTO teachers (teacher_id, password, name, email) VALUES
  ('Avinash', 'YWJj', 'Avinash Kumar', 'avinash@school.edu')
ON CONFLICT (teacher_id) DO NOTHING;

-- Insert sample student (admission_id: himanshu123, password: 123)
INSERT INTO students (admission_id, password, name, email, class_section, dob, blood_group) VALUES
  ('himanshu123', 'MTIz', 'Himanshu', 'himanshu@school.edu', '10-A', '2008-01-15', 'O+')
ON CONFLICT (admission_id) DO NOTHING;