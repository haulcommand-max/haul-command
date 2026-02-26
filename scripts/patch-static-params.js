const fs = require('fs');
const path = require('path');

function walk(dir) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) results.push(...walk(full));
        else if (entry.name === 'page.tsx' || entry.name === 'page.ts') results.push(full);
    }
    return results;
}

const appDir = path.join(__dirname, '..', 'app');
const pages = walk(appDir);
let patched = 0;

for (const fp of pages) {
    let content = fs.readFileSync(fp, 'utf8');

    // Only target files with generateStaticParams that call createClient inside
    if (!content.includes('generateStaticParams')) continue;
    if (!content.includes('createClient')) continue;

    // Check if already wrapped in try/catch
    const funcMatch = content.match(/export\s+async\s+function\s+generateStaticParams\s*\([^)]*\)\s*\{/);
    if (!funcMatch) continue;

    const funcStart = funcMatch.index + funcMatch[0].length;
    // Check next 50 chars for 'try'
    const afterFunc = content.substring(funcStart, funcStart + 100);
    if (/^\s*\n?\s*try\s*\{/.test(afterFunc)) {
        // Already has try-catch
        continue;
    }

    // Find the end of the function by matching braces
    let depth = 1;
    let i = funcStart;
    while (i < content.length && depth > 0) {
        if (content[i] === '{') depth++;
        if (content[i] === '}') depth--;
        i++;
    }
    const funcEnd = i;

    // Extract the function body
    const body = content.substring(funcStart, funcEnd - 1);

    // Wrap it
    const newBody = `\n    try {${body.split('\n').map(l => '    ' + l).join('\n')}\n    } catch {\n        return []; // ISR handles at runtime\n    }\n`;

    content = content.substring(0, funcStart) + newBody + content.substring(funcEnd - 1);

    fs.writeFileSync(fp, content, 'utf8');
    console.log('Patched:', fp);
    patched++;
}

console.log(`\nDone. Patched ${patched} files.`);
