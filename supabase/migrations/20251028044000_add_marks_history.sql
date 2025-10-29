-- Create marks_history table for tracking mark changes
CREATE TABLE IF NOT EXISTS public.marks_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id),
    marks_obtained NUMERIC(5,2),
    total_marks NUMERIC(5,2),
    subject TEXT,
    exam_type TEXT,
    academic_year TEXT,
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marks_history_student_id ON public.marks_history(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_history_created_at ON public.marks_history(created_at);

-- Add RLS policies
ALTER TABLE public.marks_history ENABLE ROW LEVEL SECURITY;

-- Teachers can see marks history for their students
CREATE POLICY "Teachers can view marks history for their students"
    ON public.marks_history
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = marks_history.student_id
            AND EXISTS (
                SELECT 1 FROM public.teachers t
                WHERE t.user_id = auth.uid()
                AND (t.class_section = s.class_section OR t.additional_sections ? s.class_section)
            )
        )
    );

-- Admin can see all marks history
CREATE POLICY "Admin can view all marks history"
    ON public.marks_history
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- Students can see their own marks history
CREATE POLICY "Students can view their own marks history"
    ON public.marks_history
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = marks_history.student_id
            AND s.user_id = auth.uid()
        )
    );

-- Function to automatically record marks history
CREATE OR REPLACE FUNCTION public.record_marks_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.marks_history (
        student_id,
        marks_obtained,
        total_marks,
        subject,
        exam_type,
        academic_year,
        updated_by
    ) VALUES (
        NEW.student_id,
        NEW.marks_obtained,
        NEW.total_marks,
        NEW.subject,
        NEW.exam_type,
        NEW.academic_year,
        auth.uid()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to record marks history on insert or update
DROP TRIGGER IF EXISTS trg_record_marks_history ON public.marks;
CREATE TRIGGER trg_record_marks_history
    AFTER INSERT OR UPDATE
    ON public.marks
    FOR EACH ROW
    EXECUTE FUNCTION public.record_marks_history();

-- Comment on table
COMMENT ON TABLE public.marks_history IS 'History of mark changes for tracking and auditing';