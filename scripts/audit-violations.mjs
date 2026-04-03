// scripts/audit-violations.mjs — one-shot audit, delete after sprint
import { readdirSync, statSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT_HOOKS = ['onClick','useState','useEffect','useRef','useCallback','useMemo','useRouter','usePathname','useSearchParams'];
const cbViolations = [];
const skViolations = [];

function scanCB(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
            if (['node_modules','.next','out','.git'].includes(entry)) continue;
            scanCB(full);
        } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
            const content = readFileSync(full, 'utf8');
            if (content.startsWith("'use client'") || content.startsWith('"use client"')) continue;
            const rel = full.replace(ROOT,'').replace(/\\/g,'/');
            if (rel.includes('/api/')) continue;
            const found = CLIENT_HOOKS.filter(h => content.includes(h));
            if (found.length > 0) {
                const hasActual = found.some(h => new RegExp(`(^|\\s|=|\\(|,)${h}(\\s*[=([{]|,)`,'m').test(content));
                if (hasActual) cbViolations.push({ file: rel, hooks: found });
            }
        }
    }
}

function scanSK(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
            if (['node_modules','.next','out','.git'].includes(entry)) continue;
            scanSK(full);
        } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
            const content = readFileSync(full, 'utf8');
            const rel = full.replace(ROOT,'').replace(/\\/g,'/');
            const STYLE_BLOCK = /style=\{\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\}/gs;
            let match; STYLE_BLOCK.lastIndex = 0;
            while ((match = STYLE_BLOCK.exec(content)) !== null) {
                const block = match[1];
                const keys = []; const keyRe = /([a-zA-Z][a-zA-Z0-9]*)\s*:/g; let km;
                while ((km = keyRe.exec(block)) !== null) keys.push(km[1]);
                const dupes = [...new Set(keys.filter((k,i) => keys.indexOf(k) !== i))];
                if (dupes.length > 0) {
                    const line = content.slice(0, match.index).split('\n').length;
                    skViolations.push({ file: rel, line, dupes, block: match[0].slice(0,120) });
                }
            }
        }
    }
}

scanCB(join(ROOT,'components'));
scanCB(join(ROOT,'app'));
scanSK(join(ROOT,'app'));
scanSK(join(ROOT,'components'));

console.log(`\n=== CLIENT BOUNDARY VIOLATIONS (${cbViolations.length}) ===`);
for (const v of cbViolations) console.log(`  ${v.file} | hooks: [${v.hooks.join(', ')}]`);

console.log(`\n=== DUPLICATE STYLE KEYS (${skViolations.length}) ===`);
for (const v of skViolations) console.log(`  ${v.file}:${v.line} | dupes: [${v.dupes.join(', ')}]`);
