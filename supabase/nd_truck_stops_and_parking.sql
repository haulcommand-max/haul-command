-- ============================================================
-- NORTH DAKOTA TRUCK STOP DATABASE + CROWDFUNDED PARKING
-- Part of Haul Command Step 10: Secure Parking & Staging Rail
-- ============================================================

-- Truck Stops & Verified Waypoints Table
CREATE TABLE IF NOT EXISTS public.truck_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'ND',
    name TEXT NOT NULL,
    highway TEXT NOT NULL,
    parking_spots INTEGER NOT NULL DEFAULT 0,
    has_wifi BOOLEAN DEFAULT false,
    has_showers BOOLEAN DEFAULT false,
    has_scales BOOLEAN DEFAULT false,
    -- Haul Command specific
    hc_verified BOOLEAN DEFAULT false,
    hc_waypoint_decal BOOLEAN DEFAULT false,
    superload_accessible BOOLEAN DEFAULT false, -- can physically fit 14ft+ wide loads
    oversize_spots INTEGER DEFAULT 0,            -- spots specifically for oversize
    max_load_width_ft DECIMAL(5,2),
    max_load_height_ft DECIMAL(5,2),
    -- Crowdfunded parking
    crowdfund_active BOOLEAN DEFAULT false,
    crowdfund_partner_id UUID,
    member_rate_per_night DECIMAL(8,2) DEFAULT 15.00,
    nonmember_rate_per_night DECIMAL(8,2) DEFAULT 85.00,
    -- Nearest services
    nearest_maintenance_partner_id UUID,
    nearest_hotel_partner_id UUID,
    nearest_upfit_shop_id UUID,
    -- Geo
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.truck_stops ENABLE ROW LEVEL SECURITY;

-- Public read for all authenticated users
CREATE POLICY "All users can view truck stops"
    ON public.truck_stops FOR SELECT
    USING (auth.role() = 'authenticated');

-- Admins can modify
CREATE POLICY "Admins can modify truck stops"
    ON public.truck_stops FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- Index for geo queries
CREATE INDEX idx_truck_stops_location ON public.truck_stops (state, city);
CREATE INDEX idx_truck_stops_highway ON public.truck_stops (highway);
CREATE INDEX idx_truck_stops_crowdfund ON public.truck_stops (crowdfund_active) WHERE crowdfund_active = true;

-- ============================================================
-- SEED DATA: 45 North Dakota Truck Stops
-- ============================================================

INSERT INTO public.truck_stops (city, state, name, highway, parking_spots, has_wifi, has_showers, has_scales) VALUES
    ('Beach',        'ND', 'Flying J',                     'I-94 / Hwy 16',                60,  true,  true,  true),
    ('Belfield',     'ND', 'Superpumper',                  'I-94',                          60,  false, true,  false),
    ('Bismarck',     'ND', 'Stamart Travel Center',        'I-94',                          50,  true,  true,  true),
    ('Carrington',   'ND', 'Stop N Go',                    'US 281 / 52 / ND 200',          10,  false, true,  false),
    ('Devils Lake',  'ND', 'Cenex C-Store',                'US 2 W / ND 19',                15,  false, true,  false),
    ('Dickinson',    'ND', 'The General Store',             'I-94',                          8,   false, false, false),
    ('Dickinson',    'ND', 'Tiger Discount Truck Stop',     'I-94',                          60,  true,  true,  false),
    ('Dunseith',     'ND', 'Dales Truck Stop',              'US 281 / ND 3 / 5',             20,  false, true,  false),
    ('Fargo',        'ND', 'Flying J',                      'I-29',                          150, true,  true,  true),
    ('Fargo',        'ND', 'Stamart Convenience',           'I-29',                          5,   false, false, false),
    ('Fargo',        'ND', 'Petro Stopping Center',         'I-94',                          150, true,  true,  true),
    ('Fargo (West)', 'ND', 'West Fargo Travel Plaza',       'I-94',                          15,  false, true,  false),
    ('Grand Forks',  'ND', 'Big Sioux Travel Plaza',        'I-29',                          150, true,  true,  true),
    ('Grand Forks',  'ND', 'Simonson Travel Center',        'I-29',                          60,  false, true,  true),
    ('Grand Forks',  'ND', 'Stamart Travel Center',         'I-29',                          60,  true,  true,  true),
    ('Hankinson',    'ND', 'MGS Oil',                       'I-29',                          20,  false, false, false),
    ('Harvey',       'ND', 'Little Mart',                   'US 52 W Bypass',                15,  false, false, false),
    ('Harwood',      'ND', 'Cenex',                         'I-29',                          20,  false, true,  false),
    ('Hillsboro',    'ND', 'Cenex',                         'I-29',                          3,   false, false, false),
    ('Jamestown',    'ND', 'Interstate Sinclair',            'I-94',                          15,  false, false, false),
    ('Jamestown',    'ND', 'Jamestown Truck Plaza',          'I-94',                          50,  false, true,  true),
    ('Jamestown',    'ND', 'Super Pumper',                   'I-94',                          30,  false, true,  false),
    ('Kenmare',      'ND', 'Cenex C-Store',                 'US 52 S',                       15,  false, true,  false),
    ('Mandan',       'ND', 'Freeway 147 Truck Stop',        'I-94',                          100, true,  true,  true),
    ('Minot',        'ND', 'Econo Stop',                    'US 2 / 52 Bypass (EB) / US 83', 60,  true,  true,  false),
    ('Minot',        'ND', 'Behms Truck Stop',              'US 2 / 52 W',                   60,  false, true,  false),
    ('Minot',        'ND', 'Schatz Crossroads Truck Stop',  'US 83 / US 2 / 52 Bypass',      15,  false, true,  false),
    ('New Salem',    'ND', 'U-Serve Gas & Grocery',          'I-94',                          8,   false, false, false),
    ('Pembina',      'ND', 'Gastrak',                       'I-29',                          50,  false, true,  false),
    ('Pembina',      'ND', 'Joliette Express',              'I-29',                          150, true,  true,  false),
    ('Richardton',   'ND', 'Cenex C-Store',                 'I-94',                          30,  false, false, false),
    ('Rugby',        'ND', 'Cenex C-Store',                 'US 2 W / ND 3',                 30,  false, true,  false),
    ('Rugby',        'ND', 'Hub',                           'US 2 / ND 3',                   40,  false, true,  false),
    ('Steele',       'ND', 'Coffee Cup Fuel Stop',          'I-94',                          20,  true,  true,  false),
    ('Sterling',     'ND', 'Tops Truck Stop',               'I-94',                          75,  false, true,  false),
    ('Tower City',   'ND', 'Tower Fuel Stop',               'I-94',                          75,  false, true,  false),
    ('Towner',       'ND', 'Cenex',                         'US 2 / 14',                     15,  false, false, false),
    ('Valley City',  'ND', 'Johns I-94 Tesoro',             'I-94',                          15,  false, false, false),
    ('Verona',       'ND', 'Good Oil',                      'ND 1 / ND 13',                  5,   false, false, false),
    ('Wahpeton',     'ND', 'Cenex C-Store',                 'ND 210 Bypass',                 20,  false, false, false),
    ('Wahpeton',     'ND', 'Northside Amoco',               'ND 210 Bypass',                 15,  false, false, false),
    ('Williston',    'ND', 'Williston Fuel Plaza',           'Hwy 2 / 85 NW',                15,  false, true,  false),
    ('Williston',    'ND', 'OK Conoco North',               'US 2 / 85 N',                   60,  false, true,  false),
    ('Wilton',       'ND', 'Wilton Cenex',                  'US 83',                         3,   false, false, false),
    ('Wyndmere',     'ND', 'Wyndmere Oil',                  'ND 18 N / ND 13',               15,  false, false, false);

