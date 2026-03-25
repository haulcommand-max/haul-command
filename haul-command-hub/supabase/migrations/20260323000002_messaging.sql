-- ═══════════════════════════════════════════════════════════════
-- Haul Command Messaging & Notifications System
-- Tables: conversations, messages, notifications
-- ═══════════════════════════════════════════════════════════════

-- 1. Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_ids UUID[] NOT NULL,
  load_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  last_message_preview TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_conv_participants ON conversations USING GIN (participant_ids);
CREATE INDEX IF NOT EXISTS idx_conv_last_msg ON conversations (last_message_at DESC);

-- 2. Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','offer','system')),
  offer_data JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_msg_sender ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_msg_unread ON messages (conversation_id) WHERE read_at IS NULL;

-- 3. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  data JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications (user_id) WHERE read_at IS NULL;

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Conversations: users can read their own
CREATE POLICY "read_own_conversations" ON conversations
  FOR SELECT USING (auth.uid() = ANY(participant_ids));

-- Messages: users can read messages in their conversations
CREATE POLICY "read_own_messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND auth.uid() = ANY(c.participant_ids)
    )
  );

-- Messages: users can insert into their conversations
CREATE POLICY "insert_own_messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND auth.uid() = ANY(c.participant_ids)
    )
  );

-- Notifications: users can read their own
CREATE POLICY "read_own_notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Service role can do everything
CREATE POLICY "svc_conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "svc_messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "svc_notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- Realtime: enable for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
