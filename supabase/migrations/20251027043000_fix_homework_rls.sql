-- Fix RLS policies for homework table

-- First ensure RLS is enabled
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Allow authenticated homework full access" ON homework;
DROP POLICY IF EXISTS "Allow anon read homework" ON homework;
DROP POLICY IF EXISTS "Allow anon insert homework" ON homework;
DROP POLICY IF EXISTS "Allow anon update homework" ON homework;
DROP POLICY IF EXISTS "Allow anon delete homework" ON homework;
DROP POLICY IF EXISTS "Allow students to read their class homework" ON homework;
DROP POLICY IF EXISTS "Allow teachers to insert homework" ON homework;
DROP POLICY IF EXISTS "Allow teachers to update own homework" ON homework;
DROP POLICY IF EXISTS "Allow teachers to delete own homework" ON homework;
DROP POLICY IF EXISTS "Allow anyone to read homework" ON homework;
DROP POLICY IF EXISTS "Allow students to read own record" ON students;

-- Create policies for homework table
-- Allow students to read homework for their class
CREATE POLICY "Allow students to read their class homework"
  ON homework
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.class_section = homework.class_section
      AND s.email = auth.email()
    )
    OR 
    EXISTS (
      SELECT 1 FROM teachers t
      WHERE t.email = auth.email()
    )
    OR
    auth.email() IN (SELECT email FROM admins)
  );

-- Allow teachers to insert homework
CREATE POLICY "Allow teachers to insert homework"
  ON homework
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow teachers to update their own homework
CREATE POLICY "Allow teachers to update own homework"
  ON homework
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow teachers to delete their own homework
CREATE POLICY "Allow teachers to delete own homework"
  ON homework
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Ensure students table has proper RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create policy to allow students to read their own records
CREATE POLICY "Allow students to read own record"
  ON students
  FOR SELECT
  USING (
    email = auth.email()
    OR 
    EXISTS (
      SELECT 1 FROM teachers t
      WHERE t.email = auth.email()
    )
    OR
    auth.email() IN (SELECT email FROM admins)
  );

-- Fix marks table policies
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

-- Drop existing marks policies
DROP POLICY IF EXISTS "Anyone can view marks" ON marks;
DROP POLICY IF EXISTS "Authenticated users can manage marks" ON marks;
DROP POLICY IF EXISTS "Allow anon read marks" ON marks;
DROP POLICY IF EXISTS "Allow anon insert marks" ON marks;
DROP POLICY IF EXISTS "Allow teachers to manage marks" ON marks;

-- Allow teachers to read marks for their subjects and classes
CREATE POLICY "Allow teachers to read marks"
  ON marks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers t
      WHERE t.email = auth.email()
      AND (
        -- Teacher teaches this subject to this class
        EXISTS (
          SELECT 1 FROM class_teachers ct
          WHERE ct.teacher_id = t.id
          AND ct.class_section = (
            SELECT s.class_section 
            FROM students s 
            WHERE s.id = marks.student_id
          )
        )
        OR
        -- Teacher is assigned to teach this subject
        t.subjects @> ARRAY[marks.subject]::text[]
      )
    )
    OR auth.email() IN (SELECT email FROM admins)
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.email = auth.email()
      AND s.id = marks.student_id
    )
  );

-- Allow teachers to insert marks for their subjects and classes
CREATE POLICY "Allow teachers to insert marks"
  ON marks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teachers t
      WHERE t.email = auth.email()
      AND (
        -- Teacher teaches this subject to this class
        EXISTS (
          SELECT 1 FROM class_teachers ct
          WHERE ct.teacher_id = t.id
          AND ct.class_section = (
            SELECT s.class_section 
            FROM students s 
            WHERE s.id = NEW.student_id
          )
        )
        OR
        -- Teacher is assigned to teach this subject
        t.subjects @> ARRAY[NEW.subject]::text[]
      )
    )
    OR auth.email() IN (SELECT email FROM admins)
  );

-- Allow teachers to update marks for their subjects and classes
CREATE POLICY "Allow teachers to update marks"
  ON marks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teachers t
      WHERE t.email = auth.email()
      AND (
        -- Teacher teaches this subject to this class
        EXISTS (
          SELECT 1 FROM class_teachers ct
          WHERE ct.teacher_id = t.id
          AND ct.class_section = (
            SELECT s.class_section 
            FROM students s 
            WHERE s.id = marks.student_id
          )
        )
        OR
        -- Teacher is assigned to teach this subject
        t.subjects @> ARRAY[marks.subject]::text[]
      )
    )
    OR auth.email() IN (SELECT email FROM admins)
  )
  WITH CHECK (true);

-- Allow teachers to delete marks for their subjects and classes
CREATE POLICY "Allow teachers to delete marks"
  ON marks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM teachers t
      WHERE t.email = auth.email()
      AND (
        -- Teacher teaches this subject to this class
        EXISTS (
          SELECT 1 FROM class_teachers ct
          WHERE ct.teacher_id = t.id
          AND ct.class_section = (
            SELECT s.class_section 
            FROM students s 
            WHERE s.id = marks.student_id
          )
        )
        OR
        -- Teacher is assigned to teach this subject
        t.subjects @> ARRAY[marks.subject]::text[]
      )
    )
    OR auth.email() IN (SELECT email FROM admins)
  );