import fs from 'fs';
import path from 'path';

function walkDir(dir) {
  let files = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(walkDir(fullPath));
    } else if (fullPath.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = walkDir('app/tools');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  if (!content.includes('data-tool-interact')) {
    const tags = ['button', 'input', 'select'];
    for (const tag of tags) {
      const regex = new RegExp(`(<${tag})(\\s|\\n)(?!aria-label)`, 'g');
      content = content.replace(regex, `$1 data-tool-interact$2`);
      const regex2 = new RegExp(`(<${tag} aria-label="Interactive Button")(\\s|\\n)`, 'g');
      content = content.replace(regex2, `$1 data-tool-interact$2`);
    }
    changed = true;
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
