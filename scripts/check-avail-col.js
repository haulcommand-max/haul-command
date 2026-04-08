const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  try {
    const res = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='hc_global_operators' AND column_name='availability_status'");
    console.log("hc_global_operators: ", res.rows.length > 0 ? "HAS availability_status" : "NO availability_status");
  } catch (e) {
    console.log("Error: " + e.message);
  }

  await c.end();
})();
