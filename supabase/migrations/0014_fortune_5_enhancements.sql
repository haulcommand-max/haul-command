-- 0014_fortune_5_enhancements.sql

-- ================
-- 1) Broker trust score
-- ================

create table if not exists public.broker_trust_scores (
  broker_id uuid primary key references public.profiles(id) on delete cascade,
  score numeric not null default 0,              -- 0..100
  tier text not null default 'unrated',          -- unrated/bronze/silver/gold/platinum
  last_computed_at timestamptz not null default now(),
  components jsonb not null default '{}'::jsonb  -- explainability: on_time, cancels, disputes, pay_speed, verification
);

create index if not exists idx_broker_trust_scores_tier on public.broker_trust_scores (tier);
create index if not exists idx_broker_trust_scores_score on public.broker_trust_scores (score desc);

-- Broker behavior events (for scoring + ghost load detection)
create table if not exists public.broker_events (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null, -- load_posted, load_cancelled, no_show, dispute_opened, dispute_won, dispute_lost, paid_on_time, late_payment
  job_id uuid null references public.jobs(id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_broker_events_broker_time on public.broker_events (broker_id, occurred_at desc);
create index if not exists idx_broker_events_type_time on public.broker_events (event_type, occurred_at desc);

-- ================
-- 2) Compliance reminders (driver + broker + vehicle + docs)
-- ================

create table if not exists public.compliance_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reminder_type text not null, -- insurance_expiring, cert_expiring, equipment_reverify, doc_missing, payment_hold_review
  due_at timestamptz not null,
  status text not null default 'pending', -- pending, sent, dismissed, resolved
  channel text not null default 'push', -- push, email, sms
  related_doc_id uuid null,
  related_job_id uuid null references public.jobs(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_compliance_reminders_due on public.compliance_reminders (status, due_at);
create index if not exists idx_compliance_reminders_user on public.compliance_reminders (user_id, status, due_at);

-- ================
-- 3) Rank snapshots (hourly snapshots + momentum arrows)
-- ================

create table if not exists public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  board_key text not null,          -- e.g. "us:fl:monthly:most_verified_miles"
  period_key text not null,         -- e.g. "2026-02" for monthly, "2026S" for season, "all_time"
  captured_at timestamptz not null, -- snapshot timestamp
  top_rows jsonb not null,          -- array of {rank,user_id,display_name,score,delta_rank,delta_score}
  meta jsonb not null default '{}'::jsonb
);

create index if not exists idx_leaderboard_snapshots_board_period_time
  on public.leaderboard_snapshots (board_key, period_key, captured_at desc);

-- Update existing leaderboard_rollups to support ranking
alter table public.leaderboard_rollups 
add column if not exists rank int not null default 0;

-- Optional: Add index for ranking if not implicitly covered reasonably (optimizing for the board queries specifically might require composite indexes on period+cols, but we have some keys)


-- ================
-- 4) Profile Enhancements
-- ================

alter table public.profiles
add column if not exists lifetime_runs int not null default 0,
add column if not exists lifetime_verified_miles numeric not null default 0;


-- ================
-- 5) RLS Rules
-- ================

-- Broker Trust
alter table public.broker_trust_scores enable row level security;
alter table public.broker_events enable row level security;

-- Only service role writes trust/events (usually). 
-- Public read of trust scores? Maybe limited. The schema says "top brokers by average pay days".
-- Let's make scores readable.
create policy "scores_select_public" on public.broker_trust_scores for select using (true);

-- Events are private or service only? Usually private.
create policy "events_select_service" on public.broker_events for select to service_role using (true);
-- Maybe user can see their own events?
create policy "events_select_own" on public.broker_events for select to authenticated using (broker_id = auth.uid());


-- Compliance Reminders
alter table public.compliance_reminders enable row level security;
create policy "reminders_select_own" on public.compliance_reminders for select to authenticated using (user_id = auth.uid());
-- Service role full access
create policy "reminders_all_service" on public.compliance_reminders for all to service_role using (true) with check (true);


