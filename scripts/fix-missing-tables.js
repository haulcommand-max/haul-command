const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  console.log("Connected.\n");

  // hc_page_surfaces
  console.log("Creating hc_page_surfaces...");
  await c.query(`
    CREATE TABLE IF NOT EXISTS public.hc_page_surfaces (
      id uuid primary key default gen_random_uuid(),
      entity_id uuid references public.hc_entities(id) on delete set null,
      page_family text not null,
      slug text unique not null,
      title text,
      meta_description text,
      h1 text,
      body_preview text,
      country_code text,
      region_code text,
      city_name text,
      language_code text,
      intent_cluster text,
      ai_snippet_block_json jsonb default '{}'::jsonb,
      faq_json jsonb default '[]'::jsonb,
      proof_block_json jsonb default '{}'::jsonb,
      conversion_cta_json jsonb default '{}'::jsonb,
      freshness_weight numeric(5,2) default 0,
      indexable boolean default true,
      canonical_url text,
      status text not null default 'draft',
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  `);
  await c.query("CREATE INDEX IF NOT EXISTS hc_ps_entity_idx ON public.hc_page_surfaces(entity_id);");
  await c.query("CREATE INDEX IF NOT EXISTS hc_ps_family_idx ON public.hc_page_surfaces(page_family);");
  await c.query("CREATE INDEX IF NOT EXISTS hc_ps_geo_idx ON public.hc_page_surfaces(country_code, region_code);");
  await c.query("CREATE INDEX IF NOT EXISTS hc_ps_intent_idx ON public.hc_page_surfaces(intent_cluster);");
  await c.query("CREATE INDEX IF NOT EXISTS hc_ps_status_idx ON public.hc_page_surfaces(status);");
  console.log("  ✅ hc_page_surfaces\n");

  // hc_ai_scores
  console.log("Creating hc_ai_scores...");
  await c.query(`
    CREATE TABLE IF NOT EXISTS public.hc_ai_scores (
      id uuid primary key default gen_random_uuid(),
      target_type text not null,
      target_id uuid not null,
      completeness_score numeric(5,2) default 0,
      attribute_coverage_score numeric(5,2) default 0,
      proof_density_score numeric(5,2) default 0,
      freshness_score numeric(5,2) default 0,
      review_specificity_score numeric(5,2) default 0,
      geo_fit_score numeric(5,2) default 0,
      language_fit_score numeric(5,2) default 0,
      internal_link_score numeric(5,2) default 0,
      query_coverage_score numeric(5,2) default 0,
      conversion_readiness_score numeric(5,2) default 0,
      overall_ai_readiness_score numeric(5,2) default 0,
      score_payload_json jsonb default '{}'::jsonb,
      scored_at timestamptz default now()
    );
  `);
  await c.query("CREATE INDEX IF NOT EXISTS hc_as_target_idx ON public.hc_ai_scores(target_type, target_id);");
  await c.query("CREATE INDEX IF NOT EXISTS hc_as_overall_idx ON public.hc_ai_scores(overall_ai_readiness_score);");
  console.log("  ✅ hc_ai_scores\n");

  // hc_agent_jobs
  console.log("Creating hc_agent_jobs...");
  await c.query(`
    CREATE TABLE IF NOT EXISTS public.hc_agent_jobs (
      id uuid primary key default gen_random_uuid(),
      agent_name text not null,
      job_type text not null,
      target_type text not null,
      target_id uuid,
      input_payload_json jsonb default '{}'::jsonb,
      output_payload_json jsonb default '{}'::jsonb,
      status text not null default 'queued',
      priority integer default 100,
      created_at timestamptz default now(),
      started_at timestamptz,
      completed_at timestamptz,
      error_text text
    );
  `);
  await c.query("CREATE INDEX IF NOT EXISTS hc_aj_queue_idx ON public.hc_agent_jobs(agent_name, status, priority);");
  console.log("  ✅ hc_agent_jobs\n");

  // RLS
  for (const tbl of ["hc_page_surfaces", "hc_ai_scores", "hc_agent_jobs"]) {
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
  console.log("  ✅ RLS policies\n");

  // Verify
  const r = await c.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('hc_ai_scores','hc_page_surfaces','hc_agent_jobs') ORDER BY tablename"
  );
  console.log("Verified:");
  r.rows.forEach(x => console.log("  ✓", x.tablename));

  await c.end();
})();
