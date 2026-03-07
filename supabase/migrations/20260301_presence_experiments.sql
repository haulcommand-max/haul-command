-- ================================================================
-- Presence Experiments — Database Migration
-- Table: experiment_events
-- ================================================================

CREATE TABLE IF NOT EXISTS public.experiment_events (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id  TEXT NOT NULL,
    variant_id     TEXT NOT NULL,
    operator_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type     TEXT NOT NULL CHECK (event_type IN (
        'impression','click','check_in','dismiss',
        'modal_shown','modal_primary_click','modal_secondary_click','modal_dismiss',
        'return_next_day','booking_after_view'
    )),
    metadata       JSONB DEFAULT '{}',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experiment_events_exp
    ON public.experiment_events(experiment_id, variant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_experiment_events_operator
    ON public.experiment_events(operator_id, experiment_id);

ALTER TABLE public.experiment_events ENABLE ROW LEVEL SECURITY;

-- Service-only write, operator can read own
CREATE POLICY experiment_events_service ON public.experiment_events
    FOR ALL USING (true);
