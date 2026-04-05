-- Migration: 20260404_027_presence_heartbeats.sql
-- Creates the presence_heartbeats table referenced by /api/activity
-- Tracks live operator presence for real-time activity feed
begin;

create table if not exists public.presence_heartbeats (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.hc_trust_profiles(id) on delete cascade,
  user_id        uuid references auth.users(id) on delete set null,
  last_seen_at   timestamptz not null default now(),
  page_slug      text,
  device_type    text check(device_type in('mobile','tablet','desktop')),
  country_code   char(2),
  created_at     timestamptz default now()
);

-- Only keep the most recent heartbeat per profile (TTL-style)
create unique index if not exists idx_presence_heartbeats_profile
  on public.presence_heartbeats(profile_id);

create index if not exists idx_presence_heartbeats_last_seen
  on public.presence_heartbeats(last_seen_at desc);

alter table public.presence_heartbeats enable row level security;

-- Public can read recent presence (for live activity feed)
create policy "Public read recent presence"
  on public.presence_heartbeats for select
  using (last_seen_at > now() - interval '1 hour');

-- Authenticated users can upsert their own heartbeat
create policy "Users upsert own heartbeat"
  on public.presence_heartbeats for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role full access
create policy "Service role full access"
  on public.presence_heartbeats for all
  using (auth.role() = 'service_role');

-- Also create a /api/activity-compatible view making query easier
create or replace view public.v_recent_presence as
  select profile_id, last_seen_at
  from public.presence_heartbeats
  where last_seen_at > now() - interval '1 hour'
  order by last_seen_at desc;

-- Fix verified_activity_summary if it doesn't exist yet
-- (referenced by trust score route)
create table if not exists public.verified_activity_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  event_type  text not null,
  payload     jsonb default '{}',
  created_at  timestamptz default now()
);

create table if not exists public.verified_activity_summary (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  post_count    int default 0,
  fill_count    int default 0,
  response_avg  numeric(5,2),
  last_active   timestamptz,
  updated_at    timestamptz default now()
);

alter table public.verified_activity_events enable row level security;
alter table public.verified_activity_summary enable row level security;

create policy "Users read own activity events" on public.verified_activity_events
  for select using (auth.uid() = user_id);
create policy "Users read own activity summary" on public.verified_activity_summary
  for select using (auth.uid() = user_id);
create policy "Service role full activity events" on public.verified_activity_events
  for all using (auth.role() = 'service_role');
create policy "Service role full activity summary" on public.verified_activity_summary
  for all using (auth.role() = 'service_role');

commit;
