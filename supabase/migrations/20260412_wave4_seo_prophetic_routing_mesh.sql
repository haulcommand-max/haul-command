-- 15X SOLUTION: Algorithmic SEO & Dynamic Link Graph using PostGIS
-- Creates highly optimized RPCs that rank geometric entities not just by distance, 
-- but mixed with actual live market heat to form a "Prophetic Routing Mesh"

-- 1. get_nearest_corridors
CREATE OR REPLACE FUNCTION get_nearest_corridors(lat double precision, lon double precision, limit_val int DEFAULT 5)
RETURNS TABLE (
    corridor_id text,
    distance_meters double precision,
    booking_heat numeric,
    composite_weight numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.corridor_id,
        ST_Distance(
            ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography, 
            c.center_point::geography
        ) as distance_meters,
        COALESCE(c.booking_heat, 1.0) as booking_heat,
        -- Distance inverted + booking heat = dynamic link weighting
        (100000 / NULLIF(ST_Distance(
            ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography, 
            c.center_point::geography
        ), 0)) * COALESCE(c.booking_heat, 1.0) as composite_weight
    FROM corridors c
    WHERE c.center_point IS NOT NULL
    ORDER BY composite_weight DESC
    LIMIT limit_val;
END;
$$;

-- 2. get_nearest_operators
CREATE OR REPLACE FUNCTION get_nearest_operators(lat double precision, lon double precision, limit_val int DEFAULT 5)
RETURNS TABLE (
    operator_id uuid,
    display_name text,
    slug text,
    trust_score numeric,
    distance_meters double precision,
    composite_weight numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as operator_id,
        p.display_name,
        p.slug,
        p.trust_score,
        ST_Distance(
            ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography, 
            p.home_base_location::geography
        ) as distance_meters,
        -- High trust + short distance
        (p.trust_score * 1000) / NULLIF(ST_Distance(
            ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography, 
            p.home_base_location::geography
        ), 0) as composite_weight
    FROM profiles p
    WHERE p.home_base_location IS NOT NULL
    AND p.is_active = true
    ORDER BY composite_weight DESC
    LIMIT limit_val;
END;
$$;

-- 3. get_nearest_surfaces (Ports / Zones)
CREATE OR REPLACE FUNCTION get_nearest_surfaces(lat double precision, lon double precision, limit_val int DEFAULT 3)
RETURNS TABLE (
    surface_id text,
    surface_name text,
    surface_type text,
    distance_meters double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id as surface_id,
        h.name as surface_name,
        h.type as surface_type,
        ST_Distance(
            ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography, 
            h.location::geography
        ) as distance_meters
    FROM hc_places h
    WHERE h.location IS NOT NULL
    AND h.type IN ('port', 'border_crossing', 'industrial_zone')
    ORDER BY distance_meters ASC
    LIMIT limit_val;
END;
$$;

-- 4. get_nearest_cities
CREATE OR REPLACE FUNCTION get_nearest_cities(lat double precision, lon double precision, limit_val int DEFAULT 3)
RETURNS TABLE (
    city_slug text,
    city_name text,
    distance_meters double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.slug as city_slug,
        h.name as city_name,
        ST_Distance(
            ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography, 
            h.location::geography
        ) as distance_meters
    FROM hc_places h
    WHERE h.location IS NOT NULL
    AND h.type = 'city'
    ORDER BY distance_meters ASC
    LIMIT limit_val;
END;
$$;

-- 5. get_operators_for_corridor
CREATE OR REPLACE FUNCTION get_operators_for_corridor(target_corridor_id text, limit_val int DEFAULT 5)
RETURNS TABLE (
    operator_id uuid,
    display_name text,
    slug text,
    trust_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as operator_id,
        p.display_name,
        p.slug,
        p.trust_score
    FROM profiles p
    JOIN hc_training_profiles t ON p.id = t.user_id
    /* Note: if corridor_id maps to a region, we cross reference t.active_market_codes. For now just top performers in network */
    WHERE p.is_active = true
    ORDER BY p.trust_score DESC
    LIMIT limit_val;
END;
$$;

-- 6. get_connecting_corridors
CREATE OR REPLACE FUNCTION get_connecting_corridors(target_corridor_id text, limit_val int DEFAULT 3)
RETURNS TABLE (
    corridor_id text,
    origin_state text,
    dest_state text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.corridor_id,
        c.origin_state,
        c.dest_state
    FROM corridors c
    WHERE c.corridor_id != target_corridor_id
    -- Corridors sharing an endpoint
    AND (
        c.origin_state = (SELECT origin_state FROM corridors WHERE corridor_id = target_corridor_id LIMIT 1) OR
        c.dest_state = (SELECT dest_state FROM corridors WHERE corridor_id = target_corridor_id LIMIT 1) OR
        c.origin_state = (SELECT dest_state FROM corridors WHERE corridor_id = target_corridor_id LIMIT 1) OR
        c.dest_state = (SELECT origin_state FROM corridors WHERE corridor_id = target_corridor_id LIMIT 1)
    )
    ORDER BY COALESCE(c.booking_heat, 0) DESC
    LIMIT limit_val;
END;
$$;
