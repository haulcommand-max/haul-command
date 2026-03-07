-- 20260301_social_avatar_auto_import.sql
-- Social Avatar Auto-Import Engine: avatar metadata, quality scoring, import history
-- Eliminates empty profiles, boosts Trust Score, improves directory quality

begin;

-- =========================
-- Avatar Metadata (per user)
-- =========================

create table if not exists public.user_avatars (
  user_id uuid primary key,
  avatar_url text,                                -- CDN URL (never hotlinked)
  avatar_source text not null default 'placeholder', -- placeholder|social_import|user_upload
  avatar_provider text,                           -- google|facebook|linkedin|null
  avatar_quality_score int default 0,             -- 0-100
  avatar_quality_tier text default 'poor',        -- poor|acceptable|good|excellent
  face_detected boolean default false,
  resolution_width int,
  resolution_height int,
  storage_path text,                              -- bucket path: avatars/{user_id}/256.webp
  avatar_imported_at timestamptz,
  avatar_replaced_at timestamptz,
  quality_scored_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- Avatar Variants (multiple sizes)
-- =========================

create table if not exists public.avatar_variants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  size int not null,                              -- 64|128|256|512
  format text not null default 'webp',            -- webp|jpeg
  storage_path text not null,
  cdn_url text not null,
  file_size_bytes int,
  created_at timestamptz not null default now(),
  constraint avatar_variant_unique unique (user_id, size, format)
);

create index if not exists avatar_var_user_idx on public.avatar_variants (user_id);

-- =========================
-- Avatar Import History (audit trail)
-- =========================

create table if not exists public.avatar_import_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null,                         -- google|facebook|linkedin
  source_url text,                                -- original provider URL (not stored long-term)
  action text not null,                           -- imported|skipped|failed|replaced
  quality_score int,
  error_message text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists avatar_log_user_idx on public.avatar_import_log (user_id);
create index if not exists avatar_log_action_idx on public.avatar_import_log (action);

-- =========================
-- Avatar Consistency Check (fraud signals)
-- =========================

create table if not exists public.avatar_consistency_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider_a text not null,
  provider_b text not null,
  similarity_score numeric(5,4),                  -- 0-1 (1=identical)
  mismatch_flagged boolean default false,
  reviewed boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists avatar_consist_user_idx on public.avatar_consistency_checks (user_id);
create index if not exists avatar_consist_flag_idx on public.avatar_consistency_checks (mismatch_flagged);

-- =========================
-- RLS
-- =========================

alter table public.user_avatars enable row level security;
alter table public.avatar_variants enable row level security;
alter table public.avatar_import_log enable row level security;
alter table public.avatar_consistency_checks enable row level security;

commit;
