-- ═══════════════════════════════════════════════════════════
-- UPGRADE: SEO Blog Articles Visual & Structured Data Payload
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.hc_blog_articles
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS og_image_url TEXT,
ADD COLUMN IF NOT EXISTS excerpt TEXT,
ADD COLUMN IF NOT EXISTS schema_markup JSONB,
ADD COLUMN IF NOT EXISTS visual_assets JSONB DEFAULT '[]'::jsonb;

-- Create an index to quickly find articles that are missing hero images (for visual retrofit queries)
CREATE INDEX IF NOT EXISTS idx_blog_articles_hero_image ON public.hc_blog_articles(hero_image_url) WHERE hero_image_url IS NULL;

-- ═══════════════════════════════════════════════════════════
-- Create Image Retrofit Job Log (Optional but good practice)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.hc_content_generation_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.hc_blog_articles(id) ON DELETE CASCADE,
  task_type TEXT CHECK (task_type IN ('content_generation', 'visual_generation', 'seo_optimization')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  prompt_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.hc_content_generation_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service Role full access on content queue"
  ON public.hc_content_generation_queue
  USING (true);
