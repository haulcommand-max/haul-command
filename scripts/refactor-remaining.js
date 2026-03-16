const fs = require('fs');
const path = require('path');

const files = [
  'app/api/loads/[id]/boost/route.ts',
  'app/api/offers/[offerId]/accept/route.ts',
  'app/api/offers/[offerId]/decline/route.ts',
  'app/api/trust/corridors/[profileId]/route.ts',
  'app/api/trust/profile/[profileId]/route.ts',
  'app/api/v1/broker/[resource]/route.ts',
  'app/api/v1/intel/[product]/route.ts',
  'app/api/v1/intel/surge/[corridor]/route.ts',
  'app/api/v1/intel/trust-score/[id]/route.ts',
  'app/api/v1/public/[resource]/route.ts',
];

const ROOT = 'C:\\Users\\PC User\\Biz';
let count = 0;

for (const rel of files) {
  const fp = path.join(ROOT, rel);
  if (!fs.existsSync(fp)) { console.log('SKIP (missing):', rel); continue; }

  let content = fs.readFileSync(fp, 'utf8');

  // Remove createClient import from @supabase/supabase-js
  content = content.replace(/import \{ createClient \} from ["']@supabase\/supabase-js["'];\r?\n/g, '');

  // Remove function getSupabase() block
  content = content.replace(/\r?\n*function getSupabase\(\) \{[\s\S]*?return createClient\([\s\S]*?\);\r?\n\}\r?\n/g, '\n');

  // Add canonical import after first import
  if (!content.includes('getSupabaseAdmin')) {
    content = content.replace(
      /(import .+;\r?\n)/,
      '$1import { getSupabaseAdmin } from \'@/lib/supabase/admin\';\n'
    );
  }

  // Replace getSupabase() calls
  content = content.replace(/getSupabase\(\)/g, 'getSupabaseAdmin()');

  fs.writeFileSync(fp, content, 'utf8');
  count++;
  console.log('  Updated:', rel);
}

console.log(`\nRefactored ${count} files`);
