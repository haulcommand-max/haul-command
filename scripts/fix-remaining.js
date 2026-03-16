const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\PC User\\Biz';

const fixes = [
  // Files needing createClient import (they use ANON_KEY)
  { file: 'app/api/liquidity/route.ts', import: "import { createClient } from '@supabase/supabase-js';\n" },
  { file: 'app/api/loads/live/route.ts', import: "import { createClient } from '@supabase/supabase-js';\n" },
  { file: 'app/api/public/kpis/route.ts', import: "import { createClient } from '@supabase/supabase-js';\n" },
  { file: 'app/api/push/subscribe/route.ts', import: "import { createClient } from '@supabase/supabase-js';\n" },
  { file: 'app/api/report-cards/corridor/route.ts', import: "import { createClient } from '@supabase/supabase-js';\n" },
  { file: 'app/api/report-cards/driver/route.ts', import: "import { createClient } from '@supabase/supabase-js';\n" },
  // File needing getSupabaseAdmin import
  { file: 'app/api/report-cards/broker/route.ts', import: "import { getSupabaseAdmin } from '@/lib/supabase/admin';\n" },
];

for (const { file, import: importLine } of fixes) {
  const fp = path.join(ROOT, file);
  if (!fs.existsSync(fp)) { console.log('SKIP:', file); continue; }
  let content = fs.readFileSync(fp, 'utf8');
  
  if (content.includes(importLine.trim())) { console.log('Already has import:', file); continue; }
  
  // Add import at top, after any 'export const' lines
  const firstImport = content.match(/(import .+;\r?\n)/);
  if (firstImport) {
    content = content.replace(firstImport[0], firstImport[0] + importLine);
  } else {
    // No imports — add before first export or function
    const insertPoint = content.match(/(export (?:const|async|function|default))/);
    if (insertPoint) {
      content = content.replace(insertPoint[0], importLine + '\n' + insertPoint[0]);
    }
  }
  
  fs.writeFileSync(fp, content, 'utf8');
  console.log('  Fixed:', file);
}
