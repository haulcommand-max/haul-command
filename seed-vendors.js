require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  const vendors = [
    {
      legal_name: 'Wexford Commercial Insurance LLC',
      dba_name: 'Wexford Commercial Insurance',
      vendor_type: 'insurance',
      slug: 'wexford-insurance',
      country_code: 'US',
      avg_rating: 4.9,
      tier: 'elite',
      plan: 'pro',
      verified_at: new Date().toISOString(),
      is_active: true,
      metadata: { headline: 'Specialized Pilot Car Coverage', offer: 'Get quoted in 15 minutes. $2M general liability, $1M professional.' }
    },
    {
      legal_name: 'Nova Permits & Routing Inc.',
      dba_name: 'Nova Permits & Routing',
      vendor_type: 'permits',
      slug: 'nova-permits',
      country_code: 'US',
      avg_rating: 4.8,
      tier: 'elite',
      plan: 'pro',
      verified_at: new Date().toISOString(),
      is_active: true,
      metadata: { headline: 'Multi-State Oversize Permits Instantly', offer: 'We secure your oversize and superload permits and route surveys across 50 states within hours.' }
    },
    {
      legal_name: 'Beacon High-Pole Equip Co',
      dba_name: 'Beacon High-Pole Equip',
      vendor_type: 'equipment',
      slug: 'beacon-high-pole',
      country_code: 'US',
      avg_rating: 4.7,
      tier: 'partner',
      plan: 'pro',
      verified_at: new Date().toISOString(),
      is_active: true,
      metadata: { headline: 'FMCSA-Compliant Safety Equipment', offer: 'Class 2 apparel, high poles, and MUTCD-compliant strobes. Ship any US state in 24 hours.' }
    }
  ];

  for (const v of vendors) {
      delete v.avg_rating;
      const { error } = await supabase.from('hc_vendors').insert(v);
    if (error) console.error(error);
    else console.log('Seeded vendor:', v.slug);
  }
}

seed();
