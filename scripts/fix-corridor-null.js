const fs = require('fs');
const fp = 'app/(public)/corridors/[corridor]/page.tsx';
let c = fs.readFileSync(fp, 'utf8');

// Fix: page.title -> page?.title with fallback
c = c.replace(
    /name:\s*page\.title,/,
    "name: page?.title ?? h1Text,"
);
c = c.replace(
    /description:\s*page\.meta_description,/,
    "description: page?.meta_description ?? staticData?.metaDescription ?? '',"
);

fs.writeFileSync(fp, c, 'utf8');
console.log('Fixed null page references in corridors/[corridor]/page.tsx');
