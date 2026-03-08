-- Migration: Training & Credential Marketplace Tables
-- Supports: enrollment tracking, credential verification, training completions

-- Training Enrollments
CREATE TABLE IF NOT EXISTS public.training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL,
  program_id TEXT NOT NULL,
  program_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'expired', 'refunded')),
  price_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  credential_code TEXT,
  reputation_points INTEGER DEFAULT 0,
  stripe_session_id TEXT,
  progress_pct INTEGER DEFAULT 0,
  modules_completed JSONB DEFAULT '[]'::JSONB,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_enrollments_operator ON public.training_enrollments(operator_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_program ON public.training_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_status ON public.training_enrollments(status);

-- Credential Verifications
CREATE TABLE IF NOT EXISTS public.credential_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL,
  service_id TEXT NOT NULL,
  service_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'expired')),
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  verification_type TEXT NOT NULL DEFAULT 'manual',
  expected_turnaround_hours INTEGER DEFAULT 48,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  rejection_reason TEXT,
  document_urls JSONB DEFAULT '[]'::JSONB,
  verification_result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credential_verifications_operator ON public.credential_verifications(operator_id);
CREATE INDEX IF NOT EXISTS idx_credential_verifications_status ON public.credential_verifications(status);
CREATE INDEX IF NOT EXISTS idx_credential_verifications_service ON public.credential_verifications(service_id);

-- Operator freshness cache columns (add if not exist)
DO $$ BEGIN
  ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS freshness_score INTEGER DEFAULT 50;
  ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS freshness_decay_state TEXT DEFAULT 'warm';
  ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS freshness_computed_at TIMESTAMPTZ;
  ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS total_actions_7d INTEGER DEFAULT 0;
  ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS total_actions_30d INTEGER DEFAULT 0;
  ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS response_rate_7d NUMERIC(3,2) DEFAULT 0;
  ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS docs_expiring_30d INTEGER DEFAULT 0;
  ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS docs_expired INTEGER DEFAULT 0;
  ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS last_availability_update TIMESTAMPTZ;
  ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS avg_response_time_minutes NUMERIC(10,2) DEFAULT 60;
  ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS completed_jobs_90d INTEGER DEFAULT 0;
  ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS corridors_familiar TEXT[];
  ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS last_payment_failed BOOLEAN DEFAULT false;
  ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS missed_lead_unlocks_30d INTEGER DEFAULT 0;
  ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none';
EXCEPTION WHEN others THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE public.training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can read training enrollments" ON public.training_enrollments
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read credential verifications" ON public.credential_verifications
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert training enrollments" ON public.training_enrollments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update training enrollments" ON public.training_enrollments
  FOR UPDATE USING (true);

CREATE POLICY "Service role can insert credential verifications" ON public.credential_verifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update credential verifications" ON public.credential_verifications
  FOR UPDATE USING (true);
