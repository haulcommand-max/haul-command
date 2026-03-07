-- ============================================================
-- GLOBAL PR AUTHORITY ENGINE — DATABASE TABLES
-- Journalist requests, outlets, responses, spokespeople,
-- backlink tracking, partnership targets
-- ============================================================
begin;

-- ------------------------------------------------------------
-- PR OUTLETS (media publications, trade press, blogs)
-- ------------------------------------------------------------
create table if not exists public.pr_outlets (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  domain         text null,
  outlet_type    text not null default 'trade_press',  -- trade_press, national, blog, association, gov
  country_codes  text[] not null default '{}',          -- ISO2 array
  domain_rating  int null,                              -- estimated DR/DA
  contact_email  text null,
  contact_name   text null,
  notes          text null,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (domain)
);

create index if not exists pr_outlets_type_idx    on public.pr_outlets(outlet_type);
create index if not exists pr_outlets_country_idx on public.pr_outlets using gin(country_codes);

-- ------------------------------------------------------------
-- PR SPOKESPEOPLE (expert roster for media responses)
-- ------------------------------------------------------------
create table if not exists public.pr_spokespeople (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid null,                              -- links to auth.users
  driver_profile_id uuid null,                            -- links to driver_profiles for verified operators
  name            text not null,
  title           text null,                              -- e.g. "Senior Escort Operator"
  company         text null,
  country_codes   text[] not null default '{}',           -- regions they can speak to
  topic_tags      text[] not null default '{}',           -- compliance, safety, rates, corridors
  timezone        text null,
  email           text null,
  phone           text null,
  bio             text null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists pr_spokespeople_country_idx on public.pr_spokespeople using gin(country_codes);
create index if not exists pr_spokespeople_topics_idx  on public.pr_spokespeople using gin(topic_tags);

-- ------------------------------------------------------------
-- PR JOURNALIST REQUESTS (inbound requests from HARO/Qwoted/etc)
-- ------------------------------------------------------------
create table if not exists public.pr_journalist_requests (
  id                    uuid primary key default gen_random_uuid(),
  source_channel        text not null,                  -- 'haro', 'qwoted', 'sourcebottle', 'responsesource', 'twitter', 'direct'
  external_id           text null,                      -- ID from source platform
  journalist_name       text null,
  outlet_id             uuid null references public.pr_outlets(id) on delete set null,
  outlet_name           text null,                      -- denormalized for quick display
  outlet_domain         text null,

  country_iso2          text null,
  topic_tags            text[] not null default '{}',
  request_text          text not null,
  response_requirements text null,
  deadline_at           timestamptz null,

  -- Matching
  matched_report_ids    text[] not null default '{}',   -- data desk report IDs matched
  matched_spokesperson_id uuid null references public.pr_spokespeople(id) on delete set null,

  status                text not null default 'new',    -- new, triaged, responded, published, expired, skipped
  priority              int not null default 5,         -- 1=urgent, 9=low

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists pr_journo_req_status_idx   on public.pr_journalist_requests(status);
create index if not exists pr_journo_req_deadline_idx on public.pr_journalist_requests(deadline_at);
create index if not exists pr_journo_req_country_idx  on public.pr_journalist_requests(country_iso2);
create index if not exists pr_journo_req_topics_idx   on public.pr_journalist_requests using gin(topic_tags);
create index if not exists pr_journo_req_channel_idx  on public.pr_journalist_requests(source_channel);

-- ------------------------------------------------------------
-- PR RESPONSES (what we sent back to journalists)
-- ------------------------------------------------------------
create table if not exists public.pr_responses (
  id                   uuid primary key default gen_random_uuid(),
  request_id           uuid not null references public.pr_journalist_requests(id) on delete cascade,
  spokesperson_id      uuid null references public.pr_spokespeople(id) on delete set null,
  response_text        text not null,
  template_id          text null,                       -- PR-TPL-QUOTE-001 etc.
  data_points_cited    text[] not null default '{}',    -- report IDs or stat keys
  citation_urls        text[] not null default '{}',    -- links to data desk pages
  sent_at              timestamptz null,
  accepted             boolean null,                    -- journalist accepted?
  published_url        text null,                       -- final article URL
  created_at           timestamptz not null default now()
);

create index if not exists pr_responses_request_idx on public.pr_responses(request_id);

-- ------------------------------------------------------------
-- PR BACKLINK HITS (tracking earned backlinks)
-- ------------------------------------------------------------
create table if not exists public.pr_backlink_hits (
  id              uuid primary key default gen_random_uuid(),
  source_url      text not null,                        -- page linking to us
  target_url      text not null,                        -- our page being linked
  source_domain   text null,
  outlet_id       uuid null references public.pr_outlets(id) on delete set null,
  response_id     uuid null references public.pr_responses(id) on delete set null,

  link_type       text not null default 'dofollow',     -- dofollow, nofollow, ugc, sponsored
  anchor_text     text null,
  domain_rating   int null,                             -- source DR at time of discovery
  country_iso2    text null,

  first_seen_at   timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  is_active       boolean not null default true,

  unique (source_url, target_url)
);

create index if not exists pr_backlinks_domain_idx   on public.pr_backlink_hits(source_domain);
create index if not exists pr_backlinks_target_idx   on public.pr_backlink_hits(target_url);
create index if not exists pr_backlinks_country_idx  on public.pr_backlink_hits(country_iso2);
create index if not exists pr_backlinks_outlet_idx   on public.pr_backlink_hits(outlet_id);

-- ------------------------------------------------------------
-- PR PARTNERSHIP TARGETS (chambers, associations, ports, registries)
-- ------------------------------------------------------------
create table if not exists public.pr_partnership_targets (
  id                uuid primary key default gen_random_uuid(),
  target_type       text not null,                      -- 'chamber', 'association', 'port', 'registry', 'training_org'
  target_name       text not null,
  target_url        text null,
  contact_email     text null,
  contact_name      text null,
  country_iso2      text not null,
  region            text null,
  city              text null,

  -- Tracking
  status            text not null default 'identified', -- identified, contacted, listed, declined, stale
  last_contacted_at timestamptz null,
  listed_url        text null,                          -- where we appear in their directory
  outcome           text null,
  notes             text null,

  -- Linking
  backlink_id       uuid null references public.pr_backlink_hits(id) on delete set null,
  jurisdiction_id   uuid null references public.authority_jurisdictions(id) on delete set null,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists pr_partners_type_idx    on public.pr_partnership_targets(target_type);
create index if not exists pr_partners_country_idx on public.pr_partnership_targets(country_iso2);
create index if not exists pr_partners_status_idx  on public.pr_partnership_targets(status);

-- ============================================================
-- RLS for PR tables
-- ============================================================
alter table public.pr_outlets                  enable row level security;
alter table public.pr_spokespeople             enable row level security;
alter table public.pr_journalist_requests      enable row level security;
alter table public.pr_responses                enable row level security;
alter table public.pr_backlink_hits            enable row level security;
alter table public.pr_partnership_targets      enable row level security;

-- All PR tables: admin-only (internal ops data)
create policy "admin_manage_pr_outlets"
  on public.pr_outlets for all
  using (public.is_admin()) with check (public.is_admin());

create policy "admin_manage_pr_spokespeople"
  on public.pr_spokespeople for all
  using (public.is_admin()) with check (public.is_admin());

create policy "admin_manage_pr_journalist_requests"
  on public.pr_journalist_requests for all
  using (public.is_admin()) with check (public.is_admin());

create policy "admin_manage_pr_responses"
  on public.pr_responses for all
  using (public.is_admin()) with check (public.is_admin());

create policy "admin_manage_pr_backlinks"
  on public.pr_backlink_hits for all
  using (public.is_admin()) with check (public.is_admin());

create policy "admin_manage_pr_partners"
  on public.pr_partnership_targets for all
  using (public.is_admin()) with check (public.is_admin());

commit;
