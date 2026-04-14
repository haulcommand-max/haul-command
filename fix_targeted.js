const fs = require('fs');

const log = fs.readFileSync('typecheck2.log', 'utf8');

// Find all files with errors
const files = [...new Set([...log.matchAll(/^([a-zA-Z0-9_\-\/\\\.\(]+[a-zA-Z0-9_\-\/\.]+\.tsx?)/gm)].map(m => m[1]))];
console.log(`Found ${files.length} files with type errors.`);

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');

    // Safe mojibake fixes:
    content = content.replace(/â”€/g, '-');
    content = content.replace(/âœ“/g, '✓');
    content = content.replace(/âš /g, '⚠️');
    content = content.replace(/âœ—/g, '✗');
    content = content.replace(/â†’/g, '→');
    content = content.replace(/ðŸš”/g, '🚓');
    
    // Exact string issues that break compilation
    content = content.replace(/Oct"“Jan/g, 'Oct-Jan');
    content = content.replace(/Feb"“Mar/g, 'Feb-Mar');
    content = content.replace(/April"“May/g, 'April-May');
    content = content.replace(/\$"“\$/g, '$-$');
    content = content.replace(/"“/g, '-');
    content = content.replace(/“/g, '"');
    content = content.replace(/”/g, '"');
    
    // Fix curly quotes ONLY inside valid contexts, or just universally to straight quotes 
    // actually replacing `’` with `'` inside jsx text usually breaks things if unescaped: `<div>Can't</div>`.
    // We will replace `’` with `&apos;` if it looks like it's inside text, but if it's inside a string it should be `'`.
    // The safest is to escape it to `&apos;` in TSX.
    content = content.replace(/([a-zA-Z])’([a-zA-Z])/g, "$1&apos;$2");
    content = content.replace(/([a-zA-Z])'([a-zA-Z])/g, "$1&apos;$2"); // fix standard unescaped apostrophes too if they got mangled
    
    // Fix the literal `&apos;` inside script string blocks (e.g. `const x = "We&apos;re"`)
    content = content.replace(/'((?:[^'\\]|\\.)*)'/g, (m, g1) => "'" + g1.replace(/&apos;/g, "\\'") + "'");
    content = content.replace(/"((?:[^"\\]|\\.)*)"/g, (m, g1) => '"' + g1.replace(/&apos;/g, "'") + '"');
    content = content.replace(/`((?:[^`\\]|\\.)*)`/g, (m, g1) => '`' + g1.replace(/&apos;/g, "'") + '`');

    fs.writeFileSync(file, content, 'utf8');
}
console.log('Done.');
