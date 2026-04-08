const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  try {
    const res = await c.query("SELECT COUNT(*) FROM hc_surfaces");
    console.log("hc_surfaces count: " + res.rows[0].count);
  } catch (e) {
    console.log("Error checking hc_surfaces: " + e.message);
  }
  
  try {
    const res2 = await c.query("SELECT COUNT(*) FROM hc_entities");
    console.log("hc_entities count: " + res2.rows[0].count);
  } catch (e) {
    console.log("Error checking hc_entities: " + e.message);
  }

  await c.end();
})();
