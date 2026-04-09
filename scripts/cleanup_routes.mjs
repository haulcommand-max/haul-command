import fs from 'fs';
import path from 'path';

function removeDirIfEmpty(dirPath) {
    if (fs.existsSync(dirPath)) {
        if (fs.readdirSync(dirPath).length === 0) {
            fs.rmdirSync(dirPath);
            console.log('Removed empty directory:', dirPath);
        }
    }
}

function safelyRemove(dirPath) {
    if (fs.existsSync(dirPath)) {
        console.log(`Removing ${dirPath}`);
        fs.rmSync(dirPath, { recursive: true, force: true });
    }
}

// 1. Corridors
safelyRemove('app/(public)/corridors/[corridor_id]');

// 2. Glossary
safelyRemove('app/glossary/[country]');
safelyRemove('app/glossary/[term]');
safelyRemove('app/glossary/topics/[topic-slug]');
safelyRemove('app/(public)/glossary');

// 3. Training
safelyRemove('app/(public)/training/[slug]');
safelyRemove('app/training/[module_slug]'); // wait, let's keep training_modules if it exists and delete (public)? No, (public) is my new one, but let's check which one holds the right file.

// Keep /training/[slug] in app/training/[slug] to be safe, delete the others.
// Actually let's just delete the ones that are obviously duplicates.
safelyRemove('app/(public)/training');

console.log('Cleanup finished.');
