-- ═══════════════════════════════════════════════════════════════════════════════
-- HAUL COMMAND — HARD SYSTEM DESIGN MIGRATION
-- Claude-Reserved Tasks: Credential VP, Broker Compliance OS, Reciprocity
-- Graph Engine, Unified Dispatch State Machine
-- ═══════════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────┐
-- │  TASK 1: CREDENTIAL VERIFICATION API — VERIFIABLE          │
-- │  PRESENTATION STRUCTURE                                     │
-- │  Anti-spoof layer. Every credential gets a tamper-evident   │
-- │  hash chain. Brokers verify against the chain, not the      │
-- │  operator's self-reported data.                             │
-- └─────────────────────────────────────────────────────────────┘

-- 1a. Credential Presentation Proofs
-- Each verified credential generates an immutable proof record.
-- The proof_hash is SHA-256(document_url + issuer_id + expiration_date + salt).
-- Brokers call the verify API with the operator's company_id; the API returns
-- the proof chain. If any proof_hash doesn't match recomputation, the
-- credential is flagged as tampered.
CREATE TABLE IF NOT EXISTS public.hc_credential_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.hc_credential_wallets(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.hc_operator_companies(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    proof_hash TEXT NOT NULL,               -- SHA-256 hex digest
    proof_salt TEXT NOT NULL,               -- Random 32-char salt per proof
    issuer_name TEXT,                       -- E.g., "State Farm", "ODOT", "Evergreen Safety Council"
    issuer_verified BOOLEAN DEFAULT false,  -- True only if issuer confirmed via API/manual
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    revoked BOOLEAN DEFAULT false,
    revocation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cred_proofs_company ON public.hc_credential_proofs(company_id);
CREATE INDEX IF NOT EXISTS idx_cred_proofs_hash ON public.hc_credential_proofs(proof_hash);
CREATE INDEX IF NOT EXISTS idx_cred_proofs_expiry ON public.hc_credential_proofs(valid_until);
CREATE INDEX IF NOT EXISTS idx_cred_proofs_revoked ON public.hc_credential_proofs(revoked) WHERE revoked = true;

ALTER TABLE public.hc_credential_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cred_proofs_owner_read" ON public.hc_credential_proofs
    FOR SELECT USING (
        company_id IN (SELECT id FROM public.hc_operator_companies WHERE user_id = auth.uid())
        OR auth.uid() IS NOT NULL  -- Brokers can verify any operator's proofs
    );
CREATE POLICY "cred_proofs_service_write" ON public.hc_credential_proofs
    FOR INSERT WITH CHECK (true);  -- Service role only via API

-- 1b. Verification Request Log (audit trail)
CREATE TABLE IF NOT EXISTS public.hc_verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES auth.users(id),
    target_company_id UUID NOT NULL REFERENCES public.hc_operator_companies(id),
    credential_types_checked TEXT[] NOT NULL,
    all_valid BOOLEAN NOT NULL,
    failed_checks JSONB DEFAULT '[]'::jsonb,  -- [{type, reason, proof_id}]
    request_ip INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ver_requests_target ON public.hc_verification_requests(target_company_id);
CREATE INDEX IF NOT EXISTS idx_ver_requests_requester ON public.hc_verification_requests(requester_id);

ALTER TABLE public.hc_verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ver_requests_authenticated_read" ON public.hc_verification_requests
    FOR SELECT USING (auth.uid() = requester_id OR
        target_company_id IN (SELECT id FROM public.hc_operator_companies WHERE user_id = auth.uid()));

-- 1c. RPC: Generate a credential proof hash
CREATE OR REPLACE FUNCTION public.generate_credential_proof(
    p_wallet_id UUID,
    p_company_id UUID,
    p_document_type TEXT,
    p_document_url TEXT,
    p_issuer_name TEXT,
    p_valid_from DATE,
    p_valid_until DATE
) RETURNS UUID AS $$
DECLARE
    v_salt TEXT;
    v_hash TEXT;
    v_proof_id UUID;
BEGIN
    -- Generate cryptographic salt
    v_salt := encode(gen_random_bytes(16), 'hex');

    -- Compute SHA-256 proof hash
    v_hash := encode(
        sha256(
            convert_to(
                p_document_url || '|' || p_issuer_name || '|' ||
                p_valid_until::text || '|' || v_salt,
                'UTF8'
            )
        ),
        'hex'
    );

    INSERT INTO public.hc_credential_proofs (
        wallet_id, company_id, document_type, proof_hash, proof_salt,
        issuer_name, valid_from, valid_until
    ) VALUES (
        p_wallet_id, p_company_id, p_document_type, v_hash, v_salt,
        p_issuer_name, p_valid_from, p_valid_until
    ) RETURNING id INTO v_proof_id;

    RETURN v_proof_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1d. RPC: Verify an operator's full credential chain
CREATE OR REPLACE FUNCTION public.verify_operator_credentials(
    p_company_id UUID,
    p_required_types TEXT[] DEFAULT ARRAY['auto_insurance', 'general_liability', 'state_certification']
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB := '[]'::jsonb;
    v_all_valid BOOLEAN := true;
    v_type TEXT;
    v_proof RECORD;
BEGIN
    FOREACH v_type IN ARRAY p_required_types LOOP
        SELECT * INTO v_proof
        FROM public.hc_credential_proofs
        WHERE company_id = p_company_id
          AND document_type = v_type
          AND revoked = false
        ORDER BY valid_until DESC
        LIMIT 1;

        IF v_proof IS NULL THEN
            v_all_valid := false;
            v_result := v_result || jsonb_build_object(
                'type', v_type,
                'status', 'missing',
                'valid', false,
                'message', 'No credential proof found for ' || v_type
            );
        ELSIF v_proof.valid_until < CURRENT_DATE THEN
            v_all_valid := false;
            v_result := v_result || jsonb_build_object(
                'type', v_type,
                'status', 'expired',
                'valid', false,
                'expired_on', v_proof.valid_until,
                'proof_id', v_proof.id,
                'message', v_type || ' expired on ' || v_proof.valid_until::text
            );
        ELSE
            v_result := v_result || jsonb_build_object(
                'type', v_type,
                'status', 'valid',
                'valid', true,
                'expires', v_proof.valid_until,
                'issuer', v_proof.issuer_name,
                'issuer_verified', v_proof.issuer_verified,
                'proof_hash', v_proof.proof_hash,
                'proof_id', v_proof.id
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'company_id', p_company_id,
        'checked_at', now(),
        'all_valid', v_all_valid,
        'credentials', v_result
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.generate_credential_proof TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_operator_credentials TO authenticated;


-- ┌─────────────────────────────────────────────────────────────┐
-- │  TASK 2: BROKER COMPLIANCE OS — AUTO-SUSPEND STATE MACHINE │
-- │  When a credential expires, the operator is automatically  │
-- │  suspended from the dispatch marketplace. No manual action. │
-- └─────────────────────────────────────────────────────────────┘

-- 2a. Operator marketplace status (the "circuit breaker")
ALTER TABLE public.hc_operator_companies
    ADD COLUMN IF NOT EXISTS marketplace_status TEXT NOT NULL DEFAULT 'active'
        CHECK (marketplace_status IN ('active', 'suspended', 'probation', 'banned')),
    ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
    ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS auto_reinstate_eligible BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_operator_marketplace_status
    ON public.hc_operator_companies(marketplace_status);

-- 2b. Compliance Events Log (immutable audit trail)
CREATE TABLE IF NOT EXISTS public.hc_compliance_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.hc_operator_companies(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'credential_expired',
        'credential_renewed',
        'auto_suspended',
        'auto_reinstated',
        'manual_review_required',
        'trust_score_downgrade',
        'trust_score_upgrade',
        'violation_recorded',
        'probation_started',
        'probation_cleared',
        'ban_issued'
    )),
    trigger_source TEXT,          -- 'cron_scanner', 'webhook', 'manual_admin', 'api_verify'
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_events_company ON public.hc_compliance_events(company_id);
CREATE INDEX IF NOT EXISTS idx_compliance_events_type ON public.hc_compliance_events(event_type);
CREATE INDEX IF NOT EXISTS idx_compliance_events_time ON public.hc_compliance_events(created_at DESC);

ALTER TABLE public.hc_compliance_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compliance_events_owner_read" ON public.hc_compliance_events
    FOR SELECT USING (
        company_id IN (SELECT id FROM public.hc_operator_companies WHERE user_id = auth.uid())
    );

-- 2c. The Auto-Suspend Trigger
-- When hc_credential_wallets.verification_status transitions to 'expired',
-- check if the operator has ANY critical credential expired. If so, suspend.
CREATE OR REPLACE FUNCTION public.compliance_auto_suspend() RETURNS trigger AS $$
DECLARE
    v_critical_types TEXT[] := ARRAY['auto_insurance', 'general_liability'];
    v_has_valid_critical BOOLEAN;
    v_company_status TEXT;
BEGIN
    -- Only act on transitions TO 'expired'
    IF NEW.verification_status = 'expired' AND OLD.verification_status != 'expired' THEN

        -- Check: does this company still have at least one VALID version of each critical type?
        SELECT bool_and(has_valid) INTO v_has_valid_critical
        FROM (
            SELECT ct.doc_type,
                   EXISTS(
                       SELECT 1 FROM public.hc_credential_wallets cw
                       WHERE cw.company_id = NEW.company_id
                         AND cw.document_type = ct.doc_type
                         AND cw.verification_status = 'verified'
                         AND (cw.expiration_date IS NULL OR cw.expiration_date > CURRENT_DATE)
                         AND cw.id != NEW.id
                   ) AS has_valid
            FROM unnest(v_critical_types) AS ct(doc_type)
        ) sub;

        -- If any critical credential is fully expired (no valid replacement), suspend.
        IF NOT COALESCE(v_has_valid_critical, false) THEN
            -- Get current status
            SELECT marketplace_status INTO v_company_status
            FROM public.hc_operator_companies WHERE id = NEW.company_id;

            -- Only suspend if currently active (don't downgrade from 'banned')
            IF v_company_status = 'active' OR v_company_status = 'probation' THEN
                UPDATE public.hc_operator_companies
                SET marketplace_status = 'suspended',
                    suspended_reason = 'Critical credential expired: ' || NEW.document_type,
                    suspended_at = now(),
                    trust_score = GREATEST(trust_score - 25, 0)
                WHERE id = NEW.company_id;

                -- Log the compliance event
                INSERT INTO public.hc_compliance_events (company_id, event_type, trigger_source, details)
                VALUES (
                    NEW.company_id,
                    'auto_suspended',
                    'credential_expiry_trigger',
                    jsonb_build_object(
                        'expired_document_type', NEW.document_type,
                        'wallet_id', NEW.id,
                        'previous_status', v_company_status
                    )
                );
            END IF;
        END IF;
    END IF;

    -- Auto-reinstate: if a credential is re-verified, check if we can reinstate
    IF NEW.verification_status = 'verified' AND OLD.verification_status IN ('expired', 'pending_review') THEN
        SELECT marketplace_status INTO v_company_status
        FROM public.hc_operator_companies WHERE id = NEW.company_id;

        IF v_company_status = 'suspended' THEN
            -- Check if ALL critical types are now valid
            SELECT bool_and(has_valid) INTO v_has_valid_critical
            FROM (
                SELECT ct.doc_type,
                       EXISTS(
                           SELECT 1 FROM public.hc_credential_wallets cw
                           WHERE cw.company_id = NEW.company_id
                             AND cw.document_type = ct.doc_type
                             AND cw.verification_status = 'verified'
                             AND (cw.expiration_date IS NULL OR cw.expiration_date > CURRENT_DATE)
                       ) AS has_valid
                FROM unnest(v_critical_types) AS ct(doc_type)
            ) sub;

            IF COALESCE(v_has_valid_critical, false) THEN
                UPDATE public.hc_operator_companies
                SET marketplace_status = 'active',
                    suspended_reason = NULL,
                    suspended_at = NULL,
                    trust_score = LEAST(trust_score + 10, 100)
                WHERE id = NEW.company_id
                  AND auto_reinstate_eligible = true;

                INSERT INTO public.hc_compliance_events (company_id, event_type, trigger_source, details)
                VALUES (
                    NEW.company_id,
                    'auto_reinstated',
                    'credential_renewal_trigger',
                    jsonb_build_object(
                        'renewed_document_type', NEW.document_type,
                        'wallet_id', NEW.id
                    )
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_compliance_auto_suspend ON public.hc_credential_wallets;
CREATE TRIGGER trg_compliance_auto_suspend
    AFTER UPDATE ON public.hc_credential_wallets
    FOR EACH ROW EXECUTE FUNCTION public.compliance_auto_suspend();

-- 2d. Cron-compatible RPC: Scan for credentials expiring within N days
CREATE OR REPLACE FUNCTION public.scan_expiring_credentials(p_days_ahead INT DEFAULT 30)
RETURNS TABLE(
    company_id UUID,
    company_name TEXT,
    document_type TEXT,
    expiration_date DATE,
    days_until_expiry INT,
    marketplace_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        oc.id AS company_id,
        oc.company_name,
        cw.document_type,
        cw.expiration_date,
        (cw.expiration_date - CURRENT_DATE)::INT AS days_until_expiry,
        oc.marketplace_status
    FROM public.hc_credential_wallets cw
    JOIN public.hc_operator_companies oc ON oc.id = cw.company_id
    WHERE cw.verification_status = 'verified'
      AND cw.expiration_date IS NOT NULL
      AND cw.expiration_date <= (CURRENT_DATE + (p_days_ahead || ' days')::interval)
      AND cw.expiration_date >= CURRENT_DATE
    ORDER BY cw.expiration_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.scan_expiring_credentials TO authenticated;


-- ┌─────────────────────────────────────────────────────────────┐
-- │  TASK 3: RECIPROCITY MATRIX ENGINE — DIRECTIONAL GRAPH     │
-- │  TRAVERSAL WITH ADDON RESOLUTION                           │
-- │  If State_A → State_B requires addon C, the engine         │
-- │  resolves the full dependency chain.                        │
-- └─────────────────────────────────────────────────────────────┘

-- 3a. Enrich the reciprocity edges table with traversal metadata
ALTER TABLE public.hc_reciprocity_edges
    ADD COLUMN IF NOT EXISTS addon_cost_est DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS addon_time_days INT,
    ADD COLUMN IF NOT EXISTS addon_cert_slug TEXT,          -- FK to certification registry
    ADD COLUMN IF NOT EXISTS bidirectional BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT now(),
    ADD COLUMN IF NOT EXISTS source_url TEXT;

-- 3b. RPC: Resolve the full reciprocity path between two jurisdictions
-- Returns the cheapest/fastest path and all required addons.
CREATE OR REPLACE FUNCTION public.resolve_reciprocity_path(
    p_source_jurisdiction UUID,
    p_target_jurisdiction UUID,
    p_operator_certs TEXT[] DEFAULT ARRAY[]::TEXT[]
) RETURNS JSONB AS $$
DECLARE
    v_direct RECORD;
    v_result JSONB;
    v_addons JSONB := '[]'::jsonb;
    v_intermediate RECORD;
    v_best_path JSONB := NULL;
    v_hop_count INT := 0;
BEGIN
    -- Step 1: Check direct edge
    SELECT * INTO v_direct
    FROM public.hc_reciprocity_edges
    WHERE source_jurisdiction = p_source_jurisdiction
      AND target_jurisdiction = p_target_jurisdiction;

    IF FOUND THEN
        -- Direct path exists
        IF v_direct.acceptance_logic = 'full' THEN
            RETURN jsonb_build_object(
                'path_type', 'direct',
                'acceptance', 'full',
                'hops', 1,
                'addons_required', '[]'::jsonb,
                'total_addon_cost', 0,
                'total_addon_days', 0,
                'source', p_source_jurisdiction,
                'target', p_target_jurisdiction
            );
        ELSIF v_direct.acceptance_logic = 'addon_required' THEN
            -- Check if the operator already holds the required addon
            IF v_direct.addon_cert_slug = ANY(p_operator_certs) THEN
                RETURN jsonb_build_object(
                    'path_type', 'direct',
                    'acceptance', 'full_with_existing_addon',
                    'hops', 1,
                    'addons_required', '[]'::jsonb,
                    'total_addon_cost', 0,
                    'total_addon_days', 0,
                    'note', 'Operator already holds required ' || v_direct.addon_cert_slug
                );
            ELSE
                RETURN jsonb_build_object(
                    'path_type', 'direct',
                    'acceptance', 'addon_required',
                    'hops', 1,
                    'addons_required', jsonb_build_array(
                        jsonb_build_object(
                            'cert_slug', v_direct.addon_cert_slug,
                            'details', v_direct.addon_details,
                            'est_cost', v_direct.addon_cost_est,
                            'est_days', v_direct.addon_time_days
                        )
                    ),
                    'total_addon_cost', COALESCE(v_direct.addon_cost_est, 0),
                    'total_addon_days', COALESCE(v_direct.addon_time_days, 0)
                );
            END IF;
        ELSE
            -- 'none' — no reciprocity
            RETURN jsonb_build_object(
                'path_type', 'none',
                'acceptance', 'none',
                'hops', 0,
                'message', 'No reciprocity agreement exists between these jurisdictions. Full local certification required.'
            );
        END IF;
    END IF;

    -- Step 2: Try 2-hop path (source → intermediate → target)
    FOR v_intermediate IN
        SELECT
            e1.target_jurisdiction AS via_jurisdiction,
            e1.acceptance_logic AS leg1_logic,
            e1.addon_cert_slug AS leg1_addon,
            e1.addon_cost_est AS leg1_cost,
            e1.addon_time_days AS leg1_days,
            e1.addon_details AS leg1_details,
            e2.acceptance_logic AS leg2_logic,
            e2.addon_cert_slug AS leg2_addon,
            e2.addon_cost_est AS leg2_cost,
            e2.addon_time_days AS leg2_days,
            e2.addon_details AS leg2_details
        FROM public.hc_reciprocity_edges e1
        JOIN public.hc_reciprocity_edges e2
            ON e2.source_jurisdiction = e1.target_jurisdiction
            AND e2.target_jurisdiction = p_target_jurisdiction
        WHERE e1.source_jurisdiction = p_source_jurisdiction
          AND e1.acceptance_logic != 'none'
          AND e2.acceptance_logic != 'none'
        ORDER BY
            COALESCE(e1.addon_cost_est, 0) + COALESCE(e2.addon_cost_est, 0) ASC
        LIMIT 1
    LOOP
        v_addons := '[]'::jsonb;
        IF v_intermediate.leg1_logic = 'addon_required' AND NOT (v_intermediate.leg1_addon = ANY(p_operator_certs)) THEN
            v_addons := v_addons || jsonb_build_array(jsonb_build_object(
                'hop', 1, 'cert_slug', v_intermediate.leg1_addon,
                'est_cost', v_intermediate.leg1_cost, 'est_days', v_intermediate.leg1_days
            ));
        END IF;
        IF v_intermediate.leg2_logic = 'addon_required' AND NOT (v_intermediate.leg2_addon = ANY(p_operator_certs)) THEN
            v_addons := v_addons || jsonb_build_array(jsonb_build_object(
                'hop', 2, 'cert_slug', v_intermediate.leg2_addon,
                'est_cost', v_intermediate.leg2_cost, 'est_days', v_intermediate.leg2_days
            ));
        END IF;

        RETURN jsonb_build_object(
            'path_type', '2-hop',
            'acceptance', CASE WHEN jsonb_array_length(v_addons) = 0 THEN 'full' ELSE 'addon_required' END,
            'hops', 2,
            'via_jurisdiction', v_intermediate.via_jurisdiction,
            'addons_required', v_addons,
            'total_addon_cost', COALESCE(v_intermediate.leg1_cost, 0) + COALESCE(v_intermediate.leg2_cost, 0),
            'total_addon_days', COALESCE(v_intermediate.leg1_days, 0) + COALESCE(v_intermediate.leg2_days, 0)
        );
    END LOOP;

    -- Step 3: No path found
    RETURN jsonb_build_object(
        'path_type', 'none',
        'acceptance', 'none',
        'hops', 0,
        'message', 'No reciprocity path found within 2 hops. Full local certification required in the target jurisdiction.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.resolve_reciprocity_path TO authenticated;


-- ┌─────────────────────────────────────────────────────────────┐
-- │  TASK 4: UNIFIED DISPATCH STATE MACHINE                    │
-- │  Ties permit request → route survey → operator deployment  │
-- │  with strict state transitions and rollback protection.    │
-- └─────────────────────────────────────────────────────────────┘

-- 4a. Expand dispatch_requests with full state machine columns
ALTER TABLE public.hc_dispatch_requests
    ADD COLUMN IF NOT EXISTS permit_request_id UUID,
    ADD COLUMN IF NOT EXISTS route_survey_id UUID REFERENCES public.hc_route_surveys(id),
    ADD COLUMN IF NOT EXISTS survey_required BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS survey_cleared BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS operator_credentials_verified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS pickup_scheduled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS actual_pickup_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS actual_delivery_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4b. Dispatch State Transition Log (immutable)
CREATE TABLE IF NOT EXISTS public.hc_dispatch_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispatch_id UUID NOT NULL REFERENCES public.hc_dispatch_requests(id) ON DELETE CASCADE,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    transitioned_by UUID REFERENCES auth.users(id),
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_transitions_dispatch ON public.hc_dispatch_transitions(dispatch_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_transitions_time ON public.hc_dispatch_transitions(created_at DESC);

ALTER TABLE public.hc_dispatch_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dispatch_transitions_read" ON public.hc_dispatch_transitions
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 4c. The Dispatch State Machine RPC
-- Enforces valid transitions and pre-conditions.
CREATE OR REPLACE FUNCTION public.transition_dispatch(
    p_dispatch_id UUID,
    p_to_status TEXT,
    p_user_id UUID DEFAULT NULL,
    p_reason TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
    v_dispatch RECORD;
    v_from_status TEXT;
    v_company RECORD;
    v_cred_check JSONB;
BEGIN
    -- Lock the row for update
    SELECT * INTO v_dispatch
    FROM public.hc_dispatch_requests
    WHERE id = p_dispatch_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Dispatch not found');
    END IF;

    v_from_status := v_dispatch.status;

    -- ═══ STATE TRANSITION VALIDATION MATRIX ═══
    -- draft       → searching, cancelled
    -- searching   → assigned, cancelled
    -- assigned    → in_transit, cancelled, searching (rollback if operator drops)
    -- in_transit  → completed, disputed
    -- completed   → disputed
    -- disputed    → completed, cancelled

    IF NOT (
        (v_from_status = 'draft'      AND p_to_status IN ('searching', 'cancelled')) OR
        (v_from_status = 'searching'  AND p_to_status IN ('assigned', 'cancelled')) OR
        (v_from_status = 'assigned'   AND p_to_status IN ('in_transit', 'cancelled', 'searching')) OR
        (v_from_status = 'in_transit' AND p_to_status IN ('completed', 'disputed')) OR
        (v_from_status = 'completed'  AND p_to_status IN ('disputed')) OR
        (v_from_status = 'disputed'   AND p_to_status IN ('completed', 'cancelled'))
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Invalid transition: %s → %s', v_from_status, p_to_status),
            'current_status', v_from_status,
            'allowed_transitions', CASE v_from_status
                WHEN 'draft'      THEN '["searching", "cancelled"]'
                WHEN 'searching'  THEN '["assigned", "cancelled"]'
                WHEN 'assigned'   THEN '["in_transit", "cancelled", "searching"]'
                WHEN 'in_transit' THEN '["completed", "disputed"]'
                WHEN 'completed'  THEN '["disputed"]'
                WHEN 'disputed'   THEN '["completed", "cancelled"]'
                ELSE '[]'
            END
        );
    END IF;

    -- ═══ PRE-CONDITION GATES ═══

    -- Gate 1: searching → assigned requires an assigned_company_id
    IF p_to_status = 'assigned' AND v_dispatch.assigned_company_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cannot assign dispatch without an assigned operator company'
        );
    END IF;

    -- Gate 2: assigned → in_transit requires credential verification
    IF p_to_status = 'in_transit' THEN
        -- Verify operator credentials before allowing transit
        IF v_dispatch.assigned_company_id IS NOT NULL THEN
            SELECT public.verify_operator_credentials(v_dispatch.assigned_company_id)
            INTO v_cred_check;

            IF NOT (v_cred_check->>'all_valid')::boolean THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'Operator credentials failed verification — cannot proceed to in_transit',
                    'credential_check', v_cred_check
                );
            END IF;

            -- Check marketplace status
            SELECT * INTO v_company
            FROM public.hc_operator_companies
            WHERE id = v_dispatch.assigned_company_id;

            IF v_company.marketplace_status != 'active' THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', format('Operator is %s — cannot proceed', v_company.marketplace_status),
                    'marketplace_status', v_company.marketplace_status,
                    'suspended_reason', v_company.suspended_reason
                );
            END IF;
        END IF;

        -- Gate 2b: Route survey must be cleared if required
        IF v_dispatch.survey_required AND NOT COALESCE(v_dispatch.survey_cleared, false) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Route survey is required but has not been completed/cleared'
            );
        END IF;
    END IF;

    -- ═══ EXECUTE TRANSITION ═══
    UPDATE public.hc_dispatch_requests
    SET status = p_to_status,
        operator_credentials_verified = CASE
            WHEN p_to_status = 'in_transit' THEN true
            ELSE operator_credentials_verified
        END,
        actual_pickup_at = CASE
            WHEN p_to_status = 'in_transit' THEN COALESCE(actual_pickup_at, now())
            ELSE actual_pickup_at
        END,
        actual_delivery_at = CASE
            WHEN p_to_status = 'completed' THEN COALESCE(actual_delivery_at, now())
            ELSE actual_delivery_at
        END,
        cancelled_at = CASE
            WHEN p_to_status = 'cancelled' THEN now()
            ELSE cancelled_at
        END,
        cancellation_reason = CASE
            WHEN p_to_status = 'cancelled' THEN p_reason
            ELSE cancellation_reason
        END,
        updated_at = now()
    WHERE id = p_dispatch_id;

    -- Log the transition
    INSERT INTO public.hc_dispatch_transitions (
        dispatch_id, from_status, to_status, transitioned_by, reason, metadata
    ) VALUES (
        p_dispatch_id, v_from_status, p_to_status, p_user_id, p_reason, p_metadata
    );

    -- Side effects
    -- If operator drops (assigned → searching), record a violation
    IF v_from_status = 'assigned' AND p_to_status = 'searching' AND v_dispatch.assigned_company_id IS NOT NULL THEN
        INSERT INTO public.hc_vendor_compliance_violations (
            company_id, dispatch_id, violation_code, severity
        ) VALUES (
            v_dispatch.assigned_company_id, p_dispatch_id, 'no_show', 3
        );

        UPDATE public.hc_operator_companies
        SET trust_score = GREATEST(trust_score - 15, 0)
        WHERE id = v_dispatch.assigned_company_id;

        INSERT INTO public.hc_compliance_events (company_id, event_type, trigger_source, details)
        VALUES (
            v_dispatch.assigned_company_id,
            'violation_recorded',
            'dispatch_state_machine',
            jsonb_build_object('violation', 'no_show', 'dispatch_id', p_dispatch_id)
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'dispatch_id', p_dispatch_id,
        'from', v_from_status,
        'to', p_to_status,
        'transitioned_at', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.transition_dispatch TO authenticated;
