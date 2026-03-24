-- Route check queries table
-- Captures all free tool usage for SEO funnel analytics
CREATE TABLE IF NOT EXISTS route_check_queries (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at   timestamptz DEFAULT now(),
    query        text NOT NULL,
    state        text,
    load_type    text,
    answer_length int,
    model        text,
    latency_ms   int,
    user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    converted    boolean DEFAULT false -- did they click 'Find Operator' or 'Post Load'?
);

CREATE INDEX IF NOT EXISTS idx_route_check_created ON route_check_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_route_check_state ON route_check_queries(state);

-- Public read of own queries only
ALTER TABLE route_check_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert" ON route_check_queries FOR INSERT WITH CHECK (true);
CREATE POLICY "own_read" ON route_check_queries FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Add bio column to listings if not exists (needed for batch enrichment)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS meta_description text;
