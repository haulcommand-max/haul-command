-- 0033_feature_flags_new.sql
-- Add new feature flags for v5.0 capabilities.
-- Uses ON CONFLICT DO NOTHING — safe to re-run.

begin;

insert into public.feature_flags (key, enabled, description) values
  ('insurance_ocr_enabled',         false, 'Insurance OCR parse via insurance-ocr-parse edge function'),
  ('compliance_reminders_enabled',  true,  'Compliance reminder dispatch (insurance expiry, cert expiry)'),
  ('high_pole_calibration_enabled', true,  'High pole calibration logs + PDF generation'),
  ('invoice_generator_enabled',     true,  'Driver invoice generator with PDF artifact'),
  ('reciprocity_engine_enabled',    true,  'Reciprocity check via certifications + reciprocity_rules tables'),
  ('rank_momentum_enabled',         true,  'Leaderboard rank momentum arrows + rival alerts'),
  ('full_contact_unlock_enabled',   true,  'Public directory hides contact; unlock requires login'),
  ('priority_alerts_enabled',       false, 'Priority compliance alerts (bridge height, enforcement)'),
  ('share_cards_enabled',           true,  'Leaderboard social share cards'),
  ('event_log_enabled',             true,  'Event spine for retention + analytics + SEO queue')
on conflict (key) do nothing;

commit;
