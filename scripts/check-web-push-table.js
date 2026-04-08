const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  console.log("Checking web_push_subscriptions schema:");
  try {
    const { rows: cols } = await c.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='web_push_subscriptions' ORDER BY ordinal_position"
    );
    if (cols.length === 0) {
      console.log("  TABLE NOT FOUND");
      
      // Let's create it since we need it for the Push APIs
      console.log("Creating web_push_subscriptions table...");
      await c.query(`
        CREATE TABLE IF NOT EXISTS public.web_push_subscriptions (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
            endpoint text UNIQUE NOT NULL,
            p256dh text NOT NULL,
            auth text NOT NULL,
            user_agent text,
            role text,
            geo text,
            active boolean DEFAULT true,
            subscribed_at timestamp with time zone,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );
      `);
      console.log("  ✅ Created table");
    } else {
      cols.forEach(r => console.log("  " + r.column_name + ": " + r.data_type));
    }
  } catch (e) {
    console.log("Error: " + e.message);
  }

  await c.end();
})();
