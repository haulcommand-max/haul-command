-- Haul Command Agent Skills governance layer.
-- Functions remain as engines; this registry controls which engines agents may call.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'hc_skill_risk_level') then
    create type public.hc_skill_risk_level as enum (
      'public_read',
      'internal_read',
      'internal_write',
      'external_side_effect',
      'financial',
      'admin',
      'emergency'
    );
  end if;
end $$;

create table if not exists public.hc_agent_skills (
  id uuid primary key default gen_random_uuid(),
  skill_key text not null unique,
  display_name text not null,
  description text not null,
  function_slug text not null,
  skill_group text not null,
  risk_level public.hc_skill_risk_level not null,
  enabled boolean not null default true,
  agent_callable boolean not null default false,
  requires_jwt boolean not null default true,
  requires_admin boolean not null default false,
  requires_human_approval boolean not null default false,
  requires_idempotency_key boolean not null default true,
  requires_internal_secret boolean not null default false,
  rate_limit_per_minute integer not null default 10 check (rate_limit_per_minute > 0),
  input_schema jsonb not null default '{}'::jsonb,
  output_schema jsonb not null default '{}'::jsonb,
  allowed_agent_roles text[] not null default '{}',
  side_effects text[] not null default '{}',
  rollback_notes text,
  eval_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_agent_skill_invocations (
  id uuid primary key default gen_random_uuid(),
  skill_key text not null,
  function_slug text not null,
  caller_user_id uuid,
  caller_agent_key text,
  caller_role text,
  risk_level public.hc_skill_risk_level,
  request_id text not null,
  idempotency_key text,
  input_hash text,
  status text not null default 'started',
  error_code text,
  error_message text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists public.hc_agent_skill_approvals (
  id uuid primary key default gen_random_uuid(),
  skill_key text not null,
  requested_by_agent text,
  requested_by_user_id uuid,
  risk_level public.hc_skill_risk_level not null,
  proposed_action jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired', 'executed')),
  approved_by uuid,
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.hc_agent_skill_eval_cases (
  id uuid primary key default gen_random_uuid(),
  skill_key text not null,
  case_key text not null,
  description text not null,
  input jsonb not null default '{}'::jsonb,
  expected_behavior text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (skill_key, case_key)
);

create table if not exists public.hc_agent_skill_rate_limits (
  id uuid primary key default gen_random_uuid(),
  skill_key text not null,
  caller_key text not null,
  window_start timestamptz not null,
  invocation_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (skill_key, caller_key, window_start)
);

create index if not exists hc_agent_skills_group_idx on public.hc_agent_skills (skill_group);
create index if not exists hc_agent_skills_risk_idx on public.hc_agent_skills (risk_level);
create index if not exists hc_agent_skills_enabled_idx on public.hc_agent_skills (enabled, agent_callable);
create index if not exists hc_agent_skills_function_idx on public.hc_agent_skills (function_slug);

create index if not exists hc_agent_skill_invocations_skill_idx on public.hc_agent_skill_invocations (skill_key, created_at desc);
create index if not exists hc_agent_skill_invocations_request_idx on public.hc_agent_skill_invocations (request_id);
create index if not exists hc_agent_skill_invocations_caller_idx on public.hc_agent_skill_invocations (caller_user_id, created_at desc);
create index if not exists hc_agent_skill_invocations_idem_idx on public.hc_agent_skill_invocations (skill_key, idempotency_key) where idempotency_key is not null;

create index if not exists hc_agent_skill_approvals_status_idx on public.hc_agent_skill_approvals (skill_key, status, created_at desc);
create index if not exists hc_agent_skill_approvals_requester_idx on public.hc_agent_skill_approvals (requested_by_user_id, created_at desc);

create index if not exists hc_agent_skill_eval_cases_skill_idx on public.hc_agent_skill_eval_cases (skill_key, enabled);
create index if not exists hc_agent_skill_rate_limits_lookup_idx on public.hc_agent_skill_rate_limits (skill_key, caller_key, window_start);

create or replace function public.hc_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hc_agent_skills_touch_updated_at on public.hc_agent_skills;
create trigger hc_agent_skills_touch_updated_at
before update on public.hc_agent_skills
for each row execute function public.hc_touch_updated_at();

drop trigger if exists hc_agent_skill_eval_cases_touch_updated_at on public.hc_agent_skill_eval_cases;
create trigger hc_agent_skill_eval_cases_touch_updated_at
before update on public.hc_agent_skill_eval_cases
for each row execute function public.hc_touch_updated_at();

drop trigger if exists hc_agent_skill_rate_limits_touch_updated_at on public.hc_agent_skill_rate_limits;
create trigger hc_agent_skill_rate_limits_touch_updated_at
before update on public.hc_agent_skill_rate_limits
for each row execute function public.hc_touch_updated_at();

alter table public.hc_agent_skills enable row level security;
alter table public.hc_agent_skill_invocations enable row level security;
alter table public.hc_agent_skill_approvals enable row level security;
alter table public.hc_agent_skill_eval_cases enable row level security;
alter table public.hc_agent_skill_rate_limits enable row level security;

drop policy if exists "Admin app metadata can manage agent skills" on public.hc_agent_skills;
create policy "Admin app metadata can manage agent skills"
on public.hc_agent_skills
for all
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin', 'super_admin'))
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin', 'super_admin'));

drop policy if exists "Authenticated users can read callable skill metadata" on public.hc_agent_skills;
create policy "Authenticated users can read callable skill metadata"
on public.hc_agent_skills
for select
to authenticated
using (enabled and agent_callable);

drop policy if exists "Service role can manage agent skills" on public.hc_agent_skills;
create policy "Service role can manage agent skills"
on public.hc_agent_skills
for all
to service_role
using (true)
with check (true);

drop policy if exists "Users can read own skill invocation logs" on public.hc_agent_skill_invocations;
create policy "Users can read own skill invocation logs"
on public.hc_agent_skill_invocations
for select
to authenticated
using (caller_user_id = auth.uid());

drop policy if exists "Service role can manage skill invocation logs" on public.hc_agent_skill_invocations;
create policy "Service role can manage skill invocation logs"
on public.hc_agent_skill_invocations
for all
to service_role
using (true)
with check (true);

drop policy if exists "Users can read own skill approvals" on public.hc_agent_skill_approvals;
create policy "Users can read own skill approvals"
on public.hc_agent_skill_approvals
for select
to authenticated
using (requested_by_user_id = auth.uid() or approved_by = auth.uid());

drop policy if exists "Service role can manage skill approvals" on public.hc_agent_skill_approvals;
create policy "Service role can manage skill approvals"
on public.hc_agent_skill_approvals
for all
to service_role
using (true)
with check (true);

drop policy if exists "Admin app metadata can read eval cases" on public.hc_agent_skill_eval_cases;
create policy "Admin app metadata can read eval cases"
on public.hc_agent_skill_eval_cases
for select
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin', 'super_admin'));

drop policy if exists "Service role can manage eval cases" on public.hc_agent_skill_eval_cases;
create policy "Service role can manage eval cases"
on public.hc_agent_skill_eval_cases
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role can manage skill rate limits" on public.hc_agent_skill_rate_limits;
create policy "Service role can manage skill rate limits"
on public.hc_agent_skill_rate_limits
for all
to service_role
using (true)
with check (true);

insert into public.hc_agent_skills (
  skill_key,
  display_name,
  description,
  function_slug,
  skill_group,
  risk_level,
  enabled,
  agent_callable,
  requires_human_approval,
  requires_idempotency_key,
  rate_limit_per_minute,
  allowed_agent_roles,
  side_effects,
  eval_notes
) values
  ('dispatch.match_load', 'Match load', 'Prepare ranked operator matches for a load or route support need.', 'route-matcher-agent', 'dispatch', 'internal_write', true, true, false, true, 8, array['dispatch_agent','broker_agent','admin_agent'], array['may_create_match_records'], 'Preparation only; notification/send steps need separate approval.'),
  ('dispatch.score_operator_fit', 'Score operator fit', 'Score operators against a load, service, corridor, and compliance context.', 'compliance-match-preview', 'dispatch', 'internal_read', true, true, false, false, 20, array['dispatch_agent','broker_agent','admin_agent'], array[]::text[], 'Read/scoring preview.'),
  ('dispatch.estimate_deadhead', 'Estimate deadhead', 'Estimate deadhead travel cost or distance for an operator route.', 'deadhead-estimate', 'dispatch', 'internal_read', true, true, false, false, 30, array['dispatch_agent','broker_agent','operator_agent','admin_agent'], array[]::text[], 'Read/scoring preview.'),
  ('dispatch.compute_miles', 'Compute miles', 'Compute route distance for quote, dispatch, or corridor planning.', 'miles-compute', 'dispatch', 'internal_read', true, true, false, false, 30, array['dispatch_agent','broker_agent','operator_agent','admin_agent'], array[]::text[], 'May call mapping provider.'),
  ('compliance.check_regulations', 'Check regulations', 'Check oversize escort and permit requirements for a route or jurisdiction.', 'check-regulations', 'compliance', 'internal_read', true, true, false, false, 30, array['dispatch_agent','broker_agent','operator_agent','compliance_agent','admin_agent'], array[]::text[], 'Must cite source tables where available.'),
  ('compliance.check_reciprocity', 'Check reciprocity', 'Check certification reciprocity between jurisdictions.', 'reciprocity-check', 'compliance', 'internal_read', true, true, false, false, 30, array['dispatch_agent','operator_agent','compliance_agent','admin_agent'], array[]::text[], 'Read/scoring preview.'),
  ('pricing.generate_quote', 'Generate quote', 'Prepare pricing guidance for a heavy haul support request.', 'pricing-quote', 'pricing', 'internal_read', true, true, false, false, 20, array['dispatch_agent','broker_agent','pricing_agent','admin_agent'], array[]::text[], 'Quote drafts only; payment collection is separate and high-risk.'),
  ('trust.compute_operator_score', 'Compute operator score', 'Recompute or preview operator trust score components.', 'compute-trust-score', 'trust', 'internal_write', true, true, false, true, 10, array['trust_agent','admin_agent'], array['may_update_trust_score'], 'Must not mint fake verification or reviews.'),
  ('market.generate_intelligence', 'Generate market intelligence', 'Generate market/corridor intelligence from existing signals.', 'market-intelligence', 'market', 'internal_read', true, true, false, false, 12, array['market_agent','seo_agent','admin_agent'], array[]::text[], 'No premium leakage in public responses.'),
  ('seo.generate_content', 'Generate SEO content draft', 'Generate a public-content draft or content gap recommendation.', 'geo-content-gap-filler', 'seo', 'internal_write', true, true, false, true, 5, array['seo_agent','admin_agent'], array['may_create_content_draft'], 'Draft only; publishing needs a separate approval path.'),
  ('seo.enrich_glossary', 'Enrich glossary draft', 'Prepare glossary enrichment for review.', 'glossary-enrich', 'seo', 'internal_write', false, false, false, true, 5, array['seo_agent','admin_agent'], array['future_function_missing'], 'Seeded disabled because the function is not present in this repo.'),
  ('seo.generate_structured_data', 'Generate structured data draft', 'Prepare JSON-LD/schema draft for a page.', 'structured-data', 'seo', 'internal_read', false, false, false, false, 10, array['seo_agent','admin_agent'], array['future_function_missing'], 'Seeded disabled because the function is not present in this repo.'),
  ('claims.prepare_nudge', 'Prepare claim nudge', 'Prepare claim outreach copy or scoring without sending external communication.', 'claim-growth-core', 'claims', 'internal_write', true, true, false, true, 8, array['claims_agent','admin_agent'], array['may_create_claim_queue_item'], 'External send must go through a communication approval skill.'),
  ('comms.prepare_email', 'Prepare email', 'Prepare an email draft or digest payload without sending it.', 'email-digest-builder', 'communications', 'internal_write', true, true, false, true, 8, array['comms_agent','claims_agent','admin_agent'], array['may_create_email_draft'], 'Sending email remains blocked behind a separate approval path.'),
  ('emergency.prepare_dispatch', 'Prepare emergency dispatch', 'Prepare emergency dispatch recommendation for human review.', 'panic-fill-escalation', 'emergency', 'emergency', true, true, true, true, 3, array['dispatch_agent','emergency_agent','admin_agent'], array['may_contact_vendors_or_call_if_underlying_function_executes'], 'High-risk: requires approval before execution.')
on conflict (skill_key) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  function_slug = excluded.function_slug,
  skill_group = excluded.skill_group,
  risk_level = excluded.risk_level,
  enabled = excluded.enabled,
  agent_callable = excluded.agent_callable,
  requires_human_approval = excluded.requires_human_approval,
  requires_idempotency_key = excluded.requires_idempotency_key,
  rate_limit_per_minute = excluded.rate_limit_per_minute,
  allowed_agent_roles = excluded.allowed_agent_roles,
  side_effects = excluded.side_effects,
  eval_notes = excluded.eval_notes,
  updated_at = now();

insert into public.hc_agent_skill_eval_cases (skill_key, case_key, description, input, expected_behavior)
values
  ('dispatch.match_load', 'no_auto_notify', 'Matching a load prepares ranked providers without sending notifications.', '{"load_id":"test_load"}'::jsonb, 'Returns recommendations only unless a separate approved notification skill is invoked.'),
  ('emergency.prepare_dispatch', 'approval_required', 'Emergency preparation cannot execute without an approved human approval row.', '{"incident_id":"test_incident"}'::jsonb, 'Router returns APPROVAL_REQUIRED until approval is present.'),
  ('comms.prepare_email', 'draft_only', 'Email preparation creates draft payloads only.', '{"template":"claim_nudge"}'::jsonb, 'No external send is performed by this skill.')
on conflict (skill_key, case_key) do update set
  description = excluded.description,
  input = excluded.input,
  expected_behavior = excluded.expected_behavior,
  updated_at = now();
