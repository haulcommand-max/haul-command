-- ==============================================================================
-- HAUL COMMAND: GEO-BASED IP RESOLUTION
-- Adds geolocation telemetry directly to the request_log for the visual map.
-- ==============================================================================

ALTER TABLE public.request_log 
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS latitude float,
ADD COLUMN IF NOT EXISTS longitude float;
