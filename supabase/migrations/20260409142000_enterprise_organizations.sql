-- Migration: 20260409142000_enterprise_organizations.sql
-- Description: Establishes Corporate/Enterprise RBAC and Seat Allocation Schema for Training & Compliance

CREATE TYPE enterprise_member_role_enum AS ENUM (
    'owner',
    'admin',
    'compliance_officer',
    'dispatcher',
    'driver',
    'pilot_car_operator'
);

-- ── 1. The Enterprise Organization ──
CREATE TABLE public.hc_enterprise_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    legal_name TEXT,
    tax_id TEXT,
    public_slug TEXT UNIQUE,
    verified_fleet BOOLEAN DEFAULT false,
    trust_score_override INTEGER CHECK (trust_score_override >= 0 AND trust_score_override <= 100),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_approval')),
    
    -- Real-time Compliance Totals (Aggregated by worker)
    total_seats_purchased INTEGER DEFAULT 0,
    total_seats_assigned INTEGER DEFAULT 0,
    total_seats_completed INTEGER DEFAULT 0,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Members (RBAC Binding) ──
-- Note: 'user_id' typically maps to auth.users, but can also join to public.identities
CREATE TABLE public.hc_org_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.hc_enterprise_organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Logical link to auth.users.id
    
    role enterprise_member_role_enum NOT NULL DEFAULT 'driver',
    status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'suspended', 'deactivated')),
    
    seat_assigned BOOLEAN DEFAULT false,
    training_status TEXT DEFAULT 'unassigned' CHECK (training_status IN ('unassigned', 'pending', 'in_progress', 'completed')),
    certification_tier TEXT, -- 'Pending', 'HC Certified', 'AV-Ready', 'Elite'
    individual_trust_score INTEGER CHECK (individual_trust_score >= 0 AND individual_trust_score <= 100),
    
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ,
    
    UNIQUE(org_id, user_id)
);

-- ── 3. Bulk Seat Purchases (Ledger) ──
CREATE TABLE public.hc_org_seat_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.hc_enterprise_organizations(id) ON DELETE CASCADE,
    
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'grant', 'revocation')),
    seat_count INTEGER NOT NULL,
    price_paid NUMERIC(12, 2) DEFAULT 0.00,
    stripe_checkout_id TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID
);

-- ── Indexes ──
CREATE INDEX idx_hc_ent_org_slug ON public.hc_enterprise_organizations(public_slug);
CREATE INDEX idx_hc_ent_org_verified ON public.hc_enterprise_organizations(verified_fleet);
CREATE INDEX idx_hc_org_member_user ON public.hc_org_members(user_id);
CREATE INDEX idx_hc_org_member_role ON public.hc_org_members(org_id, role);

-- ── RLS ──
ALTER TABLE public.hc_enterprise_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_org_seat_ledger ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies require specific access controls defined at application runtime,
-- but baseline readable by members mapping user_id.

CREATE POLICY "Members can view their own org" 
    ON public.hc_enterprise_organizations FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.hc_org_members 
        WHERE org_id = hc_enterprise_organizations.id AND user_id = auth.uid()
    ));

CREATE POLICY "Members can view other members in their org"
    ON public.hc_org_members FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.hc_org_members as m2 
        WHERE m2.org_id = hc_org_members.org_id AND m2.user_id = auth.uid()
    ));

-- ── Automated Updated At Trigger ──
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_hc_enterprise_orgs_updated_at
BEFORE UPDATE ON public.hc_enterprise_organizations
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Dummy Seeding for the UI (Matches the DRIVERS array in the page.tsx specification)
INSERT INTO public.hc_enterprise_organizations (
    id, name, public_slug, verified_fleet, trust_score_override, total_seats_purchased, total_seats_assigned, total_seats_completed
) VALUES (
    'e0000000-0000-0000-0000-000000000001', 'Example Logistics Corp', 'example-logistics-corp', true, 88, 25, 18, 12
);
