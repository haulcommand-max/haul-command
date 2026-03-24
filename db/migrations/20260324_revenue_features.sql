-- ================================================================
-- REVENUE FEATURES: Corridor Sponsorships + Load Boost columns
-- ================================================================

CREATE TABLE IF NOT EXISTS corridor_sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_slug TEXT NOT NULL,
  user_id UUID NOT NULL,
  listing_id UUID,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corridor_sponsor_slug
  ON corridor_sponsorships (corridor_slug, status)
  WHERE status = 'active';

ALTER TABLE corridor_sponsorships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their sponsorships" ON corridor_sponsorships
  FOR SELECT USING (user_id = auth.uid());

-- Add boost columns to loads
ALTER TABLE loads ADD COLUMN IF NOT EXISTS boosted BOOLEAN DEFAULT FALSE;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS emergency_fill BOOLEAN DEFAULT FALSE;

-- Add featured columns to directory_listings
ALTER TABLE directory_listings ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE directory_listings ADD COLUMN IF NOT EXISTS featured_expires_at TIMESTAMPTZ;
ALTER TABLE directory_listings ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT FALSE;
ALTER TABLE directory_listings ADD COLUMN IF NOT EXISTS claimed_by UUID;
ALTER TABLE directory_listings ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER;
ALTER TABLE directory_listings ADD COLUMN IF NOT EXISTS acceptance_rate NUMERIC(5,2);
ALTER TABLE directory_listings ADD COLUMN IF NOT EXISTS runs_completed INTEGER DEFAULT 0;
