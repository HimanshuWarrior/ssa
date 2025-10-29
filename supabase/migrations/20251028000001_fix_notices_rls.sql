-- First disable RLS to clean up policies
ALTER TABLE notices DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow anon read notices" ON notices;
DROP POLICY IF EXISTS "Allow authenticated read notices" ON notices;
DROP POLICY IF EXISTS "Allow teachers manage notices" ON notices;
DROP POLICY IF EXISTS "Allow admins manage notices" ON notices;

-- Re-enable RLS
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Create new policies
-- Allow public read access to active notices
CREATE POLICY "Allow anon read notices" 
  ON notices 
  FOR SELECT 
  TO anon, authenticated 
  USING (is_active = true);

-- Allow teachers to manage notices
CREATE POLICY "Allow teachers manage notices"
  ON notices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teachers t
      WHERE t.email = auth.jwt()->>'email'
    )
  );

-- Allow admins to manage notices
CREATE POLICY "Allow admins manage notices"
  ON notices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.email = auth.jwt()->>'email'
    )
  );