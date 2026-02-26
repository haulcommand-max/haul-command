/**
 * Make ALL (public) SSG/ISR pages with createClient + SERVICE_ROLE_KEY
 * either force-dynamic or wrapped in try/catch.
 * 
 * Strategy: Find all non-client pages that call createClient with SERVICE_ROLE_KEY.
 * Force them to be dynamic so they don't prerender at build time.
 */
const fs = require('fs');
const path = require('path');

function walk(dir) {
    const results = [];
    try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) results.push(...walk(full));
            else if (/page\.(tsx|ts)$/.test(entry.name)) results.push(full);
        }
    } catch { }
    return results;
}

const appDir = path.join(__dirname, '..', 'app');
const pages = walk(appDir);
let fixed = 0;

for (const fp of pages) {
    let content = fs.readFileSync(fp, 'utf8');

    // Skip client components
    if (content.includes('"use client"') || content.includes("'use client'")) continue;

    // Skip if no SERVICE_ROLE_KEY
    if (!content.includes('SUPABASE_SERVICE_ROLE_KEY')) continue;

    // Skip if already force-dynamic
    if (content.includes("force-dynamic")) continue;

    // Add force-dynamic + remove generateStaticParams (conflicting with force-dynamic)
    // First add the export
    content = "export const dynamic = 'force-dynamic';\r\nexport const revalidate = 3600;\r\n" + content;

    // Remove generateStaticParams since force-dynamic makes it unnecessary
    // This prevents the conflict
    content = content.replace(
        /export\s+async\s+function\s+generateStaticParams\s*\([^)]*\)\s*\{[\s\S]*?\n\}/m,
        '// generateStaticParams removed — force-dynamic handles rendering at request time'
    );

    fs.writeFileSync(fp, content, 'utf8');
    console.log('Fixed:', fp);
    fixed++;
}

console.log('\nTotal fixed:', fixed);
