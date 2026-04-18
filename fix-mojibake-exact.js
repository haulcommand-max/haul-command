const fs = require('fs');
let content = fs.readFileSync('app/training/page.tsx', 'utf8');
const lines = content.split(/\r?\n/);

// Line 267: garbled graduation cap emoji (U+00F0 U+0178 U+017D U+201C + space) before <ShieldCheck
// Replace the entire garbled prefix 
const garbled_grad = String.fromCharCode(0x00F0, 0x0178, 0x017D, 0x201C);
content = content.replaceAll(garbled_grad + ' ', '');

// Line 277: "View All Programs " + garbled down arrow (U+00E2 U+2020 U+201C)
const garbled_arrow = String.fromCharCode(0x00E2, 0x2020, 0x201C);
content = content.replaceAll(garbled_arrow, '');

// Line 365: garbled star (U+00E2 U+00AD U+0090 + space) before FUTURE-PROOF
const garbled_star = String.fromCharCode(0x00E2, 0x00AD, 0x0090);
content = content.replaceAll(garbled_star + ' ', '');

fs.writeFileSync('app/training/page.tsx', content, 'utf8');

// Verify
const verify = fs.readFileSync('app/training/page.tsx', 'utf8');
const vlines = verify.split(/\r?\n/);
[267, 277, 365, 497].forEach(n => {
  console.log(`Line ${n}: ${vlines[n-1].trim()}`);
});
console.log('\nDone — all garbled characters stripped.');
