-- -----------------------------------------------------------------------------
-- Haul Command — Phase 2: Spatial Intelligence Backbone
-- -----------------------------------------------------------------------------
-- This migration enables PostGIS and establishes the foundation for
-- massive-scale proximity math (nearest operators, heatmaps, route matching).

-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- 2. Operators (Points)
ALTER TABLE operators 
ADD COLUMN IF NOT EXISTS geom GEOGRAPHY(Point, 4326);

-- Backfill operators geom from existing lat/lng if present
-- (assumes columns are lat/lng, adjust if lat/lon)
UPDATE operators 
SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography 
WHERE lat IS NOT NULL AND lng IS NOT NULL AND geom IS NULL;

-- 3. Places (Points)
-- (assume a generalized places table or skip until defined)
ALTER TABLE hc_places 
ADD COLUMN IF NOT EXISTS geom GEOGRAPHY(Point, 4326);

UPDATE hc_places 
SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography 
WHERE lat IS NOT NULL AND lon IS NOT NULL AND geom IS NULL;

-- 4. Ports (Points)
ALTER TABLE hc_ports
ADD COLUMN IF NOT EXISTS geom GEOGRAPHY(Point, 4326);

UPDATE hc_ports 
SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography 
WHERE lat IS NOT NULL AND lon IS NOT NULL AND geom IS NULL;

-- 5. Industrial Zones (Points or Polygons, starting with Points for simplicity)
ALTER TABLE hc_industrial_zones
ADD COLUMN IF NOT EXISTS geom GEOGRAPHY(Point, 4326);

UPDATE hc_industrial_zones 
SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography 
WHERE lat IS NOT NULL AND lon IS NOT NULL AND geom IS NULL;

-- 6. Corridors (Linestrings - connecting origin and destination roughly, can be densified later)
ALTER TABLE hc_corridors
ADD COLUMN IF NOT EXISTS geom GEOGRAPHY(LineString, 4326);

UPDATE hc_corridors 
SET geom = ST_MakeLine(
    ST_SetSRID(ST_MakePoint(origin_lon, origin_lat), 4326),
    ST_SetSRID(ST_MakePoint(dest_lon, dest_lat), 4326)
)::geography
WHERE origin_lat IS NOT NULL AND dest_lat IS NOT NULL AND geom IS NULL;

-- 7. GiST Indexes for Spatial Query Speed
CREATE INDEX IF NOT EXISTS idx_operators_geom ON operators USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_places_geom ON hc_places USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_ports_geom ON hc_ports USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_industrial_zones_geom ON hc_industrial_zones USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_corridors_geom ON hc_corridors USING GIST (geom);
