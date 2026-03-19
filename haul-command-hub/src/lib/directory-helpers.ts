/** Country code → display name mapping (57 countries) */
export const COUNTRY_NAMES: Record<string, string> = {
    us: "United States", ca: "Canada", au: "Australia", gb: "United Kingdom", nz: "New Zealand",
    za: "South Africa", de: "Germany", nl: "Netherlands", ae: "United Arab Emirates", br: "Brazil",
    ie: "Ireland", se: "Sweden", no: "Norway", dk: "Denmark", fi: "Finland", be: "Belgium",
    at: "Austria", ch: "Switzerland", es: "Spain", fr: "France", it: "Italy", pt: "Portugal",
    sa: "Saudi Arabia", qa: "Qatar", mx: "Mexico", pl: "Poland", cz: "Czech Republic",
    sk: "Slovakia", hu: "Hungary", si: "Slovenia", ee: "Estonia", lv: "Latvia", lt: "Lithuania",
    hr: "Croatia", ro: "Romania", bg: "Bulgaria", gr: "Greece", tr: "Turkey", kw: "Kuwait",
    om: "Oman", bh: "Bahrain", sg: "Singapore", my: "Malaysia", jp: "Japan", kr: "South Korea",
    cl: "Chile", ar: "Argentina", co: "Colombia", pe: "Peru",
    in: "India", id: "Indonesia", th: "Thailand", vn: "Vietnam", ph: "Philippines",
    uy: "Uruguay", pa: "Panama", cr: "Costa Rica", ng: "Nigeria",
};

/** Surface category key → nice display label */
export const CATEGORY_LABELS: Record<string, { label: string; icon: string; description: string }> = {
    port: { label: "Ports & Marine Terminals", icon: "🚢", description: "Commercial ports handling heavy freight, project cargo, and breakbulk operations" },
    truck_stop: { label: "Truck Stops", icon: "⛽", description: "Full-service truck stops with diesel fuel, parking, and driver amenities" },
    truck_parking: { label: "Truck Parking", icon: "🅿️", description: "Designated heavy vehicle parking facilities and secure lots" },
    trucker_hotel: { label: "Trucker Hotels", icon: "🏨", description: "Hotels and accommodations catering to commercial truck drivers" },
    weigh_station: { label: "Weigh Stations", icon: "⚖️", description: "State and provincial weigh stations for commercial vehicle compliance" },
    rest_area: { label: "Rest Areas", icon: "🛑", description: "Highway rest areas and service plazas for commercial vehicles" },
    oil_gas_facility: { label: "Oil & Gas Facilities", icon: "🛢️", description: "Petroleum refineries, gas plants, and energy extraction sites" },
    industrial_zone: { label: "Industrial Zones", icon: "🏭", description: "Manufacturing clusters, heavy industry parks, and production facilities" },
    rail_intermodal: { label: "Rail Intermodal", icon: "🚂", description: "Rail yards, intermodal terminals, and transload facilities" },
    crane_service: { label: "Crane Services", icon: "🏗️", description: "Crane rental, rigging, and heavy lift service providers" },
    heavy_equipment_dealer: { label: "Heavy Equipment Dealers", icon: "🚜", description: "Sales, rental, and service of heavy construction and mining equipment" },
    fuel_station_diesel: { label: "Diesel Fuel Stations", icon: "⛽", description: "Commercial diesel fueling stations for heavy vehicles" },
    permit_office: { label: "Permit Offices", icon: "📋", description: "Transportation permit offices for oversize and overweight loads" },
    escort_staging: { label: "Escort Staging Areas", icon: "🚗", description: "Designated staging and meetup points for pilot car and escort vehicles" },
    twic_enrollment: { label: "TWIC Enrollment Centers", icon: "🪪", description: "Transportation Worker Identification Credential enrollment locations" },
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

/** All 57 countries for empty-page rendering */
export const ALL_COUNTRY_CODES = Object.keys(COUNTRY_NAMES);

