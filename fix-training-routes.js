const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'app', 'training');
const regionDir = path.join(base, 'region');

// Ensure region directories exist
fs.mkdirSync(path.join(regionDir, '[country]', '[state]'), { recursive: true });

// Move [country]/page.tsx -> region/[country]/page.tsx
const countryPage = path.join(base, '[country]', 'page.tsx');
const countryDest = path.join(regionDir, '[country]', 'page.tsx');
if (fs.existsSync(countryPage)) {
  let content = fs.readFileSync(countryPage, 'utf-8');
  // Update canonical URLs
  content = content.replace(/\/training\/\$\{country\}/g, '/training/region/${country}');
  content = content.replace(/\/training\/united-states\//g, '/training/region/united-states/');
  content = content.replace("'https://www.haulcommand.com/training/${country}'", "'https://www.haulcommand.com/training/region/${country}'");
  fs.writeFileSync(countryDest, content, 'utf-8');
  console.log('Moved and updated:', countryPage, '->', countryDest);
}

// Move [country]/[state]/page.tsx -> region/[country]/[state]/page.tsx
const statePage = path.join(base, '[country]', '[state]', 'page.tsx');
const stateDest = path.join(regionDir, '[country]', '[state]', 'page.tsx');
if (fs.existsSync(statePage)) {
  let content = fs.readFileSync(statePage, 'utf-8');
  // Update canonical URLs
  content = content.replace(/\/training\/\$\{country\}/g, '/training/region/${country}');
  fs.writeFileSync(stateDest, content, 'utf-8');
  console.log('Moved and updated:', statePage, '->', stateDest);
}

// Update countries/page.tsx links from /training/{country} to /training/region/{country}
const countriesPage = path.join(base, 'countries', 'page.tsx');
if (fs.existsSync(countriesPage)) {
  let content = fs.readFileSync(countriesPage, 'utf-8');
  content = content.replace(/href=\{`\/training\/\$\{/g, 'href={`/training/region/${');
  content = content.replace("canonical: 'https://www.haulcommand.com/training/countries'", "canonical: 'https://www.haulcommand.com/training/countries'");
  fs.writeFileSync(countriesPage, content, 'utf-8');
  console.log('Updated links in:', countriesPage);
}

// Update main training page.tsx links to countries
const mainPage = path.join(base, 'page.tsx');
if (fs.existsSync(mainPage)) {
  let content = fs.readFileSync(mainPage, 'utf-8');
  // Update country links like /training/united-states -> /training/region/united-states
  content = content.replace(/href="\/training\/(united-states|canada|australia|united-kingdom|uae|germany|netherlands|brazil)"/g, 'href="/training/region/$1"');
  content = content.replace(/href=\{['"]\/training\/(united-states|canada|australia|united-kingdom|uae|germany|netherlands|brazil)['"]\}/g, "href={'/training/region/$1'}");
  // Fix template literals for state links
  content = content.replace(/href=\{`\/training\/united-states\/\$\{/g, 'href={`/training/region/united-states/${');
  fs.writeFileSync(mainPage, content, 'utf-8');
  console.log('Updated country links in:', mainPage);
}

// Remove old [country] directory
function removeRecursive(p) {
  if (!fs.existsSync(p)) return;
  if (fs.statSync(p).isDirectory()) {
    fs.readdirSync(p).forEach(f => removeRecursive(path.join(p, f)));
    fs.rmdirSync(p);
    console.log('Removed dir:', p);
  } else {
    fs.unlinkSync(p);
    console.log('Removed file:', p);
  }
}

removeRecursive(path.join(base, '[country]'));
console.log('DONE - Training routes restructured: [country] -> region/[country]');
