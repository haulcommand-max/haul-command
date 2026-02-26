-- Migration: 20260220_jurisdiction_map_schema.sql
-- Jurisdiction map infrastructure per Anti-Gravity Protocol Zero

-- 1) jurisdictions
CREATE TABLE IF NOT EXISTS public.jurisdictions (
    jurisdiction_code text PRIMARY KEY,
    name text NOT NULL,
    type text NOT NULL,
    country text NOT NULL
);

-- 2) operator_listings
CREATE TABLE IF NOT EXISTS public.operator_listings (
    operator_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    business_name text NOT NULL,
    phone text NOT NULL,
    website_url text,
    categories text[],
    verified boolean DEFAULT false,
    rating numeric DEFAULT 0,
    response_time_sec_avg integer DEFAULT 0,
    coverage_notes text,
    jurisdiction_code text NOT NULL REFERENCES public.jurisdictions(jurisdiction_code) ON UPDATE CASCADE ON DELETE RESTRICT,
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operator_listings_jurisdiction ON public.operator_listings(jurisdiction_code);
CREATE INDEX IF NOT EXISTS idx_operator_listings_verified_rating ON public.operator_listings(verified, rating);
CREATE INDEX IF NOT EXISTS idx_operator_listings_jur_ver_rat ON public.operator_listings(jurisdiction_code, verified, rating);

-- 3) jurisdiction_rulepacks
CREATE TABLE IF NOT EXISTS public.jurisdiction_rulepacks (
    rulepack_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_code text NOT NULL REFERENCES public.jurisdictions(jurisdiction_code) ON UPDATE CASCADE ON DELETE RESTRICT,
    topic text NOT NULL,
    summary text NOT NULL,
    source_links text[],
    effective_date date,
    updated_at timestamptz DEFAULT now(),
    UNIQUE(jurisdiction_code, topic)
);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_rulepacks_jurisdiction ON public.jurisdiction_rulepacks(jurisdiction_code);

-- 4) jurisdiction_support_contacts
CREATE TABLE IF NOT EXISTS public.jurisdiction_support_contacts (
    contact_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_code text NOT NULL REFERENCES public.jurisdictions(jurisdiction_code) ON UPDATE CASCADE ON DELETE RESTRICT,
    contact_type text NOT NULL,
    label text NOT NULL,
    phone text,
    website_url text,
    notes text,
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_support_contacts_jur_type ON public.jurisdiction_support_contacts(jurisdiction_code, contact_type);

-- 5) jurisdiction_content_cache
CREATE TABLE IF NOT EXISTS public.jurisdiction_content_cache (
    cache_key text PRIMARY KEY,
    jurisdiction_code text NOT NULL REFERENCES public.jurisdictions(jurisdiction_code) ON UPDATE CASCADE ON DELETE CASCADE,
    payload_json jsonb NOT NULL,
    expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_content_cache_jur ON public.jurisdiction_content_cache(jurisdiction_code);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_content_cache_expires ON public.jurisdiction_content_cache(expires_at);

-- Add home jurisdiction string to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_jurisdiction_code text REFERENCES public.jurisdictions(jurisdiction_code) ON UPDATE CASCADE ON DELETE SET NULL;


-- 6) RLS + Policies
ALTER TABLE public.jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurisdiction_rulepacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurisdiction_support_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurisdiction_content_cache ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "public_read_jurisdictions" ON public.jurisdictions FOR SELECT USING (true);
CREATE POLICY "public_read_rulepacks" ON public.jurisdiction_rulepacks FOR SELECT USING (true);
CREATE POLICY "public_read_support_contacts" ON public.jurisdiction_support_contacts FOR SELECT USING (true);
CREATE POLICY "public_read_by_jurisdiction" ON public.operator_listings FOR SELECT USING (jurisdiction_code IS NOT NULL);
CREATE POLICY "public_read_cache" ON public.jurisdiction_content_cache FOR SELECT USING (true);

-- Active user update
CREATE POLICY "owner_can_edit_own_listing_update" ON public.operator_listings FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "owner_can_edit_own_listing_delete" ON public.operator_listings FOR DELETE USING (auth.uid() = owner_id);

-- Service role full access
CREATE POLICY "service_role_all_jurisdictions" ON public.jurisdictions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_rulepacks" ON public.jurisdiction_rulepacks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_contacts" ON public.jurisdiction_support_contacts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_listings" ON public.operator_listings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_cache" ON public.jurisdiction_content_cache FOR ALL USING (auth.role() = 'service_role');


-- 7) RPC get_jurisdiction_drawer(jurisdiction_code text)
CREATE OR REPLACE FUNCTION public.get_jurisdiction_drawer(p_jurisdiction_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_drawer jsonb;
    v_meta record;
    v_operators jsonb;
    v_rulepacks jsonb;
    v_support_contacts jsonb;
BEGIN
    SELECT j.jurisdiction_code, j.name, now() as updated_at
    INTO v_meta
    FROM public.jurisdictions j
    WHERE j.jurisdiction_code = p_jurisdiction_code;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'meta', null,
            'operators', '[]'::jsonb,
            'rulepacks', '[]'::jsonb,
            'support_contacts', '[]'::jsonb,
            'message', 'No data yet for this jurisdiction'
        );
    END IF;

    SELECT COALESCE(jsonb_agg(ol ORDER BY ol.verified DESC, ol.rating DESC, ol.response_time_sec_avg ASC), '[]'::jsonb)
    INTO v_operators
    FROM public.operator_listings ol
    WHERE ol.jurisdiction_code = p_jurisdiction_code;

    SELECT COALESCE(jsonb_agg(rp), '[]'::jsonb)
    INTO v_rulepacks
    FROM public.jurisdiction_rulepacks rp
    WHERE rp.jurisdiction_code = p_jurisdiction_code;

    SELECT COALESCE(jsonb_agg(sc), '[]'::jsonb)
    INTO v_support_contacts
    FROM public.jurisdiction_support_contacts sc
    WHERE sc.jurisdiction_code = p_jurisdiction_code;

    v_drawer := jsonb_build_object(
        'meta', row_to_json(v_meta)::jsonb,
        'operators', v_operators,
        'rulepacks', v_rulepacks,
        'support_contacts', v_support_contacts
    );

    RETURN v_drawer;
END;
$$;


-- 8) RPC set_home_jurisdiction(user_id uuid, jurisdiction_code text)
CREATE OR REPLACE FUNCTION public.set_home_jurisdiction(p_user_id uuid, p_jurisdiction_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET home_jurisdiction_code = p_jurisdiction_code
    WHERE id = p_user_id;
    RETURN true;
END;
$$;
