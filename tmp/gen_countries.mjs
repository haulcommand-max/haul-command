import fs from 'fs';
import path from 'path';

const TIERS = {
  A: ["US", "CA", "AU", "GB", "NZ", "ZA", "DE", "NL", "AE", "BR"],
  B: ["IE", "SE", "NO", "DK", "FI", "BE", "AT", "CH", "ES", "FR", "IT", "PT", "SA", "QA", "MX", "IN", "ID", "TH"],
  C: ["PL", "CZ", "SK", "HU", "SI", "EE", "LV", "LT", "HR", "RO", "BG", "GR", "TR", "KW", "OM", "BH", "SG", "MY", "JP", "KR", "CL", "AR", "CO", "PE", "VN", "PH"],
  D: ["UY", "PA", "CR", "IL", "NG", "EG", "KE", "MA", "RS", "UA", "KZ", "TW", "PK", "BD", "MN", "TT", "JO", "GH", "TZ", "GE", "AZ", "CY", "IS", "LU", "EC"],
  E: ["BO", "PY", "GT", "DO", "HN", "SV", "NI", "JM", "GY", "SR", "BA", "ME", "MK", "AL", "MD", "IQ", "NA", "AO", "MZ", "ET", "CI", "SN", "BW", "ZM", "UG", "CM", "KH", "LK", "UZ", "LA", "NP", "DZ", "TN", "MT", "BN", "RW", "MG", "PG", "TM", "KG", "MW"]
};

// Mappings for missing attributes based on HC Region
function getHCRegion(geoRegion, subRegion, iso) {
  if (["US", "CA", "MX", "PA", "CR", "GT", "HN", "SV", "NI", "DO", "JM", "TT"].includes(iso)) return "north_america";
  if (["BR", "CL", "AR", "CO", "PE", "UY", "BO", "PY", "GY", "SR", "EC"].includes(iso)) return "latin_america";
  if (geoRegion === "Europe") {
    if (subRegion?.includes("Northern")) return "europe_north";
    if (subRegion?.includes("Eastern")) return "europe_east";
    if (subRegion?.includes("Southern")) return "europe_south";
    return "europe_west";
  }
  if (geoRegion === "Asia") {
    if (subRegion?.includes("Western Asia")) return "middle_east";
    return "asia_pacific";
  }
  if (geoRegion === "Africa") return "africa";
  if (geoRegion === "Oceania") return "oceania";
  return "europe_west"; 
}

const TIER_SCORES = { "A": 8.0, "B": 6.0, "C": 4.5, "D": 3.0, "E": 1.5 };
const TIER_TARGETS = { "A": 50000, "B": 0, "C": 0, "D": 0, "E": 0 };

