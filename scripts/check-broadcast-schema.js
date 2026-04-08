const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  console.log("Checking availability_broadcasts schema:");
  try {
    const { rows: cols } = await c.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='availability_broadcasts' ORDER BY ordinal_position"
    );
    if (cols.length === 0) {
      console.log("  TABLE NOT FOUND");
    } else {
      cols.forEach(r => console.log("  " + r.column_name + ": " + r.data_type));
    }
  } catch (e) {
    console.log("Error: " + e.message);
  }

  await c.end();
})();
