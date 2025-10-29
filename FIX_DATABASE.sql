/*
  COMPREHENSIVE DATABASE FIX FOR AUTHENTICATION SYSTEM

  INSTRUCTIONS:
  1. Open your Supabase Dashboard (https://supabase.com/dashboard)
  2. Navigate to your project
  3. Go to "SQL Editor"
  4. Copy this ENTIRE file and paste it
  5. Click "Run" to execute

  This will:
  - Drop all existing tables
  - Create correct schema
  - Disable RLS on auth tables
  - Insert test data with correct passwords
*/

-- ============================================
-- STEP 1: DROP ALL EXISTING TABLES
-- ============================================
DROP TABLE IF EXISTS marks_history CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS teacher_assignments CASCADE;
DROP TABLE IF EXISTS teacher_class_sections CASCADE;
DROP TABLE IF EXISTS class_teachers CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS gallery_images CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS class_sections CASCADE;
DROP TABLE IF EXISTS homework CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS book_issues CASCADE;
DROP TABLE IF EXISTS library_books CASCADE;
DROP TABLE IF EXISTS fee_records CASCADE;
DROP TABLE IF EXISTS timetable CASCADE;
DROP TABLE IF EXISTS admission_applications CASCADE;
DROP TABLE IF EXISTS neev_applications CASCADE;

-- Drop views and functions
DROP VIEW IF EXISTS teacher_subject_access CASCADE;
DROP VIEW IF EXISTS student_latest_exam_summary CASCADE;
DROP FUNCTION IF EXISTS can_teacher_manage_student CASCADE;
DROP FUNCTION IF EXISTS get_student_exam_marks CASCADE;
DROP FUNCTION IF EXISTS get_subjects_for_class CASCADE;
DROP FUNCTION IF EXISTS get_latest_exam_percentage CASCADE;
DROP FUNCTION IF EXISTS get_teacher_class_sections CASCADE;
DROP FUNCTION IF EXISTS get_teacher_formatted_classes CASCADE;

-- ============================================
-- STEP 2: CREATE CLASS SECTIONS TABLE
-- ============================================
CREATE TABLE class_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_section text UNIQUE NOT NULL,
  class_number integer NOT NULL,
  section text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- STEP 3: CREATE STUDENTS TABLE
-- ============================================
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  dob text,
  blood_group text,
  class_section text NOT NULL,
  father_name text,
  mother_name text,
  address text,
  profile_photo text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- STEP 4: CREATE TEACHERS TABLE
-- ============================================
CREATE TABLE teachers (
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

-- ============================================
-- STEP 5: CREATE ADMINS TABLE
-- ============================================
CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- STEP 6: CREATE TEACHER ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE teacher_class_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
  class_section text NOT NULL,
  subject text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, class_section, subject)
);

-- ============================================
-- STEP 7: CREATE CLASS TEACHERS TABLE
-- ============================================
CREATE TABLE class_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_section text UNIQUE NOT NULL,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- STEP 8: CREATE OTHER TABLES
-- ============================================
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

CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  section text NOT NULL,
  academic_year text NOT NULL DEFAULT '2024-2025',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, section, academic_year)
);

CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  applicable_from_class integer DEFAULT 1,
  applicable_to_class integer DEFAULT 12,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id),
  subject_id uuid REFERENCES subjects(id),
  marks_obtained numeric NOT NULL DEFAULT 0,
  total_marks numeric NOT NULL DEFAULT 100,
  exam_type text NOT NULL DEFAULT 'PA1',
  exam_date date DEFAULT CURRENT_DATE,
  remarks text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- STEP 9: CREATE INDEXES
-- ============================================
CREATE INDEX idx_students_admission_id ON students(admission_id);
CREATE INDEX idx_students_class_section ON students(class_section);
CREATE INDEX idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_teacher_class_sections_teacher ON teacher_class_sections(teacher_id);
CREATE INDEX idx_class_teachers_class_section ON class_teachers(class_section);

-- ============================================
-- STEP 10: DISABLE RLS ON AUTH TABLES
-- ============================================
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_class_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE notices DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE marks DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 11: INSERT CLASS SECTIONS DATA
-- ============================================
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
  ('10-A', 10, 'A'), ('10-B', 10, 'B'), ('10-C', 10, 'C'), ('10-NEEV', 10, 'NEEV');

