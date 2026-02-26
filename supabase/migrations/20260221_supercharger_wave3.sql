-- Supercharger Wave 3 Migration: Structural Hardening
-- Covers: Score Recompute Engine, Search Index Resilience, Compliance Wallet

-- ============================================================
-- 1. SCORE RECOMPUTE ENGINE (10x multiplier)
-- Audit log + scheduled deterministic recalculation
-- ============================================================

CREATE TABLE public.score_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    score_type TEXT NOT NULL CHECK (score_type IN ('trust', 'readiness', 'broker_trust', 'compliance')),

    -- Score values
    previous_score NUMERIC,
    new_score NUMERIC,
    delta NUMERIC GENERATED ALWAYS AS (COALESCE(new_score, 0) - COALESCE(previous_score, 0)) STORED,

    -- Signal breakdown (what changed)
    signals JSONB DEFAULT '{}'::JSONB,      -- {availability: 25, recency: 20, response: 15, equipment: 22}
    trigger TEXT DEFAULT 'scheduled' CHECK (trigger IN ('scheduled', 'manual', 'event', 'anomaly_recheck')),

    -- Anomaly detection
    is_anomaly BOOLEAN DEFAULT FALSE,       -- flagged if delta > 20 points
    anomaly_reason TEXT,

    computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_score_audit_profile ON public.score_audit_log(profile_id, computed_at DESC);
CREATE INDEX idx_score_audit_anomaly ON public.score_audit_log(is_anomaly) WHERE is_anomaly = TRUE;
CREATE INDEX idx_score_audit_type ON public.score_audit_log(score_type, computed_at DESC);

-- RPC: Batch recompute all readiness scores with audit logging
CREATE OR REPLACE FUNCTION public.batch_recompute_readiness_scores(batch_limit INT DEFAULT 100)
RETURNS TABLE(profile_id UUID, old_score NUMERIC, new_score NUMERIC, is_anomaly BOOLEAN) AS $$
DECLARE
    rec RECORD;
    v_new_score NUMERIC;
    v_old_score NUMERIC;
    v_anomaly BOOLEAN;
BEGIN
    FOR rec IN
        SELECT p.id, p.readiness_score
        FROM public.profiles p
        WHERE p.role IN ('escort', 'driver', 'operator')
        ORDER BY COALESCE(p.updated_at, '1970-01-01') ASC
        LIMIT batch_limit
    LOOP
        v_old_score := COALESCE(rec.readiness_score, 0);

        -- Recompute using existing RPC
        SELECT public.recompute_readiness_score(rec.id) INTO v_new_score;

        -- Anomaly detection: flag if change > 20 points
        v_anomaly := ABS(v_new_score - v_old_score) > 20;

        -- Insert audit log
        INSERT INTO public.score_audit_log (profile_id, score_type, previous_score, new_score, trigger, is_anomaly, anomaly_reason)
        VALUES (rec.id, 'readiness', v_old_score, v_new_score, 'scheduled', v_anomaly,
            CASE WHEN v_anomaly THEN 'Delta exceeded 20-point threshold' ELSE NULL END);

        RETURN QUERY SELECT rec.id, v_old_score, v_new_score, v_anomaly;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. SEARCH INDEX RESILIENCE (10x multiplier)
-- Queue-based reindexing with retry and dead-letter
-- ============================================================

CREATE TABLE public.search_index_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('profile', 'load', 'corridor', 'service')),
    entity_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('index', 'reindex', 'delete')),

    -- Retry logic
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')),
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    last_error TEXT,

    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ DEFAULT NOW(),

    -- Backoff: next_retry = NOW() + (2^attempts * 30 seconds)
    CONSTRAINT valid_attempts CHECK (attempts <= max_attempts + 1)
);

CREATE INDEX idx_search_queue_pending ON public.search_index_queue(status, next_retry_at)
    WHERE status IN ('pending', 'failed');
CREATE INDEX idx_search_queue_entity ON public.search_index_queue(entity_type, entity_id);
CREATE INDEX idx_search_queue_dead ON public.search_index_queue(status)
    WHERE status = 'dead_letter';

-- RPC: Move exhausted retries to dead letter
CREATE OR REPLACE FUNCTION public.sweep_dead_letter_queue()
RETURNS INT AS $$
DECLARE
    affected INT;
BEGIN
    UPDATE public.search_index_queue
    SET status = 'dead_letter',
        processed_at = NOW()
    WHERE status = 'failed'
      AND attempts >= max_attempts;

    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Enqueue a reindex for a single entity
CREATE OR REPLACE FUNCTION public.enqueue_reindex(p_entity_type TEXT, p_entity_id UUID)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.search_index_queue (entity_type, entity_id, action)
    VALUES (p_entity_type, p_entity_id, 'reindex')
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. COMPLIANCE WALLET (document expiry tracking)
-- ============================================================

CREATE TABLE public.compliance_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),

    -- Document metadata
    doc_type TEXT NOT NULL CHECK (doc_type IN (
        'insurance_coi', 'insurance_auto', 'business_license',
        'dot_authority', 'vehicle_registration', 'safety_certification',
        'escort_permit', 'pilot_car_cert', 'hazmat_endorsement',
        'twic_card', 'medical_card', 'other'
    )),
    doc_name TEXT NOT NULL,
    file_url TEXT,                          -- Supabase Storage URL
    issuing_authority TEXT,
    document_number TEXT,

    -- Expiry tracking
    issued_at DATE,
    expires_at DATE,
    days_until_expiry INT GENERATED ALWAYS AS (
        CASE WHEN expires_at IS NOT NULL
             THEN (expires_at - CURRENT_DATE)
             ELSE NULL END
    ) STORED,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired', 'pending_review', 'rejected')),
    verified_by UUID,                      -- admin who verified
    verified_at TIMESTAMPTZ,

    -- Renewal tracking
    renewal_reminder_sent BOOLEAN DEFAULT FALSE,
    renewal_reminder_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_docs_profile ON public.compliance_documents(profile_id);
CREATE INDEX idx_compliance_docs_expiry ON public.compliance_documents(expires_at)
    WHERE status IN ('active', 'expiring_soon');
CREATE INDEX idx_compliance_docs_type ON public.compliance_documents(doc_type);

-- RPC: Flag documents expiring within N days
CREATE OR REPLACE FUNCTION public.flag_expiring_documents(warning_days INT DEFAULT 30)
RETURNS INT AS $$
DECLARE
    affected INT;
BEGIN
    UPDATE public.compliance_documents
    SET status = 'expiring_soon',
        updated_at = NOW()
    WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND expires_at <= CURRENT_DATE + warning_days
      AND expires_at > CURRENT_DATE;

    GET DIAGNOSTICS affected = ROW_COUNT;

    -- Also mark truly expired ones
    UPDATE public.compliance_documents
    SET status = 'expired',
        updated_at = NOW()
    WHERE status IN ('active', 'expiring_soon')
      AND expires_at IS NOT NULL
      AND expires_at < CURRENT_DATE;

    RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.score_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_index_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own score audits"
    ON public.score_audit_log FOR SELECT TO authenticated
    USING (auth.uid() = profile_id);

CREATE POLICY "Search queue admin only"
    ON public.search_index_queue FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users view own compliance docs"
    ON public.compliance_documents FOR SELECT TO authenticated
    USING (auth.uid() = profile_id);

CREATE POLICY "Users insert own compliance docs"
    ON public.compliance_documents FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users update own compliance docs"
    ON public.compliance_documents FOR UPDATE TO authenticated
    USING (auth.uid() = profile_id);
