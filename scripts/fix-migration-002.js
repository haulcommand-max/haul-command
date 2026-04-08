/**
 * Fix script: create missing tables from migration 002 and continue
 */
const { Client } = require("pg");

const POOLER_URL =
  "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres";

async function main() {
  const c = new Client({
    connectionString: POOLER_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  console.log("Connected.\n");

  // 1. Create hc_attributes (missing from partial 002)
  console.log("Creating hc_attributes...");
  await c.query(`
    CREATE TABLE IF NOT EXISTS public.hc_attributes (
      id uuid primary key default gen_random_uuid(),
      canonical_key text unique not null,
      bucket text not null,
      label_default text not null,
      description_default text,
      search_aliases_json jsonb default '[]'::jsonb,
      country_overrides_json jsonb default '{}'::jsonb,
      language_overrides_json jsonb default '{}'::jsonb,
      negative_terms_json jsonb default '[]'::jsonb,
      related_tools_json jsonb default '[]'::jsonb,
      related_page_families_json jsonb default '[]'::jsonb,
      related_review_prompts_json jsonb default '[]'::jsonb,
      monetization_tags_json jsonb default '[]'::jsonb,
      is_active boolean default true,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  `);
  console.log("  ✅ hc_attributes");

  // 2. Create indexes
  await c.query(`CREATE INDEX IF NOT EXISTS hc_attributes_bucket_idx ON public.hc_attributes(bucket);`);
  await c.query(`CREATE INDEX IF NOT EXISTS hc_attributes_aliases_idx ON public.hc_attributes USING gin(search_aliases_json);`);
  console.log("  ✅ indexes");

  // 3. Create hc_entity_attributes  
  console.log("Creating hc_entity_attributes...");
  await c.query(`
    CREATE TABLE IF NOT EXISTS public.hc_entity_attributes (
      id uuid primary key default gen_random_uuid(),
      entity_id uuid not null references public.hc_entities(id) on delete cascade,
      attribute_id uuid not null references public.hc_attributes(id) on delete cascade,
      value_type text not null default 'boolean',
      value_text text,
      value_number numeric,
      value_boolean boolean,
      source text not null,
      source_ref_id text,
      confidence_score numeric(5,2) default 0,
      verification_status text not null default 'unverified',
      country_scope text,
      region_scope text,
      language_scope text,
      observed_at timestamptz default now(),
      expires_at timestamptz,
      created_at timestamptz default now(),
      constraint unique_entity_attr_src unique (entity_id, attribute_id, source, source_ref_id)
    );
  `);
  console.log("  ✅ hc_entity_attributes");

  await c.query(`CREATE INDEX IF NOT EXISTS hc_ea_entity_id_idx ON public.hc_entity_attributes(entity_id);`);
  await c.query(`CREATE INDEX IF NOT EXISTS hc_ea_attribute_id_idx ON public.hc_entity_attributes(attribute_id);`);
  await c.query(`CREATE INDEX IF NOT EXISTS hc_ea_source_idx ON public.hc_entity_attributes(source);`);
  await c.query(`CREATE INDEX IF NOT EXISTS hc_ea_verification_idx ON public.hc_entity_attributes(verification_status);`);
  console.log("  ✅ indexes");

  // 4. Create hc_entity_profiles if missing
  console.log("Creating hc_entity_profiles (if missing)...");
  await c.query(`
    CREATE TABLE IF NOT EXISTS public.hc_entity_profiles (
      id uuid primary key default gen_random_uuid(),
      entity_id uuid not null references public.hc_entities(id) on delete cascade,
      headline text,
      short_description text,
      long_description text,
      service_summary text,
      availability_summary text,
      proof_summary text,
      language_support_summary text,
      sectors_summary text,
      geo_summary text,
      hours_json jsonb default '{}'::jsonb,
      contact_json jsonb default '{}'::jsonb,
      commercial_json jsonb default '{}'::jsonb,
      claim_completion_percent numeric(5,2) default 0,
      profile_completeness_score numeric(5,2) default 0,
      ai_readiness_score numeric(5,2) default 0,
      freshness_score numeric(5,2) default 0,
      proof_density_score numeric(5,2) default 0,
      internal_link_score numeric(5,2) default 0,
      conversion_readiness_score numeric(5,2) default 0,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  `);
  console.log("  ✅ hc_entity_profiles");

  // 5. Create hc_review_attributes if missing
  console.log("Creating hc_review_attributes (if missing)...");
  await c.query(`
    CREATE TABLE IF NOT EXISTS public.hc_review_attributes (
      id uuid primary key default gen_random_uuid(),
      review_id uuid not null references public.hc_reviews(id) on delete cascade,
      entity_id uuid not null references public.hc_entities(id) on delete cascade,
      attribute_id uuid not null references public.hc_attributes(id) on delete cascade,
      snippet_text text,
      confidence_score numeric(5,2) default 0,
      sentiment_direction text,
      urgency_tag text,
      geo_tag text,
      time_tag text,
      proof_tag text,
      ai_snippet_candidate boolean default false,
      extracted_at timestamptz default now()
    );
  `);
  console.log("  ✅ hc_review_attributes");

  // 6. RLS
  for (const tbl of ["hc_entity_profiles", "hc_attributes", "hc_entity_attributes", "hc_review_attributes"]) {
    await c.query(`ALTER TABLE public.${tbl} ENABLE ROW LEVEL SECURITY;`);
    await c.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='${tbl}' AND policyname='service_role_full_access') THEN
          CREATE POLICY "service_role_full_access" ON public.${tbl} FOR ALL TO service_role USING (true) WITH CHECK (true);
        END IF;
      END $$;
    `);
  }
  console.log("  ✅ RLS policies");

  console.log("\n✅ All missing tables from migration 002 created.\n");

  // 7. Now verify
  const check = await c.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('hc_attributes','hc_entity_attributes','hc_entity_profiles','hc_review_attributes') ORDER BY tablename"
  );
  console.log("Verified tables:");
  check.rows.forEach((r) => console.log("  ✓ " + r.tablename));

  await c.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