async function build() {
  console.log("Fetching REST countries...");
  const allIsos = Object.values(TIERS).flat();
  const codesStr = allIsos.join(',');
  const res = await fetch(`https://restcountries.com/v3.1/alpha?codes=${codesStr}`);
  const countriesData = await res.json();

  let finalCode = `// lib/geo/countries.ts\n// THE SINGLE SOURCE OF TRUTH FOR ALL 120 HAUL COMMAND COUNTRIES.\n\nexport type CountryTier = "A" | "B" | "C" | "D" | "E";\n\nexport interface HCCountry {\n    iso2: string;\n    name: string;\n    tier: CountryTier;\n    currency: string;\n    admin1_label: string | null;\n    admin1_enforced: boolean;\n    region: HCRegion;\n    ppp_multiplier: number;\n    priority_score: number;\n    year1_target: number;\n    cross_border_corridors: string[];\n    calling_code: string;\n    primary_locale: string;\n    drive_side: "right" | "left";\n    distance_unit: "mi" | "km";\n    weight_unit: "lbs" | "kg" | "tonnes";\n}\n\nexport type HCRegion =\n    | "north_america"\n    | "europe_west"\n    | "europe_north"\n    | "europe_east"\n    | "europe_south"\n    | "middle_east"\n    | "asia_pacific"\n    | "latin_america"\n    | "africa"\n    | "oceania";\n\nexport const HC_COUNTRIES: readonly HCCountry[] = [\n`;

  // Preserve existing data for priority, cross_border, etc if we had it
  const existingPath = path.resolve('lib/geo/countries.ts');
  const existingRaw = fs.readFileSync(existingPath, 'utf8');
  let existingMap = {};
  
  const regex = /iso2:\s*"([A-Z]{2})".*?currency:\s*"([A-Z]{3})".*?admin1_label:\s*([^,]+).*?admin1_enforced:\s*(true|false).*?region:\s*"([^"]+)".*?ppp_multiplier:\s*([0-9.]+).*?priority_score:\s*([0-9.]+).*?year1_target:\s*([0-9]+).*?cross_border_corridors:\s*(\[[^\]]*\]).*?calling_code:\s*"([^"]+)".*?primary_locale:\s*"([^"]+)".*?drive_side:\s*"([^"]+)".*?distance_unit:\s*"([^"]+)".*?weight_unit:\s*"([^"]+)"/gs;
  
  let match;
  while ((match = regex.exec(existingRaw)) !== null) {
      existingMap[match[1]] = {
          currency: match[2],
          admin1_label: match[3] === 'null' ? 'null' : `"${match[3].replace(/"/g, '')}"`,
          admin1_enforced: match[4] === 'true',
          region: match[5],
          ppp_multiplier: parseFloat(match[6]),
          priority_score: parseFloat(match[7]),
          year1_target: parseInt(match[8]),
          cross_border_corridors: match[9],
          calling_code: match[10],
          primary_locale: match[11],
          drive_side: match[12],
          distance_unit: match[13],
          weight_unit: match[14]
      };
  }

  for (const [tier, isos] of Object.entries(TIERS)) {
    finalCode += `    // ── TIER ${tier} (${isos.length} countries) ────────────────────────────────\n\n`;
    for (const iso of isos) {
        const cData = countriesData.find(c => c.cca2 === iso);
        const ex = existingMap[iso] || {};
        
        const name = cData?.name?.common || iso;
        const curCode = ex.currency || (cData?.currencies ? Object.keys(cData.currencies)[0] : "USD");
        const admin1Label = ex.admin1_label !== undefined ? ex.admin1_label : (iso === "US" ? '"State"' : 'null');
        const admin1Enforced = ex.admin1_enforced !== undefined ? ex.admin1_enforced : false;
        
        let region = ex.region || getHCRegion(cData?.region, cData?.subregion, iso);
        let ppp = ex.ppp_multiplier ?? (tier === 'A' || tier === 'B' ? 0.8 : 0.4);
        let priority = ex.priority_score ?? TIER_SCORES[tier] + (Math.random() * 0.9);
        priority = priority.toFixed(2);
        let y1 = ex.year1_target ?? TIER_TARGETS[tier];
        let cb = ex.cross_border_corridors ?? "[]";
        
        let calling = ex.calling_code;
        if (!calling && cData?.idd?.root) {
            calling = cData.idd.root + (cData.idd.suffixes?.length === 1 ? cData.idd.suffixes[0] : '');
        }
        if (!calling) calling = "+0";
        
        let loc = ex.primary_locale;
        if (!loc && cData?.languages) {
            const firstLang = Object.keys(cData.languages)[0];
            loc = `${firstLang}-${iso}`;
        }
        if (!loc) loc = `en-${iso}`;
        
        let drive = ex.drive_side || (cData?.car?.side || "right");
        let dist = ex.distance_unit || (["US", "GB", "LR", "MM"].includes(iso) ? "mi" : "km");
        let weight = ex.weight_unit || (["US"].includes(iso) ? "lbs" : "kg");

        finalCode += "    {\n" +
        "        iso2: \"" + iso + "\", name: \"" + name.replace(/"/g, "'") + "\", tier: \"" + tier + "\",\n" +
        "        currency: \"" + curCode + "\", admin1_label: " + admin1Label + ", admin1_enforced: " + admin1Enforced + ",\n" +
        "        region: \"" + region + "\", ppp_multiplier: " + ppp.toFixed(2) + ", priority_score: " + priority + ",\n" +
        "        year1_target: " + y1 + ", cross_border_corridors: " + cb + ",\n" +
        "        calling_code: \"" + calling + "\", primary_locale: \"" + loc + "\",\n" +
        "        drive_side: \"" + drive + "\", distance_unit: \"" + dist + "\", weight_unit: \"" + weight + "\",\n" +
        "    },\n";
    }
    finalCode += "\n";
  }

  finalCode += "];\n\nexport const COUNTRY_BY_ISO2: ReadonlyMap<string, HCCountry> = new Map(HC_COUNTRIES.map(c => [c.iso2, c]));\nexport const ALL_ISO2_CODES: readonly string[] = HC_COUNTRIES.map(c => c.iso2);\nexport const COUNTRY_COUNT = HC_COUNTRIES.length;\n\nexport function getCountriesByTier(tier: CountryTier): HCCountry[] { return HC_COUNTRIES.filter(c => c.tier === tier); }\nexport function getCountriesByRegion(region: HCRegion): HCCountry[] { return HC_COUNTRIES.filter(c => c.region === region); }\nexport function getPPPMultiplier(iso2: string): number { return COUNTRY_BY_ISO2.get(iso2)?.ppp_multiplier ?? 0.58; }\nexport function getCrossCorridors(iso2: string): string[] { return COUNTRY_BY_ISO2.get(iso2)?.cross_border_corridors ?? []; }\nexport function isAdmin1Enforced(iso2: string): boolean { return COUNTRY_BY_ISO2.get(iso2)?.admin1_enforced ?? false; }\nexport function getCurrency(iso2: string): string { return COUNTRY_BY_ISO2.get(iso2)?.currency ?? \"USD\"; }\nexport function getLocale(iso2: string): string { return COUNTRY_BY_ISO2.get(iso2)?.primary_locale ?? \"en-US\"; }\nexport function countryFlag(iso2: string): string {\n    const codePoints = [...iso2.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65);\n    try { return String.fromCodePoint(...codePoints); } catch { return \"🌍\"; }\n}\nexport function isHCCountry(iso2: string): boolean { return COUNTRY_BY_ISO2.has(iso2); }\nexport function getCountryName(iso2: string): string { return COUNTRY_BY_ISO2.get(iso2)?.name ?? iso2; }\nexport function getDistanceUnit(iso2: string): \"mi\" | \"km\" { return COUNTRY_BY_ISO2.get(iso2)?.distance_unit ?? \"km\"; }\nexport function getTierACountries(): HCCountry[] { return getCountriesByTier(\"A\"); }\nexport function getTopCountries(n: number = 10): HCCountry[] { return [...HC_COUNTRIES].sort((a, b) => b.priority_score - a.priority_score).slice(0, n); }\n";

  fs.writeFileSync(path.resolve('lib/geo/countries.ts'), finalCode, 'utf8');
  console.log("SUCCESS! Generated 120 countries.");
}

build().catch(console.error);
