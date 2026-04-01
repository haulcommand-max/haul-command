import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkDb() {
    const client = new Client({
        connectionString: process.env.SUPABASE_DB_POOLER_URL
    });
    
    await client.connect();
    
    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'hc_global_operators';
    `);
    
    console.log(res.rows);
    await client.end();
}
checkDb();
