-- ============================================================
-- GLOBAL AUTHORITY & COMPLIANCE DIRECTORY — CORE SCHEMA
-- 52-country DOT-equivalent rules + contacts + ecosystem
-- Additive, reversible, no downgrades
-- ============================================================
begin;

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
do $$ begin
  create type public.authority_role as enum (
    'permit_office',
    'road_authority',
    'motor_carrier_enforcement',
    'highway_patrol_or_equivalent',
    'bridge_structures_engineering',
    'traffic_management',
    'port_terminal_security',
    'approved_escort_provider',
    'route_surveyor',
    'traffic_control_vendor',
    'utility_line_crew',
    'crane_rigging_dispatch',
    'rotator_towing_recovery',
    'training_certification_body',
    'association',
    'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.source_tier as enum ('official', 'quasi_official', 'field_validated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.rule_category as enum (
    'permit_requirement_logic',
    'escort_requirement_thresholds',
    'police_escort_triggers',
    'superload_classification',
    'bridge_engineering_review_rules',
    'restricted_travel_windows',
    'holiday_movement_bans',
    'convoy_rules',
    'signage_lighting_flagging',
    'enforcement_notes',
    'fees_and_processing',
    'route_approval_and_surveys',
    'insurance_and_bonding',
    'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.jurisdiction_level as enum ('country','admin1','admin2','special');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.verification_status as enum ('unverified','verified','stale','invalid');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- JURISDICTIONS (global normalized hierarchy)
-- ------------------------------------------------------------
create table if not exists public.authority_jurisdictions (
  id            uuid primary key default gen_random_uuid(),
  level         public.jurisdiction_level not null,
  country_code  text not null,
  admin1_code   text null,
  admin2_code   text null,
  special_code  text null,
  name          text not null,
  parent_id     uuid null references public.authority_jurisdictions(id) on delete set null,

  -- Geo anchor for "find authority near me"
  lat           double precision null,
  lng           double precision null,
  geo           geography(Point, 4326) null,
  h3_r6         text null,
  h3_r8         text null,

  -- Link to SEO authority hub page
  seo_page_id   uuid null references public.seo_pages(id) on delete set null,

  -- Slug for URL generation (e.g. "florida", "bayern", "nsw")
  slug          text null,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Uniqueness constraint
create unique index if not exists authority_jurisdictions_unique_key_idx
  on public.authority_jurisdictions (
    level, country_code,
    coalesce(admin1_code, ''),
    coalesce(admin2_code, ''),
    coalesce(special_code, '')
  );

create index if not exists authority_jurisdictions_country_idx   on public.authority_jurisdictions(country_code);
create index if not exists authority_jurisdictions_parent_idx    on public.authority_jurisdictions(parent_id);
create index if not exists authority_jurisdictions_h3r6_idx      on public.authority_jurisdictions(h3_r6);
create index if not exists authority_jurisdictions_h3r8_idx      on public.authority_jurisdictions(h3_r8);
create index if not exists authority_jurisdictions_geo_gist      on public.authority_jurisdictions using gist(geo);
create index if not exists authority_jurisdictions_slug_idx      on public.authority_jurisdictions(slug);
create index if not exists authority_jurisdictions_seo_page_idx  on public.authority_jurisdictions(seo_page_id);

-- Auto-fill geo from lat/lng (reuses existing trigger)
do $$
begin
  create trigger trg_authority_jurisdictions_set_geo
    before insert or update of lat, lng on public.authority_jurisdictions
    for each row execute function public.set_geo_from_lat_lng();
exception when duplicate_object then null;
end $$;

-- ------------------------------------------------------------
-- SOURCES (evidence + change detection)
-- ------------------------------------------------------------
create table if not exists public.authority_sources (
  id                  uuid primary key default gen_random_uuid(),
  tier                public.source_tier not null,
  title               text null,
  url                 text not null,
  doc_type            text null,
  publisher           text null,
  jurisdiction_id     uuid null references public.authority_jurisdictions(id) on delete set null,
  fetched_at          timestamptz null,
  content_hash        text null,
  last_changed_at     timestamptz null,
  confidence_default  numeric not null default 0.80,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  unique (url)
);

create index if not exists authority_sources_jurisdiction_idx on public.authority_sources(jurisdiction_id);
create index if not exists authority_sources_tier_idx         on public.authority_sources(tier);
create index if not exists authority_sources_active_idx       on public.authority_sources(is_active);

-- ------------------------------------------------------------
-- ORGANIZATIONS (DOT-equivalent bodies + ecosystem orgs)
-- ------------------------------------------------------------
create table if not exists public.authority_orgs (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  org_type                 public.authority_role not null default 'other',
  website                  text null,
  description              text null,
  primary_jurisdiction_id  uuid null references public.authority_jurisdictions(id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (name, org_type)
);

create index if not exists authority_orgs_primary_jurisdiction_idx on public.authority_orgs(primary_jurisdiction_id);
create index if not exists authority_orgs_type_idx                on public.authority_orgs(org_type);

-- Many-to-many: orgs ↔ jurisdictions
create table if not exists public.authority_org_jurisdictions (
  org_id          uuid not null references public.authority_orgs(id) on delete cascade,
  jurisdiction_id uuid not null references public.authority_jurisdictions(id) on delete cascade,
  is_primary      boolean not null default false,
  created_at      timestamptz not null default now(),
  primary key (org_id, jurisdiction_id)
);

create index if not exists authority_org_jurisdictions_j_idx on public.authority_org_jurisdictions(jurisdiction_id);

-- ------------------------------------------------------------
-- CONTACTS (phones/emails/addresses/hours per org)
-- ------------------------------------------------------------
create table if not exists public.authority_contacts (
  id                        uuid primary key default gen_random_uuid(),
  org_id                    uuid not null references public.authority_orgs(id) on delete cascade,
  jurisdiction_id           uuid null references public.authority_jurisdictions(id) on delete set null,

  contact_name              text null,
  role_title                text null,
  phone                     text null,
  email                     text null,
  address                   text null,
  hours                     text null,
  timezone                  text null,
  preferred_contact_method  text null,
  notes                     text null,

  verification              public.verification_status not null default 'unverified',
  confidence_score          numeric not null default 0.70,
  last_verified_at          timestamptz null,

  source_id                 uuid null references public.authority_sources(id) on delete set null,

  is_public                 boolean not null default true,
  is_active                 boolean not null default true,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists authority_contacts_org_idx          on public.authority_contacts(org_id);
create index if not exists authority_contacts_jurisdiction_idx on public.authority_contacts(jurisdiction_id);
create index if not exists authority_contacts_active_idx       on public.authority_contacts(is_active);
create index if not exists authority_contacts_public_idx       on public.authority_contacts(is_public);

-- ------------------------------------------------------------
-- RULESETS (one per jurisdiction per category; versioned)
-- ------------------------------------------------------------
create table if not exists public.authority_rulesets (
  id                uuid primary key default gen_random_uuid(),
  jurisdiction_id   uuid not null references public.authority_jurisdictions(id) on delete cascade,
  category          public.rule_category not null,

  summary_markdown  text not null default '',
  decision_rules    jsonb not null default '{}'::jsonb,

  verification      public.verification_status not null default 'unverified',
  confidence_score  numeric not null default 0.75,
  last_verified_at  timestamptz null,

  source_id         uuid null references public.authority_sources(id) on delete set null,

  effective_from    date null,
  effective_to      date null,
  version           int not null default 1,
  is_active         boolean not null default true,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (jurisdiction_id, category, version)
);

create index if not exists authority_rulesets_jurisdiction_idx on public.authority_rulesets(jurisdiction_id);
create index if not exists authority_rulesets_category_idx     on public.authority_rulesets(category);
create index if not exists authority_rulesets_active_idx       on public.authority_rulesets(is_active);

-- ------------------------------------------------------------
-- THRESHOLD TABLES (escort/police/superload triggers)
-- ------------------------------------------------------------
create table if not exists public.authority_threshold_tables (
  id          uuid primary key default gen_random_uuid(),
  ruleset_id  uuid not null references public.authority_rulesets(id) on delete cascade,
  table_key   text not null,
  unit_system text not null default 'mixed',
  rows        jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (ruleset_id, table_key)
);

create index if not exists authority_threshold_tables_ruleset_idx on public.authority_threshold_tables(ruleset_id);

-- ------------------------------------------------------------
-- CHANGE LOG (auditable history)
-- ------------------------------------------------------------
create table if not exists public.authority_change_log (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id   uuid not null,
  change_type text not null,
  diff        jsonb not null default '{}'::jsonb,
  changed_by  uuid null,
  changed_at  timestamptz not null default now()
);

create index if not exists authority_change_log_entity_idx     on public.authority_change_log(entity_type, entity_id);
create index if not exists authority_change_log_changed_at_idx on public.authority_change_log(changed_at desc);

-- ------------------------------------------------------------
-- USER REPORTS / CORRECTIONS (field-validated signals)
-- ------------------------------------------------------------
create table if not exists public.authority_reports (
  id                uuid primary key default gen_random_uuid(),
  jurisdiction_id   uuid null references public.authority_jurisdictions(id) on delete set null,
  org_id            uuid null references public.authority_orgs(id) on delete set null,
  contact_id        uuid null references public.authority_contacts(id) on delete set null,
  ruleset_id        uuid null references public.authority_rulesets(id) on delete set null,

  report_type       text not null,
  message           text not null,
  reporter_user_id  uuid null,
  severity          int not null default 1,
  created_at        timestamptz not null default now(),
  status            text not null default 'open'
);

create index if not exists authority_reports_status_idx  on public.authority_reports(status);
create index if not exists authority_reports_created_idx on public.authority_reports(created_at desc);

-- ------------------------------------------------------------
-- VERIFICATION TASKS (refresh scheduler queue)
-- ------------------------------------------------------------
create table if not exists public.authority_verification_tasks (
  id              uuid primary key default gen_random_uuid(),
  task_type       text not null,
  jurisdiction_id uuid null references public.authority_jurisdictions(id) on delete set null,
  org_id          uuid null references public.authority_orgs(id) on delete set null,
  contact_id      uuid null references public.authority_contacts(id) on delete set null,
  ruleset_id      uuid null references public.authority_rulesets(id) on delete set null,
  source_id       uuid null references public.authority_sources(id) on delete set null,

  due_at          timestamptz not null,
  priority        int not null default 5,
  status          text not null default 'queued',
  notes           text null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists authority_verif_tasks_due_idx    on public.authority_verification_tasks(due_at);
create index if not exists authority_verif_tasks_status_idx on public.authority_verification_tasks(status);

commit;
