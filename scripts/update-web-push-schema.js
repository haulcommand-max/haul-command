const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  console.log("Updating web_push_subscriptions schema...");
  try {
    await c.query(`
      ALTER TABLE public.web_push_subscriptions
      ADD COLUMN IF NOT EXISTS role text,
      ADD COLUMN IF NOT EXISTS geo text,
      ADD COLUMN IF NOT EXISTS active boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS subscribed_at timestamp with time zone DEFAULT now(),
      ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
    `);
    console.log("  ✅ Added missing columns");
  } catch (e) {
    console.log("Error: " + e.message);
  }

  await c.end();
})();
