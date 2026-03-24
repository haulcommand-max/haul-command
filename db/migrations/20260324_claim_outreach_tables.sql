-- Add outreach_sent_at to listing_claim_assets
ALTER TABLE listing_claim_assets ADD COLUMN IF NOT EXISTS outreach_sent_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_claim_assets_unsent ON listing_claim_assets(outreach_sent_at) WHERE outreach_sent_at IS NULL;

-- Add listing_contacts table (email/phone for unclaimed listings)
CREATE TABLE IF NOT EXISTS listing_contacts (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    listing_id      uuid REFERENCES listings(id) ON DELETE CASCADE,
    email           text,
    phone           text,
    contact_name    text,
    source          text DEFAULT 'scraped',
    verified        boolean DEFAULT false,
    UNIQUE(listing_id, email)
);

CREATE INDEX IF NOT EXISTS idx_listing_contacts_listing ON listing_contacts(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_contacts_email ON listing_contacts(email);

ALTER TABLE listing_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_only_contacts" ON listing_contacts USING (auth.role() = 'service_role');

-- Add view_count and contact_count to listings (for claim prioritization)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS view_count int DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS contact_count int DEFAULT 0;

-- Claim funnel tracking
CREATE TABLE IF NOT EXISTS claim_events (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz DEFAULT now(),
    listing_id      uuid REFERENCES listings(id) ON DELETE CASCADE,
    event_type      text NOT NULL CHECK (event_type IN ('email_sent','sms_sent','page_visit','claim_started','claim_completed','declined')),
    metadata        jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_claim_events_listing ON claim_events(listing_id);
CREATE INDEX IF NOT EXISTS idx_claim_events_type ON claim_events(event_type);

-- Materialized view: claim ROI tracking
CREATE MATERIALIZED VIEW IF NOT EXISTS claim_funnel_stats AS
SELECT
    event_type,
    COUNT(DISTINCT listing_id) AS unique_listings,
    COUNT(*) AS total_events,
    DATE_TRUNC('week', created_at) AS week
FROM claim_events
GROUP BY event_type, week
ORDER BY week DESC, total_events DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_claim_funnel_stats ON claim_funnel_stats(event_type, week);
