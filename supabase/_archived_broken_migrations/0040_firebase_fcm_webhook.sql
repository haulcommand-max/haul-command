-- SUPABASE WEBHOOK TRIGGERS FOR FCM PUSH (Priority 2/3 Fixes)

-- Required pg_net extension if not active
-- create extension if not exists pg_net;

CREATE OR REPLACE FUNCTION notify_fcm_worker() 
RETURNS TRIGGER AS $$
BEGIN
  -- We assume execution via supabase edge function
  -- perform net.http_post('https://YOUR_PROJECT_ID.supabase.co/functions/v1/fcm-push-worker', ... 
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fcm_job_bid ON job_applications;
CREATE TRIGGER trg_fcm_job_bid
AFTER INSERT ON job_applications
FOR EACH ROW EXECUTE FUNCTION notify_fcm_worker();

DROP TRIGGER IF EXISTS trg_fcm_diagnostics ON hc_training_diagnostics;
CREATE TRIGGER trg_fcm_diagnostics
AFTER INSERT ON hc_training_diagnostics
FOR EACH ROW EXECUTE FUNCTION notify_fcm_worker();
