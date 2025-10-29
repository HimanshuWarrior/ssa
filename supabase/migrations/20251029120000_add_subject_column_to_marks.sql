-- Add subject (text) column to marks table so triggers referencing NEW.subject work

BEGIN;

ALTER TABLE public.marks
  ADD COLUMN IF NOT EXISTS subject text;

-- Backfill subject names from subjects table where possible
UPDATE public.marks m
SET subject = s.name
FROM public.subjects s
WHERE m.subject_id = s.id
  AND (m.subject IS NULL OR m.subject = '');

-- Create an index for faster lookups by subject name (optional)
CREATE INDEX IF NOT EXISTS idx_marks_subject_text ON public.marks(LOWER(subject));

COMMIT;
