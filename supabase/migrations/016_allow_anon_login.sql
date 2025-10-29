/*
  016_allow_anon_login.sql

  Add guarded policies to allow anonymous (anon) role to SELECT minimal data
  needed for authentication/login flows. These are idempotent checks and safe
  for re-running.
*/

-- Allow anon to read students (only for SELECT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'students' AND policyname = 'Allow anon to read students for login'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow anon to read students for login" ON students FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

-- Allow anon to read teachers (only for SELECT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'teachers' AND policyname = 'Allow anon to read teachers for login'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow anon to read teachers for login" ON teachers FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

-- Allow anon to read admins (only for SELECT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admins' AND policyname = 'Allow anon to read admins for login'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow anon to read admins for login" ON admins FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

-- Other lookups used during login: class_sections, teacher_class_sections, class_teachers, homework, marks, notices, gallery_images
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_sections') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'class_sections' AND policyname = 'Allow anon to view class sections') THEN
      EXECUTE 'CREATE POLICY "Allow anon to view class sections" ON class_sections FOR SELECT TO anon, authenticated USING (true)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_class_sections') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teacher_class_sections' AND policyname = 'Allow anon to view teacher class sections') THEN
      EXECUTE 'CREATE POLICY "Allow anon to view teacher class sections" ON teacher_class_sections FOR SELECT TO anon, authenticated USING (true)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_teachers') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'class_teachers' AND policyname = 'Allow anon to view class teachers') THEN
      EXECUTE 'CREATE POLICY "Allow anon to view class teachers" ON class_teachers FOR SELECT TO anon, authenticated USING (true)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'homework') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'homework' AND policyname = 'Allow anon to view homework') THEN
      EXECUTE 'CREATE POLICY "Allow anon to view homework" ON homework FOR SELECT TO anon, authenticated USING (true)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marks') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marks' AND policyname = 'Allow anon to view marks') THEN
      EXECUTE 'CREATE POLICY "Allow anon to view marks" ON marks FOR SELECT TO anon, authenticated USING (true)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notices') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notices' AND policyname = 'Allow anon to view active notices') THEN
      -- If the column `is_active` exists, use it in the policy, otherwise fall back to a permissive SELECT
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notices' AND column_name = 'is_active') THEN
        EXECUTE 'CREATE POLICY "Allow anon to view active notices" ON notices FOR SELECT TO anon, authenticated USING (is_active = true)';
      ELSE
        EXECUTE 'CREATE POLICY "Allow anon to view active notices" ON notices FOR SELECT TO anon, authenticated USING (true)';
      END IF;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gallery_images') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gallery_images' AND policyname = 'Allow anon to view active gallery images') THEN
      -- If the column `is_active` exists, use it in the policy, otherwise fall back to a permissive SELECT
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gallery_images' AND column_name = 'is_active') THEN
        EXECUTE 'CREATE POLICY "Allow anon to view active gallery images" ON gallery_images FOR SELECT TO anon, authenticated USING (is_active = true)';
      ELSE
        EXECUTE 'CREATE POLICY "Allow anon to view active gallery images" ON gallery_images FOR SELECT TO anon, authenticated USING (true)';
      END IF;
    END IF;
  END IF;
END $$;

-- End of migration
