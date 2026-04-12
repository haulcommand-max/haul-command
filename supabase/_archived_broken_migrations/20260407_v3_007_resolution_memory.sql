-- ============================================================================
-- HAUL COMMAND V3 — Migration Block 007: Resolution Memory
-- ============================================================================
-- Prerequisites: block 001 (enums), block 003 (hc_entities)
-- FK order: conversations → messages → summaries → action_items → clusters → followups → training
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. hc_conversations
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_type TEXT NOT NULL DEFAULT 'support'
                    CHECK (conversation_type IN ('support', 'dispatch', 'claim', 'dispute', 'onboarding', 'sales', 'internal')),
    channel_type    TEXT NOT NULL DEFAULT 'chat'
                    CHECK (channel_type IN ('chat', 'email', 'phone', 'sms', 'in_app', 'api')),
    subject         TEXT,
    status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'waiting', 'resolved', 'escalated', 'closed')),
    priority        TEXT NOT NULL DEFAULT 'normal'
                    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    participant_entities UUID[] NOT NULL DEFAULT '{}',
    assigned_to     UUID,                                        -- staff/agent entity
    country_code    TEXT,
    language_code   TEXT NOT NULL DEFAULT 'en',
    tags            TEXT[] NOT NULL DEFAULT '{}',
    metadata        JSONB NOT NULL DEFAULT '{}',
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcconv_status ON hc_conversations (status);
CREATE INDEX IF NOT EXISTS idx_hcconv_type ON hc_conversations (conversation_type);
CREATE INDEX IF NOT EXISTS idx_hcconv_participants ON hc_conversations USING gin (participant_entities);
CREATE INDEX IF NOT EXISTS idx_hcconv_assigned ON hc_conversations (assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hcconv_country ON hc_conversations (country_code) WHERE country_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hcconv_created ON hc_conversations (created_at DESC);

CREATE TRIGGER hc_conversations_updated_at BEFORE UPDATE ON hc_conversations
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. hc_conversation_messages
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_conversation_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES hc_conversations(id) ON DELETE CASCADE,
    sender_type     TEXT NOT NULL DEFAULT 'user'
                    CHECK (sender_type IN ('user', 'agent', 'system', 'bot')),
    sender_entity_id UUID,
    message_text    TEXT NOT NULL,
    message_type    TEXT NOT NULL DEFAULT 'text'
                    CHECK (message_type IN ('text', 'image', 'file', 'action', 'system_note')),
    attachments     JSONB NOT NULL DEFAULT '[]',
    -- AI analysis (populated async)
    intent_detected TEXT,
    sentiment       TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'frustrated')),
    entities_mentioned UUID[] NOT NULL DEFAULT '{}',
    is_internal     BOOLEAN NOT NULL DEFAULT false,              -- staff-only note
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hccm_conversation ON hc_conversation_messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_hccm_sender ON hc_conversation_messages (sender_entity_id) WHERE sender_entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hccm_intent ON hc_conversation_messages (intent_detected) WHERE intent_detected IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. hc_conversation_summaries
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_conversation_summaries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES hc_conversations(id) ON DELETE CASCADE,
    summary_text    TEXT NOT NULL,
    key_topics      TEXT[] NOT NULL DEFAULT '{}',
    resolution_type TEXT CHECK (resolution_type IN ('resolved', 'escalated', 'deferred', 'no_action')),
    next_steps      JSONB NOT NULL DEFAULT '[]',
    model_used      TEXT,
    tokens_used     INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hccs_conversation ON hc_conversation_summaries (conversation_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. hc_action_items — Tasks generated from conversations, workflows, observations
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_action_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type     TEXT NOT NULL,                               -- 'conversation', 'workflow', 'observation', 'manual'
    source_id       UUID,
    assigned_entity_id UUID REFERENCES hc_entities(id) ON DELETE SET NULL,
    action_type     TEXT NOT NULL,                               -- 'follow_up', 'verify_doc', 'send_packet', 'update_profile', 'escalate'
    title           TEXT NOT NULL,
    description     TEXT,
    priority        TEXT NOT NULL DEFAULT 'normal'
                    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'deferred')),
    due_at          TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcai_assigned ON hc_action_items (assigned_entity_id) WHERE assigned_entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hcai_status ON hc_action_items (status) WHERE status IN ('open', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_hcai_due ON hc_action_items (due_at) WHERE status IN ('open', 'in_progress') AND due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hcai_source ON hc_action_items (source_type, source_id);

CREATE TRIGGER hc_action_items_updated_at BEFORE UPDATE ON hc_action_items
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. hc_issue_clusters — Recurring issue pattern detection
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_issue_clusters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_key     TEXT NOT NULL UNIQUE,                        -- e.g. 'insurance_upload_failing_au'
    title           TEXT NOT NULL,
    description     TEXT,
    severity        TEXT NOT NULL DEFAULT 'medium'
                    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    affected_country_codes TEXT[] NOT NULL DEFAULT '{}',
    related_conversation_ids UUID[] NOT NULL DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'investigating', 'resolved', 'wont_fix')),
    resolution_notes TEXT,
    first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcic_status ON hc_issue_clusters (status);
