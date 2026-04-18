const fs = require('fs');
let c = fs.readFileSync('app/training/page.tsx', 'utf8');

c = c.replace(/hours_total: 40,\s*pricing_mode: 'freemium',/, 
  "hours_total: 40,\n        pricing_mode: 'paid',\n        price_display: '$299',");

c = c.replace(/hours_total: 24,\s*pricing_mode: 'freemium',/, 
  "hours_total: 24,\n        pricing_mode: 'paid',\n        price_display: '$899',");

c = c.replace(/hours_total: 10,\s*pricing_mode: 'free',/, 
  "hours_total: 10,\n        pricing_mode: 'paid',\n        price_display: '$49',");

fs.writeFileSync('app/training/page.tsx', c);
console.log("Patched!");
