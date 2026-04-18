const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.md')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./app');
let fixedCount = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('â€”') || content.includes('â€™') || content.includes('â€œ') || content.includes('â€')) {
    content = content.replace(/â€”/g, '—')
                     .replace(/â€™/g, "'")
                     .replace(/â€œ/g, '"')
                     .replace(/â€/g, '"');
    fs.writeFileSync(file, content, 'utf8');
    fixedCount++;
  }
});
console.log(`Fixed mojibake in ${fixedCount} files.`);
