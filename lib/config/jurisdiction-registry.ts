// ══════════════════════════════════════════════════════════════
// GLOBAL JURISDICTION REGISTRY — All 57 Countries
// ISO 3166-2 compliant. Every administrative subdivision.
// ══════════════════════════════════════════════════════════════

import { ALL_INTL_JURISDICTIONS } from './jurisdiction-registry-intl';

export interface Jurisdiction {
  code: string;            // ISO 3166-2 (e.g. US-TX, AU-NSW, DE-BY)
  country: string;         // ISO 3166-1 alpha-2
  name_en: string;         // English name
  name_local: string;      // Native language name
  type: string;            // state/province/emirate/bundesland/prefecture/etc
  language: string;        // primary language code
  currency: string;        // ISO 4217
  escort_term: string;     // what escorts are called locally
  pilot_car_term: string;  // what pilot cars are called locally
  compliance_url: string;  // official transport authority URL
}

// ── US States + DC + Territories (56) ──
const US_JURISDICTIONS: Jurisdiction[] = [
  { code:'US-AL',country:'US',name_en:'Alabama',name_local:'Alabama',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.dot.state.al.us' },
  { code:'US-AK',country:'US',name_en:'Alaska',name_local:'Alaska',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://dot.alaska.gov' },
  { code:'US-AZ',country:'US',name_en:'Arizona',name_local:'Arizona',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://azdot.gov' },
  { code:'US-AR',country:'US',name_en:'Arkansas',name_local:'Arkansas',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.ardot.gov' },
  { code:'US-CA',country:'US',name_en:'California',name_local:'California',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://dot.ca.gov' },
  { code:'US-CO',country:'US',name_en:'Colorado',name_local:'Colorado',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.codot.gov' },
  { code:'US-CT',country:'US',name_en:'Connecticut',name_local:'Connecticut',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://portal.ct.gov/dot' },
  { code:'US-DE',country:'US',name_en:'Delaware',name_local:'Delaware',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://deldot.gov' },
  { code:'US-FL',country:'US',name_en:'Florida',name_local:'Florida',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.fdot.gov' },
  { code:'US-GA',country:'US',name_en:'Georgia',name_local:'Georgia',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.dot.ga.gov' },
  { code:'US-HI',country:'US',name_en:'Hawaii',name_local:'Hawaii',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://hidot.hawaii.gov' },
  { code:'US-ID',country:'US',name_en:'Idaho',name_local:'Idaho',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://itd.idaho.gov' },
  { code:'US-IL',country:'US',name_en:'Illinois',name_local:'Illinois',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://idot.illinois.gov' },
  { code:'US-IN',country:'US',name_en:'Indiana',name_local:'Indiana',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.in.gov/indot' },
  { code:'US-IA',country:'US',name_en:'Iowa',name_local:'Iowa',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://iowadot.gov' },
  { code:'US-KS',country:'US',name_en:'Kansas',name_local:'Kansas',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.ksdot.gov' },
  { code:'US-KY',country:'US',name_en:'Kentucky',name_local:'Kentucky',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://transportation.ky.gov' },
  { code:'US-LA',country:'US',name_en:'Louisiana',name_local:'Louisiana',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.dotd.la.gov' },
  { code:'US-ME',country:'US',name_en:'Maine',name_local:'Maine',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.maine.gov/mdot' },
  { code:'US-MD',country:'US',name_en:'Maryland',name_local:'Maryland',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.mdot.maryland.gov' },
  { code:'US-MA',country:'US',name_en:'Massachusetts',name_local:'Massachusetts',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.mass.gov/massdot' },
  { code:'US-MI',country:'US',name_en:'Michigan',name_local:'Michigan',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.michigan.gov/mdot' },
  { code:'US-MN',country:'US',name_en:'Minnesota',name_local:'Minnesota',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.dot.state.mn.us' },
  { code:'US-MS',country:'US',name_en:'Mississippi',name_local:'Mississippi',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://mdot.ms.gov' },
  { code:'US-MO',country:'US',name_en:'Missouri',name_local:'Missouri',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.modot.org' },
  { code:'US-MT',country:'US',name_en:'Montana',name_local:'Montana',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.mdt.mt.gov' },
  { code:'US-NE',country:'US',name_en:'Nebraska',name_local:'Nebraska',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://dot.nebraska.gov' },
  { code:'US-NV',country:'US',name_en:'Nevada',name_local:'Nevada',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.dot.nv.gov' },
  { code:'US-NH',country:'US',name_en:'New Hampshire',name_local:'New Hampshire',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.nh.gov/dot' },
  { code:'US-NJ',country:'US',name_en:'New Jersey',name_local:'New Jersey',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.nj.gov/transportation' },
  { code:'US-NM',country:'US',name_en:'New Mexico',name_local:'New Mexico',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.dot.nm.gov' },
  { code:'US-NY',country:'US',name_en:'New York',name_local:'New York',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.dot.ny.gov' },
  { code:'US-NC',country:'US',name_en:'North Carolina',name_local:'North Carolina',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.ncdot.gov' },
  { code:'US-ND',country:'US',name_en:'North Dakota',name_local:'North Dakota',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.dot.nd.gov' },
  { code:'US-OH',country:'US',name_en:'Ohio',name_local:'Ohio',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.transportation.ohio.gov' },
  { code:'US-OK',country:'US',name_en:'Oklahoma',name_local:'Oklahoma',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://oklahoma.gov/odot' },
  { code:'US-OR',country:'US',name_en:'Oregon',name_local:'Oregon',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.oregon.gov/odot' },
  { code:'US-PA',country:'US',name_en:'Pennsylvania',name_local:'Pennsylvania',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.penndot.pa.gov' },
  { code:'US-RI',country:'US',name_en:'Rhode Island',name_local:'Rhode Island',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.dot.ri.gov' },
  { code:'US-SC',country:'US',name_en:'South Carolina',name_local:'South Carolina',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.scdot.org' },
  { code:'US-SD',country:'US',name_en:'South Dakota',name_local:'South Dakota',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://dot.sd.gov' },
  { code:'US-TN',country:'US',name_en:'Tennessee',name_local:'Tennessee',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.tn.gov/tdot' },
  { code:'US-TX',country:'US',name_en:'Texas',name_local:'Texas',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.txdot.gov' },
  { code:'US-UT',country:'US',name_en:'Utah',name_local:'Utah',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.udot.utah.gov' },
  { code:'US-VT',country:'US',name_en:'Vermont',name_local:'Vermont',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://vtrans.vermont.gov' },
  { code:'US-VA',country:'US',name_en:'Virginia',name_local:'Virginia',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.virginiadot.org' },
  { code:'US-WA',country:'US',name_en:'Washington',name_local:'Washington',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://wsdot.wa.gov' },
  { code:'US-WV',country:'US',name_en:'West Virginia',name_local:'West Virginia',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://transportation.wv.gov' },
  { code:'US-WI',country:'US',name_en:'Wisconsin',name_local:'Wisconsin',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://wisconsindot.gov' },
  { code:'US-WY',country:'US',name_en:'Wyoming',name_local:'Wyoming',type:'state',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.dot.state.wy.us' },
  { code:'US-DC',country:'US',name_en:'District of Columbia',name_local:'District of Columbia',type:'district',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://ddot.dc.gov' },
  { code:'US-PR',country:'US',name_en:'Puerto Rico',name_local:'Puerto Rico',type:'territory',language:'es',currency:'USD',escort_term:'vehículo escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.dtop.pr.gov' },
  { code:'US-GU',country:'US',name_en:'Guam',name_local:'Guam',type:'territory',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.gpublica.guam.gov' },
  { code:'US-VI',country:'US',name_en:'U.S. Virgin Islands',name_local:'U.S. Virgin Islands',type:'territory',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.vitranvi.com' },
  { code:'US-AS',country:'US',name_en:'American Samoa',name_local:'American Samoa',type:'territory',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.americansamoa.gov' },
  { code:'US-MP',country:'US',name_en:'Northern Mariana Islands',name_local:'Northern Mariana Islands',type:'territory',language:'en',currency:'USD',escort_term:'escort vehicle',pilot_car_term:'pilot car',compliance_url:'https://www.cnmigov.mp' },
];

// ── Canada Provinces & Territories (13) ──
const CA_JURISDICTIONS: Jurisdiction[] = [
  { code:'CA-AB',country:'CA',name_en:'Alberta',name_local:'Alberta',type:'province',language:'en',currency:'CAD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.alberta.ca/transportation' },
  { code:'CA-BC',country:'CA',name_en:'British Columbia',name_local:'British Columbia',type:'province',language:'en',currency:'CAD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www2.gov.bc.ca/gov/content/transportation' },
  { code:'CA-MB',country:'CA',name_en:'Manitoba',name_local:'Manitoba',type:'province',language:'en',currency:'CAD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.gov.mb.ca/mit' },
  { code:'CA-NB',country:'CA',name_en:'New Brunswick',name_local:'Nouveau-Brunswick',type:'province',language:'en',currency:'CAD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www2.gnb.ca/content/gnb/en/departments/dti' },
  { code:'CA-NL',country:'CA',name_en:'Newfoundland and Labrador',name_local:'Newfoundland and Labrador',type:'province',language:'en',currency:'CAD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.gov.nl.ca/ti' },
  { code:'CA-NS',country:'CA',name_en:'Nova Scotia',name_local:'Nova Scotia',type:'province',language:'en',currency:'CAD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://novascotia.ca/tran' },
  { code:'CA-ON',country:'CA',name_en:'Ontario',name_local:'Ontario',type:'province',language:'en',currency:'CAD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.ontario.ca/page/ministry-transportation' },
  { code:'CA-PE',country:'CA',name_en:'Prince Edward Island',name_local:'Prince Edward Island',type:'province',language:'en',currency:'CAD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.princeedwardisland.ca/en/topic/transportation' },
  { code:'CA-QC',country:'CA',name_en:'Quebec',name_local:'Québec',type:'province',language:'fr',currency:'CAD',escort_term:'véhicule d\'escorte',pilot_car_term:'véhicule pilote',compliance_url:'https://www.transports.gouv.qc.ca' },
  { code:'CA-SK',country:'CA',name_en:'Saskatchewan',name_local:'Saskatchewan',type:'province',language:'en',currency:'CAD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.saskatchewan.ca/government/government-structure/ministries/highways' },
  { code:'CA-NT',country:'CA',name_en:'Northwest Territories',name_local:'Northwest Territories',type:'territory',language:'en',currency:'CAD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.inf.gov.nt.ca' },
  { code:'CA-NU',country:'CA',name_en:'Nunavut',name_local:'Nunavut',type:'territory',language:'en',currency:'CAD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.gov.nu.ca' },
  { code:'CA-YT',country:'CA',name_en:'Yukon',name_local:'Yukon',type:'territory',language:'en',currency:'CAD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://yukon.ca/en/transportation' },
];

// ── Australia States & Territories (8) ──
const AU_JURISDICTIONS: Jurisdiction[] = [
  { code:'AU-NSW',country:'AU',name_en:'New South Wales',name_local:'New South Wales',type:'state',language:'en',currency:'AUD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.transport.nsw.gov.au' },
  { code:'AU-VIC',country:'AU',name_en:'Victoria',name_local:'Victoria',type:'state',language:'en',currency:'AUD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.vic.gov.au/transport' },
  { code:'AU-QLD',country:'AU',name_en:'Queensland',name_local:'Queensland',type:'state',language:'en',currency:'AUD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.tmr.qld.gov.au' },
  { code:'AU-WA',country:'AU',name_en:'Western Australia',name_local:'Western Australia',type:'state',language:'en',currency:'AUD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.mainroads.wa.gov.au' },
  { code:'AU-SA',country:'AU',name_en:'South Australia',name_local:'South Australia',type:'state',language:'en',currency:'AUD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.dit.sa.gov.au' },
  { code:'AU-TAS',country:'AU',name_en:'Tasmania',name_local:'Tasmania',type:'state',language:'en',currency:'AUD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.transport.tas.gov.au' },
  { code:'AU-ACT',country:'AU',name_en:'Australian Capital Territory',name_local:'Australian Capital Territory',type:'territory',language:'en',currency:'AUD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.cityservices.act.gov.au' },
  { code:'AU-NT',country:'AU',name_en:'Northern Territory',name_local:'Northern Territory',type:'territory',language:'en',currency:'AUD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://dipl.nt.gov.au' },
];

// ── United Kingdom (4 nations) ──
const GB_JURISDICTIONS: Jurisdiction[] = [
  { code:'GB-ENG',country:'GB',name_en:'England',name_local:'England',type:'country',language:'en',currency:'GBP',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.gov.uk/government/organisations/department-for-transport' },
  { code:'GB-SCT',country:'GB',name_en:'Scotland',name_local:'Scotland',type:'country',language:'en',currency:'GBP',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.transport.gov.scot' },
  { code:'GB-WLS',country:'GB',name_en:'Wales',name_local:'Cymru',type:'country',language:'en',currency:'GBP',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.gov.wales/transport' },
  { code:'GB-NIR',country:'GB',name_en:'Northern Ireland',name_local:'Northern Ireland',type:'province',language:'en',currency:'GBP',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.infrastructure-ni.gov.uk' },
];

// ── Germany Bundesländer (16) ──
const DE_JURISDICTIONS: Jurisdiction[] = [
  { code:'DE-BW',country:'DE',name_en:'Baden-Württemberg',name_local:'Baden-Württemberg',type:'bundesland',language:'de',currency:'EUR',escort_term:'Begleitfahrzeug',pilot_car_term:'BF3-Fahrzeug',compliance_url:'https://vm.baden-wuerttemberg.de' },
  { code:'DE-BY',country:'DE',name_en:'Bavaria',name_local:'Bayern',type:'bundesland',language:'de',currency:'EUR',escort_term:'Begleitfahrzeug',pilot_car_term:'BF3-Fahrzeug',compliance_url:'https://www.stmb.bayern.de' },
  { code:'DE-BE',country:'DE',name_en:'Berlin',name_local:'Berlin',type:'bundesland',language:'de',currency:'EUR',escort_term:'Begleitfahrzeug',pilot_car_term:'BF3-Fahrzeug',compliance_url:'https://www.berlin.de/sen/uvk' },
  { code:'DE-BB',country:'DE',name_en:'Brandenburg',name_local:'Brandenburg',type:'bundesland',language:'de',currency:'EUR',escort_term:'Begleitfahrzeug',pilot_car_term:'BF3-Fahrzeug',compliance_url:'https://mil.brandenburg.de' },
  { code:'DE-HB',country:'DE',name_en:'Bremen',name_local:'Bremen',type:'bundesland',language:'de',currency:'EUR',escort_term:'Begleitfahrzeug',pilot_car_term:'BF3-Fahrzeug',compliance_url:'https://www.bauumwelt.bremen.de' },
  { code:'DE-HH',country:'DE',name_en:'Hamburg',name_local:'Hamburg',type:'bundesland',language:'de',currency:'EUR',escort_term:'Begleitfahrzeug',pilot_car_term:'BF3-Fahrzeug',compliance_url:'https://www.hamburg.de/bvm' },
  { code:'DE-HE',country:'DE',name_en:'Hesse',name_local:'Hessen',type:'bundesland',language:'de',currency:'EUR',escort_term:'Begleitfahrzeug',pilot_car_term:'BF3-Fahrzeug',compliance_url:'https://wirtschaft.hessen.de' },
  { code:'DE-MV',country:'DE',name_en:'Mecklenburg-Vorpommern',name_local:'Mecklenburg-Vorpommern',type:'bundesland',language:'de',currency:'EUR',escort_term:'Begleitfahrzeug',pilot_car_term:'BF3-Fahrzeug',compliance_url:'https://www.regierung-mv.de/Landesregierung/em' },
  { code:'DE-NI',country:'DE',name_en:'Lower Saxony',name_local:'Niedersachsen',type:'bundesland',language:'de',currency:'EUR',escort_term:'Begleitfahrzeug',pilot_car_term:'BF3-Fahrzeug',compliance_url:'https://www.mw.niedersachsen.de' },
  { code:'DE-NW',country:'DE',name_en:'North Rhine-Westphalia',name_local:'Nordrhein-Westfalen',type:'bundesland',language:'de',currency:'EUR',escort_term:'Begleitfahrzeug',pilot_car_term:'BF3-Fahrzeug',compliance_url:'https://www.vm.nrw.de' },
  { code:'DE-RP',country:'DE',name_en:'Rhineland-Palatinate',name_local:'Rheinland-Pfalz',type:'bundesland',language:'de',currency:'EUR',escort_term:'Begleitfahrzeug',pilot_car_term:'BF3-Fahrzeug',compliance_url:'https://mwvlw.rlp.de' },
  { code:'DE-SL',country:'DE',name_en:'Saarland',name_local:'Saarland',type:'bundesland',language:'de',currency:'EUR',escort_term:'Begleitfahrzeug',pilot_car_term:'BF3-Fahrzeug',compliance_url:'https://www.saarland.de/mwaev' },
  { code:'DE-SN',country:'DE',name_en:'Saxony',name_local:'Sachsen',type:'bundesland',language:'de',currency:'EUR',escort_term:'Begleitfahrzeug',pilot_car_term:'BF3-Fahrzeug',compliance_url:'https://www.smwa.sachsen.de' },
  { code:'DE-ST',country:'DE',name_en:'Saxony-Anhalt',name_local:'Sachsen-Anhalt',type:'bundesland',language:'de',currency:'EUR',escort_term:'Begleitfahrzeug',pilot_car_term:'BF3-Fahrzeug',compliance_url:'https://mid.sachsen-anhalt.de' },
  { code:'DE-SH',country:'DE',name_en:'Schleswig-Holstein',name_local:'Schleswig-Holstein',type:'bundesland',language:'de',currency:'EUR',escort_term:'Begleitfahrzeug',pilot_car_term:'BF3-Fahrzeug',compliance_url:'https://www.schleswig-holstein.de/DE/landesregierung/ministerien-behoerden/MWVATT' },
  { code:'DE-TH',country:'DE',name_en:'Thuringia',name_local:'Thüringen',type:'bundesland',language:'de',currency:'EUR',escort_term:'Begleitfahrzeug',pilot_car_term:'BF3-Fahrzeug',compliance_url:'https://infrastruktur-landwirtschaft.thueringen.de' },
];

// ── Netherlands Provinces (12) ──
const NL_JURISDICTIONS: Jurisdiction[] = [
  { code:'NL-DR',country:'NL',name_en:'Drenthe',name_local:'Drenthe',type:'province',language:'nl',currency:'EUR',escort_term:'begeleidingsvoertuig',pilot_car_term:'voorrijdend voertuig',compliance_url:'https://www.rijkswaterstaat.nl' },
  { code:'NL-FL',country:'NL',name_en:'Flevoland',name_local:'Flevoland',type:'province',language:'nl',currency:'EUR',escort_term:'begeleidingsvoertuig',pilot_car_term:'voorrijdend voertuig',compliance_url:'https://www.rijkswaterstaat.nl' },
  { code:'NL-FR',country:'NL',name_en:'Friesland',name_local:'Fryslân',type:'province',language:'nl',currency:'EUR',escort_term:'begeleidingsvoertuig',pilot_car_term:'voorrijdend voertuig',compliance_url:'https://www.rijkswaterstaat.nl' },
  { code:'NL-GE',country:'NL',name_en:'Gelderland',name_local:'Gelderland',type:'province',language:'nl',currency:'EUR',escort_term:'begeleidingsvoertuig',pilot_car_term:'voorrijdend voertuig',compliance_url:'https://www.rijkswaterstaat.nl' },
  { code:'NL-GR',country:'NL',name_en:'Groningen',name_local:'Groningen',type:'province',language:'nl',currency:'EUR',escort_term:'begeleidingsvoertuig',pilot_car_term:'voorrijdend voertuig',compliance_url:'https://www.rijkswaterstaat.nl' },
  { code:'NL-LI',country:'NL',name_en:'Limburg',name_local:'Limburg',type:'province',language:'nl',currency:'EUR',escort_term:'begeleidingsvoertuig',pilot_car_term:'voorrijdend voertuig',compliance_url:'https://www.rijkswaterstaat.nl' },
  { code:'NL-NB',country:'NL',name_en:'North Brabant',name_local:'Noord-Brabant',type:'province',language:'nl',currency:'EUR',escort_term:'begeleidingsvoertuig',pilot_car_term:'voorrijdend voertuig',compliance_url:'https://www.rijkswaterstaat.nl' },
  { code:'NL-NH',country:'NL',name_en:'North Holland',name_local:'Noord-Holland',type:'province',language:'nl',currency:'EUR',escort_term:'begeleidingsvoertuig',pilot_car_term:'voorrijdend voertuig',compliance_url:'https://www.rijkswaterstaat.nl' },
  { code:'NL-OV',country:'NL',name_en:'Overijssel',name_local:'Overijssel',type:'province',language:'nl',currency:'EUR',escort_term:'begeleidingsvoertuig',pilot_car_term:'voorrijdend voertuig',compliance_url:'https://www.rijkswaterstaat.nl' },
  { code:'NL-UT',country:'NL',name_en:'Utrecht',name_local:'Utrecht',type:'province',language:'nl',currency:'EUR',escort_term:'begeleidingsvoertuig',pilot_car_term:'voorrijdend voertuig',compliance_url:'https://www.rijkswaterstaat.nl' },
  { code:'NL-ZE',country:'NL',name_en:'Zeeland',name_local:'Zeeland',type:'province',language:'nl',currency:'EUR',escort_term:'begeleidingsvoertuig',pilot_car_term:'voorrijdend voertuig',compliance_url:'https://www.rijkswaterstaat.nl' },
  { code:'NL-ZH',country:'NL',name_en:'South Holland',name_local:'Zuid-Holland',type:'province',language:'nl',currency:'EUR',escort_term:'begeleidingsvoertuig',pilot_car_term:'voorrijdend voertuig',compliance_url:'https://www.rijkswaterstaat.nl' },
];

// ── UAE Emirates (7) ──
const AE_JURISDICTIONS: Jurisdiction[] = [
  { code:'AE-DU',country:'AE',name_en:'Dubai',name_local:'دبي',type:'emirate',language:'ar',currency:'AED',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.rta.ae' },
  { code:'AE-AZ',country:'AE',name_en:'Abu Dhabi',name_local:'أبو ظبي',type:'emirate',language:'ar',currency:'AED',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://dot.abudhabi.ae' },
  { code:'AE-SH',country:'AE',name_en:'Sharjah',name_local:'الشارقة',type:'emirate',language:'ar',currency:'AED',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.sharjah.ae' },
  { code:'AE-AJ',country:'AE',name_en:'Ajman',name_local:'عجمان',type:'emirate',language:'ar',currency:'AED',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.ajman.ae' },
  { code:'AE-RK',country:'AE',name_en:'Ras Al Khaimah',name_local:'رأس الخيمة',type:'emirate',language:'ar',currency:'AED',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.rak.ae' },
  { code:'AE-FU',country:'AE',name_en:'Fujairah',name_local:'الفجيرة',type:'emirate',language:'ar',currency:'AED',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.fujairah.ae' },
  { code:'AE-UQ',country:'AE',name_en:'Umm Al Quwain',name_local:'أم القيوين',type:'emirate',language:'ar',currency:'AED',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.uaq.ae' },
];

// ── Saudi Arabia Regions (13) ──
const SA_JURISDICTIONS: Jurisdiction[] = [
  { code:'SA-01',country:'SA',name_en:'Riyadh',name_local:'الرياض',type:'region',language:'ar',currency:'SAR',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.mot.gov.sa' },
  { code:'SA-02',country:'SA',name_en:'Makkah',name_local:'مكة المكرمة',type:'region',language:'ar',currency:'SAR',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.mot.gov.sa' },
  { code:'SA-03',country:'SA',name_en:'Madinah',name_local:'المدينة المنورة',type:'region',language:'ar',currency:'SAR',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.mot.gov.sa' },
  { code:'SA-04',country:'SA',name_en:'Eastern',name_local:'المنطقة الشرقية',type:'region',language:'ar',currency:'SAR',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.mot.gov.sa' },
  { code:'SA-05',country:'SA',name_en:'Al-Qassim',name_local:'القصيم',type:'region',language:'ar',currency:'SAR',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.mot.gov.sa' },
  { code:'SA-06',country:'SA',name_en:'Ha\'il',name_local:'حائل',type:'region',language:'ar',currency:'SAR',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.mot.gov.sa' },
  { code:'SA-07',country:'SA',name_en:'Tabuk',name_local:'تبوك',type:'region',language:'ar',currency:'SAR',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.mot.gov.sa' },
  { code:'SA-08',country:'SA',name_en:'Northern Borders',name_local:'الحدود الشمالية',type:'region',language:'ar',currency:'SAR',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.mot.gov.sa' },
  { code:'SA-09',country:'SA',name_en:'Jazan',name_local:'جازان',type:'region',language:'ar',currency:'SAR',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.mot.gov.sa' },
  { code:'SA-10',country:'SA',name_en:'Najran',name_local:'نجران',type:'region',language:'ar',currency:'SAR',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.mot.gov.sa' },
  { code:'SA-11',country:'SA',name_en:'Al-Bahah',name_local:'الباحة',type:'region',language:'ar',currency:'SAR',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.mot.gov.sa' },
  { code:'SA-12',country:'SA',name_en:'Al-Jouf',name_local:'الجوف',type:'region',language:'ar',currency:'SAR',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.mot.gov.sa' },
  { code:'SA-14',country:'SA',name_en:'Asir',name_local:'عسير',type:'region',language:'ar',currency:'SAR',escort_term:'مركبة مرافقة',pilot_car_term:'سيارة قائدة',compliance_url:'https://www.mot.gov.sa' },
];

// ── New Zealand Regions (16) ──
const NZ_JURISDICTIONS: Jurisdiction[] = [
  { code:'NZ-NTL',country:'NZ',name_en:'Northland',name_local:'Northland',type:'region',language:'en',currency:'NZD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.nzta.govt.nz' },
  { code:'NZ-AUK',country:'NZ',name_en:'Auckland',name_local:'Auckland',type:'region',language:'en',currency:'NZD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.nzta.govt.nz' },
  { code:'NZ-WKO',country:'NZ',name_en:'Waikato',name_local:'Waikato',type:'region',language:'en',currency:'NZD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.nzta.govt.nz' },
  { code:'NZ-BOP',country:'NZ',name_en:'Bay of Plenty',name_local:'Bay of Plenty',type:'region',language:'en',currency:'NZD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.nzta.govt.nz' },
  { code:'NZ-GIS',country:'NZ',name_en:'Gisborne',name_local:'Gisborne',type:'region',language:'en',currency:'NZD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.nzta.govt.nz' },
  { code:'NZ-HKB',country:'NZ',name_en:'Hawke\'s Bay',name_local:'Hawke\'s Bay',type:'region',language:'en',currency:'NZD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.nzta.govt.nz' },
  { code:'NZ-TKI',country:'NZ',name_en:'Taranaki',name_local:'Taranaki',type:'region',language:'en',currency:'NZD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.nzta.govt.nz' },
  { code:'NZ-MWT',country:'NZ',name_en:'Manawatū-Whanganui',name_local:'Manawatū-Whanganui',type:'region',language:'en',currency:'NZD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.nzta.govt.nz' },
  { code:'NZ-WGN',country:'NZ',name_en:'Wellington',name_local:'Wellington',type:'region',language:'en',currency:'NZD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.nzta.govt.nz' },
  { code:'NZ-TAS',country:'NZ',name_en:'Tasman',name_local:'Tasman',type:'region',language:'en',currency:'NZD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.nzta.govt.nz' },
  { code:'NZ-NSN',country:'NZ',name_en:'Nelson',name_local:'Nelson',type:'region',language:'en',currency:'NZD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.nzta.govt.nz' },
  { code:'NZ-MBH',country:'NZ',name_en:'Marlborough',name_local:'Marlborough',type:'region',language:'en',currency:'NZD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.nzta.govt.nz' },
  { code:'NZ-WTC',country:'NZ',name_en:'West Coast',name_local:'West Coast',type:'region',language:'en',currency:'NZD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.nzta.govt.nz' },
  { code:'NZ-CAN',country:'NZ',name_en:'Canterbury',name_local:'Canterbury',type:'region',language:'en',currency:'NZD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.nzta.govt.nz' },
  { code:'NZ-OTA',country:'NZ',name_en:'Otago',name_local:'Otago',type:'region',language:'en',currency:'NZD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.nzta.govt.nz' },
  { code:'NZ-STL',country:'NZ',name_en:'Southland',name_local:'Southland',type:'region',language:'en',currency:'NZD',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.nzta.govt.nz' },
];

// ── South Africa Provinces (9) ──
const ZA_JURISDICTIONS: Jurisdiction[] = [
  { code:'ZA-EC',country:'ZA',name_en:'Eastern Cape',name_local:'Eastern Cape',type:'province',language:'en',currency:'ZAR',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.rtmc.co.za' },
  { code:'ZA-FS',country:'ZA',name_en:'Free State',name_local:'Free State',type:'province',language:'en',currency:'ZAR',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.rtmc.co.za' },
  { code:'ZA-GP',country:'ZA',name_en:'Gauteng',name_local:'Gauteng',type:'province',language:'en',currency:'ZAR',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.rtmc.co.za' },
  { code:'ZA-KZN',country:'ZA',name_en:'KwaZulu-Natal',name_local:'KwaZulu-Natal',type:'province',language:'en',currency:'ZAR',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.rtmc.co.za' },
  { code:'ZA-LP',country:'ZA',name_en:'Limpopo',name_local:'Limpopo',type:'province',language:'en',currency:'ZAR',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.rtmc.co.za' },
  { code:'ZA-MP',country:'ZA',name_en:'Mpumalanga',name_local:'Mpumalanga',type:'province',language:'en',currency:'ZAR',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.rtmc.co.za' },
  { code:'ZA-NW',country:'ZA',name_en:'North West',name_local:'North West',type:'province',language:'en',currency:'ZAR',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.rtmc.co.za' },
  { code:'ZA-NC',country:'ZA',name_en:'Northern Cape',name_local:'Northern Cape',type:'province',language:'en',currency:'ZAR',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.rtmc.co.za' },
  { code:'ZA-WC',country:'ZA',name_en:'Western Cape',name_local:'Western Cape',type:'province',language:'en',currency:'ZAR',escort_term:'escort vehicle',pilot_car_term:'pilot vehicle',compliance_url:'https://www.rtmc.co.za' },
];

// ── Brazil States (26 + DF) ──
const BR_JURISDICTIONS: Jurisdiction[] = [
  { code:'BR-AC',country:'BR',name_en:'Acre',name_local:'Acre',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-AL',country:'BR',name_en:'Alagoas',name_local:'Alagoas',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-AP',country:'BR',name_en:'Amapá',name_local:'Amapá',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-AM',country:'BR',name_en:'Amazonas',name_local:'Amazonas',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-BA',country:'BR',name_en:'Bahia',name_local:'Bahia',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-CE',country:'BR',name_en:'Ceará',name_local:'Ceará',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-DF',country:'BR',name_en:'Federal District',name_local:'Distrito Federal',type:'district',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-ES',country:'BR',name_en:'Espírito Santo',name_local:'Espírito Santo',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-GO',country:'BR',name_en:'Goiás',name_local:'Goiás',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-MA',country:'BR',name_en:'Maranhão',name_local:'Maranhão',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-MT',country:'BR',name_en:'Mato Grosso',name_local:'Mato Grosso',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-MS',country:'BR',name_en:'Mato Grosso do Sul',name_local:'Mato Grosso do Sul',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-MG',country:'BR',name_en:'Minas Gerais',name_local:'Minas Gerais',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-PA',country:'BR',name_en:'Pará',name_local:'Pará',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-PB',country:'BR',name_en:'Paraíba',name_local:'Paraíba',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-PR',country:'BR',name_en:'Paraná',name_local:'Paraná',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-PE',country:'BR',name_en:'Pernambuco',name_local:'Pernambuco',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-PI',country:'BR',name_en:'Piauí',name_local:'Piauí',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-RJ',country:'BR',name_en:'Rio de Janeiro',name_local:'Rio de Janeiro',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-RN',country:'BR',name_en:'Rio Grande do Norte',name_local:'Rio Grande do Norte',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-RS',country:'BR',name_en:'Rio Grande do Sul',name_local:'Rio Grande do Sul',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-RO',country:'BR',name_en:'Rondônia',name_local:'Rondônia',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-RR',country:'BR',name_en:'Roraima',name_local:'Roraima',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-SC',country:'BR',name_en:'Santa Catarina',name_local:'Santa Catarina',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-SP',country:'BR',name_en:'São Paulo',name_local:'São Paulo',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-SE',country:'BR',name_en:'Sergipe',name_local:'Sergipe',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
  { code:'BR-TO',country:'BR',name_en:'Tocantins',name_local:'Tocantins',type:'state',language:'pt',currency:'BRL',escort_term:'veículo de escolta',pilot_car_term:'carro piloto',compliance_url:'https://www.gov.br/antt' },
];

// ══════════════════════════════════════════════════════════════
// COMBINED REGISTRY + LOOKUP FUNCTIONS
// ══════════════════════════════════════════════════════════════

export const JURISDICTION_REGISTRY: Jurisdiction[] = [
  ...US_JURISDICTIONS,
  ...CA_JURISDICTIONS,
  ...AU_JURISDICTIONS,
  ...GB_JURISDICTIONS,
  ...DE_JURISDICTIONS,
  ...NL_JURISDICTIONS,
  ...AE_JURISDICTIONS,
  ...SA_JURISDICTIONS,
  ...NZ_JURISDICTIONS,
  ...ZA_JURISDICTIONS,
  ...BR_JURISDICTIONS,
  ...ALL_INTL_JURISDICTIONS,
];

// ── Lookup by ISO 3166-2 code ──
const _byCode = new Map<string, Jurisdiction>();
JURISDICTION_REGISTRY.forEach(j => _byCode.set(j.code, j));

export function getJurisdiction(code: string): Jurisdiction | undefined {
  return _byCode.get(code.toUpperCase());
}

// ── Get all jurisdictions for a country ──
export function getJurisdictionsByCountry(countryCode: string): Jurisdiction[] {
  return JURISDICTION_REGISTRY.filter(j => j.country === countryCode.toUpperCase());
}

// ── Get all jurisdiction types across the registry ──
export function getJurisdictionTypes(): string[] {
  return [...new Set(JURISDICTION_REGISTRY.map(j => j.type))];
}

// ── Get jurisdiction type label for display ──
export function getJurisdictionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    state: 'State', province: 'Province', territory: 'Territory',
    emirate: 'Emirate', bundesland: 'Bundesland', prefecture: 'Prefecture',
    voivodeship: 'Voivodeship', region: 'Region', county: 'County',
    municipality: 'Municipality', district: 'District', country: 'Country',
    autonomous_community: 'Autonomous Community',
  };
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

// ── Stats ──
export function getRegistryStats() {
  const countries = new Set(JURISDICTION_REGISTRY.map(j => j.country));
  const types = new Set(JURISDICTION_REGISTRY.map(j => j.type));
  return {
    totalJurisdictions: JURISDICTION_REGISTRY.length,
    totalCountries: countries.size,
    jurisdictionTypes: [...types],
  };
}
