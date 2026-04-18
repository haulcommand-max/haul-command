-- BOL & Milestone Evidence Engine mapping for Settlement OS
-- Provides compliance tracking for milestone escrow releases.

CREATE TABLE IF NOT EXISTS public.hc_bol_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID NOT NULL REFERENCES public.hc_loads(id) ON DELETE CASCADE,
    operator_id UUID NOT NULL,
    document_type TEXT NOT NULL, -- e.g. 'BOL', 'WEIGH_TICKET', 'DAMAGE_REPORT'
    storage_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING_REVIEW', -- 'PENDING_REVIEW', 'APPROVED', 'REJECTED'
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    review_notes TEXT,
    reviewed_by UUID,
    CONSTRAINT chk_bol_doc_type CHECK (document_type IN ('BOL', 'WEIGH_TICKET', 'DAMAGE_REPORT', 'PERMIT_PIC'))
);

CREATE INDEX IF NOT EXISTS idx_hc_bol_evidence_load ON public.hc_bol_evidence(load_id);
CREATE INDEX IF NOT EXISTS idx_hc_bol_evidence_operator ON public.hc_bol_evidence(operator_id);

-- Enforce RLS
ALTER TABLE public.hc_bol_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators can upload and view own BOLs" ON public.hc_bol_evidence
    FOR ALL
    USING (auth.uid() = operator_id);

CREATE POLICY "Brokers can view BOLs for their loads" ON public.hc_bol_evidence
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.hc_loads l
        WHERE l.id = load_id AND l.created_by = auth.uid()
    ));

-- Create the Dispute Resolution Engine Table
CREATE TABLE IF NOT EXISTS public.hc_escrow_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID NOT NULL REFERENCES public.hc_loads(id) ON DELETE CASCADE,
    raised_by UUID NOT NULL,
    dispute_reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'UNDER_MEDIATION', 'RESOLVED_BROKER', 'RESOLVED_OPERATOR', 'SPLIT'
    held_amount NUMERIC(15,2) NOT NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hc_disputes_load ON public.hc_escrow_disputes(load_id);

ALTER TABLE public.hc_escrow_disputes ENABLE ROW LEVEL SECURITY;

-- Expose to specific load participants
CREATE POLICY "Load participants can view disputes" ON public.hc_escrow_disputes
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.hc_loads l
        WHERE l.id = load_id AND (l.created_by = auth.uid() OR l.assigned_to = auth.uid())
    ));
