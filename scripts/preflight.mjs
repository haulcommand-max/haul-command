// scripts/preflight.mjs
// Pre-push / CI preflight gate for Haul Command.
// Catches build-breaking errors before they hit Vercel.
//
// Checks (in dependency order):
//   1. Route collision detector (fastest — catches most common failure)
//   2. TypeScript typecheck
//   3. Stripe API version validation
//   4. Env var presence check
//
// Usage:
//   node scripts/preflight.mjs           — full check
//   node scripts/preflight.mjs --fast    — route check + TS only
//
// Install as pre-push hook:
//   echo "node scripts/preflight.mjs" > .git/hooks/pre-push && chmod +x .git/hooks/pre-push

import { execSync } from 'child_process';
import { readdirSync, statSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FAST = process.argv.includes('--fast');

let passed = 0;
let failed = 0;
const failures = [];

function check(name, fn) {
    process.stdout.write(`  checking ${name}... `);
    try {
        const result = fn();
        console.log('✅');
        passed++;
        return result;
    } catch (err) {
        console.log(`❌  ${err.message.slice(0, 120)}`);
        failed++;
        failures.push({ name, error: err.message });
        return null;
    }
}

// ── 1. Route Collision Detector ──────────────────────────────
function collectRoutes(dir, routes = new Map(), baseDir = dir) {
    if (!existsSync(dir)) return routes;
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const isDir = statSync(full).isDirectory();
        if (isDir) {
            collectRoutes(full, routes, baseDir);
        } else if (entry === 'page.tsx' || entry === 'page.ts' || entry === 'route.ts') {
            // Normalize path: strip route groups (parenthetical segments)
            const rel = full.replace(baseDir, '').replace(/\\/g, '/');
            const normalized = rel.replace(/\/\([^)]+\)/g, '');
            if (routes.has(normalized)) {
                routes.get(normalized).push(rel);
            } else {
                routes.set(normalized, [rel]);
            }
        }
    }
    return routes;
}

check('route collisions', () => {
    const appDir = join(ROOT, 'app');
    const routes = collectRoutes(appDir);
    const collisions = [];
    for (const [normalized, paths] of routes) {
        if (paths.length > 1) {
            collisions.push(`${normalized} → [${paths.join(', ')}]`);
        }
    }
    if (collisions.length > 0) {
        throw new Error(`Route collisions detected:\n${collisions.map(c => '    ' + c).join('\n')}`);
    }
    return true;
});

// ── 2. TypeScript Typecheck ──────────────────────────────────
check('TypeScript (noEmit)', () => {
    try {
        execSync('node node_modules/typescript/bin/tsc --noEmit 2>&1', {
            cwd: ROOT,
            stdio: ['pipe', 'pipe', 'pipe'],
            encoding: 'utf8',
        });
    } catch (err) {
        const output = (err.stdout || '') + (err.stderr || '');
        const errors = output.split('\n').filter(l => l.includes('error TS'));
        if (errors.length > 0) {
            throw new Error(`${errors.length} TypeScript errors:\n${errors.slice(0, 10).map(e => '    ' + e).join('\n')}`);
        }
    }
    return true;
});

if (!FAST) {
    // ── 3. Stripe API Version Validation ────────────────────────
    check('Stripe API version consistency', () => {
        const REQUIRED_VERSION = '2026-02-25.clover';
        let files = [];
        try {
            const out = execSync('git grep -rl "apiVersion"', { cwd: ROOT, encoding: 'utf8' });
            files = out.trim().split('\n').filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
        } catch { return true; } // no matches

        const wrong = [];
        for (const f of files) {
            const content = readFileSync(join(ROOT, f), 'utf8');
            const matches = content.match(/apiVersion:\s*['"]([^'"]+)['"]/g) || [];
            for (const m of matches) {
                if (!m.includes(REQUIRED_VERSION)) {
                    wrong.push(`${f}: ${m.trim()}`);
                }
            }
        }
        if (wrong.length > 0) {
            throw new Error(`Wrong Stripe API version (expected ${REQUIRED_VERSION}):\n${wrong.map(w => '    ' + w).join('\n')}`);
        }
        return true;
    });

    // ── 4. Critical Env Vars ─────────────────────────────────────
    check('required env vars in .env.example', () => {
        const REQUIRED = [
            'STRIPE_SECRET_KEY',
            'STRIPE_SPONSOR_WEBHOOK_SECRET',
            'STRIPE_ESCROW_WEBHOOK_SECRET',
            'SUPABASE_SERVICE_ROLE_KEY',
            'NEXT_PUBLIC_SUPABASE_URL',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            'SUPABASE_DB_POOLER_URL',
        ];
        const examplePath = join(ROOT, '.env.example');
        if (!existsSync(examplePath)) return true; // skip if no example file
        const content = readFileSync(examplePath, 'utf8');
        const missing = REQUIRED.filter(k => !content.includes(k));
        if (missing.length > 0) {
            throw new Error(`Missing from .env.example: ${missing.join(', ')}`);
        }
        return true;
    });
}

// ── Summary ───────────────────────────────────────────────────
console.log('\n' + '─'.repeat(55));
console.log(`Preflight: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
    console.log('\nFailed checks:');
    for (const f of failures) {
        console.log(`  ❌ ${f.name}`);
        console.log(`     ${f.error.slice(0, 200)}`);
    }
    console.log('\n⛔ Fix the above before pushing to main.\n');
    process.exit(1);
} else {
    console.log('✅ All checks passed. Safe to push.\n');
}
