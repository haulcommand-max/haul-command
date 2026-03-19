const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    // Check what columns exist in hc_identities
    const { data, error } = await sb.from('hc_identities').select('*').limit(1);
    if (error) {
        console.log('ERROR:', error.message);
        // Try checking if table exists at all
        const { data: tables, error: tErr } = await sb.rpc('pg_tables_list').catch(() => ({ data: null, error: null }));
        console.log('Table check result:', tErr ? tErr.message : 'OK');
    } else {
        if (data && data.length > 0) {
            console.log('COLUMNS:', Object.keys(data[0]).join(', '));
            console.log('SAMPLE:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('TABLE EXISTS BUT EMPTY');
        }
    }

    // Also check directory_listings
    const { data: dl, error: dlErr } = await sb.from('directory_listings').select('*').limit(1);
    if (dlErr) {
        console.log('directory_listings ERROR:', dlErr.message);
    } else {
        if (dl && dl.length > 0) {
            console.log('\ndirectory_listings COLUMNS:', Object.keys(dl[0]).join(', '));
        } else {
            console.log('\ndirectory_listings: TABLE EXISTS BUT EMPTY');
        }
    }

    // Check profiles table  
    const { data: pr, error: prErr } = await sb.from('profiles').select('*').limit(1);
    if (prErr) {
        console.log('profiles ERROR:', prErr.message);
    } else {
        if (pr && pr.length > 0) {
            console.log('\nprofiles COLUMNS:', Object.keys(pr[0]).join(', '));
        } else {
            console.log('\nprofiles: TABLE EXISTS BUT EMPTY');
        }
    }

    process.exit(0);
}

main();
