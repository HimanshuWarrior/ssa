-- Add NEEV sections for classes 9 and 10
INSERT INTO classes (name, section, academic_year, class_section) 
VALUES 
  ('9', 'NEEV', '2025-2026', '9-NEEV'),
  ('10', 'NEEV', '2025-2026', '10-NEEV')
ON CONFLICT (name, section, academic_year) DO NOTHING;

-- Update existing classes with class_section if not already set
UPDATE classes 
SET class_section = name || '-' || section 
WHERE class_section IS NULL;