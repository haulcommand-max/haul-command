-- 🚜 MODULE E: DATA INGESTION (ToS-Safe Provenance)
-- Directive: "Store Provenance + Rate Limits. No Scraping Comps Behind Auth."

CREATE TYPE source_kind AS ENUM ('manual_pdf', 'open_dataset', 'public_web', 'user_submitted');

CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind source_kind NOT NULL,
  url TEXT,
  title TEXT,
  publisher TEXT,
  robots_respected BOOLEAN NOT NULL DEFAULT TRUE,
  rate_limit_rps NUMERIC NOT NULL DEFAULT 0.2, -- Gentle by default (1 request per 5 seconds)
  license_notes TEXT,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raw_ingest_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES sources(id),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_hash TEXT NOT NULL, -- SHA256 of payload for dedupe
  payload JSONB NOT NULL,     -- The raw data (or parsed text)
  parse_status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | complete | error
  parse_errors TEXT,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb -- { "user_agent": "Bot/1.0", "ip": "..." }
);

-- Index for Deduplication
CREATE INDEX IF NOT EXISTS idx_raw_ingest_hash ON raw_ingest_events(content_hash);
CREATE INDEX IF NOT EXISTS idx_raw_ingest_source ON raw_ingest_events(source_id);

-- RLS
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_ingest_events ENABLE ROW LEVEL SECURITY;

-- Only Service Role (Scrapers) can Insert/Update
CREATE POLICY "Service Role Full Access Sources" ON sources
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service Role Full Access Events" ON raw_ingest_events
  FOR ALL USING (auth.role() = 'service_role');
