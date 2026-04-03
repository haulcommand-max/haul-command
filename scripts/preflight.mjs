// scripts/preflight.mjs
// Pre-push / CI preflight gate for Haul Command.
// Catches build-breaking errors before they hit Vercel.
//
// Checks (in dependency order):
//   1. Route collision detector     — catches Turbopack route collision
//   2. TypeScript typecheck         — catches TS type errors
//   3. Stripe API version           — ensures correct apiVersion string
//   4. Env var presence             — ensures .env.example is complete
//   5. Client boundary scanner      — catches onClick/useState/useEffect
//                                     in files missing 'use client'
//   6. Duplicate JSX style key      — catches style={{ key: a, key: b }}
//
// Usage:
//   node scripts/preflight.mjs           — full check
//   node scripts/preflight.mjs --fast    — checks 1+2+5+6 only
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

// ── 5. Client Boundary Scanner (always runs) ─────────────────
// Catches: onClick/useState/useEffect in files missing 'use client'
// Exact failure mode: regulations prerender crash, QuickAnswerBlock onClick
check('client boundary violations', () => {
    const CLIENT_HOOKS = ['onClick', 'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useRouter', 'usePathname', 'useSearchParams'];
    const violations = [];

    function scanDir(dir) {
        if (!existsSync(dir)) return;
        for (const entry of readdirSync(dir)) {
            const full = join(dir, entry);
            const stat = statSync(full);
            if (stat.isDirectory()) {
                // Skip node_modules, .next, out
                if (['node_modules', '.next', 'out', '.git'].includes(entry)) continue;
                scanDir(full);
            } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
                const content = readFileSync(full, 'utf8');
                // Skip files that already have 'use client'
                if (content.startsWith("'use client'") || content.startsWith('"use client"')) continue;
                // Skip files in /api/ routes (server-only, no client hooks)
                const rel = full.replace(ROOT, '').replace(/\\/g, '/');
                if (rel.includes('/api/')) continue;
                // Check for client-only hooks
                const found = CLIENT_HOOKS.filter(hook => content.includes(hook));
                if (found.length > 0) {
                    // Allow hooks that appear in type definitions or comments only
                    const hasActualUsage = found.some(hook => {
                        const re = new RegExp(`(^|\\s|=|\\(|,)${hook}(\\s*[=(\\[{]|,)`, 'm');
                        return re.test(content);
                    });
                    if (hasActualUsage) {
                        violations.push(`${rel}: uses [${found.join(', ')}] but missing 'use client'`);
                    }
                }
            }
        }
    }

    scanDir(join(ROOT, 'components'));
    scanDir(join(ROOT, 'app'));

    if (violations.length > 0) {
        throw new Error(`Client boundary violations (${violations.length}):\n${violations.slice(0, 10).map(v => '    ' + v).join('\n')}`);
    }
    return true;
});

// ── 6. Duplicate JSX Style Key Scanner (always runs) ─────────
// Catches: style={{ fontSize: 16, ..., fontSize: 12 }}
// Exact failure mode: market/[state] h2 TS2300 build crash
// NOTE: Skips react-simple-maps nested Geography style objects
//       ({ default: {...}, hover: {...} }) — those are not CSS props.
check('duplicate JSX style keys', () => {
    const violations = [];
    // Match style={{ ... }} blocks spanning up to 5 lines
    const STYLE_BLOCK = /style=\{\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\}/gs;

    function scanForDupeKeys(dir) {
        if (!existsSync(dir)) return;
        for (const entry of readdirSync(dir)) {
            const full = join(dir, entry);
            const stat = statSync(full);
            if (stat.isDirectory()) {
                if (['node_modules', '.next', 'out', '.git'].includes(entry)) continue;
                scanForDupeKeys(full);
            } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
                const content = readFileSync(full, 'utf8');
                const rel = full.replace(ROOT, '').replace(/\\/g, '/');
                let match;
                STYLE_BLOCK.lastIndex = 0;
                while ((match = STYLE_BLOCK.exec(content)) !== null) {
                    const block = match[1];
                    // Skip react-simple-maps Geography style objects with nested
                    // sub-objects like { default: {...}, hover: {...} }
                    // Signature: key followed by ': {' inside the block
                    if (/[a-zA-Z]+\s*:\s*\{/.test(block)) continue;
                    // Extract property names: "fontSize", 'color', etc.
                    const keys = [];
                    const keyRe = /([a-zA-Z][a-zA-Z0-9]*)\s*:/g;
                    let km;
                    while ((km = keyRe.exec(block)) !== null) keys.push(km[1]);
                    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
                    if (dupes.length > 0) {
                        const lineNum = content.slice(0, match.index).split('\n').length;
                        violations.push(`${rel}:${lineNum} — duplicate style keys: [${[...new Set(dupes)].join(', ')}]`);
                    }
                }
            }
        }
    }

    scanForDupeKeys(join(ROOT, 'app'));
    scanForDupeKeys(join(ROOT, 'components'));

    if (violations.length > 0) {
        throw new Error(`Duplicate JSX style keys (${violations.length}):\n${violations.slice(0, 10).map(v => '    ' + v).join('\n')}`);
    }
    return true;
});

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
