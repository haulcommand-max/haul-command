/**
 * TSAS Category Map — TruckStopsAndServices.com → Haul Command
 * 
 * Maps all 47 source category IDs to Haul Command entity types.
 * Used by the crawler, normalization pipeline, and directory system.
 */

export const TSAS_CATEGORY_MAP = {
  19:  { label: 'Truck Stops',                          hc_type: 'truck_stop',             isPhysical: true,  isMobile: false, isCore: false },
  23:  { label: "Wal Mart's With Truck Parking",        hc_type: 'walmart_truck_parking',  isPhysical: true,  isMobile: false, isCore: false },
  25:  { label: 'State Weigh Stations',                 hc_type: 'weigh_station',          isPhysical: true,  isMobile: false, isCore: false },
  26:  { label: 'Rest Areas',                           hc_type: 'rest_area',              isPhysical: true,  isMobile: false, isCore: false },
  27:  { label: 'Pilot Car Companies',                  hc_type: 'pilot_car_operator',     isPhysical: false, isMobile: true,  isCore: true  },
  28:  { label: 'Tire Repair / Sales',                  hc_type: 'tire_repair',            isPhysical: true,  isMobile: false, isCore: false },
  29:  { label: 'Towing / Wrecker Service',             hc_type: 'heavy_towing',           isPhysical: false, isMobile: true,  isCore: false },
  30:  { label: 'Truck / Trailer Repair',               hc_type: 'truck_repair_shop',      isPhysical: true,  isMobile: false, isCore: false },
  31:  { label: 'Oil and Lube',                         hc_type: 'oil_lube',               isPhysical: true,  isMobile: false, isCore: false },
  32:  { label: 'Truck Wash',                           hc_type: 'truck_wash',             isPhysical: true,  isMobile: false, isCore: false },
  33:  { label: 'Trailer Wash',                         hc_type: 'trailer_wash',           isPhysical: true,  isMobile: false, isCore: false },
  68:  { label: 'Transportation Brokers',               hc_type: 'freight_broker',         isPhysical: false, isMobile: false, isCore: false },
  70:  { label: 'Mobile Truck/Trailer Repair',          hc_type: 'mobile_truck_repair',    isPhysical: false, isMobile: true,  isCore: false },
  71:  { label: 'CB Shops',                             hc_type: 'cb_shop',                isPhysical: true,  isMobile: false, isCore: false },
  72:  { label: 'Restaurants With Truck Parking',       hc_type: 'truck_parking_restaurant', isPhysical: true, isMobile: false, isCore: false },
  73:  { label: 'Motels With Truck Parking / Specials', hc_type: 'trucker_hotel',          isPhysical: true,  isMobile: false, isCore: false },
  75:  { label: 'RV Repair',                            hc_type: 'rv_repair',              isPhysical: true,  isMobile: false, isCore: false },
  78:  { label: 'Fast Food With Truck Parking',         hc_type: 'truck_parking_food',     isPhysical: true,  isMobile: false, isCore: false },
  79:  { label: 'Environmental Clean up',               hc_type: 'environmental_cleanup',  isPhysical: false, isMobile: true,  isCore: false },
  81:  { label: 'Reefer Repairs',                       hc_type: 'reefer_repair',          isPhysical: true,  isMobile: false, isCore: false },
  82:  { label: 'Welding',                              hc_type: 'welding_service',        isPhysical: true,  isMobile: false, isCore: false },
  86:  { label: 'Chrome Shops',                         hc_type: 'chrome_shop',            isPhysical: true,  isMobile: false, isCore: false },
  87:  { label: 'Truck / Trailer Dealers',              hc_type: 'truck_dealer',           isPhysical: true,  isMobile: false, isCore: false },
  88:  { label: 'Garages/Shops',                        hc_type: 'garage_shop',            isPhysical: true,  isMobile: false, isCore: false },
  92:  { label: 'Pilot Car Services & Insurance',       hc_type: 'pilot_car_services',     isPhysical: false, isMobile: true,  isCore: true  },
  93:  { label: 'CAT Scale Locations',                  hc_type: 'cat_scale',              isPhysical: true,  isMobile: false, isCore: false },
  94:  { label: 'Truck Salvage',                        hc_type: 'truck_salvage',          isPhysical: true,  isMobile: false, isCore: false },
  95:  { label: 'Secure Storage',                       hc_type: 'secure_storage',         isPhysical: true,  isMobile: false, isCore: false },
  96:  { label: 'Axle Repairs',                         hc_type: 'axle_repair',            isPhysical: true,  isMobile: false, isCore: false },
  97:  { label: 'Trucker Supplies/Safety Equip.',       hc_type: 'trucker_supplies',       isPhysical: true,  isMobile: false, isCore: false },
  98:  { label: 'Truck Driving Jobs',                   hc_type: 'driving_jobs',           isPhysical: false, isMobile: false, isCore: false },
  99:  { label: 'Load Storage - Cold or Dry',           hc_type: 'load_storage',           isPhysical: true,  isMobile: false, isCore: false },
  101: { label: 'Parts',                                hc_type: 'parts_supplier',         isPhysical: true,  isMobile: false, isCore: false },
  103: { label: 'Hydraulics',                            hc_type: 'hydraulics',             isPhysical: true,  isMobile: false, isCore: false },
  104: { label: 'Body Shop',                             hc_type: 'body_shop',              isPhysical: true,  isMobile: false, isCore: false },
  105: { label: 'Trailer/ Tanker Wash Out',              hc_type: 'tanker_washout',         isPhysical: true,  isMobile: false, isCore: false },
  106: { label: 'Lock Out Services',                     hc_type: 'lockout_service',        isPhysical: false, isMobile: true,  isCore: false },
  107: { label: 'Secure Trailer Drop Yard & Parking',    hc_type: 'secure_yard',            isPhysical: true,  isMobile: false, isCore: false },
  109: { label: 'Auto Repair',                           hc_type: 'auto_repair',            isPhysical: true,  isMobile: false, isCore: false },
  111: { label: 'Truck Insurance',                       hc_type: 'truck_insurance',        isPhysical: false, isMobile: false, isCore: false },
  112: { label: "Wal Mart's Without Truck Parking",      hc_type: 'walmart_no_parking',     isPhysical: true,  isMobile: false, isCore: false },
  113: { label: 'Mobile Fueling',                        hc_type: 'mobile_fueling',         isPhysical: false, isMobile: true,  isCore: false },
  117: { label: 'Cartage Moves',                         hc_type: 'cartage',                isPhysical: false, isMobile: true,  isCore: false },
  122: { label: 'Oil Supplies - Delivery',               hc_type: 'oil_delivery',           isPhysical: false, isMobile: true,  isCore: false },
  123: { label: 'Glass Repair/Sales',                    hc_type: 'glass_repair',           isPhysical: true,  isMobile: false, isCore: false },
  128: { label: 'Spill Response',                        hc_type: 'spill_response',         isPhysical: false, isMobile: true,  isCore: false },
};

