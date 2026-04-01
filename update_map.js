const fs = require('fs');
const tiers = {
  A: 'US,CA,AU,GB,NZ,ZA,DE,NL,AE,BR'.split(','),
  B: 'IE,SE,NO,DK,FI,BE,AT,CH,ES,FR,IT,PT,SA,QA,MX,IN,ID,TH'.split(','),
  C: 'PL,CZ,SK,HU,SI,EE,LV,LT,HR,RO,BG,GR,TR,KW,OM,BH,SG,MY,JP,KR,CL,AR,CO,PE,VN,PH'.split(','),
  D: 'UY,PA,CR,IL,NG,EG,KE,MA,RS,UA,KZ,TW,PK,BD,MN,TT,JO,GH,TZ,GE,AZ,CY,IS,LU,EC'.split(','),
  E: 'BO,PY,GT,DO,HN,SV,NI,JM,GY,SR,BA,ME,MK,AL,MD,IQ,NA,AO,MZ,ET,CI,SN,BW,ZM,UG,CM,KH,LK,UZ,LA,NP,DZ,TN,MT,BN,RW,MG,PG,TM,KG,MW'.split(',')
};
const isoToName = new Intl.DisplayNames(['en'], { type: 'region' });
function getFlagEmoji(countryCode) {
  return [...countryCode.toUpperCase()].map(char => String.fromCodePoint(char.charCodeAt(0) + 127397)).join('');
}

let arrayCode = `export const ALL_COUNTRIES: TierCountry[] = [`;

for (const [tier, list] of Object.entries(tiers)) {
  for (const iso of list) {
    const name = isoToName.of(iso);
    const flag = getFlagEmoji(iso);
    const live = tier === 'A';
    arrayCode += `\n  { iso: '${iso}', name: '${name.replace(/'/g, "\\'")}', flag: '${flag}', tier: '${tier}', operators: ${live ? 100 : 0}, corridors: ['Primary Highway'], live: ${live} },`;
  }
}
arrayCode += `\n];`;

const file = 'c:/Users/PC User/.gemini/antigravity/scratch/haul-command/components/map/worldMapData.ts';
let code = fs.readFileSync(file, 'utf8');

// replace interface
code = code.replace(/tier: 'A' \| 'B' \| 'C' \| 'D';/, "tier: 'A' | 'B' | 'C' | 'D' | 'E';");

// replace ALL_COUNTRIES
code = code.replace(/export const ALL_COUNTRIES: TierCountry\[\] = \[([\s\S]*?)\];/, arrayCode);

if (!code.includes("E: 'Tier E — Copper'")) {
    // Add Tier E to TIER_COLORS
    code = code.replace(/D: '#4A4A5A',\n};/, "D: '#4A4A5A',\n  E: '#8A7056',\n};");

    // Add Tier E to TIER_LABELS
    code = code.replace(/D: 'Tier D — Future',\n};/, "D: 'Tier D — Future',\n  E: 'Tier E — Copper',\n};");
}

fs.writeFileSync(file, code);
console.log('Update complete.');
