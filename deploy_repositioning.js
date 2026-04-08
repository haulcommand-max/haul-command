require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.SUPABASE_DB_POOLER_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Repositioning / Backhaul Broadcast table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.hc_reposition_broadcasts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        operator_id UUID NOT NULL REFERENCES public.hc_global_operators(id) ON DELETE CASCADE,
        origin_city VARCHAR(100),
        origin_state VARCHAR(10) NOT NULL,
        destination_city VARCHAR(100),
        destination_state VARCHAR(10) NOT NULL,
        route_corridor TEXT,
        available_from TIMESTAMPTZ NOT NULL,
        available_to TIMESTAMPTZ NOT NULL,
        equipment_notes TEXT,
        status VARCHAR(20) DEFAULT 'active', -- active, filled, expired
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 2. View: v_reposition_broadcasts
    await client.query(`
      CREATE OR REPLACE VIEW public.v_reposition_broadcasts AS
      SELECT 
        b.id,
        b.origin_city,
        b.origin_state,
        b.destination_city,
        b.destination_state,
        b.route_corridor,
        b.available_from,
        b.available_to,
        b.equipment_notes,
        b.status,
        b.created_at,
        o.name AS operator_name,
        o.slug AS operator_slug,
        o.confidence_score AS trust_score,
        CASE WHEN o.is_claimed THEN 'claimed' ELSE 'unclaimed' END AS claim_status,
        ARRAY[o.role_primary] AS service_types
      FROM public.hc_reposition_broadcasts b
      JOIN public.hc_global_operators o ON b.operator_id = o.id
      WHERE b.available_to > now() AND b.status = 'active';
    `);

    // 3. RLS
    await client.query(`
      ALTER TABLE public.hc_reposition_broadcasts ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Anon read access reposition_broadcasts" ON public.hc_reposition_broadcasts;
      CREATE POLICY "Anon read access reposition_broadcasts" ON public.hc_reposition_broadcasts FOR SELECT TO anon USING (true);
      
      GRANT SELECT ON public.hc_reposition_broadcasts TO anon;
      GRANT SELECT ON public.v_reposition_broadcasts TO anon;
      GRANT ALL ON public.hc_reposition_broadcasts TO service_role;
      GRANT ALL ON public.v_reposition_broadcasts TO service_role;
    `);

    // 4. Seed random backhaul broadcasts to warm the market
    await client.query(`
      INSERT INTO public.hc_reposition_broadcasts (operator_id, origin_city, origin_state, destination_city, destination_state, route_corridor, available_from, available_to)
      SELECT id, 
             city, 
             admin1_code,
             'Dallas',
             'TX',
             'I-40 to I-35S',
             now(), 
             now() + interval '5 days'
      FROM public.hc_global_operators
      WHERE country_code = 'US' AND admin1_code IN ('CA', 'NV', 'NM', 'AZ')
      LIMIT 10
      ON CONFLICT DO NOTHING;
    `);
    
    await client.query(`
      INSERT INTO public.hc_reposition_broadcasts (operator_id, origin_city, origin_state, destination_city, destination_state, route_corridor, available_from, available_to)
      SELECT id, 
             city, 
             admin1_code,
             'Chicago',
             'IL',
             'I-90',
             now() + interval '1 day', 
             now() + interval '4 days'
      FROM public.hc_global_operators
      WHERE country_code = 'US' AND admin1_code IN ('NY', 'PA', 'OH', 'MI')
      LIMIT 10
      ON CONFLICT DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log("Repositioning schema deployed!");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Migration failed!", error);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
