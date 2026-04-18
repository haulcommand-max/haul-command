const fs = require('fs');
let text = fs.readFileSync('app/training/page.tsx', 'utf8');

// The file currently has:
//       </PageFamilyBackground>
//           <div style={{ background: 'linear-gradient(135deg, rgba(17,17,26,0.9), rgba(12,12,16,0.9))'
// We want to insert the missing <section> tag right after PageFamilyBackground.

const target = `</PageFamilyBackground>\n          <div style={{ background: 'linear-gradient`;
const replacement = `</PageFamilyBackground>\n      <section style={{ padding: '64px 24px', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>\n          <div style={{ background: 'linear-gradient`;

if (text.includes(target)) {
    text = text.replace(target, replacement);
    fs.writeFileSync('app/training/page.tsx', text);
    console.log("File fixed successfully.");
} else {
    console.log("Target string not found. The file might be corrupted or already modified.");
}
