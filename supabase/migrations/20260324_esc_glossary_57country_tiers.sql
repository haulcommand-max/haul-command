-- ============================================================================
-- ESC PEVO GLOSSARY + 57-COUNTRY TIER SEED
-- Source: https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know
-- ============================================================================

-- Ensure glossary table exists
CREATE TABLE IF NOT EXISTS public.glossary_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  definition text NOT NULL,
  category text NOT NULL DEFAULT 'official', -- official, informal, regulation
  source_url text,
  country_code text DEFAULT 'US',
  language text DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_glossary_term_cat ON public.glossary_terms(term, category);

-- ── OFFICIAL TERMS ──
INSERT INTO public.glossary_terms (term, definition, category, source_url) VALUES
('ANSI', 'American National Standards Institute. Creates standards for a wide range of sectors in the United States. PEVOs need high visibility clothing that conforms to ANSI standards.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Curfew', 'Times of the day that an Oversize Load may not travel on particular roads.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Daylight Hours', 'In Washington State, defined as one half hour before sunrise until one half hour after sunset. Verify daylight hours in each state you operate.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Deflection', 'The amount the tip of the high pole bends while traveling at high speed.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Divided Highway', 'A highway where opposing lanes are divided by a barrier (concrete barrier or median strip).', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Undivided Highway', 'A highway without a physical barrier, where opposing lanes are divided only by a double yellow line.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Divisible Load', 'A load that can be divided into smaller sections that can be transported separately.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Extra-Legal Vehicle', 'Any vehicle that exceeds legal dimensions and/or weights. An Oversize Load is an extra-legal vehicle.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('FMCSA', 'Federal Motor Carrier Safety Administration.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Fog Line', 'A solid white line that divides the road from the shoulder.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Gore Strip', 'The area dividing two merging lanes.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Height', 'The total vertical dimension of a vehicle above the ground surface including any load or accessories.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Leapfrogging', 'When, on hilly or curvy terrain, the load must be stopped and traffic control measures put in place before proceeding.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Lowboy', 'A type of trailer with low clearance that can accommodate taller loads. May refer to a drop deck and/or Removable Goose Neck (RGN) trailer.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('MUTCD', 'Manual on Uniform Traffic Control Devices, published by the Federal Highway Administration. Defines national standards for traffic control devices.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Non-Divisible Load', 'Any load or vehicle exceeding applicable length or weight limits that cannot be separated without compromising intended use, destroying value, or requiring more than eight work hours to dismantle.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('OSHA', 'Occupational Safety and Health Administration. The division of the U.S. government that regulates safety and health in workplaces.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Pilot/Escort Vehicle (P/E)', 'A motor vehicle used for the express purpose of acting as a warning and guide vehicle for extra-legal vehicles.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Rear Overhang', 'The distance from the center of the last axle to the end of the load or vehicle (whichever is longer).', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Regional Permit', 'A permit issued for interstate movement of certain Oversize Loads on highways designated by jurisdictions participating in the Western Regional Agreement.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Retroreflective', 'A type of material designed to reflect light directly back toward its source. Required for flagging duties.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Safe Haven', 'An area specifically approved by federal, state, or local authorities for parking of unattended vehicles containing hazardous materials.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Steerperson', 'An individual who steers any axle (or group of axles) of an articulated trailer, while not on the trailer.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Superload', 'Any load requiring special analysis and approval by one or more state permit offices because of its extreme dimensions or weight.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Tillerman', 'An individual physically located on the trailer, steering the rear axles of a Commercial Motor Vehicle at highway speeds.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Traffic Control Plan (TCP)', 'Depicts the route and specific procedures to be followed to provide safe movement along the route, including lane restrictions and use of flaggers.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Temporary Traffic Control (TTC)', 'Planning, equipment, and actions that provide for the safe movement of road users during times when normal use of the roadway is suspended.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('TWIC Card', 'Transportation Workers Identification Credential. Required since 2009 for anyone entering a secured area of a maritime port.', 'official', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Haul Command', 'Haul Command is the global operating system and #1 pilot car directory for the heavy haul, oversize load, and specialized freight transportation industries. Our routing platform provides real-time route surveys, DOT permit compliance, height pole escort verification, and an active oversize load board to match freight brokers with certified PEVO (Pilot/Escort Vehicle Operator) professionals across 120 countries.', 'official', 'https://haulcommand.com')
ON CONFLICT (term, category) DO NOTHING;

-- ── INFORMAL LINGO ──
INSERT INTO public.glossary_terms (term, definition, category, source_url) VALUES
('Alligators/Gators', 'Shredded pieces of blown tire lying in or near the lane where the load may hit them.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Back', 'A vehicle coming toward the load.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Back Off', 'Slow down.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Bear', 'Law enforcement of any kind.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Bumpin'' Up', 'An increase in the current posted speed limit.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Cat Tails', 'Delineators or mile marker posts.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Center Up', 'The lead/high pole escort instructs the driver where to drive while crossing a bridge or covered structure to ensure the load gets across safely.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Chicken Shack', 'Weigh station.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Clean On-Ramp', 'An on-ramp free of vehicles.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Dirty On-Ramp', 'An on-ramp with vehicles.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Dress Down', 'Removing banners, lowering signs and flags, and turning off the warning lights on your vehicle.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Dress Up', 'Raising the oversize load sign, securing banners to bumpers, and placing flags on your pilot car vehicle.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Drop Down', 'A decrease in the current posted speed limit.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Eighteens/18s', 'Semitrucks (18-wheelers).', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Fours/4s', 'Passenger cars or trucks.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Hard', 'Fast.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Left Track', 'The left side of a lane where the tires would naturally travel.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Mustard', 'The yellow line.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Parking Lot', 'A semitruck hauling cars.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Pocket', 'Side road along your route that enters the road you are traveling. Can be right pocket or left pocket.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Pork Chop', 'Small island at an intersection, usually with a sign post in it.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Right Track', 'The right side of a lane where the tires would naturally travel.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Shoe Fly', 'Driving the wrong way on a turn lane to negotiate a corner too tight for a long load. Traffic in both directions must be completely blocked.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Skids', 'Flexible piping with ropes running through them. Placed over the top of a load; if the Lead''s height pole tags something low, the skids help it glide underneath.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Skinny Bridge', 'A narrow bridge or overpass with less than a foot of shoulder off the fog line.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Steppin'' Out', 'A lead calls this out when speeding up to increase their distance from the load.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Tag', 'Trailer being pulled by a vehicle.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Tiger Tails', 'Larger delineators with a yellow background and diagonal black lines.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Times Two', 'Multiples of one kind of vehicle.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Up', 'A vehicle passing the load from behind.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Wiggle Wagon', 'Semitruck with a trailer. In some states, wiggle wagons have multiple trailers.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know'),
('Zipper', 'White or yellow dashed lines separating lanes on roadways, highways, or interstates.', 'informal', 'https://www.esc.org/safety-library/pilot-car-pevo-terms-to-know')
ON CONFLICT (term, category) DO NOTHING;


-- ============================================================================
-- 57-COUNTRY TIER SYSTEM
-- Haul Command Global Market Tiers for expansion priority
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.country_tiers (
  country_code text PRIMARY KEY,
  country_name text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('gold','blue','silver','slate')),
  tier_rank int NOT NULL, -- 1=gold, 2=blue, 3=silver, 4=slate
  flag_emoji text,
  expansion_priority int DEFAULT 50,
  market_status text DEFAULT 'planned', -- active, launching, planned
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tier A — Gold (10) — Highest priority, most mature markets
INSERT INTO public.country_tiers (country_code, country_name, tier, tier_rank, flag_emoji, expansion_priority, market_status) VALUES
('US', 'United States', 'gold', 1, '🇺🇸', 100, 'active'),
('CA', 'Canada', 'gold', 1, '🇨🇦', 95, 'active'),
('AU', 'Australia', 'gold', 1, '🇦🇺', 90, 'launching'),
('GB', 'United Kingdom', 'gold', 1, '🇬🇧', 88, 'launching'),
('NZ', 'New Zealand', 'gold', 1, '🇳🇿', 85, 'launching'),
('ZA', 'South Africa', 'gold', 1, '🇿🇦', 82, 'planned'),
('DE', 'Germany', 'gold', 1, '🇩🇪', 80, 'planned'),
('NL', 'Netherlands', 'gold', 1, '🇳🇱', 78, 'planned'),
('AE', 'United Arab Emirates', 'gold', 1, '🇦🇪', 75, 'planned'),
('BR', 'Brazil', 'gold', 1, '🇧🇷', 72, 'planned')
ON CONFLICT (country_code) DO UPDATE SET tier = EXCLUDED.tier, tier_rank = EXCLUDED.tier_rank, expansion_priority = EXCLUDED.expansion_priority, market_status = EXCLUDED.market_status;

-- Tier B — Blue (18)
INSERT INTO public.country_tiers (country_code, country_name, tier, tier_rank, flag_emoji, expansion_priority, market_status) VALUES
('IE', 'Ireland', 'blue', 2, '🇮🇪', 65, 'planned'),
('SE', 'Sweden', 'blue', 2, '🇸🇪', 64, 'planned'),
('NO', 'Norway', 'blue', 2, '🇳🇴', 63, 'planned'),
('DK', 'Denmark', 'blue', 2, '🇩🇰', 62, 'planned'),
('FI', 'Finland', 'blue', 2, '🇫🇮', 61, 'planned'),
('BE', 'Belgium', 'blue', 2, '🇧🇪', 60, 'planned'),
('AT', 'Austria', 'blue', 2, '🇦🇹', 59, 'planned'),
('CH', 'Switzerland', 'blue', 2, '🇨🇭', 58, 'planned'),
('ES', 'Spain', 'blue', 2, '🇪🇸', 57, 'planned'),
('FR', 'France', 'blue', 2, '🇫🇷', 56, 'planned'),
('IT', 'Italy', 'blue', 2, '🇮🇹', 55, 'planned'),
('PT', 'Portugal', 'blue', 2, '🇵🇹', 54, 'planned'),
('SA', 'Saudi Arabia', 'blue', 2, '🇸🇦', 53, 'planned'),
('QA', 'Qatar', 'blue', 2, '🇶🇦', 52, 'planned'),
('MX', 'Mexico', 'blue', 2, '🇲🇽', 70, 'planned'),
('IN', 'India', 'blue', 2, '🇮🇳', 68, 'planned'),
('ID', 'Indonesia', 'blue', 2, '🇮🇩', 50, 'planned'),
('TH', 'Thailand', 'blue', 2, '🇹🇭', 49, 'planned')
ON CONFLICT (country_code) DO UPDATE SET tier = EXCLUDED.tier, tier_rank = EXCLUDED.tier_rank, expansion_priority = EXCLUDED.expansion_priority;

-- Tier C — Silver (26)
INSERT INTO public.country_tiers (country_code, country_name, tier, tier_rank, flag_emoji, expansion_priority, market_status) VALUES
('PL', 'Poland', 'silver', 3, '🇵🇱', 45, 'planned'),
('CZ', 'Czech Republic', 'silver', 3, '🇨🇿', 44, 'planned'),
('SK', 'Slovakia', 'silver', 3, '🇸🇰', 43, 'planned'),
('HU', 'Hungary', 'silver', 3, '🇭🇺', 42, 'planned'),
('SI', 'Slovenia', 'silver', 3, '🇸🇮', 41, 'planned'),
('EE', 'Estonia', 'silver', 3, '🇪🇪', 40, 'planned'),
('LV', 'Latvia', 'silver', 3, '🇱🇻', 39, 'planned'),
('LT', 'Lithuania', 'silver', 3, '🇱🇹', 38, 'planned'),
('HR', 'Croatia', 'silver', 3, '🇭🇷', 37, 'planned'),
('RO', 'Romania', 'silver', 3, '🇷🇴', 36, 'planned'),
('BG', 'Bulgaria', 'silver', 3, '🇧🇬', 35, 'planned'),
('GR', 'Greece', 'silver', 3, '🇬🇷', 34, 'planned'),
('TR', 'Turkey', 'silver', 3, '🇹🇷', 48, 'planned'),
('KW', 'Kuwait', 'silver', 3, '🇰🇼', 33, 'planned'),
('OM', 'Oman', 'silver', 3, '🇴🇲', 32, 'planned'),
('BH', 'Bahrain', 'silver', 3, '🇧🇭', 31, 'planned'),
('SG', 'Singapore', 'silver', 3, '🇸🇬', 47, 'planned'),
('MY', 'Malaysia', 'silver', 3, '🇲🇾', 30, 'planned'),
('JP', 'Japan', 'silver', 3, '🇯🇵', 46, 'planned'),
('KR', 'South Korea', 'silver', 3, '🇰🇷', 44, 'planned'),
('CL', 'Chile', 'silver', 3, '🇨🇱', 29, 'planned'),
('AR', 'Argentina', 'silver', 3, '🇦🇷', 28, 'planned'),
('CO', 'Colombia', 'silver', 3, '🇨🇴', 27, 'planned'),
('PE', 'Peru', 'silver', 3, '🇵🇪', 26, 'planned'),
('VN', 'Vietnam', 'silver', 3, '🇻🇳', 25, 'planned'),
('PH', 'Philippines', 'silver', 3, '🇵🇭', 24, 'planned')
ON CONFLICT (country_code) DO UPDATE SET tier = EXCLUDED.tier, tier_rank = EXCLUDED.tier_rank, expansion_priority = EXCLUDED.expansion_priority;

-- Tier D — Slate (3)
INSERT INTO public.country_tiers (country_code, country_name, tier, tier_rank, flag_emoji, expansion_priority, market_status) VALUES
('UY', 'Uruguay', 'slate', 4, '🇺🇾', 15, 'planned'),
('PA', 'Panama', 'slate', 4, '🇵🇦', 14, 'planned'),
('CR', 'Costa Rica', 'slate', 4, '🇨🇷', 13, 'planned')
ON CONFLICT (country_code) DO UPDATE SET tier = EXCLUDED.tier, tier_rank = EXCLUDED.tier_rank, expansion_priority = EXCLUDED.expansion_priority;

-- Enable RLS
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "glossary_public_read" ON public.glossary_terms FOR SELECT USING (true);
CREATE POLICY "country_tiers_public_read" ON public.country_tiers FOR SELECT USING (true);
CREATE POLICY "sr_glossary" ON public.glossary_terms FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "sr_country_tiers" ON public.country_tiers FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_glossary_category ON public.glossary_terms(category);
CREATE INDEX IF NOT EXISTS idx_country_tiers_tier ON public.country_tiers(tier, expansion_priority DESC);
