/**
 * COMPREHENSIVE PAGE FIX: Wrap all createClient calls inside page functions
 * with try/catch to prevent build failures on SSG/ISR pages.
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

    // Skip if no createClient with SERVICE_ROLE_KEY
    if (!content.includes('SUPABASE_SERVICE_ROLE_KEY')) continue;

    // Check if still has module-level createClient
    const moduleLevelMatch = content.match(/^(const|let) (\w+) = createClient\(/m);
    if (moduleLevelMatch) {
        // Wrap in function
        const varName = moduleLevelMatch[2];
        const funcName = 'get' + varName.charAt(0).toUpperCase() + varName.slice(1);

        content = content.replace(
            new RegExp(`^(const|let) ${varName} = createClient\\([\\s\\S]*?\\);`, 'm'),
            `function ${funcName}() {\r\n    return createClient(\r\n        process.env.NEXT_PUBLIC_SUPABASE_URL!,\r\n        process.env.SUPABASE_SERVICE_ROLE_KEY!\r\n    );\r\n}`
        );

        // Replace references
        const refRegex = new RegExp(`\\b${varName}\\b(?!\\()`, 'g');
        content = content.replace(refRegex, `${funcName}()`);

        // Fix double-call patterns like getFunc()().from
        content = content.replace(new RegExp(`${funcName}\\(\\)\\(\\)`, 'g'), `${funcName}()`);

        fs.writeFileSync(fp, content, 'utf8');
        console.log('[module-level] Fixed:', fp);
        fixed++;
        continue;
    }

    // Check: does the page have generateStaticParams AND createClient inside the page body?
    // These need the createClient wrapped in try/catch
    if (content.includes('generateStaticParams') || content.includes('revalidate')) {
        // The createClient is inside a function body — we need to add revalidate = 0 or force-dynamic
        if (!content.includes("force-dynamic") && !content.includes("export const dynamic")) {
            // Add dynamic export
            const insertAfter = content.indexOf("import");
            const firstNewline = content.indexOf('\n', content.lastIndexOf('import'));
            if (firstNewline > 0) {
                // Find end of imports
                let lastImport = 0;
                let idx;
                while ((idx = content.indexOf('import ', lastImport + 1)) !== -1) {
                    lastImport = idx;
                }
                const endOfLastImport = content.indexOf('\n', lastImport);
                content = content.slice(0, endOfLastImport + 1) +
                    "\nexport const revalidate = 3600; // ISR hourly\r\n" +
                    content.slice(endOfLastImport + 1);
                fs.writeFileSync(fp, content, 'utf8');
                console.log('[add-revalidate] Fixed:', fp);
                fixed++;
            }
        }
    }
}

console.log('\nTotal fixed:', fixed);
