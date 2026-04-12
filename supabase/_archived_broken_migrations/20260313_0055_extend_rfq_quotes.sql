-- 20260313_0055_extend_rfq_quotes.sql
-- Extends existing RFQ/quote systems instead of creating hc_rfq_events / hc_quote_events:
--   1. load_requests — add request classification, service, urgency, contact columns
--   2. quote_requests — add pricing, friction, listing columns

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. load_requests — extend for blueprint RFQ requirements
--    Existing: request_id, country_code, admin1_code, origin/dest lat/lon,
--              pickup_time_window, load_type_tags, dimensions,
--              required_escort_count, special_requirements, broker_id,
--              carrier_id, budget_range, cross_border_flag, status
--    Adding: request_type, service_types, urgency_level, permit_need,
--            route_survey_need, requester_type, company_info, contact_info,
--            document_uploads
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.load_requests
  ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT 'escort_rfq',
  ADD COLUMN IF NOT EXISTS service_types text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS urgency_level text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS permit_need boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS route_survey_need boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requester_type text NOT NULL DEFAULT 'broker',
  ADD COLUMN IF NOT EXISTS company_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS contact_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS document_uploads jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$ BEGIN
  ALTER TABLE public.load_requests ADD CONSTRAINT chk_lr_request_type
    CHECK (request_type IN ('escort_rfq','permit_rfq','route_survey','height_pole','full_service','emergency'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.load_requests ADD CONSTRAINT chk_lr_urgency
    CHECK (urgency_level IN ('normal','urgent','emergency','scheduled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.load_requests ADD CONSTRAINT chk_lr_requester
    CHECK (requester_type IN ('broker','carrier','shipper','self_serve','api'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_load_requests_type ON public.load_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_load_requests_urgency ON public.load_requests(urgency_level);
CREATE INDEX IF NOT EXISTS idx_load_requests_services_gin ON public.load_requests USING GIN(service_types);


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. quote_requests — extend for pricing and friction analytics
--    Existing: id, requester_user_id, provider_user_id, scope (jsonb),
--              status (enum quote_status), conversation_id,
--              created_at, responded_at, response_time_seconds
--    Adding: quote_type, quote_status_ext (avoids enum collision), price_low,
--            price_high, currency, friction_summary, listing_id
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS quote_type text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS quote_status_ext text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS price_low numeric(12,2),
  ADD COLUMN IF NOT EXISTS price_high numeric(12,2),
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS friction_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS listing_id uuid;

DO $$ BEGIN
  ALTER TABLE public.quote_requests ADD CONSTRAINT chk_qr_quote_type
    CHECK (quote_type IN ('standard','instant','negotiated','enterprise'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.quote_requests ADD CONSTRAINT chk_qr_status_ext
    CHECK (quote_status_ext IN ('draft','sent','viewed','accepted','rejected','expired','countered'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- FK for listing_id (idempotent)
DO $$ BEGIN
  ALTER TABLE public.quote_requests
    ADD CONSTRAINT fk_qr_listing FOREIGN KEY (listing_id)
    REFERENCES public.surfaces(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_quote_requests_type ON public.quote_requests(quote_type);
CREATE INDEX IF NOT EXISTS idx_quote_requests_listing ON public.quote_requests(listing_id);

COMMIT;
