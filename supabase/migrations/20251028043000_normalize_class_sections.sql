-- Migration: Normalize class_section values and add format constraints
-- Description: Standardizes class section formats, adds missing sections, and enforces consistent format

-- First, let's create a function to normalize class_section strings
CREATE OR REPLACE FUNCTION normalize_class_section(raw_section text)
RETURNS text AS $$
BEGIN
    -- Convert to uppercase, trim spaces, replace multiple spaces with single dash
    RETURN upper(regexp_replace(regexp_replace(trim(raw_section), '\s+', '-', 'g'), '-+', '-', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create an audit log table to track what we're doing
CREATE TABLE IF NOT EXISTS class_section_audit_log (
    id SERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    class_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create temp table for tracking deleted entries
CREATE TEMP TABLE deleted_classes (
    id UUID,
    name TEXT,
    section TEXT,
    class_section TEXT,
    academic_year TEXT
);

-- First ensure we have our NEEV sections
INSERT INTO classes (name, section, class_section, academic_year)
VALUES 
    ('8', 'NEEV', '8-NEEV', '2025-2026'),
    ('9', 'NEEV', '9-NEEV', '2025-2026'),
    ('10', 'NEEV', '10-NEEV', '2025-2026')
ON CONFLICT (name, section, academic_year) DO UPDATE 
SET class_section = EXCLUDED.class_section,
    updated_at = CURRENT_TIMESTAMP;

-- Log what we deleted
INSERT INTO class_section_audit_log (action, old_values)
SELECT 'DELETED_ENTRIES',
       jsonb_build_object(
         'id', id,
         'name', name,
         'section', section,
         'class_section', class_section,
         'academic_year', academic_year
       )
FROM deleted_classes;

-- Create snapshot of what exists after deletion
CREATE TEMP TABLE existing_classes AS
SELECT id, name, section, class_section, academic_year,
       normalize_class_section(class_section) as normalized_section
FROM classes
WHERE academic_year IN ('2025', '2025-2026');

-- Log remaining classes for debugging
INSERT INTO class_section_audit_log (action, old_values)
SELECT 'FOUND_EXISTING_AFTER_CLEANUP',
       jsonb_build_object(
         'id', id,
         'name', name,
         'section', section,
         'class_section', class_section,
         'academic_year', academic_year,
         'normalized_section', normalized_section
       )
FROM existing_classes;

-- Update academic year only where needed
UPDATE classes 
SET academic_year = '2025-2026',
    updated_at = CURRENT_TIMESTAMP
WHERE academic_year = '2025'
RETURNING id, name, section, class_section, academic_year;

-- Create a temp table of desired sections we might need to add
-- Log current state of the classes table
INSERT INTO class_section_audit_log (action, old_values)
SELECT 'PRE_INSERT_CHECK',
       jsonb_build_object(
         'name', name,
         'section', section,
         'class_section', class_section,
         'academic_year', academic_year
       )
FROM classes 
WHERE name = '9' AND upper(section) = 'NEEV' AND academic_year = '2025-2026';

CREATE TEMP TABLE desired_sections AS
WITH raw_sections AS (
    SELECT section FROM unnest(ARRAY[
        -- Standard sections for classes 1-7
        '1-A', '1-B', '1-C',
        '2-A', '2-B', '2-C',
        '3-A', '3-B', '3-C',
        '4-A', '4-B', '4-C',
        '5-A', '5-B', '5-C',
        '6-A', '6-B', '6-C',
        '7-A', '7-B', '7-C',
        -- Classes 8-10 with both standard and NEEV sections
        '8-A', '8-B', '8-C', '8-NEEV',
        '9-A', '9-B', '9-C', '9-NEEV',
        '10-A', '10-B', '10-C', '10-NEEV'
    ]) as section
)
SELECT DISTINCT
    d.section as full_section,
    split_part(d.section, '-', 1) as name,
    CASE 
        WHEN split_part(d.section, '-', 2) = 'NEEV' THEN 'NEEV'
        ELSE split_part(d.section, '-', 2)
    END as section,
    normalize_class_section(d.section) as normalized_section
FROM raw_sections d;

-- Identify truly missing sections by doing a careful comparison
CREATE TEMP TABLE sections_to_add AS
SELECT DISTINCT
    d.full_section,
    d.name,
    d.section,
    d.normalized_section
FROM desired_sections d
WHERE NOT EXISTS (
    SELECT 1 FROM existing_classes e
    WHERE e.normalized_section = d.normalized_section
    OR (e.name = d.name AND upper(e.section) = upper(d.section))
);

-- Log what we plan to add
INSERT INTO class_section_audit_log (action, new_values)
SELECT 'PLANNED_INSERT',
       jsonb_build_object(
         'name', name,
         'section', section,
         'class_section', full_section,
         'normalized_section', normalized_section
       )
FROM sections_to_add;

-- Log NEEV sections specifically before final check
INSERT INTO class_section_audit_log (action, old_values)
SELECT 'NEEV_SECTIONS_TO_ADD',
       jsonb_build_object(
         'name', name,
         'section', section,
         'class_section', full_section,
         'normalized_section', normalized_section
       )
FROM sections_to_add
WHERE upper(section) = 'NEEV';

-- Double-check for case-insensitive duplicates before insert
CREATE TEMP TABLE safe_sections_to_add AS
WITH neev_sections AS (
    -- First add all NEEV sections we want
    SELECT s.* FROM sections_to_add s
    WHERE upper(s.section) = 'NEEV'
    AND NOT EXISTS (
        SELECT 1 FROM classes c
        WHERE c.name = s.name
        AND upper(c.section) = 'NEEV'
        AND c.academic_year = '2025-2026'
    )
),
other_sections AS (
    -- Then add other sections
    SELECT s.* FROM sections_to_add s
    WHERE upper(s.section) != 'NEEV'
    AND NOT EXISTS (
        SELECT 1 FROM classes c
        WHERE c.name = s.name
        AND upper(c.section) = upper(s.section)
        AND c.academic_year = '2025-2026'
    )
)
SELECT * FROM neev_sections
UNION ALL
SELECT * FROM other_sections;

-- Log what we're actually going to insert
INSERT INTO class_section_audit_log (action, new_values)
SELECT 'FINAL_INSERT_CHECK',
       jsonb_build_object(
         'name', name,
         'section', section,
         'class_section', full_section,
         'normalized_section', normalized_section
       )
FROM safe_sections_to_add;

-- Insert only sections that we're absolutely sure don't exist
INSERT INTO classes (name, section, class_section, academic_year)
SELECT DISTINCT ON (name, section)
    name,
    section,
    full_section as class_section,
    '2025-2026' as academic_year
FROM safe_sections_to_add;

-- Add a check constraint to enforce the format going forward
ALTER TABLE classes DROP CONSTRAINT IF EXISTS class_section_format_check;
ALTER TABLE classes ADD CONSTRAINT class_section_format_check 
    CHECK (class_section ~ '^[0-9]{1,2}-[A-Z]+$');

-- Create a view to help find inconsistent class references
CREATE OR REPLACE VIEW inconsistent_class_sections AS
SELECT DISTINCT 
    s.class_name || '-' || s.section as student_class,
    c.class_section as matched_class,
    s.id as student_id,
    s.admission_id,
    s.name as student_name
FROM students s
LEFT JOIN classes c ON normalize_class_section(s.class_name || '-' || s.section) = normalize_class_section(c.class_section)
WHERE c.id IS NULL AND s.class_name IS NOT NULL AND s.section IS NOT NULL;

-- Function to help find the right class_id for a given class_section
CREATE OR REPLACE FUNCTION find_class_by_section(raw_section text)
RETURNS TABLE (
    id bigint,
    class_section text,
    match_type text
) AS $$
BEGIN
    -- Try exact match first
    RETURN QUERY
    SELECT c.id, c.class_section, 'exact'::text as match_type
    FROM classes c
    WHERE c.class_section = raw_section
    LIMIT 1;

    -- If no exact match, try normalized match
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT c.id, c.class_section, 'normalized'::text as match_type
        FROM classes c
        WHERE normalize_class_section(c.class_section) = normalize_class_section(raw_section)
        LIMIT 1;
    END IF;

    -- If still no match, try contains search on normalized strings
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT c.id, c.class_section, 'contains'::text as match_type
        FROM classes c
        WHERE 
            normalize_class_section(c.class_section) LIKE '%' || normalize_class_section(raw_section) || '%'
            OR normalize_class_section(raw_section) LIKE '%' || normalize_class_section(c.class_section) || '%'
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Example usage of the helper function:
-- SELECT * FROM find_class_by_section('9-neev');
-- SELECT * FROM find_class_by_section('9 NEEV');
-- SELECT * FROM find_class_by_section('9-A');

COMMENT ON FUNCTION normalize_class_section IS 'Standardizes class section format: uppercase, single dash between parts';
COMMENT ON FUNCTION find_class_by_section IS 'Finds matching class_id by section name, trying exact, normalized, and contains matches';
COMMENT ON VIEW inconsistent_class_sections IS 'Shows students whose class/section combination does not match any class_section';