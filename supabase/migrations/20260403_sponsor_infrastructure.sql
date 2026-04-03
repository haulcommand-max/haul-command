-- ════════════════════════════════════════════════════════════════
-- Haul Command — Sponsor Infrastructure Tables
-- Migration: 2026-04-03
-- Author: Claude Opus (HEAVY_MODEL) revenue architecture sprint
-- ════════════════════════════════════════════════════════════════
-- Run in Supabase SQL Editor.
-- Tables: sponsor_inventory, sponsor_placements, sponsor_waitlist
-- ════════════════════════════════════════════════════════════════

-- ── 1. Sponsor Inventory ────────────────────────────────────────
-- Defines every available sponsor slot (by type + geo).
-- Tracks max_slots and filled_slots for availability management.

CREATE TABLE IF NOT EXISTS sponsor_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product identification
  sponsor_type TEXT NOT NULL,
    -- 'territory', 'corridor', 'port', 'training',
    -- 'emergency_fill', 'recruiter_card', 'weather_banner',
    -- 'push_campaign', 'data_portal', 'insurance_referral', 'equipment_affiliate'
  
  -- Geographic scope
  geo_key TEXT NOT NULL,
    -- For territory: state code (TX, CA) or country code (AU, GB)
    -- For corridor: corridor slug (i-35, i-10, texas-triangle)
    -- For port: port slug (port-of-long-beach, port-of-houston)
    -- For platform-wide: 'global'
  geo_label TEXT NOT NULL,
    -- Human-readable: "Texas", "I-35 Corridor", "Port of Long Beach"
  geo_type TEXT NOT NULL DEFAULT 'state',
    -- 'state', 'country', 'corridor', 'port', 'global'
  
  -- Availability
  max_slots INTEGER NOT NULL DEFAULT 1,
  filled_slots INTEGER NOT NULL DEFAULT 0,
  
  -- Pricing (stored in cents for precision)
  price_monthly_cents INTEGER NOT NULL,
    -- Territory: varies by market tier (mega=49900, major=39900, mid=29900, growth=19900, emerging=14900)
    -- Corridor: flagship=34900, primary=24900, secondary=17900
    -- Port: tier1=59900, tier2=44900, tier3=29900
  price_tier TEXT,
    -- 'mega', 'major', 'mid', 'growth', 'emerging' (for US states)
    -- 'gold', 'blue', 'silver', 'slate' (for countries)
    -- 'flagship', 'primary', 'secondary' (for corridors)
    -- 'tier1', 'tier2', 'tier3' (for ports)
  
  -- Status
  active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata for rich discovery pages
  discovery_url TEXT,         -- /near/houston-tx, /corridors/i-35
  description TEXT,           -- Short description for the /advertise page
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(sponsor_type, geo_key)
);

-- RLS: public read (for /advertise discovery), service_role write
ALTER TABLE sponsor_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sponsor_inventory_public_read"
  ON sponsor_inventory FOR SELECT USING (active = true);

CREATE POLICY "sponsor_inventory_service_write"
  ON sponsor_inventory FOR ALL USING (auth.role() = 'service_role');


-- ── 2. Sponsor Placements ───────────────────────────────────────
-- Active sponsor slots. One row per active placement.
-- Links sponsor_inventory → buyer entity → Stripe subscription.

CREATE TABLE IF NOT EXISTS sponsor_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  inventory_id UUID NOT NULL REFERENCES sponsor_inventory(id) ON DELETE RESTRICT,
  
  -- Buyer identity
  buyer_entity_id UUID,           -- references surfaces or profiles
  buyer_user_id UUID,             -- Supabase auth.users.id
  buyer_business_name TEXT,
  buyer_contact_email TEXT,
  
  -- Stripe
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active',
    -- 'active', 'paused', 'cancelled', 'expired', 'pending_payment'
  
  -- Dates
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,            -- null = ongoing monthly
  cancelled_at TIMESTAMPTZ,
  
  -- Metadata (impressions, clicks for reporting)
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: buyers can see own placements; service_role can see all
ALTER TABLE sponsor_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sponsor_placements_own_read"
  ON sponsor_placements FOR SELECT
  USING (buyer_user_id = auth.uid());