/** TSAS state ID → US/CA state code mapping */
export const TSAS_STATE_MAP = {
  1:  'AL', 2:  'AR', 3:  'AZ', 4:  'BC', 5:  'CA', 6:  'CO',
  7:  'CT', 8:  'DE', 9:  'FL', 10: 'GA', 11: 'IA', 12: 'ID',
  13: 'IL', 14: 'IN', 15: 'KS', 16: 'KY', 17: 'LA', 18: 'MA',
  19: 'MD', 20: 'ME', 21: 'MI', 22: 'MN', 23: 'MO', 24: 'MS',
  25: 'MT', 26: 'NC', 27: 'ND', 28: 'NE', 29: 'NH', 30: 'NJ',
  31: 'NM', 32: 'NS', 33: 'NV', 34: 'NY', 35: 'OH', 36: 'OK',
  37: 'ON', 38: 'OR', 39: 'PA', 40: 'QC', 41: 'RI', 42: 'SC',
  43: 'SD', 44: 'TN', 45: 'TX', 46: 'UT', 47: 'VA', 48: 'VT',
  49: 'WI', 50: 'WV', 51: 'WA', 52: 'WY',
  53: 'AB', 54: 'MB', 55: 'NB', 56: 'NL', 57: 'NT',
  59: 'NU', 60: 'PE', 61: 'SK', 62: 'YT', 63: 'AK',
};

/** Map state code → country code */
export const STATE_TO_COUNTRY = {};
const CA_PROVINCES = new Set(['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT']);
for (const [, code] of Object.entries(TSAS_STATE_MAP)) {
  STATE_TO_COUNTRY[code] = CA_PROVINCES.has(code) ? 'CA' : 'US';
}

/** Known chain brands for chain vs independent classification */
export const KNOWN_CHAINS = [
  'loves', 'flying j', 'pilot', 'ta ', 'petro', 'walmart', 'wal mart',
  'sheetz', 'wawa', 'casey', 'racetrac', 'buc-ees', "buc-ee's",
  'iowa 80', 'road ranger', 'kwik trip', 'quicktrip', 'ambest',
  'sapp bros', 'little america', 'royal truck stop',
];

/**
 * Detect if a name belongs to a known chain brand.
 * Returns the normalized chain brand or null for independent.
 */
export function detectChain(name) {
  const lower = name.toLowerCase();
  for (const chain of KNOWN_CHAINS) {
    if (lower.includes(chain)) return chain.trim();
  }
  return null;
}

/**
 * Title-case a business name from ALL CAPS.
 * Preserves common trucking abbreviations.
 */
const PRESERVE_UPPER = new Set(['LLC', 'INC', 'CO', 'LTD', 'DBA', 'DOT', 'CDL', 'RV', 'CB', 'CAT', 'EFS', 'TA']);
export function titleCase(str) {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map(word => {
      const upper = word.toUpperCase().replace(/[^A-Z]/g, '');
      if (PRESERVE_UPPER.has(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/\b(Llc|Inc|Co)\./g, (m) => m.toUpperCase());
}

/**
 * Normalize a phone string to E.164 (US/CA assumed).
 */
export function normalizePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return raw; // return raw if can't normalize
}
