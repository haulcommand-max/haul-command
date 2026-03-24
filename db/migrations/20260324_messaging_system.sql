-- ================================================================
-- MESSAGING SYSTEM MIGRATION
-- Conversations, Messages, Reactions, Notifications, Participants
-- ================================================================

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids UUID[] NOT NULL,
  load_id UUID REFERENCES loads(id) ON DELETE SET NULL,
  conversation_type TEXT NOT NULL DEFAULT 'direct'
    CHECK (conversation_type IN ('direct', 'load_offer', 'group', 'support')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN (participant_ids);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations (last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_load ON conversations (load_id) WHERE load_id IS NOT NULL;

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  message_type TEXT NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'offer', 'counter_offer', 'system', 'acceptance', 'decline', 'rate_change', 'load_attachment', 'location_share')),
  offer_data JSONB,
  read_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender_id, created_at);

-- Message reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id, emoji)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'system'
    CHECK (type IN (
      'new_message', 'load_offer', 'offer_accepted', 'offer_declined',
      'counter_offer', 'job_complete', 'payment_released', 'rank_change',
      'new_load_on_corridor', 'regulation_alert', 'profile_view', 'system'
    )),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  data JSONB DEFAULT '{}',
  action_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id) WHERE read_at IS NULL;

-- Conversation participants (per-participant settings)
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cp_user ON conversation_participants (user_id);

-- Listing claims table for claim system
CREATE TABLE IF NOT EXISTS listing_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  user_id UUID,
  claim_status TEXT NOT NULL DEFAULT 'unclaimed'
    CHECK (claim_status IN ('unclaimed', 'outreach_sent', 'pending_verification', 'verified', 'rejected')),
  outreach_step INTEGER DEFAULT 0,
  outreach_sent_at TIMESTAMPTZ[],
  claimed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  claim_token UUID UNIQUE DEFAULT gen_random_uuid(),
  source TEXT DEFAULT 'direct'
    CHECK (source IN ('email', 'sms', 'in_app', 'direct', 'qr_code')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_status ON listing_claims (claim_status, listing_id);
CREATE INDEX IF NOT EXISTS idx_claims_token ON listing_claims (claim_token);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

CREATE POLICY "Users can send messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own participant entries" ON conversation_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own participant entries" ON conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Enable Realtime for messaging
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
