const fs=require('fs');
const files=[
  '20260412_command_layer_roi_engines_v2.sql',
  '20260412_command_layer_paperclip_maximum_yield.sql',
  '20260412_command_layer_money_triggers.sql',
  '20260412_command_layer_maxout_agents.sql',
  '20260412_command_layer_wire_all_remaining.sql'
];
files.forEach(f=>{
  let p='supabase/migrations/'+f;
  if (!fs.existsSync(p)) return;
  let d=fs.readFileSync(p,'utf8');
  d = d.replace(/'event'/g, "'worker'").replace(/'cron'/g, "'worker'");
  fs.writeFileSync(p, d);
});
