/**
 * postinstall-patch.mjs
 *
 * 1) Patches @supabase/postgrest-js to add .catch() to PostgrestBuilder.
 * 2) Applies tiny build-safety source patches for known mobile/homepage issues
 *    that are safer to patch by exact strings than by replacing very large files.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const targets = [
    resolve(repoRoot, 'node_modules', '@supabase', 'postgrest-js', 'dist', 'index.mjs'),
    resolve(repoRoot, 'node_modules', '@supabase', 'postgrest-js', 'dist', 'index.cjs'),
];

const PATCH_MARKER = '/* POSTGREST_CATCH_PATCHED */';
const CATCH_METHOD = [
    '\t' + PATCH_MARKER,
    '\tcatch(onRejected) {',
    '\t\treturn this.then(undefined, onRejected);',
    '\t}',
].join('\n');

for (const file of targets) {
    try {
        if (!existsSync(file)) {
            console.log(`[postinstall-patch] File not found (skipping): ${file}`);
            continue;
        }

        let src = readFileSync(file, 'utf8');
        if (src.includes(PATCH_MARKER)) {
            console.log(`[postinstall-patch] Already patched: ${file}`);
            continue;
        }

        const anchor = '\t/**\n\t* Override the type of the returned `data`.\n\t*\n\t* @typeParam NewResult - The new result type to override with\n\t* @deprecated Use overrideTypes';

        let idx = src.indexOf(anchor);
        if (idx === -1) {
            const anchorCRLF = anchor.replace(/\n/g, '\r\n');
            idx = src.indexOf(anchorCRLF);
        }

        if (idx !== -1) {
            src = src.slice(0, idx) + CATCH_METHOD + '\n' + src.slice(idx);
            writeFileSync(file, src, 'utf8');
            console.log(`[postinstall-patch] ✅ Patched .catch() into PostgrestBuilder class body: ${file}`);
        } else {
            console.warn(`[postinstall-patch] ⚠️ Could not find anchor text in: ${file}`);
            console.warn(`[postinstall-patch]    Trying fallback: inserting before "overrideTypes"...`);
            const fallbackAnchor = '\toverrideTypes()';
            let fbIdx = src.indexOf(fallbackAnchor);
            if (fbIdx !== -1) {
                src = src.slice(0, fbIdx) + CATCH_METHOD + '\n' + src.slice(fbIdx);
                writeFileSync(file, src, 'utf8');
                console.log(`[postinstall-patch] ✅ Patched .catch() (fallback): ${file}`);
            } else {
                console.error(`[postinstall-patch] ❌ FAILED — no anchor found in: ${file}`);
            }
        }
    } catch (err) {
        console.warn(`[postinstall-patch] ⚠️ Could not patch ${file}:`, err.message);
    }
}

function patchTextFile(relativePath, patcher) {
    const file = resolve(repoRoot, relativePath);
    try {
        if (!existsSync(file)) return;
        const before = readFileSync(file, 'utf8');
        const after = patcher(before);
        if (after !== before) {
            writeFileSync(file, after, 'utf8');
            console.log(`[postinstall-patch] ✅ Source patch applied: ${relativePath}`);
        }
    } catch (err) {
        console.warn(`[postinstall-patch] ⚠️ Could not patch ${relativePath}:`, err.message);
    }
}

patchTextFile('app/(landing)/_components/HomeClient.tsx', (src) => {
    let out = src;

    // Remove fake/demo operator proof details from the homepage mobile card.
    // We keep the surrounding component intact to avoid JSX damage, but all fake
    // identity/review/availability values are replaced with live-data language.
    out = out.replaceAll('J. Martinez Escort Co.', 'Live operator preview');
    out = out.replaceAll('I-10 Specialist', 'Live profile data');
    out = out.replaceAll('PEVO Certified', 'Verified data only');
    out = out.replaceAll('127 reviews', 'Live reviews only');
    out = out.replaceAll('Active 2 hours ago', 'Availability loads from live data');
    out = out.replaceAll('Trust 94', 'Trust score pending');

    // Mobile overflow fix: claim-benefit card grids should not force 2 columns
    // on narrow screens.
    out = out.replace(/grid\s+grid-cols-2\s+gap-2/g, 'grid grid-cols-1 sm:grid-cols-2 gap-2');
    out = out.replace(/grid\s+grid-cols-2\s+gap-3/g, 'grid grid-cols-1 sm:grid-cols-2 gap-3');
    out = out.replace(/grid\s+grid-cols-2\s+gap-4/g, 'grid grid-cols-1 sm:grid-cols-2 gap-4');

    return out;
});
