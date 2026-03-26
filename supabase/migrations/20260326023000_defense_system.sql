-- ==============================================================================
-- ANTI-GRAVITY DEFENSE SYSTEM V1
-- Tracking, blocking, and poisoning unauthorized scrapers.
-- ==============================================================================

-- 1. REQUEST LOG (CORE FOR DEFENSE)
CREATE TABLE IF NOT EXISTS public.request_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip text,
  user_agent text,
  path text,
  is_bot boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- Turn on RLS for request_log
ALTER TABLE public.request_log ENABLE ROW LEVEL SECURITY;
-- Only service_role can insert, admin can view

-- 2. BLOCKED IPs
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip text UNIQUE,
  reason text,
  created_at timestamp DEFAULT now()
);

ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- 3. HONEYTOKENS
CREATE TABLE IF NOT EXISTS public.honeytokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone text,
  tag text,
  triggered boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

ALTER TABLE public.honeytokens ENABLE ROW LEVEL SECURITY;

-- Set Realtime replication on request_log so the dashboard can stream it
DO $$
BEGIN
  -- Check if publication exists, if not create it (Supabase standard is 'supabase_realtime')
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  
  -- Add table to publication if not already added
  ALTER PUBLICATION supabase_realtime ADD TABLE public.request_log;
EXCEPTION WHEN OTHERS THEN
  -- Handle constraint or already-exists errors silently if added
END;
$$;
