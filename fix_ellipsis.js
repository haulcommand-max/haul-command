const fs = require('fs');
const path = require('path');

function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
            let t = fs.readFileSync(p, 'utf8');
            if (t.includes('"¦')) {
                fs.writeFileSync(p, t.replace(/"¦/g, '...'), 'utf8');
                console.log('Fixed', p);
            }
        }
    }
}
walk('app');