-- Leaderboard Snapshots
alter table public.leaderboard_snapshots enable row level security;
create policy "snapshots_select_public" on public.leaderboard_snapshots for select using (true);
create policy "snapshots_write_service" on public.leaderboard_snapshots for all to service_role using (true) with check (true);


-- ================
-- 6) Public SEO View Update
-- ================

create or replace view public.directory_drivers as
select
  p.id as driver_id,
  p.display_name,
  p.home_base_city,
  p.home_base_state,
  p.home_base_country,
  p.profile_slug,
  p.avatar_url,
  p.is_verified,
  -- p.last_active_bucket not in schema yet, skipping or could be calculated. User prompt implied it exists or we add it. 
  -- Assuming simpler version for now unless we add that column. 
  -- Checking profiles table... we don't have last_active_bucket column.
  -- We'll use updated_at as proxy for now or skip.
  p.lifetime_runs,
  p.lifetime_verified_miles,
  p.roles as public_tags,         -- re-using roles or metadata? Prompt says 'public_tags -- jsonb'. We don't have that yet. 
  -- We will use what we have to avoid breaking view.
  p.phone as public_phone_masked, -- masked logic should happen in frontend or separate function. Accessing raw phone here is risky if RLS doesn't block view. 
  -- Wait, views bypass RLS of underlying tables if defined with specific security properties.
  -- Better NOT to expose raw phone.
  p.updated_at
from public.profiles p
where p.role = 'driver'
  -- and p.is_listed_public = true; -- We don't have is_listed_public column.
  ;

-- To be safe, let's keep the view simple compatible with 0003 but utilizing new columns.
-- NOTE: User requested SPECIFIC view definition. 
-- "create or replace view public.directory_drivers as select ... p.last_active_bucket, p.public_tags"
-- I should probably ADD these columns to profiles to match the request exactly if I want to use that view.

alter table public.profiles 
add column if not exists last_active_bucket text default 'this_month', 
add column if not exists public_tags jsonb default '[]'::jsonb;
-- is_listed_public
alter table public.profiles
add column if not exists is_listed_public boolean default true;


-- NOW recreate the view exactly
create or replace view public.directory_drivers as
select
  p.id as driver_id,
  p.display_name,
  p.home_base_city,
  p.home_base_state,
  p.home_base_country,
  p.profile_slug,
  p.avatar_url,
  p.is_verified,
  p.last_active_bucket,  
  p.lifetime_runs,
  p.lifetime_verified_miles,
  p.public_tags,         
  -- Masking phone in SQL is safe
  case when p.phone is not null and length(p.phone) > 4 
       then '•••-•••-' || right(p.phone, 4) 
       else null 
  end as public_phone_masked,
  p.updated_at
from public.profiles p
where p.role = 'driver'
  and p.is_listed_public = true;


-- ================
-- 7) Tiny Atomic RPC
-- ================

create or replace function public.rpc_jobs_create_from_offer_atomic(
  p_offer_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id uuid;
begin
  -- lock the offer row so it cannot be processed twice
  perform 1 from public.offers where id = p_offer_id for update;

  -- ensure offer is still valid
  if (select status from public.offers where id = p_offer_id) <> 'accepted' then
    raise exception 'Offer is not accepted';
  end if;

  -- create job
  insert into public.jobs (offer_id, broker_id, driver_id, status, created_at)
  select id, broker_id, driver_id, 'active', now()
  from public.offers
  where id = p_offer_id
  returning id into v_job_id;

  -- mark offer as consumed
  update public.offers set status = 'booked', updated_at = now()
  where id = p_offer_id;

  return v_job_id;
end;
$$;

revoke all on function public.rpc_jobs_create_from_offer_atomic(uuid) from public;
grant execute on function public.rpc_jobs_create_from_offer_atomic(uuid) to service_role;
