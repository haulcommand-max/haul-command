#!/usr/bin/env node
/**
 * scripts/check-mojibake.js
 * 
 * Pre-commit / CI guard to catch mojibake (garbled UTF-8) in source files.
 * Returns exit code 1 if any mojibake patterns are found.
 * 
 * Usage:
 *   node scripts/check-mojibake.js          # scans app/ and components/
 *   node scripts/check-mojibake.js src/     # scans custom path
 * 
 * Add to package.json scripts:
 *   "lint:mojibake": "node scripts/check-mojibake.js"
 * 
 * Or add as pre-commit hook:
 *   npx husky add .husky/pre-commit "node scripts/check-mojibake.js"
 */

const { execSync } = require('child_process');
const path = require('path');

// Known mojibake patterns that should never appear in source files
// These are garbled UTF-8 sequences from encoding mismatches
const MOJIBAKE_PATTERNS = [
  'Â·',   // garbled middle dot
  'Â§',   // garbled section sign
  'Â°',   // garbled degree sign
  'Â¢',   // garbled cent sign
  'Â©',   // garbled copyright
  'Â®',   // garbled registered
  'Ã©',   // garbled é
  'Ã¨',   // garbled è  
  'Ã¶',   // garbled ö
  'Ã¼',   // garbled ü
  'Ã¤',   // garbled ä
  'Ã±',   // garbled ñ
];

const targetPaths = process.argv.slice(2);
const searchPaths = targetPaths.length > 0 ? targetPaths : ['app', 'components', 'lib'];

let totalFound = 0;
const findings = [];

for (const pattern of MOJIBAKE_PATTERNS) {
  for (const searchPath of searchPaths) {
    const fullPath = path.resolve(process.cwd(), searchPath);
    try {
      // Use findstr on Windows, grep on Unix
      const isWin = process.platform === 'win32';
      const cmd = isWin
        ? `findstr /s /n /c:"${pattern}" "${fullPath}\\*.tsx" "${fullPath}\\*.ts" "${fullPath}\\*.jsx" "${fullPath}\\*.js" 2>nul`
        : `grep -rn --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" "${pattern}" "${fullPath}" 2>/dev/null`;
      
      const result = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
      const lines = result.trim().split('\n').filter(l => l.trim());
      
      if (lines.length > 0) {
        totalFound += lines.length;
        findings.push({ pattern, path: searchPath, count: lines.length, samples: lines.slice(0, 3) });
      }
    } catch {
      // findstr/grep returns exit 1 when no matches found — that's good
    }
  }
}

if (totalFound > 0) {
  console.error('\n❌ MOJIBAKE DETECTED — garbled UTF-8 characters found in source files\n');
  for (const f of findings) {
    console.error(`  Pattern: "${f.pattern}" — ${f.count} occurrence(s) in ${f.path}/`);
    for (const sample of f.samples) {
      console.error(`    ${sample.substring(0, 120)}`);
    }
  }
  console.error(`\n  Total: ${totalFound} mojibake occurrences`);
  console.error('  Fix: Replace garbled characters with correct Unicode equivalents or remove them.\n');
  process.exit(1);
} else {
  console.log('✅ No mojibake detected');
  process.exit(0);
}
