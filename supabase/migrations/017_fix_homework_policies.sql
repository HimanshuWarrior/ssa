-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop homework policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'homework'
  ) THEN
    DROP POLICY IF EXISTS "Anyone can manage homework" ON homework;
    DROP POLICY IF EXISTS "Teachers can manage homework" ON homework;
    DROP POLICY IF EXISTS "Anyone can view homework" ON homework;
  END IF;
END $$;

-- Enable RLS on homework table if not already enabled
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;

-- Create new policies for homework table
CREATE POLICY "Teachers can insert homework"
  ON homework
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teachers 
      WHERE id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Teachers can update own homework"
  ON homework
  FOR UPDATE
  TO authenticated
  USING (
    created_by::text = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM teachers 
      WHERE id = auth.uid() 
      AND status = 'active'
    )
  )
  WITH CHECK (
    created_by::text = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM teachers 
      WHERE id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Teachers can delete own homework"
  ON homework
  FOR DELETE
  TO authenticated
  USING (
    created_by::text = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM teachers 
      WHERE id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Anyone can view homework"
  ON homework
  FOR SELECT
  TO authenticated
  USING (true);

-- Create an index to speed up teacher lookups
CREATE INDEX IF NOT EXISTS idx_homework_created_by ON homework(created_by);