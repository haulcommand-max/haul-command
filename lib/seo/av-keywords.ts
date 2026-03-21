// Multilingual AV SEO keyword data for programmatic page generation
export interface AVKeyword {
  slug: string;
  language: string;
  keyword: string;
  title: string;
  description: string;
}

export const AV_KEYWORDS: Record<string, AVKeyword[]> = {
  en: [
    { slug: 'autonomous-truck-escort', language: 'en', keyword: 'autonomous truck escort', title: 'Autonomous Truck Escort Services', description: 'Find certified escort vehicles for autonomous truck operations. Real-time dispatch, compliance verification, and AV-ready operators.' },
    { slug: 'self-driving-truck-pilot-car', language: 'en', keyword: 'self driving truck pilot car', title: 'Self-Driving Truck Pilot Car Services', description: 'Professional pilot car services for self-driving truck convoys. Certified operators available 24/7 on active AV corridors.' },
    { slug: 'av-freight-escort-requirements', language: 'en', keyword: 'AV freight escort requirements', title: 'AV Freight Escort Requirements', description: 'State-by-state autonomous vehicle freight escort requirements. Compliance database updated in real-time.' },
  ],
  de: [
    { slug: 'begleitfahrzeug-autonomes-fahren', language: 'de', keyword: 'Begleitfahrzeug autonomes Fahren', title: 'Begleitfahrzeug f\u00fcr Autonomes Fahren', description: 'Zertifizierte Begleitfahrzeuge f\u00fcr autonome LKW-Transporte. Echtzeit-Disposition und Compliance-\u00dcberpr\u00fcfung.' },
    { slug: 'autonomer-lkw-begleitschutz', language: 'de', keyword: 'Autonomer LKW Begleitschutz', title: 'Autonomer LKW Begleitschutz', description: 'Professioneller Begleitschutz f\u00fcr autonome LKW auf deutschen Autobahnen und europ\u00e4ischen Korridoren.' },
  ],
  nl: [
    { slug: 'begeleiding-autonoom-vrachtverkeer', language: 'nl', keyword: 'begeleiding autonoom vrachtverkeer', title: 'Begeleiding Autonoom Vrachtverkeer', description: 'Gecertificeerde begeleidingsvoertuigen voor autonoom vrachtverkeer. Realtime beschikbaarheid in Nederland en Europa.' },
    { slug: 'zelfrijdende-vrachtwagen-escort', language: 'nl', keyword: 'zelfrijdende vrachtwagen escort', title: 'Zelfrijdende Vrachtwagen Escort', description: 'Professionele escortdiensten voor zelfrijdende vrachtwagens. Beschikbaar op alle Nederlandse snelwegen.' },
  ],
  es: [
    { slug: 'escolta-camion-autonomo', language: 'es', keyword: 'escolta cami\u00f3n aut\u00f3nomo', title: 'Escolta para Cami\u00f3n Aut\u00f3nomo', description: 'Servicios de escolta certificados para camiones aut\u00f3nomos. Disponibilidad en tiempo real en corredores activos.' },
    { slug: 'vehiculo-piloto-carga-autonoma', language: 'es', keyword: 'veh\u00edculo piloto carga aut\u00f3noma', title: 'Veh\u00edculo Piloto para Carga Aut\u00f3noma', description: 'Veh\u00edculos piloto profesionales para transporte de carga aut\u00f3noma en Espa\u00f1a y Latinoam\u00e9rica.' },
  ],
  pt: [
    { slug: 'escolta-caminhao-autonomo', language: 'pt', keyword: 'escolta caminh\u00e3o aut\u00f4nomo', title: 'Escolta para Caminh\u00e3o Aut\u00f4nomo', description: 'Servi\u00e7os de escolta certificados para caminh\u00f5es aut\u00f4nomos no Brasil e Portugal.' },
    { slug: 'veiculo-piloto-carga-autonoma', language: 'pt', keyword: 've\u00edculo piloto carga aut\u00f4noma', title: 'Ve\u00edculo Piloto para Carga Aut\u00f4noma', description: 'Ve\u00edculos piloto profissionais para transporte de carga aut\u00f4noma em rodovias brasileiras.' },
  ],
  fr: [
    { slug: 'vehicule-escorte-camion-autonome', language: 'fr', keyword: 'v\u00e9hicule d\'escorte camion autonome', title: 'V\u00e9hicule d\'Escorte pour Camion Autonome', description: 'Services d\'escorte certifi\u00e9s pour camions autonomes en France et en Europe.' },
    { slug: 'escorte-convoi-exceptionnel-autonome', language: 'fr', keyword: 'escorte convoi exceptionnel autonome', title: 'Escorte Convoi Exceptionnel Autonome', description: 'Escorte professionnelle pour convois exceptionnels autonomes. Disponible 24h/24.' },
  ],
  sv: [
    { slug: 'eskorttjanst-autonom-lastbil', language: 'sv', keyword: 'eskorttj\u00e4nst autonom lastbil', title: 'Eskorttj\u00e4nst f\u00f6r Autonom Lastbil', description: 'Certifierade eskortfordon f\u00f6r autonoma lastbilstransporter i Sverige och Norden.' },
  ],
  ar: [
    { slug: 'escort-autonomous-truck-arabic', language: 'ar', keyword: '\u0645\u0631\u0627\u0641\u0642\u0629 \u0627\u0644\u0634\u0627\u062d\u0646\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u0642\u0644\u0629', title: 'Autonomous Truck Escort Services - \u0645\u0631\u0627\u0641\u0642\u0629 \u0627\u0644\u0634\u0627\u062d\u0646\u0627\u062a', description: 'Certified escort services for autonomous trucks in UAE, Saudi Arabia, and Qatar.' },
  ],
};

export const COUNTRY_LANGUAGE_MAP: Record<string, string[]> = {
  US: ['en'], CA: ['en','fr'], GB: ['en'], AU: ['en'], DE: ['de','en'], NL: ['nl','en'],
  ES: ['es'], MX: ['es'], CO: ['es'], AR: ['es'], CL: ['es'], PE: ['es'],
  BR: ['pt'], PT: ['pt'], FR: ['fr'], BE: ['nl','fr','en'], SE: ['sv','en'],
  AE: ['ar','en'], SA: ['ar','en'], QA: ['ar','en'], DK: ['en'], NO: ['en'], FI: ['en'],
  IT: ['en'], AT: ['de','en'], CH: ['de','fr','en'], IN: ['en'], SG: ['en'], NZ: ['en'],
  IE: ['en'], ZA: ['en'], JP: ['en'], KR: ['en'], PL: ['en'], CZ: ['en'], HU: ['en'],
};

export function getAllAVSEOSlugs(): { country: string; slug: string }[] {
  const result: { country: string; slug: string }[] = [];
  for (const [countryCode, languages] of Object.entries(COUNTRY_LANGUAGE_MAP)) {
    for (const lang of languages) {
      const keywords = AV_KEYWORDS[lang] || AV_KEYWORDS.en;
      for (const kw of keywords) {
        result.push({ country: countryCode.toLowerCase(), slug: kw.slug });
      }
    }
  }
  return result;
}
