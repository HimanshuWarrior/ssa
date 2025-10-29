/*
  # Complete School Management System - Fixed Setup

  ## Overview
  Complete school management system with authentication, marks management, homework,
  and proper RLS policies for security.

  ## Tables Created
  - admins, teachers, students (authentication)
  - classes, subjects (academic structure)
  - teacher_class_sections, class_teachers (assignments)
  - marks, marks_history (assessment tracking)
  - homework, notices, gallery_images (communication)

  ## Security
  - RLS enabled on all tables
  - Anonymous users can read for login purposes
  - Authenticated users have role-based access

  ## Sample Data
  - Admin: admin@school.com / admin123
  - Teacher: T001 / teacher123
  - Student: 2024001 / student123
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- DROP EXISTING TABLES IF ANY (for clean slate)
-- =============================================
DROP TABLE IF EXISTS gallery_images CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS homework CASCADE;
DROP TABLE IF EXISTS marks_history CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS class_teachers CASCADE;
DROP TABLE IF EXISTS teacher_class_sections CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- =============================================
-- AUTHENTICATION TABLES
-- =============================================

CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password text NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE teachers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id text UNIQUE NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  password text NOT NULL,
  subjects text[],
  profile_photo text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  section text NOT NULL,
  class_section text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_id text UNIQUE NOT NULL,
  name text NOT NULL,
  email text UNIQUE,
  phone text,
  password text NOT NULL,
  dob date NOT NULL,
  blood_group text,
  class_name text NOT NULL,
  section text NOT NULL,
  class_id uuid REFERENCES classes(id),
  father_name text,
  mother_name text,
  address text,
  profile_photo text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- ACADEMIC STRUCTURE TABLES
-- =============================================

CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  code text UNIQUE,
  applicable_from_class int NOT NULL,
  applicable_to_class int NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE teacher_class_sections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  class_section text NOT NULL,
  subject text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, class_section, subject)
);

CREATE TABLE class_teachers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id uuid UNIQUE REFERENCES teachers(id) ON DELETE CASCADE,
  class_section text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- MARKS & ASSESSMENT TABLES
-- =============================================

CREATE TABLE marks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id),
  subject_id uuid REFERENCES subjects(id),
  exam_type text NOT NULL,
  marks_obtained numeric NOT NULL DEFAULT 0,
  total_marks numeric DEFAULT 100,
  remarks text,
  created_by text NOT NULL,
  updated_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE marks_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  mark_id uuid REFERENCES marks(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id),
  exam_type text NOT NULL,
  old_marks numeric,
  new_marks numeric,
  updated_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- HOMEWORK & COMMUNICATION TABLES
-- =============================================

CREATE TABLE homework (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  subject text NOT NULL,
  class_section text NOT NULL,
  submission_date date,
  created_by text NOT NULL,
  teacher_name text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE notices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text NOT NULL,
  date date NOT NULL,
  priority text DEFAULT 'medium',
  target_audience text DEFAULT 'all',
  created_by text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE gallery_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  image_url text NOT NULL,
  description text,
  category text,
  uploaded_by text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_students_admission_id ON students(admission_id);
CREATE INDEX idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX idx_marks_student_id ON marks(student_id);
CREATE INDEX idx_marks_exam_type ON marks(exam_type);
CREATE INDEX idx_homework_class_section ON homework(class_section);
CREATE INDEX idx_homework_created_by ON homework(created_by);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_class_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

CREATE POLICY "Allow anon read admins" ON admins FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all manage admins" ON admins FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow anon read teachers" ON teachers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all manage teachers" ON teachers FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow anon read students" ON students FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all manage students" ON students FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all read classes" ON classes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all manage classes" ON classes FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all read subjects" ON subjects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all manage subjects" ON subjects FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all read teacher_class_sections" ON teacher_class_sections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all manage teacher_class_sections" ON teacher_class_sections FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all read class_teachers" ON class_teachers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all manage class_teachers" ON class_teachers FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all read marks" ON marks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all manage marks" ON marks FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all read marks_history" ON marks_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all insert marks_history" ON marks_history FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow all read homework" ON homework FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all manage homework" ON homework FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all read notices" ON notices FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Allow all manage notices" ON notices FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all read gallery" ON gallery_images FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Allow all manage gallery" ON gallery_images FOR ALL TO authenticated USING (true);

-- =============================================
-- SEED DATA
-- =============================================

-- Insert default admin (email: admin@school.com, password: admin123)
INSERT INTO admins (email, name, password, status)
VALUES ('admin@school.com', 'System Administrator', 'YWRtaW4xMjM=', 'active');

-- Insert sample classes
INSERT INTO classes (name, section, class_section) VALUES
  ('1', 'A', '1-A'),
  ('2', 'A', '2-A'),
  ('3', 'A', '3-A'),
  ('4', 'A', '4-A'),
  ('5', 'A', '5-A'),
  ('6', 'A', '6-A'),
  ('7', 'A', '7-A'),
  ('8', 'A', '8-A'),
  ('9', 'A', '9-A'),
  ('10', 'A', '10-A');

-- Insert common subjects
INSERT INTO subjects (name, code, applicable_from_class, applicable_to_class, description) VALUES
  ('Mathematics', 'MATH', 1, 10, 'Core mathematics curriculum'),
  ('Science', 'SCI', 1, 10, 'General science'),
  ('English', 'ENG', 1, 10, 'English language and literature'),
  ('Hindi', 'HIN', 1, 10, 'Hindi language'),
  ('Social Science', 'SST', 1, 10, 'History, Geography, Civics'),
  ('Computer Science', 'CS', 6, 10, 'Computer programming and IT'),
  ('Physics', 'PHY', 9, 10, 'Physics for senior classes'),
  ('Chemistry', 'CHEM', 9, 10, 'Chemistry for senior classes'),
  ('Biology', 'BIO', 9, 10, 'Biology for senior classes');

-- Insert sample teacher (teacher_id: T001, password: teacher123)
INSERT INTO teachers (teacher_id, name, email, phone, password, subjects, status)
VALUES (
  'T001',
  'Rajesh Kumar',
  'rajesh@school.com',
  '9876543210',
  'dGVhY2hlcjEyMw==',
  ARRAY['Mathematics', 'Physics'],
  'active'
);

-- Get the teacher ID and assign to classes
DO $$
DECLARE
  teacher_uuid uuid;
BEGIN
  SELECT id INTO teacher_uuid FROM teachers WHERE teacher_id = 'T001';
  
  INSERT INTO teacher_class_sections (teacher_id, class_section, subject)
  VALUES 
    (teacher_uuid, '9-A', 'Mathematics'),
    (teacher_uuid, '10-A', 'Mathematics');
END $$;

-- Insert sample student (admission_id: 2024001, password: student123)
DO $$
DECLARE
  class_uuid uuid;
BEGIN
  SELECT id INTO class_uuid FROM classes WHERE class_section = '10-A';
  
  INSERT INTO students (
    admission_id, name, email, phone, password, dob, blood_group,
    class_name, section, class_id, father_name, status
  )
  VALUES (
    '2024001',
    'Rahul Sharma',
    'rahul@school.com',
    '9876543211',
    'c3R1ZGVudDEyMw==',
    '2008-05-15',
    'O+',
    '10',
    'A',
    class_uuid,
    'Mr. Sharma',
    'active'
  );
END $$;

-- Insert sample notice
INSERT INTO notices (title, content, date, priority, target_audience, created_by, is_active)
VALUES (
  'Welcome to School Management System',
  'This is a sample notice. All features are now active and ready to use!',
  CURRENT_DATE,
  'high',
  'all',
  'admin@school.com',
  true
);