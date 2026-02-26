// ════════════════════════════════════════════════════════════════
// HC CITY DATA — 200 Priority Cities + Rural Radius Maps
// Source: hc-seo-seed-v3
// ════════════════════════════════════════════════════════════════

export interface CityEntry {
    city: string;
    state: string;
    country: 'US' | 'CA';
    slug: string;
    isMetro?: boolean;
    ruralSatellites?: string[]; // Cities within ~60mi radius
}

function city(city: string, state: string, country: 'US' | 'CA' = 'US', ruralSatellites?: string[]): CityEntry {
    return { city, state, country, slug: city.toLowerCase().replace(/\s+/g, '-'), isMetro: true, ruralSatellites };
}

function rural(city: string, state: string, country: 'US' | 'CA' = 'US'): CityEntry {
    return { city, state, country, slug: city.toLowerCase().replace(/\s+/g, '-'), isMetro: false };
}

export const PRIORITY_CITIES: CityEntry[] = [
    // ── FLORIDA ─────────────────────────────────────────────────
    city('Miami', 'FL', 'US'),
    city('Tampa', 'FL', 'US'),
    city('Orlando', 'FL', 'US'),
    city('Jacksonville', 'FL', 'US'),
    city('Gainesville', 'FL', 'US', ['Alachua FL', 'Newberry FL', 'High Springs FL', 'Archer FL', 'Waldo FL']),
    city('Ocala', 'FL', 'US'),
    city('Lake City', 'FL', 'US'),
    city('Tallahassee', 'FL', 'US'),
    city('Pensacola', 'FL', 'US'),
    city('Fort Myers', 'FL', 'US'),
    rural('Cross City', 'FL'), rural('Chiefland', 'FL'), rural('Alachua', 'FL'), rural('Newberry', 'FL'), rural('High Springs', 'FL'),

    // ── TEXAS ────────────────────────────────────────────────────
    city('Houston', 'TX', 'US'),
    city('Dallas', 'TX', 'US'),
    city('Fort Worth', 'TX', 'US'),
    city('Austin', 'TX', 'US'),
    city('San Antonio', 'TX', 'US'),
    city('Killeen', 'TX', 'US', ['Copperas Cove TX', 'Harker Heights TX', 'Belton TX']),
    city('Temple', 'TX', 'US'),
    city('Waco', 'TX', 'US'),
    city('Lubbock', 'TX', 'US'),
    city('Midland', 'TX', 'US'),
    city('Odessa', 'TX', 'US'),
    city('Amarillo', 'TX', 'US'),
    city('El Paso', 'TX', 'US'),
    city('Corpus Christi', 'TX', 'US'),
    city('Brownsville', 'TX', 'US'),
    city('McAllen', 'TX', 'US'),
    city('Round Rock', 'TX', 'US'),
    rural('Copperas Cove', 'TX'), rural('Harker Heights', 'TX'), rural('Belton', 'TX'),

    // ── CALIFORNIA ───────────────────────────────────────────────
    city('Los Angeles', 'CA', 'US'),
    city('San Diego', 'CA', 'US'),
    city('San Jose', 'CA', 'US'),
    city('Sacramento', 'CA', 'US'),
    city('Fresno', 'CA', 'US'),
    city('Bakersfield', 'CA', 'US'),
    city('Stockton', 'CA', 'US'),
    city('Riverside', 'CA', 'US'),
    city('San Bernardino', 'CA', 'US'),
    city('Modesto', 'CA', 'US'),

    // ── SOUTHEAST ────────────────────────────────────────────────
    city('Atlanta', 'GA', 'US'),
    city('Savannah', 'GA', 'US'),
    city('Macon', 'GA', 'US'),
    city('Birmingham', 'AL', 'US'),
    city('Mobile', 'AL', 'US'),
    city('Montgomery', 'AL', 'US'),
    city('Nashville', 'TN', 'US'),
    city('Memphis', 'TN', 'US'),
    city('Charlotte', 'NC', 'US'),
    city('Raleigh', 'NC', 'US'),
    city('Columbia', 'SC', 'US'),
    city('Charleston', 'SC', 'US'),
    city('Greenville', 'SC', 'US'),

    // ── MIDWEST ──────────────────────────────────────────────────
    city('Chicago', 'IL', 'US'),
    city('Indianapolis', 'IN', 'US'),
    city('Columbus', 'OH', 'US'),
    city('Cincinnati', 'OH', 'US'),
    city('Cleveland', 'OH', 'US'),
    city('Detroit', 'MI', 'US'),
    city('Grand Rapids', 'MI', 'US'),
    city('Louisville', 'KY', 'US'),
    city('Lexington', 'KY', 'US'),
    city('St Louis', 'MO', 'US'),
    city('Kansas City', 'MO', 'US'),

    // ── WEST ─────────────────────────────────────────────────────
    city('Phoenix', 'AZ', 'US'),
    city('Tucson', 'AZ', 'US'),
    city('Las Vegas', 'NV', 'US'),
    city('Reno', 'NV', 'US'),
    city('Denver', 'CO', 'US'),
    city('Colorado Springs', 'CO', 'US'),
    city('Salt Lake City', 'UT', 'US'),
    city('Boise', 'ID', 'US'),
    city('Spokane', 'WA', 'US'),
    city('Seattle', 'WA', 'US'),
    city('Portland', 'OR', 'US'),

    // ── CANADA ───────────────────────────────────────────────────
    city('Toronto', 'ON', 'CA'),
    city('Mississauga', 'ON', 'CA'),
    city('Brampton', 'ON', 'CA'),
    city('Ottawa', 'ON', 'CA'),
    city('Hamilton', 'ON', 'CA'),
    city('London', 'ON', 'CA'),
    city('Windsor', 'ON', 'CA'),
    city('Calgary', 'AB', 'CA'),
    city('Edmonton', 'AB', 'CA'),
    city('Red Deer', 'AB', 'CA'),
    city('Vancouver', 'BC', 'CA'),
    city('Surrey', 'BC', 'CA'),
    city('Burnaby', 'BC', 'CA'),
    city('Kelowna', 'BC', 'CA'),
    city('Winnipeg', 'MB', 'CA'),
    city('Saskatoon', 'SK', 'CA'),
    city('Regina', 'SK', 'CA'),
    city('Montreal', 'QC', 'CA'),
    city('Quebec City', 'QC', 'CA'),
    city('Laval', 'QC', 'CA'),
];

// Lookup by slug
export const CITY_BY_SLUG = Object.fromEntries(PRIORITY_CITIES.map(c => [c.slug, c]));

// Get cities in same state (for "nearby cities" links)
export function getCitiesInState(state: string, exclude: string): CityEntry[] {
    return PRIORITY_CITIES.filter(c => c.state === state && c.city !== exclude).slice(0, 6);
}

// State-country mapping
export const STATE_NAMES_US: Record<string, string> = {
    AL: 'Alabama', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
    CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', ID: 'Idaho',
    IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky',
    LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
    MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska',
    NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
    NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
    PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
    TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
    WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

export const PROVINCE_NAMES_CA: Record<string, string> = {
    AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
    NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories',
    NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec',
    SK: 'Saskatchewan', YT: 'Yukon',
};
