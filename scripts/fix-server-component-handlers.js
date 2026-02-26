/**
 * FIX: Replace onMouseEnter/onMouseLeave event handlers in Server Components
 * with CSS-only hover equivalents. Client components are skipped.
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

    // Skip client components — they can have event handlers
    if (content.includes('"use client"') || content.includes("'use client'")) continue;

    // Skip if no onMouse handlers
    if (!content.includes('onMouseEnter') && !content.includes('onMouseLeave')) continue;

    // Strategy: Remove onMouseEnter/onMouseLeave blocks and their containing style= blocks
    // Replace with Tailwind hover classes where the style= sets background/borderColor

    // Pattern 1: style={{ ... }} + onMouseEnter + onMouseLeave on Link/div
    // Remove style + onMouse blocks, add hover classes to className

    // Remove onMouseEnter={...} blocks (handles multi-line arrow functions)
    content = content.replace(
        /\s*onMouseEnter=\{[^}]*\{[^}]*\}[^}]*\}/g,
        ''
    );
    content = content.replace(
        /\s*onMouseEnter=\{[^}]+\}/g,
        ''
    );

    // Remove onMouseLeave={...} blocks
    content = content.replace(
        /\s*onMouseLeave=\{[^}]*\{[^}]*\}[^}]*\}/g,
        ''
    );
    content = content.replace(
        /\s*onMouseLeave=\{[^}]+\}/g,
        ''
    );

    // Remove style={{ background: "rgba(...)", borderColor: "rgba(...)" }}
    // and replace with Tailwind classes
    content = content.replace(
        /\s*style=\{\{\s*background:\s*"rgba\(255,255,255,0\.02\)",\s*borderColor:\s*"rgba\(255,255,255,0\.0[78]\)"\s*\}\}/g,
        ''
    );

    // Where className includes "transition-all" but not hover classes, add them
    // This is a safe heuristic - only adds if transition-all exists (interactive element)
    content = content.replace(
        /className="([^"]*transition-all)"/g,
        (match, classes) => {
            if (classes.includes('hover:bg-')) return match; // already has hover
            return `className="${classes} bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"`;
        }
    );

    if (content !== fs.readFileSync(fp, 'utf8')) {
        fs.writeFileSync(fp, content, 'utf8');
        console.log('Fixed:', fp);
        fixed++;
    }
}

console.log('\nTotal fixed:', fixed);
