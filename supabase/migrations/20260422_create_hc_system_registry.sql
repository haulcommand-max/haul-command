-- Haul Command canonical system registry.
-- This is the enforcement map agents and maintainers use before adding or wiring
-- homepage, directory, AdGrid, data product, social, review, leaderboard,
-- corridor, load, SEO, and Assignment OS surfaces.

create table if not exists public.hc_system_registry (
  id uuid primary key default gen_random_uuid(),
  system_key text not null unique,
  system_family text not null,
  canonical_table text,
  canonical_view text,
  canonical_rpc text,
  canonical_route text,
  canonical_component text,
  status text not null default 'PARTIALLY_WIRED'
    check (status in (
      'ACTIVE_CANONICAL',
      'ACTIVE_COMPATIBILITY',
      'PARTIALLY_WIRED',
      'DORMANT',
      'OBSOLETE',
      'ARCHIVED_DO_NOT_USE',
      'DELETE_AFTER_BACKUP'
    )),
  public_surface boolean not null default false,
  monetization_surface boolean not null default false,
  seo_surface boolean not null default false,
  data_product_surface boolean not null default false,
  replacement_for text,
  deprecated_reason text,
  owner text,
  last_verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hc_system_registry_family
  on public.hc_system_registry (system_family);

create index if not exists idx_hc_system_registry_status
  on public.hc_system_registry (status);

create index if not exists idx_hc_system_registry_canonical_table
  on public.hc_system_registry (canonical_table);

create index if not exists idx_hc_system_registry_monetization
  on public.hc_system_registry (monetization_surface)
  where monetization_surface = true;

create index if not exists idx_hc_system_registry_seo
  on public.hc_system_registry (seo_surface)
  where seo_surface = true;

create index if not exists idx_hc_system_registry_data_product
  on public.hc_system_registry (data_product_surface)
  where data_product_surface = true;

alter table public.hc_system_registry enable row level security;

drop policy if exists "hc_system_registry_public_read_safe_rows" on public.hc_system_registry;
create policy "hc_system_registry_public_read_safe_rows"
  on public.hc_system_registry
  for select
  to anon, authenticated
  using (public_surface = true or seo_surface = true);

drop policy if exists "hc_system_registry_service_role_write" on public.hc_system_registry;
create policy "hc_system_registry_service_role_write"
  on public.hc_system_registry
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.set_hc_system_registry_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_hc_system_registry_updated_at on public.hc_system_registry;
create trigger trg_hc_system_registry_updated_at
  before update on public.hc_system_registry
  for each row
  execute function public.set_hc_system_registry_updated_at();

insert into public.hc_system_registry (
  system_key,
  system_family,
  canonical_table,
  canonical_view,
  canonical_rpc,
  canonical_route,
  canonical_component,
  status,
  public_surface,
  monetization_surface,
  seo_surface,
  data_product_surface,
  notes,
  last_verified_at
) values
  (
    'homepage_slots',
    'homepage/session slots',
    'hc_homepage_slots',
    null,
    'hc_homepage_slots_for_session',
    '/',
    'app/(landing)/_components/HomeClient.tsx',
    'PARTIALLY_WIRED',
    true,
    true,
    true,
    false,
    'Homepage slot tables exist; homepage still needs full Supabase-first rendering with hardcoded fallbacks only.',
    now()
  ),
  (
    'directory_publishable_entities',
    'directory/entities/claims',
    'directory_entities',
    'v_directory_publishable',
    null,
    '/directory',
    'components/directory/DirectoryGrid.tsx',
    'ACTIVE_CANONICAL',
    true,
    true,
    true,
    true,
    'Publishable directory entity surface. Directory pages must enforce country and entity-family filters before ranking.',
    now()
  ),
  (
    'adgrid_core',
    'AdGrid',
    'hc_adgrid_inventory',
    null,
    null,
    '/sponsor',
    'components/home/AdGridSlot.tsx',
    'PARTIALLY_WIRED',
    true,
    true,
    true,
    true,
    'Canonical AdGrid family should use hc_adgrid_*; public placements still need impression/click/lead/outcome attribution enforcement.',
    now()
  ),
  (
    'corridor_intelligence',
    'corridors/corridor intelligence',
    'corridors',
    null,
    null,
    '/corridors',
    null,
    'PARTIALLY_WIRED',
    true,
    true,
    true,
    true,
    'Corridor intelligence needs canonical populated corridors, metrics, liquidity, scarcity, and commercial scoring.',
    now()
  ),
  (
    'reviews_report_cards',
    'reviews/report cards/trust',
    'hc_reviews',
    null,
    null,
    null,
    null,
    'PARTIALLY_WIRED',
    true,
    false,
    true,
    true,
    'Review/report-card schema exists but requires attribute-based activation and fake-rating prevention.',
    now()
  )
on conflict (system_key) do update set
  system_family = excluded.system_family,
  canonical_table = excluded.canonical_table,
  canonical_view = excluded.canonical_view,
  canonical_rpc = excluded.canonical_rpc,
  canonical_route = excluded.canonical_route,
  canonical_component = excluded.canonical_component,
  status = excluded.status,
  public_surface = excluded.public_surface,
  monetization_surface = excluded.monetization_surface,
  seo_surface = excluded.seo_surface,
  data_product_surface = excluded.data_product_surface,
  notes = excluded.notes,
  last_verified_at = excluded.last_verified_at;
