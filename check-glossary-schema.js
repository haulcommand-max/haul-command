import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
    console.log("Checking tables...");
    
    const tables = ['glossary_terms', 'glossary_term_usages', 'glossary_public', 'dictionary', 'regulations', 'compliance_rules', 'provider_directory', 'directory_listings', 'hc_places', 'categories', 'country_tiers'];

    for (const table of tables) {
        // Just fetch 1 row to see columns
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table ${table} error:`, error.message);
        } else {
            console.log(`Table ${table} exists. Columns:`, data.length > 0 ? Object.keys(data[0]).join(', ') : 'no data, but exists');
        }
    }

    // Try to get actual schema columns via RPC or REST if possible, but data keys work if there's data.
    // Let's insert a dummy row if no data (and then delete it) to see columns? No, that's risky.
    // Let's just do a distinct query if possible. Or we can just use psql if local. But we don't have local DB, we have remote.
}

checkTables();
