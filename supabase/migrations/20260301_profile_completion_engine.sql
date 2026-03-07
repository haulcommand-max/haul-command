-- Profile Completion Engine: visibility_boosts table
-- Stores temporary search/ranking multipliers granted when operators hit milestones

CREATE TABLE IF NOT EXISTS public.visibility_boosts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone  INT NOT NULL,
  boost_type TEXT NOT NULL,
  multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.10,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  active     BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, milestone)
);

CREATE INDEX IF NOT EXISTS idx_visibility_boosts_user
  ON visibility_boosts(user_id) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_visibility_boosts_expires
  ON visibility_boosts(expires_at) WHERE active = true;

ALTER TABLE visibility_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_boosts" ON visibility_boosts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "service_manage_boosts" ON visibility_boosts
  FOR ALL USING (true) WITH CHECK (true);
