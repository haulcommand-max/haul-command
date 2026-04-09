import fs from 'fs';
import path from 'path';

const APP_DIR = path.join(process.cwd(), 'app');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath, callback);
        } else if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
            callback(dirPath);
        }
    });
}

let modifiedFiles = 0;

walkDir(APP_DIR, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Convert pure bg-white to dark gray (bg-[#121212]) ensuring we don't break bg-white/10 
    content = content.replace(/(?<![a-zA-Z\-])bg-white(?![/\w\-])/g, 'bg-[#121212]');
    
    // Light grays
    content = content.replace(/bg-slate-50/g, 'bg-[#0A0A0A]');
    content = content.replace(/bg-gray-50/g, 'bg-[#1A1A1A]');
    content = content.replace(/bg-slate-100/g, 'bg-[#1E1E1E]');
    content = content.replace(/bg-slate-200/g, 'bg-[#252525]');
    content = content.replace(/bg-gray-100/g, 'bg-[#1A1A1A]');
    
    // Light borders
    content = content.replace(/border-gray-200/g, 'border-white/10');
    content = content.replace(/border-gray-300/g, 'border-white/20');
    content = content.replace(/border-slate-200/g, 'border-white/10');
    
    // Light mode text colors -> white/neutral equivalents
    content = content.replace(/text-gray-700/g, 'text-neutral-300');
    content = content.replace(/text-gray-900/g, 'text-white');
    content = content.replace(/text-slate-900/g, 'text-white');
    content = content.replace(/text-black/g, 'text-white');
    content = content.replace(/text-indigo-950/g, 'text-white');

    // Specific vendor form inputs
    content = content.replace(/bg-white text-gray-700/g, 'bg-[#1A1A1A] text-white');
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${path.relative(process.cwd(), filePath)}`);
        modifiedFiles++;
    }
});

console.log(`\n✅ Deep Dark Swept ${modifiedFiles} files.`);
