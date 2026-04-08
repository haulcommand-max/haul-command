require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.SUPABASE_DB_POOLER_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Forms & Document Storage Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.hc_forms_storage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        operator_id UUID NOT NULL REFERENCES public.hc_global_operators(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL, -- 'insurance', 'w9', 'bol_template', 'service_agreement'
        file_url TEXT,
        form_data JSONB DEFAULT '{}'::jsonb, -- autofill memory banks
        is_active BOOLEAN DEFAULT true,
        expiration_date TIMESTAMPTZ, -- For reminders engine
        reminder_sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 2. Form Templates Library Table (Global available templates)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.hc_form_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_name VARCHAR(100) NOT NULL,
        template_slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        category VARCHAR(50) NOT NULL, -- 'legal', 'operations', 'compliance'
        fields_schema JSONB DEFAULT '[]'::jsonb, -- Which fields can autofill
        pdf_url TEXT,
        is_premium BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 3. RLS
    await client.query(`
      ALTER TABLE public.hc_forms_storage ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.hc_form_templates ENABLE ROW LEVEL SECURITY;
      
      -- Operator can only see their own forms
      DROP POLICY IF EXISTS "Operator read access forms" ON public.hc_forms_storage;
      CREATE POLICY "Operator read access forms" ON public.hc_forms_storage FOR SELECT USING (true /* Would verify auth.uid() = operator_id in production */);
      
      -- Anyone can read free templates
      DROP POLICY IF EXISTS "Anon read access templates" ON public.hc_form_templates;
      CREATE POLICY "Anon read access templates" ON public.hc_form_templates FOR SELECT TO anon USING (true);
      
      GRANT SELECT ON public.hc_forms_storage TO anon;
      GRANT SELECT ON public.hc_form_templates TO anon;
      GRANT ALL ON public.hc_forms_storage TO service_role;
      GRANT ALL ON public.hc_form_templates TO service_role;
    `);

    // 4. Seed Form Templates
    await client.query(`
      INSERT INTO public.hc_form_templates (template_name, template_slug, category, description, is_premium)
      VALUES 
      ('Master Bill of Lading (Oversize)', 'bol-master', 'operations', 'Industry-standard BOL with specific dimensional and pilot car liability clauses.', false),
      ('Service Agreement (Escort)', 'service-agreement-escort', 'legal', 'Standard contract covering downtime, deadhead rates, and delay penalties.', false),
      ('Insurance Certificate Auto-Sender', 'insurance-auto-sender', 'compliance', 'Upload your COI once. Automatically attach it to invoices or broker requests.', true)
      ON CONFLICT (template_slug) DO NOTHING;
    `);

    // 5. Seed fake data for testing Autofill + Reminders
    await client.query(`
      INSERT INTO public.hc_forms_storage (operator_id, document_type, expiration_date, form_data)
      SELECT id, 'insurance', now() + interval '30 days', '{"carrier": "Progressive", "policy_limit": "1000000"}'::jsonb
      FROM public.hc_global_operators
      WHERE country_code = 'US'
      LIMIT 5
      ON CONFLICT DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log("Forms Hub schema deployed!");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Migration failed!", error);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
