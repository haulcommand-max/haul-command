-- ============================================================================
-- Migration: 20260412_command_layer_money_triggers.sql
-- Purpose:  Wire ALL revenue/cost streams into hc_command_money_events so the
--           Board API shows real money flow, not $0.
--
-- Covers:
--   1. Stripe payments (checkout.session.completed, invoice.paid)
--   2. Sponsor billing (daily sponsor charges)
--   3. Data marketplace purchases
--   4. API subscriptions
--   5. Affiliate conversions
--   6. Referral rewards
--   7. Ad impression revenue
--   8. Premium auction wins
--   9. Lead unlock purchases
--
-- Strategy: DB triggers fire on INSERT into revenue tables → auto-insert
--           into hc_command_money_events. Zero code changes to existing routes.
-- ============================================================================

BEGIN;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. MASTER TRIGGER FUNCTION: Insert money event from any revenue table
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION command_log_money_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agent_id UUID;
  v_amount   INTEGER;
  v_type     TEXT;
  v_entity_type   TEXT;
  v_market   TEXT;
BEGIN
  -- Extract source from trigger args
  v_entity_type := TG_ARGV[0];
  v_type   := TG_ARGV[1]; -- 'revenue' or 'cost'

  -- Resolve agent (best-effort)
  SELECT id INTO v_agent_id
    FROM hc_command_agents
    WHERE slug = TG_ARGV[2]
    LIMIT 1;

  -- Extract amount (strategy depends on source table)
  v_amount := COALESCE(
    (NEW.amount_cents)::integer,
    (NEW.total_cents)::integer,
    (NEW.amount * 100)::integer,
    (NEW.revenue_cents)::integer,
    (NEW.payout_cents)::integer,
    0
  );

  -- Extract market context (best-effort)
  v_market := COALESCE(
    NEW.country_code,
    NEW.country,
    NEW.market,
    'US'
  );

  INSERT INTO hc_command_money_events (
    agent_id, run_id, event_type, amount_cents, currency, entity_type, market, metadata
  ) VALUES (
    v_agent_id,
    NULL,
    v_type,
    v_amount,
    COALESCE(NEW.currency, 'usd'),
    v_entity_type,
    v_market,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'record_id', NEW.id,
      'trigger', TG_NAME
    )
  );

  -- Also log to os_event_log for audit trail
  INSERT INTO os_event_log (event_type, entity_type, entity_id, payload)
  VALUES (
    'money.' || v_type,
    TG_TABLE_NAME,
    NEW.id::text,
    jsonb_build_object('amount_cents', v_amount, 'entity_type', v_entity_type, 'market', v_market)
  );

  RETURN NEW;
END;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. STRIPE PAYMENTS → Money Events
--    Triggered when monetization_events logs a Stripe charge/payment
-- ════════════════════════════════════════════════════════════════════════════

-- monetization_events table (from 20240403_monetization_events.sql)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'monetization_events') THEN
    CREATE OR REPLACE TRIGGER trg_monetization_to_command_money
      AFTER INSERT ON monetization_events
      FOR EACH ROW
      WHEN (NEW.event_type IN ('payment_captured', 'subscription_created', 'invoice_paid', 'checkout_completed'))
      EXECUTE FUNCTION command_log_money_event('stripe', 'revenue', 'stripe-webhook');
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. DATA MARKETPLACE PURCHASES → Money Events
-- ════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_marketplace_purchases') THEN
    CREATE OR REPLACE TRIGGER trg_data_purchase_to_command_money
      AFTER INSERT ON data_marketplace_purchases
      FOR EACH ROW
      EXECUTE FUNCTION command_log_money_event('data_marketplace', 'revenue', 'content-engine');
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 4. API SUBSCRIPTIONS → Money Events
-- ════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_subscriptions') THEN
    CREATE OR REPLACE TRIGGER trg_api_sub_to_command_money
      AFTER INSERT ON api_subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION command_log_money_event('api_subscription', 'revenue', 'stripe-webhook');
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 5. AFFILIATE CONVERSIONS → Money Events
-- ════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliate_conversions') THEN
    CREATE OR REPLACE TRIGGER trg_affiliate_to_command_money
      AFTER INSERT ON affiliate_conversions
      FOR EACH ROW
      EXECUTE FUNCTION command_log_money_event('affiliate', 'revenue', 'content-engine');
  END IF;
END $$;

-- Also handle affiliate_tracking (the click/impression layer)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliate_tracking'
             AND EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_name = 'affiliate_tracking' AND column_name = 'amount_cents')) THEN
    CREATE OR REPLACE TRIGGER trg_affiliate_tracking_to_command_money
      AFTER UPDATE ON affiliate_tracking
      FOR EACH ROW
      WHEN (NEW.status = 'converted' AND OLD.status != 'converted')
      EXECUTE FUNCTION command_log_money_event('affiliate_click', 'revenue', 'content-engine');
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 6. REFERRAL REWARDS → Money Events
-- ════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_rewards') THEN
    CREATE OR REPLACE TRIGGER trg_referral_reward_to_command_money
      AFTER INSERT ON referral_rewards
      FOR EACH ROW
      EXECUTE FUNCTION command_log_money_event('referral', 'cost', 'claim-acceleration');
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 7. SPONSOR ORDERS (ad_sponsor_orders) → Money Events
-- ════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsorship_orders') THEN
    CREATE OR REPLACE TRIGGER trg_sponsor_order_to_command_money
      AFTER INSERT ON sponsorship_orders
      FOR EACH ROW
      EXECUTE FUNCTION command_log_money_event('sponsor', 'revenue', 'bill-sponsors-daily');
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 8. LEAD UNLOCKS → Money Events
-- ════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_unlocks'
             AND EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_name = 'lead_unlocks' AND column_name = 'amount_cents')) THEN
    CREATE OR REPLACE TRIGGER trg_lead_unlock_to_command_money
      AFTER INSERT ON lead_unlocks
      FOR EACH ROW
      EXECUTE FUNCTION command_log_money_event('lead_unlock', 'revenue', 'hc-leads-worker');
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 9. AD IMPRESSION CONFIRMS → Money Events
-- ════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ad_impression_log'
             AND EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_name = 'ad_impression_log' AND column_name = 'revenue_cents')) THEN
    CREATE OR REPLACE TRIGGER trg_ad_impression_to_command_money
      AFTER INSERT ON ad_impression_log
      FOR EACH ROW
      WHEN (NEW.revenue_cents > 0)
      EXECUTE FUNCTION command_log_money_event('ad_impression', 'revenue', 'ad-decision-engine');
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 10. VIEW: Real-time money dashboard for Board API
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW command_money_dashboard AS
SELECT
  entity_type,
  event_type,
  currency,
  market,
  COUNT(*)                                    AS event_count,
  SUM(amount_cents)                           AS total_cents,
  SUM(amount_cents) FILTER (WHERE created_at >= now() - interval '24 hours')  AS last_24h_cents,
  SUM(amount_cents) FILTER (WHERE created_at >= now() - interval '7 days')    AS last_7d_cents,
  SUM(amount_cents) FILTER (WHERE created_at >= now() - interval '30 days')   AS last_30d_cents,
  MAX(created_at)                             AS last_event_at
FROM hc_command_money_events
GROUP BY entity_type, event_type, currency, market
ORDER BY last_30d_cents DESC NULLS LAST;

COMMIT;
