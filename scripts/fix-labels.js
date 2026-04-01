const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.resolve(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory() && !fullPath.includes('node_modules') && !fullPath.includes('.next')) {
            results = results.concat(walk(fullPath));
        } else if (stat && stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
            results.push(fullPath);
        }
    });
    return results;
}

const dirs = ['./components', './app'];
let changed = 0;

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = walk(dir);
    files.forEach(f => {
        let content = fs.readFileSync(f, 'utf8');
        if (content.includes('aria-label="Interactive Button"')) {
            content = content.replace(/ aria-label="Interactive Button"/g, '');
            fs.writeFileSync(f, content);
            changed++;
        }
    });
});

console.log('Fixed ' + changed + ' files.');
