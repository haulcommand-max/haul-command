const fs = require('fs');
const path = require('path');

function walk(dir) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) results.push(...walk(full));
        else if (entry.name === 'route.ts') results.push(full);
    }
    return results;
}

const apiDir = path.join(__dirname, '..', 'app', 'api');
const routes = walk(apiDir);
let patched = 0;

for (const fp of routes) {
    let content = fs.readFileSync(fp, 'utf8');

    // Skip if no module-level createClient
    if (!/^const supabase = createClient\(/m.test(content)) continue;

    // Replace multi-line createClient block (handle \r\n)
    // Pattern: const supabase = createClient(\r?\n    process.env...,\r?\n    process.env...\r?\n);\r?\n
    content = content.replace(
        /^const supabase = createClient\(\r?\n\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\r?\n\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY!\r?\n\);/m,
        `function getSupabase() {\r\n    return createClient(\r\n        process.env.NEXT_PUBLIC_SUPABASE_URL!,\r\n        process.env.SUPABASE_SERVICE_ROLE_KEY!\r\n    );\r\n}`
    );

    // Still has the old pattern? (maybe additional options like { auth: ... })
    content = content.replace(
        /^const supabase = createClient\(\r?\n[^)]+\);/m,
        `function getSupabase() {\r\n    return createClient(\r\n        process.env.NEXT_PUBLIC_SUPABASE_URL!,\r\n        process.env.SUPABASE_SERVICE_ROLE_KEY!\r\n    );\r\n}`
    );

    // Ensure force-dynamic exists
    if (!content.includes("export const dynamic")) {
        content = "export const dynamic = 'force-dynamic';\r\n" + content;
    }

    fs.writeFileSync(fp, content, 'utf8');
    console.log('Patched:', fp);
    patched++;
}

console.log(`\nDone. Patched ${patched} files.`);
