const { Client } = require('pg');

async function migrate() {
    const c = new Client({
        connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
        ssl: { rejectUnauthorized: false },
    });
    
    await c.connect();
    
    try {
        await c.query(`
            CREATE TABLE IF NOT EXISTS availability_broadcasts (
                operator_id TEXT PRIMARY KEY,
                availability_status TEXT NOT NULL,
                current_lat FLOAT,
                current_lng FLOAT,
                coverage_radius_miles INT,
                message TEXT,
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                last_ping_at TIMESTAMPTZ DEFAULT NOW()
            );

            -- Enable RLS
            ALTER TABLE availability_broadcasts ENABLE ROW LEVEL SECURITY;

            -- Create policy class
            DO $$ BEGIN
                CREATE POLICY "Allow public read of broadcasts" 
                ON availability_broadcasts FOR SELECT USING (true);
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                CREATE POLICY "Allow service role full access" 
                ON availability_broadcasts USING (true) WITH CHECK (true);
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);
        console.log("Created availability_broadcasts table successfully.");
    } catch (e) {
        console.error("Migration failed:", e);
    }
    
    await c.end();
}

migrate();
