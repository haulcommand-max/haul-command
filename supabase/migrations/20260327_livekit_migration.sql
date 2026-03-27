-- ══════════════════════════════════════════════════════════════════
-- LIVEKIT MIGRATION: VAPI → LiveKit
-- Renames VAPI tables, creates LiveKit equivalents
-- Review gating + GBP optimization tables
-- ══════════════════════════════════════════════════════════════════

-- 1. LiveKit call ledger (replaces vapi_call_ledger)
CREATE TABLE IF NOT EXISTS livekit_call_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL, -- 'place' | 'operator'
  country_code TEXT NOT NULL DEFAULT 'US',
  room_name TEXT,
  persona TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  stt_engine TEXT NOT NULL DEFAULT 'deepgram',
  llm_engine TEXT NOT NULL DEFAULT 'gemini-2.5-pro',
  tts_engine TEXT NOT NULL DEFAULT 'elevenlabs',
  call_duration_seconds INTEGER,
  outcome TEXT, -- 'claimed' | 'callback' | 'rejected' | 'opt_out' | 'no_answer' | 'voicemail'
  offer_type TEXT, -- 'free_claim' | 'verified_claim' | 'premium_placement' | 'adgrid_boost'
  offer_accepted BOOLEAN DEFAULT FALSE,
  transcript TEXT,
  recording_url TEXT,
  recording_consent BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lk_ledger_entity ON livekit_call_ledger(entity_id);
CREATE INDEX idx_lk_ledger_country ON livekit_call_ledger(country_code);
CREATE INDEX idx_lk_ledger_outcome ON livekit_call_ledger(outcome);

-- 2. LiveKit offer log (replaces vapi_offer_log)
CREATE TABLE IF NOT EXISTS livekit_offer_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'US',
  offer_type TEXT NOT NULL,
  offer_tier INTEGER NOT NULL DEFAULT 1,
  outcome TEXT NOT NULL, -- 'accepted' | 'rejected' | 'callback' | 'opt_out'
  cooldown_until TIMESTAMPTZ,
  call_id UUID REFERENCES livekit_call_ledger(id),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lk_offer_entity ON livekit_offer_log(entity_id);
CREATE INDEX idx_lk_offer_cooldown ON livekit_offer_log(cooldown_until);

-- 3. LiveKit dial queue (replaces vapi_dial_queue)
CREATE TABLE IF NOT EXISTS livekit_dial_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'US',
  persona TEXT NOT NULL DEFAULT 'place_claim_assist',
  priority_score NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued', -- queued | dialing | completed | failed
  room_name TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dialed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lk_queue_status ON livekit_dial_queue(status, priority_score DESC);
CREATE INDEX idx_lk_queue_country ON livekit_dial_queue(country_code);

-- 4. Outbound DNC list (global, 57-country)
CREATE TABLE IF NOT EXISTS outbound_dnc_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  entity_id UUID,
  country_code TEXT NOT NULL DEFAULT 'US',
  opted_out_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'voice_call', -- voice_call | sms | email | web
  UNIQUE(phone)
);

CREATE INDEX idx_dnc_phone ON outbound_dnc_list(phone);

-- 5. LiveKit outbound eligibility (replaces vapi_outbound_eligibility)
CREATE TABLE IF NOT EXISTS livekit_outbound_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL UNIQUE,
  entity_type TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'US',
  eligibility_score NUMERIC NOT NULL DEFAULT 0,
  traffic_proof_met BOOLEAN DEFAULT FALSE,
  last_contact_at TIMESTAMPTZ,
  next_eligible_at TIMESTAMPTZ,
  total_attempts INTEGER DEFAULT 0,
  total_successes INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Review gating / feedback prompts
CREATE TABLE IF NOT EXISTS feedback_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  milestone_type TEXT NOT NULL,
  routed_to TEXT NOT NULL CHECK (routed_to IN ('google_review', 'support_inbox', 'nps_survey')),
  prompted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_user ON feedback_prompts(user_id);
CREATE INDEX idx_feedback_routed ON feedback_prompts(routed_to);

-- 7. Compliance events (global)
CREATE TABLE IF NOT EXISTS compliance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'opt_out' | 'hostile_opt_out' | 'recording_refused' | 'gdpr_erasure'
  entity_id UUID,
  country_code TEXT NOT NULL DEFAULT 'US',
  channel TEXT, -- 'voice' | 'sms' | 'email'
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_country ON compliance_events(country_code);
CREATE INDEX idx_compliance_type ON compliance_events(event_type);

-- Enable RLS on all new tables
ALTER TABLE livekit_call_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE livekit_offer_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE livekit_dial_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_dnc_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE livekit_outbound_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_events ENABLE ROW LEVEL SECURITY;

-- Service role policies (admin/cron access)
CREATE POLICY "Service role full access" ON livekit_call_ledger FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON livekit_offer_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON livekit_dial_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON outbound_dnc_list FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON livekit_outbound_eligibility FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON compliance_events FOR ALL USING (true) WITH CHECK (true);

-- User can view own feedback
CREATE POLICY "Users view own feedback" ON feedback_prompts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own feedback" ON feedback_prompts FOR INSERT WITH CHECK (auth.uid() = user_id);
