import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

await client.connect();

// Get all enum types
const enums = await client.query(`
    SELECT t.typname, e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname IN ('place_status', 'claim_status', 'source_type')
    ORDER BY t.typname, e.enumsortorder
`);
console.log('Enum values:', JSON.stringify(enums.rows, null, 2));

// Also check surface_category_key sample values
const cats = await client.query(`SELECT DISTINCT surface_category_key FROM hc_places WHERE surface_category_key IS NOT NULL LIMIT 20`);
console.log('surface_category_key samples:', cats.rows.map(r => r.surface_category_key));

await client.end();
