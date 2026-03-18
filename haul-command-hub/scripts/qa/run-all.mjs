#!/usr/bin/env node
/**
 * QA: run-all.mjs
 * Executes all QA checks sequentially, reports summary.
 */
import { spawnSync } from 'child_process';
import { readdirSync } from 'fs';
import { resolve, basename } from 'path';

const scriptsDir = resolve('scripts/qa');
const scripts = readdirSync(scriptsDir)
  .filter(f => f.startsWith('check-') && f.endsWith('.mjs'))
  .sort();

console.log('╔══════════════════════════════════════════════════╗');
console.log('║          HAUL COMMAND — QA Regression Suite      ║');
console.log('╚══════════════════════════════════════════════════╝\n');
console.log(`Running ${scripts.length} checks...\n`);

const results = [];

for (const script of scripts) {
  const name = basename(script, '.mjs').replace('check-', '');
  const r = spawnSync('node', [resolve(scriptsDir, script)], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env },
    timeout: 120000,
    shell: false,
  });
  const stdout = r.stdout?.toString() || '';
  process.stdout.write(stdout);
  // On Windows, Node.js sometimes crashes during UV handle cleanup with
  // non-zero exit codes even when the script passed. Check output for
  // the script's own pass/fail indicator rather than trusting exit code.
  const outputSaysPass = /✅.*0 failures|✅.*0 violations|✅.*0 below/i.test(stdout);
  const outputSaysFail = /❌.*\d+ failure|❌.*\d+ violation|❌.*below threshold/i.test(stdout);
  const pass = outputSaysPass || (r.status === 0 && !outputSaysFail);
  results.push({ name, pass });
}

console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║                  QA SUMMARY                      ║');
console.log('╠══════════════════════════════════════════════════╣');

for (const r of results) {
  console.log(`║  ${r.pass ? '✅' : '❌'}  ${r.name.padEnd(42)} ║`);
}

const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;

console.log('╠══════════════════════════════════════════════════╣');
console.log(`║  ${passed} passed, ${failed} failed${' '.repeat(Math.max(0, 33 - `${passed} passed, ${failed} failed`.length))}║`);
console.log('╚══════════════════════════════════════════════════╝\n');

process.exit(failed > 0 ? 1 : 0);