CREATE POLICY "sponsor_placements_service_all"
  ON sponsor_placements FOR ALL USING (auth.role() = 'service_role');


-- ── 3. Sponsor Waitlist ─────────────────────────────────────────
-- Queued buyers when all slots in an inventory item are filled.
-- Payment method held but not charged until slot opens.

CREATE TABLE IF NOT EXISTS sponsor_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  inventory_id UUID NOT NULL REFERENCES sponsor_inventory(id) ON DELETE CASCADE,
  
  -- Waiter identity
  claimant_email TEXT NOT NULL,
  claimant_name TEXT,
  entity_id UUID,
  user_id UUID,
  
  -- Stripe payment method (held, not charged)
  stripe_payment_method_id TEXT,
  stripe_customer_id TEXT,
  
  -- Queue management
  position INTEGER,               -- queue position (1 = next up)
  
  -- Notification tracking
  notified_at TIMESTAMPTZ,        -- when we sent the "slot available" email
  notified_response TEXT,         -- 'accepted', 'declined', 'no_response'
  responded_at TIMESTAMPTZ,
  
  -- Meta
  notes TEXT,                     -- optional internal notes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sponsor_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sponsor_waitlist_own_read"
  ON sponsor_waitlist FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "sponsor_waitlist_public_insert"
  ON sponsor_waitlist FOR INSERT WITH CHECK (true);

CREATE POLICY "sponsor_waitlist_service_all"
  ON sponsor_waitlist FOR ALL USING (auth.role() = 'service_role');


-- ── 4. Triggers ─────────────────────────────────────────────────

-- Auto-update updated_at on sponsor_inventory
CREATE OR REPLACE FUNCTION update_sponsor_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sponsor_inventory_updated_at
  BEFORE UPDATE ON sponsor_inventory
  FOR EACH ROW EXECUTE FUNCTION update_sponsor_inventory_updated_at();

-- Auto-update updated_at on sponsor_placements
CREATE TRIGGER sponsor_placements_updated_at
  BEFORE UPDATE ON sponsor_placements
  FOR EACH ROW EXECUTE FUNCTION update_sponsor_inventory_updated_at();

