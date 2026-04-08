import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    const client = new pg.Client({
        connectionString: process.env.SUPABASE_DB_POOLER_URL
    });
    
    await client.connect();
    
    try {
        const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_name = 'dispatch_events';`);
        console.log("dispatch_events exists:", res.rows.length > 0);
        
        if (res.rows.length > 0) {
           const cols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'dispatch_events';`);
           console.log("Cols:", cols.rows);
        }
    } catch(e) {
        console.log(e);
    }
    
    await client.end();
}
check();
