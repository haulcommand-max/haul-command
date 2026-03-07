// ═══════════════════════════════════════════════════════════
// GLOBAL SEMANTIC VARIANT ENGINE
// Generates native-language keyword variants for all 52 countries
// Purpose: Each country gets search-optimized keywords in their language
// ═══════════════════════════════════════════════════════════

import { getEscortTerminology, GLOBAL_ESCORT_TERMS } from './escort-terminology';
import { COUNTRY_INFRA_SEEDS } from './infrastructure-keywords';
import { KEYWORD_SEED_PACKS } from './keyword-seed-packs';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface CountrySemanticPack {
    iso2: string;
    country: string;
    languages: string[];
    /** Core service variants in all languages for this country */
    serviceVariants: string[];
    /** City × service cross-products */
    geoServiceVariants: string[];
    /** Infrastructure × service cross-products */
    infraServiceVariants: string[];
    /** Equipment × geo cross-products */
    equipmentGeoVariants: string[];
    /** Job/career search variants */
    jobVariants: string[];
    /** Platform/directory search variants */
    platformVariants: string[];
    /** Near-me / urgency variants */
    intentVariants: string[];
    /** Total unique keywords generated */
    totalKeywords: number;
}

// ═══════════════════════════════════════════════════════════
// PREPOSITION MAP — "in" in each language
// ═══════════════════════════════════════════════════════════

const GEO_PREPOSITIONS: Record<string, { in: string; near: string }> = {
    en: { in: 'in', near: 'near' },
    es: { in: 'en', near: 'cerca de' },
    fr: { in: 'à', near: 'près de' },
    de: { in: 'in', near: 'nahe' },
    pt: { in: 'em', near: 'perto de' },
    nl: { in: 'in', near: 'nabij' },
    it: { in: 'a', near: 'vicino a' },
    sv: { in: 'i', near: 'nära' },
    no: { in: 'i', near: 'nær' },
    da: { in: 'i', near: 'nær' },
    fi: { in: '', near: 'lähellä' },       // Finnish uses cases, "" = ssa/ssä suffix
    pl: { in: 'w', near: 'blisko' },
    cs: { in: 'v', near: 'blízko' },
    sk: { in: 'v', near: 'blízko' },
    hu: { in: '', near: 'közel' },          // Hungarian uses suffixes
    sl: { in: 'v', near: 'blizu' },
    et: { in: '', near: 'lähedal' },
    lv: { in: '', near: 'netālu no' },
    lt: { in: '', near: 'netoli' },
    hr: { in: 'u', near: 'blizu' },
    ro: { in: 'în', near: 'lângă' },
    bg: { in: 'в', near: 'близо до' },
    el: { in: 'στην', near: 'κοντά σε' },
    tr: { in: '', near: 'yakınında' },       // Turkish uses suffixes
    ar: { in: 'في', near: 'بالقرب من' },
    ja: { in: '', near: '近く' },
    ko: { in: '', near: '근처' },
    ms: { in: 'di', near: 'dekat' },
};

// ═══════════════════════════════════════════════════════════
// JOB SEARCH TEMPLATES PER LANGUAGE
// ═══════════════════════════════════════════════════════════

