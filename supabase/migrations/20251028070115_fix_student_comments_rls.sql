-- Add RLS policies for student_comments table
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'student_comments'
  ) THEN
    DROP POLICY IF EXISTS "Teachers can comment on their students" ON student_comments;
    DROP POLICY IF EXISTS "Admins can comment on any student" ON student_comments;
    DROP POLICY IF EXISTS "Students can view their own comments" ON student_comments;
    DROP POLICY IF EXISTS "Teachers can view comments on their students" ON student_comments;
    DROP POLICY IF EXISTS "Admins can view all comments" ON student_comments;
    DROP POLICY IF EXISTS "Allow anon read for student comments" ON student_comments;
    DROP POLICY IF EXISTS "Teachers and admins can update comments" ON student_comments;
    DROP POLICY IF EXISTS "Teachers and admins can delete comments" ON student_comments;
    DROP POLICY IF EXISTS "Students view own comments policy" ON student_comments;
    DROP POLICY IF EXISTS "Teachers and admins insert comments policy v2" ON student_comments;
    DROP POLICY IF EXISTS "Teachers and admins update comments policy v2" ON student_comments;
    DROP POLICY IF EXISTS "Teachers and admins delete comments policy v2" ON student_comments;
  END IF;
END $$;

-- Enable RLS on student_comments table if not already enabled
ALTER TABLE student_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for student_comments table
CREATE POLICY "Students view own comments policy"
  ON student_comments
  FOR SELECT
  TO authenticated
  USING (
    -- Students can see their own comments
    auth.uid()::uuid = student_id
    OR
    -- Teachers and admins can see all comments
    EXISTS (
      SELECT 1 FROM teachers WHERE auth.uid()::uuid = id
      UNION
      SELECT 1 FROM admins WHERE auth.uid()::uuid = id
    )
  );

CREATE POLICY "Teachers and admins insert comments policy v2"
  ON student_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Basic check that the user is inserting a comment with their own ID
    auth.uid()::uuid = commented_by
    AND
    (
      -- For teachers
      (
        EXISTS (SELECT 1 FROM teachers WHERE auth.uid()::uuid = id)
        AND 
        commenter_role = 'teacher'
        AND
        -- Check if the student belongs to teacher's class section
        EXISTS (
          SELECT 1
          FROM teacher_class_sections tcs
          WHERE tcs.teacher_id = auth.uid()::uuid
          AND tcs.class_section = (SELECT s.class_section FROM students s WHERE s.id = student_id)
        )
      )
      OR
      -- For admins
      (
        EXISTS (SELECT 1 FROM admins WHERE auth.uid()::uuid = id)
        AND 
        commenter_role = 'admin'
      )
    )
  );

CREATE POLICY "Teachers and admins update comments policy v2"
  ON student_comments
  FOR UPDATE
  TO authenticated
  USING (
    -- Can only update comments they created
    auth.uid()::uuid = commented_by
    AND
    EXISTS (
      SELECT 1 FROM teachers WHERE auth.uid()::uuid = id
      UNION
      SELECT 1 FROM admins WHERE auth.uid()::uuid = id
    )
  )
  WITH CHECK (
    -- Can only update comments they created
    auth.uid()::uuid = commented_by
    AND
    EXISTS (
      SELECT 1 FROM teachers WHERE auth.uid()::uuid = id
      UNION
      SELECT 1 FROM admins WHERE auth.uid()::uuid = id
    )
  );

CREATE POLICY "Teachers and admins delete comments policy v2"
  ON student_comments
  FOR DELETE
  TO authenticated
  USING (
    -- Can only delete comments they created
    auth.uid()::uuid = commented_by
    AND
    EXISTS (
      SELECT 1 FROM teachers WHERE auth.uid()::uuid = id
      UNION
      SELECT 1 FROM admins WHERE auth.uid()::uuid = id
    )
  );