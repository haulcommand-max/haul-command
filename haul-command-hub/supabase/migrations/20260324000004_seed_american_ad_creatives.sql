-- Create the ad creatives table if it doesn't exist
CREATE TABLE IF NOT EXISTS hc_ad_creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id text NOT NULL UNIQUE,
  advertiser_name text NOT NULL,
  slot_family text NOT NULL,
  ad_class text DEFAULT 'local_visibility',
  headline text NOT NULL,
  subhead text,
  cta_label text DEFAULT 'Learn More',
  cta_url text DEFAULT '#',
  image_landscape_url text,
  image_square_url text,
  image_vertical_url text,
  logo_url text,
  sponsor_label text DEFAULT 'sponsored',
  page_types jsonb DEFAULT '["homepage", "directory", "corridor", "state"]'::jsonb,
  creative_quality_score numeric DEFAULT 1.0,
  active boolean DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Give public read access
ALTER TABLE hc_ad_creatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active ad creatives" 
  ON hc_ad_creatives 
  FOR SELECT 
  USING (active = true);

-- Insert the 4 hyper-localized American 8k Banners for the Ad Grid
INSERT INTO hc_ad_creatives (
  creative_id, advertiser_name, slot_family, headline, subhead, cta_label, cta_url, image_landscape_url, sponsor_label
) VALUES 
(
  'us-route66-hero', 
  'Southwest Heavy Haul', 
  'hero_billboard', 
  'Route 66 Escort Masters', 
  'Need to move a crane component through NM/AZ? We have 15 trucks ready.', 
  'Book Pilot', 
  '/directory/us', 
  '/ads/us_ad_route66_1774235091445.png', 
  'sponsored'
),
(
  'us-texas-inline', 
  'Texas Oilfield Escorts', 
  'inline_billboard', 
  'Oversize Desert Convoys', 
  'Permitted, bonded, and ready for Texas superloads. 24/7 Dispatch.', 
  'View Fleet', 
  '/state/texas', 
  '/ads/us_ad_texas_1774235113017.png', 
  'promoted'
),
(
  'us-broker-network', 
  'Logistics Command', 
  'inline_billboard', 
  'The Largest Broker Network', 
  'Find the fastest route coverage across 57 countries from our command center.', 
  'Access Network', 
  '/directory', 
  '/ads/us_ad_broker_network_1774235222285.png', 
  'featured'
),
(
  'us-pilot-mountain', 
  'Apex Mountain Pilots', 
  'hero_billboard', 
  'Rocky Mountain Escorts', 
  'F-350 fully-equipped chase and lead vehicles. No grade too steep.', 
  'Connect Now', 
  '/corridors', 
  '/ads/us_ad_pilot_car_1774235246914.png', 
  'promoted'
)
ON CONFLICT (creative_id) DO UPDATE SET 
  image_landscape_url = EXCLUDED.image_landscape_url,
  headline = EXCLUDED.headline,
  subhead = EXCLUDED.subhead;
