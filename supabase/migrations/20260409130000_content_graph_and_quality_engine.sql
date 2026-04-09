-- Haul Command Content OS: Content Graph + Quality Scoring + Staleness Queue
-- Extension to the core Content OS schema (20260409120000)

-- ==========================================
-- 1. THE CONTENT GRAPH (Anti-Orphan Engine)
-- ==========================================
-- Every page is a node. Every internal link is an edge.
-- The system can query: "Which nodes have zero inbound edges?" → orphans.

CREATE TABLE content_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_family TEXT NOT NULL, -- 'blog', 'regulation', 'tool', 'glossary', 'corridor', 'directory', 'resource'
    entity_id TEXT NOT NULL, -- slug or UUID of the actual entity
    entity_title TEXT NOT NULL,
    country_code TEXT,
    region_code TEXT,
    canonical_url TEXT NOT NULL,
    freshness_state content_freshness_state DEFAULT 'seeded_needs_review',
    confidence_state content_confidence_state DEFAULT 'seeded_needs_review',
    is_indexable BOOLEAN DEFAULT true,
    sponsor_eligible BOOLEAN DEFAULT true,
    has_monetization_block BOOLEAN DEFAULT false,
    inbound_link_count INTEGER DEFAULT 0,
    outbound_link_count INTEGER DEFAULT 0,
    quality_score NUMERIC(5,2) DEFAULT 0,
    last_scored_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(page_family, entity_id)
);

CREATE TABLE content_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_node_id UUID REFERENCES content_nodes(id) ON DELETE CASCADE,
    target_node_id UUID REFERENCES content_nodes(id) ON DELETE CASCADE,
    edge_type TEXT NOT NULL, -- 'support', 'sibling', 'parent', 'child', 'commercial', 'glossary_ref'
    anchor_text TEXT,
    rel_attribute TEXT, -- 'sponsored', 'ugc', null (standard dofollow)
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_node_id, target_node_id, edge_type)
);

-- Index for orphan detection (nodes with zero inbound)
CREATE INDEX idx_content_nodes_inbound ON content_nodes (inbound_link_count) WHERE inbound_link_count = 0;
CREATE INDEX idx_content_nodes_family ON content_nodes (page_family);
CREATE INDEX idx_content_edges_target ON content_edges (target_node_id);

-- ==========================================
-- 2. QUALITY SCORING ENGINE
-- ==========================================
CREATE TABLE content_quality_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID REFERENCES content_nodes(id) ON DELETE CASCADE,
    scored_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Category Scores (0-100)
    editorial_utility SMALLINT DEFAULT 0,
    support_link_density SMALLINT DEFAULT 0,
    geo_relevance SMALLINT DEFAULT 0,
    trust_source_clarity SMALLINT DEFAULT 0,
    commercial_routing SMALLINT DEFAULT 0,
    freshness SMALLINT DEFAULT 0,
    
    -- Computed total
    total_score NUMERIC(5,2) GENERATED ALWAYS AS (
        (editorial_utility + support_link_density + geo_relevance + trust_source_clarity + commercial_routing + freshness) / 6.0
    ) STORED,
    
    -- Flags
    has_quick_answer BOOLEAN DEFAULT false,
    has_trust_strip BOOLEAN DEFAULT false,
    has_intent_router BOOLEAN DEFAULT false,
    has_monetization_block BOOLEAN DEFAULT false,
    has_next_step_cta BOOLEAN DEFAULT false,
    is_dead_end BOOLEAN DEFAULT true, -- True = VIOLATION of no-dead-end law
    is_orphan BOOLEAN DEFAULT true, -- True = VIOLATION of no-orphan law
    
    -- Pass/Fail
    passes_crown_jewel_standard BOOLEAN GENERATED ALWAYS AS (
        (editorial_utility + support_link_density + geo_relevance + trust_source_clarity + commercial_routing + freshness) / 6.0 >= 75
        AND has_quick_answer = true
        AND is_dead_end = false
        AND is_orphan = false
    ) STORED
);

-- ==========================================
-- 3. STALENESS REVIEW QUEUE (Cron Target)
-- ==========================================
CREATE TABLE content_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID REFERENCES content_nodes(id) ON DELETE CASCADE,
    page_family TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    reason TEXT NOT NULL, -- 'review_due', 'low_quality_score', 'orphan_detected', 'dead_end_detected'
    priority TEXT NOT NULL DEFAULT 'normal', -- 'critical', 'high', 'normal', 'low'
    queued_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT -- 'human', 'ai_agent', 'auto_fix'
);

-- ==========================================
-- 4. ORPHAN DETECTION RPC
-- ==========================================
CREATE OR REPLACE FUNCTION detect_content_orphans()
RETURNS TABLE(node_id UUID, page_family TEXT, entity_title TEXT, canonical_url TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT cn.id, cn.page_family, cn.entity_title, cn.canonical_url
    FROM content_nodes cn
    WHERE cn.inbound_link_count = 0
      AND cn.is_indexable = true
    ORDER BY cn.page_family, cn.entity_title;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 5. DEAD-END DETECTION RPC
-- ==========================================
CREATE OR REPLACE FUNCTION detect_content_dead_ends()
RETURNS TABLE(node_id UUID, page_family TEXT, entity_title TEXT, canonical_url TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT cn.id, cn.page_family, cn.entity_title, cn.canonical_url
    FROM content_nodes cn
    WHERE cn.outbound_link_count = 0
      AND cn.is_indexable = true
    ORDER BY cn.page_family, cn.entity_title;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 6. STALENESS SCANNER (pg_cron target)
-- ==========================================
-- Run daily: SELECT queue_stale_content();
CREATE OR REPLACE FUNCTION queue_stale_content()
RETURNS INTEGER AS $$
DECLARE
    queued_count INTEGER := 0;
BEGIN
    -- Blog articles past review due
    INSERT INTO content_review_queue (node_id, page_family, entity_id, reason, priority)
    SELECT cn.id, 'blog', ba.slug, 'review_due', 'high'
    FROM blog_articles ba
    JOIN content_nodes cn ON cn.page_family = 'blog' AND cn.entity_id = ba.slug
    WHERE ba.next_review_due < NOW()
      AND NOT EXISTS (
          SELECT 1 FROM content_review_queue crq 
          WHERE crq.node_id = cn.id AND crq.resolved_at IS NULL
      );
    GET DIAGNOSTICS queued_count = ROW_COUNT;

    -- Regulation jurisdictions past review due
    INSERT INTO content_review_queue (node_id, page_family, entity_id, reason, priority)
    SELECT cn.id, 'regulation', rj.slug, 'review_due', 'critical'
    FROM reg_jurisdictions rj
    JOIN content_nodes cn ON cn.page_family = 'regulation' AND cn.entity_id = rj.slug
    WHERE rj.next_review_due < NOW()
      AND NOT EXISTS (
          SELECT 1 FROM content_review_queue crq 
          WHERE crq.node_id = cn.id AND crq.resolved_at IS NULL
      );

    -- Orphan detection pass
    INSERT INTO content_review_queue (node_id, page_family, entity_id, reason, priority)
    SELECT cn.id, cn.page_family, cn.entity_id, 'orphan_detected', 'high'
    FROM content_nodes cn
    WHERE cn.inbound_link_count = 0
      AND cn.is_indexable = true
      AND NOT EXISTS (
          SELECT 1 FROM content_review_queue crq 
          WHERE crq.node_id = cn.id AND crq.reason = 'orphan_detected' AND crq.resolved_at IS NULL
      );

    RETURN queued_count;
END;
$$ LANGUAGE plpgsql;
