-- 🚩 MODULE E: FEATURE FLAGS (Day 1 Guardrails)
-- Directive: "Default OFF. Flip per Environment."

CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Flags (Idempotent)
INSERT INTO feature_flags(key, enabled, config) VALUES
('maps_provider', false, '{"provider":"billing_locked", "fallback":"maplibre"}'),
('weather_provider', false, '{"provider":"none", "alert_threshold":"severe_only"}'),
('telematics_enabled', false, '{"provider":"none", "sync_interval": 3600}'),
('voice_vapi_enabled', false, '{"mode":"mock", "voice_id":"default"}'),
('payments_stripe_enabled', false, '{"mode":"test", "connect_payouts":false}'),
('payments_connect_enabled', false, '{"payouts":"hold_release"}'),
('canada_crossborder_mode', true, '{"fr_ui":"hidden", "rules":"enabled", "currency":"CAD"}'),
('risk_superload_mode', false, '{"bridge":"basic", "geometric_friction":false}'),
('enterprise_portal', false, '{"hidden":true, "sso_enabled":false}'),
('public_ingestion_enabled', false, '{"robots_respected":true, "rate_limit_rps":0.2}'),
('programmatic_seo_enabled', true, '{"isr":true, "max_pages_per_run":500}'),
('reputation_engine_enabled', true, '{"ranks":true, "badges":true, "dispute_window_days":7}'),
('evidence_vault_enabled', true, '{"storage":"supabase", "hashing":"on"}')
ON CONFLICT (key) DO UPDATE SET
  config = EXCLUDED.config,
  updated_at = NOW();

-- RLS: Only Admins can update flags. Public can read based on app context (handled via Edge Function usually, but exposing read for now).
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Flags" ON feature_flags
  FOR SELECT USING (true); -- Front-end needs to know what to hide.

CREATE POLICY "Admin Manage Flags" ON feature_flags
  FOR ALL USING (auth.role() = 'service_role');
