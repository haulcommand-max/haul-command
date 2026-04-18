const fs = require('fs');
const path = require('path');

const REQUIRED_MONETIZATION_PAGES = [
  'app/directory/page.tsx',
  'app/(public)/available-now/page.tsx',
  'app/corridor-command/page.tsx',
  'app/directory/[country]/[slug]/page.tsx'
];

let failed = false;

console.log('🔍 Running Blank Ad Zone Guard\n');

for (const file of REQUIRED_MONETIZATION_PAGES) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.warn(`[SKIP] Missing file: ${file}`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('<AdGridSlot')) {
    console.error(`❌ [FAIL] Missing <AdGridSlot /> in eligible monetization surface: ${file}`);
    failed = true;
  } else {
    console.log(`✅ [PASS] AdGrid mounted clearly on: ${file}`);
  }
}

if (failed) {
  console.error('\n🚨 Blank Ad Zone Guard failed. Add <AdGridSlot /> to ensure monetization on high-value surfaces.');
  process.exit(1);
} else {
  console.log('\n🌟 All eligible monetization surfaces are properly covered. No blank ad zones detected.');
  process.exit(0);
}