-- ============================================================
-- CROWDFUNDED PARKING RAIL TABLES
-- ============================================================

-- Private Land Listings (AirBnB for Heavy Haul)
CREATE TABLE IF NOT EXISTS public.parking_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_name TEXT NOT NULL,
    owner_phone TEXT,
    owner_email TEXT,
    -- Property details
    property_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    -- Capacity
    total_spots INTEGER NOT NULL,
    max_vehicle_width_ft DECIMAL(5,2),
    max_vehicle_height_ft DECIMAL(5,2),
    max_vehicle_length_ft DECIMAL(5,2),
    surface_type TEXT CHECK (surface_type IN ('gravel', 'asphalt', 'concrete', 'dirt', 'grass')),
    -- Amenities
    has_lighting BOOLEAN DEFAULT false,
    has_fencing BOOLEAN DEFAULT false,
    has_security_camera BOOLEAN DEFAULT false,
    has_power_hookup BOOLEAN DEFAULT false,
    has_water BOOLEAN DEFAULT false,
    has_restroom BOOLEAN DEFAULT false,
    -- Pricing (Atmospheric)
    member_rate DECIMAL(8,2) NOT NULL DEFAULT 15.00,
    nonmember_rate DECIMAL(8,2) NOT NULL DEFAULT 85.00,
    revenue_split_owner DECIMAL(3,2) DEFAULT 0.70, -- 70% to landowner
    revenue_split_platform DECIMAL(3,2) DEFAULT 0.30, -- 30% to Haul Command
    -- Verification
    here_api_verified BOOLEAN DEFAULT false, -- 3D clearance verified via HERE
    verified_dimensions JSONB, -- {width_ft, height_ft, entry_angle_degrees}
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'deactivated')),
    listed_since TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parking Reservations
CREATE TABLE IF NOT EXISTS public.parking_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.parking_listings(id),
    carrier_id UUID REFERENCES public.carriers(id),
    vehicle_id UUID REFERENCES public.vehicle_profiles(id),
    -- Reservation details
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nights INTEGER NOT NULL,
    -- Pricing
    rate_per_night DECIMAL(8,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    pricing_tier TEXT NOT NULL CHECK (pricing_tier IN ('member', 'non_member')),
    owner_payout DECIMAL(10,2) NOT NULL,
    platform_revenue DECIMAL(10,2) NOT NULL,
    -- Payment
    payment_method TEXT CHECK (payment_method IN ('hall_pay', 'card', 'ewa_deduction')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    -- Verification
    navixy_proof_of_parking BOOLEAN DEFAULT false,
    check_in_confirmed TIMESTAMPTZ,
    check_out_confirmed TIMESTAMPTZ,
    -- Status
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.parking_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_reservations ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_parking_listings_location ON public.parking_listings (state, city);
CREATE INDEX idx_parking_listings_active ON public.parking_listings (status) WHERE status = 'active';
CREATE INDEX idx_parking_reservations_dates ON public.parking_reservations (check_in, check_out);
CREATE INDEX idx_parking_reservations_carrier ON public.parking_reservations (carrier_id);
