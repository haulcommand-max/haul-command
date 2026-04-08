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
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'operator_listings';
        `);
        console.log("Columns in operator_listings:", res.rows);
        
        const res2 = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'providers';
        `);
        console.log("Columns in providers:", res2.rows);
    } catch(e) {
        console.log(e);
    }
    
    await client.end();
}
check();
