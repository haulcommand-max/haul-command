
-- Phase 15: Add ranking and geo-logic fields to providers and loads
ALTER TABLE public.sponsors
ADD COLUMN IF NOT EXISTS avg_rating numeric default 0,
ADD COLUMN IF NOT EXISTS review_count int default 0,
ADD COLUMN IF NOT EXISTS is_verified boolean default false,
ADD COLUMN IF NOT EXISTS completed_jobs_90_days int default 0,
ADD COLUMN IF NOT EXISTS last_seen timestamptz,
ADD COLUMN IF NOT EXISTS avg_response_minutes int default 60,
ADD COLUMN IF NOT EXISTS has_logo boolean default false,
ADD COLUMN IF NOT EXISTS has_description boolean default false,
ADD COLUMN IF NOT EXISTS has_phone boolean default false,
ADD COLUMN IF NOT EXISTS has_service_area boolean default false,
ADD COLUMN IF NOT EXISTS has_photos boolean default false,
ADD COLUMN IF NOT EXISTS has_insurance_verified boolean default false,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS service_radius float default 100;

ALTER TABLE public.loads
ADD COLUMN IF NOT EXISTS miles numeric,
ADD COLUMN IF NOT EXISTS rate_amount numeric,
ADD COLUMN IF NOT EXISTS rate_per_mile numeric;

-- Index for Bounding Box search
CREATE INDEX IF NOT EXISTS idx_sponsors_geo ON public.sponsors (latitude, longitude) WHERE status = 'active';
