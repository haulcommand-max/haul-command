const fs = require('fs');
let p = 'supabase/migrations/20260412_command_layer_money_triggers.sql';
if (fs.existsSync(p)) {
  let d = fs.readFileSync(p, 'utf8');
  d = d.replace(/v_source/g, 'v_entity_type');
  d = d.replace(/source, /g, 'entity_type, ');
  d = d.replace(/'source'/g, "'entity_type'");
  fs.writeFileSync(p, d);
}
