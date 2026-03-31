import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function queryDB() {
    // Usually process.env.DATABASE_URL or NEXT_PUBLIC_SUPABASE_URL with connection string
    // Let's see if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
        console.log("No DATABASE_URL in .env.local, let me read it.");
        return;
    }
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    
    await client.connect();
    const res = await client.query(`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name IN ('glossary_terms', 'glossary_term_usages', 'country_tiers', 'hc_places', 'directory_listings', 'regulations', 'dictionary')
        ORDER BY table_name, ordinal_position;
    `);
    
    for (const row of res.rows) {
        console.log(`${row.table_name}: ${row.column_name} (${row.data_type})`);
    }
    await client.end();
}
queryDB();
