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
      call_to_action: 'Get a Quote',
      url: 'https://example.com/wexford-insurance-quote',
      category: 'insurance',
      is_active: true,
      cpc_cents: 850
    },
    {
       slot_id: 'directory_native_permits',
       company_name: 'Nova Permits & Routing',
       headline: 'Multi-State Oversize Permits Instantly',
       description: 'Stop waiting on DOT lines. We secure your oversize and superload permits and route surveys across 50 states within hours.',
       call_to_action: 'Order Permit',
       url: 'https://example.com/nova-permits',
       category: 'permits',
       is_active: true,
       cpc_cents: 1200
    },
    {
       slot_id: 'directory_native_equipment',
       company_name: 'Beacon High-Pole Equip',
       headline: 'FMCSA-Compliant Safety Equipment',
       description: 'Class 2 apparel, high poles, and MUTCD-compliant strobes. The gear that gets you passed by the DOT the first time. Ship any US state in 24 hours.',
       call_to_action: 'Shop Gear',
       url: 'https://example.com/beacon-gear',
       category: 'equipment',
       is_active: true,
       cpc_cents: 450
    }
  ];

  for (const p of partners) {
    const { error } = await supabase.from('ad_slots').upsert(p, { onConflict: 'slot_id' });
    if (error) console.error(error);
    else console.log('Seeded ad slot:', p.slot_id);
  }
}

seed();
