-- ============================================================
-- HaulCommand Fix Package Migration — 2026-03-25
-- Fixes: C (categories + operators), J (ad activation)
-- ============================================================

-- ─── Fix C: Ensure core listing categories exist ─────────────
-- These are the primary user types that MUST appear in directory

DO $$
BEGIN
  -- Check if listing_categories table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listing_categories') THEN

    INSERT INTO listing_categories (name, slug, icon, display_order) VALUES
      ('Pilot Car Operators', 'pilot-car-operators', '🚗', 1),
      ('Freight Brokers', 'freight-brokers', '📋', 2),
      ('Hotels & Lodging', 'hotels-lodging', '🏨', 3),
      ('Truck Stops', 'truck-stops', '⛽', 4),
      ('Ports', 'ports', '⚓', 5),
      ('Crane Services', 'crane-services', '🏗️', 6),
      ('Heavy Equipment Dealers', 'heavy-equipment-dealers', '🚛', 7),
      ('Oil & Gas Facilities', 'oil-gas-facilities', '🛢️', 8),
      ('Training Schools', 'training-schools', '🎓', 9),
      ('Permit Services', 'permit-services', '📄', 10)
    ON CONFLICT (slug) DO NOTHING;

    RAISE NOTICE 'listing_categories: core categories ensured';
  ELSE
    RAISE NOTICE 'listing_categories table does not exist — skipping';
  END IF;
END $$;


-- ─── Fix C: Ensure pilot car / broker surface categories exist in hc_places ──
-- The hc_places table uses surface_category_key. Ensure we have the keys.

DO $$
BEGIN
  -- Add pilot_car_operator entries if we have an operators table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'operators') THEN

    -- Migrate pilot car operators into hc_places
    INSERT INTO hc_places (
      name, surface_category_key, country_code, state_province, city,
      phone, email, website, status, is_search_indexable, created_at
    )
    SELECT
      o.name,
      'pilot_car_operator',
      COALESCE(LOWER(o.country_code), 'us'),
      o.state_code,
      o.city,
      o.phone,
      o.email,
      o.website,
      'published',
      true,
      NOW()
    FROM operators o
    WHERE o.operator_type IN ('pilot_car', 'escort', 'pevo')
      AND NOT EXISTS (
        SELECT 1 FROM hc_places hp
        WHERE hp.name = o.name
          AND hp.city = o.city
          AND hp.surface_category_key = 'pilot_car_operator'
      )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Migrated pilot car operators from operators table';
  ELSE
    RAISE NOTICE 'operators table does not exist — skipping pilot car migration';
  END IF;

  -- Migrate brokers if brokers table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brokers') THEN

    INSERT INTO hc_places (
      name, surface_category_key, country_code, state_province, city,
      phone, email, website, status, is_search_indexable, created_at
    )
    SELECT
      b.name,
      'freight_broker',
      COALESCE(LOWER(b.country_code), 'us'),
      b.state_code,
      b.city,
      b.phone,
      b.email,
      b.website,
      'published',
      true,
      NOW()
    FROM brokers b
    WHERE NOT EXISTS (
      SELECT 1 FROM hc_places hp
      WHERE hp.name = b.name
        AND hp.city = b.city
        AND hp.surface_category_key = 'freight_broker'
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Migrated brokers from brokers table';
  ELSE
    RAISE NOTICE 'brokers table does not exist — skipping broker migration';
  END IF;
END $$;


-- ─── Fix J: Activate ad placements and campaigns ────────────

DO $$
BEGIN
  -- Activate ad placements
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ad_placements') THEN
    UPDATE ad_placements SET is_active = true WHERE is_active = false;
    RAISE NOTICE 'ad_placements: all placements activated';
  ELSE
    RAISE NOTICE 'ad_placements table does not exist — skipping';
  END IF;

  -- Activate paused campaigns that haven't expired
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaigns') THEN
    UPDATE campaigns
    SET status = 'active'
    WHERE status = 'paused'
      AND (end_date IS NULL OR end_date > NOW());
    RAISE NOTICE 'campaigns: paused campaigns activated';
  ELSE
    RAISE NOTICE 'campaigns table does not exist — skipping';
  END IF;

  -- Also check ad_campaigns (alternate table name)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ad_campaigns') THEN
    UPDATE ad_campaigns
    SET status = 'active'
    WHERE status = 'paused'
      AND (end_date IS NULL OR end_date > NOW());
    RAISE NOTICE 'ad_campaigns: paused campaigns activated';
  END IF;
END $$;


-- ─── Audit Output ────────────────────────────────────────────

-- Category distribution check
SELECT surface_category_key, COUNT(*)
FROM hc_places
WHERE status = 'published'
GROUP BY surface_category_key
ORDER BY COUNT(*) DESC;

-- Ad status check
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ad_placements') THEN
    RAISE NOTICE 'Run this to check ad status:';
    RAISE NOTICE 'SELECT placement_zone, is_active, COUNT(*) FROM ad_placements GROUP BY placement_zone, is_active;';
  END IF;
END $$;
