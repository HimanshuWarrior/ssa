-- Migration: normalize admin emails and ensure test admin exists
-- Run in Supabase SQL editor or as part of migrations
BEGIN;

-- Trim and lowercase all admin emails to normalize values for lookups
UPDATE admins
SET email = lower(trim(email))
WHERE email IS NOT NULL;

-- Ensure test admin exists with base64('123') = 'MTIz'
INSERT INTO admins (email, password, name, role)
VALUES ('h@gmail.com', 'MTIz', 'Himanshu', 'admin')
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = COALESCE(admins.role, EXCLUDED.role);

COMMIT;
