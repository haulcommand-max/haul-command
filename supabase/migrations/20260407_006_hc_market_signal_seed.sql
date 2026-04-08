insert into public.hc_agent_configs (
  agent_key,
  active,
  model_policy,
  run_schedule_json,
  thresholds_json,
  rate_limits_json,
  guardrails_json,
  review_policy_json
)
values
(
  'corridor_heat_agent',
  true,
  'deterministic_first',
  '{"cron":"0 * * * *"}'::jsonb,
  '{"minimum_signal_score":0.25}'::jsonb,
  '{"max_per_run":250}'::jsonb,
  '{"require_geo_context":true}'::jsonb,
  '{"manual_review_for_high_risk":true}'::jsonb
),
(
  'claim_pressure_agent',
  true,
  'deterministic_first',
  '{"cron":"0 */12 * * *"}'::jsonb,
  '{"minimum_priority_score":0.30}'::jsonb,
  '{"max_per_run":500}'::jsonb,
  '{"require_primary_cta":true}'::jsonb,
  '{"manual_review_for_high_risk":false}'::jsonb
),
(
  'distribution_router_agent',
  true,
  'deterministic_first',
  '{"cron":"*/10 * * * *"}'::jsonb,
  '{"max_jobs_per_run":500}'::jsonb,
  '{"max_per_channel":100}'::jsonb,
  '{"require_onsite_target":true}'::jsonb,
  '{"manual_review_for_high_risk":true}'::jsonb
),
(
  'page_refresh_agent',
  true,
  'deterministic_first',
  '{"cron":"*/5 * * * *"}'::jsonb,
  '{"max_refresh_jobs_per_run":500}'::jsonb,
  '{"max_per_surface_type":200}'::jsonb,
  '{"fail_if_no_dead_end_contract_missing":true}'::jsonb,
  '{"manual_review_for_high_risk":false}'::jsonb
)
on conflict (agent_key) do nothing;

insert into public.hc_geo_distribution_accounts (
  channel,
  country_code,
  region_code,
  account_key,
  publishing_rules_json,
  active
)
values
(
  'tiktok',
  'US',
  null,
  'tiktok_us_primary',
  '{"default_publish_mode":"draft_only","supports_autopublish":true}'::jsonb,
  true
),
(
  'facebook',
  'US',
  null,
  'facebook_us_primary',
  '{"default_publish_mode":"draft_only","supports_autopublish":true}'::jsonb,
  true
),
(
  'linkedin',
  'US',
  null,
  'linkedin_us_primary',
  '{"default_publish_mode":"manual_review","supports_autopublish":false}'::jsonb,
  true
)
on conflict (account_key) do nothing;

insert into public.hc_content_templates (
  template_key,
  object_type,
  signal_type,
  channel,
  language_code,
  risk_level,
  variant_label,
  template_json,
  qa_rules_json,
  active
)
values
(
  'corridor_heat_tiktok_en',
  'corridor',
  'corridor_heat',
  'tiktok',
  'en',
  'low',
  'default',
  '{"hook":"This corridor is heating up.","body":"Coverage is tightening. See who is active now.","primary_cta":"view_corridor"}'::jsonb,
  '{"requires_hook":true,"requires_primary_cta":true}'::jsonb,
  true
),
(
  'claim_pressure_facebook_en',
  'profile',
  'claim_pressure',
  'facebook',
  'en',
  'medium',
  'default',
  '{"hook":"Your profile may already be getting searched.","body":"Claim it and improve what buyers see.","primary_cta":"claim_profile"}'::jsonb,
  '{"requires_hook":true,"requires_primary_cta":true}'::jsonb,
  true
)
on conflict (template_key) do nothing;

insert into public.hc_localization_bundles (
  country_code,
  language_code,
  region_code,
  currency_code,
  distance_unit,
  weight_unit,
  route_terms_json,
  authority_terms_json,
  compliance_terms_json,
  stylistic_rules_json
)
values
(
  'US',
  'en',
  null,
  'USD',
  'mi',
  'lb',
  '{"corridor":"corridor","route":"route"}'::jsonb,
  '{"transport_authority":"DOT"}'::jsonb,
  '{"oversize":"oversize","permit":"permit"}'::jsonb,
  '{"tone":"direct","hyperlocal":true}'::jsonb
)
on conflict (country_code, language_code, coalesce(region_code, '')) do nothing;
