/*
  # Auto-delete old comments
  
  1. Function
    - Creates a function to delete comments older than 10 days
    - Can be called manually or via scheduled job
  
  2. Purpose
    - Automatically clean up old comments after 10 days
    - Keep the comments table manageable
*/

-- Function to delete comments older than 10 days
CREATE OR REPLACE FUNCTION delete_old_comments()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM student_comments
    WHERE created_at < NOW() - INTERVAL '10 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run daily (if pg_cron is available)
-- Note: This requires pg_cron extension which may not be available in all Supabase plans
-- If not available, the function can be called manually or via edge function

DO $$
BEGIN
  -- Check if pg_cron extension exists
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Schedule the job to run daily at midnight
    PERFORM cron.schedule(
      'delete-old-comments',
      '0 0 * * *',
      'SELECT delete_old_comments();'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- pg_cron not available, skip scheduling
    NULL;
END $$;