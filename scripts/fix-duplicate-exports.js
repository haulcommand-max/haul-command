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

const files = walk(path.join(__dirname, '..', 'app'));
let fixed = 0;

for (const fp of files) {
    let content = fs.readFileSync(fp, 'utf8');
    let changed = false;

    // Fix duplicate 'export const revalidate'
    const revalMatches = content.match(/^export const revalidate\s*=\s*\d+;.*$/gm);
    if (revalMatches && revalMatches.length > 1) {
        // Keep the first, remove all subsequent
        let count = 0;
        content = content.replace(/^export const revalidate\s*=\s*\d+;.*$/gm, (match) => {
            count++;
            return count === 1 ? match : '';
        });
        changed = true;
        console.log('Fixed revalidate dup:', fp);
    }

    // Fix duplicate 'export const dynamic'
    const dynMatches = content.match(/^export const dynamic\s*=\s*'force-dynamic';.*$/gm);
    if (dynMatches && dynMatches.length > 1) {
        let count = 0;
        content = content.replace(/^export const dynamic\s*=\s*'force-dynamic';.*$/gm, (match) => {
            count++;
            return count === 1 ? match : '';
        });
        changed = true;
        console.log('Fixed dynamic dup:', fp);
    }

    if (changed) {
        // Clean up empty lines left behind
        content = content.replace(/\n{3,}/g, '\n\n');
        fs.writeFileSync(fp, content, 'utf8');
        fixed++;
    }
}
console.log('Total fixed:', fixed);
