-- 🏗️ PHASE 2: TRUST & RANK BACKEND
-- "The Moat" (Trust) & "The Hook" (Gamification)

-- 1. RANK EVENTS (The Ledger of Behavior)
do $$ begin
  create type rank_event_type as enum (
    'JOB_COMPLETE',       -- +100 pts
    'CERT_VERIFIED',      -- +50 pts (one time)
    'INSURANCE_VERIFIED', -- +100 pts (active)
    'REFERRAL_ACTIVE',    -- +200 pts
    'PERFECT_WEEK',       -- +50 pts (bonus)
    'COMMUNITY_HELP'      -- +10 pts (verified hazard, etc)
  );
exception when duplicate_object then null; end $$;

create table if not exists rank_events (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references profiles(id) on delete cascade,
  event_type rank_event_type not null,
  points int not null,
  meta jsonb, -- { "job_id": "...", "cert_type": "FL" }
  created_at timestamptz not null default now()
);

create index if not exists idx_rank_events_driver on rank_events(driver_id);

-- 2. DRIVER RANKS (The Current Status Cache)
do $$ begin
  create type rank_tier as enum ('ROOKIE', 'ROAD_READY', 'ELITE', 'LEGEND');
exception when duplicate_object then null; end $$;

create table if not exists driver_ranks (
  driver_id uuid primary key references profiles(id) on delete cascade,
  current_points int not null default 0,
  current_tier rank_tier not null default 'ROOKIE',
  trust_score int not null default 0, -- 0 to 100
  last_updated_at timestamptz not null default now()
);

-- 3. TRUST SCORE CALCULATION (The Algo)
-- Metrics:
-- Insurance Active: +40
-- Active Certs: +10 each (cap 30)
-- Equipment Verified: +10
-- No recent "Drops" (cancelled jobs): +20
create or replace function calculate_trust_score(target_driver_id uuid)
returns int
language plpgsql
security definer
as $$
declare
  _score int := 0;
  _has_insurance boolean;
  _cert_count int;
  _has_equipment boolean;
begin
  -- A. Insurance (+40)
  select exists(
    select 1 from documents 
    where owner_id = target_driver_id 
    and doc_type = 'insurance' 
    and status = 'verified' 
    and expires_at > current_date
  ) into _has_insurance;
  
  if _has_insurance then _score := _score + 40; end if;

  -- B. Certifications (+10 each, max 30)
  select count(*) into _cert_count
  from certifications
  where driver_id = target_driver_id and verified = true and expires_at > current_date;
  
  if _cert_count > 3 then _cert_count := 3; end if;
  _score := _score + (_cert_count * 10);

  -- C. Equipment (+10 if ANY equipment verified)
  select exists(
    select 1 from driver_equipment 
    where driver_id = target_driver_id and verified = true
  ) into _has_equipment;
  
  if _has_equipment then _score := _score + 10; end if;

  -- D. History (Placeholder: Start with +20, penalize later)
  _score := _score + 20;
  
  -- Cap at 100
  if _score > 100 then _score := 100; end if;

  return _score;
end;
$$;

-- 4. RANK UPDATE TRIGGER (Real-time Gamification)
create or replace function update_driver_rank()
returns trigger
language plpgsql
security definer
as $$
declare
  _total_points int;
  _new_tier rank_tier;
  _trust int;
begin
  -- Recalculate Total Points
  select coalesce(sum(points), 0) into _total_points
  from rank_events
  where driver_id = NEW.driver_id;

  -- Recalculate Trust
  if NEW.event_type in ('CERT_VERIFIED', 'INSURANCE_VERIFIED') then
    _trust := calculate_trust_score(NEW.driver_id);
  else
    -- Use existing trust or calc if missing
    select trust_score into _trust from driver_ranks where driver_id = NEW.driver_id;
    if _trust is null then 
        _trust := calculate_trust_score(NEW.driver_id); 
    end if;
  end if;

  -- Determine Tier
  if _total_points < 500 then
    _new_tier := 'ROOKIE';
  elsif _total_points < 2000 then
    _new_tier := 'ROAD_READY';
  elsif _total_points < 5000 then
     _new_tier := 'ELITE';
  else
     _new_tier := 'LEGEND';
  end if;

  -- Upsert Rank Cache
  insert into driver_ranks (driver_id, current_points, current_tier, trust_score, last_updated_at)
  values (NEW.driver_id, _total_points, _new_tier, _trust, now())
  on conflict (driver_id) do update set
    current_points = EXCLUDED.current_points,
    current_tier = EXCLUDED.current_tier,
    trust_score = EXCLUDED.trust_score,
    last_updated_at = now();

  return NEW;
end;
$$;

drop trigger if exists tr_rank_update on rank_events;
create trigger tr_rank_update
after insert on rank_events
for each row execute function update_driver_rank();
