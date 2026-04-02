-- ==============================================================================
-- TRUCKER SERVICES DIRECTORY EXPANSION
-- Extends `public.places` + `place_type` enum to cover ALL TruckStopsAndServices
-- categories. Routes through existing Claimable Places Engine monetization.
--
-- EXISTING COVERAGE (place_type enum already has):
--   truck_stop, motel, repair_shop, tire_shop, truck_parking,
--   scale_weigh_station_public, washout, fuel_station_diesel_heavy,
--   rest_area, tow_rotator, service_area, freight_rest_stop,
--   border_facility, port_adjacent_services, industrial_park_services
--
-- NEW TYPES (from TruckStopsAndServices gap analysis):
--   body_shop, hydraulics, welding, chrome_shop, cb_shop,
--   glass_repair, oil_lube, reefer_repair, rv_repair,
--   mobile_fueling, spill_response, environmental_cleanup,
--   cartage_drayage, truck_dealer, truck_salvage,
--   transportation_broker, trucker_supplies, pilot_car_company,
--   lock_out_service, truck_wash, trailer_wash,
--   tanker_washout, truck_insurance, truck_driving_jobs,
--   restaurant_truck_parking, fast_food_truck_parking,
--   motel_truck_parking, walmart_truck_parking,
--   cat_scale, secure_storage, drop_yard, oil_delivery,
--   mobile_truck_repair, garages_shops
--
-- DEDUP STRATEGY:
--   ✓ No new tables — everything goes into public.places
--   ✓ Unique constraint on (country_code, slug) prevents duplicates
--   ✓ Extends existing monetization ladder in place_offers
--   ✓ Auto-registers in sitemap via existing seo_on_place_claim trigger
-- ==============================================================================

-- ── 1. EXTEND place_type ENUM ──────────────────────────────────────────────

-- Repair & Maintenance
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'body_shop';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'hydraulics';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'welding';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'glass_repair';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'oil_lube';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'reefer_repair';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'rv_repair';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'mobile_truck_repair';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'garages_shops';

-- Parts & Supplies
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'chrome_shop';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'cb_shop';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'trucker_supplies';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'truck_dealer';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'truck_salvage';

-- Fuel & Services
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'mobile_fueling';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'oil_delivery';

-- Emergency & Environmental
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'spill_response';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'environmental_cleanup';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'lock_out_service';

-- Wash
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'truck_wash';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'trailer_wash';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'tanker_washout';

-- Scales
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'cat_scale';

-- Storage & Parking
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'secure_storage';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'drop_yard';

-- Logistics & Brokerage
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'transportation_broker';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'cartage_drayage';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'pilot_car_company';

-- Insurance & Jobs
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'truck_insurance';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'truck_driving_jobs';

-- Food & Lodging with Truck Parking
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'restaurant_truck_parking';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'fast_food_truck_parking';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'motel_truck_parking';
ALTER TYPE public.place_type ADD VALUE IF NOT EXISTS 'walmart_truck_parking';


-- ── 2. CATEGORY METADATA TABLE ─────────────────────────────────────────────
-- Maps place_type enum values to human-readable labels, icons, and SEO slugs
-- Used by frontend to render the /trucker-services directory

