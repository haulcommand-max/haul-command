const fs = require('fs');
const path = require('path');

const MOJIBAKE_REGEX = /[\uFFFD\u2018\u2019\u201C\u201D\u2026]/;
const ERROR_EXIT = process.argv.includes('--ci');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('.next')) {
        results = results.concat(walkDir(fullPath));
      }
    } else {
      if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

console.log('--- Anti-Mojibake Guardrail ---');
const files = walkDir('./');
let failed = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (MOJIBAKE_REGEX.test(content)) {
    console.warn(`⚠️ Mojibake pattern or smart quote detected in: ${file}`);
    failed++;
  }
});

if (failed > 0) {
  console.error(`\n❌ Failed: Found ${failed} files with mojibake characters.`);
  if (ERROR_EXIT) process.exit(1);
} else {
  console.log(`\n✅ Passed: No mojibake characters found in ${files.length} files.`);
}
