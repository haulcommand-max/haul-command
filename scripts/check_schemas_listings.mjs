import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    const client = new pg.Client({
        connectionString: process.env.SUPABASE_DB_POOLER_URL
    });
    
    await client.connect();
    
    try {
        const res = await client.query(`SELECT table_schema, table_name FROM information_schema.tables WHERE table_name ILIKE '%listing%';`);
        console.log("All schemas listing tables:", res.rows);
    } catch(e) {
        console.log(e);
    }
    
    await client.end();
}
check();
