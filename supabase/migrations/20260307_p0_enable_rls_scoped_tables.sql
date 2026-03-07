-- ============================================================
-- P0 PHASE 2: Enable RLS + policies on user/org-scoped tables
-- + public read-only policies for reference data
-- Applied: 2026-03-07
-- ============================================================

-- Jobs & Profiles
ALTER TABLE IF EXISTS public.hc_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_participant_profiles ENABLE ROW LEVEL SECURITY;

-- Badges & Scores
ALTER TABLE IF EXISTS public.hc_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_escort_score ENABLE ROW LEVEL SECURITY;

-- Signals
ALTER TABLE IF EXISTS public.hc_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_signal_confirmations ENABLE ROW LEVEL SECURITY;

-- Leaderboard (public read)
ALTER TABLE IF EXISTS public.hc_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_champions ENABLE ROW LEVEL SECURITY;

-- Reviews & Limits
ALTER TABLE IF EXISTS public.hc_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_review_limits ENABLE ROW LEVEL SECURITY;

-- Corridor
ALTER TABLE IF EXISTS public.hc_corridor_guardians ENABLE ROW LEVEL SECURITY;

-- Operator Data
ALTER TABLE IF EXISTS public.hc_operator_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_peer_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_cross_border_identity ENABLE ROW LEVEL SECURITY;

-- Reference Data
ALTER TABLE IF EXISTS public.global_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_allowed_country ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_signal_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_credential_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hc_credential_issuers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PUBLIC READ-ONLY POLICIES for reference data
-- ============================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='global_countries') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='global_countries' AND policyname='global_countries_public_read') THEN
      CREATE POLICY "global_countries_public_read" ON public.global_countries FOR SELECT TO anon, authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_allowed_country') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_allowed_country' AND policyname='hc_allowed_country_public_read') THEN
      CREATE POLICY "hc_allowed_country_public_read" ON public.hc_allowed_country FOR SELECT TO anon, authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_signal_types') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_signal_types' AND policyname='hc_signal_types_public_read') THEN
      CREATE POLICY "hc_signal_types_public_read" ON public.hc_signal_types FOR SELECT TO anon, authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_credential_types') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_credential_types' AND policyname='hc_credential_types_public_read') THEN
      CREATE POLICY "hc_credential_types_public_read" ON public.hc_credential_types FOR SELECT TO anon, authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_credential_issuers') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_credential_issuers' AND policyname='hc_credential_issuers_public_read') THEN
      CREATE POLICY "hc_credential_issuers_public_read" ON public.hc_credential_issuers FOR SELECT TO anon, authenticated USING (true);
    END IF;
  END IF;
END $$;

-- Leaderboard & Champions: public read
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_leaderboard') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_leaderboard' AND policyname='hc_leaderboard_public_read') THEN
      CREATE POLICY "hc_leaderboard_public_read" ON public.hc_leaderboard FOR SELECT TO anon, authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_champions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_champions' AND policyname='hc_champions_public_read') THEN
      CREATE POLICY "hc_champions_public_read" ON public.hc_champions FOR SELECT TO anon, authenticated USING (true);
    END IF;
  END IF;
END $$;

-- Reviews: public read
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_reviews') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_reviews' AND policyname='hc_reviews_public_read') THEN
      CREATE POLICY "hc_reviews_public_read" ON public.hc_reviews FOR SELECT TO anon, authenticated USING (true);
    END IF;
  END IF;
END $$;

-- Country localization & crypto legality: public read
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_country_localization') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_country_localization' AND policyname='hc_country_localization_public_read') THEN
      CREATE POLICY "hc_country_localization_public_read" ON public.hc_country_localization FOR SELECT TO anon, authenticated USING (true);
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_crypto_legality') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_crypto_legality' AND policyname='hc_crypto_legality_public_read') THEN
      CREATE POLICY "hc_crypto_legality_public_read" ON public.hc_crypto_legality FOR SELECT TO anon, authenticated USING (true);
    END IF;
  END IF;
END $$;
