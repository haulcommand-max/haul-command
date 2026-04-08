import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    const client = new pg.Client({
        connectionString: process.env.SUPABASE_DB_POOLER_URL
    });
    
    await client.connect();
    
    try {
        const res = await client.query(`
            SELECT proname 
            FROM pg_proc 
            WHERE proname ILIKE '%state_counts%';
        `);
        console.log("Functions inside db:", res.rows);
    } catch(e) {
        console.log(e);
    }
    
    await client.end();
}
check();
