
-- ==============================================================================
-- HAUL COMMAND - REPUTATION & GAMIFICATION SCHEMA
-- Module: COMMAND SCORE + POINTS LEDGER + RANKS
-- ==============================================================================

-- 1. Reputation & Ranks Table
-- Stores the current standing of every provider
create table if not exists provider_reputation (
    provider_id uuid references providers(id) on delete cascade primary key,
    
    -- Scores
    command_score_base integer default 0,
    command_score_final integer default 0, -- After multipliers
    
    -- Multipliers
    streak_multiplier numeric(3, 2) default 1.00,
    durability_multiplier numeric(3, 2) default 1.00,
    
    -- Counters (Denormalized for speed)
    total_safe_jobs integer default 0,
    total_points_lifetime bigint default 0,
    current_streak_days integer default 0,
    
    -- Rank
    current_rank_tier varchar(50) default 'Yard Walker',
    rank_updated_at timestamptz default now(),
    
    -- Meta
    updated_at timestamptz default now()
);

-- 2. Points Ledger (The Economy)
-- Immutable record of every point earned or lost
create table if not exists provider_points_ledger (
    id uuid primary key default uuid_generate_v4(),
    provider_id uuid references providers(id) on delete cascade,
    
    event_type varchar(50) not null, -- safe_job, referral, violation, store_buy
    points_delta integer not null, -- Can be negative
    
    reason text, -- "Completed Job #1234 without incident"
    reference_id text, -- ID of the job, referral, or dispute
    
    created_at timestamptz default now()
);

-- 3. Rank Definitions (Static Config)
create table if not exists rank_tiers (
    tier_name varchar(50) primary key,
    min_points integer not null,
    max_points integer, -- Null for top tier
    match_boost_bonus integer default 0,
    icon_url text
);

-- Seed Ranks
insert into rank_tiers (tier_name, min_points, max_points, match_boost_bonus) values
('Yard Walker', 0, 500, 0),
('Flag Rookie', 501, 2000, 0),
('Lane Guard', 2001, 5000, 1),
('Corridor Operator', 5001, 10000, 2),
('Route Commander', 10001, 25000, 3),
('Corridor Captain', 25001, 50000, 5),
('State Dominator', 50001, 100000, 8),
('National Operator', 100001, 250000, 12),
('Freight Titan', 250001, 500000, 15),
('Haul Command Vanguard', 500001, null, 20)
on conflict (tier_name) do nothing;

-- 4. Reputation Triggers
-- Simple function to update current_points when ledger entry is added
create or replace function update_provider_points_cache()
returns trigger as $$
begin
    update provider_reputation
    set 
        total_points_lifetime = total_points_lifetime + new.points_delta,
        updated_at = now()
    where provider_id = new.provider_id;
    return new;
end;
$$ language plpgsql security definer;

create trigger on_point_entry
after insert on provider_points_ledger
for each row execute procedure update_provider_points_cache();
