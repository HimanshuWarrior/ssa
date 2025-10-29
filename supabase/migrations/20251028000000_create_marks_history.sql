-- Create marks_history table
CREATE TABLE IF NOT EXISTS marks_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type text NOT NULL,
  subject text NOT NULL,
  marks_obtained numeric NOT NULL,
  total_marks numeric NOT NULL,
  remarks text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE marks_history ENABLE ROW LEVEL SECURITY;

-- Allow students to view their own marks history
CREATE POLICY "Students can view their own marks history"
  ON marks_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

-- Allow teachers and admins to manage marks history
CREATE POLICY "Teachers and admins can manage marks history"
  ON marks_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND (u.raw_user_meta_data->>'role' IN ('teacher', 'admin'))
    )
  );

-- Create function to automatically record marks history
CREATE OR REPLACE FUNCTION record_marks_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO marks_history (
    student_id,
    exam_type,
    subject,
    marks_obtained,
    total_marks,
    remarks
  ) VALUES (
    NEW.student_id,
    NEW.exam_type,
    NEW.subject,
    NEW.marks_obtained,
    NEW.total_marks,
    NEW.remarks
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to record marks history on insert or update
DROP TRIGGER IF EXISTS record_marks_history_trigger ON marks;
CREATE TRIGGER record_marks_history_trigger
  AFTER INSERT OR UPDATE
  ON marks
  FOR EACH ROW
  EXECUTE FUNCTION record_marks_history();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS marks_history_student_id_idx ON marks_history(student_id);
CREATE INDEX IF NOT EXISTS marks_history_created_at_idx ON marks_history(created_at);

-- Add comment
COMMENT ON TABLE marks_history IS 'Records history of all marks changes for auditing and tracking purposes';