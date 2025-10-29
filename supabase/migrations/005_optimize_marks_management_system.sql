/*
  # Optimize Marks Management System

  ## Overview
  This migration adds optimizations and helper views for the marks management system.

  ## Changes Made

  1. **Helper Views**
     - `teacher_subject_access`: View to check teacher permissions for subjects/classes
     - `student_latest_exam_summary`: View for student's latest exam performance

  2. **Additional Indexes**
     - Composite indexes for faster queries
     - Index on marks updated_at for performance

  3. **Helper Functions**
     - Function to check if teacher can manage student marks
     - Function to get student's current marks for an exam

  ## Benefits
  - Faster permission checks for teachers
  - Improved query performance
  - Easier to maintain permission logic
*/

-- =====================================================
-- CREATE HELPER VIEWS
-- =====================================================

-- View for teacher subject access
CREATE OR REPLACE VIEW teacher_subject_access AS
SELECT DISTINCT
    ta.teacher_id,
    ta.class_id,
    ta.subject_id,
    c.name as class_name,
    c.section as class_section,
    s.name as subject_name,
    s.code as subject_code
FROM teacher_assignments ta
JOIN classes c ON ta.class_id = c.id
JOIN subjects s ON ta.subject_id = s.id;

-- View for student's latest exam summary
CREATE OR REPLACE VIEW student_latest_exam_summary AS
WITH latest_exam AS (
    SELECT 
        student_id,
        exam_type,
        MAX(updated_at) as last_update
    FROM marks
    GROUP BY student_id, exam_type
),
ranked_exams AS (
    SELECT 
        student_id,
        exam_type,
        last_update,
        ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY last_update DESC) as rn
    FROM latest_exam
)
SELECT 
    re.student_id,
    re.exam_type as latest_exam_type,
    re.last_update,
    SUM(m.marks_obtained) as total_obtained,
    SUM(m.total_marks) as total_marks,
    ROUND((SUM(m.marks_obtained) / SUM(m.total_marks) * 100)::numeric, 2) as percentage
FROM ranked_exams re
JOIN marks m ON m.student_id = re.student_id AND m.exam_type = re.exam_type
WHERE re.rn = 1
GROUP BY re.student_id, re.exam_type, re.last_update;

-- =====================================================
-- CREATE ADDITIONAL INDEXES
-- =====================================================

-- Composite index for faster teacher permission checks
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_composite 
ON teacher_assignments(teacher_id, class_id, subject_id);

-- Index on marks updated_at for performance
CREATE INDEX IF NOT EXISTS idx_marks_updated_at 
ON marks(updated_at DESC);

-- Index for student + exam type combination
CREATE INDEX IF NOT EXISTS idx_marks_student_exam 
ON marks(student_id, exam_type);

-- =====================================================
-- CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to check if teacher can manage marks for a student
CREATE OR REPLACE FUNCTION can_teacher_manage_student(
    p_teacher_id uuid,
    p_student_id uuid
)
RETURNS boolean AS $$
DECLARE
    student_class_id uuid;
    has_access boolean;
BEGIN
    -- Get student's class
    SELECT class_id INTO student_class_id
    FROM students
    WHERE id = p_student_id;

    -- Check if teacher has assignment for this class
    SELECT EXISTS(
        SELECT 1
        FROM teacher_assignments
        WHERE teacher_id = p_teacher_id
        AND class_id = student_class_id
    ) INTO has_access;

    RETURN has_access;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get student's marks for a specific exam
CREATE OR REPLACE FUNCTION get_student_exam_marks(
    p_student_id uuid,
    p_exam_type text
)
RETURNS TABLE(
    subject_id uuid,
    subject_name text,
    subject_code text,
    marks_obtained numeric,
    total_marks numeric,
    remarks text,
    percentage numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as subject_id,
        s.name as subject_name,
        s.code as subject_code,
        COALESCE(m.marks_obtained, 0) as marks_obtained,
        COALESCE(m.total_marks, 100) as total_marks,
        m.remarks,
        ROUND((COALESCE(m.marks_obtained, 0) / COALESCE(m.total_marks, 100) * 100)::numeric, 2) as percentage
    FROM subjects s
    LEFT JOIN marks m ON m.subject_id = s.id 
        AND m.student_id = p_student_id 
        AND m.exam_type = p_exam_type
    JOIN students st ON st.id = p_student_id
    WHERE CAST(st.class_name AS integer) >= s.applicable_from_class
        AND CAST(st.class_name AS integer) <= s.applicable_to_class
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- GRANT PERMISSIONS ON VIEWS
-- =====================================================

-- Grant access to views for all users
GRANT SELECT ON teacher_subject_access TO anon, authenticated;
GRANT SELECT ON student_latest_exam_summary TO anon, authenticated;