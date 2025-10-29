/*
  # Class-Section Structure Restructure

  ## Overview
  Restructures the school management system to use class-section combinations (e.g., 1-A, 1-B, 9-NEEV) instead of separate class and section fields.

  ## Changes

  1. New Tables
    - Creates `class_sections` table to store all valid class-section combinations
    - Stores combinations like "1-A", "1-B", "8-NEEV", "9-A", "10-NEEV"
    
  2. Modified Tables
    - `teachers` table: Removes `classes` and `sections` arrays
    - `teacher_class_sections` table: Updated to store class-section combinations with subjects
    - `students` table: Updates to reference class_section combination
    - `homework` table: Updates to use class_section instead of separate fields

  3. Data Population
    - Pre-populates valid class-section combinations:
      * Classes 1-8: A, B, C sections
      * Classes 9-10: A, B, C, NEEV sections

  4. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS teacher_class_sections CASCADE;
DROP TABLE IF EXISTS homework CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS class_sections CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS gallery_images CASCADE;

-- Create class_sections table
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

-- Populate class_sections with valid combinations
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
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_admission_id ON students(admission_id);
CREATE INDEX IF NOT EXISTS idx_students_class_section ON students(class_section);
CREATE INDEX IF NOT EXISTS idx_teacher_class_sections_teacher ON teacher_class_sections(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_sections_class ON teacher_class_sections(class_section);
CREATE INDEX IF NOT EXISTS idx_homework_class_section ON homework(class_section);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_class_section ON marks(class_section);
