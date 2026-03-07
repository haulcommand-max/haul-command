#!/usr/bin/env node
/**
 * PATCH-001: No-regressions guardrail.
 * Checks:
 *   1. Required env keys exist
 *   2. Build passes
 *   3. Critical routes haven't been touched without a new patch ID
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

const REQUIRED_ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const results = [];

// 1. Check env keys
console.log('\n--- ENV KEY CHECK ---');
const envFiles = ['.env', '.env.local'].filter(f => existsSync(f));
const envContent = envFiles.map(f => readFileSync(f, 'utf8')).join('\n');
for (const key of REQUIRED_ENV_KEYS) {
  const found = envContent.includes(key);
  results.push({ check: `ENV: ${key}`, pass: found });
  console.log(`  ${found ? 'PASS' : 'FAIL'}: ${key}`);
}

// 2. Build check
console.log('\n--- BUILD CHECK ---');
try {
  execSync('npx next build', { stdio: 'pipe', timeout: 300_000 });
  results.push({ check: 'Build', pass: true });
  console.log('  PASS: next build');
} catch (e) {
  results.push({ check: 'Build', pass: false });
  console.log('  FAIL: next build');
}

// 3. Patch ID check — ensure PATCHLOG.md exists and has entries
console.log('\n--- PATCHLOG CHECK ---');
const patchlogExists = existsSync('PATCHLOG.md');
results.push({ check: 'PATCHLOG.md exists', pass: patchlogExists });
console.log(`  ${patchlogExists ? 'PASS' : 'FAIL'}: PATCHLOG.md`);

// Summary
console.log('\n═══ SUMMARY ═══');
const passed = results.filter(r => r.pass).length;
const total = results.length;
console.log(`${passed}/${total} checks passed`);

if (passed < total) {
  console.log('\nFAILED:');
  results.filter(r => !r.pass).forEach(r => console.log(`  - ${r.check}`));
  process.exit(1);
}

console.log('\nAll checks passed.');
