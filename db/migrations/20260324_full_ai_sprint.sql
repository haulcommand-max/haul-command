-- Firebase FCM token consolidation
-- Firebase push tokens now stored in Supabase, not Firestore

-- Add fcm_token columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fcm_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fcm_token_updated_at timestamptz;

-- Dedicated push_tokens table (for multi-device, topic subscriptions)
CREATE TABLE IF NOT EXISTS push_tokens (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now(),
    profile_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    token       text NOT NULL,
    platform    text NOT NULL DEFAULT 'web' CHECK (platform IN ('web','ios','android')),
    country_code text DEFAULT 'US',
    active      boolean DEFAULT true,
    UNIQUE(profile_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_profile ON push_tokens(profile_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_country ON push_tokens(country_code);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_tokens" ON push_tokens
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- Corridor intel columns
ALTER TABLE corridors ADD COLUMN IF NOT EXISTS intel_content text;
ALTER TABLE corridors ADD COLUMN IF NOT EXISTS intel_generated_at timestamptz;

-- Regulation pages table (for jurisdictions without a dedicated row)
CREATE TABLE IF NOT EXISTS regulation_pages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    jurisdiction    text NOT NULL UNIQUE,
    content         text,
    generated_at    timestamptz,
    country_code    text
);

CREATE INDEX IF NOT EXISTS idx_regulation_pages_jurisdiction ON regulation_pages(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_regulation_pages_country ON regulation_pages(country_code);

-- AV briefings table
CREATE TABLE IF NOT EXISTS av_briefings (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz DEFAULT now(),
    corridor_name   text NOT NULL,
    route           text,
    content         text,
    generated_at    timestamptz,
    week_of         date NOT NULL,
    UNIQUE(corridor_name, week_of)
);

CREATE INDEX IF NOT EXISTS idx_av_briefings_week ON av_briefings(week_of DESC);

-- Add bio + meta_description to listings (if not exist from prior migration)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS meta_description text;

-- Route check queries table
CREATE TABLE IF NOT EXISTS route_check_queries (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at   timestamptz DEFAULT now(),
    query        text NOT NULL,
    state        text,
    load_type    text DEFAULT 'oversize',
    answer_length int,
    model        text,
    latency_ms   int,
    user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    converted    boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_route_check_created ON route_check_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_route_check_state ON route_check_queries(state);

ALTER TABLE route_check_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert_rq" ON route_check_queries FOR INSERT WITH CHECK (true);
CREATE POLICY "own_read_rq" ON route_check_queries FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- AI usage log (from prior sprint)
CREATE TABLE IF NOT EXISTS ai_usage_log (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz DEFAULT now(),
    brain           text NOT NULL CHECK (brain IN ('claude', 'gemini', 'openai')),
    model           text NOT NULL,
    feature         text NOT NULL,
    user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    input_tokens    int DEFAULT 0,
    output_tokens   int DEFAULT 0,
    cost_cents      numeric(10, 4) DEFAULT 0,
    latency_ms      int DEFAULT 0,
    success         boolean DEFAULT true,
    error           text
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_brain ON ai_usage_log(brain);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_log(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_log(created_at DESC);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_only_ai" ON ai_usage_log USING (auth.role() = 'service_role');

-- Cost summary function
CREATE OR REPLACE FUNCTION get_ai_cost_summary(days_back int DEFAULT 30)
RETURNS TABLE (
    brain text, feature text, total_calls bigint,
    total_cost_cents numeric, avg_latency_ms numeric, success_rate numeric
) AS $$
SELECT brain, feature, COUNT(*) as total_calls,
    ROUND(SUM(cost_cents)::numeric, 4),
    ROUND(AVG(latency_ms)::numeric, 0),
    ROUND((SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) * 100)::numeric, 1)
FROM ai_usage_log
WHERE created_at > now() - (days_back || ' days')::interval
GROUP BY brain, feature
ORDER BY total_cost_cents DESC;
$$ LANGUAGE sql SECURITY DEFINER;