-- ============================================
-- STEP 12: INSERT TEST ADMIN
-- Password: 123 -> base64: MTIz
-- ============================================
INSERT INTO admins (email, password, name, role)
VALUES ('h@gmail.com', 'MTIz', 'Himanshu', 'admin');

-- ============================================
-- STEP 13: INSERT TEST STUDENT
-- Password: 123 -> base64: MTIz
-- ============================================
INSERT INTO students (
  admission_id,
  password,
  name,
  email,
  class_section,
  dob,
  blood_group,
  father_name,
  mother_name,
  address,
  phone,
  profile_photo,
  status
) VALUES (
  'himanshu123',
  'MTIz',
  'Himanshu Yadav',
  'himanshu@example.com',
  '9-A',
  '2008-05-15',
  'O+',
  'Mr. Yadav',
  'Mrs. Yadav',
  'Delhi, India',
  '9876543210',
  '/data/images/himanshu123.jpg',
  'active'
);

-- ============================================
-- STEP 14: INSERT TEST TEACHER
-- Password: abc -> base64: YWJj
-- ============================================
INSERT INTO teachers (
  teacher_id,
  password,
  name,
  email,
  phone,
  status
) VALUES (
  'Avinash',
  'YWJj',
  'Avinash Kumar',
  'avinash@example.com',
  '9876543210',
  'active'
);

-- ============================================
-- STEP 15: ASSIGN TEACHER TO CLASSES
-- ============================================
DO $$
DECLARE
  teacher_uuid uuid;
BEGIN
  SELECT id INTO teacher_uuid FROM teachers WHERE teacher_id = 'Avinash';

  IF teacher_uuid IS NOT NULL THEN
    -- Assign teacher to class sections and subjects
    INSERT INTO teacher_class_sections (teacher_id, class_section, subject)
    VALUES
      (teacher_uuid, '9-A', 'Maths'),
      (teacher_uuid, '9-B', 'Maths'),
      (teacher_uuid, '10-A', 'Maths');

    -- Make teacher the class teacher of 9-A
    INSERT INTO class_teachers (class_section, teacher_id)
    VALUES ('9-A', teacher_uuid);
  END IF;
END $$;

-- ============================================
-- STEP 16: INSERT CLASSES
-- ============================================
DO $$
DECLARE
  class_num integer;
  section_name text;
BEGIN
  FOR class_num IN 1..8 LOOP
    FOREACH section_name IN ARRAY ARRAY['A', 'B', 'C']
    LOOP
      INSERT INTO classes (name, section, academic_year)
      VALUES (class_num::text, section_name, '2024-2025');
    END LOOP;
  END LOOP;

  FOR class_num IN 9..10 LOOP
    FOREACH section_name IN ARRAY ARRAY['A', 'B', 'C', 'NEEV']
    LOOP
      INSERT INTO classes (name, section, academic_year)
      VALUES (class_num::text, section_name, '2024-2025');
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- STEP 17: INSERT SUBJECTS
-- ============================================
INSERT INTO subjects (name, code, applicable_from_class, applicable_to_class)
VALUES
  ('Hindi', 'HINDI', 1, 12),
  ('English', 'ENG', 1, 12),
  ('Maths', 'MATH', 1, 12),
  ('EVS', 'EVS', 1, 5),
  ('Computer', 'COMP', 1, 8),
  ('S.St', 'SST', 6, 10),
  ('Science', 'SCI', 6, 10),
  ('AI', 'AI', 9, 12);

-- ============================================
-- STEP 18: VERIFICATION QUERIES
-- ============================================
-- Check if data was inserted correctly
SELECT 'Admin Check' as check_type, email, name FROM admins WHERE email = 'h@gmail.com'
UNION ALL
SELECT 'Student Check', admission_id, name FROM students WHERE admission_id = 'himanshu123'
UNION ALL
SELECT 'Teacher Check', teacher_id, name FROM teachers WHERE teacher_id = 'Avinash';

-- Check teacher assignments
SELECT
  t.name as teacher_name,
  tcs.class_section,
  tcs.subject
FROM teacher_class_sections tcs
JOIN teachers t ON t.id = tcs.teacher_id;

-- Check class teachers
SELECT
  ct.class_section,
  t.name as class_teacher_name
FROM class_teachers ct
JOIN teachers t ON t.id = ct.teacher_id;

-- ============================================
-- DONE!
-- ============================================
-- You should now be able to log in with:
-- Admin: h@gmail.com / 123
-- Student: himanshu123 / 123
-- Teacher: Avinash / abc
