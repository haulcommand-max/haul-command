-- ================================================================
-- Haul Command Unified Content OS — Phase 2 Combined Schema Pack
-- Adds Training as first-class page family alongside Blog, 
-- Regulations, and Tools. Integrates with existing glossary
-- knowledge graph via content_edges.
-- ================================================================
begin;

-- ============================================================
-- 1. TRAINING CATALOG (REVENUE-CRITICAL)
-- ============================================================

create table if not exists public.training_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text,
  quick_answer text,

  training_type text,                -- 'course', 'certification', 'module_bundle'
  credential_level text,             -- 'road_ready', 'certified', 'elite', 'av_ready'

  module_count int default 0,
  hours_total int default 0,

  jurisdiction_scope text,           -- 'national', 'state', 'multi-state', 'global'
  reciprocity_scope text,            -- description of cross-jurisdiction portability

  requirement_fit text,              -- 'required', 'useful', 'optional'
  ranking_impact text,               -- description of on-platform ranking effect
  trust_badge_effect jsonb default '{}'::jsonb,

  pricing_mode text default 'paid',  -- 'free', 'freemium', 'paid', 'subscription', 'enterprise'
  pricing_json jsonb default '{}'::jsonb,

  sponsor_eligible boolean default false,

  confidence_state text not null default 'seeded_needs_review',
  freshness_state text not null default 'seeded_needs_review',

  is_active boolean default true,
  is_indexable boolean default true,

  cta_primary text,
  cta_secondary text,

  reviewed_at timestamptz default now(),
  next_review_due timestamptz default now() + interval '90 days',

  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_training_catalog_slug on public.training_catalog(slug);
create index if not exists idx_training_catalog_active on public.training_catalog(is_active, is_indexable);

-- ============================================================
-- 2. TRAINING MODULES
-- ============================================================

