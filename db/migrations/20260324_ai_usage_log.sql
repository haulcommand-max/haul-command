-- AI Usage Log table
-- Every call from brain.ts (think/see/act) gets a row here
-- Use this to monitor cost per feature, latency per brain, and model quality

CREATE TABLE IF NOT EXISTS ai_usage_log (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz DEFAULT now(),
    brain           text NOT NULL CHECK (brain IN ('claude', 'gemini', 'openai')),
    model           text NOT NULL,
    feature         text NOT NULL,  -- e.g. 'content_engine', 'dispatch_match', 'ad_copy'
    user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    input_tokens    int DEFAULT 0,
    output_tokens   int DEFAULT 0,
    cost_cents      numeric(10, 4) DEFAULT 0,
    latency_ms      int DEFAULT 0,
    success         boolean DEFAULT true,
    error           text
);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_brain ON ai_usage_log(brain);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_feature ON ai_usage_log(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created_at ON ai_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user ON ai_usage_log(user_id);

-- Only service role can read/write (no user access to usage logs)
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_only" ON ai_usage_log USING (auth.role() = 'service_role');

-- Materialized view: daily cost by brain (refresh nightly)
CREATE MATERIALIZED VIEW IF NOT EXISTS ai_cost_by_day AS
SELECT
    date_trunc('day', created_at) AS day,
    brain,
    feature,
    COUNT(*) AS calls,
    SUM(input_tokens) AS total_input_tokens,
    SUM(output_tokens) AS total_output_tokens,
    SUM(cost_cents) AS total_cost_cents,
    AVG(latency_ms) AS avg_latency_ms,
    SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) AS success_rate
FROM ai_usage_log
GROUP BY 1, 2, 3
ORDER BY 1 DESC, total_cost_cents DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_cost_by_day ON ai_cost_by_day(day, brain, feature);

-- Function to get cost summary for the last N days
CREATE OR REPLACE FUNCTION get_ai_cost_summary(days_back int DEFAULT 30)
RETURNS TABLE (
    brain text,
    feature text,
    total_calls bigint,
    total_cost_cents numeric,
    avg_latency_ms numeric,
    success_rate numeric
) AS $$
SELECT
    brain,
    feature,
    COUNT(*) as total_calls,
    ROUND(SUM(cost_cents)::numeric, 4) as total_cost_cents,
    ROUND(AVG(latency_ms)::numeric, 0) as avg_latency_ms,
    ROUND((SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) * 100)::numeric, 1) as success_rate
FROM ai_usage_log
WHERE created_at > now() - (days_back || ' days')::interval
GROUP BY brain, feature
ORDER BY total_cost_cents DESC;
$$ LANGUAGE sql SECURITY DEFINER;
