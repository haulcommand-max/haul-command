-- AFFILIATE VENDORS, ADGRID METRICS, AND LOCAL PERMIT OS

CREATE TABLE IF NOT EXISTS hc_vendors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_slug text UNIQUE NOT NULL,
    vendor_name text NOT NULL,
    category text NOT NULL, -- e.g., 'telecom', 'insurance', 'equipment'
    affiliate_url text,
    adgrid_cpc_rate numeric DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hc_adgrid_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid REFERENCES hc_vendors(id) ON DELETE CASCADE,
    surface_id text NOT NULL, -- e.g., 'report-card', 'lesson-overlay'
    operator_id uuid REFERENCES profiles(id),
    event_type text, -- 'impression', 'click', 'conversion'
    created_at timestamptz DEFAULT now()
);

-- Mock Data Seed
INSERT INTO hc_vendors (vendor_slug, vendor_name, category, affiliate_url, adgrid_cpc_rate)
VALUES ('comms-upgrade', 'OmniComms Global', 'telecom', 'https://omnicomms.example.com/ref=haulcommand', 5.00)
ON CONFLICT DO NOTHING;