CREATE TABLE IF NOT EXISTS public.place_type_metadata (
    place_type          TEXT PRIMARY KEY,  -- matches place_type enum value
    display_name        TEXT NOT NULL,
    description         TEXT,
    icon_name           TEXT DEFAULT 'MapPin',  -- lucide icon name
    slug                TEXT NOT NULL UNIQUE,    -- URL slug for /trucker-services/[slug]
    category_group      TEXT NOT NULL DEFAULT 'general',  -- for grouping in UI
    competitor_source_id TEXT,  -- truckstopsandservices.com category ID
    seo_title           TEXT,
    seo_description     TEXT,
    is_active           BOOLEAN DEFAULT true,
    sort_order          INT DEFAULT 100,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.place_type_metadata (place_type, display_name, description, icon_name, slug, category_group, competitor_source_id, sort_order) VALUES
    -- Existing types (already in enum, now mapped)
    ('truck_stop',                    'Truck Stops',                           'Full-service truck stops with fuel, showers, parking, and amenities.',                    'MapPin',        'truck-stops',            'stops_parking',       '19',  10),
    ('motel',                         'Motels With Truck Parking',             'Motels and hotels offering secure commercial vehicle parking.',                            'Building',      'motels',                 'food_lodging',        '73',  80),
    ('repair_shop',                   'Truck & Trailer Repair',                'Full-service repair shops for commercial trucks, trailers, and heavy equipment.',          'Wrench',        'truck-trailer-repair',   'repair_maintenance',  '30',  20),
    ('tire_shop',                     'Tire Repair & Sales',                   'Commercial tire sales, repair, retreading, and 24/7 roadside tire service.',               'Gauge',         'tire-repair',            'repair_maintenance',  '28',  25),
    ('truck_parking',                 'Secure Trailer Drop Yard & Parking',    'Fenced, surveilled trailer parking and drop yards.',                                       'Shield',        'drop-yards',             'stops_parking',       '107', 30),
    ('scale_weigh_station_public',    'State Weigh Stations',                  'Weigh station locations, hours, and bypass programs.',                                     'Scale',         'weigh-stations',         'scales_compliance',   '25',  35),
    ('washout',                       'Trailer / Tanker Wash Out',             'Food-grade, chemical, and tanker cleaning — FDA and DOT compliant.',                        'Truck',         'tanker-washout',         'wash_clean',          '105', 60),
    ('fuel_station_diesel_heavy',     'Mobile Fueling',                        'On-site fuel delivery for fleet yards, construction sites, and staging areas.',             'Fuel',          'mobile-fueling',         'tires_fuel',          '113', 45),
    ('rest_area',                     'Rest Areas',                            'Highway rest areas and turnouts with amenities and parking capacity.',                       'MapPin',        'rest-areas',             'stops_parking',       '26',  15),
    ('tow_rotator',                   'Towing & Wrecker Service',              'Heavy-duty towing, rotator service, and wrecker dispatch.',                                'Truck',         'towing',                 'towing_emergency',    '29',  12),

    -- New types from TruckStopsAndServices categories
    ('body_shop',                     'Body Shop',                             'Collision repair, paint, and body work for commercial vehicles.',                           'HardHat',       'body-shop',              'repair_maintenance',  '104', 26),
    ('hydraulics',                    'Hydraulics',                            'Hydraulic system repair, hose replacement, and pump service.',                              'Zap',           'hydraulics',             'repair_maintenance',  '103', 27),
    ('welding',                       'Welding',                               'Mobile and shop welding for trailer frames, flatbed decks, structural repair.',             'Zap',           'welding',                'repair_maintenance',  '82',  28),
    ('glass_repair',                  'Glass Repair & Sales',                  'Windshield replacement and glass repair for commercial trucks.',                            'Eye',           'glass-repair',           'repair_maintenance',  '123', 29),
    ('oil_lube',                      'Oil & Lube',                            'Quick oil change, lubrication, and preventive maintenance.',                                'Fuel',          'oil-lube',               'tires_fuel',          '31',  40),
    ('reefer_repair',                 'Reefer Repairs',                        'Refrigeration unit repair and maintenance for temperature-controlled transport.',           'Snowflake',     'reefer-repairs',         'repair_maintenance',  '81',  30),
    ('rv_repair',                     'RV Repair',                             'RV and recreational vehicle repair for mobile operators.',                                  'Wrench',        'rv-repair',              'repair_maintenance',  '75',  90),
    ('mobile_truck_repair',           'Mobile Truck / Trailer Repair',         'Roadside repair services — mobile mechanics for breakdowns and emergencies.',               'Wrench',        'mobile-repair',          'repair_maintenance',  '70',  21),
    ('garages_shops',                 'Garages / Shops',                       'General auto and truck repair garages.',                                                     'Wrench',        'garages',                'repair_maintenance',  '88',  22),
    ('chrome_shop',                   'Chrome Shops',                          'Chrome accessories, bumpers, stacks, and custom truck upgrades.',                           'ShoppingCart',  'chrome-shops',           'parts_supplies',      '86',  70),
    ('cb_shop',                       'CB Shops',                              'CB radio sales, installation, and repair.',                                                  'Phone',         'cb-shops',               'parts_supplies',      '71',  71),
    ('trucker_supplies',              'Trucker Supplies & Safety Equipment',   'Flags, lights, signs, chains, straps, and safety gear for oversize loads.',                 'ShoppingCart',  'supplies',               'parts_supplies',      '97',  72),
    ('truck_dealer',                  'Truck & Trailer Dealers',               'New and used commercial truck, trailer, and lowboy dealer directory.',                      'Building',      'dealers',                'dealers_sales',       '87',  73),
    ('truck_salvage',                 'Truck Salvage',                         'Salvage yards and parts recyclers for commercial trucks.',                                  'Wrench',        'salvage',                'dealers_sales',       '94',  74),
    ('mobile_fueling',                'Mobile Fueling',                        'On-site fuel delivery for fleet yards and staging areas.',                                  'Fuel',          'fuel-delivery',          'tires_fuel',          '113', 42),
    ('oil_delivery',                  'Oil Supplies — Delivery',               'Bulk oil, lubricant, and fluid delivery services.',                                        'Package',       'oil-delivery',           'tires_fuel',          '122', 43),
    ('spill_response',                'Spill Response',                        'Hazmat spill cleanup, environmental response, OSHA-compliant containment.',                'AlertTriangle', 'spill-response',         'towing_emergency',    '128', 50),
    ('environmental_cleanup',         'Environmental Clean Up',                'Soil remediation, fuel spill cleanup, and environmental compliance.',                      'AlertTriangle', 'environmental-cleanup',  'towing_emergency',    '79',  51),
    ('lock_out_service',              'Lock Out Services',                     '24/7 locksmith and lockout services for commercial trucks.',                                'Phone',         'lockout',                'towing_emergency',    '106', 52),
    ('truck_wash',                    'Truck Wash',                            'Commercial truck wash facilities — automated, touchless, full-service.',                    'Truck',         'truck-wash',             'wash_clean',          '32',  55),
    ('trailer_wash',                  'Trailer Wash',                          'Interior and exterior trailer wash for flatbeds, vans, specialty trailers.',                'Truck',         'trailer-wash',           'wash_clean',          '33',  56),
    ('tanker_washout',                'Trailer / Tanker Wash Out',             'Food-grade and chemical tanker cleaning, FDA/DOT compliant.',                               'Truck',         'tanker-wash',            'wash_clean',          '105', 57),
    ('cat_scale',                     'CAT Scale Locations',                   'Certified truck scale locations for weight verification.',                                  'Scale',         'cat-scales',             'scales_compliance',   '93',  36),
    ('secure_storage',                'Secure Storage',                        'Enclosed and open storage for equipment, trailers, and cargo.',                             'Package',       'secure-storage',         'stops_parking',       '95',  32),
    ('drop_yard',                     'Secure Trailer Drop Yard',              'Fenced drop yards for staging oversize loads.',                                             'Shield',        'trailer-drop-yard',      'stops_parking',       '107', 33),
    ('transportation_broker',         'Transportation Brokers',                'Freight brokers, load boards, and carrier-broker matching.',                                'Navigation',    'brokers',                'logistics_business',  '68',  75),
    ('cartage_drayage',               'Cartage Moves',                         'Short-haul cartage, port drayage, and last-mile delivery.',                                'Package',       'cartage',                'logistics_business',  '117', 76),
    ('pilot_car_company',             'Pilot Car Companies',                   'Certified escort vehicle operators with verified insurance and equipment.',                 'Car',           'pilot-car-companies',    'core_escort',         '27',  1),
    ('truck_insurance',               'Truck Insurance',                       'Commercial auto, cargo, liability, and umbrella insurance.',                                'Shield',        'truck-insurance',        'logistics_business',  '111', 77),
    ('truck_driving_jobs',            'Truck Driving Jobs',                    'CDL driver jobs, escort operator positions, fleet hiring.',                                 'Truck',         'jobs',                   'logistics_business',  '98',  78),
    ('restaurant_truck_parking',      'Restaurants With Truck Parking',        'Sit-down restaurants with commercial vehicle parking.',                                     'MapPin',        'restaurants',            'food_lodging',        '72',  81),
    ('fast_food_truck_parking',       'Fast Food With Truck Parking',          'Quick-service restaurants with truck/trailer parking.',                                     'MapPin',        'fast-food',              'food_lodging',        '78',  82),
    ('motel_truck_parking',           'Motels With Truck Parking',             'Motels offering secure commercial vehicle parking and driver specials.',                    'Building',      'motels-parking',         'food_lodging',        '73',  83),
    ('walmart_truck_parking',         'Walmart With Truck Parking',            'Walmart locations allowing overnight truck parking.',                                       'MapPin',        'walmart-parking',        'food_lodging',        '23',  84)
ON CONFLICT (place_type) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name,
    category_group = EXCLUDED.category_group,
    competitor_source_id = EXCLUDED.competitor_source_id,
    sort_order = EXCLUDED.sort_order;


-- ── 3. SEED MONETIZATION LADDER FOR NEW PLACE TYPES ────────────────────────
-- Uses the same tier structure as existing types in place_offers

INSERT INTO public.place_offers (place_type, country_code, offer_tier, name, price, currency, billing_period, benefits_json, sort_order)
SELECT 
    pt.place_type::public.place_type,
    'US',
    tier.offer_tier,
    tier.name,
    tier.price,
    'USD',
    tier.billing_period,
    tier.benefits::JSONB,
    tier.sort_order
FROM (
    VALUES 
        ('body_shop'), ('hydraulics'), ('welding'), ('glass_repair'),
        ('oil_lube'), ('reefer_repair'), ('rv_repair'), ('mobile_truck_repair'),
        ('garages_shops'), ('chrome_shop'), ('cb_shop'), ('trucker_supplies'),
        ('truck_dealer'), ('truck_salvage'), ('mobile_fueling'), ('oil_delivery'),
        ('spill_response'), ('environmental_cleanup'), ('lock_out_service'),
        ('truck_wash'), ('trailer_wash'), ('tanker_washout'), ('cat_scale'),
        ('secure_storage'), ('drop_yard'), ('transportation_broker'),
        ('cartage_drayage'), ('pilot_car_company'), ('truck_insurance'),
        ('truck_driving_jobs'), ('restaurant_truck_parking'), ('fast_food_truck_parking'),
        ('motel_truck_parking'), ('walmart_truck_parking')
) AS pt(place_type)
CROSS JOIN (
    VALUES
        ('free_claim'::public.place_offer_tier,        'Free Claim',        0.00,   'one_time', '["edit_hours","edit_phone_website","respond_to_reviews"]', 1),
        ('verified_claim'::public.place_offer_tier,    'Verified Claim',   19.00,   'monthly',  '["verified_badge","higher_rank_weight","lead_capture_form"]', 2),
        ('premium_placement'::public.place_offer_tier, 'Premium Placement', 39.00,  'monthly',  '["top_of_city_region_results","featured_on_corridor_pages","call_tracking"]', 3)
) AS tier(offer_tier, name, price, billing_period, benefits, sort_order)
ON CONFLICT DO NOTHING;


-- ── 4. CREATE VIEW FOR FRONTEND DIRECTORY QUERIES ──────────────────────────
-- Unified view that joins places + metadata for the trucker services directory

CREATE OR REPLACE VIEW public.v_trucker_services_directory AS
SELECT 
    p.place_id,
    p.place_type::TEXT,
    p.name,
    p.country_code,
    p.region,
    p.city,
    p.lat,
    p.lon,
    p.address,
    p.phone,
    p.website,
    p.hours_json,
    p.amenities_json,
    p.services_json,
    p.claim_status::TEXT,
    p.verification_status::TEXT,
    p.trust_score_seed,
    p.slug,
    p.meta_title,
    p.meta_description,
    m.display_name AS category_name,
    m.description AS category_description,
    m.icon_name,
    m.slug AS category_slug,
    m.category_group
FROM public.places p
LEFT JOIN public.place_type_metadata m ON p.place_type::TEXT = m.place_type
WHERE m.is_active = true;

-- Grant read access
GRANT SELECT ON public.v_trucker_services_directory TO anon, authenticated;
GRANT SELECT ON public.place_type_metadata TO anon, authenticated;

-- ── 5. ADD DEDUP INDEXES ───────────────────────────────────────────────────
-- Prevent duplicate business entries from multiple scrape runs

CREATE UNIQUE INDEX IF NOT EXISTS idx_places_dedup_name_city_type 
ON public.places (name, city, place_type, country_code) 
WHERE data_source != 'seed';

-- ── 6. RLS ON METADATA ────────────────────────────────────────────────────

ALTER TABLE public.place_type_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY ptm_public_read ON public.place_type_metadata FOR SELECT USING (true);
CREATE POLICY ptm_sr ON public.place_type_metadata FOR ALL TO service_role USING (true) WITH CHECK (true);
