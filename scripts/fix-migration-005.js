/**
 * Fix migration 005 partial failure — create all missing tables
 * Also creates hc_tool_runs which depends on hc_tools
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

  // 1. hc_geo_overlays
  console.log("1/6 Creating hc_geo_overlays...");
  await c.query(`
    CREATE TABLE IF NOT EXISTS public.hc_geo_overlays (
      id uuid primary key default gen_random_uuid(),
      country_code text not null,
      region_code text,
      default_language text not null,
      supported_languages_json jsonb default '[]'::jsonb,
      currency_code text not null,
      measurement_system text not null,
      date_format text not null,
      time_format text not null,
      role_aliases_json jsonb default '{}'::jsonb,
      service_aliases_json jsonb default '{}'::jsonb,
      legal_notes_json jsonb default '{}'::jsonb,
      commercial_notes_json jsonb default '{}'::jsonb,
      holiday_context_json jsonb default '{}'::jsonb,
      priority_sectors_json jsonb default '[]'::jsonb,
      local_search_phrases_json jsonb default '[]'::jsonb,
      created_at timestamptz default now(),
      updated_at timestamptz default now(),
      constraint unique_geo_overlay unique (country_code, region_code)
    );
  `);
  await c.query("CREATE INDEX IF NOT EXISTS hc_go_geo_idx ON public.hc_geo_overlays(country_code, region_code);");
  console.log("   ✅ hc_geo_overlays");

  // 2. hc_glossary_terms
  console.log("2/6 Creating hc_glossary_terms...");
  await c.query(`
    CREATE TABLE IF NOT EXISTS public.hc_glossary_terms (
      id uuid primary key default gen_random_uuid(),
      canonical_term text not null,
      slug text unique not null,
      definition_short text,
      definition_long text,
      aliases_json jsonb default '[]'::jsonb,
      country_variants_json jsonb default '{}'::jsonb,
      language_variants_json jsonb default '{}'::jsonb,
      ambiguity_notes_json jsonb default '[]'::jsonb,
      related_attributes_json jsonb default '[]'::jsonb,
      related_entities_json jsonb default '[]'::jsonb,
      related_tools_json jsonb default '[]'::jsonb,
      related_training_json jsonb default '[]'::jsonb,
      related_regulations_json jsonb default '[]'::jsonb,
      related_services_json jsonb default '[]'::jsonb,
      ai_snippet_answer text,
      status text not null default 'active',
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  `);
  await c.query("CREATE INDEX IF NOT EXISTS hc_gt_search_idx ON public.hc_glossary_terms USING gin(to_tsvector('simple', canonical_term || ' ' || coalesce(definition_short,'')));");
  await c.query("CREATE INDEX IF NOT EXISTS hc_gt_aliases_idx ON public.hc_glossary_terms USING gin(aliases_json);");
  console.log("   ✅ hc_glossary_terms");

  // 3. hc_tools
  console.log("3/6 Creating hc_tools...");
  await c.query(`
    CREATE TABLE IF NOT EXISTS public.hc_tools (
      id uuid primary key default gen_random_uuid(),
      tool_name text not null,
      slug text unique not null,
      tool_type text not null,
      input_schema_json jsonb not null default '{}'::jsonb,
      output_schema_json jsonb not null default '{}'::jsonb,
      related_attributes_json jsonb default '[]'::jsonb,
      related_pages_json jsonb default '[]'::jsonb,
      related_entities_json jsonb default '[]'::jsonb,
      lead_capture_rules_json jsonb default '{}'::jsonb,
      monetization_rules_json jsonb default '{}'::jsonb,
      status text not null default 'draft',
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  `);
  console.log("   ✅ hc_tools");

  // 4. hc_tool_runs (depends on hc_tools)
  console.log("4/6 Creating hc_tool_runs...");
  await c.query(`
    CREATE TABLE IF NOT EXISTS public.hc_tool_runs (
      id uuid primary key default gen_random_uuid(),
      tool_id uuid not null references public.hc_tools(id) on delete cascade,
      user_id uuid,
      anonymous_session_id text,
      input_payload_json jsonb not null default '{}'::jsonb,
      output_payload_json jsonb not null default '{}'::jsonb,
      extracted_attributes_json jsonb default '[]'::jsonb,
      extracted_geo_json jsonb default '{}'::jsonb,
      recommended_entities_json jsonb default '[]'::jsonb,
      gap_detection_json jsonb default '{}'::jsonb,
      created_at timestamptz default now()
    );
  `);
  await c.query("CREATE INDEX IF NOT EXISTS hc_tr_tool_idx ON public.hc_tool_runs(tool_id);");
  await c.query("CREATE INDEX IF NOT EXISTS hc_tr_user_idx ON public.hc_tool_runs(user_id);");
  console.log("   ✅ hc_tool_runs");

  // 5. hc_blog_posts
  console.log("5/6 Creating hc_blog_posts...");
  await c.query(`
    CREATE TABLE IF NOT EXISTS public.hc_blog_posts (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      slug text unique not null,
      summary text,
      body text,
      country_scope text,
      region_scope text,
      language_code text,
      intent_cluster text,
      related_attributes_json jsonb default '[]'::jsonb,
      related_entities_json jsonb default '[]'::jsonb,
      related_tools_json jsonb default '[]'::jsonb,
      related_glossary_json jsonb default '[]'::jsonb,
      related_training_json jsonb default '[]'::jsonb,
      faq_json jsonb default '[]'::jsonb,
      ai_snippet_block_json jsonb default '{}'::jsonb,
      freshness_weight numeric(5,2) default 0,
      status text not null default 'draft',
      published_at timestamptz,
      updated_at timestamptz default now()
    );
  `);
  await c.query("CREATE INDEX IF NOT EXISTS hc_bp_intent_idx ON public.hc_blog_posts(intent_cluster);");
  await c.query("CREATE INDEX IF NOT EXISTS hc_bp_geo_idx ON public.hc_blog_posts(country_scope, region_scope);");
  await c.query("CREATE INDEX IF NOT EXISTS hc_bp_status_idx ON public.hc_blog_posts(status);");
  console.log("   ✅ hc_blog_posts");

  // 6. hc_monetization_products
  console.log("6/6 Creating hc_monetization_products...");
  await c.query(`
    CREATE TABLE IF NOT EXISTS public.hc_monetization_products (
      id uuid primary key default gen_random_uuid(),
      product_type text not null,
      product_name text not null,
      target_entity_type text,
      country_scope text,
      region_scope text,
      attribute_targeting_json jsonb default '[]'::jsonb,
      billing_model text not null,
      price_rules_json jsonb default '{}'::jsonb,
      eligibility_rules_json jsonb default '{}'::jsonb,
      upsell_trigger_rules_json jsonb default '{}'::jsonb,
      downsell_rules_json jsonb default '{}'::jsonb,
      status text not null default 'active'
    );
  `);
  await c.query("CREATE INDEX IF NOT EXISTS hc_mp_type_idx ON public.hc_monetization_products(product_type);");
  console.log("   ✅ hc_monetization_products");

  // RLS for all
  const newTables = [
    "hc_geo_overlays", "hc_glossary_terms", "hc_tools",
    "hc_tool_runs", "hc_blog_posts", "hc_monetization_products"
  ];
  for (const tbl of newTables) {
    await c.query(`ALTER TABLE public.${tbl} ENABLE ROW LEVEL SECURITY;`);
    await c.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='${tbl}' AND policyname='service_role_full_access') THEN
          CREATE POLICY "service_role_full_access" ON public.${tbl} FOR ALL TO service_role USING (true) WITH CHECK (true);
        END IF;
      END $$;
    `);
  }
  console.log("\n   ✅ RLS policies applied to all 6 tables");

  // Verify
  const r = await c.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('hc_geo_overlays','hc_glossary_terms','hc_tools','hc_tool_runs','hc_blog_posts','hc_monetization_products') ORDER BY tablename"
  );
  console.log("\n=== VERIFIED ===");
  r.rows.forEach(x => console.log("  ✓", x.tablename));
  console.log(`\n✅ All ${r.rows.length}/6 missing tables created.`);

  await c.end();
}

main().catch(e => { console.error(e); process.exit(1); });
