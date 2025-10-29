/*
  # Complete School Management System with Proper Structure

  ## Overview
  This migration creates the complete school management system with proper class/section structure,
  subjects based on class level, and marks management.

  ## Tables Created

  ### Authentication Tables
  - `students`: Student user accounts with class/section
  - `teachers`: Teacher user accounts with assigned classes/sections/subjects
  - `admins`: Administrator accounts

  ### Academic Management Tables
  - `classes`: Class information (1-12 with sections A, B, C, and NEEV for 9-10)
  - `subjects`: Subject information with class range applicability
  - `teacher_assignments`: Maps teachers to classes and subjects
  - `marks`: Student marks per subject and exam type
  - `marks_history`: Audit trail for all mark changes

  ### Content Management Tables
  - `gallery_images`: School gallery
  - `notices`: School notices and announcements

  ## Subject System by Class Level
  - Classes 1-5: Hindi, English, Maths, EVS, Computer
  - Classes 6-8: Hindi, English, Maths, S.St, Science, Computer
  - Classes 9-10: Hindi, English, Maths, S.St, Science, AI

  ## Sections
  - Classes 1-8: A, B, C
  - Classes 9-10: A, B, C, NEEV

  ## Exam Types
  PA1, PA2, Half Yearly, PA3, PA4, Annual

  ## Security
  All tables have Row Level Security enabled with appropriate policies for development.
*/

-- =====================================================
-- DROP EXISTING TABLES IF ANY (Clean slate)
-- =====================================================

DROP TABLE IF EXISTS marks_history CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS teacher_assignments CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS gallery_images CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Drop existing views and functions
DROP VIEW IF EXISTS teacher_subject_access CASCADE;
DROP VIEW IF EXISTS student_latest_exam_summary CASCADE;
DROP FUNCTION IF EXISTS can_teacher_manage_student(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS get_student_exam_marks(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS get_subjects_for_class(integer) CASCADE;
DROP FUNCTION IF EXISTS get_latest_exam_percentage(uuid) CASCADE;

-- =====================================================
-- CREATE CORE TABLES
-- =====================================================

-- Students table
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  dob text,
  blood_group text,
  class_name text NOT NULL,
  section text NOT NULL,
  class_id uuid,
  father_name text,
  mother_name text,
  address text,
  profile_photo text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Teachers table
CREATE TABLE teachers (
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

-- Admins table
CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Classes table
CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  section text NOT NULL,
  academic_year text NOT NULL DEFAULT '2024-2025',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, section, academic_year)
);

-- Subjects table with class range
CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  applicable_from_class integer DEFAULT 1,
  applicable_to_class integer DEFAULT 12,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Teacher assignments table
CREATE TABLE teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, class_id, subject_id)
);

-- Add foreign key to students after classes table exists
ALTER TABLE students ADD CONSTRAINT students_class_id_fkey 
  FOREIGN KEY (class_id) REFERENCES classes(id);

-- Marks table
CREATE TABLE marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  marks_obtained numeric NOT NULL DEFAULT 0,
  total_marks numeric NOT NULL DEFAULT 100,
  exam_type text NOT NULL DEFAULT 'PA1',
  exam_date date DEFAULT CURRENT_DATE,
  remarks text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id, exam_type, class_id)
);

-- Marks history table
CREATE TABLE marks_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mark_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exam_type text NOT NULL,
  old_marks numeric NOT NULL,
  new_marks numeric NOT NULL,
  updated_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Gallery images table
