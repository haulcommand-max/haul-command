const fs = require('fs');
const path = require('path');

function walk(dir, fn) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, fn);
    else fn(p);
  }
}

let count = 0;
walk(path.join(__dirname, 'app'), (file) => {
  if (!file.endsWith('.tsx') && !file.endsWith('.ts')) return;
  let text = fs.readFileSync(file, 'utf8');
  const size = text.length;
  
  // Restore basic ASCII and emoji that got corrupted into cp1252-like mojibake
  text = text.replace(/â”€/g, '—')
  text = text.replace(/âœ“/g, '✓')
  text = text.replace(/âš /g, '⚠️')
  text = text.replace(/âœ—/g, '✗')
  text = text.replace(/â†’/g, '→')
  text = text.replace(/ðŸš”/g, '🚓')
  text = text.replace(/"“/g, '-')
  text = text.replace(/“/g, '"')
  text = text.replace(/”/g, '"')
  text = text.replace(/’/g, "'")
  text = text.replace(/‘/g, "'")
  text = text.replace(/Ã©/g, 'é')
  text = text.replace(/Ãn/g, 'in')
  text = text.replace(/â…\x9E/g, '') // weird chars

  if (text.length !== size || text !== fs.readFileSync(file, 'utf8')) {
    fs.writeFileSync(file, text, 'utf8');
    count++;
    console.log("Fixed", file);
  }
});
console.log(`Fixed ${count} files.`);
