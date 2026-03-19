const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const { count } = await sb.from('directory_listings').select('*', { count: 'exact', head: true });
    console.log('TOTAL DIRECTORY LISTINGS:', count);

    const { data } = await sb.from('directory_listings').select('entity_type');
    const types = {};
    (data || []).forEach(d => { types[d.entity_type] = (types[d.entity_type] || 0) + 1; });
    console.log('BY TYPE:', JSON.stringify(types, null, 2));
    process.exit(0);
}
main();