const JOB_TEMPLATES: Record<string, (term: string, city?: string) => string[]> = {
    en: (t, c) => [`${t} jobs${c ? ` ${c}` : ''}`, `how to become a ${t}`, `${t} salary`, `hiring ${t}${c ? ` ${c}` : ''}`],
    es: (t, c) => [`trabajo ${t}${c ? ` ${c}` : ''}`, `empleo ${t}`, `salario ${t}`, `cómo ser ${t}`],
    fr: (t, c) => [`emploi ${t}${c ? ` ${c}` : ''}`, `travail ${t}`, `salaire ${t}`, `devenir ${t}`],
    de: (t, c) => [`${t} Jobs${c ? ` ${c}` : ''}`, `${t} Gehalt`, `${t} Stellenangebot`, `${t} werden`],
    pt: (t, c) => [`trabalho ${t}${c ? ` ${c}` : ''}`, `emprego ${t}`, `salário ${t}`, `como ser ${t}`],
    nl: (t, c) => [`${t} vacature${c ? ` ${c}` : ''}`, `${t} salaris`, `${t} baan`],
    it: (t, c) => [`lavoro ${t}${c ? ` ${c}` : ''}`, `stipendio ${t}`, `come diventare ${t}`],
    ar: (t, c) => [`وظائف ${t}${c ? ` ${c}` : ''}`, `راتب ${t}`, `كيف تصبح ${t}`],
    ja: (t, c) => [`${t} 求人${c ? ` ${c}` : ''}`, `${t} 給料`, `${t} なり方`],
    ko: (t, c) => [`${t} 채용${c ? ` ${c}` : ''}`, `${t} 급여`, `${t} 되는법`],
    tr: (t, c) => [`${t} iş ilanı${c ? ` ${c}` : ''}`, `${t} maaş`, `${t} nasıl olunur`],
};

// ═══════════════════════════════════════════════════════════
// PLATFORM/DIRECTORY TEMPLATES
// ═══════════════════════════════════════════════════════════

const PLATFORM_TEMPLATES: Record<string, (term: string) => string[]> = {
    en: (t) => [`${t} directory`, `find ${t} online`, `${t} marketplace`, `book ${t}`, `${t} app`],
    es: (t) => [`directorio ${t}`, `buscar ${t}`, `plataforma ${t}`, `app ${t}`],
    fr: (t) => [`annuaire ${t}`, `trouver ${t}`, `plateforme ${t}`, `application ${t}`],
    de: (t) => [`${t} Verzeichnis`, `${t} suchen`, `${t} Plattform`, `${t} App`],
    pt: (t) => [`diretório ${t}`, `encontrar ${t}`, `plataforma ${t}`, `app ${t}`],
    it: (t) => [`directory ${t}`, `trovare ${t}`, `piattaforma ${t}`],
    ar: (t) => [`دليل ${t}`, `البحث عن ${t}`, `تطبيق ${t}`],
    ja: (t) => [`${t} 一覧`, `${t} 検索`, `${t} アプリ`],
    ko: (t) => [`${t} 검색`, `${t} 앱`, `${t} 목록`],
};

// ═══════════════════════════════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════════════════════════════