-- Auto-sync filled_slots when a placement is created/cancelled
CREATE OR REPLACE FUNCTION sync_sponsor_filled_slots()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sponsor_inventory
    SET filled_slots = (
      SELECT COUNT(*) FROM sponsor_placements
      WHERE inventory_id = COALESCE(NEW.inventory_id, OLD.inventory_id)
        AND status = 'active'
    )
  WHERE id = COALESCE(NEW.inventory_id, OLD.inventory_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_filled_slots_on_placement_change
  AFTER INSERT OR UPDATE OR DELETE ON sponsor_placements
  FOR EACH ROW EXECUTE FUNCTION sync_sponsor_filled_slots();

-- Auto-assign queue positions in waitlist
CREATE OR REPLACE FUNCTION assign_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  NEW.position = (
    SELECT COALESCE(MAX(position), 0) + 1
    FROM sponsor_waitlist
    WHERE inventory_id = NEW.inventory_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assign_waitlist_position_on_insert
  BEFORE INSERT ON sponsor_waitlist
  FOR EACH ROW EXECUTE FUNCTION assign_waitlist_position();


-- ── 5. Seed: Initial Sponsor Inventory ──────────────────────────
-- Seed the highest-value US territory slots to make /advertise/territory functional.

INSERT INTO sponsor_inventory (sponsor_type, geo_key, geo_label, geo_type, max_slots, price_monthly_cents, discovery_url, description)
VALUES
  -- ═══ US Territory Sponsors — Market-Tier Dynamic Pricing ═══
  -- MEGA tier ($499/mo) — Top 3 states by oversize permit volume
  ('territory', 'TX', 'Texas',        'state', 1, 49900, '/directory?state=TX', 'Own the #1 heavy haul market in America — I-35, I-10, and Texas Triangle traffic'),
  ('territory', 'CA', 'California',   'state', 1, 49900, '/directory?state=CA', 'Largest US economy. Major port activity through Long Beach and Oakland.'),
  ('territory', 'FL', 'Florida',      'state', 1, 49900, '/directory?state=FL', 'Major port state. High wind energy and industrial project traffic.'),

  -- MAJOR tier ($399/mo) — Top 4-10 by permit volume + corridor presence
  ('territory', 'OK', 'Oklahoma',     'state', 1, 39900, '/directory?state=OK', 'I-35 and I-40 intersection. High oil-field and wind energy haul traffic.'),
  ('territory', 'OH', 'Ohio',         'state', 1, 39900, '/directory?state=OH', 'Industrial heartland. High manufacturing equipment movement.'),
  ('territory', 'PA', 'Pennsylvania', 'state', 1, 39900, '/directory?state=PA', 'Northeast corridor anchor state with high infrastructure project volume.'),
  ('territory', 'IL', 'Illinois',     'state', 1, 39900, '/directory?state=IL', 'Chicago logistics hub. I-55/I-57 corridor central dispatch point.'),
  ('territory', 'GA', 'Georgia',      'state', 1, 39900, '/directory?state=GA', 'Port of Savannah — 4th busiest US port by container volume.'),
  ('territory', 'LA', 'Louisiana',    'state', 1, 39900, '/directory?state=LA', 'Port of New Orleans, LNG export, petrochemical equipment corridor.'),
  ('territory', 'IN', 'Indiana',      'state', 1, 39900, '/directory?state=IN', 'Indianapolis crossroads. I-65/I-69/I-70 corridor intersection.'),

  -- MID tier ($299/mo) — Active heavy haul states, moderate corridor density
  ('territory', 'NC', 'North Carolina','state', 1, 29900, '/directory?state=NC', 'Growing wind energy market on the East Coast.'),
  ('territory', 'WA', 'Washington',   'state', 1, 29900, '/directory?state=WA', 'Port of Seattle/Tacoma + major wind corridor in eastern WA.'),
  ('territory', 'NY', 'New York',     'state', 1, 29900, '/directory?state=NY', 'Port of NY/NJ, major construction and infrastructure projects.'),
  ('territory', 'MI', 'Michigan',     'state', 1, 29900, '/directory?state=MI', 'Auto industry hub. Great Lakes port system.'),
  ('territory', 'MN', 'Minnesota',    'state', 1, 29900, '/directory?state=MN', 'Wind energy leader. I-35 northern terminus.'),
  ('territory', 'TN', 'Tennessee',    'state', 1, 29900, '/directory?state=TN', 'Nashville/Memphis crossroads. I-40/I-65 intersection.'),
  ('territory', 'CO', 'Colorado',     'state', 1, 29900, '/directory?state=CO', 'Denver hub. I-25/I-70, wind + solar projects.'),
  ('territory', 'AZ', 'Arizona',      'state', 1, 29900, '/directory?state=AZ', 'I-10/I-17, massive solar farm installations.'),
  ('territory', 'SC', 'South Carolina', 'state', 1, 29900, '/directory?state=SC', 'Port of Charleston, BMW/Volvo manufacturing.'),
  ('territory', 'VA', 'Virginia',     'state', 1, 29900, '/directory?state=VA', 'Port of Virginia, I-81 corridor.'),

  -- ═══ Global Territory Sponsors — Tiered by country tier ═══
  -- Gold tier ($399/mo)
  ('territory', 'AU', 'Australia',    'country', 2, 39900, '/directory?country=AU', 'Australia — major resource sector haul market across QLD, WA, and NT.'),
  ('territory', 'CA-C', 'Canada',     'country', 2, 39900, '/directory?country=CA', 'Canada — oil sands, Alberta infrastructure, and BC port access.'),
  ('territory', 'GB', 'United Kingdom','country', 1, 39900, '/directory?country=GB', 'UK — abnormal load escort under statutory order framework.'),
  ('territory', 'DE', 'Germany',      'country', 1, 39900, '/directory?country=DE', 'Germany — BF3 escort vehicle system, EU heavy transport leader.'),
  ('territory', 'BR', 'Brazil',       'country', 2, 39900, '/directory?country=BR', 'Brazil — largest LatAm economy, Santos-São Paulo corridor.'),
  -- Blue tier ($339/mo)
  ('territory', 'FR', 'France',       'country', 1, 33900, '/directory?country=FR', 'France — Le Havre-Paris corridor, nuclear + infrastructure projects.'),
  ('territory', 'SA', 'Saudi Arabia', 'country', 1, 33900, '/directory?country=SA', 'Saudi Arabia — NEOM + Vision 2030 megaprojects.'),
  ('territory', 'MX', 'Mexico',       'country', 2, 33900, '/directory?country=MX', 'Mexico — nearshoring boom, Monterrey-Laredo corridor.'),
  ('territory', 'IN-C', 'India',      'country', 2, 33900, '/directory?country=IN', 'India — fastest growing infrastructure market globally.'),

  -- ═══ Corridor Sponsors — Tiered Pricing ═══
  -- Flagship ($349/mo)
  ('corridor', 'texas-triangle', 'Texas Triangle', 'corridor', 1, 34900, '/corridors/texas-triangle', 'Dallas–Houston–San Antonio — the highest-density heavy haul market in the US.'),
  ('corridor', 'i-35', 'I-35 Corridor',           'corridor', 1, 34900, '/corridors/i-35',          'Texas to Minnesota — wind energy component and energy sector moves.'),
  ('corridor', 'i-10', 'I-10 Corridor',           'corridor', 1, 34900, '/corridors/i-10',          'Florida to California — petrochemical and cross-country heavy haul.'),
  -- Primary ($249/mo)
  ('corridor', 'i-40', 'I-40 Corridor',           'corridor', 1, 24900, '/corridors/i-40',          'Oklahoma to California — I-40 is one of the highest-volume oversize routes.'),
  ('corridor', 'i-95', 'I-95 East Coast',         'corridor', 1, 24900, '/corridors/i-95',          'Maine to Florida — East Coast infrastructure project and port traffic.'),
  ('corridor', 'i-80', 'I-80 Cross-Country',      'corridor', 1, 24900, '/corridors/i-80',          'New Jersey to California — transcontinental heavy haul route.'),
  ('corridor', 'i-70', 'I-70 Heartland',          'corridor', 1, 24900, '/corridors/i-70',          'Utah to Maryland — manufacturing and defense equipment transport.'),

  -- ═══ Port Sponsors — Tiered Pricing ═══
  -- Tier 1 ($599/mo)
  ('port', 'port-of-long-beach',   'Port of Long Beach',   'port', 2, 59900, '/ports/port-of-long-beach',   'Busiest US port. High TWIC-required escort demand for cargo hauls.'),
  ('port', 'port-of-houston',      'Port of Houston',       'port', 2, 59900, '/ports/port-of-houston',      '#2 US port by cargo tonnage. Oil refinery and petrochemical equipment moves.'),
  -- Tier 2 ($449/mo)
  ('port', 'port-of-new-york',     'Port of New York/NJ',   'port', 2, 44900, '/ports/port-of-new-york',     'Largest East Coast port. Major industrial infrastructure imports.'),
  ('port', 'port-of-savannah',     'Port of Savannah',      'port', 2, 44900, '/ports/port-of-savannah',     '4th busiest US container port. Growing auto and manufacturing imports.'),
  ('port', 'port-of-seattle',      'Port of Seattle/Tacoma','port', 2, 44900, '/ports/port-of-seattle',      'Pacific Northwest gateway. High wind energy component imports.'),
  ('port', 'port-of-virginia',     'Port of Virginia',      'port', 2, 44900, '/ports/port-of-virginia',     'Fastest-growing East Coast port. Major military logistics.'),

  -- ═══ Platform-Wide ═══
  ('data_portal',       'global', 'Data Intelligence Portal', 'global', 1, 99900, '/data',      'Presenting sponsor of the Haul Command Intelligence Marketplace.')
ON CONFLICT (sponsor_type, geo_key) DO NOTHING;
