-- Drop existing policies
DO $$ 
BEGIN
  -- Drop all existing policies on student_comments
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

-- Ensure RLS is enabled
ALTER TABLE student_comments ENABLE ROW LEVEL SECURITY;

-- Create new unified policies

-- View policy - Students can view their own comments, Teachers and Admins can view comments based on their role
CREATE POLICY "view_comments_policy" 
  ON student_comments
  FOR SELECT
  TO authenticated
  USING (
    -- Students can see their own comments
    (auth.uid() IS NOT NULL AND student_id = (auth.uid())::uuid)
    OR
    -- Teachers can see comments for students in their classes
    (
      EXISTS (
        SELECT 1 FROM teachers 
        WHERE id = (auth.uid())::uuid
      )
      AND
      EXISTS (
        SELECT 1 
        FROM teacher_class_sections tcs
        JOIN students s ON s.class_section = tcs.class_section
        WHERE tcs.teacher_id = (auth.uid())::uuid
        AND s.id = student_id
      )
    )
    OR
    -- Admins can see all comments
    EXISTS (
      SELECT 1 FROM admins 
      WHERE id = (auth.uid())::uuid
    )
  );

-- Insert policy - Teachers and Admins can add comments
CREATE POLICY "insert_comments_policy"
  ON student_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only allow if the user is inserting with their own auth.uid as commented_by
    commented_by = (auth.uid())::uuid
    AND
    (
      -- Teachers can only comment on their students
      (
        commenter_role = 'teacher'
        AND
        EXISTS (
          SELECT 1 FROM teachers 
          WHERE id = (auth.uid())::uuid
        )
        AND
        EXISTS (
          SELECT 1 
          FROM teacher_class_sections tcs
          JOIN students s ON s.class_section = tcs.class_section
          WHERE tcs.teacher_id = (auth.uid())::uuid
          AND s.id = student_id
        )
      )
      OR
      -- Admins can comment on any student
      (
        commenter_role = 'admin'
        AND
        EXISTS (
          SELECT 1 FROM admins 
          WHERE id = (auth.uid())::uuid
        )
      )
    )
  );

-- Update policy - Users can only update their own comments
CREATE POLICY "update_comments_policy"
  ON student_comments
  FOR UPDATE
  TO authenticated
  USING (
    -- Can only update own comments
    commented_by = (auth.uid())::uuid
  )
  WITH CHECK (
    -- Can't change the comment ownership or student
    commented_by = (auth.uid())::uuid
    AND
    student_id = OLD.student_id
    AND
    commenter_role = OLD.commenter_role
  );

-- Delete policy - Users can only delete their own comments
CREATE POLICY "delete_comments_policy"
  ON student_comments
  FOR DELETE
  TO authenticated
  USING (
    -- Can only delete own comments
    commented_by = (auth.uid())::uuid
  );