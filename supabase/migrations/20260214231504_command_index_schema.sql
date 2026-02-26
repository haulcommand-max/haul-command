-- 🏗️ HAUL COMMAND OS: LAYER 5 - COMMAND INDEX
-- The "Status Gravity". Gamified trust and reputation.

-- 1. COMMAND SCORES (The Live Scorecard)
-- Aggregates signals from all other layers into a single trust metric.
CREATE TABLE command_scores (
    identity_id UUID PRIMARY KEY REFERENCES identities(id) ON DELETE CASCADE,
    
    -- Total Score (0-1000)
    total_score INTEGER DEFAULT 0,
    
    -- The "Pentagon" Stats (0-100 each)
    safety_score INTEGER DEFAULT 0,      -- From Compliance Engine (violations)
    reliability_score INTEGER DEFAULT 0, -- From Hall Pay (disputes) & Dispatch (late arrivals)
    velocity_score INTEGER DEFAULT 0,    -- From Hall Pay (payment speed)
    volume_score INTEGER DEFAULT 0,      -- From Corridor Intel (miles driven)
    community_score INTEGER DEFAULT 0,   -- From Reviews/Endorsements
    
    -- Rank Calculation
    current_tier TEXT NOT NULL DEFAULT 'rookie' CHECK (current_tier IN ('rookie', 'pro', 'elite', 'command', 'legend')),
    percentile_rank NUMERIC(5, 2), -- "Top 1%"
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 2. LEADERBOARDS (The Competition)
-- Standardized views for ranking.
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name TEXT NOT NULL, -- 'Most Reliable - Florida', 'Fastest Payers - National'
    type TEXT NOT NULL CHECK (type IN ('global', 'regional', 'corridor', 'niche')),
    
    scope_jurisdiction_id UUID REFERENCES jurisdictions(id),
    scope_corridor_id UUID REFERENCES corridors(id),
    
    period TEXT NOT NULL CHECK (period IN ('all_time', 'annual', 'quarterly', 'monthly')),
    
    status TEXT DEFAULT 'active'
);


-- 3. LEADERBOARD ENTRIES (Snapshot of Fame)
-- Materialized pairings of Identity <-> Board.
CREATE TABLE leaderboard_entries (
    leaderboard_id UUID REFERENCES leaderboards(id) ON DELETE CASCADE,
    identity_id UUID REFERENCES identities(id),
    
    score_value INTEGER NOT NULL,
    rank_position INTEGER NOT NULL,
    
    period_start DATE,
    period_end DATE,
    
    UNIQUE(leaderboard_id, identity_id, period_start)
);


-- 4. ACHIEVEMENTS (Badges)
-- Awards for specific milestones.
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 'million_mile_club'
    
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    
    criteria_json JSONB, -- { "min_miles": 1000000 }
    
    points_value INTEGER DEFAULT 0
);


-- 5. UNLOCKED ACHIEVEMENTS
CREATE TABLE unlocked_achievements (
    identity_id UUID REFERENCES identities(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id),
    
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (identity_id, achievement_id)
);

-- RLS POLICIES
ALTER TABLE command_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocked_achievements ENABLE ROW LEVEL SECURITY;

-- Note: Scores are generally public (or tiered visibility).
