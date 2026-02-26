const fs = require('fs');
const path = require('path');

function walk(dir) {
    const results = [];
    try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) results.push(...walk(full));
            else if (/page\.tsx$/.test(entry.name)) results.push(full);
        }
    } catch { }
    return results;
}

const files = walk(path.join(__dirname, '..', 'app'));

console.log('=== SERVER COMPONENTS WITH EVENT HANDLERS ===');
let issues = 0;
for (const f of files) {
    const c = fs.readFileSync(f, 'utf8');
    if (c.includes('"use client"') || c.includes("'use client'")) continue;

    const problems = [];
    if (/\bonClick=/.test(c)) problems.push('onClick');
    if (/\bonChange=/.test(c)) problems.push('onChange');
    if (/\bonSubmit=/.test(c)) problems.push('onSubmit');
    if (/\bonMouse/.test(c)) problems.push('onMouse*');
    if (/\bonFocus=/.test(c)) problems.push('onFocus');
    if (/\bonBlur=/.test(c)) problems.push('onBlur');

    if (problems.length > 0) {
        console.log('  ISSUE:', f.replace(__dirname + path.sep + '..', ''), '-', problems.join(', '));
        issues++;
    }
}
console.log('Total issues:', issues);
