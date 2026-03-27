// ══════════════════════════════════════════════════════════════
// GLOBAL WIKIPEDIA STRATEGY — HC Archive
// Citations across 25+ Wikipedia editions + alternative wikis
// ══════════════════════════════════════════════════════════════

export interface WikiTarget {
  edition: string;
  domain: string;
  da: number;
  language: string;
  countriesCovered: string[];
  tier: 'S' | 'A' | 'B';
  articleTargets: string[];
}

export const WIKIPEDIA_TARGETS: WikiTarget[] = [
  // Tier S — DA 96
  { edition: 'Spanish', domain: 'es.wikipedia.org', da: 96, language: 'es', countriesCovered: ['ES', 'MX', 'AR', 'CL', 'CO', 'PE'], tier: 'S', articleTargets: ['Transporte especial', 'Vehículo de escolta', 'Carga sobredimensionada'] },
  { edition: 'Portuguese', domain: 'pt.wikipedia.org', da: 96, language: 'pt', countriesCovered: ['BR', 'PT'], tier: 'S', articleTargets: ['Transporte especial', 'Veículo de escolta', 'Carga superdimensionada'] },
  // Tier A — DA 90-93
  { edition: 'English', domain: 'en.wikipedia.org', da: 93, language: 'en', countriesCovered: ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'SG', 'IE', 'IN', 'PH'], tier: 'A', articleTargets: ['Pilot car', 'Escort vehicle', 'Oversize load', 'Wide load'] },
  { edition: 'German', domain: 'de.wikipedia.org', da: 93, language: 'de', countriesCovered: ['DE', 'AT', 'CH'], tier: 'A', articleTargets: ['Schwertransport', 'Begleitfahrzeug'] },
  { edition: 'French', domain: 'fr.wikipedia.org', da: 93, language: 'fr', countriesCovered: ['FR', 'BE', 'CH'], tier: 'A', articleTargets: ['Convoi exceptionnel', 'Véhicule pilote'] },
  { edition: 'Japanese', domain: 'ja.wikipedia.org', da: 92, language: 'ja', countriesCovered: ['JP'], tier: 'A', articleTargets: ['特殊車両通行許可', '先導車'] },
  { edition: 'Italian', domain: 'it.wikipedia.org', da: 92, language: 'it', countriesCovered: ['IT'], tier: 'A', articleTargets: ['Trasporto eccezionale'] },
  { edition: 'Dutch', domain: 'nl.wikipedia.org', da: 90, language: 'nl', countriesCovered: ['NL', 'BE'], tier: 'A', articleTargets: ['Exceptioneel transport'] },
  // Tier B — DA 80+
  { edition: 'Polish', domain: 'pl.wikipedia.org', da: 85, language: 'pl', countriesCovered: ['PL'], tier: 'B', articleTargets: ['Transport ponadnormatywny'] },
  { edition: 'Swedish', domain: 'sv.wikipedia.org', da: 84, language: 'sv', countriesCovered: ['SE'], tier: 'B', articleTargets: ['Specialtransport'] },
  { edition: 'Korean', domain: 'ko.wikipedia.org', da: 83, language: 'ko', countriesCovered: ['KR'], tier: 'B', articleTargets: ['특수운송', '선도차량'] },
  { edition: 'Arabic', domain: 'ar.wikipedia.org', da: 82, language: 'ar', countriesCovered: ['AE', 'SA', 'QA', 'KW', 'OM', 'BH'], tier: 'B', articleTargets: ['نقل استثنائي'] },
  { edition: 'Turkish', domain: 'tr.wikipedia.org', da: 81, language: 'tr', countriesCovered: ['TR'], tier: 'B', articleTargets: ['Özel ta\u015f\u0131mac\u0131l\u0131k'] },
  { edition: 'Indonesian', domain: 'id.wikipedia.org', da: 80, language: 'id', countriesCovered: ['ID'], tier: 'B', articleTargets: ['Angkutan khusus'] },
  { edition: 'Thai', domain: 'th.wikipedia.org', da: 80, language: 'th', countriesCovered: ['TH'], tier: 'B', articleTargets: ['การขนส่งพิเศษ'] },
  { edition: 'Vietnamese', domain: 'vi.wikipedia.org', da: 80, language: 'vi', countriesCovered: ['VN'], tier: 'B', articleTargets: ['V\u1eadn t\u1ea3i \u0111\u1eb7c bi\u1ec7t'] },
  { edition: 'Hindi', domain: 'hi.wikipedia.org', da: 78, language: 'hi', countriesCovered: ['IN'], tier: 'B', articleTargets: ['विशेष परिवहन'] },
  { edition: 'Finnish', domain: 'fi.wikipedia.org', da: 82, language: 'fi', countriesCovered: ['FI'], tier: 'B', articleTargets: ['Erikoiskuljetus'] },
  { edition: 'Norwegian', domain: 'no.wikipedia.org', da: 82, language: 'no', countriesCovered: ['NO'], tier: 'B', articleTargets: ['Spesialtransport'] },
  { edition: 'Danish', domain: 'da.wikipedia.org', da: 81, language: 'da', countriesCovered: ['DK'], tier: 'B', articleTargets: ['Specialtransport'] },
];

// Alternative wiki targets
export const ALTERNATIVE_WIKIS = [
  { name: 'Namu Wiki', country: 'KR', url: 'https://namu.wiki', note: '2.2x more articles than Korean Wikipedia, #5 most visited Korean site' },
  { name: 'Wikidata', country: 'GLOBAL', url: 'https://wikidata.org', note: 'Create Haul Command entity → enables Google Knowledge Panel' },
  { name: 'Citizendium', country: 'US', url: 'https://citizendium.org', note: 'Expert-authored, higher credibility than Wikipedia' },
  { name: 'Scholarpedia', country: 'US', url: 'https://scholarpedia.org', note: 'Peer-reviewed articles, academic credibility' },
];

// Total targets
export const WIKI_STATS = {
  wikipediaEditions: WIKIPEDIA_TARGETS.length,
  articlesPerEdition: 5,
  totalWikipediaCitations: WIKIPEDIA_TARGETS.length * 5,
  alternativeWikis: ALTERNATIVE_WIKIS.length,
  stateEncyclopedias: 50,
  grandTotal: WIKIPEDIA_TARGETS.length * 5 + ALTERNATIVE_WIKIS.length + 50,
};