create table if not exists public.training_modules (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references public.training_catalog(id) on delete cascade,
  slug text not null,
  title text not null,
  summary text,
  hours int default 0,
  sort_order int default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_training_modules_training on public.training_modules(training_id, sort_order);

-- ============================================================
-- 3. TRAINING LEVELS (Badge/Tier System)
-- ============================================================

create table if not exists public.training_levels (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references public.training_catalog(id) on delete cascade,
  level_slug text not null,
  level_name text not null,
  description text,
  badge_slug text,
  rank_weight int default 0,
  trust_weight int default 0,
  pricing_json jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- 4. TRAINING GEO FIT (Country/Region Training Applicability)
-- ============================================================

create table if not exists public.training_geo_fit (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references public.training_catalog(id) on delete cascade,
  country_code text not null,
  region_code text,
  fit_type text not null default 'useful', -- 'required', 'useful', 'optional', 'not_applicable'
  note text,
  confidence_state text default 'seeded_needs_review',
  freshness_state text default 'seeded_needs_review',
  created_at timestamptz default now(),
  unique (training_id, country_code, region_code)
);

create index if not exists idx_training_geo_fit_country on public.training_geo_fit(country_code);

-- ============================================================
-- 5. TRAINING RECIPROCITY NOTES
-- ============================================================

create table if not exists public.training_reciprocity_notes (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references public.training_catalog(id) on delete cascade,
  from_geo text not null,
  to_geo text not null,
  note text,
  confidence_state text default 'seeded_needs_review',
  freshness_state text default 'seeded_needs_review',
  created_at timestamptz default now()
);

-- ============================================================
-- 6. TRAINING LINKS (Cross-System Routing)
-- ============================================================

create table if not exists public.training_links (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references public.training_catalog(id) on delete cascade,
  link_type text not null,     -- 'related_regulation', 'related_tool', 'related_glossary', 
                               -- 'related_location', 'related_corridor', 'next_action',
                               -- 'claim_path', 'sponsor_path'
  target_type text not null,
  target_id text not null,
  anchor_text text,
  priority int default 50,
  created_at timestamptz default now()
);

create index if not exists idx_training_links_training on public.training_links(training_id, priority desc);

-- ============================================================
-- 7. TRAINING BADGE EFFECTS
-- ============================================================

create table if not exists public.training_badge_effects (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references public.training_catalog(id) on delete cascade,
  badge_slug text not null,
  on_platform_effect_json jsonb default '{}'::jsonb,
  visible_copy text,
  created_at timestamptz default now()
);

-- ============================================================
-- 8. TRAINING ENROLLMENTS (Revenue Engine)
-- ============================================================

create table if not exists public.training_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  training_id uuid references public.training_catalog(id) on delete cascade,
  status text not null default 'enrolled', -- 'enrolled', 'in_progress', 'completed', 'expired', 'cancelled'
  purchased_at timestamptz default now(),
  completed_at timestamptz,
  expires_at timestamptz,
  review_due_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_training_enrollments_user on public.training_enrollments(user_id, status);

-- ============================================================
-- 9. TRAINING USER BADGES
-- ============================================================

create table if not exists public.training_user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  badge_slug text not null,
  source_training_id uuid references public.training_catalog(id) on delete set null,
  status text not null default 'active', -- 'active', 'expired', 'review_due', 'revoked'
  issued_at timestamptz default now(),
  expires_at timestamptz,
  review_due_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_training_user_badges_user on public.training_user_badges(user_id, status);

-- ============================================================
-- 10. TRAINING TEAM ACCOUNTS (Enterprise Revenue)
-- ============================================================

create table if not exists public.training_team_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  plan_type text not null default 'team', -- 'team', 'enterprise', 'government'
  seat_count int default 5,
  renewal_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.training_team_enrollments (
  id uuid primary key default gen_random_uuid(),
  team_account_id uuid references public.training_team_accounts(id) on delete cascade,
  user_id uuid not null,
  training_id uuid references public.training_catalog(id) on delete cascade,
  status text not null default 'enrolled',
  created_at timestamptz default now()
);

-- ============================================================
-- 11. CONTENT EDGES — CROSS-SYSTEM LINK GRAPH
-- Enables blog <-> regulations <-> tools <-> training <-> glossary
-- ============================================================

create table if not exists public.content_edges (
  id uuid primary key default gen_random_uuid(),
  from_type text not null,       -- 'blog', 'regulation', 'tool', 'training', 'glossary', 'location', 'corridor'
  from_id text not null,         -- slug or uuid
  to_type text not null,
  to_id text not null,
  link_type text not null,       -- 'supports', 'requires', 'explains', 'trains_for', 'next_action'
  anchor_text text,
  priority int default 50,
  is_auto_generated boolean default false,
  created_at timestamptz default now(),
  unique (from_type, from_id, to_type, to_id, link_type)
);

create index if not exists idx_content_edges_from on public.content_edges(from_type, from_id, priority desc);
create index if not exists idx_content_edges_to on public.content_edges(to_type, to_id);

-- ============================================================
-- 12. CONTENT QUALITY SCORES (Unified Scoring Engine)
-- ============================================================

create table if not exists public.content_quality_scores (
  id uuid primary key default gen_random_uuid(),
  page_family text not null,    -- 'blog', 'regulations', 'tools', 'training', 'glossary'
  entity_id text not null,      -- slug or uuid
  
  editorial_utility numeric(3,2) default 0,
  support_link_density numeric(3,2) default 0,
  geo_relevance numeric(3,2) default 0,
  trust_source_clarity numeric(3,2) default 0,
  commercial_routing numeric(3,2) default 0,
  freshness numeric(3,2) default 0,
  overall_score numeric(3,2) default 0,
  
  notes text,
  scored_at timestamptz default now(),
  
  unique (page_family, entity_id)
);

-- ============================================================
-- 13. RLS POLICIES
-- ============================================================

alter table public.training_catalog enable row level security;
alter table public.training_modules enable row level security;
alter table public.training_levels enable row level security;
alter table public.training_geo_fit enable row level security;
alter table public.training_reciprocity_notes enable row level security;
alter table public.training_links enable row level security;
alter table public.training_badge_effects enable row level security;
alter table public.training_enrollments enable row level security;
alter table public.training_user_badges enable row level security;
alter table public.training_team_accounts enable row level security;
alter table public.training_team_enrollments enable row level security;
alter table public.content_edges enable row level security;
alter table public.content_quality_scores enable row level security;

-- Public read for catalog/modules/levels/links/geo/reciprocity/badges
create policy "Public can view training catalog" on public.training_catalog for select using (true);
create policy "Public can view training modules" on public.training_modules for select using (true);
create policy "Public can view training levels" on public.training_levels for select using (true);
create policy "Public can view training geo fit" on public.training_geo_fit for select using (true);
create policy "Public can view training reciprocity" on public.training_reciprocity_notes for select using (true);
create policy "Public can view training links" on public.training_links for select using (true);
create policy "Public can view badge effects" on public.training_badge_effects for select using (true);
create policy "Public can view content edges" on public.content_edges for select using (true);
create policy "Public can view quality scores" on public.content_quality_scores for select using (true);

-- User-scoped policies for enrollments and badges
create policy "Users can view own enrollments" on public.training_enrollments
  for select using (auth.uid() = user_id);
create policy "Users can view own badges" on public.training_user_badges
  for select using (auth.uid() = user_id);

-- Team account scoped
create policy "Team admins can view team accounts" on public.training_team_accounts
  for select using (true);
create policy "Team enrollments viewable by member" on public.training_team_enrollments
  for select using (auth.uid() = user_id);

commit;
