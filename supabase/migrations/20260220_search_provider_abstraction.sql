-- 20260220_search_provider_abstraction.sql

CREATE TABLE IF NOT EXISTS public.app_settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamptz DEFAULT now()
);

-- Insert default search provider
INSERT INTO public.app_settings (key, value) VALUES ('search_provider', 'typesense') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.search_jobs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name text NOT NULL, -- 'driver_profiles', 'loads', 'corridors'
    record_id uuid NOT NULL,
    operation text NOT NULL, -- 'UPSERT', 'DELETE'
    status text DEFAULT 'pending',
    attempts integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    last_attempt_at timestamptz
);

-- Index for queue consumer
CREATE INDEX IF NOT EXISTS idx_search_jobs_pending ON public.search_jobs(status, created_at) WHERE status = 'pending';

-- Trigger setup for driver_profiles example
CREATE OR REPLACE FUNCTION public.queue_search_sync() 
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.search_jobs (table_name, record_id, operation) VALUES (TG_TABLE_NAME, OLD.id, 'DELETE');
        RETURN OLD;
    ELSE
        INSERT INTO public.search_jobs (table_name, record_id, operation) VALUES (TG_TABLE_NAME, NEW.id, 'UPSERT');
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to core searchable tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_driver_profile_change_sync') THEN
        CREATE TRIGGER on_driver_profile_change_sync
            AFTER INSERT OR UPDATE OR DELETE ON public.driver_profiles
            FOR EACH ROW EXECUTE PROCEDURE public.queue_search_sync();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_load_change_sync') THEN
        CREATE TRIGGER on_load_change_sync
            AFTER INSERT OR UPDATE OR DELETE ON public.loads
            FOR EACH ROW EXECUTE PROCEDURE public.queue_search_sync();
    END IF;
END
$$;
