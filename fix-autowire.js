const fs = require('fs');
let p = 'supabase/migrations/20260412_command_layer_auto_wire.sql';
if (fs.existsSync(p)) {
  let d = fs.readFileSync(p, 'utf8');
  d = d.replace(/, trigger\)/g, ')');
  d = d.replace(/, 'pg_cron_wrapper'/g, '');
  d = d.replace(/r\.trigger AS source,/g, "'cron' AS source,");
  fs.writeFileSync(p, d);
}