export function generateCountrySemanticPack(iso2: string): CountrySemanticPack | null {
    const terms = getEscortTerminology(iso2);
    const infra = COUNTRY_INFRA_SEEDS.find(s => s.iso2 === iso2);
    const seeds = KEYWORD_SEED_PACKS.find(p => p.iso2 === iso2);
    if (!terms || !infra || !seeds) return null;

    const primaryLang = seeds.languages[0] || 'en';
    const prep = GEO_PREPOSITIONS[primaryLang] || GEO_PREPOSITIONS.en;

    // 1. Core service variants (native terms × variations)
    const serviceVariants: string[] = [];
    for (const term of terms.escortVehicle.slice(0, 4)) {
        serviceVariants.push(term);
        serviceVariants.push(`${term} ${seeds.country.toLowerCase()}`);
        for (const oversize of terms.oversizeLoad.slice(0, 2)) {
            serviceVariants.push(`${term} ${oversize}`);
        }
    }

    // 2. City × service (highest SEO value)
    const geoServiceVariants: string[] = [];
    for (const city of seeds.geoModifiers.slice(0, 8)) {
        for (const term of terms.escortVehicle.slice(0, 2)) {
            geoServiceVariants.push(`${term} ${prep.in} ${city}`);
            geoServiceVariants.push(`${term} ${prep.near} ${city}`);
            geoServiceVariants.push(`${term} ${city}`);
        }
    }

    // 3. Infrastructure × service (long-tail gold)
    const infraServiceVariants: string[] = [];
    for (const port of infra.ports.slice(0, 3)) {
        for (const term of terms.escortVehicle.slice(0, 2)) {
            infraServiceVariants.push(`${term} ${prep.near} ${port}`);
            infraServiceVariants.push(`${term} ${port}`);
        }
    }
    for (const corridor of infra.corridors.slice(0, 3)) {
        infraServiceVariants.push(`${terms.escortVehicle[0]} ${corridor}`);
    }

    // 4. Equipment × geo
    const equipmentGeoVariants: string[] = [];
    for (const equip of seeds.equipmentTerms.slice(0, 3)) {
        for (const city of seeds.geoModifiers.slice(0, 3)) {
            equipmentGeoVariants.push(`${equip} ${city}`);
        }
    }

    // 5. Job variants
    const jobVariants: string[] = [];
    const jobGen = JOB_TEMPLATES[primaryLang] || JOB_TEMPLATES.en;
    const primaryJobTitle = terms.jobTitles?.[0] || terms.operatorRole[0] || terms.escortVehicle[0];
    jobVariants.push(...jobGen(primaryJobTitle));
    if (seeds.geoModifiers[0]) {
        jobVariants.push(...jobGen(primaryJobTitle, seeds.geoModifiers[0]));
    }

    // 6. Platform/directory variants
    const platformVariants: string[] = [];
    const platGen = PLATFORM_TEMPLATES[primaryLang] || PLATFORM_TEMPLATES.en;
    platformVariants.push(...platGen(terms.escortVehicle[0]));

    // 7. Intent variants (near me, urgency)
    const intentVariants: string[] = [];
    for (const term of terms.escortVehicle.slice(0, 2)) {
        for (const urgency of seeds.urgencyModifiers.slice(0, 3)) {
            intentVariants.push(`${term} ${urgency}`);
        }
    }

    // Deduplicate everything
    const allSets = [serviceVariants, geoServiceVariants, infraServiceVariants, equipmentGeoVariants, jobVariants, platformVariants, intentVariants];
    for (const set of allSets) {
        const unique = [...new Set(set.map(s => s.trim().toLowerCase()))];
        set.length = 0;
        set.push(...unique);
    }

    return {
        iso2,
        country: seeds.country,
        languages: seeds.languages,
        serviceVariants,
        geoServiceVariants,
        infraServiceVariants,
        equipmentGeoVariants,
        jobVariants,
        platformVariants,
        intentVariants,
        totalKeywords: serviceVariants.length + geoServiceVariants.length + infraServiceVariants.length +
            equipmentGeoVariants.length + jobVariants.length + platformVariants.length + intentVariants.length,
    };
}

// ═══════════════════════════════════════════════════════════
// GLOBAL KEYWORD COUNT
// ═══════════════════════════════════════════════════════════

export function getGlobalKeywordStats(): {
    totalCountries: number;
    totalKeywords: number;
    byCountry: { iso2: string; country: string; keywords: number }[];
} {
    const ALL_COUNTRIES = [
        'US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'DE', 'NL', 'AE', 'BR',
        'IE', 'SE', 'NO', 'DK', 'FI', 'BE', 'AT', 'CH', 'ES', 'FR', 'IT', 'PT', 'SA', 'QA', 'MX',
        'PL', 'CZ', 'SK', 'HU', 'SI', 'EE', 'LV', 'LT', 'HR', 'RO', 'BG', 'GR', 'TR', 'KW', 'OM', 'BH', 'SG', 'MY', 'JP', 'KR', 'CL', 'AR', 'CO', 'PE',
        'UY', 'PA', 'CR',
    ];

    let totalKeywords = 0;
    const byCountry: { iso2: string; country: string; keywords: number }[] = [];

    for (const iso2 of ALL_COUNTRIES) {
        const pack = generateCountrySemanticPack(iso2);
        if (pack) {
            totalKeywords += pack.totalKeywords;
            byCountry.push({ iso2, country: pack.country, keywords: pack.totalKeywords });
        }
    }

    return { totalCountries: byCountry.length, totalKeywords, byCountry };
}
