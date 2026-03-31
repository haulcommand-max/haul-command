import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'data', 'wls_regulations.json'), 'utf-8'));
console.log(`Total records: ${data.length}\n`);

// Sort by state code
data.sort((a,b) => a.admin1_code.localeCompare(b.admin1_code));

for (const r of data) {
  const dims = [
    r.max_length_ft ? `L:${r.max_length_ft}'` : '',
    r.max_width_ft ? `W:${r.max_width_ft.toFixed(1)}'` : '',
    r.max_height_ft ? `H:${r.max_height_ft}'` : '',
    r.max_weight_lbs ? `Wt:${(r.max_weight_lbs/1000).toFixed(0)}k` : '',
  ].filter(Boolean).join(' ');
  
  console.log(
    `${r.country_code}/${r.admin1_code}`.padEnd(6),
    r.admin1_name.padEnd(20),
    dims.padEnd(32),
    `P:${r.permit_costs.length}`.padStart(5),
    `T:${r.travel_restrictions.length}`.padStart(5)
  );
}

// Summary
const withL = data.filter(r => r.max_length_ft).length;
const withW = data.filter(r => r.max_width_ft).length;
const withH = data.filter(r => r.max_height_ft).length;
const withWt = data.filter(r => r.max_weight_lbs).length;
const withP = data.filter(r => r.permit_costs.length > 0).length;
const totalP = data.reduce((s,r) => s + r.permit_costs.length, 0);
const totalT = data.reduce((s,r) => s + r.travel_restrictions.length, 0);

console.log(`\n${'─'.repeat(70)}`);
console.log(`Extraction rates:`);
console.log(`  Length:  ${withL}/${data.length} (${(withL/data.length*100).toFixed(0)}%)`);
console.log(`  Width:   ${withW}/${data.length} (${(withW/data.length*100).toFixed(0)}%)`);
console.log(`  Height:  ${withH}/${data.length} (${(withH/data.length*100).toFixed(0)}%)`);
console.log(`  Weight:  ${withWt}/${data.length} (${(withWt/data.length*100).toFixed(0)}%)`);
console.log(`  Permits: ${withP}/${data.length} (${(withP/data.length*100).toFixed(0)}%) — ${totalP} total cost rules`);
console.log(`  Travel:  ${totalT} total restriction entries`);

// Flag suspicious values  
console.log(`\n${'─'.repeat(70)}`);
console.log(`Suspicious values (likely regex false positives):`);
for (const r of data) {
  const issues = [];
  if (r.max_width_ft && r.max_width_ft < 7) issues.push(`Width ${r.max_width_ft}' too narrow`);
  if (r.max_height_ft && r.max_height_ft < 10) issues.push(`Height ${r.max_height_ft}' too short`);
  if (r.max_weight_lbs && r.max_weight_lbs > 200000) issues.push(`Weight ${r.max_weight_lbs}lbs unusually high`);
  if (issues.length) console.log(`  ⚠️ ${r.admin1_code}: ${issues.join(', ')}`);
}
