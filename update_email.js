const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:XMq7v0MmNQevkHR@localhost:5432/postgres'
});
client.connect()
  .then(() => client.query('UPDATE "user" SET email = \'haulcommand@gmail.com\' WHERE email = \'admin@haulcommand.com\' RETURNING *'))
  .then(res => console.log('Updated user:', res.rows))
  .catch(console.error)
  .finally(() => client.end());
