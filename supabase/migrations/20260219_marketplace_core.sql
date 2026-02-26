-- Phase 1 Core Data Layer: Haul Command Marketplace Tables
-- These tables form the source of truth that will sync to Typesense

-- VENDORS (Escort Companies, Permit Providers)
CREATE TABLE IF NOT EXISTS public.hc_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name TEXT NOT NULL,
    dba_name TEXT,
    vendor_type TEXT NOT NULL CHECK (vendor_type IN ('escort', 'permit_service', 'support')),
    region1 TEXT NOT NULL, -- State/Province ISO code (e.g., 'US-TX')
    country TEXT NOT NULL DEFAULT 'US',
    trust_score NUMERIC(5,2) DEFAULT 0.00,
    trust_tier TEXT DEFAULT 'standard' CHECK (trust_tier IN ('standard', 'verified', 'elite')),
    plan_tier TEXT DEFAULT 'free' CHECK (plan_tier IN ('free', 'verified', 'priority', 'command_partner', 'corridor_dominator')),
    -- PostGIS geography column (SRID 4326 for WGS84)
    location_geog geography(POINT, 4326),
    services TEXT[] DEFAULT '{}',
    is_24_7 BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for searching nearby vendors
CREATE INDEX IF NOT EXISTS hc_vendors_location_idx ON public.hc_vendors USING GIST (location_geog);
CREATE INDEX IF NOT EXISTS hc_vendors_region_idx ON public.hc_vendors (region1);
CREATE INDEX IF NOT EXISTS hc_vendors_type_idx ON public.hc_vendors (vendor_type);

-- LOADS (The primary demand signal)
CREATE TABLE IF NOT EXISTS public.hc_loads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID NOT NULL, -- references Auth user ID
    origin_city TEXT NOT NULL,
    origin_state TEXT NOT NULL,
    origin_geog geography(POINT, 4326),
    destination_city TEXT NOT NULL,
    destination_state TEXT NOT NULL,
    destination_geog geography(POINT, 4326),
    load_status TEXT DEFAULT 'posted' CHECK (load_status IN ('posted', 'matched', 'in_transit', 'delivered', 'canceled')),
    width_ft NUMERIC(5,2),
    height_ft NUMERIC(5,2),
    weight_lbs INTEGER,
    escort_required BOOLEAN DEFAULT true,
    h3_cell_origin TEXT, -- Uber H3 hex assigned on insert
    h3_cell_dest TEXT,
    posted_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hc_loads_origin_idx ON public.hc_loads USING GIST (origin_geog);
CREATE INDEX IF NOT EXISTS hc_loads_status_idx ON public.hc_loads (load_status);
CREATE INDEX IF NOT EXISTS hc_loads_h3_idx ON public.hc_loads (h3_cell_origin);

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_hc_vendors_updated_at ON public.hc_vendors;
CREATE TRIGGER set_hc_vendors_updated_at
    BEFORE UPDATE ON public.hc_vendors
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_hc_loads_updated_at ON public.hc_loads;
CREATE TRIGGER set_hc_loads_updated_at
    BEFORE UPDATE ON public.hc_loads
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();
