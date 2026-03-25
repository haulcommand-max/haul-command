-- ═══════════════════════════════════════════════════════════
-- SEO Blog Articles Table
-- Stores programmatically generated SEO articles
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_blog_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  country_code TEXT,
  term_id TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_blog_articles_slug ON public.hc_blog_articles(slug);
CREATE INDEX IF NOT EXISTS idx_blog_articles_country ON public.hc_blog_articles(country_code);
CREATE INDEX IF NOT EXISTS idx_blog_articles_term ON public.hc_blog_articles(term_id);
CREATE INDEX IF NOT EXISTS idx_blog_articles_status ON public.hc_blog_articles(status);

-- RLS: Public read access
ALTER TABLE public.hc_blog_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published articles"
  ON public.hc_blog_articles FOR SELECT
  USING (status = 'published');
