-- ================================================================
-- CONTENT MACHINE TABLES
-- ================================================================

CREATE TABLE IF NOT EXISTS content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('blog_article','linkedin_post','youtube_script','regulation_page','corridor_page')),
  topic TEXT NOT NULL,
  target_keyword TEXT,
  target_audience TEXT NOT NULL DEFAULT 'general_public'
    CHECK (target_audience IN ('escort_operator','broker','av_company','oilfield_company','general_public')),
  country_code TEXT,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','generating','generated','published','failed','ready_to_post','script_ready','rejected')),
  generated_content TEXT,
  published_url TEXT,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_content_queue_status ON content_queue (status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_content_queue_type ON content_queue (content_type, status);

CREATE TABLE IF NOT EXISTS content_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  keyword TEXT,
  content_type TEXT NOT NULL,
  target_audience TEXT NOT NULL DEFAULT 'general_public',
  country_code TEXT,
  priority INTEGER NOT NULL DEFAULT 5,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_topics_unused ON content_topics (priority ASC, created_at ASC) WHERE used = FALSE;

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content_html TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  target_keyword TEXT,
  country_code TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts (published_at DESC) WHERE published = TRUE;
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts (slug);

CREATE TABLE IF NOT EXISTS partner_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  corridors_or_regions TEXT,
  loads_per_month TEXT,
  primary_interest TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_inquiries_status ON partner_inquiries (status, created_at DESC);

CREATE TABLE IF NOT EXISTS email_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  sequence_id TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sent_at TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  unsubscribed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollment_unique ON email_sequence_enrollments (email, sequence_id) WHERE completed = FALSE AND unsubscribed = FALSE;
CREATE INDEX IF NOT EXISTS idx_enrollment_pending ON email_sequence_enrollments (sequence_id, current_step) WHERE completed = FALSE AND unsubscribed = FALSE;

-- RLS
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_enrollments ENABLE ROW LEVEL SECURITY;

-- blog_posts readable by public
CREATE POLICY "Blog posts are public" ON blog_posts FOR SELECT USING (published = TRUE);

-- content managed by service role only (no anon access)
CREATE POLICY "Service role manages content" ON content_queue FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages topics" ON content_topics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages inquiries" ON partner_inquiries FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role manages enrollments" ON email_sequence_enrollments FOR ALL USING (auth.role() = 'service_role');
