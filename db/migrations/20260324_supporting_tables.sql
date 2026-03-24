-- Add market intelligence reports table (used by /api/admin/corridor-mega-analysis)
CREATE TABLE IF NOT EXISTS market_intelligence_reports (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz DEFAULT now(),
    report_type     text NOT NULL,
    corridor_state  text DEFAULT 'ALL',
    listing_count   int,
    load_count      int,
    report_content  text,
    model           text,
    input_tokens    int,
    output_tokens   int,
    cost_cents      numeric(10, 4),
    generated_at    timestamptz,
    UNIQUE(report_type, corridor_state)
);

CREATE INDEX IF NOT EXISTS idx_market_reports_type ON market_intelligence_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_market_reports_generated ON market_intelligence_reports(generated_at DESC);

ALTER TABLE market_intelligence_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_only_mkt" ON market_intelligence_reports USING (auth.role() = 'service_role');

-- Email sequence enrollments (AI-personalized cron v2)
CREATE TABLE IF NOT EXISTS email_sequence_enrollments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz DEFAULT now(),
    email           text NOT NULL,
    sequence_id     text NOT NULL,
    user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    trigger_event   text DEFAULT 'manual',
    context         jsonb DEFAULT '{}',
    current_step    int DEFAULT 0,
    enrolled_at     timestamptz DEFAULT now(),
    last_sent_at    timestamptz,
    completed       boolean DEFAULT false,
    unsubscribed    boolean DEFAULT false,
    UNIQUE(email, sequence_id)
);

CREATE INDEX IF NOT EXISTS idx_email_seq_email ON email_sequence_enrollments(email);
CREATE INDEX IF NOT EXISTS idx_email_seq_sequence ON email_sequence_enrollments(sequence_id);
CREATE INDEX IF NOT EXISTS idx_email_seq_active ON email_sequence_enrollments(completed, unsubscribed);

ALTER TABLE email_sequence_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_email_seq" ON email_sequence_enrollments USING (auth.role() = 'service_role');
CREATE POLICY "own_unsubscribe" ON email_sequence_enrollments
    FOR UPDATE USING (user_id = auth.uid());

-- blog_posts table (created by content engine)
CREATE TABLE IF NOT EXISTS blog_posts (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    slug            text NOT NULL UNIQUE,
    title           text NOT NULL,
    content_html    text,
    meta_description text,
    target_keyword  text,
    country_code    text,
    published       boolean DEFAULT false,
    published_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_keyword ON blog_posts(target_keyword);

-- content_topics table (feed for content engine)
CREATE TABLE IF NOT EXISTS content_topics (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz DEFAULT now(),
    topic           text NOT NULL,
    content_type    text NOT NULL CHECK (content_type IN ('blog_article','linkedin_post','youtube_script','regulation_page','corridor_page')),
    keyword         text,
    target_audience text,
    country_code    text,
    priority        int DEFAULT 5,
    used            boolean DEFAULT false,
    used_at         timestamptz
);

CREATE INDEX IF NOT EXISTS idx_content_topics_unused ON content_topics(used, priority);

-- content_queue table (in-flight and completed content)
CREATE TABLE IF NOT EXISTS content_queue (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at       timestamptz DEFAULT now(),
    content_type     text NOT NULL,
    topic            text NOT NULL,
    target_keyword   text,
    target_audience  text,
    country_code     text,
    status           text DEFAULT 'pending' CHECK (status IN ('pending','generating','generated','ready_to_post','script_ready','published','failed')),
    generated_content text,
    published_url    text,
    published_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_content_queue_status ON content_queue(status);
CREATE INDEX IF NOT EXISTS idx_content_queue_type ON content_queue(content_type);
