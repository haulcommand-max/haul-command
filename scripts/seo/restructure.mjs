/**
 * Script to restructure the directories to match Phase 1 Canonical Map
 */
import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_DIR = path.join(process.cwd(), 'app', '(public)');

const moves = [
    // 1. Move directory/[country] -> [country] (if [country] exists, just move the content)
    // 2. Move directory/profile/[slug] -> place/[slug]
    { from: path.join(PUBLIC_DIR, 'directory', 'profile'), to: path.join(PUBLIC_DIR, 'place') },
    // 3. Move corridors -> corridor
    { from: path.join(PUBLIC_DIR, 'corridors'), to: path.join(PUBLIC_DIR, 'corridor') },
];

for (const { from, to } of moves) {
    if (fs.existsSync(from)) {
        console.log(`Moving ${from} -> ${to}`);
        // Create parent of target if needed
        fs.mkdirSync(path.dirname(to), { recursive: true });
        // fs.renameSync can cause EPERM on Windows for directories 
        fs.cpSync(from, to, { recursive: true, force: true });
        fs.rmSync(from, { recursive: true, force: true });
    } else {
        console.log(`Skip (not found): ${from}`);
    }
}

// Clean up old directory/[country] specifically if it conflicts:
const oldDirectoryCountry = path.join(PUBLIC_DIR, 'directory', '[country]');
if (fs.existsSync(oldDirectoryCountry)) {
    console.log(`Removing old directory/[country] since /[country] is the new canonical...`);
    fs.rmSync(oldDirectoryCountry, { recursive: true, force: true });
}

// Remove empty pilot-car / high-pole-escorts if they conflict
const dirsToRemove = ['directory', 'pilot-car', 'high-pole-escorts', '[country]/places'];
for (const dir of dirsToRemove) {
    const p = path.join(PUBLIC_DIR, dir);
    if (fs.existsSync(p)) {
        console.log(`Removing deprecated folder: ${p}`);
        fs.rmSync(p, { recursive: true, force: true });
    }
}

console.log('Restructure complete.');
