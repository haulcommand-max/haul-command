-- 20260402_search_os_schema_upgrades.sql
-- Upgrades the data layer to support unified Typesense + Pinecone search as instructed.
-- No existing tables dropped or downgraded. Strict expansion.

-- 1. Explicit UI/Search Faceting Flags on Entities
alter table public.entities
  add column if not exists has_images boolean not null default false,
  add column if not exists has_video boolean not null default false,
  add column if not exists has_reviews boolean not null default false,
  add column if not exists has_gear_evidence boolean not null default false,
  add column if not exists profile_completeness_band text,
  add column if not exists trust_band text,
  add column if not exists availability_band text,
  add column if not exists semantic_record_id text,
  add column if not exists semantic_synced_at timestamptz;

-- 2. Pinecone Chunk Sync Ledgers (RAG & Semantic Storage)
create table if not exists public.hc_content_rag_chunks (
  id uuid primary key default gen_random_uuid(),
  source_family text not null, -- glossary_term, regulation_chunk, tool_page
  source_id text not null,
  chunk_id text not null unique, -- Sent to Pinecone as the actual vector ID
  chunk_content text not null,
  metadata jsonb not null default '{}'::jsonb,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_scrape_chunks (
  id uuid primary key default gen_random_uuid(),
  crawl_job_id text,
  source_url text not null,
  source_domain text,
  chunk_type text not null,
  chunk_content text not null,
  metadata jsonb not null default '{}'::jsonb,
  synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.hc_query_memory (
  id uuid primary key default gen_random_uuid(),
  query_text text not null,
  country_code text,
  language text,
  query_family text,
  clicked_result_type text,
  converted boolean not null default false,
  session_segment jsonb,
  recorded_at timestamptz not null default now()
);

-- 3. Dedicated Dual-Sync Queue for the Fly Workers
create table if not exists public.search_sync_queue (
  id bigserial primary key,
  target_engine text not null, -- 'typesense', 'pinecone', 'both'
  action text not null, -- 'upsert', 'delete'
  entity_type text not null, -- 'profile', 'glossary', 'regulation', 'tool'
  record_id text not null,
  payload jsonb,
  status text not null default 'pending', -- 'pending', 'processing', 'complete', 'failed'
  error_log text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_search_sync_queue_pending on public.search_sync_queue(status, created_at) where status = 'pending';

-- 4. Triggers to auto-queue profile changes into dual-sync
create or replace function public.queue_entity_search_sync()
returns trigger
language plpgsql
as $$
begin
  -- Push to the dual-sync queue so Fly workers can hydrate both Pinecone and Typesense
  insert into public.search_sync_queue (target_engine, action, entity_type, record_id)
  values ('both', 'upsert', 'profile', new.id::text);
  return new;
end;
$$;

drop trigger if exists trg_queue_entity_search_sync on public.entities;
create trigger trg_queue_entity_search_sync
  after insert or update of 
    display_name, legal_name, description, services_summary, certifications_summary, 
    country_code, region_code, city, is_active, is_claimed, completeness_score, 
    has_images, has_video, has_reviews, has_gear_evidence
  on public.entities
  for each row execute function public.queue_entity_search_sync();

-- Create queue entries for when reviews arrive/update to trigger summary embedding
create or replace function public.queue_review_search_sync()
returns trigger
language plpgsql
as $$
declare
  target_entity_id text;
begin
  -- Support various review paradigms, default to finding subject_id or entity_id
  if new.entity_id is not null then
    target_entity_id := new.entity_id::text;
  end if;

  if target_entity_id is not null then
    insert into public.search_sync_queue (target_engine, action, entity_type, record_id)
    values ('pinecone', 'upsert', 'profile_review_update', target_entity_id);
  end if;
  return new;
end;
$$;

-- We conditionally attach this if `reviews` or `operator_reviews` has an entity_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'entity_id') THEN
    execute 'drop trigger if exists trg_queue_review_sync on public.reviews;';
    execute 'create trigger trg_queue_review_sync after insert or update on public.reviews for each row execute function public.queue_review_search_sync();';
  END IF;
END $$;
