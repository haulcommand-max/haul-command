-- 🛡️ MODULE E: EVIDENCE ENGINE (The "Defense Packet")
-- Directive: "Build the Chain of Custody. Immutable Proof."

-- 1. Evidence Timeline (The Ledger)
CREATE TABLE IF NOT EXISTS evidence_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL, -- References the active job (Lead/Booking)
  actor_id UUID REFERENCES auth.users(id), -- Who created this evidence
  event_type TEXT NOT NULL, -- HANDSHAKE, CHECKLIST, PHOTO, LOCATION, HAZARD
  ts_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lat NUMERIC,
  lng NUMERIC,
  payload_hash TEXT NOT NULL, -- SHA256 of the content/file
  payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- Metadata (e.g. { "photo_url": "...", "checklist_items": [...] })
  device_id TEXT,
  app_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_job ON evidence_timeline(job_id, ts_utc);

-- 2. Strict State Gates (Risk Logic)
CREATE TABLE IF NOT EXISTS strict_state_gates (
  state_code TEXT PRIMARY KEY, -- 'NY', 'WA', etc.
  tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 3), -- 1=Hard Gate, 2=Paperwork Trap, 3=Normal
  scrutiny_score NUMERIC NOT NULL DEFAULT 1.0, -- Risk Multiplier
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Strict States
INSERT INTO strict_state_gates (state_code, tier, scrutiny_score, notes) VALUES
('NY', 1, 1.5, 'Non-reciprocal certs, equipment quirks'),
('WA', 1, 1.4, 'Cert enforcement, mountain passes'),
('FL', 1, 1.4, 'Equipment specifics, enforcement culture'),
('UT', 1, 1.3, 'POE inspections, gear gaps'),
('CO', 1, 1.3, 'Mountain corridors, weather'),
('LA', 2, 1.2, 'Permit/Insurance strictness'),
('NV', 2, 1.2, 'Permit traps'),
('PA', 2, 1.2, 'Tight corridors'),
('NC', 2, 1.2, 'Cert enforcement'),
('AZ', 2, 1.1, 'Corridor specific')
ON CONFLICT (state_code) DO UPDATE SET
  tier = EXCLUDED.tier,
  scrutiny_score = EXCLUDED.scrutiny_score;

-- 3. RLS
ALTER TABLE evidence_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE strict_state_gates ENABLE ROW LEVEL SECURITY;

-- Evidence: Only Participants in the Job can Read. Only Creator can Insert. (Simplified for now)
CREATE POLICY "Creator Insert Evidence" ON evidence_timeline
  FOR INSERT WITH CHECK (auth.uid() = actor_id);

CREATE POLICY "Participants Read Evidence" ON evidence_timeline
  FOR SELECT USING (
    auth.uid() = actor_id 
    OR auth.role() = 'service_role'
    -- In real app, join with 'bookings' table to check participation
  );

CREATE POLICY "Public Read Strict States" ON strict_state_gates
  FOR SELECT USING (true);
