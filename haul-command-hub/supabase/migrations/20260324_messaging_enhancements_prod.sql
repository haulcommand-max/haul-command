-- ═══════════════════════════════════════════════════════════════
-- Haul Command — Messaging Enhancements Migration (Production)
-- Adapted to actual production schema discovered via db query
-- ═══════════════════════════════════════════════════════════════

-- 1. Expand hc_conversations (existing: conversation_id, convo_type, created_at, conversation_type)
ALTER TABLE hc_conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK (status IN ('active','archived','blocked'));
ALTER TABLE hc_conversations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. Expand hc_messages (existing: message_id, conversation_id, sender_identity_id, body, status, created_at)
--    Add type column using 'kind' to avoid conflicts
ALTER TABLE hc_messages ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'text'
  CHECK (kind IN ('text','offer','counter_offer','system','acceptance','decline','rate_change','load_attachment','location_share'));
ALTER TABLE hc_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE hc_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 3. Conversation Participants (per-participant mute/archive state)
CREATE TABLE IF NOT EXISTS hc_conversation_participants (
  conversation_id UUID NOT NULL REFERENCES hc_conversations(conversation_id) ON DELETE CASCADE,
  identity_id UUID NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  PRIMARY KEY (conversation_id, identity_id)
);

ALTER TABLE hc_conversation_participants ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_conversation_participants' AND policyname='read_own_participants') THEN
    CREATE POLICY "read_own_participants" ON hc_conversation_participants
      FOR SELECT USING (identity_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_conversation_participants' AND policyname='update_own_participants') THEN
    CREATE POLICY "update_own_participants" ON hc_conversation_participants
      FOR UPDATE USING (identity_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_conversation_participants' AND policyname='svc_participants') THEN
    CREATE POLICY "svc_participants" ON hc_conversation_participants FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. Message Reactions
CREATE TABLE IF NOT EXISTS hc_message_reactions (
  message_id UUID NOT NULL REFERENCES hc_messages(message_id) ON DELETE CASCADE,
  identity_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (message_id, identity_id, emoji)
);

ALTER TABLE hc_message_reactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_message_reactions' AND policyname='read_reactions') THEN
    CREATE POLICY "read_reactions" ON hc_message_reactions FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_message_reactions' AND policyname='manage_own_reactions') THEN
    CREATE POLICY "manage_own_reactions" ON hc_message_reactions
      FOR ALL USING (identity_id = auth.uid()) WITH CHECK (identity_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_message_reactions' AND policyname='svc_reactions') THEN
    CREATE POLICY "svc_reactions" ON hc_message_reactions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 5. Add action_url to hc_notifications
ALTER TABLE hc_notifications ADD COLUMN IF NOT EXISTS action_url TEXT;

-- 6. Listing Claims table (claim conversion engine)
CREATE TABLE IF NOT EXISTS listing_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID,
  identity_id UUID,
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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='listing_claims' AND policyname='read_own_claims') THEN
    CREATE POLICY "read_own_claims" ON listing_claims
      FOR SELECT USING (identity_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='listing_claims' AND policyname='svc_claims') THEN
    CREATE POLICY "svc_claims" ON listing_claims FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- NOTE: escrow_transactions already exists in production with a different schema.
-- Managed separately. Skipped here to avoid conflicts.


-- 8. Enable realtime for new tables (idempotent via DO block)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE hc_conversation_participants;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE hc_message_reactions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

