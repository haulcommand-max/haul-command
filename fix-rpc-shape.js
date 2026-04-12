const fs = require('fs');
let c = fs.readFileSync('app/training/page.tsx', 'utf8');

// Replace line by line to handle CRLF
c = c.replace(
  /\/\/ 1\. Call the canonical training_hub_payload\(\) RPC\r?\n\s+const \{ data: hubPayload \} = await supabase\.rpc\('training_hub_payload'\);/,
  `// 1. Call the canonical training_hub_payload() RPC — returns flat array of catalog rows
  const { data: catalogRows } = await supabase.rpc('training_hub_payload');

  // 2. Fetch training levels separately (the RPC returns catalog only)
  const { data: levelsRows } = await supabase
    .from('training_levels')
    .select('*')
    .order('rank_weight', { ascending: true });

  // 3. Fetch geo coverage count
  const { count: geoCount } = await supabase
    .from('training_geo_fit')
    .select('*', { count: 'exact', head: true });`
);

// Now fix the old destructuring
c = c.replace(
  /let catalog = hubPayload\?\.catalog \?\? \[\];/,
  "let catalog = Array.isArray(catalogRows) && catalogRows.length > 0 ? catalogRows : [];"
);
c = c.replace(
  /const geoCoverage = hubPayload\?\.geo_coverage \?\? \[\];/,
  "const geoCoverage = geoCount ? Array.from({ length: geoCount }) : [];"
);
c = c.replace(
  /const levels = hubPayload\?\.levels \?\? \[\];/,
  "const levels = Array.isArray(levelsRows) ? levelsRows : [];"
);

// Renumber the content edges comment
c = c.replace(
  /\/\/ 2\. Fetch cross-system content edges/,
  "// 4. Fetch cross-system content edges"
);

fs.writeFileSync('app/training/page.tsx', c, 'utf8');

// Verify
const v = fs.readFileSync('app/training/page.tsx', 'utf8');
console.log('catalogRows used:', v.includes('catalogRows'));
console.log('levelsRows used:', v.includes('levelsRows'));
console.log('geoCount used:', v.includes('geoCount'));
console.log('hubPayload still present:', v.includes('hubPayload'));
console.log('Done.');
