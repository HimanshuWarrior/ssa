-- Fix RLS policies for teachers table to allow admin management

-- First, ensure RLS is enabled on teachers table
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view teachers" ON teachers;
DROP POLICY IF EXISTS "Admins can manage teachers" ON teachers;
DROP POLICY IF EXISTS "Teachers can update own data" ON teachers;

-- Allow any authenticated user to view teachers (needed for login)
CREATE POLICY "Anyone can view teachers"
  ON teachers FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage teachers
CREATE POLICY "Admins can manage teachers"
  ON teachers FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.email = auth.jwt()->>'email'
  ));

-- Allow teachers to update their own data
CREATE POLICY "Teachers can update own data"
  ON teachers FOR UPDATE
  TO authenticated
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);