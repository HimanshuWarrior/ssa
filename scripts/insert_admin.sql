-- Script to insert h@gmail.com admin
-- Run this in Supabase SQL Editor

BEGIN;

-- First ensure email is normalized
UPDATE admins
SET email = lower(trim(email))
WHERE email IS NOT NULL;

-- Insert new admin with exact schema matching existing row
INSERT INTO admins (
  email,
  name,
  password,
  created_at,
  updated_at
)
VALUES (
  'h@gmail.com',
  'Himanshu',
  '123',  -- store raw password, let auth system handle encoding
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  updated_at = CURRENT_TIMESTAMP;

-- Verify the row exists and check password encoding
SELECT 
    id, 
    email, 
    name, 
    password,  -- Include password to verify encoding
    length(password) as pwd_length,  -- Check password length
    encode(password::bytea, 'base64') as password_base64,  -- Try converting to base64
    created_at, 
    updated_at
FROM admins
WHERE email = 'h@gmail.com';

COMMIT;