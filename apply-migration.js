import { Client } from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
    const client = new Client({
        connectionString: process.env.SUPABASE_DB_POOLER_URL
    });
    
    await client.connect();
    console.log("Connected directly to Supabase.");
    const migrationFile = process.argv[2] || 'supabase/migrations/20260329_glossary_120_countries.sql';
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    try {
        await client.query(sql);
        console.log("Migration executed successfully.");
    } catch(e) {
        console.error("Migration failed:", e);
    }
    await client.end();
}
migrate();
