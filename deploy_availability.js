require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.SUPABASE_DB_POOLER_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Operator Availability table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.hc_broadcast_availability (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        operator_id UUID NOT NULL REFERENCES public.hc_global_operators(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'available_today',
        willing_to_deadhead_miles INTEGER DEFAULT 100,
        equipment_notes TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 2. View: v_available_escorts
    await client.query(`
      CREATE OR REPLACE VIEW public.v_available_escorts AS
      SELECT 
        a.id,
        a.status,
        a.willing_to_deadhead_miles,
        a.equipment_notes,
        a.expires_at,
        a.created_at,
        o.name AS operator_name,
        o.slug AS operator_slug,
        o.city,
        o.admin1_code AS state_code,
        o.country_code,
        o.confidence_score AS trust_score,
        CASE WHEN o.is_claimed THEN 'claimed' ELSE 'unclaimed' END AS claim_status,
        NULL AS phone,
        ARRAY[o.role_primary] AS service_types
      FROM public.hc_broadcast_availability a
      JOIN public.hc_global_operators o ON a.operator_id = o.id
      WHERE a.expires_at > now();
    `);

    // 3. RLS
    await client.query(`
      ALTER TABLE public.hc_broadcast_availability ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Anon read access availability" ON public.hc_broadcast_availability;
      CREATE POLICY "Anon read access availability" ON public.hc_broadcast_availability FOR SELECT TO anon USING (true);
      
      GRANT SELECT ON public.hc_broadcast_availability TO anon;
      GRANT SELECT ON public.v_available_escorts TO anon;
      GRANT ALL ON public.hc_broadcast_availability TO service_role;
      GRANT ALL ON public.v_available_escorts TO service_role;
    `);

    // 4. Seed random availability
    await client.query(`
      INSERT INTO public.hc_broadcast_availability (operator_id, status, willing_to_deadhead_miles, expires_at)
      SELECT id, 
             CASE WHEN random() > 0.5 THEN 'available_now' ELSE 'available_today' END,
             (random() * 200 + 50)::integer,
             now() + interval '2 days'
      FROM public.hc_global_operators
      WHERE country_code = 'US'
      LIMIT 20
      ON CONFLICT DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log("Availability wiring successful!");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Migration failed!", error);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
