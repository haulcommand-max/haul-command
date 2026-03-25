-- ═══════════════════════════════════════════════════════════════
-- Haul Command — Messaging Enhancements Migration
-- Adds: conversation_participants, message_reactions,
--        status/type columns, listing_claims table
-- ═══════════════════════════════════════════════════════════════

-- 1. Add missing columns to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS conversation_type TEXT DEFAULT 'direct'
  CHECK (conversation_type IN ('direct','load_offer','group','support'));
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK (status IN ('active','archived','blocked'));
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. Expand message_type enum
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN (
    'text','offer','counter_offer','system','acceptance','decline',
    'rate_change','load_attachment','location_share'
  ));

-- 3. Add missing columns to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 4. Conversation Participants (per-participant settings)
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_own_participants" ON conversation_participants
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "update_own_participants" ON conversation_participants
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "svc_participants" ON conversation_participants FOR ALL USING (true) WITH CHECK (true);

-- 5. Message Reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_reactions" ON message_reactions FOR SELECT USING (true);
CREATE POLICY "manage_own_reactions" ON message_reactions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "svc_reactions" ON message_reactions FOR ALL USING (true) WITH CHECK (true);

-- 6. Add action_url to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;

-- 7. Listing Claims table (for claim conversion engine)
CREATE TABLE IF NOT EXISTS listing_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID,
  user_id UUID,
  claim_status TEXT DEFAULT 'unclaimed'
    CHECK (claim_status IN ('unclaimed','outreach_sent','pending_verification','verified','rejected')),
  outreach_step INTEGER DEFAULT 0,
  outreach_sent_at TIMESTAMPTZ[],
  claimed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  claim_token UUID DEFAULT gen_random_uuid() UNIQUE,
  source TEXT DEFAULT 'direct'
    CHECK (source IN ('email','sms','in_app','direct','qr_code')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claims_status ON listing_claims (claim_status, listing_id);
CREATE INDEX IF NOT EXISTS idx_claims_token ON listing_claims (claim_token);

ALTER TABLE listing_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_own_claims" ON listing_claims
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "svc_claims" ON listing_claims FOR ALL USING (true) WITH CHECK (true);

-- 8. Escrow transactions table (if not exists)
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  load_id TEXT,
  conversation_id UUID REFERENCES conversations(id),
  payer_id UUID NOT NULL,
  payee_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'funded'
    CHECK (status IN ('pending','funded','released','disputed','refunded','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  released_at TIMESTAMPTZ,
  disputed_at TIMESTAMPTZ
);

ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_own_escrow" ON escrow_transactions
  FOR SELECT USING (payer_id = auth.uid() OR payee_id = auth.uid());
CREATE POLICY "svc_escrow" ON escrow_transactions FOR ALL USING (true) WITH CHECK (true);

-- 9. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
