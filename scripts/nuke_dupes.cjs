const fs = require('fs');
const path = require('path');

function rmDir(dirPath) {
    if (fs.existsSync(dirPath)) {
        console.log('Removing:', dirPath);
        fs.rmSync(dirPath, { recursive: true, force: true });
    }
}

// Corridors
rmDir(path.join(process.cwd(), 'app/(public)/corridors/[corridor_id]'));
rmDir(path.join(process.cwd(), 'app/corridors/[origin]')); // conflict with [slug]

// Glossary
rmDir(path.join(process.cwd(), 'app/(public)/glossary/[country]'));
rmDir(path.join(process.cwd(), 'app/(public)/glossary/[slug]'));
rmDir(path.join(process.cwd(), 'app/(public)/glossary/topics/[topic-slug]'));

// Training
rmDir(path.join(process.cwd(), 'app/(public)/training/[slug]'));
rmDir(path.join(process.cwd(), 'app/training/[country_slug]')); // conflict with [module_slug]
