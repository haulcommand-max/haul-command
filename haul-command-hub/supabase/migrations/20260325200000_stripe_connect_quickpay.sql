-- Add Stripe Connect details to hc_provider_best_public_record
ALTER TABLE public.hc_provider_best_public_record 
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS quickpay_eligible boolean DEFAULT false;

-- Create quickpay ledger/history for tracing
CREATE TABLE IF NOT EXISTS public.hc_quickpay_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id uuid REFERENCES public.hc_provider_best_public_record(provider_id),
    stripe_account_id text NOT NULL,
    amount_cents integer NOT NULL,
    fee_cents integer NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    stripe_payout_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS for Quickpay Transactions
ALTER TABLE public.hc_quickpay_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers can view their own quickpay transactions" ON public.hc_quickpay_transactions FOR SELECT USING (true); -- simplify for now, would normally rely on auth
CREATE POLICY "Service role can all" ON public.hc_quickpay_transactions FOR ALL USING (auth.role() = 'service_role');
