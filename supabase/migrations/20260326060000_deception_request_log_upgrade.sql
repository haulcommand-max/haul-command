-- ==============================================================================
-- ANTI-GRAVITY DEFENSE SYSTEM V2
-- Upgrades to request_log and introduction of Session DNA Fingerprinting
-- ==============================================================================

-- 1. UPGRADE REQUEST_LOG FOR THE LIVE THREAT MAP
ALTER TABLE public.request_log 
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS latitude float,
ADD COLUMN IF NOT EXISTS longitude float;

-- 2. SESSION DNA FINGERPRINTING SYSTEM
-- Tracks the immutable biological markers of scrapers even when they rotate IPs.
CREATE TABLE IF NOT EXISTS public.session_dna (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address text NOT NULL,
  user_agent text,
  canvas_fingerprint text,
  webgl_fingerprint text,
  fonts_hash text,
  screen_resolution text,
  hardware_concurrency integer,
  device_memory float,
  is_tor boolean DEFAULT false,
  is_vpn_proxy boolean DEFAULT false,
  risk_score float DEFAULT 0.0,
  associated_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_seen_at timestamp DEFAULT now(),
  last_seen_at timestamp DEFAULT now()
);

-- Turn on RLS
ALTER TABLE public.session_dna ENABLE ROW LEVEL SECURITY;

-- Only service role and admins should view session DNA
CREATE POLICY "Admin full access session dna" ON public.session_dna FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Add realtime publication for the Threat Map UI if not present
DO $$
BEGIN
  -- Add table to publication if not already added
  ALTER PUBLICATION supabase_realtime ADD TABLE public.session_dna;
EXCEPTION WHEN OTHERS THEN
  -- Handle constraint or already-exists errors silently
END;
$$;
