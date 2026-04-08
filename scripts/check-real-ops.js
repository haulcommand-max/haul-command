const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  try {
    const res = await c.query("SELECT count(*) FROM hc_real_operators");
    console.log("hc_real_operators count: " + res.rows[0].count);
  } catch (e) {
    console.log("Error hc_real_operators: " + e.message);
  }

  await c.end();
})();
