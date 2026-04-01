-- Task 15: Automated PII Scrubbing on Database Logs

-- Create a function to delete/scrub older logs to protect driver info
CREATE OR REPLACE FUNCTION scrub_stale_pii_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Anonymize payload columns older than 48 hours in notification logs
  UPDATE notification_logs
  SET payload = '{"scrubbed": true, "reason": "PII compliance policy"}'::jsonb
  WHERE created_at < NOW() - INTERVAL '48 hours'
  AND payload IS NOT NULL;
END;
$$;

-- Note: A pg_cron extension would typically call this nightly, 
-- e.g., SELECT cron.schedule('0 2 * * *', $$SELECT scrub_stale_pii_logs()$$);
