import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
    const tables = ['glossary_terms', 'glossary_term_usages', 'glossary_public', 'country_tiers', 'dictionary', 'regulations'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table ${table} error:`, error.message);
        } else {
            if (data && data.length > 0) {
                console.log(`Table ${table} exists. Columns:`, Object.keys(data[0]).join(', '));
            } else {
                console.log(`Table ${table} exists, but is empty. Cannot determine columns from simply fetching.`);
            }
        }
    }
}
checkTables();
