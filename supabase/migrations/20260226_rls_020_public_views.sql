-- ============================================================================
-- RLS Hardening: Step 3 — Public Projection Views
-- Safe aggregated views that expose NO PII and work with anon/authenticated.
-- These replace any direct table queries on the homepage or public pages.
-- ============================================================================

-- ── v_kpis_public: Aggregated KPI view for homepage ─────────────────────────
-- returns single row with non-sensitive market metrics
create or replace view public.v_kpis_public as
select
    coalesce(
        (select count(*) from public.profiles
         where is_public = true and status = 'online'),
        0
    )::integer as escorts_online,
    coalesce(
        (select count(*) from public.profiles
         where is_public = true and status = 'available'),
        0
    )::integer as available_now,
    coalesce(
        (select count(*) from public.loads
         where status = 'open'),
        0
    )::integer as open_loads,
    0::integer as median_fill_time_minutes,
    now() as updated_at;

-- ── v_directory_summary_public: Directory-safe stats ────────────────────────
-- Non-PII aggregate counts for directory pages
create or replace view public.v_directory_summary_public as
select
    coalesce(country, 'US') as country,
    coalesce(region, 'unknown') as region,
    count(*)::integer as provider_count,
    avg(trust_score)::numeric(4,2) as avg_trust_score
from public.profiles
where is_public = true
group by country, region;

-- ── v_corridor_summary_public: Corridor-safe stats ──────────────────────────
create or replace view public.v_corridor_summary_public as
select
    id,
    name,
    slug,
    country_code,
    origin_region,
    destination_region,
    distance_km,
    is_active,
    corridor_type
from public.corridors
where is_active = true;

-- ── Grant access to anon and authenticated for all views ────────────────────
do $$
declare
    v text;
    views text[] := ARRAY[
        'v_kpis_public',
        'v_directory_summary_public',
        'v_corridor_summary_public'
    ];
begin
    foreach v in array views loop
        begin
            execute format('grant select on public.%I to anon, authenticated;', v);
        exception when undefined_table then null;
        end;
    end loop;
end $$;
