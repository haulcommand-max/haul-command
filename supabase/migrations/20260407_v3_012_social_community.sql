-- ============================================================================
-- HAUL COMMAND V3 — Migration Block 012: Social & Community
-- ============================================================================
-- Prerequisites: block 003 (hc_entities)
-- FK order: threads → posts → best_answers → summaries → rep_events → translations → clusters
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. soc_threads
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS soc_threads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_type     TEXT NOT NULL DEFAULT 'discussion'
                    CHECK (thread_type IN ('question', 'discussion', 'announcement', 'tutorial', 'case_study', 'poll')),
    title           TEXT NOT NULL,
    slug            TEXT,
    -- Author
    author_entity_id UUID REFERENCES hc_entities(id) ON DELETE SET NULL,
    author_user_id  UUID,
    -- Categorization
    category        TEXT,
    country_code    TEXT,
    language_code   TEXT NOT NULL DEFAULT 'en',
    tags            TEXT[] NOT NULL DEFAULT '{}',
    -- Status
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('draft', 'active', 'locked', 'archived', 'removed')),
    is_pinned       BOOLEAN NOT NULL DEFAULT false,
    is_featured     BOOLEAN NOT NULL DEFAULT false,
    -- Metrics
    view_count      INTEGER NOT NULL DEFAULT 0,
    reply_count     INTEGER NOT NULL DEFAULT 0,
    upvote_count    INTEGER NOT NULL DEFAULT 0,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_soct_status ON soc_threads (status);
CREATE INDEX IF NOT EXISTS idx_soct_type ON soc_threads (thread_type);
CREATE INDEX IF NOT EXISTS idx_soct_category ON soc_threads (category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_soct_country ON soc_threads (country_code) WHERE country_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_soct_tags ON soc_threads USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_soct_activity ON soc_threads (last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_soct_slug ON soc_threads (slug) WHERE slug IS NOT NULL;

CREATE TRIGGER soc_threads_updated_at BEFORE UPDATE ON soc_threads
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. soc_posts
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS soc_posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id       UUID NOT NULL REFERENCES soc_threads(id) ON DELETE CASCADE,
    parent_post_id  UUID REFERENCES soc_posts(id) ON DELETE CASCADE,    -- for nested replies
    author_entity_id UUID REFERENCES hc_entities(id) ON DELETE SET NULL,
    author_user_id  UUID,
    post_text       TEXT NOT NULL,
    post_type       TEXT NOT NULL DEFAULT 'reply'
                    CHECK (post_type IN ('reply', 'answer', 'comment', 'moderation_note')),
    -- Metrics
    upvote_count    INTEGER NOT NULL DEFAULT 0,
    downvote_count  INTEGER NOT NULL DEFAULT 0,
    -- Moderation
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'hidden', 'removed', 'flagged')),
    moderation_reason TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_socp_thread ON soc_posts (thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_socp_parent ON soc_posts (parent_post_id) WHERE parent_post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_socp_author ON soc_posts (author_entity_id) WHERE author_entity_id IS NOT NULL;

CREATE TRIGGER soc_posts_updated_at BEFORE UPDATE ON soc_posts
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. soc_best_answers
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS soc_best_answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id       UUID NOT NULL REFERENCES soc_threads(id) ON DELETE CASCADE,
    post_id         UUID NOT NULL REFERENCES soc_posts(id) ON DELETE CASCADE,
    selected_by     UUID,                                       -- who marked it as best
    selected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (thread_id)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. soc_thread_summaries
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS soc_thread_summaries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id       UUID NOT NULL REFERENCES soc_threads(id) ON DELETE CASCADE,
    summary_text    TEXT NOT NULL,
    key_points      TEXT[] NOT NULL DEFAULT '{}',
    model_used      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_socts_thread ON soc_thread_summaries (thread_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. soc_reputation_events — Community reputation changes
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS soc_reputation_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id       UUID NOT NULL REFERENCES hc_entities(id) ON DELETE CASCADE,
    event_type      TEXT NOT NULL,                               -- 'upvote_received', 'best_answer', 'helpful_post', 'thread_featured'
    points          INTEGER NOT NULL DEFAULT 0,
    source_type     TEXT,                                        -- 'thread', 'post'
    source_id       UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_socre_entity ON soc_reputation_events (entity_id);
CREATE INDEX IF NOT EXISTS idx_socre_type ON soc_reputation_events (event_type);

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. soc_translation_variants
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS soc_translation_variants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type     TEXT NOT NULL CHECK (source_type IN ('thread', 'post')),
    source_id       UUID NOT NULL,
    target_language TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    translation_quality TEXT NOT NULL DEFAULT 'machine'
                    CHECK (translation_quality IN ('machine', 'human_reviewed', 'community')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (source_type, source_id, target_language)
);

CREATE INDEX IF NOT EXISTS idx_soctv_source ON soc_translation_variants (source_type, source_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. soc_topic_clusters — Auto-detected topic groupings
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS soc_topic_clusters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_key     TEXT NOT NULL UNIQUE,
    title           TEXT NOT NULL,
    description     TEXT,
    thread_count    INTEGER NOT NULL DEFAULT 0,
    related_term_ids UUID[] NOT NULL DEFAULT '{}',              -- glo_terms references
    is_trending     BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER soc_topic_clusters_updated_at BEFORE UPDATE ON soc_topic_clusters
    FOR EACH ROW EXECUTE FUNCTION hc_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. RLS
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE soc_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc_best_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc_thread_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc_reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc_translation_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc_topic_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY soc_threads_service ON soc_threads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY soc_posts_service ON soc_posts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY soc_best_answers_service ON soc_best_answers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY soc_thread_summaries_service ON soc_thread_summaries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY soc_reputation_events_service ON soc_reputation_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY soc_translation_variants_service ON soc_translation_variants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY soc_topic_clusters_service ON soc_topic_clusters FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public: read active threads and posts
CREATE POLICY soc_threads_public ON soc_threads FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY soc_posts_public ON soc_posts FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY soc_best_answers_public ON soc_best_answers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY soc_thread_summaries_public ON soc_thread_summaries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY soc_topic_clusters_public ON soc_topic_clusters FOR SELECT TO anon, authenticated USING (true);

-- Authenticated: create threads and posts
CREATE POLICY soc_threads_auth_insert ON soc_threads FOR INSERT TO authenticated
    WITH CHECK (true);
CREATE POLICY soc_posts_auth_insert ON soc_posts FOR INSERT TO authenticated
    WITH CHECK (true);

-- Owner: edit own posts
CREATE POLICY soc_posts_owner_update ON soc_posts FOR UPDATE TO authenticated
    USING (author_user_id = auth.uid());

-- Moderator: moderate
CREATE POLICY soc_threads_mod ON soc_threads FOR UPDATE TO authenticated
    USING (auth.jwt() ->> 'role' IN ('moderator', 'admin'));
CREATE POLICY soc_posts_mod ON soc_posts FOR UPDATE TO authenticated
    USING (auth.jwt() ->> 'role' IN ('moderator', 'admin'));
