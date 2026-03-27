/**
 * Supabase → Autonomous System Webhook Bridge
 * 
 * This file contains the SQL and configuration needed to wire Supabase 
 * database triggers to the autonomous agent system via pg_net HTTP calls.
 * 
 * Deploy this by running the SQL in Supabase SQL Editor.
 * 
 * Flow: DB change → Postgres trigger → pg_net HTTP POST → /api/autonomous/handle-event → Agents
 */

-- ════════════════════════════════════════════════════════════════
-- 1. ENABLE pg_net EXTENSION (required for HTTP calls from Postgres)
-- ════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ════════════════════════════════════════════════════════════════
-- 2. CONFIGURATION: Set your production URL and secret
-- ════════════════════════════════════════════════════════════════
-- Store your config in a table so triggers can read it
CREATE TABLE IF NOT EXISTS hc_system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert your production values (UPDATE THESE)
INSERT INTO hc_system_config (key, value) VALUES 
  ('autonomous_url', 'https://haulcommand.com/api/autonomous/handle-event'),
  ('cron_secret', 'YOUR_CRON_SECRET_HERE')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ════════════════════════════════════════════════════════════════
-- 3. HELPER: Generic function to fire events to the autonomous system
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION fire_autonomous_event(
  event_type TEXT,
  event_payload JSONB
) RETURNS VOID AS $$
DECLARE
  api_url TEXT;
  api_secret TEXT;
