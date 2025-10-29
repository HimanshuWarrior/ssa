-- Fix marks_history foreign key for student_id to reference students(id) instead of auth/users

BEGIN;

-- Drop existing foreign key if it references the wrong table
ALTER TABLE IF EXISTS public.marks_history
  DROP CONSTRAINT IF EXISTS marks_history_student_id_fkey;

-- Add correct FK referencing students(id)
ALTER TABLE IF EXISTS public.marks_history
  ADD CONSTRAINT marks_history_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

COMMIT;
