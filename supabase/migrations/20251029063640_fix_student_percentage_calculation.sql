/*
  # Fix Student Percentage Calculation
  
  1. Updates
    - Add function to calculate latest exam percentage for students
    - Update students table to store latest_percentage
    - Create trigger to auto-update percentage when marks are added
  
  2. Purpose
    - Enable accurate filtering of students by percentage in admin portal
    - Keep percentage data up-to-date automatically
*/

-- Function to calculate latest exam percentage for a student
CREATE OR REPLACE FUNCTION calculate_student_latest_percentage(student_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  latest_exam_type TEXT;
  total_obtained NUMERIC := 0;
  total_possible NUMERIC := 0;
  percentage NUMERIC := 0;
BEGIN
  -- Get the most recent exam type for this student
  SELECT exam_type INTO latest_exam_type
  FROM marks
  WHERE student_id = student_uuid
  ORDER BY exam_date DESC, created_at DESC
  LIMIT 1;

  IF latest_exam_type IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate total marks for the latest exam
  SELECT 
    COALESCE(SUM(marks_obtained), 0),
    COALESCE(SUM(total_marks), 0)
  INTO total_obtained, total_possible
  FROM marks
  WHERE student_id = student_uuid
    AND exam_type = latest_exam_type;

  -- Calculate percentage
  IF total_possible > 0 THEN
    percentage := ROUND((total_obtained / total_possible) * 100, 2);
  END IF;

  RETURN percentage;
END;
$$ LANGUAGE plpgsql;

-- Add latest_percentage column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'latest_percentage'
  ) THEN
    ALTER TABLE students ADD COLUMN latest_percentage NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Function to update student percentage after marks change
CREATE OR REPLACE FUNCTION update_student_percentage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE students
  SET latest_percentage = calculate_student_latest_percentage(NEW.student_id)
  WHERE id = NEW.student_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_student_percentage ON marks;

CREATE TRIGGER trigger_update_student_percentage
AFTER INSERT OR UPDATE ON marks
FOR EACH ROW
EXECUTE FUNCTION update_student_percentage();

-- Update all existing student percentages
UPDATE students
SET latest_percentage = calculate_student_latest_percentage(id);