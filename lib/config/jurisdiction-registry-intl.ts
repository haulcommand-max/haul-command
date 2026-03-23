// ══════════════════════════════════════════════════════════════
// INTERNATIONAL JURISDICTION REGISTRY — Tier B, C, D Countries
// Import and merge with main jurisdiction-registry.ts
// ══════════════════════════════════════════════════════════════

import type { Jurisdiction } from './jurisdiction-registry';

// ── Mexico States (32 + CDMX) ──
export const MX_JURISDICTIONS: Jurisdiction[] = [
  { code:'MX-AGU',country:'MX',name_en:'Aguascalientes',name_local:'Aguascalientes',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-BCN',country:'MX',name_en:'Baja California',name_local:'Baja California',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-BCS',country:'MX',name_en:'Baja California Sur',name_local:'Baja California Sur',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-CAM',country:'MX',name_en:'Campeche',name_local:'Campeche',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-CHP',country:'MX',name_en:'Chiapas',name_local:'Chiapas',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-CHH',country:'MX',name_en:'Chihuahua',name_local:'Chihuahua',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-COA',country:'MX',name_en:'Coahuila',name_local:'Coahuila',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-COL',country:'MX',name_en:'Colima',name_local:'Colima',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-CMX',country:'MX',name_en:'Mexico City',name_local:'Ciudad de México',type:'district',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-DUR',country:'MX',name_en:'Durango',name_local:'Durango',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-GUA',country:'MX',name_en:'Guanajuato',name_local:'Guanajuato',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-GRO',country:'MX',name_en:'Guerrero',name_local:'Guerrero',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-HID',country:'MX',name_en:'Hidalgo',name_local:'Hidalgo',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-JAL',country:'MX',name_en:'Jalisco',name_local:'Jalisco',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-MEX',country:'MX',name_en:'State of Mexico',name_local:'Estado de México',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-MIC',country:'MX',name_en:'Michoacán',name_local:'Michoacán',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-MOR',country:'MX',name_en:'Morelos',name_local:'Morelos',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-NAY',country:'MX',name_en:'Nayarit',name_local:'Nayarit',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-NLE',country:'MX',name_en:'Nuevo León',name_local:'Nuevo León',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-OAX',country:'MX',name_en:'Oaxaca',name_local:'Oaxaca',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-PUE',country:'MX',name_en:'Puebla',name_local:'Puebla',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-QUE',country:'MX',name_en:'Querétaro',name_local:'Querétaro',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-ROO',country:'MX',name_en:'Quintana Roo',name_local:'Quintana Roo',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-SLP',country:'MX',name_en:'San Luis Potosí',name_local:'San Luis Potosí',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-SIN',country:'MX',name_en:'Sinaloa',name_local:'Sinaloa',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-SON',country:'MX',name_en:'Sonora',name_local:'Sonora',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-TAB',country:'MX',name_en:'Tabasco',name_local:'Tabasco',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-TAM',country:'MX',name_en:'Tamaulipas',name_local:'Tamaulipas',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-TLA',country:'MX',name_en:'Tlaxcala',name_local:'Tlaxcala',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-VER',country:'MX',name_en:'Veracruz',name_local:'Veracruz',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-YUC',country:'MX',name_en:'Yucatán',name_local:'Yucatán',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
  { code:'MX-ZAC',country:'MX',name_en:'Zacatecas',name_local:'Zacatecas',type:'state',language:'es',currency:'MXN',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.sct.gob.mx' },
];

// ── India Top States (key heavy haul markets) ──
export const IN_JURISDICTIONS: Jurisdiction[] = [
  { code:'IN-MH',country:'IN',name_en:'Maharashtra',name_local:'महाराष्ट्र',type:'state',language:'hi',currency:'INR',escort_term:'एस्कॉर्ट वाहन',pilot_car_term:'पायलट कार',compliance_url:'https://www.nhai.gov.in' },
  { code:'IN-GJ',country:'IN',name_en:'Gujarat',name_local:'ગુજરાત',type:'state',language:'hi',currency:'INR',escort_term:'एस्कॉर्ट वाहन',pilot_car_term:'पायलट कार',compliance_url:'https://www.nhai.gov.in' },
  { code:'IN-RJ',country:'IN',name_en:'Rajasthan',name_local:'राजस्थान',type:'state',language:'hi',currency:'INR',escort_term:'एस्कॉर्ट वाहन',pilot_car_term:'पायलट कार',compliance_url:'https://www.nhai.gov.in' },
  { code:'IN-TN',country:'IN',name_en:'Tamil Nadu',name_local:'தமிழ்நாடு',type:'state',language:'hi',currency:'INR',escort_term:'எஸ்கார்ட் வாகனம்',pilot_car_term:'பைலட் கார்',compliance_url:'https://www.nhai.gov.in' },
  { code:'IN-AP',country:'IN',name_en:'Andhra Pradesh',name_local:'ఆంధ్ర ప్రదేశ్',type:'state',language:'hi',currency:'INR',escort_term:'एस्कॉर्ट वाहन',pilot_car_term:'పైలట్ కారు',compliance_url:'https://www.nhai.gov.in' },
  { code:'IN-KA',country:'IN',name_en:'Karnataka',name_local:'ಕರ್ನಾಟಕ',type:'state',language:'hi',currency:'INR',escort_term:'एस्कॉर्ट वाहन',pilot_car_term:'पायलट कार',compliance_url:'https://www.nhai.gov.in' },
  { code:'IN-DL',country:'IN',name_en:'Delhi',name_local:'दिल्ली',type:'territory',language:'hi',currency:'INR',escort_term:'एस्कॉर्ट वाहन',pilot_car_term:'पायलट कार',compliance_url:'https://www.nhai.gov.in' },
  { code:'IN-WB',country:'IN',name_en:'West Bengal',name_local:'পশ্চিমবঙ্গ',type:'state',language:'hi',currency:'INR',escort_term:'एस्कॉर्ट वाहन',pilot_car_term:'पायलट कार',compliance_url:'https://www.nhai.gov.in' },
];

// ── Japan Top Prefectures (key industrial regions) ──
export const JP_JURISDICTIONS: Jurisdiction[] = [
  { code:'JP-13',country:'JP',name_en:'Tokyo',name_local:'東京都',type:'prefecture',language:'ja',currency:'JPY',escort_term:'誘導車',pilot_car_term:'先導車',compliance_url:'https://www.mlit.go.jp' },
  { code:'JP-14',country:'JP',name_en:'Kanagawa',name_local:'神奈川県',type:'prefecture',language:'ja',currency:'JPY',escort_term:'誘導車',pilot_car_term:'先導車',compliance_url:'https://www.mlit.go.jp' },
  { code:'JP-27',country:'JP',name_en:'Osaka',name_local:'大阪府',type:'prefecture',language:'ja',currency:'JPY',escort_term:'誘導車',pilot_car_term:'先導車',compliance_url:'https://www.mlit.go.jp' },
  { code:'JP-23',country:'JP',name_en:'Aichi',name_local:'愛知県',type:'prefecture',language:'ja',currency:'JPY',escort_term:'誘導車',pilot_car_term:'先導車',compliance_url:'https://www.mlit.go.jp' },
  { code:'JP-01',country:'JP',name_en:'Hokkaido',name_local:'北海道',type:'prefecture',language:'ja',currency:'JPY',escort_term:'誘導車',pilot_car_term:'先導車',compliance_url:'https://www.mlit.go.jp' },
  { code:'JP-40',country:'JP',name_en:'Fukuoka',name_local:'福岡県',type:'prefecture',language:'ja',currency:'JPY',escort_term:'誘導車',pilot_car_term:'先導車',compliance_url:'https://www.mlit.go.jp' },
];

// ── France Regions (13) ──
export const FR_JURISDICTIONS: Jurisdiction[] = [
  { code:'FR-IDF',country:'FR',name_en:'Île-de-France',name_local:'Île-de-France',type:'region',language:'fr',currency:'EUR',escort_term:'véhicule d\'accompagnement',pilot_car_term:'voiture pilote',compliance_url:'https://www.ecologie.gouv.fr' },
  { code:'FR-ARA',country:'FR',name_en:'Auvergne-Rhône-Alpes',name_local:'Auvergne-Rhône-Alpes',type:'region',language:'fr',currency:'EUR',escort_term:'véhicule d\'accompagnement',pilot_car_term:'voiture pilote',compliance_url:'https://www.ecologie.gouv.fr' },
  { code:'FR-NAQ',country:'FR',name_en:'Nouvelle-Aquitaine',name_local:'Nouvelle-Aquitaine',type:'region',language:'fr',currency:'EUR',escort_term:'véhicule d\'accompagnement',pilot_car_term:'voiture pilote',compliance_url:'https://www.ecologie.gouv.fr' },
  { code:'FR-OCC',country:'FR',name_en:'Occitanie',name_local:'Occitanie',type:'region',language:'fr',currency:'EUR',escort_term:'véhicule d\'accompagnement',pilot_car_term:'voiture pilote',compliance_url:'https://www.ecologie.gouv.fr' },
  { code:'FR-HDF',country:'FR',name_en:'Hauts-de-France',name_local:'Hauts-de-France',type:'region',language:'fr',currency:'EUR',escort_term:'véhicule d\'accompagnement',pilot_car_term:'voiture pilote',compliance_url:'https://www.ecologie.gouv.fr' },
  { code:'FR-PDL',country:'FR',name_en:'Pays de la Loire',name_local:'Pays de la Loire',type:'region',language:'fr',currency:'EUR',escort_term:'véhicule d\'accompagnement',pilot_car_term:'voiture pilote',compliance_url:'https://www.ecologie.gouv.fr' },
  { code:'FR-GES',country:'FR',name_en:'Grand Est',name_local:'Grand Est',type:'region',language:'fr',currency:'EUR',escort_term:'véhicule d\'accompagnement',pilot_car_term:'voiture pilote',compliance_url:'https://www.ecologie.gouv.fr' },
  { code:'FR-BRE',country:'FR',name_en:'Brittany',name_local:'Bretagne',type:'region',language:'fr',currency:'EUR',escort_term:'véhicule d\'accompagnement',pilot_car_term:'voiture pilote',compliance_url:'https://www.ecologie.gouv.fr' },
  { code:'FR-NOR',country:'FR',name_en:'Normandy',name_local:'Normandie',type:'region',language:'fr',currency:'EUR',escort_term:'véhicule d\'accompagnement',pilot_car_term:'voiture pilote',compliance_url:'https://www.ecologie.gouv.fr' },
  { code:'FR-BFC',country:'FR',name_en:'Bourgogne-Franche-Comté',name_local:'Bourgogne-Franche-Comté',type:'region',language:'fr',currency:'EUR',escort_term:'véhicule d\'accompagnement',pilot_car_term:'voiture pilote',compliance_url:'https://www.ecologie.gouv.fr' },
  { code:'FR-CVL',country:'FR',name_en:'Centre-Val de Loire',name_local:'Centre-Val de Loire',type:'region',language:'fr',currency:'EUR',escort_term:'véhicule d\'accompagnement',pilot_car_term:'voiture pilote',compliance_url:'https://www.ecologie.gouv.fr' },
  { code:'FR-PAC',country:'FR',name_en:'Provence-Alpes-Côte d\'Azur',name_local:'Provence-Alpes-Côte d\'Azur',type:'region',language:'fr',currency:'EUR',escort_term:'véhicule d\'accompagnement',pilot_car_term:'voiture pilote',compliance_url:'https://www.ecologie.gouv.fr' },
  { code:'FR-COR',country:'FR',name_en:'Corsica',name_local:'Corse',type:'region',language:'fr',currency:'EUR',escort_term:'véhicule d\'accompagnement',pilot_car_term:'voiture pilote',compliance_url:'https://www.ecologie.gouv.fr' },
];

// ── Spain Autonomous Communities (17) ──
export const ES_JURISDICTIONS: Jurisdiction[] = [
  { code:'ES-AN',country:'ES',name_en:'Andalusia',name_local:'Andalucía',type:'autonomous_community',language:'es',currency:'EUR',escort_term:'vehículo de acompañamiento',pilot_car_term:'coche piloto',compliance_url:'https://www.mitma.gob.es' },
  { code:'ES-AR',country:'ES',name_en:'Aragon',name_local:'Aragón',type:'autonomous_community',language:'es',currency:'EUR',escort_term:'vehículo de acompañamiento',pilot_car_term:'coche piloto',compliance_url:'https://www.mitma.gob.es' },
  { code:'ES-AS',country:'ES',name_en:'Asturias',name_local:'Asturias',type:'autonomous_community',language:'es',currency:'EUR',escort_term:'vehículo de acompañamiento',pilot_car_term:'coche piloto',compliance_url:'https://www.mitma.gob.es' },
  { code:'ES-IB',country:'ES',name_en:'Balearic Islands',name_local:'Illes Balears',type:'autonomous_community',language:'es',currency:'EUR',escort_term:'vehículo de acompañamiento',pilot_car_term:'coche piloto',compliance_url:'https://www.mitma.gob.es' },
  { code:'ES-PV',country:'ES',name_en:'Basque Country',name_local:'Euskadi',type:'autonomous_community',language:'es',currency:'EUR',escort_term:'vehículo de acompañamiento',pilot_car_term:'coche piloto',compliance_url:'https://www.mitma.gob.es' },
  { code:'ES-CN',country:'ES',name_en:'Canary Islands',name_local:'Canarias',type:'autonomous_community',language:'es',currency:'EUR',escort_term:'vehículo de acompañamiento',pilot_car_term:'coche piloto',compliance_url:'https://www.mitma.gob.es' },
  { code:'ES-CB',country:'ES',name_en:'Cantabria',name_local:'Cantabria',type:'autonomous_community',language:'es',currency:'EUR',escort_term:'vehículo de acompañamiento',pilot_car_term:'coche piloto',compliance_url:'https://www.mitma.gob.es' },
  { code:'ES-CL',country:'ES',name_en:'Castile and León',name_local:'Castilla y León',type:'autonomous_community',language:'es',currency:'EUR',escort_term:'vehículo de acompañamiento',pilot_car_term:'coche piloto',compliance_url:'https://www.mitma.gob.es' },
  { code:'ES-CM',country:'ES',name_en:'Castilla-La Mancha',name_local:'Castilla-La Mancha',type:'autonomous_community',language:'es',currency:'EUR',escort_term:'vehículo de acompañamiento',pilot_car_term:'coche piloto',compliance_url:'https://www.mitma.gob.es' },
  { code:'ES-CT',country:'ES',name_en:'Catalonia',name_local:'Catalunya',type:'autonomous_community',language:'es',currency:'EUR',escort_term:'vehículo de acompañamiento',pilot_car_term:'coche piloto',compliance_url:'https://www.mitma.gob.es' },
  { code:'ES-EX',country:'ES',name_en:'Extremadura',name_local:'Extremadura',type:'autonomous_community',language:'es',currency:'EUR',escort_term:'vehículo de acompañamiento',pilot_car_term:'coche piloto',compliance_url:'https://www.mitma.gob.es' },
  { code:'ES-GA',country:'ES',name_en:'Galicia',name_local:'Galicia',type:'autonomous_community',language:'es',currency:'EUR',escort_term:'vehículo de acompañamiento',pilot_car_term:'coche piloto',compliance_url:'https://www.mitma.gob.es' },
  { code:'ES-MD',country:'ES',name_en:'Madrid',name_local:'Madrid',type:'autonomous_community',language:'es',currency:'EUR',escort_term:'vehículo de acompañamiento',pilot_car_term:'coche piloto',compliance_url:'https://www.mitma.gob.es' },
  { code:'ES-MC',country:'ES',name_en:'Murcia',name_local:'Murcia',type:'autonomous_community',language:'es',currency:'EUR',escort_term:'vehículo de acompañamiento',pilot_car_term:'coche piloto',compliance_url:'https://www.mitma.gob.es' },
  { code:'ES-NC',country:'ES',name_en:'Navarre',name_local:'Navarra',type:'autonomous_community',language:'es',currency:'EUR',escort_term:'vehículo de acompañamiento',pilot_car_term:'coche piloto',compliance_url:'https://www.mitma.gob.es' },
  { code:'ES-RI',country:'ES',name_en:'La Rioja',name_local:'La Rioja',type:'autonomous_community',language:'es',currency:'EUR',escort_term:'vehículo de acompañamiento',pilot_car_term:'coche piloto',compliance_url:'https://www.mitma.gob.es' },
  { code:'ES-VC',country:'ES',name_en:'Valencia',name_local:'Comunitat Valenciana',type:'autonomous_community',language:'es',currency:'EUR',escort_term:'vehículo de acompañamiento',pilot_car_term:'coche piloto',compliance_url:'https://www.mitma.gob.es' },
];

// ── Italy Regions (20) ──
export const IT_JURISDICTIONS: Jurisdiction[] = [
  { code:'IT-65',country:'IT',name_en:'Abruzzo',name_local:'Abruzzo',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-77',country:'IT',name_en:'Basilicata',name_local:'Basilicata',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-78',country:'IT',name_en:'Calabria',name_local:'Calabria',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-72',country:'IT',name_en:'Campania',name_local:'Campania',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-45',country:'IT',name_en:'Emilia-Romagna',name_local:'Emilia-Romagna',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-36',country:'IT',name_en:'Friuli Venezia Giulia',name_local:'Friuli Venezia Giulia',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-62',country:'IT',name_en:'Lazio',name_local:'Lazio',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-42',country:'IT',name_en:'Liguria',name_local:'Liguria',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-25',country:'IT',name_en:'Lombardy',name_local:'Lombardia',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-57',country:'IT',name_en:'Marche',name_local:'Marche',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-67',country:'IT',name_en:'Molise',name_local:'Molise',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-21',country:'IT',name_en:'Piedmont',name_local:'Piemonte',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-75',country:'IT',name_en:'Apulia',name_local:'Puglia',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-88',country:'IT',name_en:'Sardinia',name_local:'Sardegna',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-82',country:'IT',name_en:'Sicily',name_local:'Sicilia',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-52',country:'IT',name_en:'Tuscany',name_local:'Toscana',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-32',country:'IT',name_en:'Trentino-South Tyrol',name_local:'Trentino-Alto Adige',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-55',country:'IT',name_en:'Umbria',name_local:'Umbria',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-23',country:'IT',name_en:'Aosta Valley',name_local:'Valle d\'Aosta',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
  { code:'IT-34',country:'IT',name_en:'Veneto',name_local:'Veneto',type:'region',language:'it',currency:'EUR',escort_term:'veicolo di scorta',pilot_car_term:'auto pilota',compliance_url:'https://www.mit.gov.it' },
];

// ── Poland Voivodeships (16) ──
export const PL_JURISDICTIONS: Jurisdiction[] = [
  { code:'PL-DS',country:'PL',name_en:'Lower Silesia',name_local:'Dolnośląskie',type:'voivodeship',language:'pl',currency:'PLN',escort_term:'pojazd eskortujący',pilot_car_term:'pojazd pilotujący',compliance_url:'https://www.gddkia.gov.pl' },
  { code:'PL-KP',country:'PL',name_en:'Kuyavia-Pomerania',name_local:'Kujawsko-Pomorskie',type:'voivodeship',language:'pl',currency:'PLN',escort_term:'pojazd eskortujący',pilot_car_term:'pojazd pilotujący',compliance_url:'https://www.gddkia.gov.pl' },
  { code:'PL-LU',country:'PL',name_en:'Lublin',name_local:'Lubelskie',type:'voivodeship',language:'pl',currency:'PLN',escort_term:'pojazd eskortujący',pilot_car_term:'pojazd pilotujący',compliance_url:'https://www.gddkia.gov.pl' },
  { code:'PL-LB',country:'PL',name_en:'Lubusz',name_local:'Lubuskie',type:'voivodeship',language:'pl',currency:'PLN',escort_term:'pojazd eskortujący',pilot_car_term:'pojazd pilotujący',compliance_url:'https://www.gddkia.gov.pl' },
  { code:'PL-LD',country:'PL',name_en:'Łódź',name_local:'Łódzkie',type:'voivodeship',language:'pl',currency:'PLN',escort_term:'pojazd eskortujący',pilot_car_term:'pojazd pilotujący',compliance_url:'https://www.gddkia.gov.pl' },
  { code:'PL-MA',country:'PL',name_en:'Lesser Poland',name_local:'Małopolskie',type:'voivodeship',language:'pl',currency:'PLN',escort_term:'pojazd eskortujący',pilot_car_term:'pojazd pilotujący',compliance_url:'https://www.gddkia.gov.pl' },
  { code:'PL-MZ',country:'PL',name_en:'Masovia',name_local:'Mazowieckie',type:'voivodeship',language:'pl',currency:'PLN',escort_term:'pojazd eskortujący',pilot_car_term:'pojazd pilotujący',compliance_url:'https://www.gddkia.gov.pl' },
  { code:'PL-OP',country:'PL',name_en:'Opole',name_local:'Opolskie',type:'voivodeship',language:'pl',currency:'PLN',escort_term:'pojazd eskortujący',pilot_car_term:'pojazd pilotujący',compliance_url:'https://www.gddkia.gov.pl' },
  { code:'PL-PK',country:'PL',name_en:'Subcarpathia',name_local:'Podkarpackie',type:'voivodeship',language:'pl',currency:'PLN',escort_term:'pojazd eskortujący',pilot_car_term:'pojazd pilotujący',compliance_url:'https://www.gddkia.gov.pl' },
  { code:'PL-PD',country:'PL',name_en:'Podlasie',name_local:'Podlaskie',type:'voivodeship',language:'pl',currency:'PLN',escort_term:'pojazd eskortujący',pilot_car_term:'pojazd pilotujący',compliance_url:'https://www.gddkia.gov.pl' },
  { code:'PL-PM',country:'PL',name_en:'Pomerania',name_local:'Pomorskie',type:'voivodeship',language:'pl',currency:'PLN',escort_term:'pojazd eskortujący',pilot_car_term:'pojazd pilotujący',compliance_url:'https://www.gddkia.gov.pl' },
  { code:'PL-SL',country:'PL',name_en:'Silesia',name_local:'Śląskie',type:'voivodeship',language:'pl',currency:'PLN',escort_term:'pojazd eskortujący',pilot_car_term:'pojazd pilotujący',compliance_url:'https://www.gddkia.gov.pl' },
  { code:'PL-SK',country:'PL',name_en:'Holy Cross',name_local:'Świętokrzyskie',type:'voivodeship',language:'pl',currency:'PLN',escort_term:'pojazd eskortujący',pilot_car_term:'pojazd pilotujący',compliance_url:'https://www.gddkia.gov.pl' },
  { code:'PL-WN',country:'PL',name_en:'Warmia-Masuria',name_local:'Warmińsko-Mazurskie',type:'voivodeship',language:'pl',currency:'PLN',escort_term:'pojazd eskortujący',pilot_car_term:'pojazd pilotujący',compliance_url:'https://www.gddkia.gov.pl' },
  { code:'PL-WP',country:'PL',name_en:'Greater Poland',name_local:'Wielkopolskie',type:'voivodeship',language:'pl',currency:'PLN',escort_term:'pojazd eskortujący',pilot_car_term:'pojazd pilotujący',compliance_url:'https://www.gddkia.gov.pl' },
  { code:'PL-ZP',country:'PL',name_en:'West Pomerania',name_local:'Zachodniopomorskie',type:'voivodeship',language:'pl',currency:'PLN',escort_term:'pojazd eskortujący',pilot_car_term:'pojazd pilotujący',compliance_url:'https://www.gddkia.gov.pl' },
];

// ── South Korea Metropolitan Cities + Provinces (key markets) ──
export const KR_JURISDICTIONS: Jurisdiction[] = [
  { code:'KR-11',country:'KR',name_en:'Seoul',name_local:'서울특별시',type:'municipality',language:'ko',currency:'KRW',escort_term:'호송차량',pilot_car_term:'선도차량',compliance_url:'https://www.molit.go.kr' },
  { code:'KR-26',country:'KR',name_en:'Busan',name_local:'부산광역시',type:'municipality',language:'ko',currency:'KRW',escort_term:'호송차량',pilot_car_term:'선도차량',compliance_url:'https://www.molit.go.kr' },
  { code:'KR-28',country:'KR',name_en:'Incheon',name_local:'인천광역시',type:'municipality',language:'ko',currency:'KRW',escort_term:'호송차량',pilot_car_term:'선도차량',compliance_url:'https://www.molit.go.kr' },
  { code:'KR-41',country:'KR',name_en:'Gyeonggi',name_local:'경기도',type:'province',language:'ko',currency:'KRW',escort_term:'호송차량',pilot_car_term:'선도차량',compliance_url:'https://www.molit.go.kr' },
  { code:'KR-47',country:'KR',name_en:'North Gyeongsang',name_local:'경상북도',type:'province',language:'ko',currency:'KRW',escort_term:'호송차량',pilot_car_term:'선도차량',compliance_url:'https://www.molit.go.kr' },
  { code:'KR-48',country:'KR',name_en:'South Gyeongsang',name_local:'경상남도',type:'province',language:'ko',currency:'KRW',escort_term:'호송차량',pilot_car_term:'선도차량',compliance_url:'https://www.molit.go.kr' },
];

// ── Aggregate all international jurisdictions ──
export const ALL_INTL_JURISDICTIONS: Jurisdiction[] = [
  ...MX_JURISDICTIONS,
  ...IN_JURISDICTIONS,
  ...JP_JURISDICTIONS,
  ...FR_JURISDICTIONS,
  ...ES_JURISDICTIONS,
  ...IT_JURISDICTIONS,
  ...PL_JURISDICTIONS,
  ...KR_JURISDICTIONS,
];
