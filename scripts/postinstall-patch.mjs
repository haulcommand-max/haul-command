/**
 * postinstall-patch.mjs
 *
 * Patches @supabase/postgrest-js to add .catch() to PostgrestBuilder class.
 * PostgrestBuilder only implements .then() (PromiseLike), but Next.js's
 * webpack prerender calls .catch() on it, causing:
 *   TypeError: a.rpc(...).catch is not a function
 *
 * Strategy: inject a .catch() method directly INTO the class body, right after
 * the .then() method. This ensures every module instance has the method,
 * regardless of ESM module identity issues.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const targets = [
    resolve(__dirname, '..', 'node_modules', '@supabase', 'postgrest-js', 'dist', 'index.mjs'),
    resolve(__dirname, '..', 'node_modules', '@supabase', 'postgrest-js', 'dist', 'index.cjs'),
];

const PATCH_MARKER = '/* POSTGREST_CATCH_PATCHED */';

// The .catch() method to inject inside the class body
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

        // Strategy: Find the unique "returns()" method that appears inside
        // PostgrestBuilder class (line ~208 in unpatched file).
        // It has a unique comment: "@deprecated Use overrideTypes"
        // Insert .catch() right BEFORE this "returns()" method.
        //
        // The anchor text we look for (unique to PostgrestBuilder):
        const anchor = '\t/**\n\t* Override the type of the returned `data`.\n\t*\n\t* @typeParam NewResult - The new result type to override with\n\t* @deprecated Use overrideTypes';

        let idx = src.indexOf(anchor);
        if (idx === -1) {
            // Try with \r\n line endings
            const anchorCRLF = anchor.replace(/\n/g, '\r\n');
            idx = src.indexOf(anchorCRLF);
        }

        if (idx !== -1) {
            // Insert .catch() method right before the @deprecated returns() block
            src = src.slice(0, idx) + CATCH_METHOD + '\n' + src.slice(idx);
            writeFileSync(file, src, 'utf8');
            console.log(`[postinstall-patch] ✅ Patched .catch() into PostgrestBuilder class body: ${file}`);
        } else {
            console.warn(`[postinstall-patch] ⚠️ Could not find anchor text in: ${file}`);
            console.warn(`[postinstall-patch]    Trying fallback: inserting before "overrideTypes"...`);

            // Fallback: look for overrideTypes method
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
