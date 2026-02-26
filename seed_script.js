const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function main() {
    try {
        console.log('Reading seed_ingested_drivers.sql...');
        const sql = fs.readFileSync('seed_ingested_drivers.sql', 'utf8');

        // Extracting just the values to insert them safely via SDK since RPC execute might not be set up
        const lines = sql.split('\n');
        const values = [];

        for (const line of lines) {
            if (line.trim() && line.includes('(') && line.includes(')')) {
                // Parse lines like ('PENDING_VERIFICATION', 'US', 'US-AL', NULL, NULL) -- Company Name First Last | email@domain.com,
                const match = line.match(/\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(NULL|'[^']+'),\s*(NULL|'[^']+')\)\s*--\s*(.+?)\s*\|\s*(.+?),?/);
                if (match) {
                    const status = match[1];
                    const country = match[2];
                    const jurisdiction = match[3];

                    const metaStr = match[6].trim();
                    // we could also split name but let's just insert as available data 

                    values.push({
                        status,
                        home_market_id: country,
                        home_jurisdiction_id: jurisdiction,
                        availability_status: 'seed_unclaimed',
                        // In a real flow, we'd also insert into `profiles` with the extracted name/email.
                    });
                }
            }
        }

        console.log(`Found ${values.length} records. Let's insert them safely in batches of 50.`);
        let inserted = 0;
        for (let i = 0; i < values.length; i += 50) {
            const batch = values.slice(i, i + 50);
            const { error } = await supabase.from('driver_profiles').insert(batch);
            if (error) {
                console.error('Error inserting batch:', error.message);
            } else {
                inserted += batch.length;
            }
        }
        console.log(`Successfully seeded ${inserted} operators from SQL file.`);

    } catch (e) {
        console.error('Fatal error:', e);
    }
}

main();
