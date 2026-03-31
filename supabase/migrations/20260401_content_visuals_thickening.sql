-- Haul Command SEO & Content Visual Upgrade
-- Enforces the requirement for deep media attachments on all blogs.

-- 1. Add visual columns to the Blog Posts table
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS hero_image_url VARCHAR(1024),
ADD COLUMN IF NOT EXISTS infographic_url VARCHAR(1024),
ADD COLUMN IF NOT EXISTS interactive_tool_slug VARCHAR(255), -- E.g., 'cost-calculator' or 'reciprocity-map'
ADD COLUMN IF NOT EXISTS geo_map_url VARCHAR(1024), -- Hyper-local map renders for state-specific posts
ADD COLUMN IF NOT EXISTS word_count INT DEFAULT 0;

-- 2. Add visual columns to the Glossary table
ALTER TABLE public.hc_glossary_terms
ADD COLUMN IF NOT EXISTS diagram_url VARCHAR(1024); -- To hold SVG diagrams of specific heavy haul equipment (e.g., High Poles, VMS Boards)

-- 3. Create a Bucket for Auto-Generated Content Media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog_visuals', 'blog_visuals', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage Policy
CREATE POLICY "Public Access to Blog Visuals" 
ON storage.objects FOR SELECT USING (bucket_id = 'blog_visuals');
