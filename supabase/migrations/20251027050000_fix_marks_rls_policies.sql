-- Drop existing policies for marks table
DROP POLICY IF EXISTS "Allow teachers to insert marks" ON marks;
DROP POLICY IF EXISTS "Allow teachers to update marks" ON marks;
DROP POLICY IF EXISTS "Allow teachers to delete marks" ON marks;
DROP POLICY IF EXISTS "Allow teachers to read marks" ON marks;

-- Enable RLS on marks table if not already enabled
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

-- Allow teachers to read marks for their subjects and classes
CREATE POLICY "Allow teachers to read marks"
  ON marks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers t
      WHERE t.email = auth.email()
      AND (
        -- Teacher teaches this class
        EXISTS (
          SELECT 1 FROM teacher_class_sections tcs
          WHERE tcs.teacher_id = t.id
          AND tcs.class_section = (
            SELECT c.class_section
            FROM classes c
            WHERE c.id = marks.class_id
          )
        )
        OR
        -- Teacher is assigned to teach this subject
        EXISTS (
          SELECT 1 FROM subjects sub
          WHERE sub.id = marks.subject_id
          AND sub.code = ANY(t.subjects)
        )
        OR
        -- Or the mark was created by this teacher
        t.id = marks.created_by
      )
    )
    OR 
    -- Admins can read all marks
    auth.email() IN (SELECT email FROM admins)
  );

-- Allow teachers to insert marks
CREATE POLICY "Allow teachers to insert marks"
  ON marks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM teachers t
      WHERE t.email = auth.email()
      AND EXISTS (
        SELECT 1
        FROM teacher_class_sections tcs
        JOIN classes c ON c.class_section = tcs.class_section
        JOIN subjects s ON s.name = tcs.subject
        WHERE tcs.teacher_id = t.id
        AND c.id = class_id
        AND s.id = subject_id
      )
    )
    OR 
    -- Admins can insert marks
    auth.email() IN (SELECT email FROM admins)
  );

-- Add policy for updating marks
CREATE POLICY "Allow teachers to update marks"
  ON marks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM teachers t
      WHERE t.email = auth.email()
      AND (
        -- Can update if they created the mark
        t.id = created_by
        OR
        -- Can update if they teach this class
        EXISTS (
          SELECT 1 FROM teacher_class_sections tcs
          WHERE tcs.teacher_id = t.id
          AND tcs.class_section = (
            SELECT c.class_section
            FROM classes c
            WHERE c.id = class_id
          )
        )
      )
    )
    OR 
    auth.email() IN (SELECT email FROM admins)
  );