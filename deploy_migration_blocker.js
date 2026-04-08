require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.SUPABASE_DB_POOLER_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Create table `country_ingest_queue`
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.country_ingest_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        country_code VARCHAR(10) NOT NULL UNIQUE,
        region_code VARCHAR(10),
        status VARCHAR(20) DEFAULT 'pending', -- pending, ingesting, done, failed
        priority_tier VARCHAR(20) DEFAULT 'standard', -- gold, priority, standard
        last_scan_at TIMESTAMPTZ,
        error_log TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 2. Create table `regulation_sources`
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.regulation_sources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        country_code VARCHAR(10) NOT NULL,
        region_code VARCHAR(10), -- e.g., 'US-FL'
        category VARCHAR(50) NOT NULL, -- e.g., 'escort_training', 'heavy_haul_permits'
        document_title TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        confidence_state VARCHAR(50) DEFAULT 'partially_verified', -- verified_current, verified_but_review_due, partially_verified, etc.
        source_type VARCHAR(50) DEFAULT 'government', -- government, workbook, academic, third_party
        extracted_content JSONB DEFAULT '{}'::jsonb,
        last_verified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 3. RLS Policies
    await client.query(`
      ALTER TABLE public.country_ingest_queue ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.regulation_sources ENABLE ROW LEVEL SECURITY;

      -- Anon read access to regulation_sources
      DROP POLICY IF EXISTS "Anon read access regulation_sources" ON public.regulation_sources;
      CREATE POLICY "Anon read access regulation_sources" ON public.regulation_sources FOR SELECT TO anon USING (true);
      
      DROP POLICY IF EXISTS "Anon read access country_ingest_queue" ON public.country_ingest_queue;
      CREATE POLICY "Anon read access country_ingest_queue" ON public.country_ingest_queue FOR SELECT TO anon USING (true);
      
      -- Grant anon usage
      GRANT SELECT ON public.regulation_sources TO anon;
      GRANT SELECT ON public.country_ingest_queue TO anon;
      
      -- Grant service_role everything
      GRANT ALL ON public.regulation_sources TO service_role;
      GRANT ALL ON public.country_ingest_queue TO service_role;
    `);

    // 4. Seed Florida Escort Workbook as per user context
    await client.query(`
      INSERT INTO public.regulation_sources (country_code, region_code, category, document_title, url, confidence_state, source_type)
      VALUES 
      ('US', 'US-FL', 'escort_training', 'Florida Pilot/Escort Flagging – Participant Workbook (2025)', 'https://www.eng.ufl.edu/techtransfer/wp-content/uploads/sites/251/2025/11/PE-Participant-Workbook-04-01-2025.pdf', 'verified_current', 'academic'),
      ('US', 'US-FL', 'escort_certification', 'UF Pilot/Escort Flagging Qualified Florida Escort Directory', 'https://techtransfer.ce.ufl.edu/training/pilot-escort-flagging/find-a-qualified-florida-escort/', 'verified_current', 'academic')
      ON CONFLICT (url) DO NOTHING;
    `);

    // 5. Seed US & Canada into queue
    await client.query(`
      INSERT INTO public.country_ingest_queue (country_code, priority_tier, status)
      VALUES 
      ('US', 'gold', 'pending'),
      ('CA', 'gold', 'pending'),
      ('AU', 'priority', 'pending'),
      ('NZ', 'priority', 'pending')
      ON CONFLICT (country_code) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log("Migration successful!");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Migration failed!", error);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
