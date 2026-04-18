const fs = require('fs');
const path = require('path');

const base = process.cwd();

function rmDir(dirPath) {
    const full = path.join(base, dirPath);
    if (fs.existsSync(full)) {
        console.log('REMOVING:', full);
        fs.rmSync(full, { recursive: true, force: true });
    } else {
        console.log('SKIP (not found):', full);
    }
}

// ---- ERROR 1: /(landing) vs /(public) root page collision ----
// The (landing) group has page.tsx which serves "/", and (public) also has page.tsx serving "/"
// KEEP: (landing) for the homepage, REMOVE: (public)/page.tsx
const publicPage = path.join(base, 'app/(public)/page.tsx');
if (fs.existsSync(publicPage)) {
    console.log('REMOVING (public) root page to resolve collision with (landing):', publicPage);
    fs.unlinkSync(publicPage);
}

// ---- ERROR 2: /(public)/available-now vs /available-now ----
// KEEP: (public)/available-now (has layout wrapper), REMOVE: standalone
rmDir('app/available-now');

// ---- ERROR 3: /(public)/blog vs /blog ----  
// KEEP: (public)/blog (has layout wrapper), REMOVE: standalone
rmDir('app/blog');

// ---- ERROR 4: /(public)/directory vs /directory ----
// KEEP: /directory (the main, heavily built directory page), REMOVE: (public)/directory
rmDir('app/(public)/directory');

// ---- ERROR 5: /(public)/training vs /training ----
// KEEP: /training (the main training page), REMOVE: (public)/training
rmDir('app/(public)/training');

// ---- ERROR 6: Fix GlobalOmniSearch import ----
// Component exists at app/components/ui/GlobalOmniSearch.tsx but layout imports from @/components/ui/GlobalOmniSearch
// Solution: Copy it to the right place
const src = path.join(base, 'app/components/ui/GlobalOmniSearch.tsx');
const destDir = path.join(base, 'components/ui');
const dest = path.join(destDir, 'GlobalOmniSearch.tsx');
if (fs.existsSync(src) && !fs.existsSync(dest)) {
    console.log('COPYING GlobalOmniSearch to components/ui/');
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
} else if (fs.existsSync(dest)) {
    console.log('GlobalOmniSearch already exists at correct path');
} else {
    // Create a stub
    console.log('CREATING stub GlobalOmniSearch at components/ui/');
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(dest, `'use client';
import React from 'react';
/** Global OmniSearch — directory + glossary + tools unified search bar */
export function GlobalOmniSearch() {
  return (
    <div className="relative w-full">
      <input
        type="search"
        placeholder="Search operators, tools, glossary…"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500/40 transition"
      />
    </div>
  );
}
`);
}

console.log('\\n=== Route collision cleanup complete ===');
