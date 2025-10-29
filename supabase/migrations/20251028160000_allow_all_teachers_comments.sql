-- Drop existing policies
DROP POLICY IF EXISTS "insert_comments_policy" ON student_comments;
DROP POLICY IF EXISTS "view_comments_policy" ON student_comments;

-- Create new view policy
CREATE POLICY "view_comments_policy" 
  ON student_comments
  FOR SELECT
  TO authenticated
  USING (
    -- Students can see their own comments
    (
      CAST(student_id AS text) = REPLACE(CAST(auth.uid() AS text), '-', '')
    )
    OR
    -- All teachers can see all comments
    EXISTS (
      SELECT 1 FROM teachers 
      WHERE CAST(id AS text) = REPLACE(CAST(auth.uid() AS text), '-', '')
    )
    OR
    -- Admins can see all comments
    EXISTS (
      SELECT 1 FROM admins 
      WHERE CAST(id AS text) = REPLACE(CAST(auth.uid() AS text), '-', '')
    )
  );

-- Create new insert policy - Allow all teachers to comment on any student
CREATE POLICY "insert_comments_policy"
  ON student_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only allow if the user is inserting with their own auth.uid as commented_by
    CAST(commented_by_id AS text) = REPLACE(CAST(auth.uid() AS text), '-', '')
    AND
    (
      -- Any teacher can comment on any student
      (
        commenter_role = 'teacher'
        AND
        EXISTS (
          SELECT 1 FROM teachers 
          WHERE CAST(id AS text) = REPLACE(CAST(auth.uid() AS text), '-', '')
        )
      )
      OR
      -- Admins can comment on any student
      (
        commenter_role = 'admin'
        AND
        EXISTS (
          SELECT 1 FROM admins 
          WHERE CAST(id AS text) = REPLACE(CAST(auth.uid() AS text), '-', '')
        )
      )
    )
  );