-- ══════════════════════════════════════════════════════════════
-- CAPTURE SYSTEM MIGRATION
-- Creates tables for: alert_subscribers, saved_intents,
-- community_memberships, and adds availability columns to
-- hc_real_operators
-- ══════════════════════════════════════════════════════════════

-- 1. Alert Subscribers
CREATE TABLE IF NOT EXISTS alert_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  push_token TEXT,
  role TEXT DEFAULT 'unknown',
  categories TEXT[] DEFAULT '{}',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  last_notified_at TIMESTAMPTZ,
  notification_count INTEGER DEFAULT 0,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_email UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_alert_subs_email ON alert_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_alert_subs_active ON alert_subscribers(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_alert_subs_categories ON alert_subscribers USING GIN(categories);

-- 2. Saved Intents
CREATE TABLE IF NOT EXISTS saved_intents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_label TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  alerts_enabled BOOLEAN DEFAULT TRUE,
  alert_frequency TEXT DEFAULT 'weekly_digest',
  alert_channels TEXT[] DEFAULT '{email}',
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  last_notified_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_entity UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_intents_user ON saved_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_intents_entity_type ON saved_intents(entity_type);
CREATE INDEX IF NOT EXISTS idx_saved_intents_alerts ON saved_intents(alerts_enabled) WHERE alerts_enabled = TRUE;

-- 3. Community Memberships
CREATE TABLE IF NOT EXISTS community_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT,
  platform TEXT NOT NULL DEFAULT 'facebook',
  group_id TEXT NOT NULL DEFAULT 'haulcommand',
  group_name TEXT DEFAULT 'Haul Command Operators',
  is_confirmed BOOLEAN DEFAULT FALSE,
  confirmation_source TEXT DEFAULT 'never_confirmed',
  confirmed_at TIMESTAMPTZ,
  referred_by_group_invite BOOLEAN DEFAULT FALSE,
  group_invite_code TEXT,
  badge_unlocked BOOLEAN DEFAULT FALSE,
  profile_claimed BOOLEAN DEFAULT FALSE,
  availability_synced BOOLEAN DEFAULT FALSE,
  receiving_leads BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_platform UNIQUE(user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_community_user ON community_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_community_confirmed ON community_memberships(is_confirmed) WHERE is_confirmed = TRUE;

-- 4. Add availability columns to hc_real_operators (if not exists)
-- These columns power the operator availability network
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hc_real_operators' AND column_name = 'availability_status') THEN
    ALTER TABLE hc_real_operators ADD COLUMN availability_status TEXT DEFAULT 'unknown';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hc_real_operators' AND column_name = 'availability_updated_at') THEN
    ALTER TABLE hc_real_operators ADD COLUMN availability_updated_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hc_real_operators' AND column_name = 'current_lat') THEN
    ALTER TABLE hc_real_operators ADD COLUMN current_lat NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hc_real_operators' AND column_name = 'current_lng') THEN
    ALTER TABLE hc_real_operators ADD COLUMN current_lng NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hc_real_operators' AND column_name = 'coverage_radius_miles') THEN
    ALTER TABLE hc_real_operators ADD COLUMN coverage_radius_miles INTEGER DEFAULT 100;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hc_real_operators' AND column_name = 'specializations') THEN
    ALTER TABLE hc_real_operators ADD COLUMN specializations TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hc_real_operators' AND column_name = 'equipment_on_hand') THEN
    ALTER TABLE hc_real_operators ADD COLUMN equipment_on_hand TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hc_real_operators' AND column_name = 'last_ping_at') THEN
    ALTER TABLE hc_real_operators ADD COLUMN last_ping_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hc_real_operators' AND column_name = 'rate_per_mile') THEN
    ALTER TABLE hc_real_operators ADD COLUMN rate_per_mile NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hc_real_operators' AND column_name = 'rate_per_hour') THEN
    ALTER TABLE hc_real_operators ADD COLUMN rate_per_hour NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hc_real_operators' AND column_name = 'facebook_group_confirmed') THEN
    ALTER TABLE hc_real_operators ADD COLUMN facebook_group_confirmed TEXT DEFAULT 'unknown';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hc_real_operators' AND column_name = 'streak_days') THEN
    ALTER TABLE hc_real_operators ADD COLUMN streak_days INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hc_real_operators' AND column_name = 'identity_rung') THEN
    ALTER TABLE hc_real_operators ADD COLUMN identity_rung TEXT DEFAULT 'anonymous';
  END IF;
END $$;

-- 5. Index availability for fast search filtering
CREATE INDEX IF NOT EXISTS idx_operators_availability
  ON hc_real_operators(availability_status)
  WHERE availability_status IN ('available_now', 'available_today', 'available_this_week');

CREATE INDEX IF NOT EXISTS idx_operators_last_ping
  ON hc_real_operators(last_ping_at)
  WHERE last_ping_at IS NOT NULL;

-- 6. RLS policies
ALTER TABLE alert_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_memberships ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY IF NOT EXISTS "Service role full access to alert_subscribers"
  ON alert_subscribers FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role full access to saved_intents"
  ON saved_intents FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role full access to community_memberships"
  ON community_memberships FOR ALL
  USING (true)
  WITH CHECK (true);
