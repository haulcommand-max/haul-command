-- ============================================================
-- Haul Command — Leaderboard + Reviews + Rankings System
-- Run in Supabase SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ─── Leaderboard Entries ──────────────────────────────────────
create table if not exists leaderboard_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  category text not null default 'driver', -- driver | broker | escort | service
  country text not null default 'US',
  region text,
  corridor text,
  score float default 0,
  rank int,
  nickname text,
  tier text,
  wins int default 0,
  streak int default 0,
  performance_score float default 50,
  review_avg float default 3.0,
  post_count int default 0,
  response_speed_score float default 50,
  ad_boost float default 0,
  period_type text not null default 'all_time', -- weekly | monthly | all_time
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_lb_country on leaderboard_entries(country);
create index if not exists idx_lb_category on leaderboard_entries(category);
create index if not exists idx_lb_score on leaderboard_entries(score desc);
create index if not exists idx_lb_user on leaderboard_entries(user_id);

-- ─── Reviews ──────────────────────────────────────────────────
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  reviewer_id uuid not null,
  target_user_id uuid not null,
  load_id uuid,
  rating float check (rating >= 1 and rating <= 5),
  review_text text,
  verified boolean default false,
  weight float default 1,
  created_at timestamptz default now()
);

create index if not exists idx_reviews_target on reviews(target_user_id);

-- ─── Report Cards ─────────────────────────────────────────────
create table if not exists report_cards (
  user_id uuid primary key,
  on_time_score float default 0,
  completion_rate float default 0,
  response_speed_score float default 0,
  rate_performance_score float default 0,
  fraud_flags int default 0,
  overall_score float default 0,
  updated_at timestamptz default now()
);

-- ─── Leaderboard Periods ──────────────────────────────────────
create table if not exists leaderboard_periods (
  id uuid primary key default uuid_generate_v4(),
  type text not null, -- weekly | monthly
  country text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  is_active boolean default true
);

-- ─── Badges ───────────────────────────────────────────────────
create table if not exists badges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  badge_type text,
  label text,
  region text,
  earned_at timestamptz default now(),
  expires_at timestamptz
);

create index if not exists idx_badges_user on badges(user_id);

-- ─── Corridor Alerts (Weather + DOT) ─────────────────────────
create table if not exists corridor_alerts (
  id uuid primary key default uuid_generate_v4(),
  corridor_id text,
  corridor_name text,
  alert_type text not null, -- weather | curfew | shutdown | construction
  severity text default 'medium', -- low | medium | high
  message text not null,
  start_time timestamptz,
  end_time timestamptz,
  source_url text,
  lat float,
  lon float,
  country_code text default 'US',
  created_at timestamptz default now()
);

create index if not exists idx_corridor_alerts_type on corridor_alerts(alert_type);

-- ─── Operator Runs (Earnings Tracker) ─────────────────────────
create table if not exists operator_runs (
  id uuid primary key default uuid_generate_v4(),
  operator_id uuid not null,
  corridor_id text,
  corridor_name text,
  date date not null,
  load_type text,
  gross_rate float not null,
  miles float,
  hours float,
  fuel_cost float,
  tolls float default 0,
  net_profit float,
  profit_per_hour float,
  profit_per_mile float,
  country_code text default 'US',
  load_id uuid,
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_op_runs_operator on operator_runs(operator_id);
create index if not exists idx_op_runs_date on operator_runs(date desc);

-- ─── Ad Slots (AdGrid Engine) ─────────────────────────────────
create table if not exists ad_slots (
  id uuid primary key default uuid_generate_v4(),
  country text,
  region text,
  corridor text,
  category text,
  slot_type text, -- leaderboard | inline | banner | map
  base_price float default 5.0,
  min_bid float default 1.0,
  created_at timestamptz default now()
);

-- ─── Ad Bids ──────────────────────────────────────────────────
create table if not exists ad_bids (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  slot_id uuid references ad_slots(id),
  bid_amount float,
  daily_budget float,
  active boolean default true,
  created_at timestamptz default now()
);

-- ─── Ad Impressions ───────────────────────────────────────────
create table if not exists ad_impressions (
  id uuid primary key default uuid_generate_v4(),
  ad_id uuid,
  user_id uuid,
  clicked boolean default false,
  created_at timestamptz default now()
);

-- ─── Queue Jobs (Lightweight Job Queue) ───────────────────────
create table if not exists queue_jobs (
  id uuid primary key default uuid_generate_v4(),
  type text not null, -- ingestion | normalize | match | negotiate | notify
  payload jsonb,
  status text default 'pending', -- pending | processing | done | failed
  priority int default 5,
  attempts int default 0,
  max_attempts int default 3,
  result jsonb,
  error text,
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists idx_queue_status on queue_jobs(status, priority desc);

-- ─── Waitlist Signups ─────────────────────────────────────────
create table if not exists waitlist_signups (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  country_code text,
  role text, -- operator | broker | both
  source text, -- homepage | country_page | tools
  created_at timestamptz default now()
);

create index if not exists idx_waitlist_email on waitlist_signups(email);

-- ─── Auto-update timestamp trigger ───────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_leaderboard_updated_at on leaderboard_entries;
create trigger update_leaderboard_updated_at
before update on leaderboard_entries
for each row
execute function update_updated_at();

drop trigger if exists update_report_card_updated_at on report_cards;
create trigger update_report_card_updated_at
before update on report_cards
for each row
execute function update_updated_at();

-- ─── RLS Policies ─────────────────────────────────────────────
alter table leaderboard_entries enable row level security;
alter table reviews enable row level security;
alter table report_cards enable row level security;
alter table badges enable row level security;
alter table corridor_alerts enable row level security;
alter table operator_runs enable row level security;
alter table waitlist_signups enable row level security;

-- Public read for leaderboard, reviews, badges, alerts
create policy "Public read leaderboard" on leaderboard_entries for select using (true);
create policy "Public read reviews" on reviews for select using (true);
create policy "Public read badges" on badges for select using (true);
create policy "Public read corridor alerts" on corridor_alerts for select using (true);

-- Users can insert reviews
create policy "Users insert reviews" on reviews for insert with check (auth.uid() = reviewer_id);

-- Users can manage own runs
create policy "Users read own runs" on operator_runs for select using (auth.uid() = operator_id);
create policy "Users insert own runs" on operator_runs for insert with check (auth.uid() = operator_id);

-- Service role for report cards and leaderboard updates
create policy "Service role report cards" on report_cards for all using (auth.role() = 'service_role');

-- Waitlist is insert-only for anon
create policy "Anyone can signup waitlist" on waitlist_signups for insert with check (true);
