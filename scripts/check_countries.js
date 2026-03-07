// find all tables
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase.from('seo_locales').select('*');
    console.log('seo loc err', error);

    // query pg_tables ? We can't query pg_tables from REST api unless it is exposed.
    // Instead, let's use supabase to query any known table to confirm if ANY TABLE EXISTS
    const { data: q1, error: e1 } = await supabase.from('profiles').select('*').limit(1);
    console.log('profiles', e1);
}
main();
