-- ============================================================================
-- Ops Notifications — replace Slack dependency with zero-cost push alerts
-- ============================================================================

create table if not exists public.ops_events (
    id              uuid primary key default gen_random_uuid(),
    event_type      text not null,          -- deploy_success, deploy_failure, cron_failure, build_failure, manual
    severity        text not null default 'P2', -- P0, P1, P2, P3
    title           text not null,
    message         text,
    metadata        jsonb default '{}',     -- run_url, job_name, commit_sha, deploy_url, etc.
    source          text default 'system',  -- github_actions, cron, manual, api
    acknowledged    boolean default false,
    acknowledged_at timestamptz,
    acknowledged_by uuid,
    created_at      timestamptz default now()
);

create index if not exists ops_events_severity_idx on public.ops_events (severity, created_at desc);
create index if not exists ops_events_type_idx on public.ops_events (event_type, created_at desc);
create index if not exists ops_events_created_idx on public.ops_events (created_at desc);

-- Admin device tokens for push notifications
create table if not exists public.admin_push_tokens (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null,
    token       text not null unique,
    platform    text default 'web',   -- web, ios, android
    is_active   boolean default true,
    created_at  timestamptz default now()
);

-- RLS
alter table public.ops_events enable row level security;
alter table public.admin_push_tokens enable row level security;

create policy ops_events_read on public.ops_events for select using (auth.role() = 'service_role' or auth.role() = 'authenticated');
create policy ops_events_write on public.ops_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy admin_push_read on public.admin_push_tokens for select using (auth.uid() = user_id or auth.role() = 'service_role');
create policy admin_push_write on public.admin_push_tokens for all using (auth.uid() = user_id or auth.role() = 'service_role') with check (auth.uid() = user_id or auth.role() = 'service_role');
