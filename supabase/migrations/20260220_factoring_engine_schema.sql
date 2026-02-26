-- Migration: HaulPay Factoring Module (World-Class FinTech Expansion)

-- 1. Factoring Programs (Tiers / Fees)
CREATE TABLE public.factoring_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    fee_percentage NUMERIC NOT NULL,     -- e.g., 2.50
    advance_rate NUMERIC NOT NULL,        -- e.g., 90 (pay 90% now, 10% on broker settle less fees)
    payout_speed_hours INT NOT NULL,      -- e.g., 24
    description TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the default "Quick Cash" program
INSERT INTO public.factoring_programs (name, fee_percentage, advance_rate, payout_speed_hours, description, is_active)
VALUES ('HaulPay FastCash', 2.50, 100, 24, '2.5% fee for next-day payout upon clean POD upload', true);

-- 2. Factoring Requests (The core transaction ledger)
CREATE TABLE public.factoring_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES public.profiles(id),
    broker_id UUID NOT NULL REFERENCES public.profiles(id),
    booking_id UUID,                     -- Optional link to the load table
    program_id UUID NOT NULL REFERENCES public.factoring_programs(id),
    
    amount_total NUMERIC NOT NULL,
    amount_advanced NUMERIC NOT NULL,
    fee_amount NUMERIC NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending_pod', 'pod_review', 'approved_funding', 'funded', 'rejected', 'settled')),
    
    pod_url TEXT,                        -- Signed URL to the Proof of Delivery
    rejection_reason TEXT,
    
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    funded_at TIMESTAMPTZ,
    broker_settled_at TIMESTAMPTZ,       -- When the broker actually paid the platform back
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_factor_operator ON public.factoring_requests(operator_id);
CREATE INDEX idx_factor_status ON public.factoring_requests(status);

-- RLS
ALTER TABLE public.factoring_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factoring_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Programs are viewable by all authenticated users"
    ON public.factoring_programs FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Operators can view their own factoring requests"
    ON public.factoring_requests FOR SELECT
    TO authenticated USING (auth.uid() = operator_id);

CREATE POLICY "Operators can insert factoring requests"
    ON public.factoring_requests FOR INSERT
    TO authenticated WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Operators can update their factoring requests (upload POD)"
    ON public.factoring_requests FOR UPDATE
    TO authenticated USING (auth.uid() = operator_id);

-- 3. RPC to calculate Factoring Payout instantly
CREATE OR REPLACE FUNCTION calculate_factoring_payout(p_amount NUMERIC, p_program_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_program RECORD;
    v_fee NUMERIC;
    v_advance NUMERIC;
BEGIN
    SELECT * INTO v_program FROM public.factoring_programs WHERE id = p_program_id AND is_active = true limit 1;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or inactive factoring program';
    END IF;

    v_fee := (p_amount * (v_program.fee_percentage / 100.0));
    v_advance := (p_amount * (v_program.advance_rate / 100.0)) - v_fee;

    RETURN jsonb_build_object(
        'original_amount', p_amount,
        'fee_amount', ROUND(v_fee, 2),
        'advance_amount', ROUND(v_advance, 2),
        'payout_speed_hours', v_program.payout_speed_hours
    );
END;
$$;
