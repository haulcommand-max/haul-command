const fs = require('fs');
const path = require('path');
const env = require('dotenv').config({path: '.env.local'}).parsed;
const { Client } = require('pg');

async function run() {
    const c = new Client({ connectionString: env.SUPABASE_DB_POOLER_URL });
    await c.connect();
    
    // Exact order
    const files = [
      '20260412_command_layer_schema.sql',
      '20260412_command_layer_seed.sql',
      '20260412_command_layer_rpcs.sql',
      '20260412_command_layer_roi_engines_v2.sql',
      '20260412_command_layer_paperclip_maximum_yield.sql',
      '20260412_command_layer_money_triggers.sql',
      '20260412_command_layer_maxout_agents.sql',
      '20260412_command_layer_wire_all_remaining.sql',
      '20260412_command_layer_auto_wire.sql',
      '20260412_telemetry_events_table.sql'
    ];
    
    const dir = 'supabase/migrations';
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (!fs.existsSync(fullPath)) continue;
        console.log(`Running ${file}...`);
        const sql = fs.readFileSync(fullPath, 'utf8');
        try {
            await c.query(sql);
            console.log(`Success: ${file}`);
        } catch (e) {
            console.error(`Error in ${file}:`, e.message);
            break;
        }
    }
    
    await c.end();
}

run();
