require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.SUPABASE_DB_POOLER_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // -------------------------------------------------------------
    // 1. Load Type Library
    // -------------------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.hc_load_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        category VARCHAR(50) NOT NULL, -- 'construction', 'energy', 'military', 'aerospace'
        typical_dimensions JSONB DEFAULT '{}'::jsonb, -- { length, width, height, weight }
        escort_requirements TEXT,
        industry_risks TEXT,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // -------------------------------------------------------------
    // 2. Permitting SLA Tracker
    // -------------------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.hc_permit_slas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        jurisdiction_code VARCHAR(10) NOT NULL UNIQUE, -- 'TX', 'CA', 'FL', 'US-ALL'
        jurisdiction_name VARCHAR(100) NOT NULL,
        current_processing_time_hours INTEGER NOT NULL,
        historical_average_hours INTEGER,
        last_updated TIMESTAMPTZ DEFAULT now(),
        trend VARCHAR(20), -- 'improving', 'degrading', 'stable'
        delay_notice TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // -------------------------------------------------------------
    // 3. Corridor Pricing History
    // -------------------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.hc_corridor_pricing (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        corridor_slug VARCHAR(100) NOT NULL,
        month_start DATE NOT NULL,
        avg_rate_per_mile NUMERIC(10,2) NOT NULL,
        min_rate_per_mile NUMERIC(10,2),
        max_rate_per_mile NUMERIC(10,2),
        volume_index INTEGER, -- 1-100 indicating load volume
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(corridor_slug, month_start)
      );
    `);

    // -------------------------------------------------------------
    // 4. Certification Timeline / Requirements
    // -------------------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.hc_certification_paths (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        jurisdiction_code VARCHAR(10) NOT NULL UNIQUE,
        jurisdiction_name VARCHAR(100) NOT NULL,
        requires_certification BOOLEAN DEFAULT true,
        training_hours INTEGER,
        certification_cost NUMERIC(10,2),
        renewal_period_years INTEGER,
        reciprocity_states JSONB DEFAULT '[]'::jsonb,
        official_link TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // -------------------------------------------------------------
    // RLS Policies & Grants
    // -------------------------------------------------------------
    const tables = ['hc_load_types', 'hc_permit_slas', 'hc_corridor_pricing', 'hc_certification_paths'];
    for (const table of tables) {
      await client.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
      await client.query(`DROP POLICY IF EXISTS "Anon read access ${table}" ON public.${table};`);
      await client.query(`CREATE POLICY "Anon read access ${table}" ON public.${table} FOR SELECT TO anon USING (true);`);
      await client.query(`GRANT SELECT ON public.${table} TO anon;`);
      await client.query(`GRANT ALL ON public.${table} TO service_role;`);
    }

    // -------------------------------------------------------------
    // Seed Data
    // -------------------------------------------------------------
    
    // Load Types
    await client.query(`
      INSERT INTO public.hc_load_types (name, slug, category, typical_dimensions, escort_requirements, industry_risks) VALUES 
      ('Wind Turbine Blade', 'wind-turbine-blade', 'energy', '{"length":"150-250ft", "width":"12ft", "height":"14ft", "weight":"30,000 lbs"}', 'Often requires 2+ escorts (front and rear) and a tillerman. Specialized route surveys mandatory.', 'High sweep radius on corners. Tail swing risk.'),
      ('Excavator (Large)', 'large-excavator', 'construction', '{"length":"40ft", "width":"11ft", "height":"13ft", "weight":"80,000+ lbs"}', 'Standard oversized load requirements. 1 escort typically required if over 10-12ft wide depending on state.', 'Weight distribution issues, over-height risks if boom not lowered.'),
      ('Electrical Transformer', 'electrical-transformer', 'energy', '{"length":"20ft", "width":"12ft", "height":"15ft", "weight":"150,000+ lbs"}', 'Requires superload permits, heavy-duty escort vehicles, and sometimes bucket trucks to lift power lines.', 'Extreme weight requires bridge engineering surveys. Height is a major hazard.')
      ON CONFLICT (slug) DO NOTHING;
    `);

    // Permit SLAs
    await client.query(`
      INSERT INTO public.hc_permit_slas (jurisdiction_code, jurisdiction_name, current_processing_time_hours, historical_average_hours, trend, delay_notice) VALUES 
      ('TX', 'Texas (TxDMV)', 2, 4, 'improving', null),
      ('CA', 'California (Caltrans)', 48, 24, 'degrading', 'Weather-related route restrictions causing backlog in permit approvals.'),
      ('FL', 'Florida (FDOT)', 4, 6, 'stable', null),
      ('PA', 'Pennsylvania (PennDOT)', 72, 48, 'degrading', 'Currently migrating to new online permit system. Expect delays.')
      ON CONFLICT (jurisdiction_code) DO NOTHING;
    `);

    // Corridor Pricing
    await client.query(`
      INSERT INTO public.hc_corridor_pricing (corridor_slug, month_start, avg_rate_per_mile, min_rate_per_mile, max_rate_per_mile, volume_index) VALUES 
      ('i-10-tx-fl', '2026-01-01', 1.85, 1.50, 2.20, 85),
      ('i-10-tx-fl', '2026-02-01', 1.90, 1.55, 2.30, 88),
      ('i-10-tx-fl', '2026-03-01', 2.05, 1.70, 2.50, 92),
      ('i-10-tx-fl', '2026-04-01', 2.15, 1.80, 2.75, 95),
      ('i-80-wy-nv', '2026-03-01', 2.45, 2.00, 3.10, 60),
      ('i-80-wy-nv', '2026-04-01', 2.55, 2.15, 3.25, 55)
      ON CONFLICT (corridor_slug, month_start) DO NOTHING;
    `);

    // Certification Paths
    await client.query(`
      INSERT INTO public.hc_certification_paths (jurisdiction_code, jurisdiction_name, requires_certification, training_hours, certification_cost, renewal_period_years, reciprocity_states) VALUES 
      ('FL', 'Florida', true, 8, 150.00, 4, '["GA", "NC", "VA"]'::jsonb),
      ('WA', 'Washington', true, 8, 200.00, 3, '["OR", "CO", "UT"]'::jsonb),
      ('TX', 'Texas', false, 0, 0.00, 0, '[]'::jsonb),
      ('NY', 'New York', true, 12, 350.00, 3, '[]'::jsonb)
      ON CONFLICT (jurisdiction_code) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log("Tier 3 Data Schema deployed successfully!");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Migration failed!", error);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
