/**
 * postinstall-patch.mjs
 * 
 * Patches @supabase/postgrest-js to add .catch() to PostgrestBuilder.
 * PostgrestBuilder only implements .then() (PromiseLike), but Next.js's
 * webpack prerender calls .catch() on it, causing:
 *   TypeError: a.rpc(...).catch is not a function
 *
 * This script runs after every `npm install` via the "postinstall" hook.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const targets = [
    resolve(__dirname, '..', 'node_modules', '@supabase', 'postgrest-js', 'dist', 'index.mjs'),
    resolve(__dirname, '..', 'node_modules', '@supabase', 'postgrest-js', 'dist', 'index.cjs'),
];

const CATCH_PATCH = `
  // --- PATCHED by scripts/postinstall-patch.mjs ---
  // Add .catch() to PostgrestBuilder so webpack SSR prerender doesn't crash.
  catch(onRejected) {
    return this.then(undefined, onRejected);
  }
  // --- END PATCH ---`;

for (const file of targets) {
    try {
        let src = readFileSync(file, 'utf8');
        if (src.includes('// --- PATCHED by scripts/postinstall-patch.mjs ---')) {
            console.log(`[postinstall-patch] Already patched: ${file}`);
            continue;
        }
        // Find the .then() method in PostgrestBuilder and add .catch() after it
        // The .then() method ends with a closing brace followed by the class body
        const thenPattern = /(\bthen\s*\([^)]*\)\s*\{[\s\S]*?\n\t\})/;
        const match = src.match(thenPattern);
        if (match) {
            src = src.replace(match[0], match[0] + CATCH_PATCH);
            writeFileSync(file, src, 'utf8');
            console.log(`[postinstall-patch] ✅ Patched .catch() into PostgrestBuilder: ${file}`);
        } else {
            console.warn(`[postinstall-patch] ⚠️ Could not find .then() method in: ${file}`);
        }
    } catch (err) {
        console.warn(`[postinstall-patch] ⚠️ Could not patch: ${file}`, err.message);
    }
}
