require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seedAdGrid() {
  // 1. Get 3 real operators
  const { data: operators } = await supabase.from('hc_global_operators').select('id').limit(3);
  if (!operators || operators.length < 3) return console.log('Not enough operators');

  const inventory = [
    {
      country_code: 'us',
      surface_level: 'global',
      target_node: 'united-states-main',
      slot_name: 'premium_vendor_partner',
      sponsor_operator_id: operators[0].id,
      base_price_cents: 85000
    },
    {
      country_code: 'us',
      surface_level: 'tool',
      target_node: 'escrow_service',
      slot_name: 'exclusive_partner',
      sponsor_operator_id: operators[1].id,
      base_price_cents: 120000
    },
    {
      country_code: 'us',
      surface_level: 'region',
      target_node: 'texas',
      slot_name: 'corridor_sponsor',
      sponsor_operator_id: operators[2].id,
      base_price_cents: 45000
    }
  ];

  for (const inv of inventory) {
    const { error } = await supabase.from('hc_adgrid_inventory').insert(inv);
    if (error) console.error(error);
      else console.log('Seeded AdGrid for node:', inv.target_node, 'with sponsor:', inv.sponsor_operator_id);
  }
}

seedAdGrid();
