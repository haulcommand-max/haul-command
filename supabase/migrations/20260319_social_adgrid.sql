-- ═══════════════════════════════════════════════════════════════════════
-- HAUL COMMAND — Social Layer + AdGrid Boost Tables
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own follows" ON public.follows
  FOR ALL USING (auth.uid() = follower_id);
CREATE POLICY "Public read follows" ON public.follows
  FOR SELECT USING (true);

-- 2. Operator posts (280-char updates)
CREATE TABLE IF NOT EXISTS public.operator_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  corridor_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.operator_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own posts" ON public.operator_posts
  FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Public read posts" ON public.operator_posts
  FOR SELECT USING (true);

-- 3. Broker endorsements
CREATE TABLE IF NOT EXISTS public.broker_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(broker_id, operator_id)
);
ALTER TABLE public.broker_endorsements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own endorsements" ON public.broker_endorsements
  FOR ALL USING (auth.uid() = broker_id);
CREATE POLICY "Public read endorsements" ON public.broker_endorsements
  FOR SELECT USING (true);

-- 4. Ad boosts (directory listing boosts)
CREATE TABLE IF NOT EXISTS public.ad_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_days INT NOT NULL,
  amount_cents INT NOT NULL,
  stripe_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'expired', 'cancelled')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own boosts" ON public.ad_boosts
  FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Admin read all boosts" ON public.ad_boosts
  FOR SELECT USING (true);
CREATE POLICY "Users can insert their own boosts" ON public.ad_boosts
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_operator_posts_profile ON public.operator_posts(profile_id);
CREATE INDEX IF NOT EXISTS idx_operator_posts_corridor ON public.operator_posts(corridor_slug);
CREATE INDEX IF NOT EXISTS idx_endorsements_operator ON public.broker_endorsements(operator_id);
CREATE INDEX IF NOT EXISTS idx_ad_boosts_profile ON public.ad_boosts(profile_id);
CREATE INDEX IF NOT EXISTS idx_ad_boosts_status ON public.ad_boosts(status);

-- Update hc_ai_config model column to claude-sonnet-4-6 for all rows
UPDATE public.hc_ai_config SET model = 'claude-sonnet-4-6' WHERE model LIKE 'gpt%' OR model LIKE 'openai%';
