import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.local' });
const pgUrl = process.env.DATABASE_URL;
const client = new Client({ connectionString: pgUrl });
client.connect().then(async () => {
    const res = await client.query(`SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'search_documents_entity_type_check'`);
    console.log(res.rows);
    client.end();
}).catch(console.error);
