#!/usr/bin/env node
// scripts/install-hooks.mjs
// Run once: node scripts/install-hooks.mjs
// Installs a working pre-push hook pointing to our pre-push-check.mjs script.
// Replaces any broken hook that may exist.

import { writeFileSync, chmodSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const hooksDir = resolve(__dirname, '../.git/hooks');
const hookPath = resolve(hooksDir, 'pre-push');

if (!existsSync(hooksDir)) {
    mkdirSync(hooksDir, { recursive: true });
}

const hookContent = `#!/bin/sh
# Haul Command pre-push gate
# Installed by scripts/install-hooks.mjs
# To skip temporarily: git push --no-verify

node scripts/pre-push-check.mjs
exit $?
`;

writeFileSync(hookPath, hookContent, { encoding: 'utf8' });
chmodSync(hookPath, 0o755);

console.log('✓ Pre-push hook installed at .git/hooks/pre-push');
console.log('  Runs: node scripts/pre-push-check.mjs');
console.log('  Skip: git push --no-verify (use sparingly)');
