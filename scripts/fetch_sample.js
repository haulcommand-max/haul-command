require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data, error } = await supabase
        .from('hc_discovery_entities')
        .select('*')
        .order('id', { ascending: false })
        .limit(3);
        
    if (error) console.error(error);
    console.log(JSON.stringify(data, null, 2));
}

run();
