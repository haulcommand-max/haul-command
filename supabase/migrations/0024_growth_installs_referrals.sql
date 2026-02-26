-- 0024_growth_installs_referrals.sql
-- Purpose: install attribution + referrals + review events (service_role write; safe reads)

begin;

-- 1) referral codes (owned by a user profile)
create table if not exists public.referral_codes (
  code text primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  active boolean not null default true
);

create index if not exists referral_codes_owner_idx on public.referral_codes(owner_user_id);

-- 2) app installs (device hash is optional; keep minimal)
create table if not exists public.app_installs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  platform text not null check (platform in ('ios','android','web')),
  source text null,            -- e.g. 'facebook', 'seo', 'direct'
  campaign text null,          -- e.g. 'fb_group_launch', 'leaderboard_share'
  referrer_code text null references public.referral_codes(code) on delete set null,
  device_hash text null,       -- hashed locally if you want (optional)
  first_open_at timestamptz not null default now()
);

create index if not exists app_installs_user_idx on public.app_installs(user_id);
create index if not exists app_installs_referrer_idx on public.app_installs(referrer_code);
create index if not exists app_installs_first_open_idx on public.app_installs(first_open_at);

-- 3) referral events (install credited, signup credited, etc.)
create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null references public.referral_codes(code) on delete cascade,
  install_id uuid not null references public.app_installs(id) on delete cascade,
  event_type text not null check (event_type in ('install','signup','verified_driver','verified_broker','first_job_complete')),
  points int not null default 0,
  created_at timestamptz not null default now(),
  unique (install_id, event_type)
);

create index if not exists referral_events_code_idx on public.referral_events(referral_code);
create index if not exists referral_events_created_idx on public.referral_events(created_at);

-- 4) review prompt logging (so you can tune ASO + avoid spam)
create table if not exists public.review_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  platform text not null check (platform in ('ios','android','web')),
  event_type text not null check (event_type in ('prompted','accepted','dismissed')),
  context text null, -- e.g. 'job_complete', 'leaderboard_rank_up'
  created_at timestamptz not null default now()
);

create index if not exists review_events_user_idx on public.review_events(user_id);
create index if not exists review_events_created_idx on public.review_events(created_at);

-- 5) RLS: default deny
alter table public.referral_codes enable row level security;
alter table public.app_installs enable row level security;
alter table public.referral_events enable row level security;
alter table public.review_events enable row level security;

-- Everyone can read referral code existence (so deep links can validate),
-- but only the owner can see/manage their code row.
create policy "referral_codes_read_public"
on public.referral_codes
for select
to anon, authenticated
using (active = true);

create policy "referral_codes_owner_manage"
on public.referral_codes
for all
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

-- app_installs: users can read their own. Only service_role should insert/update broadly via Edge Functions.
create policy "app_installs_read_own"
on public.app_installs
for select
to authenticated
using (user_id = auth.uid());

-- referral_events: users can read events tied to codes they own
create policy "referral_events_read_owner"
on public.referral_events
for select
to authenticated
using (
  exists (
    select 1 from public.referral_codes rc
    where rc.code = referral_events.referral_code
      and rc.owner_user_id = auth.uid()
  )
);

-- review_events: users can read their own
create policy "review_events_read_own"
on public.review_events
for select
to authenticated
using (user_id = auth.uid());

commit;
