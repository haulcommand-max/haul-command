const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/PC User/.gemini/antigravity/scratch/haul-command';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        if (file === 'node_modules' || file === '.git' || file === '.next') return;
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(dir);

let totalReplaced = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/57-Country/g, '120-Country');
    content = content.replace(/57-country/g, '120-country');
    content = content.replace(/57 countries/gi, '120 countries');
    content = content.replace(/countries: 57/g, 'countries: 120');
    content = content.replace(/All 57/g, 'All 120');
    content = content.replace(/\b57\b now/g, '120 now'); // All 57 now -> All 120 now
    content = content.replace(/\/57`/g, '/120`'); // `${stats.priced}/57`
    content = content.replace(/value: '57'/g, "value: '120'");
    content = content.replace(/x 57/g, 'x 120');
    content = content.replace(/\.limit\(57\)/g, '.limit(120)');

    if (original !== content) {
        fs.writeFileSync(file, content);
        totalReplaced++;
        console.log('Updated: ' + file);
    }
});

console.log('Total files updated: ' + totalReplaced);
