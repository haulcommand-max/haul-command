-- 20260301_operator_legal_intelligence_engine.sql
-- Operator Legal Intelligence Engine: certifications, reciprocity, jurisdiction rules, legality cache
-- Powers real-time legality decisions, earnings unlock, expiration monitoring

begin;

-- =========================
-- Operator Certifications
-- =========================

create table if not exists public.operator_certifications (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null,
  cert_type text not null,                    -- pevo_wa|witpac|pevo_fl|pevo_tx|flagger|etc
  issuing_authority text,                     -- ESC|UF_T2|TxDOT|Caltrans|etc
  issuing_region text,                        -- WA|FL|TX|CA|etc
  cert_number text,
  issued_at timestamptz,
  expires_at timestamptz,
  verification_status text not null default 'pending', -- pending|verified|rejected|expired
  verification_source text,                   -- manual|api|ocr
  verification_metadata jsonb default '{}',   -- OCR confidence, API response, manual notes
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists op_certs_operator_idx on public.operator_certifications (operator_id);
create index if not exists op_certs_type_idx on public.operator_certifications (cert_type);
create index if not exists op_certs_expires_idx on public.operator_certifications (expires_at);
create index if not exists op_certs_status_idx on public.operator_certifications (verification_status);

-- =========================
-- Certification Reciprocity Matrix
-- =========================

create table if not exists public.cert_reciprocity_rules (
  id uuid primary key default gen_random_uuid(),
  cert_type text not null,                    -- pevo_wa|witpac|pevo_fl|etc
  issuing_region text not null,               -- WA|FL|TX|etc
  valid_region text not null,                 -- target state/province where cert is accepted
  validity_type text not null default 'full', -- full|conditional|prohibited
  conditions_json jsonb,                      -- conditional requirements if any
  priority_weight int not null default 100,   -- higher = stronger authority
  source_url text,                            -- reference URL for rule
  last_verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists cert_recip_type_idx on public.cert_reciprocity_rules (cert_type);
create index if not exists cert_recip_valid_idx on public.cert_reciprocity_rules (valid_region);
create unique index if not exists cert_recip_unique_idx
  on public.cert_reciprocity_rules (cert_type, issuing_region, valid_region);

-- =========================
-- Jurisdiction Escort Requirements
-- =========================

create table if not exists public.jurisdiction_escort_rules (
  id uuid primary key default gen_random_uuid(),
  country_code text not null default 'US',
  region_code text not null,                  -- state/province code
  requires_pevo boolean not null default false,
  requires_witpac boolean not null default false,
  requires_flagger boolean not null default false,
  min_training_hours int,
  insurance_minimum_usd numeric(12,2),
  special_requirements jsonb default '{}',    -- night_move rules, police requirements, etc
  notes text,
  source_url text,
  last_updated_at timestamptz not null default now(),
  constraint jurisdiction_region_unique unique (country_code, region_code)
);

create index if not exists juris_country_idx on public.jurisdiction_escort_rules (country_code);
create index if not exists juris_region_idx on public.jurisdiction_escort_rules (region_code);

-- =========================
-- Operator Legality Cache (precomputed decisions)
-- =========================

create table if not exists public.operator_legality_cache (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null,
  country_code text not null default 'US',
  region_code text not null,
  legality_status text not null,              -- legal|conditional|illegal
  confidence_score numeric(5,4) not null default 0,
  blockers_json jsonb default '[]',           -- [{cert_type, reason}]
  unlock_suggestions jsonb default '[]',      -- [{cert_type, estimated_revenue, training_url}]
  unlock_revenue_estimate numeric(12,2) default 0,
  computed_at timestamptz not null default now(),
  constraint op_legality_unique unique (operator_id, country_code, region_code)
);

create index if not exists op_legality_operator_idx on public.operator_legality_cache (operator_id);
create index if not exists op_legality_region_idx on public.operator_legality_cache (region_code);
create index if not exists op_legality_status_idx on public.operator_legality_cache (legality_status);

-- =========================
-- SEED: WA PEVO Reciprocity Rules (from ESC.org)
-- =========================

insert into public.cert_reciprocity_rules (cert_type, issuing_region, valid_region, validity_type, priority_weight, source_url, last_verified_at)
values
  ('pevo_wa', 'WA', 'WA', 'full', 100, 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification', now()),
  ('pevo_wa', 'WA', 'AZ', 'full', 90, 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification', now()),
  ('pevo_wa', 'WA', 'CO', 'full', 90, 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification', now()),
  ('pevo_wa', 'WA', 'FL', 'conditional', 80, 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification', now()),
  ('pevo_wa', 'WA', 'GA', 'full', 90, 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification', now()),
  ('pevo_wa', 'WA', 'KS', 'full', 90, 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification', now()),
  ('pevo_wa', 'WA', 'MN', 'full', 90, 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification', now()),
  ('pevo_wa', 'WA', 'NY', 'full', 90, 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification', now()),
  ('pevo_wa', 'WA', 'NC', 'full', 90, 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification', now()),
  ('pevo_wa', 'WA', 'OK', 'full', 90, 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification', now()),
  ('pevo_wa', 'WA', 'PA', 'full', 90, 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification', now()),
  ('pevo_wa', 'WA', 'TX', 'full', 90, 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification', now()),
  ('pevo_wa', 'WA', 'UT', 'full', 90, 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification', now()),
  ('pevo_wa', 'WA', 'VA', 'full', 90, 'https://www.esc.org/safety-library/where-in-the-u-s-can-i-use-my-washington-state-pilot-car-certification', now())
on conflict (cert_type, issuing_region, valid_region) do nothing;

-- SEED: FL PEVO (UF T2 Center)
insert into public.cert_reciprocity_rules (cert_type, issuing_region, valid_region, validity_type, priority_weight, source_url, last_verified_at)
values
  ('pevo_fl', 'FL', 'FL', 'full', 100, 'https://techtransfer.ce.ufl.edu/training/pilot-escort-flagging/', now())
on conflict (cert_type, issuing_region, valid_region) do nothing;

-- =========================
-- RLS
-- =========================

alter table public.operator_certifications enable row level security;
alter table public.cert_reciprocity_rules enable row level security;
alter table public.jurisdiction_escort_rules enable row level security;
alter table public.operator_legality_cache enable row level security;

commit;