CREATE INDEX IF NOT EXISTS idx_hcic_severity ON hc_issue_clusters (severity);
CREATE INDEX IF NOT EXISTS idx_hcic_countries ON hc_issue_clusters USING gin (affected_country_codes);

CREATE TRIGGER hc_issue_clusters_updated_at BEFORE UPDATE ON hc_issue_clusters
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. hc_followups — Scheduled follow-up actions
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_followups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_item_id  UUID REFERENCES hc_action_items(id) ON DELETE SET NULL,
    entity_id       UUID REFERENCES hc_entities(id) ON DELETE SET NULL,
    followup_type   TEXT NOT NULL DEFAULT 'reminder'
                    CHECK (followup_type IN ('reminder', 'check_in', 'escalation', 'nudge', 'verification')),
    channel         TEXT NOT NULL DEFAULT 'in_app'
                    CHECK (channel IN ('in_app', 'email', 'push', 'sms')),
    scheduled_at    TIMESTAMPTZ NOT NULL,
    executed_at     TIMESTAMPTZ,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')),
    message_template TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcfu_scheduled ON hc_followups (scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_hcfu_entity ON hc_followups (entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hcfu_status ON hc_followups (status);

CREATE TRIGGER hc_followups_updated_at BEFORE UPDATE ON hc_followups
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. hc_training_examples — AI training data from real conversations
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_training_examples (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES hc_conversations(id) ON DELETE SET NULL,
    summary_id      UUID REFERENCES hc_conversation_summaries(id) ON DELETE SET NULL,
    example_type    TEXT NOT NULL DEFAULT 'conversation'
                    CHECK (example_type IN ('conversation', 'resolution', 'escalation', 'classification', 'extraction')),
    input_text      TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    quality_rating  INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    reviewer_notes  TEXT,
    is_approved     BOOLEAN NOT NULL DEFAULT false,
    tags            TEXT[] NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hcte_type ON hc_training_examples (example_type);
CREATE INDEX IF NOT EXISTS idx_hcte_approved ON hc_training_examples (is_approved) WHERE is_approved = true;

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. RLS
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE hc_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_conversation_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_issue_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_training_examples ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY hc_conversations_service ON hc_conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_conversation_messages_service ON hc_conversation_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_conversation_summaries_service ON hc_conversation_summaries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_action_items_service ON hc_action_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_issue_clusters_service ON hc_issue_clusters FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_followups_service ON hc_followups FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hc_training_examples_service ON hc_training_examples FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Conversations: participant-only access
CREATE POLICY hc_conversations_participant_read ON hc_conversations FOR SELECT TO authenticated
    USING (
        auth.uid()::uuid = ANY(
            SELECT unnest(participant_entities)
            FROM hc_entities WHERE claimed_by = auth.uid()
        )
        OR auth.jwt() ->> 'role' IN ('moderator', 'admin')
    );

-- Action items: assigned-to-self
CREATE POLICY hc_action_items_self_read ON hc_action_items FOR SELECT TO authenticated
    USING (
        assigned_entity_id IN (
            SELECT id FROM hc_entities WHERE claimed_by = auth.uid()
        )
    );

-- Issue clusters / training: admin only
CREATE POLICY hc_issue_clusters_admin ON hc_issue_clusters FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY hc_training_examples_admin ON hc_training_examples FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');
