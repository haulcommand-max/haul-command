const { Client } = require("pg");
(async () => {
  const c = new Client({
    connectionString: "postgresql://postgres.hvjyfyzotqobfkakjozp:EvuphRxN3zcgYSk8@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const res = await c.query("SELECT policyname, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'glossary_terms' OR tablename = 'glossary_public'");
  console.log(res.rows);
  await c.end();
})();
