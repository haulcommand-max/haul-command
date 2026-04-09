-- Migration: 120-country training schema
-- Sets up the core 3-layer architecture for the Training OS (Global, Country Packs, Local Overrides)

DROP TABLE IF EXISTS public.training_badges CASCADE;
DROP TABLE IF EXISTS public.training_exams CASCADE;
DROP TABLE IF EXISTS public.training_reciprocity_rules CASCADE;
DROP TABLE IF EXISTS public.training_claim_rules CASCADE;
DROP TABLE IF EXISTS public.training_modules CASCADE;
DROP TABLE IF EXISTS public.training_tracks CASCADE;
DROP TABLE IF EXISTS public.training_jurisdictions CASCADE;

CREATE TABLE IF NOT EXISTS public.training_jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL,
    region_code TEXT, -- e.g., 'US-FL'
    credential_type TEXT NOT NULL, -- 'government', 'vendor', 'association', 'informal'
    is_mandatory BOOLEAN DEFAULT false,
    official_path_url TEXT,
    validity_years INT,
    refresher_allowed BOOLEAN DEFAULT false,
    refresher_grace_period_days INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure uniqueness by country and region
CREATE UNIQUE INDEX IF NOT EXISTS idx_training_jurisdictions_unique ON public.training_jurisdictions (country_code, COALESCE(region_code, ''));

CREATE TABLE IF NOT EXISTS public.training_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_id UUID REFERENCES public.training_jurisdictions(id) ON DELETE CASCADE,
    track_slug TEXT NOT NULL,
    title TEXT NOT NULL,
    track_type TEXT NOT NULL, -- 'certification', 'refresher', 'optional_skill'
    official_course_hours_total NUMERIC,
    hc_estimated_prep_hours_total NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_training_tracks_slug_jurisdiction ON public.training_tracks (track_slug, jurisdiction_id);

CREATE TABLE IF NOT EXISTS public.training_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID REFERENCES public.training_tracks(id) ON DELETE CASCADE,
    sequence_order INT NOT NULL,
    module_slug TEXT NOT NULL,
    module_title TEXT NOT NULL,
    official_session_title TEXT,
    official_minutes INT,
    hc_estimated_minutes INT,
    video_asset_id TEXT,
    poster_image_url TEXT,
    practical_required_boolean BOOLEAN DEFAULT false,
    visible_text_ready BOOLEAN DEFAULT false,
    structured_data_ready BOOLEAN DEFAULT false,
    video_ready BOOLEAN DEFAULT false,
    search_ready BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_training_modules_slug_track ON public.training_modules (module_slug, track_id);

CREATE TABLE IF NOT EXISTS public.training_claim_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_id UUID REFERENCES public.training_jurisdictions(id) ON DELETE CASCADE,
    allowed_claims JSONB DEFAULT '[]'::jsonb,
    forbidden_claims JSONB DEFAULT '[]'::jsonb,
    legal_review_status TEXT DEFAULT 'pending', -- 'pending', 'approved'
    last_source_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.training_reciprocity_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issued_jurisdiction_id UUID REFERENCES public.training_jurisdictions(id) ON DELETE CASCADE,
    accepted_in_jurisdiction_id UUID REFERENCES public.training_jurisdictions(id) ON DELETE CASCADE,
    conditions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_training_reciprocity_unique ON public.training_reciprocity_rules (issued_jurisdiction_id, accepted_in_jurisdiction_id);

CREATE TABLE IF NOT EXISTS public.training_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID REFERENCES public.training_tracks(id) ON DELETE CASCADE,
    quiz_bank_id TEXT,
    pass_threshold NUMERIC,
    question_count INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.training_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id TEXT NOT NULL, -- references users/profiles
    track_id UUID REFERENCES public.training_tracks(id) ON DELETE RESTRICT,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    verification_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turn on RLS
ALTER TABLE public.training_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_claim_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_reciprocity_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_badges ENABLE ROW LEVEL SECURITY;

-- Create basic public read policies
do $$
begin
    if not exists (select 1 from pg_policies where policyname = 'Public read access for training_jurisdictions') then
        CREATE POLICY "Public read access for training_jurisdictions" ON public.training_jurisdictions FOR SELECT USING (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Public read access for training_tracks') then
        CREATE POLICY "Public read access for training_tracks" ON public.training_tracks FOR SELECT USING (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Public read access for training_modules') then
        CREATE POLICY "Public read access for training_modules" ON public.training_modules FOR SELECT USING (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Public read access for training_claim_rules') then
        CREATE POLICY "Public read access for training_claim_rules" ON public.training_claim_rules FOR SELECT USING (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Public read access for training_reciprocity_rules') then
        CREATE POLICY "Public read access for training_reciprocity_rules" ON public.training_reciprocity_rules FOR SELECT USING (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Public read access for training_exams') then
        CREATE POLICY "Public read access for training_exams" ON public.training_exams FOR SELECT USING (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'Public read access for training_badges') then
        CREATE POLICY "Public read access for training_badges" ON public.training_badges FOR SELECT USING (true);
    end if;
end
$$;
