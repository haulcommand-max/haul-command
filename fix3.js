const fs = require('fs');
let code = fs.readFileSync('app/training/page.tsx', 'utf8');

// The Turbopack error was: Expected '</', got 'jsx text' at line 306
// Currently line 306 has `      </section>` but there was no opening `<section>`.
// So we just need to ADD the missing `<section>` before the `<div>` at line 296.

// Let's replace the orphan </section> with nothing, OR we wrap the div properly.
// Let's just find the `</PageFamilyBackground>` and inject the section right after.

code = code.replace(/<\/PageFamilyBackground>\s*<div style={{ background: 'linear-gradient/g, 
`</PageFamilyBackground>\n      <section style={{ padding: '64px 24px', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>\n          <div style={{ background: 'linear-gradient`);

fs.writeFileSync('app/training/page.tsx', code);
console.log("Section wrapper injected successfully.");
