require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  const partners = [
    {
      slot_id: 'directory_native_insurance',
      company_name: 'Wexford Commercial Insurance',
      headline: 'Specialized Pilot Car Coverage',
      description: 'The preferred commercial policy for high-pole and AV-ready pilot cars. Get quoted in 15 minutes. $2M general liability, $1M professional.',
      cta_text: 'Get a Quote',
      url: 'https://example.com/wexford-insurance-quote',
      category: 'insurance',
      is_active: true,
      cpc_cents: 850
    }
  ];

  for (const p of partners) {
    const { error } = await supabase.from('ad_slots').upsert(p, { onConflict: 'slot_id' });
    if (error) console.error(error);
    else console.log('Seeded ad slot:', p.slot_id);
  }
}

seed();
