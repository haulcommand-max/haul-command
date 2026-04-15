import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

await client.connect();

const tables = ['hc_corridors', 'hc_surfaces', 'hc_places', 'operator_profiles', 'hc_jobs'];
for (const t of tables) {
    try {
        const r = await client.query(
            `SELECT column_name, data_type FROM information_schema.columns 
             WHERE table_name = $1 AND table_schema = 'public'
             ORDER BY ordinal_position`,
            [t]
        );
        if (r.rows.length > 0) {
            console.log(`\n=== ${t} ===`);
            r.rows.forEach(row => console.log(`  ${row.column_name}: ${row.data_type}`));
        } else {
            console.log(`\n=== ${t}: TABLE DOES NOT EXIST ===`);
        }
    } catch (e) {
        console.log(`\n=== ${t}: ERROR: ${e.message} ===`);
    }
}

await client.end();
