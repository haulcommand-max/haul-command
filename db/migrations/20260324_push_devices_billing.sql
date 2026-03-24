-- ================================================================
-- PUSH DEVICES TABLE (for FCM token storage)
-- ================================================================

CREATE TABLE IF NOT EXISTS push_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  fcm_token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web'
    CHECK (platform IN ('web', 'ios', 'android')),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, fcm_token)
);

CREATE INDEX IF NOT EXISTS idx_push_devices_user ON push_devices (user_id);

ALTER TABLE push_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their push devices" ON push_devices
  FOR ALL USING (user_id = auth.uid());

-- Add profile columns for Stripe billing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'basic';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none';

CREATE INDEX IF NOT EXISTS idx_profiles_stripe ON profiles (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
