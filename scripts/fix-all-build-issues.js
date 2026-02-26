/**
 * COMPREHENSIVE BUILD FIX SWEEP
 * Finds and fixes ALL remaining build-time env access issues:
 * 1. API routes with createClient but no force-dynamic
 * 2. Page files with module-level createClient (server components)
 * 3. generateStaticParams with createClient but no try/catch
 */
const fs = require('fs');
const path = require('path');

function walk(dir) {
    const results = [];
    try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) results.push(...walk(full));
            else if (/\.(ts|tsx)$/.test(entry.name)) results.push(full);
        }
    } catch { }
    return results;
}

const appDir = path.join(__dirname, '..', 'app');
const allFiles = walk(appDir);
let totalFixed = 0;

// ── FIX 1: API routes with createClient but no force-dynamic ──────────────
const apiRoutes = allFiles.filter(f => f.includes('route.ts') && f.includes(path.sep + 'api' + path.sep));
for (const fp of apiRoutes) {
    let content = fs.readFileSync(fp, 'utf8');
    if (content.includes('createClient') && !content.includes("force-dynamic")) {
        content = "export const dynamic = 'force-dynamic';\r\n" + content;
        fs.writeFileSync(fp, content, 'utf8');
        console.log('[FIX1-route] Added force-dynamic:', fp);
        totalFixed++;
    }
}

// ── FIX 2: Server page files with module-level createClient(URL, KEY) ─────
const pageFiles = allFiles.filter(f => /page\.(ts|tsx)$/.test(f));
for (const fp of pageFiles) {
    let content = fs.readFileSync(fp, 'utf8');
    // Skip client components - they run in browser
    if (content.includes('"use client"') || content.includes("'use client'")) continue;
    // Skip if using createClient() with no args (helper util, safe)
    if (!content.includes('SUPABASE_SERVICE_ROLE_KEY')) continue;

    // Has module-level createClient with SERVICE_ROLE_KEY
    if (/^(const|let) \w+ = createClient\(/m.test(content) && !content.includes("force-dynamic")) {
        // For pages, we can't use force-dynamic on the page itself easily
        // Instead, wrap in lazy function
        content = content.replace(
            /^(const|let) (\w+) = createClient\(\r?\n\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\r?\n\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY![^)]*\);/m,
            (match, decl, varName) => {
                return `function get${varName.charAt(0).toUpperCase() + varName.slice(1)}() {\r\n    return createClient(\r\n        process.env.NEXT_PUBLIC_SUPABASE_URL!,\r\n        process.env.SUPABASE_SERVICE_ROLE_KEY!\r\n    );\r\n}`;
            }
        );
        fs.writeFileSync(fp, content, 'utf8');
        console.log('[FIX2-page] Wrapped createClient:', fp);
        totalFixed++;
    }
}

// ── FIX 3: generateStaticParams with createClient but no try/catch ────────
for (const fp of pageFiles) {
    let content = fs.readFileSync(fp, 'utf8');
    if (!content.includes('generateStaticParams')) continue;
    if (!content.includes('createClient')) continue;

    // Check if already has try/catch inside generateStaticParams
    const funcMatch = content.match(/export\s+async\s+function\s+generateStaticParams\s*\([^)]*\)\s*\{/);
    if (!funcMatch) continue;

    const funcStart = funcMatch.index + funcMatch[0].length;
    const afterFunc = content.substring(funcStart, funcStart + 200);
    if (/^\s*[\r\n]*\s*try\s*\{/.test(afterFunc)) continue; // already wrapped

    // Find matching closing brace
    let depth = 1, i = funcStart;
    while (i < content.length && depth > 0) {
        if (content[i] === '{') depth++;
        if (content[i] === '}') depth--;
        i++;
    }
    const funcEnd = i;
    const body = content.substring(funcStart, funcEnd - 1);
    const indented = body.split('\n').map(l => '    ' + l).join('\n');
    const newBody = '\n    try {' + indented + '\n    } catch {\n        return [];\n    }\n';
    content = content.substring(0, funcStart) + newBody + content.substring(funcEnd - 1);
    fs.writeFileSync(fp, content, 'utf8');
    console.log('[FIX3-staticParams] Wrapped in try/catch:', fp);
    totalFixed++;
}

// ── FIX 4: Non-API routes with createClient and revalidate but no dynamic ─
for (const fp of allFiles) {
    if (!fp.includes('route.ts')) continue;
    if (fp.includes(path.sep + 'api' + path.sep)) continue; // already handled
    let content = fs.readFileSync(fp, 'utf8');
    if (content.includes('createClient') && !content.includes("force-dynamic")) {
        content = "export const dynamic = 'force-dynamic';\r\n" + content;
        fs.writeFileSync(fp, content, 'utf8');
        console.log('[FIX4-nonApiRoute] Added force-dynamic:', fp);
        totalFixed++;
    }
}

console.log('\n=== SWEEP COMPLETE ===');
console.log('Total files fixed:', totalFixed);
