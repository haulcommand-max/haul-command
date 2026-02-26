-- Haul Command Core Schema (hc_core v1)
-- Additive only — skips tables that already exist via IF NOT EXISTS

-- Enable earthdistance for geo queries (requires cube extension first)
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- ==============================================================
-- 1) PROFILES (drivers / escorts / brokers / vendors)
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'escort' CHECK (type IN ('driver','escort','broker','vendor')),
  slug text UNIQUE,
  display_name text NOT NULL DEFAULT 'Unknown Operator',
  phone text,
  email text,
  city text,
  state text,
  lat double precision,
  lng double precision,
  availability text DEFAULT 'unknown' CHECK (availability IN ('available','busy','offline','unknown')),
  capabilities jsonb DEFAULT '{}'::jsonb,
  compliance_score int DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_state_idx ON public.profiles(state);
CREATE INDEX IF NOT EXISTS profiles_type_idx ON public.profiles(type);
CREATE INDEX IF NOT EXISTS profiles_availability_idx ON public.profiles(availability);
CREATE INDEX IF NOT EXISTS profiles_slug_idx ON public.profiles(slug);

-- ==============================================================
-- 2) CLAIM REQUESTS
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.claim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  phone text,
  email text,
  verification_method text NOT NULL CHECK (verification_method IN ('sms','email')),
  verification_code text NOT NULL,
  code_expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','approved','rejected')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS claim_requests_profile_idx ON public.claim_requests(profile_id);
CREATE INDEX IF NOT EXISTS claim_requests_status_idx ON public.claim_requests(status);
CREATE INDEX IF NOT EXISTS claim_requests_user_idx ON public.claim_requests(requester_user_id);

-- ==============================================================
-- 3) LOADS (if table doesn't already fully exist)
-- Additive: add missing columns instead of recreating
-- ==============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'loads') THEN
    CREATE TABLE public.loads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      broker_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      title text NOT NULL DEFAULT 'Unnamed Load',
      origin_city text,
      origin_state text,
      origin_lat double precision,
      origin_lng double precision,
      dest_city text,
      dest_state text,
      dest_lat double precision,
      dest_lng double precision,
      pickup_at timestamptz,
      urgency int DEFAULT 0 CHECK (urgency BETWEEN 0 AND 100),
      status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','matched','closed')),
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS loads_status_idx ON public.loads(status);
CREATE INDEX IF NOT EXISTS loads_origin_state_idx ON public.loads(origin_state);

-- ==============================================================
-- 4) OFFERS (push → tap → accept)
-- ==============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'offers') THEN
    CREATE TABLE public.offers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      load_id uuid NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
      escort_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','accepted','declined','expired')),
      expires_at timestamptz,
      accepted_at timestamptz,
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS offers_escort_idx ON public.offers(escort_profile_id);
CREATE INDEX IF NOT EXISTS offers_load_idx ON public.offers(load_id);
CREATE INDEX IF NOT EXISTS offers_status_idx ON public.offers(status);

-- ==============================================================
-- 5) PRESENCE HEARTBEATS (map alive layer)
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.presence_heartbeats (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  lat double precision,
  lng double precision,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS presence_last_seen_idx ON public.presence_heartbeats(last_seen_at);

-- ==============================================================
-- 6) PUSH TOKENS
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('web','ios','android')),
  token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  UNIQUE (platform, token)
);

CREATE INDEX IF NOT EXISTS push_tokens_user_idx ON public.push_tokens(user_id);

-- ==============================================================
-- 7) UPDATED_AT TRIGGER
-- ==============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================
-- 8) ROW LEVEL SECURITY
-- ==============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, owner update
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update_owner" ON public.profiles;
CREATE POLICY "profiles_update_owner" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Claim requests: requester insert/read
DROP POLICY IF EXISTS "claim_insert" ON public.claim_requests;
CREATE POLICY "claim_insert" ON public.claim_requests FOR INSERT WITH CHECK (auth.uid() = requester_user_id OR requester_user_id IS NULL);

DROP POLICY IF EXISTS "claim_read_own" ON public.claim_requests;
CREATE POLICY "claim_read_own" ON public.claim_requests FOR SELECT USING (auth.uid() = requester_user_id);

-- Loads: public read open/matched
DROP POLICY IF EXISTS "loads_read_open" ON public.loads;
CREATE POLICY "loads_read_open" ON public.loads FOR SELECT USING (status IN ('open','matched'));

-- Offers: escort reads/updates their own
DROP POLICY IF EXISTS "offers_read_escort" ON public.offers;
CREATE POLICY "offers_read_escort" ON public.offers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = escort_profile_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "offers_accept_escort" ON public.offers;
CREATE POLICY "offers_accept_escort" ON public.offers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = escort_profile_id AND p.user_id = auth.uid())
);

-- Presence: public read, profile owner upserts
DROP POLICY IF EXISTS "presence_read_all" ON public.presence_heartbeats;
CREATE POLICY "presence_read_all" ON public.presence_heartbeats FOR SELECT USING (true);

DROP POLICY IF EXISTS "presence_upsert_owner" ON public.presence_heartbeats;
CREATE POLICY "presence_upsert_owner" ON public.presence_heartbeats FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid())
);

-- Push tokens: user manages their own
DROP POLICY IF EXISTS "push_insert_own" ON public.push_tokens;
CREATE POLICY "push_insert_own" ON public.push_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_read_own" ON public.push_tokens;
CREATE POLICY "push_read_own" ON public.push_tokens FOR SELECT USING (auth.uid() = user_id);

-- ==============================================================
-- 9) SEED DEMO DATA (idempotent via ON CONFLICT DO NOTHING)
-- ==============================================================
INSERT INTO public.profiles (id, type, slug, display_name, city, state, lat, lng, availability, verified, compliance_score)
VALUES
  ('11111111-0000-0000-0000-000000000001','escort','texas-heavy-haul','Texas Heavy Haul','Houston','TX',29.7604,-95.3698,'available',true,97),
  ('11111111-0000-0000-0000-000000000002','escort','sunshine-pilot-cars','Sunshine Pilot Cars','Orlando','FL',28.5383,-81.3792,'available',true,94),
  ('11111111-0000-0000-0000-000000000003','broker','gulf-coast-logistics','Gulf Coast Logistics','Mobile','AL',30.6944,-88.0431,'offline',true,88),
  ('11111111-0000-0000-0000-000000000004','escort','stallone-specialized','Stallone Specialized','Atlanta','GA',33.7490,-84.3880,'busy',true,92)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.loads (id, broker_profile_id, title, origin_city, origin_state, origin_lat, origin_lng, dest_city, dest_state, urgency, status)
VALUES
  ('22222222-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000003','Transformer Houston → Dallas','Houston','TX',29.7604,-95.3698,'Dallas','TX',85,'open'),
  ('22222222-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000003','Crane Boom Mobile → Atlanta','Mobile','AL',30.6944,-88.0431,'Atlanta','GA',65,'open'),
  ('22222222-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000003','Windmill Blade Orlando → Tampa','Orlando','FL',28.5383,-81.3792,'Tampa','FL',40,'open')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.presence_heartbeats (profile_id, lat, lng, last_seen_at)
VALUES
  ('11111111-0000-0000-0000-000000000001',29.7604,-95.3698,now()),
  ('11111111-0000-0000-0000-000000000002',28.5383,-81.3792,now())
ON CONFLICT (profile_id) DO UPDATE SET last_seen_at = now();
