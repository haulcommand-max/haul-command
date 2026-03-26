-- ==============================================================================
-- HAUL COMMAND TRUCK STOP & AMENITIES EXTENSION
-- Competitor: truckstopsandservices.com (DC Book Company)
-- Goal: 10x their data model, support 57 countries, ingest their white-label ad targets
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TRUCK STOP SCHEMA UPGRADE (57 Countries + Max Granularity)
-- ------------------------------------------------------------------------------

-- Upgrade the existing truck_stops table to support global tiers and granular amenities
ALTER TABLE public.truck_stops
    ADD COLUMN IF NOT EXISTS country_tier text DEFAULT 'A', -- A, B, C, D to match the global execution plan
    ADD COLUMN IF NOT EXISTS is_24_hours boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS has_certified_scales boolean DEFAULT false, -- specifically CAT Scales or similar
    ADD COLUMN IF NOT EXISTS has_truck_wash boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS has_idle_reduction_tech boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS has_dump_station boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS has_repair_bays boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS number_of_service_bays integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS has_permit_services boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS has_public_fax boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS fast_food_brands text[] DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS reserved_parking_spots integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_autohof boolean DEFAULT false; -- Crucial for Tier A: Germany (DE)

-- Create performance index for filtering on amenities crucial to oversized drivers
CREATE INDEX IF NOT EXISTS idx_truck_stops_oversize_needs 
ON public.truck_stops(has_certified_scales, has_repair_bays, has_permit_services) 
WHERE country_tier IN ('A', 'B');

-- ------------------------------------------------------------------------------
-- 2. AD GRID / WHITE LABEL AFFILIATE PIPELINE
-- From competitor analysis: Dozens of mechanical, towing, and pilot services
-- are aggressively advertising. We are mapping them as prime B2B conversion targets.
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.hc_adgrid_affiliate_prospects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name text NOT NULL,
    category text NOT NULL, -- e.g., 'Towing & Recovery', 'Mechanical', 'Spill Response', 'Pilot Cars'
    website_url text,
    phone text,
    competitor_source text DEFAULT 'dc_book_truck_stops',
    
    -- Status in the Haul Command B2B Pipeline
    has_been_contacted boolean DEFAULT false,
    is_white_label_candidate boolean DEFAULT false,
    is_adgrid_sponsor boolean DEFAULT false,
    
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(company_name, competitor_source)
);

-- Seed highly lucrative adgrid/affiliate targets extracted from competitor screenshots
INSERT INTO public.hc_adgrid_affiliate_prospects (company_name, category, website_url, is_white_label_candidate)
VALUES 
    ('Axle Doctors', 'Repair & Axle', 'www.axledoctors.com', true),
    ('United Axle', 'Repair & Axle', 'www.unitedaxle.com', true),
    ('Detroit Highway Repair', 'Mobile Repair', 'www.detroithighwayrescue.com', true),
    ('Diesel Highway', 'Mobile Repair', 'www.dieselhighway.com', true),
    ('J&J Truck & Trailer Repair', 'Mobile Repair', null, false),
    ('Park Truck', 'Secure Parking', null, true),
    ('Woodshed', 'Truck Stop & Towing', null, false),
    ('United Towing', 'Towing', 'UnitedTowService.com', true),
    ('HH&S Escort & Pilot Car Services', 'Pilot Cars', 'www.hh-s.com', true), -- major competitor/whitelist opportunity
    ('Quality Pilots', 'Pilot Cars', 'www.pilotservice.net', true),
    ('North American Trailer', 'Parts & Sales', 'SHOP.NATRAILER.COM', true),
    ('Lummi Bay Market', 'Truck Stop & Diesel', null, false),
    ('Miles Wrecker Service', 'Towing & Recovery', null, false),
    ('AES Breakdown Service', 'Mobile Welding', null, false),
    ('Roadrunner', 'Towing', null, false),
    ('Diversified Towing & Recovery', 'Towing & Recovery', 'www.diversifiedtowing.com', true),
    ('Southern Hills Spill Response', 'Spill Response & HAZMAT', null, true)
ON CONFLICT (company_name, competitor_source) DO NOTHING;
