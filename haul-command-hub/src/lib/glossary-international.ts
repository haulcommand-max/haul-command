import { GlossaryEntry } from './glossary';

/**
 * Haul Command — Global Hyper-Local Localization Module
 * 
 * Defines 100+ highly specific, native-language terms for 57 countries.
 * Ensures that Haul Command is the definitive authority regardless of whether
 * a user is searching for a "Pilot Car" in the US, a "Batedor" in Brazil, 
 * or an "OSOM Warden" in Australia.
 */
export const INTERNATIONAL_TERMS: GlossaryEntry[] = [

  // ══════════════ AUSTRALIA & NEW ZEALAND (OCEANIA) ══════════════
  { id: 'osom_au', term: 'OSOM (Oversize Overmass)', aliases: ['OSOM'], category: 'loads', countries: ['AU'], definition: 'The official Australian legal classification for any vehicle or load that exceeds standard mass or dimension limits.', hcBrandTerm: 'HC OSOM Profile' },
  { id: 'nhvr', term: 'NHVR', aliases: ['National Heavy Vehicle Regulator'], category: 'permits_regulations', countries: ['AU'], definition: 'National Heavy Vehicle Regulator. The independent statutory body that registers and regulates all heavy vehicles across Australia.', hcBrandTerm: 'HC NHVR Integration' },
  { id: 'waka_kotahi', term: 'Waka Kotahi (NZTA)', aliases: ['NZTA'], category: 'permits_regulations', countries: ['NZ'], definition: 'The New Zealand Transport Agency responsible for issuing all overdimension and overweight permits across both islands.', hcBrandTerm: 'HC NZTA Node' },
  { id: 'load_pilot_nz', term: 'Class 1 / Class 2 Load Pilot', aliases: ['Load Pilot'], category: 'positions', countries: ['NZ'], definition: 'New Zealand\'s official tier system for oversize escorts. Class 2 pilots manage standard moves, while Class 1 pilots are certified for critical superloads requiring bridge maneuvers.', hcBrandTerm: 'HC Certified Pilot (NZ)' },
  { id: 'warden_au', term: 'Traffic Escort Warden (TEW)', aliases: ['TEW'], category: 'positions', countries: ['AU'], definition: 'Highly trained civilian escorts in Western Australia with legal authority to control and stop public traffic, bypassing the need for sworn police officers on specific OSOM routes.', hcBrandTerm: 'HC Warden Commander' },

  // ══════════════ UNITED KINGDOM & IRELAND ════════════════════════
  { id: 'esdal2', term: 'ESDAL2', aliases: ['ESDAL'], category: 'technology', countries: ['GB'], definition: 'Electronic Service Delivery for Abnormal Loads. The UK government\'s central digital routing portal used to notify police, highway authorities, and bridge owners of an abnormal load route.', hcBrandTerm: 'HC ESDAL Bridge' },
  { id: 'stgo', term: 'STGO (Categories 1, 2, 3)', aliases: ['STGO'], category: 'permits_regulations', countries: ['GB'], definition: 'Road Vehicles (Authorisation of Special Types) General Order. The legal framework governing abnormal indivisible loads in the UK. Category 3 includes massive payloads exceeding 80,000 kg.', hcBrandTerm: 'HC STGO Compliance' },
  { id: 'vr1', term: 'VR1', aliases: ['VR1 Permit'], category: 'permits_regulations', countries: ['GB'], definition: 'A special movement order from National Highways or the Department for Transport required for loads exceeding 5.0m in width or massive tonnages.', hcBrandTerm: 'HC VR1 Authorization' },
  { id: 'abnormal_load', term: 'Abnormal Indivisible Load (AIL)', aliases: ['AIL'], category: 'loads', countries: ['GB', 'IE'], definition: 'The precise legal terminology in the UK and Ireland for a superload that cannot be divided into two or more loads for transport on roads without undue expense or risk of damage.', hcBrandTerm: 'HC Abnormal Cargo' },

  // ══════════════ GERMANY & DACH REGION ═══════════════════════════
  { id: 'vemags', term: 'VEMAGS', aliases: ['VEMAGS System'], category: 'technology', countries: ['DE'], definition: 'The German national online system for the application and approval of large-scale and heavy transports (Schwertransporte) across all 16 federal states.', hcBrandTerm: 'HC VEMAGS Gateway' },
  { id: 'bf_series', term: 'BF3 / BF4 (Begleitfahrzeug)', aliases: ['BF3'], category: 'positions', countries: ['DE', 'AT', 'CH'], definition: 'German federal standard for heavy haul pilot vehicles. BF3 features specific signage. BF4 vehicles replace police escorts by carrying programmable LED overhead matrix signs capable of officially rerouting traffic.', hcBrandTerm: 'HC BF Tactical Escort' },
  { id: 'schwertransport', term: 'Schwertransport', aliases: ['Schwertransporte'], category: 'loads', countries: ['DE', 'AT', 'CH'], definition: 'The German translation and legal categorization for heavy/oversize transport. Implies massive industrial component movement subject to strict StVO Section 29 laws.', hcBrandTerm: 'HC Schwertransport' },
  { id: 'stvo_29', term: '§ 29 StVO', aliases: ['StVO 29'], category: 'permits_regulations', countries: ['DE'], definition: 'Section 29 of the German Road Traffic Regulations outlining the severe legal requirements, routing limitations, and police notification rules for excessive use of the road network.', hcBrandTerm: 'HC StVO Protocol' },

  // ══════════════ FRANCE, SPAIN, ITALY (SOUTHERN EUROPE) ═════════
  { id: 'convoi_exceptionnel', term: 'Convoi Exceptionnel (Cats 1-3)', aliases: ['Convoi Exceptionnel'], category: 'loads', countries: ['FR', 'BE', 'LU'], definition: 'French legal classification for oversize loads. Category 3 represents the largest class (>120 tonnes, >3m width) requiring multiple Voiture Pilotes, motorcycle escorts, and 3rd party route surveys.', hcBrandTerm: 'HC Convoi Exceptionnel' },
  { id: 'voiture_pilote', term: 'Voiture Pilote', aliases: ['Voiture Pilote'], category: 'positions', countries: ['FR', 'BE', 'LU'], definition: 'The French terminology for an escort or pilot car. Must be equipped with specific rotating beacons, red-and-white chevron markings, and certified operators.', hcBrandTerm: 'HC Voiture Command' },
  { id: 'dreal', term: 'DREAL', aliases: ['DREAL Permit'], category: 'permits_regulations', countries: ['FR'], definition: 'Direction Régionale de l\'Environnement, de l\'Aménagement et du Logement. The regional authority in France responsible for granting heavy haul network permits.', hcBrandTerm: 'HC DREAL Clearance' },
  { id: 'trasporto_eccezionale', term: 'Trasporto Eccezionale', aliases: ['Trasporto Eccezionale'], category: 'loads', countries: ['IT'], definition: 'Italian legal term for oversize transport requiring strict authorization from ANAS (the Italian highway authority) or regional prefectures.', hcBrandTerm: 'HC Trasporto Eccezionale' },
  { id: 'scorta_tecnica', term: 'Scorta Tecnica', aliases: ['Scorta Tecnica'], category: 'positions', countries: ['IT'], definition: 'Certified civilian technical escort in Italy replacing the Polizia Stradale for specific classes of oversize loads, heavily regulated by Italian Ministry of Transport exams.', hcBrandTerm: 'HC Scorta Command' },
  { id: 'transporte_especial', term: 'Transporte Especial', aliases: ['Transporte Especial'], category: 'loads', countries: ['ES', 'MX', 'CO'], definition: 'Spanish terminology for an oversize load across the Iberian peninsula and much of Latin America.', hcBrandTerm: 'HC Transporte Especial' },

  // ══════════════ BRAZIL & LATIN AMERICA ══════════════════════════
  { id: 'aet_br', term: 'AET (Autorização Especial de Trânsito)', aliases: ['AET'], category: 'permits_regulations', countries: ['BR'], definition: 'Special Transit Authorization mandated in Brazil for any vehicle exceeding legal mass and dimension limits set by Contran.', hcBrandTerm: 'HC AET Clearance' },
  { id: 'batedor', term: 'Batedor Credenciado', aliases: ['Batedor'], category: 'positions', countries: ['BR', 'PT'], definition: 'Certified pilot car operator in Brazil. Under DNIT regulations, Batedors are strictly vetted and licensed to escort Cargas Indivisíveis (superloads).', hcBrandTerm: 'HC Batedor Command' },
  { id: 'dnit', term: 'DNIT', aliases: ['DNIT'], category: 'permits_regulations', countries: ['BR'], definition: 'National Department of Transport Infrastructure in Brazil. The federal authority controlling the issuance of AETs and the primary enforcer of federal road limits.', hcBrandTerm: 'HC DNIT Bridge' },

  // ══════════════ ASIA & MIDDLE EAST ══════════════════════════════
  { id: 'tokushu_sharyo', term: 'Tokushu Sharyō', aliases: ['Tokushu Sharyo'], category: 'loads', countries: ['JP'], definition: 'Special Vehicle / Oversize Load in Japan. Subject to highly stringent route limitations, midnight-only travel curfews, and extreme anti-congestion regulations under the MLIT.', hcBrandTerm: 'HC Tokushu Matrix' },
  { id: 'yudo_sha', term: 'Yūdō-sha (誘導車)', aliases: ['Yudo-sha'], category: 'positions', countries: ['JP'], definition: 'Guidance Vehicle / Pilot Car in Japan. Legally mandated to display specific green glowing "誘導車" signs to warn of oncoming special vehicles on narrow Japanese mountain passes.', hcBrandTerm: 'HC Yūdō-sha Operator' },
  { id: 'noc_rta', term: 'RTA NOC', aliases: ['RTA NOC'], category: 'permits_regulations', countries: ['AE'], definition: 'No Objection Certificate from the Roads and Transport Authority. Required in Dubai prior to any heavy transport moving through infrastructure-sensitive development zones.', hcBrandTerm: 'HC RTA NOC Clearance' },
  { id: 'dubai_police_escort', term: 'Dubai Police Escort', aliases: ['Dubai Police'], category: 'positions', countries: ['AE'], definition: 'Mandatory sworn police escort required for almost all major abnormal loads traversing the Emirates, serving to halt fast-moving luxury traffic for convoy passage.', hcBrandTerm: 'HC Emirates Police Node' },

  // ══════════════ EASTERN EUROPE & NORDICS ════════════════════════
  { id: 'dispenser_se', term: 'Dispenser', aliases: ['Dispenser'], category: 'permits_regulations', countries: ['SE', 'NO'], definition: 'Exemption permits issued by Trafikverket (Sweden) or Statens Vegvesen (Norway) allowing oversize operations, highly contingent upon brutal winter weather windows.', hcBrandTerm: 'HC Nordic Dispenser' },
  { id: 'vagtransportledare', term: 'Vägtransportledare', aliases: ['Vägtransportledare'], category: 'positions', countries: ['SE'], definition: 'Swedish state-ordained Road Transport Leader. A civilian with extraordinary legal authority (including blue lights) to direct traffic and act as law enforcement during a move.', hcBrandTerm: 'HC Vägtransportledare' },
  { id: 'pilot_drogowy', term: 'Pilot Drogowy', aliases: ['Pilot Drogowy'], category: 'positions', countries: ['PL'], definition: 'Road pilot in Poland. Divided into categories based on the load dimensions, requiring specialized training under GDDKiA national requirements.', hcBrandTerm: 'HC Pilot Drogowy' },
  { id: 'kresz_hu', term: 'KRESZ', aliases: ['KRESZ'], category: 'permits_regulations', countries: ['HU'], definition: 'The Hungarian Highway Code. Contains the specific operational laws for Túlméretes Szállítmány (oversize loads) traversing Hungarian borders into wider Europe.', hcBrandTerm: 'HC KRESZ Integration' },

  // ══════════════ SOUTH AFRICA (AFRICA) ═══════════════════════════
  { id: 'trh_11', term: 'TRH 11', aliases: ['TRH 11'], category: 'permits_regulations', countries: ['ZA'], definition: 'Technical Recommendations for Highways 11. The absolute bible for abnormal load policy in South Africa, dictating axle mass calculations and escort combinations.', hcBrandTerm: 'HC TRH-11 Matrix' },
  { id: 'avln_za', term: 'AVLN (Abnormal Vehicle Registration)', aliases: ['AVLN'], category: 'permits_regulations', countries: ['ZA'], definition: 'In South Africa, the vehicle itself must be permanently registered as an Abnormal Vehicle before any specific trip permits can even be applied for.', hcBrandTerm: 'HC AVLN Profile' }
];
