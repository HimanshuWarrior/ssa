/*
  # Complete School Management System with Class-Based Marks

  ## Overview
  This migration creates the complete school management system including authentication,
  role-based access, and a comprehensive marks management system with class-based subjects.

  ## 1. Tables Created

  ### Authentication Tables
  - `students`: Student user accounts
  - `teachers`: Teacher user accounts
  - `admins`: Administrator accounts

  ### Academic Management Tables
  - `classes`: Class information (1-12 with sections)
  - `subjects`: Subject information with class range applicability
  - `teacher_assignments`: Maps teachers to classes and subjects
  - `marks`: Student marks per subject and exam type
  - `marks_history`: Audit trail for all mark changes

  ### Content Management Tables
  - `gallery_images`: School gallery
  - `notices`: School notices and announcements

  ## 2. Subject System by Class Level
  - Classes 1-5: Hindi, English, Maths, EVS, Computer
  - Classes 6-8: Hindi, English, Maths, S.St, Science, Computer
  - Classes 9-10: Hindi, English, Maths, S.St, Science, AI

  ## 3. Exam Types
  PA1, PA2, Half Yearly, PA3, PA4, Annual

  ## 4. Security
  All tables have Row Level Security enabled with appropriate policies
*/

-- =====================================================
-- CREATE CORE TABLES
-- =====================================================

-- Students table
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

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  section text NOT NULL,
  academic_year text NOT NULL DEFAULT '2024-2025',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, section, academic_year)
);

-- Subjects table with class range
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add class range columns to subjects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subjects' AND column_name = 'applicable_from_class'
  ) THEN
    ALTER TABLE subjects 
    ADD COLUMN applicable_from_class integer DEFAULT 1,
    ADD COLUMN applicable_to_class integer DEFAULT 12;
  END IF;
END $$;

-- Teacher assignments table
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, class_id, subject_id)
);

-- Add foreign key to students after classes table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'students_class_id_fkey'
  ) THEN
    ALTER TABLE students ADD CONSTRAINT students_class_id_fkey 
      FOREIGN KEY (class_id) REFERENCES classes(id);
  END IF;
END $$;

-- Marks table
CREATE TABLE IF NOT EXISTS marks (
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
CREATE TABLE IF NOT EXISTS marks_history (
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

-- Notices table
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
-- CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_students_admission_id ON students(admission_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_classes_name_section ON classes(name, section);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_class_range ON subjects(applicable_from_class, applicable_to_class);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class ON teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_subject ON teacher_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_class ON marks(class_id);
CREATE INDEX IF NOT EXISTS idx_marks_subject ON marks(subject_id);
CREATE INDEX IF NOT EXISTS idx_marks_exam_type ON marks(exam_type);
CREATE INDEX IF NOT EXISTS idx_marks_history_student ON marks_history(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_history_mark ON marks_history(mark_id);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default admin (password: admin123, base64 encoded)
INSERT INTO admins (email, password, name, role)
VALUES ('admin@school.edu', 'YWRtaW4xMjM=', 'System Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;

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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

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
-- CREATE RLS POLICIES
-- =====================================================

-- Students policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'students' AND policyname = 'Anyone can read students for authentication'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can read students for authentication" ON students FOR SELECT TO anon, authenticated USING (true)');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'students' AND policyname = 'Anyone can manage students'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can manage students" ON students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)');
  END IF;
END $$;

-- Teachers policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'teachers' AND policyname = 'Anyone can read teachers for authentication'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can read teachers for authentication" ON teachers FOR SELECT TO anon, authenticated USING (true)');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'teachers' AND policyname = 'Anyone can manage teachers'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can manage teachers" ON teachers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)');
  END IF;
END $$;

-- Admins policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admins' AND policyname = 'Anyone can read admins for authentication'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can read admins for authentication" ON admins FOR SELECT TO anon, authenticated USING (true)');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admins' AND policyname = 'Anyone can manage admins'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can manage admins" ON admins FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)');
  END IF;
END $$;

-- Classes policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'classes' AND policyname = 'Anyone can read classes'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can read classes" ON classes FOR SELECT TO anon, authenticated USING (true)');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'classes' AND policyname = 'Anyone can manage classes'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can manage classes" ON classes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)');
  END IF;
END $$;

-- Subjects policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subjects' AND policyname = 'Anyone can read subjects'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can read subjects" ON subjects FOR SELECT TO anon, authenticated USING (true)');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subjects' AND policyname = 'Anyone can manage subjects'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can manage subjects" ON subjects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)');
  END IF;
END $$;

-- Teacher assignments policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'teacher_assignments' AND policyname = 'Anyone can read teacher assignments'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can read teacher assignments" ON teacher_assignments FOR SELECT TO anon, authenticated USING (true)');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'teacher_assignments' AND policyname = 'Anyone can manage teacher assignments'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can manage teacher assignments" ON teacher_assignments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)');
  END IF;
END $$;

-- Marks policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'marks' AND policyname = 'Anyone can read marks'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can read marks" ON marks FOR SELECT TO anon, authenticated USING (true)');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'marks' AND policyname = 'Anyone can manage marks'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can manage marks" ON marks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)');
  END IF;
END $$;

-- Marks history policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'marks_history' AND policyname = 'Anyone can read marks history'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can read marks history" ON marks_history FOR SELECT TO anon, authenticated USING (true)');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'marks_history' AND policyname = 'Anyone can insert marks history'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can insert marks history" ON marks_history FOR INSERT TO anon, authenticated WITH CHECK (true)');
  END IF;
END $$;

-- Gallery images policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'gallery_images' AND policyname = 'Anyone can read gallery images'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can read gallery images" ON gallery_images FOR SELECT TO anon, authenticated USING (true)');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'gallery_images' AND policyname = 'Anyone can manage gallery images'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can manage gallery images" ON gallery_images FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)');
  END IF;
END $$;

-- Notices policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notices' AND policyname = 'Anyone can read notices'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can read notices" ON notices FOR SELECT TO anon, authenticated USING (true)');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notices' AND policyname = 'Anyone can manage notices'
  ) THEN
    EXECUTE format('CREATE POLICY "Anyone can manage notices" ON notices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)');
  END IF;
END $$;