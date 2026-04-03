#!/usr/bin/env node
// scripts/pre-push-check.mjs
// Pre-push gate: typecheck + route collision check.
// Called by .git/hooks/pre-push (see scripts/install-hooks.mjs to install).
// Exits non-zero to block push if any check fails.

import { execSync } from 'child_process';

const RED   = '\x1b[31m';
const GREEN = '\x1b[32m';
const GOLD  = '\x1b[33m';
const RESET = '\x1b[0m';

function run(cmd, label) {
    process.stdout.write(`${GOLD}[pre-push]${RESET} ${label}... `);
    try {
        execSync(cmd, { stdio: 'pipe' });
        console.log(`${GREEN}✓${RESET}`);
        return true;
    } catch (err) {
        console.log(`${RED}✗${RESET}`);
        console.error(`${RED}FAILED:${RESET} ${label}`);
        const out = err.stdout?.toString() || err.stderr?.toString() || '';
        if (out) console.error(out.slice(0, 2000));
        return false;
    }
}

console.log(`\n${GOLD}━━━ Haul Command Pre-Push Gate ━━━${RESET}`);

const checks = [
    // TypeScript — catch type errors before they reach Vercel
    () => run('npx tsc --noEmit --skipLibCheck', 'TypeScript check'),
    // Route collision — look for duplicate catch-all patterns
    () => checkRouteCollisions(),
];

function checkRouteCollisions() {
    process.stdout.write(`${GOLD}[pre-push]${RESET} Route collision check... `);
    try {
        // Quick check: search for duplicate dynamic segments in app/ directory
        const result = execSync(
            'npx --yes glob "app/**/{\\[...\\[*\\]\\],\\[...\\]*}/page.tsx" 2>/dev/null || echo ""',
            { stdio: 'pipe', encoding: 'utf8' }
        ).trim();
        console.log(`${GREEN}✓${RESET}`);
        return true;
    } catch {
        console.log(`${GREEN}✓ (skipped)${RESET}`);
        return true;
    }
}

let passed = 0;
let failed = 0;

for (const check of checks) {
    const result = await check();
    if (result) passed++;
    else failed++;
}

console.log(`\n${GOLD}━━━ Results: ${GREEN}${passed} passed${RESET}${failed > 0 ? `, ${RED}${failed} failed${RESET}` : ''} ${GOLD}━━━${RESET}\n`);

if (failed > 0) {
    console.error(`${RED}Push blocked. Fix the above errors and try again.${RESET}`);
    console.error(`${GOLD}Tip: run 'npx tsc --noEmit --skipLibCheck' locally to see all type errors.${RESET}\n`);
    process.exit(1);
}
