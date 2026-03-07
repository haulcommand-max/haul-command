#!/usr/bin/env node
/**
 * PATCH-008: Doctor script — prints versions + critical paths.
 * Usage: npm run doctor
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

function run(cmd) {
  try { return execSync(cmd, { encoding: 'utf8', timeout: 15_000 }).trim(); }
  catch { return 'NOT FOUND'; }
}

function exists(path) {
  return existsSync(path) ? 'FOUND' : 'MISSING';
}

console.log('═══ Haul Command Doctor ═══\n');

console.log('Versions:');
console.log(`  Node:        ${run('node --version')}`);
console.log(`  npm:         ${run('npm --version')}`);
console.log(`  Next.js:     ${run('npx next --version')}`);
console.log(`  Capacitor:   ${run('npx cap --version')}`);
console.log(`  Firebase:    ${run('firebase --version')}`);
console.log(`  TypeScript:  ${run('npx tsc --version')}`);

console.log('\nCritical Paths:');
console.log(`  package.json:          ${exists('package.json')}`);
console.log(`  capacitor.config.ts:   ${exists('capacitor.config.ts')}`);
console.log(`  google-services.json:  ${exists('android/app/google-services.json')}`);
console.log(`  AndroidManifest.xml:   ${exists('android/app/src/main/AndroidManifest.xml')}`);
console.log(`  .env.local:            ${exists('.env.local')}`);
console.log(`  PATCHLOG.md:           ${exists('PATCHLOG.md')}`);

console.log('\nBuild Artifacts:');
console.log(`  .next/:                ${exists('.next')}`);
console.log(`  android/app/build/:    ${exists('android/app/build')}`);
console.log(`  dist-capacitor/:       ${exists('dist-capacitor')}`);
console.log(`  node_modules/:         ${exists('node_modules')}`);

console.log('\nDone.');
