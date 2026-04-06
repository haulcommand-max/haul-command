-- ═══════════════════════════════════════════════════════════════
-- Haul Command — hc_saved_searches table
-- Enables brokers to save search preferences and receive 
-- FCM push notifications when matching operators go live.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_saved_searches (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label          text,                       -- user-defined name "Texas Pilot Cars"
  country_code   char(2),                    -- ISO2 filter
  region_code    text,                       -- state/province filter
  service_types  text[],                     -- e.g. ['pilot_car','height_pole']
  corridor_slugs text[],                     -- corridor slug filters
  notify_push    boolean NOT NULL DEFAULT true,
  notify_email   boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Dedup: user can't have two identical watches
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_searches_dedup
  ON public.hc_saved_searches (user_id, country_code, region_code)
  WHERE region_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_saved_searches_user
  ON public.hc_saved_searches (user_id);

CREATE INDEX IF NOT EXISTS idx_saved_searches_notify
  ON public.hc_saved_searches (notify_push, country_code)
  WHERE notify_push = true;

ALTER TABLE public.hc_saved_searches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hc_saved_searches'
      AND policyname = 'saved_searches_owner'
  ) THEN
    CREATE POLICY saved_searches_owner
      ON public.hc_saved_searches FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END;
$$;

COMMENT ON TABLE public.hc_saved_searches IS
  'Broker saved search preferences. notify_push=true triggers FCM alert when matching operator broadcasts.';
