-- Leads table (route-check, partners, general inquiries)
CREATE TABLE IF NOT EXISTS leads (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    email           text NOT NULL UNIQUE,
    name            text,
    company         text,
    source          text DEFAULT 'route-check',
    context         jsonb DEFAULT '{}',
    lead_score      int DEFAULT 1 CHECK (lead_score BETWEEN 1 AND 10),
    status          text DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','converted','lost')),
    owner_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_only_leads" ON leads USING (auth.role() = 'service_role');

-- Listing claim outreach assets (per unclaimed listing)
CREATE TABLE IF NOT EXISTS listing_claim_assets (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at          timestamptz DEFAULT now(),
    listing_id          uuid REFERENCES listings(id) ON DELETE CASCADE,
    outreach_reason     text,
    steal_risk_score    int,
    risk_explanation    text,
    email_subject       text,
    email_body          text,
    sms_text            text,
    generated_at        timestamptz,
    UNIQUE(listing_id)
);

CREATE INDEX IF NOT EXISTS idx_claim_assets_risk ON listing_claim_assets(steal_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_claim_assets_listing ON listing_claim_assets(listing_id);

ALTER TABLE listing_claim_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_only_claim" ON listing_claim_assets USING (auth.role() = 'service_role');

-- Partner inquiries (AV, enterprise, API)
CREATE TABLE IF NOT EXISTS partner_inquiries (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz DEFAULT now(),
    name            text,
    email           text NOT NULL,
    company         text,
    use_case        text,
    message         text,
    status          text DEFAULT 'new' CHECK (status IN ('new','active','declined','closed'))
);

CREATE INDEX IF NOT EXISTS idx_partner_email ON partner_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_partner_use_case ON partner_inquiries(use_case);

ALTER TABLE partner_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert_partner" ON partner_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "service_read_partner" ON partner_inquiries FOR SELECT USING (auth.role() = 'service_role');
