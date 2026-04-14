-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Create table for semantic search across the platform
CREATE TABLE IF NOT EXISTS public.semantic_search_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL, -- The ID of the row this embedding represents
    entity_type TEXT NOT NULL, -- e.g., 'operator', 'corridor', 'glossary_term'
    content TEXT NOT NULL, -- The raw text that was embedded
    embedding vector(384), -- HuggingFace sentence-transformers (e.g. all-MiniLM-L6-v2 is 384 dims)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_semantic_search_embedding 
ON public.semantic_search_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable RLS
ALTER TABLE public.semantic_search_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semantic search is read-only for public" 
ON public.semantic_search_embeddings FOR SELECT 
USING (true);

CREATE POLICY "Only service role can mutate semantic embeddings" 
ON public.semantic_search_embeddings FOR ALL 
USING (auth.role() = 'service_role');
