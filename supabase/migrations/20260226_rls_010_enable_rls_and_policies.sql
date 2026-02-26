-- ============================================================================
-- RLS Hardening: Step 2 — Enable RLS on ALL public tables + apply policies
-- ============================================================================
-- Safety: uses DO block to enable RLS everywhere first, then applies
-- explicit policies for known tables. Unknown tables default to DENY ALL
-- (RLS enabled, no policies = no access except service_role).
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 1: Enable RLS on every public table (fail-closed default)
-- ══════════════════════════════════════════════════════════════════════════════
do $$
declare r record;
begin
    for r in
        select schemaname, tablename
        from pg_tables
        where schemaname = 'public'
    loop
        execute format('alter table %I.%I enable row level security;', r.schemaname, r.tablename);
    end loop;
end $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 2: PUBLIC READ tables (anon + authenticated can SELECT)
-- ══════════════════════════════════════════════════════════════════════════════

-- directory_listings
do $$ begin
    drop policy if exists "public_read" on public.directory_listings;
    create policy "public_read" on public.directory_listings for select to anon, authenticated using (true);
exception when undefined_table then null; end $$;

-- global_countries
do $$ begin
    drop policy if exists "public_read" on public.global_countries;
    create policy "public_read" on public.global_countries for select to anon, authenticated using (true);
exception when undefined_table then null; end $$;

-- glossary_concepts
do $$ begin
    drop policy if exists "public_read_all" on public.glossary_concepts;
    create policy "public_read_all" on public.glossary_concepts for select to anon, authenticated using (true);
exception when undefined_table then null; end $$;

-- glossary_term_variants (only non-noindex)
do $$ begin
    drop policy if exists "public_read_published" on public.glossary_term_variants;
    create policy "public_read_published" on public.glossary_term_variants for select to anon, authenticated using (coalesce(noindex, true) = false);
exception when undefined_table then null; end $$;

-- global_escort_rules
do $$ begin
    drop policy if exists "public_read" on public.global_escort_rules;
    create policy "public_read" on public.global_escort_rules for select to anon, authenticated using (true);
exception when undefined_table then null; end $$;

-- corridors
do $$ begin
    drop policy if exists "public_read" on public.corridors;
    create policy "public_read" on public.corridors for select to anon, authenticated using (true);
exception when undefined_table then null; end $$;

-- geo_entities
do $$ begin
    drop policy if exists "public_read" on public.geo_entities;
    create policy "public_read" on public.geo_entities for select to anon, authenticated using (true);
exception when undefined_table then null; end $$;

-- profiles (public only)
do $$ begin
    drop policy if exists "public_read_public_profiles" on public.profiles;
    create policy "public_read_public_profiles" on public.profiles for select to anon, authenticated using (coalesce(is_public, false) = true);
exception when undefined_table then null; end $$;

-- baseline_rates
do $$ begin
    drop policy if exists "public_read" on public.baseline_rates;
    create policy "public_read" on public.baseline_rates for select to anon, authenticated using (true);
exception when undefined_table then null; end $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 3: AUTH READ + OWNER WRITE tables
-- ══════════════════════════════════════════════════════════════════════════════

-- reviews: public can read published; auth can insert own; owner can update own
do $$ begin
    drop policy if exists "reviews_public_read" on public.reviews;
    create policy "reviews_public_read" on public.reviews for select to anon, authenticated using (coalesce(is_published, false) = true);

    drop policy if exists "reviews_auth_insert" on public.reviews;
    create policy "reviews_auth_insert" on public.reviews for insert to authenticated with check (auth.uid() is not null and user_id = auth.uid());

    drop policy if exists "reviews_owner_update" on public.reviews;
    create policy "reviews_owner_update" on public.reviews for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when undefined_table then null; when undefined_column then null; end $$;

-- data_issues: auth insert; public read non-sensitive
do $$ begin
    drop policy if exists "data_issues_read" on public.data_issues;
    create policy "data_issues_read" on public.data_issues for select to anon, authenticated using (true);

    drop policy if exists "data_issues_auth_insert" on public.data_issues;
    create policy "data_issues_auth_insert" on public.data_issues for insert to authenticated with check (auth.uid() is not null);
exception when undefined_table then null; end $$;

-- claim_requests: auth insert own; mod/admin read
do $$ begin
    drop policy if exists "claim_requests_auth_insert" on public.claim_requests;
    create policy "claim_requests_auth_insert" on public.claim_requests for insert to authenticated with check (auth.uid() is not null);

    drop policy if exists "claim_requests_mod_read" on public.claim_requests;
    create policy "claim_requests_mod_read" on public.claim_requests for select to authenticated using (public.is_moderator_or_admin());
exception when undefined_table then null; end $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- PHASE 4: STRICTLY PRIVATE tables (admin-only read, service_role write)
-- ══════════════════════════════════════════════════════════════════════════════

-- Generic admin-only read policy for ops/intel/pricing tables
do $$
declare
    tbl text;
    private_tables text[] := ARRAY[
        'ops_events', 'telemetry_events', 'pipeline_runs', 'cron_runs',
        'pricing_events', 'pricing_models', 'recommendations',
        'corridor_scarcity_scores', 'permit_friction_scores',
        'recruitment_priority_zones', 'crowd_intel_events',
        'country_readiness_scores', 'resolution_log',
        'admin_push_tokens', 'moderation_actions'
    ];
begin
    foreach tbl in array private_tables loop
        begin
            execute format('drop policy if exists "admin_only_read" on public.%I;', tbl);
            execute format(
                'create policy "admin_only_read" on public.%I for select to authenticated using (public.is_admin());',
                tbl
            );
        exception when undefined_table then
            -- Table doesn't exist yet, skip silently
            null;
        end;
    end loop;
end $$;

-- moderation_actions: mod/admin read + write
do $$ begin
    drop policy if exists "admin_only_read" on public.moderation_actions;
    drop policy if exists "mod_read" on public.moderation_actions;
    create policy "mod_read" on public.moderation_actions for select to authenticated using (public.is_moderator_or_admin());

    drop policy if exists "mod_write" on public.moderation_actions;
    create policy "mod_write" on public.moderation_actions for insert to authenticated with check (public.is_moderator_or_admin());
exception when undefined_table then null; end $$;
