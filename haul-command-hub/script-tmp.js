const fs = require('fs');

const fileContent = fs.readFileSync('src/lib/seo-countries.ts', 'utf8');
const helpersContent = fs.readFileSync('src/lib/directory-helpers.ts', 'utf8');

const regex = /([a-z]{2}):\s*"([^"]+)"/g;
let match;
const countryMap = {};
while ((match = regex.exec(helpersContent)) !== null) {
  countryMap[match[1]] = match[2];
}

const existingSlugs = new Set();
const existingRegex = /slug:\s*'([a-z]{2})'/g;
while ((match = existingRegex.exec(fileContent)) !== null) {
  existingSlugs.add(match[1]);
}

const D_TIER = ['uy', 'pa', 'cr', 'il', 'ng', 'eg', 'ke', 'ma', 'rs', 'ua', 'kz', 'tw', 'pk', 'bd', 'mn', 'tt', 'jo', 'gh', 'tz', 'ge', 'az', 'cy', 'is', 'lu', 'ec'];
const E_TIER = ['bo', 'py', 'gt', 'do', 'hn', 'sv', 'ni', 'jm', 'gy', 'sr', 'ba', 'me', 'mk', 'al', 'md', 'iq', 'na', 'ao', 'mz', 'et', 'ci', 'sn', 'bw', 'zm', 'ug', 'cm', 'kh', 'lk', 'uz', 'la', 'np', 'dz', 'tn', 'mt', 'bn', 'rw', 'mg', 'pg', 'tm', 'kg', 'mw'];

let newEntries = '// ─── TIER D — Slate (remaining) ───\n';
for (const slug of D_TIER) {
  if (!existingSlugs.has(slug)) {
    const name = countryMap[slug] || slug.toUpperCase();
    newEntries += `    { code: '${slug.toUpperCase()}', name: '${name}', slug: '${slug}', flag: '🌍', tier: 'D' as const, lang: 'en', currency: 'USD', units: 'metric', terms: { pilot_car: 'Pilot Car', escort_vehicle: 'Escort Vehicle', oversize_load: 'Oversize Load', heavy_haul: 'Heavy Haul', wide_load: 'Wide Load', route_survey: 'Route Survey', superload: 'Superload', permit: 'Oversize Permit' }, regions: [], cities: [], equipment_focus: [] },\n`;
  }
}
newEntries += '// ─── TIER E — Copper (41) ───\n';
for (const slug of E_TIER) {
  if (!existingSlugs.has(slug)) {
    const name = countryMap[slug] || slug.toUpperCase();
    newEntries += `    { code: '${slug.toUpperCase()}', name: '${name}', slug: '${slug}', flag: '🌍', tier: 'E' as any, lang: 'en', currency: 'USD', units: 'metric', terms: { pilot_car: 'Pilot Car', escort_vehicle: 'Escort Vehicle', oversize_load: 'Oversize Load', heavy_haul: 'Heavy Haul', wide_load: 'Wide Load', route_survey: 'Route Survey', superload: 'Superload', permit: 'Oversize Permit' }, regions: [], cities: [], equipment_focus: [] },\n`;
  }
}

const lines = fileContent.split('\n');
const insertIndex = lines.findIndex(line => line.includes('// ─── Helper Functions ───'));
lines.splice(insertIndex - 1, 0, newEntries);

let updatedContent = lines.join('\n');
// Also need to add 'E' to the tier union type
updatedContent = updatedContent.replace("tier: 'A' | 'B' | 'C' | 'D';", "tier: 'A' | 'B' | 'C' | 'D' | 'E';");
updatedContent = updatedContent.replace("tier: 'A' | 'B' | 'C' | 'D'", "tier: 'A' | 'B' | 'C' | 'D' | 'E'");
// update "tier: 'E' as any" to "tier: 'E'"
updatedContent = updatedContent.replace(/tier: 'E' as any/g, "tier: 'E'");

fs.writeFileSync('src/lib/seo-countries.ts', updatedContent);
console.log('Appended missing countries to seo-countries.ts!');
