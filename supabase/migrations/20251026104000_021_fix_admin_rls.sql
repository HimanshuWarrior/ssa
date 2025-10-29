-- Fix RLS policies for admins table to allow proper authentication

-- First, ensure RLS is enabled on admins table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Anyone can read admins" ON admins;
DROP POLICY IF EXISTS "Admins can manage admins" ON admins;

-- First disable RLS to ensure data is accessible
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- Insert data while RLS is disabled
DELETE FROM admins WHERE email = 'h@gmail.com';
INSERT INTO admins (email, password, name)
VALUES (
  'h@gmail.com',
  'MTIz',  -- This is base64 encoded '123'
  'Himanshu'
);

-- Now re-enable RLS and set up policies
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows EVERYONE to read the admins table
CREATE POLICY "Public can read admins"
  ON admins 
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Now let's reset our admin user with proper credentials
DELETE FROM admins WHERE email = 'h@gmail.com';

-- Insert with base64 encoded password ('123' encodes to 'MTIz')
INSERT INTO admins (email, password, name)
VALUES (
  'h@gmail.com',
  'MTIz',  -- This is base64 encoded '123'
  'Himanshu'
);

-- Verify the inserted data and RLS
-- First without RLS
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
SELECT id, email, substring(password for 10) as password_start, name 
FROM admins 
WHERE email = 'h@gmail.com';

-- Now with RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
SELECT id, email, substring(password for 10) as password_start, name 
FROM admins 
WHERE email = 'h@gmail.com';