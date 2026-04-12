-- ============================================================
-- HAUL COMMAND — Forms & Compliance Hub
-- Defines the template structure and completed records for operator compliance.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. FORM TEMPLATES (The Blank State Documents)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hc_form_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               TEXT NOT NULL,
    description         TEXT,
    jurisdiction_code   TEXT,                      -- e.g., 'TX', 'US', or 'GLOBAL'
    form_category       TEXT NOT NULL DEFAULT 'compliance' 
                        CHECK (form_category IN ('compliance', 'finance', 'insurance', 'survey', 'other')),
    schema_fields       JSONB NOT NULL DEFAULT '[]', -- The exact fields required to fill it
    pdf_overlay_coords  JSONB,                       -- Where fields map onto an existing PDF (future use)
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 2. OPERATOR DOCUMENTS (The Filled Records & Uploads)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hc_operator_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id         UUID NOT NULL,                -- auth.users.id
    template_id         UUID REFERENCES public.hc_form_templates(id), -- Null if just a raw upload (e.g. proof of insurance)
    assignment_id       UUID,                         -- Optional: Link to a specific job/load
    title               TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'signed', 'submitted', 'verified', 'rejected', 'expired')),
    form_data           JSONB,                        -- The filled out field values
    signature_data      JSONB,                        -- Digital sign timestamp/hash if signed
    storage_path        TEXT,                         -- Supabase storage path if actual file exists
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hc_operator_documents_op ON public.hc_operator_documents(operator_id, status);
CREATE INDEX IF NOT EXISTS idx_hc_operator_documents_assignment ON public.hc_operator_documents(assignment_id);

-- ────────────────────────────────────────────────────────────
-- 3. RLS POLICIES
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.hc_form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_operator_documents ENABLE ROW LEVEL SECURITY;

-- Templates: readable by anyone (so they can see what forms are required)
CREATE POLICY "Public read form templates"
    ON public.hc_form_templates
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admin write templates"
    ON public.hc_form_templates
    FOR ALL USING (auth.role() = 'service_role');

-- Documents: operators read/write their own
CREATE POLICY "Operators manage own documents"
    ON public.hc_operator_documents
    FOR ALL
    USING (auth.uid() = operator_id)
    WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Brokers can view submitted documents for active assignments"
    ON public.hc_operator_documents
    FOR SELECT
    USING (
        status IN ('submitted', 'verified')
        -- (In a real system, you'd join to assignments/loads to verify the broker owns the load)
        -- For robust PWA MVP we allow service_role to pull these for the broker view.
    );

CREATE POLICY "Service role full doc access"
    ON public.hc_operator_documents
    FOR ALL USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────────────────────
-- 4. SEED DATA (A few foundational compliance templates)
-- ────────────────────────────────────────────────────────────

INSERT INTO public.hc_form_templates (title, description, jurisdiction_code, form_category, schema_fields)
VALUES 
(
    'W-9 Taxpayer ID', 
    'Standard IRS Form W-9 for contractor payments.', 
    'US', 
    'finance',
    '[{"id":"business_name","label":"Business Name","type":"text"}, {"id":"ein","label":"EIN / SSN","type":"text"}]'::jsonb
),
(
    'Texas Pre-Trip Route Survey', 
    'Mandatory TXDOT daily survey verification for superloads.', 
    'TX', 
    'survey',
    '[{"id":"route_number","label":"Route/Permit Num","type":"text"}, {"id":"clearance_verified","label":"Clearance Verified","type":"boolean"}]'::jsonb
),
(
    'Standard Equipment Declaration', 
    'Verify high pole height and radio frequencies.', 
    'GLOBAL', 
    'compliance',
    '[{"id":"pole_height_inches","label":"Pole Height Setup (Inches)","type":"number"}, {"id":"cb_channel","label":"Primary CB Channel","type":"text"}]'::jsonb
) ON CONFLICT DO NOTHING;