CREATE TABLE gallery_images (
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

-- Notices table
CREATE TABLE notices (
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
-- CREATE INDEXES
-- =====================================================

CREATE INDEX idx_students_admission_id ON students(admission_id);
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_class_section ON students(class_name, section);
CREATE INDEX idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_classes_name_section ON classes(name, section);
CREATE INDEX idx_subjects_code ON subjects(code);
CREATE INDEX idx_subjects_class_range ON subjects(applicable_from_class, applicable_to_class);
CREATE INDEX idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_class ON teacher_assignments(class_id);
CREATE INDEX idx_teacher_assignments_subject ON teacher_assignments(subject_id);
CREATE INDEX idx_teacher_assignments_composite ON teacher_assignments(teacher_id, class_id, subject_id);
CREATE INDEX idx_marks_student ON marks(student_id);
CREATE INDEX idx_marks_class ON marks(class_id);
CREATE INDEX idx_marks_subject ON marks(subject_id);
CREATE INDEX idx_marks_exam_type ON marks(exam_type);
CREATE INDEX idx_marks_student_exam ON marks(student_id, exam_type);
CREATE INDEX idx_marks_updated_at ON marks(updated_at DESC);
CREATE INDEX idx_marks_history_student ON marks_history(student_id);
CREATE INDEX idx_marks_history_mark ON marks_history(mark_id);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default admin (password: admin123, base64 encoded)
INSERT INTO admins (email, password, name, role)
VALUES ('admin@school.edu', 'YWRtaW4xMjM=', 'System Administrator', 'admin');

-- Insert all classes with sections
-- Classes 1-8 have sections A, B, C
DO $$
DECLARE
  class_num integer;
  section_name text;
BEGIN
  FOR class_num IN 1..8 LOOP
    FOREACH section_name IN ARRAY ARRAY['A', 'B', 'C']
    LOOP
      INSERT INTO classes (name, section, academic_year)
      VALUES (class_num::text, section_name, '2024-2025')
      ON CONFLICT (name, section, academic_year) DO NOTHING;
    END LOOP;
  END LOOP;
  
  -- Classes 9-10 have sections A, B, C, NEEV
  FOR class_num IN 9..10 LOOP
    FOREACH section_name IN ARRAY ARRAY['A', 'B', 'C', 'NEEV']
    LOOP
      INSERT INTO classes (name, section, academic_year)
      VALUES (class_num::text, section_name, '2024-2025')
      ON CONFLICT (name, section, academic_year) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Insert subjects with class ranges
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
-- CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get subjects applicable for a specific class
CREATE OR REPLACE FUNCTION get_subjects_for_class(class_number integer)
RETURNS TABLE (
  id uuid,
  name text,
  code text
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.name, s.code
  FROM subjects s
  WHERE class_number >= s.applicable_from_class 
    AND class_number <= s.applicable_to_class
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate latest exam percentage for a student
CREATE OR REPLACE FUNCTION get_latest_exam_percentage(p_student_id uuid)
RETURNS numeric AS $$
DECLARE
  latest_exam_type text;
  total_marks numeric;
  obtained_marks numeric;
  percentage numeric;
BEGIN
  -- Get the most recent exam type for this student
  SELECT exam_type INTO latest_exam_type
  FROM marks
  WHERE student_id = p_student_id
  ORDER BY updated_at DESC
  LIMIT 1;

  -- If no marks found, return 0
  IF latest_exam_type IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate total and obtained marks for the latest exam
  SELECT 
    SUM(total_marks),
    SUM(marks_obtained)
  INTO total_marks, obtained_marks
  FROM marks
  WHERE student_id = p_student_id
    AND exam_type = latest_exam_type;

  -- Calculate percentage
  IF total_marks > 0 THEN
    percentage := (obtained_marks / total_marks) * 100;
    RETURN ROUND(percentage, 2);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if teacher can manage marks for a student
CREATE OR REPLACE FUNCTION can_teacher_manage_student(
    p_teacher_id uuid,
    p_student_id uuid
)
RETURNS boolean AS $$
DECLARE
    student_class_id uuid;
    has_access boolean;
BEGIN
    -- Get student's class
    SELECT class_id INTO student_class_id
    FROM students
    WHERE id = p_student_id;

    -- Check if teacher has assignment for this class
    SELECT EXISTS(
        SELECT 1
        FROM teacher_assignments
        WHERE teacher_id = p_teacher_id
        AND class_id = student_class_id
    ) INTO has_access;

    RETURN has_access;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get student's marks for a specific exam
CREATE OR REPLACE FUNCTION get_student_exam_marks(
    p_student_id uuid,
    p_exam_type text
)
RETURNS TABLE(
    subject_id uuid,
    subject_name text,
    subject_code text,
    marks_obtained numeric,
    total_marks numeric,
    remarks text,
    percentage numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as subject_id,
        s.name as subject_name,
        s.code as subject_code,
        COALESCE(m.marks_obtained, 0) as marks_obtained,
        COALESCE(m.total_marks, 100) as total_marks,
        m.remarks,
        ROUND((COALESCE(m.marks_obtained, 0) / COALESCE(m.total_marks, 100) * 100)::numeric, 2) as percentage
    FROM subjects s
    LEFT JOIN marks m ON m.subject_id = s.id 
        AND m.student_id = p_student_id 
        AND m.exam_type = p_exam_type
    JOIN students st ON st.id = p_student_id
    WHERE CAST(st.class_name AS integer) >= s.applicable_from_class
        AND CAST(st.class_name AS integer) <= s.applicable_to_class
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- CREATE HELPER VIEWS
-- =====================================================

-- View for teacher subject access
CREATE OR REPLACE VIEW teacher_subject_access AS
SELECT DISTINCT
    ta.teacher_id,
    ta.class_id,
    ta.subject_id,
    c.name as class_name,
    c.section as class_section,
    s.name as subject_name,
    s.code as subject_code
FROM teacher_assignments ta
JOIN classes c ON ta.class_id = c.id
JOIN subjects s ON ta.subject_id = s.id;

-- View for student's latest exam summary
CREATE OR REPLACE VIEW student_latest_exam_summary AS
WITH latest_exam AS (
    SELECT 
        student_id,
        exam_type,
        MAX(updated_at) as last_update
    FROM marks
    GROUP BY student_id, exam_type
),
ranked_exams AS (
    SELECT 
        student_id,
        exam_type,
        last_update,
        ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY last_update DESC) as rn
    FROM latest_exam
)
SELECT 
    re.student_id,
    re.exam_type as latest_exam_type,
    re.last_update,
    SUM(m.marks_obtained) as total_obtained,
    SUM(m.total_marks) as total_marks,
    ROUND((SUM(m.marks_obtained) / SUM(m.total_marks) * 100)::numeric, 2) as percentage
FROM ranked_exams re
JOIN marks m ON m.student_id = re.student_id AND m.exam_type = re.exam_type
WHERE re.rn = 1
GROUP BY re.student_id, re.exam_type, re.last_update;

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
ALTER TABLE marks_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES (Open for development)
-- =====================================================

-- Students policies
CREATE POLICY "Anyone can read students"
  ON students FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert students"
  ON students FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update students"
  ON students FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete students"
  ON students FOR DELETE
  TO anon, authenticated
  USING (true);

-- Teachers policies
CREATE POLICY "Anyone can read teachers"
  ON teachers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert teachers"
  ON teachers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update teachers"
  ON teachers FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete teachers"
  ON teachers FOR DELETE
  TO anon, authenticated
  USING (true);

-- Admins policies
CREATE POLICY "Anyone can read admins"
  ON admins FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can manage admins"
  ON admins FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Classes policies
CREATE POLICY "Anyone can read classes"
  ON classes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can manage classes"
  ON classes FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Subjects policies
CREATE POLICY "Anyone can read subjects"
  ON subjects FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can manage subjects"
  ON subjects FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Teacher assignments policies
CREATE POLICY "Anyone can read teacher assignments"
  ON teacher_assignments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can manage teacher assignments"
  ON teacher_assignments FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Marks policies
CREATE POLICY "Anyone can read marks"
  ON marks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert marks"
  ON marks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update marks"
  ON marks FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete marks"
  ON marks FOR DELETE
  TO anon, authenticated
  USING (true);

-- Marks history policies
CREATE POLICY "Anyone can read marks history"
  ON marks_history FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert marks history"
  ON marks_history FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Gallery images policies
CREATE POLICY "Anyone can read gallery images"
  ON gallery_images FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can manage gallery images"
  ON gallery_images FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Notices policies
CREATE POLICY "Anyone can read notices"
  ON notices FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can manage notices"
  ON notices FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Grant permissions on views
GRANT SELECT ON teacher_subject_access TO anon, authenticated;
GRANT SELECT ON student_latest_exam_summary TO anon, authenticated;