/*
  # Add Subject Text Column to Marks Table
  
  1. Changes
    - Add subject column (text) to marks table for storing subject name
    - This supplements the subject_id foreign key
    - Allows easier querying and backward compatibility
  
  2. Purpose
    - Fix marks addition errors where subject name is needed
    - Maintain subject name for historical records
*/

-- Add subject column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marks' AND column_name = 'subject'
  ) THEN
    ALTER TABLE marks ADD COLUMN subject TEXT;
  END IF;
END $$;

-- Update existing marks with subject names from subjects table
UPDATE marks m
SET subject = s.name
FROM subjects s
WHERE m.subject_id = s.id
  AND m.subject IS NULL;