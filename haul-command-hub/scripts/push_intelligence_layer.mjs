import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function pushMigration(filename) {
  const sql = fs.readFileSync(path.resolve(process.cwd(), `supabase/migrations/${filename}`), 'utf8');
  
  const statements = sql.split(';').filter(s => s.trim().length > 10 && !s.trim().startsWith('--'));
  
  let success = 0;
  let errors = 0;

  for (const stmt of statements) {
    const trimmed = stmt.trim();
    if (!trimmed) continue;
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: trimmed + ';' });
      if (error) {
        console.log(`  ⚠️  ${error.message.substring(0, 80)}`);
        errors++;
      } else {
        success++;
      }
    } catch (e) {
      console.log(`  ⚠️  ${e.message?.substring(0, 80) || 'unknown error'}`);
      errors++;
    }
  }
  
  console.log(`\n✅ Migration ${filename}: ${success} ok, ${errors} skipped.`);
}

async function run() {
  console.log("🚀 Pushing Global Intelligence Layer...");
  await pushMigration('20260327220000_global_intelligence_layer.sql');
}

run();
