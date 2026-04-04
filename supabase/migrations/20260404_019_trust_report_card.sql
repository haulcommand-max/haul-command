-- Haul Command — Trust & Report Card Schema
-- Migration: 20260404_019_trust_report_card.sql
begin;

drop type if exists public.hc_trust_badge cascade;
create type public.hc_trust_badge as enum(
  'identity_verified','insurance_verified','license_verified',
  'background_check','safety_record','route_completed',
  'peer_endorsed','long_standing','rapid_responder'
);

create table if not exists public.hc_trust_profiles (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid unique not null references auth.users(id) on delete cascade,
  listing_slug     text,

  -- Composite score 0–100 (computed)
  trust_score      int not null default 0 check(trust_score between 0 and 100),

  -- Sub-scores
  identity_score   int default 0 check(identity_score between 0 and 100),
  compliance_score int default 0 check(compliance_score between 0 and 100),
  activity_score   int default 0 check(activity_score between 0 and 100),
  proof_score      int default 0 check(proof_score between 0 and 100),
  review_score     int default 0 check(review_score between 0 and 100),

  -- Verification flags
  identity_verified   boolean default false,
  insurance_verified  boolean default false,
  license_verified    boolean default false,
  background_checked  boolean default false,
  claimed             boolean default false,

  -- Activity signals (truth-first: only real data)
  verified_jobs_count int default 0,
  verified_km_total   numeric(12,2) default 0,
  active_since        date,
  last_active_at      timestamptz,
  avg_response_min    int,            -- null until measured

  -- Review aggregate
  review_count        int default 0,
  review_avg          numeric(3,2) default null,

  -- Badges earned
  badges              public.hc_trust_badge[] default '{}',

  -- Freshness
  score_computed_at   timestamptz default now(),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index if not exists idx_trust_profiles_score
  on public.hc_trust_profiles(trust_score desc);
create index if not exists idx_trust_profiles_slug
  on public.hc_trust_profiles(listing_slug);

alter table public.hc_trust_profiles enable row level security;
create policy "Public read trust profiles" on public.hc_trust_profiles
  for select using (true);
create policy "Users manage own trust profile" on public.hc_trust_profiles
  for update using (auth.uid() = user_id);
create policy "Service role full access trust" on public.hc_trust_profiles
  for all using (auth.role() = 'service_role');

-- Trust score compute function
create or replace function public.hc_compute_trust_score(p_user_id uuid)
returns int language plpgsql as $$
declare
  v_rec public.hc_trust_profiles%rowtype;
  v_score int := 0;
begin
  select * into v_rec from public.hc_trust_profiles where user_id = p_user_id;
  if not found then return 0; end if;

  -- Identity (max 25)
  if v_rec.identity_verified  then v_score := v_score + 15; end if;
  if v_rec.license_verified   then v_score := v_score + 10; end if;
  -- Compliance (max 20)
  if v_rec.insurance_verified then v_score := v_score + 12; end if;
  if v_rec.background_checked then v_score := v_score + 8;  end if;
  -- Activity (max 25)
  v_score := v_score + least(25, (v_rec.verified_jobs_count / 5));
  -- Reviews (max 20)
  if v_rec.review_count > 0 then
    v_score := v_score + least(20, round((v_rec.review_avg / 5.0) * 20)::int);
  end if;
  -- Claimed (max 10)
  if v_rec.claimed then v_score := v_score + 10; end if;

  -- Update record
  update public.hc_trust_profiles
    set trust_score = v_score, score_computed_at = now(), updated_at = now()
  where user_id = p_user_id;

  return v_score;
end;
$$;

commit;
