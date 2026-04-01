-- Task 15: Automated 'Dormancy' Re-activation 
-- Calculate drivers who haven't accepted loads in 14 days and flag them

CREATE OR REPLACE FUNCTION compute_dormancy_and_missed_revenue()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Insert into a generic 'reactivation_queue' table for the Edge Function to ping
  INSERT INTO reactivation_queue (user_id, missed_jobs, total_missed_value)
  SELECT 
    p.id, 
    COUNT(j.id) as missed_jobs,
    SUM(j.rate_offered) as total_missed_value
  FROM profiles p
  JOIN jobs j ON j.created_at > (NOW() - INTERVAL '14 days')
  -- Mock condition: operator was eligible but didn't accept
  WHERE p.claim_state = 'dispatch_eligible'
    AND p.updated_at < (NOW() - INTERVAL '14 days')
  GROUP BY p.id;
END;
$$;
