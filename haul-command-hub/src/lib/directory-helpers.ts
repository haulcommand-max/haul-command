/** Country code → display name mapping (120 countries — 5 tiers) */
export const COUNTRY_NAMES: Record<string, string> = {
    // Tier A — Gold (10)
    us: "United States", ca: "Canada", au: "Australia", gb: "United Kingdom", nz: "New Zealand",
    za: "South Africa", de: "Germany", nl: "Netherlands", ae: "United Arab Emirates", br: "Brazil",
    // Tier B — Blue (18)
    ie: "Ireland", se: "Sweden", no: "Norway", dk: "Denmark", fi: "Finland", be: "Belgium",
    at: "Austria", ch: "Switzerland", es: "Spain", fr: "France", it: "Italy", pt: "Portugal",
    sa: "Saudi Arabia", qa: "Qatar", mx: "Mexico", in: "India", id: "Indonesia", th: "Thailand",
    // Tier C — Silver (26)
    pl: "Poland", cz: "Czech Republic", sk: "Slovakia", hu: "Hungary", si: "Slovenia",
    ee: "Estonia", lv: "Latvia", lt: "Lithuania", hr: "Croatia", ro: "Romania",
    bg: "Bulgaria", gr: "Greece", tr: "Turkey", kw: "Kuwait", om: "Oman", bh: "Bahrain",
    sg: "Singapore", my: "Malaysia", jp: "Japan", kr: "South Korea",
    cl: "Chile", ar: "Argentina", co: "Colombia", pe: "Peru", vn: "Vietnam", ph: "Philippines",
    // Tier D — Slate (25)
    uy: "Uruguay", pa: "Panama", cr: "Costa Rica", il: "Israel", ng: "Nigeria",
    eg: "Egypt", ke: "Kenya", ma: "Morocco", rs: "Serbia", ua: "Ukraine",
    kz: "Kazakhstan", tw: "Taiwan", pk: "Pakistan", bd: "Bangladesh", mn: "Mongolia",
    tt: "Trinidad and Tobago", jo: "Jordan", gh: "Ghana", tz: "Tanzania", ge: "Georgia",
    az: "Azerbaijan", cy: "Cyprus", is: "Iceland", lu: "Luxembourg", ec: "Ecuador",
    // Tier E — Copper (41)
    bo: "Bolivia", py: "Paraguay", gt: "Guatemala", do: "Dominican Republic", hn: "Honduras",
    sv: "El Salvador", ni: "Nicaragua", jm: "Jamaica", gy: "Guyana", sr: "Suriname",
    ba: "Bosnia and Herzegovina", me: "Montenegro", mk: "North Macedonia", al: "Albania", md: "Moldova",
    iq: "Iraq", na: "Namibia", ao: "Angola", mz: "Mozambique", et: "Ethiopia",
    ci: "Ivory Coast", sn: "Senegal", bw: "Botswana", zm: "Zambia", ug: "Uganda",
    cm: "Cameroon", kh: "Cambodia", lk: "Sri Lanka", uz: "Uzbekistan", la: "Laos",
    np: "Nepal", dz: "Algeria", tn: "Tunisia", mt: "Malta", bn: "Brunei",
    rw: "Rwanda", mg: "Madagascar", pg: "Papua New Guinea", tm: "Turkmenistan", kg: "Kyrgyzstan",
    mw: "Malawi",
};

