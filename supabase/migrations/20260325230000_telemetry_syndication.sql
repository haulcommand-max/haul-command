-- ==============================================================================
-- HAUL COMMAND: TELEMETRY DATA SYNDICATION (THE B2B DATA LAKE)
-- Migration: 20260325230000_telemetry_syndication.sql
-- Description: Pre-wires the database to store and sell anonymized GPS
--              macroeconomic route data to DOTs and Hedge Funds.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.hc_telemetry_syndication_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name TEXT NOT NULL,          -- e.g., 'Texas DOT', 'Citadel Commodities'
    entity_type TEXT NOT NULL,          -- 'government', 'hedge_fund', 'logistics_api'
    annual_fee_usd NUMERIC(18, 2) NOT NULL,
    api_key_hash TEXT UNIQUE NOT NULL,
    data_tier TEXT NOT NULL DEFAULT 'anonymized_macro', -- Or 'granular_live'
    contract_start_date TIMESTAMPTZ DEFAULT now(),
    contract_end_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- The raw data table where GPS pings are stripped of PII and batched for the API
CREATE TABLE IF NOT EXISTS public.hc_anonymized_route_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_class TEXT NOT NULL,          -- e.g., 'Wind Turbine', 'Drill Rig'
    weight_class TEXT NOT NULL,         -- e.g., '200_ton_plus'
    geohash TEXT NOT NULL,              -- Anonymized grid location (e.g., '9q5c')
    heading NUMERIC(5, 2),
    velocity_mph NUMERIC(5, 2),
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Index for massive high-speed querying by Hedge Funds
CREATE INDEX idx_telemetry_geohash_time ON public.hc_anonymized_route_telemetry(geohash, timestamp DESC);
CREATE INDEX idx_telemetry_asset ON public.hc_anonymized_route_telemetry(asset_class, timestamp DESC);

-- Enable RLS to ensure only authorized API keys can hit the endpoint
ALTER TABLE public.hc_anonymized_route_telemetry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service Role Only" ON public.hc_anonymized_route_telemetry FOR ALL USING (auth.role() = 'service_role');