BEGIN
  SELECT value INTO api_url FROM hc_system_config WHERE key = 'autonomous_url';
  SELECT value INTO api_secret FROM hc_system_config WHERE key = 'cron_secret';
  
  -- Fire async HTTP POST via pg_net (non-blocking)
  PERFORM net.http_post(
    url := api_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || api_secret
    ),
    body := jsonb_build_object(
      'event', event_type,
      'payload', event_payload,
      'source', 'supabase_trigger',
      'fired_at', now()::TEXT
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════
-- 4. TRIGGER: load.created — When a new load is inserted
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_load_created() RETURNS TRIGGER AS $$
BEGIN
  PERFORM fire_autonomous_event('load.created', jsonb_build_object(
    'load_id', NEW.id,
    'pickup_state', NEW.pickup_state,
    'delivery_state', NEW.delivery_state,
    'distance_miles', NEW.distance_miles,
    'rate_per_mile', NEW.rate_per_mile,
    'service_type', NEW.service_type,
    'broker_id', NEW.broker_id,
    'created_at', NEW.created_at::TEXT
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_load_created ON loads;
CREATE TRIGGER trg_load_created
  AFTER INSERT ON loads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_load_created();

-- ════════════════════════════════════════════════════════════════
-- 5. TRIGGER: load.cancelled — When a load status changes to cancelled
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_load_cancelled() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    PERFORM fire_autonomous_event('load.cancelled', jsonb_build_object(
      'load_id', NEW.id,
      'operator_id', NEW.operator_id,
      'broker_id', NEW.broker_id,
      'reason', NEW.cancel_reason
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_load_cancelled ON loads;
CREATE TRIGGER trg_load_cancelled
  AFTER UPDATE ON loads
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled')
  EXECUTE FUNCTION trigger_load_cancelled();

-- ════════════════════════════════════════════════════════════════
-- 6. TRIGGER: load.accepted — When an operator accepts a load
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_load_accepted() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    PERFORM fire_autonomous_event('load.accepted', jsonb_build_object(
      'load_id', NEW.id,
      'operator_id', NEW.operator_id,
      'broker_id', NEW.broker_id,
      'rate_per_mile', NEW.rate_per_mile,
      'accepted_at', now()::TEXT
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_load_accepted ON loads;
CREATE TRIGGER trg_load_accepted
  AFTER UPDATE ON loads
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION trigger_load_accepted();

-- ════════════════════════════════════════════════════════════════
-- 7. TRIGGER: job.completed — When a load status changes to completed
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_job_completed() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM fire_autonomous_event('job.completed', jsonb_build_object(
      'load_id', NEW.id,
      'operator_id', NEW.operator_id,
      'broker_id', NEW.broker_id,
      'rate_per_mile', NEW.rate_per_mile,
      'distance_miles', NEW.distance_miles,
      'is_late', (NEW.delivered_at > NEW.estimated_delivery_at),
      'completed_at', NEW.completed_at::TEXT
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_job_completed ON loads;
CREATE TRIGGER trg_job_completed
  AFTER UPDATE ON loads
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION trigger_job_completed();

-- ════════════════════════════════════════════════════════════════
-- 8. TRIGGER: operator.signup — When a new operator creates an account
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_operator_signup() RETURNS TRIGGER AS $$
BEGIN
  PERFORM fire_autonomous_event('operator.signup', jsonb_build_object(
    'operator_id', NEW.id,
    'email', NEW.email,
    'state', NEW.state,
    'insurance_coi_url', NEW.insurance_coi_url,
    'signed_up_at', NEW.created_at::TEXT
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_operator_signup ON provider_directory;
CREATE TRIGGER trg_operator_signup
  AFTER INSERT ON provider_directory
  FOR EACH ROW
  EXECUTE FUNCTION trigger_operator_signup();

-- ════════════════════════════════════════════════════════════════
-- 9. TRIGGER: broker.signup — When a new broker creates an account
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_broker_signup() RETURNS TRIGGER AS $$
BEGIN
  PERFORM fire_autonomous_event('broker.signup', jsonb_build_object(
    'broker_id', NEW.id,
    'company_name', NEW.company_name,
    'mc_number', NEW.mc_number,
    'signed_up_at', NEW.created_at::TEXT
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_broker_signup ON brokers;
CREATE TRIGGER trg_broker_signup
  AFTER INSERT ON brokers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_broker_signup();

-- ════════════════════════════════════════════════════════════════
-- 10. TRIGGER: payment.failed — When a payment fails
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_payment_failed() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    PERFORM fire_autonomous_event('payment.failed', jsonb_build_object(
      'payment_id', NEW.id,
      'broker_id', NEW.broker_id,
      'amount', NEW.amount,
      'currency', NEW.currency,
      'failed_at', now()::TEXT
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_payment_failed ON payments;
CREATE TRIGGER trg_payment_failed
  AFTER UPDATE ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'failed')
  EXECUTE FUNCTION trigger_payment_failed();

-- ════════════════════════════════════════════════════════════════
-- 11. TRIGGER: payment.received — When payment is confirmed
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_payment_received() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM fire_autonomous_event('payment.received', jsonb_build_object(
      'payment_id', NEW.id,
      'broker_id', NEW.broker_id,
      'operator_id', NEW.operator_id,
      'amount', NEW.amount,
      'currency', NEW.currency,
      'received_at', now()::TEXT
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_payment_received ON payments;
CREATE TRIGGER trg_payment_received
  AFTER UPDATE ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION trigger_payment_received();

-- ════════════════════════════════════════════════════════════════
-- 12. TRIGGER: escrow.disputed — When an escrow is disputed
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_escrow_disputed() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'disputed' AND OLD.status != 'disputed' THEN
    PERFORM fire_autonomous_event('escrow.disputed', jsonb_build_object(
      'escrow_id', NEW.id,
      'load_id', NEW.load_id,
      'broker_id', NEW.broker_id,
      'operator_id', NEW.operator_id,
      'amount', NEW.amount,
      'dispute_reason', NEW.dispute_reason,
      'disputed_at', now()::TEXT
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_escrow_disputed ON escrow;
CREATE TRIGGER trg_escrow_disputed
  AFTER UPDATE ON escrow
  FOR EACH ROW
  WHEN (NEW.status = 'disputed')
  EXECUTE FUNCTION trigger_escrow_disputed();

-- ════════════════════════════════════════════════════════════════
-- 13. TRIGGER: listing_claims — When an operator claims their listing
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_listing_claimed() RETURNS TRIGGER AS $$
BEGIN
  PERFORM fire_autonomous_event('operator.signup', jsonb_build_object(
    'operator_id', NEW.listing_id,
    'claim_id', NEW.id,
    'claim_status', NEW.claim_status,
    'claimed_at', NEW.claimed_at::TEXT
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_listing_claimed ON listing_claims;
CREATE TRIGGER trg_listing_claimed
  AFTER INSERT ON listing_claims
  FOR EACH ROW
  EXECUTE FUNCTION trigger_listing_claimed();

-- ════════════════════════════════════════════════════════════════
-- 14. TRIGGER: subscription.cancelled
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_subscription_cancelled() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    PERFORM fire_autonomous_event('subscription.cancelled', jsonb_build_object(
      'subscription_id', NEW.id,
      'user_id', NEW.user_id,
      'plan', NEW.plan,
      'cancelled_at', now()::TEXT
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_subscription_cancelled ON subscriptions;
CREATE TRIGGER trg_subscription_cancelled
  AFTER UPDATE ON subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled')
  EXECUTE FUNCTION trigger_subscription_cancelled();

-- ════════════════════════════════════════════════════════════════
-- 15. VERIFICATION: Check all triggers are live
-- ════════════════════════════════════════════════════════════════
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name LIKE 'trg_%'
ORDER BY event_object_table, trigger_name;
