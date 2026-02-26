-- Reputation & Crowdsourced Feedback Schema
-- Supporting "Waze-style" reporting for drivers and brokers

CREATE TABLE reputation_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL, -- 'doesn-t-pay', 'late-payer', 'old-gear', 'professional', 'fast-pay'
    display_name TEXT NOT NULL,
    category TEXT CHECK (category IN ('payment', 'equipment', 'behavior', 'professionalism')),
    icon TEXT
);

CREATE TABLE user_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES identities(id) NOT NULL,
    subject_id UUID REFERENCES identities(id) NOT NULL, -- Can be a broker or a driver
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES identities(id),
    
    -- Reputation weight based on reporter's own trust score
    reporter_trust_weight FLOAT DEFAULT 1.0, 
    
    UNIQUE(reporter_id, subject_id) -- Only one feedback per pair
);

CREATE TABLE user_note_tags (
    note_id UUID REFERENCES user_notes(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES reputation_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);

-- Seed initial tags
INSERT INTO reputation_tags (name, display_name, category, icon) VALUES
('doesnt-pay', 'Doesn''t Pay', 'payment', '❌'),
('late-payer', 'Pays Late', 'payment', '⏰'),
('bad-gear', 'Bad/Old Gear', 'equipment', '⚠️'),
('unprofessional', 'Unprofessional', 'behavior', '🤐'),
('fast-pay', 'Fast Pay', 'payment', '⚡'),
('pro-equipment', 'Top Tier Gear', 'equipment', '✨'),
('great-comm', 'Clearly Communicates', 'behavior', '📡')
ON CONFLICT (name) DO NOTHING;

-- Views for calculating aggregated reputation
CREATE VIEW subject_reputation_summary AS
SELECT 
    subject_id,
    COUNT(id) as total_notes,
    ARRAY_AGG(DISTINCT rt.display_name) as tags,
    AVG(reporter_trust_weight) as average_trust_score
FROM user_notes un
JOIN user_note_tags unt ON un.id = unt.note_id
JOIN reputation_tags rt ON unt.tag_id = rt.id
GROUP BY subject_id;
