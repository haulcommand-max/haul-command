const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { error } = await supabase.from('sponsorship_products').select('id,name,price_cents,slot_type,placement_zone');
  console.log('sponsorship_products config error:', error);
})();