export const CATEGORY_LABELS: Record<string, { label: string; icon: string; description: string }> = {
    // US & Core Highway Operations
    pilot_car_operator: { label: "Pilot Car Operators", icon: "🚗", description: "Licensed pilot car and escort vehicle operators for oversize loads" },
    freight_broker: { label: "Freight Brokers", icon: "📋", description: "Freight brokers specializing in heavy haul and oversize transport" },
    steerman: { label: "Steermen", icon: "🕹️", description: "Certified tillermen and rear steer operators for superloads" },
    high_pole: { label: "High Pole Escorts", icon: "📐", description: "Height pole operators for routing bridges and physical obstacles" },
    route_survey: { label: "Route Surveyors", icon: "🗺️", description: "Engineering route survey services for oversize corridors" },
    heavy_towing: { label: "Heavy Towing & Rotators", icon: "🏗️", description: "Heavy-duty towing, recovery, and rotator operations" },
    dod_cleared_escort: { label: "DoD Cleared Transports", icon: "🇺🇸", description: "Department of Defense STRAC cleared hauling and escort" },
    twic_cleared_operator: { label: "TWIC Cleared Port Transports", icon: "🚢", description: "Transportation Worker Identification Credential port operators" },
    
    // Arctic & Nordic Operations
    winter_road_escort: { label: "Winter Road Escorts", icon: "❄️", description: "Specialized pilot cars equipped for extreme negative temperatures and ice roads" },
    ice_bridge_engineer: { label: "Ice Bridge Engineers", icon: "🧊", description: "Route surveyors calculating ice thickness for frozen lake crossings" },
    
    // Desert & Arid Operations
    desert_navigator: { label: "Desert Navigators", icon: "🏜️", description: "Escorts trained in off-grid sand navigation without paved markers" },
    sand_recovery_rotator: { label: "Sand Recovery Rotators", icon: "🪝", description: "Heavy towing units with tracks for dune and sand superload recovery" },
    extreme_heat_monitor: { label: "Extreme Heat Monitors", icon: "🌡️", description: "Specialists maintaining tire and axle temperature compliance on 60°C asphalt" },

    // Jungle & Monsoon Operations
    monsoon_route_surveyor: { label: "Monsoon Route Surveyors", icon: "🌧️", description: "Engineers calculating flood risk, mudslide potential, and bridge washouts" },
    off_road_winch_operator: { label: "Off-Road Winch Operators", icon: "🚜", description: "Specialists required to physically drag multi-axle trailers through unpaved zones" },
    barge_transfer_coordinator: { label: "Barge Transfer Coordinators", icon: "⛴️", description: "Archipelago specialists managing roll-on/roll-off superloads onto ferries" },

    // High Altitude Operations
    high_altitude_pilot: { label: "High Altitude Pilots", icon: "🏔️", description: "Escorts managing convoys through single-lane mountain passes above 10,000 feet" },
    mountain_brake_specialist: { label: "Mountain Brake Specialists", icon: "⚙️", description: "Mechanics riding with convoys to manage runaway risks on extreme downgrades" },

    // European & High-Regulation Operations
    bf3_bf4_certified_escort: { label: "BF3/BF4 Certified Escorts", icon: "🇩🇪", description: "Highly regulated, government-certified pilot vehicles (Germany/Austria)" },
    police_convoi_exceptionnel: { label: "Convoi Exceptionnel Coordination", icon: "🇫🇷", description: "Direct coordination roles with privatized or state Gendarmerie" },
    chapter_8_compliant: { label: "Chapter 8 Highway Management", icon: "🇬🇧", description: "Highway management specifically certified for UK Chapter 8 traffic control" },

    // Geopolitical / High-Risk Areas
    armed_convoy_escort: { label: "Armed Convoy Escorts", icon: "🛡️", description: "Private military contractors required for safe passage in conflict zones" },
    border_customs_expediter: { label: "Border Customs Expediters", icon: "🛂", description: "Fixers stationed at borders to ensure heavy machinery clears customs" },

    // Future Tech
    drone_survey: { label: "Drone Route Survey", icon: "🚁", description: "Unmanned aerial vehicle surveying for megaprojects" },
    
    // Infrastructure
    port: { label: "Ports & Marine Terminals", icon: "🚢", description: "Commercial ports handling heavy freight, project cargo, and breakbulk operations" },
    truck_stop: { label: "Truck Stops", icon: "⛽", description: "Full-service truck stops with diesel fuel, parking, and driver amenities" },
    truck_parking: { label: "Truck Parking", icon: "🅿️", description: "Designated heavy vehicle parking facilities and secure lots" },
    permit_services: { label: "Permit Services", icon: "📄", description: "Third-party permit services for oversize and overweight loads" },
};

export function countryName(code: string): string {
    return COUNTRY_NAMES[code.toLowerCase()] ?? code.toUpperCase();
}

export function categoryLabel(key: string): string {
    return CATEGORY_LABELS[key]?.label ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function categoryIcon(key: string): string {
    return CATEGORY_LABELS[key]?.icon ?? "📍";
}

export function categoryDescription(key: string): string {
    return CATEGORY_LABELS[key]?.description ?? "";
}

/** All 120 countries for page rendering */
export const ALL_COUNTRY_CODES = Object.keys(COUNTRY_NAMES);
