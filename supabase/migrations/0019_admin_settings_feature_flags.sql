-- 0019_admin_settings_feature_flags.sql
-- This is your “backend knobs” system.
begin;

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  rules jsonb not null default '{}'::jsonb, -- optional targeting
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.app_settings enable row level security;
alter table public.feature_flags enable row level security;

-- public read (safe): settings/flags are safe to read client-side
create policy "settings_public_read"
on public.app_settings for select
to anon, authenticated
using (true);

create policy "flags_public_read"
on public.feature_flags for select
to anon, authenticated
using (true);

-- deny client writes; service role + admin via edge function handles writes
create policy "settings_deny_write"
on public.app_settings for insert to authenticated with check (false);

create policy "flags_deny_write"
on public.feature_flags for insert to authenticated with check (false);

commit;
