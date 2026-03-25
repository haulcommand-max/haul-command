-- Migration to add semantic search capabilities for Glossary, Regulations, and Escort Requirements

-- Ensure the pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a generic Semantic Index table rather than polluting multiple tables.
-- This allows searching across all authoritative text (dictionary, regulations, permits).
CREATE TABLE IF NOT EXISTS hc_semantic_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL, -- e.g., 'glossary', 'regulation', 'permit_requirement'
    source_id TEXT NOT NULL, -- The unique string ID (e.g. 'spmt', 'us-tx-escort')
    country_code TEXT, -- If applicable
    title TEXT NOT NULL,
    content TEXT NOT NULL, 
    metadata JSONB DEFAULT '{}'::JSONB,
    embedding vector(1536), -- Based on OpenAI/Gemini embedding standard size
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for vector similarity (using HNSW)
CREATE INDEX IF NOT EXISTS hc_semantic_embedding_idx ON hc_semantic_index USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS hc_semantic_source_idx ON hc_semantic_index(source_type, source_id);

-- Create RPC for semantic search
-- Can be called via Supabase `rpc('search_semantic_index', { query_embedding: [...], match_threshold: 0.7, match_count: 5 })`
CREATE OR REPLACE FUNCTION search_semantic_index(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    filter_country TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    source_type TEXT,
    source_id TEXT,
    title TEXT,
    content TEXT,
    metadata JSONB,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        hc_semantic_index.id,
        hc_semantic_index.source_type,
        hc_semantic_index.source_id,
        hc_semantic_index.title,
        hc_semantic_index.content,
        hc_semantic_index.metadata,
        1 - (hc_semantic_index.embedding <=> query_embedding) AS similarity
    FROM hc_semantic_index
    WHERE 
        (hc_semantic_index.country_code = filter_country OR filter_country IS NULL)
        AND 1 - (hc_semantic_index.embedding <=> query_embedding) > match_threshold
    ORDER BY hc_semantic_index.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
