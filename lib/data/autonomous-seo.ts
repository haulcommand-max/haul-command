/**
 * Autonomous freight SEO keyword data for multilingual programmatic pages.
 * TRACK 2: Multilingual SEO pages targeting autonomous truck escort keywords.
 */

export interface AutonomousSeoEntry {
  country_code: string;
  country_name: string;
  language: string;
  lang_code: string;
  keywords: { slug: string; keyword: string; title: string; meta: string }[];
}

export const AUTONOMOUS_SEO_DATA: AutonomousSeoEntry[] = [
  // English (US, CA, AU, GB)
  ...['US', 'CA', 'AU', 'GB'].map(cc => ({
    country_code: cc,
    country_name: { US: 'United States', CA: 'Canada', AU: 'Australia', GB: 'United Kingdom' }[cc]!,
    language: 'English',
    lang_code: 'en',
    keywords: [
      { slug: 'autonomous-truck-escort', keyword: `autonomous truck escort ${{ US: 'United States', CA: 'Canada', AU: 'Australia', GB: 'United Kingdom' }[cc]}`, title: `Autonomous Truck Escort Services in ${{ US: 'the United States', CA: 'Canada', AU: 'Australia', GB: 'the United Kingdom' }[cc]}`, meta: `Find certified autonomous truck escort and pilot car services for self-driving freight operations in ${{ US: 'the United States', CA: 'Canada', AU: 'Australia', GB: 'the United Kingdom' }[cc]}. Compliance requirements, certified operators, and real-time availability.` },
      { slug: 'self-driving-truck-pilot-car', keyword: `self driving truck pilot car ${{ US: 'United States', CA: 'Canada', AU: 'Australia', GB: 'United Kingdom' }[cc]}`, title: `Self-Driving Truck Pilot Car Services — ${{ US: 'United States', CA: 'Canada', AU: 'Australia', GB: 'United Kingdom' }[cc]}`, meta: `Professional pilot car operators for autonomous and self-driving truck convoys in ${{ US: 'the United States', CA: 'Canada', AU: 'Australia', GB: 'the United Kingdom' }[cc]}. Licensed, insured, GPS-tracked.` },
      { slug: 'av-freight-escort-requirements', keyword: `AV freight escort requirements ${{ US: 'United States', CA: 'Canada', AU: 'Australia', GB: 'United Kingdom' }[cc]}`, title: `AV Freight Escort Requirements — ${{ US: 'United States', CA: 'Canada', AU: 'Australia', GB: 'United Kingdom' }[cc]} Regulations`, meta: `Complete guide to autonomous vehicle freight escort requirements and regulations in ${{ US: 'the United States', CA: 'Canada', AU: 'Australia', GB: 'the United Kingdom' }[cc]}. State-by-state and province-by-province compliance data.` },
    ],
  })),
  // German (DE, AT, CH)
  ...['DE', 'AT', 'CH'].map(cc => ({
    country_code: cc,
    country_name: { DE: 'Deutschland', AT: '\u00d6sterreich', CH: 'Schweiz' }[cc]!,
    language: 'Deutsch',
    lang_code: 'de',
    keywords: [
      { slug: 'begleitfahrzeug-autonomes-fahren', keyword: `Begleitfahrzeug autonomes Fahren ${{ DE: 'Deutschland', AT: '\u00d6sterreich', CH: 'Schweiz' }[cc]}`, title: `Begleitfahrzeug f\u00fcr autonomes Fahren — ${{ DE: 'Deutschland', AT: '\u00d6sterreich', CH: 'Schweiz' }[cc]}`, meta: `Professionelle Begleitfahrzeuge f\u00fcr autonome LKW und Schwertransporte in ${{ DE: 'Deutschland', AT: '\u00d6sterreich', CH: 'der Schweiz' }[cc]}. Genehmigungen, Vorschriften und verf\u00fcgbare Dienstleister.` },
      { slug: 'autonomer-lkw-begleitschutz', keyword: `autonomer LKW Begleitschutz ${{ DE: 'Deutschland', AT: '\u00d6sterreich', CH: 'Schweiz' }[cc]}`, title: `Autonomer LKW Begleitschutz — ${{ DE: 'Deutschland', AT: '\u00d6sterreich', CH: 'Schweiz' }[cc]}`, meta: `Begleitschutz und Sicherungsfahrzeuge f\u00fcr autonome LKW-Transporte in ${{ DE: 'Deutschland', AT: '\u00d6sterreich', CH: 'der Schweiz' }[cc]}. Zertifizierte Fahrer, GPS-\u00dcberwachung.` },
    ],
  })),
  // Dutch (NL, BE)
  ...['NL', 'BE'].map(cc => ({
    country_code: cc,
    country_name: { NL: 'Nederland', BE: 'Belgi\u00eb' }[cc]!,
    language: 'Nederlands',
    lang_code: 'nl',
    keywords: [
      { slug: 'begeleiding-autonoom-vrachtverkeer', keyword: `begeleiding autonoom vrachtverkeer ${{ NL: 'Nederland', BE: 'Belgi\u00eb' }[cc]}`, title: `Begeleiding Autonoom Vrachtverkeer — ${{ NL: 'Nederland', BE: 'Belgi\u00eb' }[cc]}`, meta: `Professionele begeleiding voor autonoom vrachtverkeer en zelfrijdende vrachtwagens in ${{ NL: 'Nederland', BE: 'Belgi\u00eb' }[cc]}. Vergunningen en beschikbare dienstverleners.` },
      { slug: 'zelfrijdende-vrachtwagen-escort', keyword: `zelfrijdende vrachtwagen escort ${{ NL: 'Nederland', BE: 'Belgi\u00eb' }[cc]}`, title: `Zelfrijdende Vrachtwagen Escort — ${{ NL: 'Nederland', BE: 'Belgi\u00eb' }[cc]}`, meta: `Escort diensten voor zelfrijdende vrachtwagens in ${{ NL: 'Nederland', BE: 'Belgi\u00eb' }[cc]}. Gecertificeerde chauffeurs en GPS-tracking.` },
    ],
  })),
  // Spanish (ES, MX, CO, AR, CL, PE)
  ...['ES', 'MX', 'CO', 'AR', 'CL', 'PE'].map(cc => ({
    country_code: cc,
    country_name: { ES: 'Espa\u00f1a', MX: 'M\u00e9xico', CO: 'Colombia', AR: 'Argentina', CL: 'Chile', PE: 'Per\u00fa' }[cc]!,
    language: 'Espa\u00f1ol',
    lang_code: 'es',
    keywords: [
      { slug: 'escolta-camion-autonomo', keyword: `escolta cami\u00f3n aut\u00f3nomo ${{ ES: 'Espa\u00f1a', MX: 'M\u00e9xico', CO: 'Colombia', AR: 'Argentina', CL: 'Chile', PE: 'Per\u00fa' }[cc]}`, title: `Escolta Cami\u00f3n Aut\u00f3nomo — ${{ ES: 'Espa\u00f1a', MX: 'M\u00e9xico', CO: 'Colombia', AR: 'Argentina', CL: 'Chile', PE: 'Per\u00fa' }[cc]}`, meta: `Servicios de escolta para camiones aut\u00f3nomos y transporte de carga especial en ${{ ES: 'Espa\u00f1a', MX: 'M\u00e9xico', CO: 'Colombia', AR: 'Argentina', CL: 'Chile', PE: 'Per\u00fa' }[cc]}. Operadores certificados y seguimiento GPS.` },
      { slug: 'vehiculo-piloto-carga-autonoma', keyword: `veh\u00edculo piloto carga aut\u00f3noma ${{ ES: 'Espa\u00f1a', MX: 'M\u00e9xico', CO: 'Colombia', AR: 'Argentina', CL: 'Chile', PE: 'Per\u00fa' }[cc]}`, title: `Veh\u00edculo Piloto Carga Aut\u00f3noma — ${{ ES: 'Espa\u00f1a', MX: 'M\u00e9xico', CO: 'Colombia', AR: 'Argentina', CL: 'Chile', PE: 'Per\u00fa' }[cc]}`, meta: `Veh\u00edculos piloto para transporte de carga aut\u00f3noma en ${{ ES: 'Espa\u00f1a', MX: 'M\u00e9xico', CO: 'Colombia', AR: 'Argentina', CL: 'Chile', PE: 'Per\u00fa' }[cc]}. Cumplimiento normativo y disponibilidad en tiempo real.` },
    ],
  })),
  // Portuguese (BR, PT)
  ...['BR', 'PT'].map(cc => ({
    country_code: cc,
    country_name: { BR: 'Brasil', PT: 'Portugal' }[cc]!,
    language: 'Portugu\u00eas',
    lang_code: 'pt',
    keywords: [
      { slug: 'escolta-caminhao-autonomo', keyword: `escolta caminh\u00e3o aut\u00f4nomo ${{ BR: 'Brasil', PT: 'Portugal' }[cc]}`, title: `Escolta Caminh\u00e3o Aut\u00f4nomo — ${{ BR: 'Brasil', PT: 'Portugal' }[cc]}`, meta: `Servi\u00e7os de escolta para caminh\u00f5es aut\u00f4nomos e transporte especial no ${{ BR: 'Brasil', PT: 'Portugal' }[cc]}. Operadores certificados e rastreamento GPS.` },
      { slug: 'veiculo-piloto-carga-autonoma', keyword: `ve\u00edculo piloto carga aut\u00f4noma ${{ BR: 'Brasil', PT: 'Portugal' }[cc]}`, title: `Ve\u00edculo Piloto Carga Aut\u00f4noma — ${{ BR: 'Brasil', PT: 'Portugal' }[cc]}`, meta: `Ve\u00edculos piloto para transporte de carga aut\u00f4noma no ${{ BR: 'Brasil', PT: 'Portugal' }[cc]}. Conformidade regulamentar e disponibilidade em tempo real.` },
    ],
  })),
  // French (FR, BE-fr)
  { country_code: 'FR', country_name: 'France', language: 'Fran\u00e7ais', lang_code: 'fr', keywords: [
    { slug: 'vehicule-escorte-camion-autonome', keyword: 'v\u00e9hicule d\'escorte camion autonome France', title: 'V\u00e9hicule d\'Escorte Camion Autonome — France', meta: 'Services d\'escorte pour camions autonomes et convois exceptionnels en France. Op\u00e9rateurs certifi\u00e9s, suivi GPS en temps r\u00e9el.' },
    { slug: 'escorte-convoi-exceptionnel-autonome', keyword: 'escorte convoi exceptionnel autonome France', title: 'Escorte Convoi Exceptionnel Autonome — France', meta: 'Escorte sp\u00e9cialis\u00e9e pour convois exceptionnels autonomes en France. V\u00e9hicules certifi\u00e9s et conformit\u00e9 r\u00e9glementaire.' },
  ]},
  // Swedish (SE)
  { country_code: 'SE', country_name: 'Sverige', language: 'Svenska', lang_code: 'sv', keywords: [
    { slug: 'eskorttjanst-autonom-lastbil', keyword: 'eskorttj\u00e4nst autonom lastbil Sverige', title: 'Eskorttj\u00e4nst Autonom Lastbil — Sverige', meta: 'Professionella eskorttj\u00e4nster f\u00f6r autonoma lastbilar och specialtransporter i Sverige. Certifierade f\u00f6rare och GPS-sp\u00e5rning.' },
    { slug: 'foljebil-sjalvkorande-lastbil', keyword: 'f\u00f6ljebil sj\u00e4lvk\u00f6rande lastbil Sverige', title: 'F\u00f6ljebil Sj\u00e4lvk\u00f6rande Lastbil — Sverige', meta: 'F\u00f6ljebilar f\u00f6r sj\u00e4lvk\u00f6rande lastbilar i Sverige. Tillst\u00e5nd, f\u00f6reskrifter och tillg\u00e4ngliga tj\u00e4nsteleverant\u00f6rer.' },
  ]},
  // Arabic (AE, SA, QA)
  ...['AE', 'SA', 'QA'].map(cc => ({
    country_code: cc,
    country_name: { AE: '\u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062a', SA: '\u0627\u0644\u0633\u0639\u0648\u062f\u064a\u0629', QA: '\u0642\u0637\u0631' }[cc]!,
    language: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629',
    lang_code: 'ar',
    keywords: [
      { slug: 'murافقة-شاحنة-ذاتية-القيادة', keyword: `\u0645\u0631\u0627\u0641\u0642\u0629 \u0634\u0627\u062d\u0646\u0629 \u0630\u0627\u062a\u064a\u0629 \u0627\u0644\u0642\u064a\u0627\u062f\u0629 ${{ AE: '\u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062a', SA: '\u0627\u0644\u0633\u0639\u0648\u062f\u064a\u0629', QA: '\u0642\u0637\u0631' }[cc]}`, title: `Autonomous Truck Escort — ${{ AE: 'UAE', SA: 'Saudi Arabia', QA: 'Qatar' }[cc]}`, meta: `Professional autonomous truck escort services in ${{ AE: 'the UAE', SA: 'Saudi Arabia', QA: 'Qatar' }[cc]}. Certified operators, GPS tracking, and regulatory compliance.` },
      { slug: 'autonomous-truck-escort', keyword: `autonomous truck escort ${{ AE: 'UAE', SA: 'Saudi Arabia', QA: 'Qatar' }[cc]}`, title: `Autonomous Truck Escort Services — ${{ AE: 'UAE', SA: 'Saudi Arabia', QA: 'Qatar' }[cc]}`, meta: `Find certified autonomous truck escort and pilot car services in ${{ AE: 'the UAE', SA: 'Saudi Arabia', QA: 'Qatar' }[cc]}.` },
    ],
  })),
];

export function getAllAutonomousSeoParams(): { country: string; slug: string }[] {
  const params: { country: string; slug: string }[] = [];
  for (const entry of AUTONOMOUS_SEO_DATA) {
    for (const kw of entry.keywords) {
      params.push({ country: entry.country_code.toLowerCase(), slug: kw.slug });
    }
  }
  return params;
}

export function getAutonomousSeoEntry(country: string, slug: string) {
  const entry = AUTONOMOUS_SEO_DATA.find(e => e.country_code.toLowerCase() === country.toLowerCase());
  if (!entry) return null;
  const kw = entry.keywords.find(k => k.slug === slug);
  if (!kw) return null;
  return { ...entry, keyword: kw };
}
