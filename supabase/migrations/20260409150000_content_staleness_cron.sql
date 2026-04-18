-- Haul Command: Content OS Staleness Cron Activation
-- Migration: 20260409150000_content_staleness_cron.sql
-- 
-- Adds staleness scanner, orphan detector, and quality review
-- to the existing pg_cron schedule.
--
-- DEPENDS ON:
--   20260409120000_content_os_schema.sql (blog_articles, reg_jurisdictions, tool_catalog)
--   20260409130000_content_graph_and_quality_engine.sql (queue_stale_content, detect_content_orphans)
--   20260220_pg_cron_schedules.sql (pg_cron extension already enabled)

-- ─────────────────────────────────────────────────────
-- CRON 1: Daily Staleness Scanner — 03:00 UTC
-- Queues articles/regulations past their next_review_due date.
-- ─────────────────────────────────────────────────────
SELECT cron.schedule(
    'content-staleness-scanner',
    '0 3 * * *',
    $$ SELECT queue_stale_content(); $$
);

-- ─────────────────────────────────────────────────────
-- CRON 2: Orphan Page Detector — Every 6 hours
-- Finds content_nodes with zero inbound links and queues for fix.
-- ─────────────────────────────────────────────────────
SELECT cron.schedule(
    'content-orphan-detector',
    '0 */6 * * *',
    $$
    INSERT INTO content_review_queue (node_id, page_family, entity_id, reason, priority)
    SELECT cn.id, cn.page_family, cn.entity_id, 'orphan_detected', 'high'
    FROM content_nodes cn
    WHERE cn.inbound_link_count = 0
      AND cn.is_indexable = true
      AND NOT EXISTS (
          SELECT 1 FROM content_review_queue crq 
          WHERE crq.node_id = cn.id AND crq.reason = 'orphan_detected' AND crq.resolved_at IS NULL
      );
    $$
);

-- ─────────────────────────────────────────────────────
-- CRON 3: Dead-End Page Detector — Every 6 hours
-- ─────────────────────────────────────────────────────
SELECT cron.schedule(
    'content-dead-end-detector',
    '30 */6 * * *',
    $$
    INSERT INTO content_review_queue (node_id, page_family, entity_id, reason, priority)
    SELECT cn.id, cn.page_family, cn.entity_id, 'dead_end_detected', 'high'
    FROM content_nodes cn
    WHERE cn.outbound_link_count = 0
      AND cn.is_indexable = true
      AND NOT EXISTS (
          SELECT 1 FROM content_review_queue crq 
          WHERE crq.node_id = cn.id AND crq.reason = 'dead_end_detected' AND crq.resolved_at IS NULL
      );
    $$
);

-- ─────────────────────────────────────────────────────
-- CRON 4: Blog Freshness Counter — Daily at 04:00 UTC
-- Promotes stable_reference articles to seeded_needs_review
-- if not touched in 90 days (forces editorial review cycle).
-- ─────────────────────────────────────────────────────
SELECT cron.schedule(
    'blog-freshness-counter',
    '0 4 * * *',
    $$
    UPDATE blog_articles
    SET freshness_state = 'seeded_needs_review',
        next_review_due = NOW()
    WHERE freshness_state = 'stable_reference'
      AND updated_at < NOW() - INTERVAL '90 days'
      AND next_review_due < NOW();
    $$
);

-- ─────────────────────────────────────────────────────
-- CRON 5: Regulation Freshness Counter — Daily at 04:30 UTC
-- Marks regulations urgent if source_authority changed or
-- not reviewed in 60 days.
-- ─────────────────────────────────────────────────────
SELECT cron.schedule(
    'regulation-freshness-counter',
    '30 4 * * *',
    $$
    UPDATE reg_jurisdictions
    SET freshness_state = 'seeded_needs_review',
        next_review_due = NOW()
    WHERE next_review_due < NOW()
      AND freshness_state != 'updated_recently';
    $$
);

-- ─────────────────────────────────────────────────────
-- CRON 6: Tool Count Sync — Daily at 05:00 UTC
-- Keeps a materialized count that the tools page hero reads,
-- eliminating the hardcoded "15 free tools" staleness risk.
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_platform_stats (
    key TEXT PRIMARY KEY,
    value BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial values
INSERT INTO content_platform_stats (key, value) VALUES
    ('tool_count', 15),
    ('verified_operator_count', 24164),
    ('active_corridor_count', 847),
    ('country_count', 120),
    ('blog_article_count', 5)
ON CONFLICT (key) DO NOTHING;

SELECT cron.schedule(
    'platform-stats-sync',
    '0 5 * * *',
    $$
    UPDATE content_platform_stats SET value = (
        SELECT COUNT(*) FROM tool_catalog WHERE is_active = true
    ), updated_at = NOW() WHERE key = 'tool_count';

    UPDATE content_platform_stats SET value = (
        SELECT COUNT(*) FROM profiles WHERE status = 'active'
    ), updated_at = NOW() WHERE key = 'verified_operator_count';

    UPDATE content_platform_stats SET value = (
        SELECT COUNT(*) FROM blog_articles WHERE published_at <= NOW()
    ), updated_at = NOW() WHERE key = 'blog_article_count';
    $$
);

-- RPC: Read canonical platform stats (used by TrustStrip and homepage)
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSONB AS $$
    SELECT jsonb_object_agg(key, value)
    FROM content_platform_stats;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
