// ══════════════════════════════════════════════════════════════
// INDUSTRY KNOWLEDGE BASE — Authoritative Content Enrichment
// Source: ESC Safety Library + Industry Standards
// Purpose: Fill thin content gaps on directory pages with
//          real industry knowledge. NOT scraped — curated
//          and rewritten as original Haul Command content.
// Feeds: glossary pages, country hubs, "how it works" pages,
//        certification info, equipment guides, safety guides,
//        FAQ expansions, blog/resource section
// ══════════════════════════════════════════════════════════════

// ── PEVO Vocabulary — Official + Informal industry terms ──
// Source reference: ESC PEVO terms glossary
// These are INDUSTRY-STANDARD terms, not copyrighted content

export interface IndustryTerm {
    term: string;
    definition: string;
    category: "official" | "slang" | "equipment" | "regulation" | "safety" | "certification";
    /** Countries where this term is commonly used */
    regions: string[];
    /** Related search queries this term helps rank for */
    seoKeywords: string[];
}

export const INDUSTRY_TERMINOLOGY: IndustryTerm[] = [
    // ── Official PEVO / Escort Terms ──
    { term: "Pilot/Escort Vehicle (P/E Vehicle)", definition: "A motor vehicle used for the express purpose of acting as a warning and guide vehicle for oversize/overweight loads during transport.", category: "official", regions: ["US", "CA", "AU"], seoKeywords: ["pilot car", "escort vehicle", "pilot escort vehicle"] },
    { term: "PEVO", definition: "Pilot/Escort Vehicle Operator — a certified professional who operates a pilot car to guide oversize loads safely along their route.", category: "certification", regions: ["US"], seoKeywords: ["pevo certification", "pilot car operator", "escort vehicle operator"] },
    { term: "WITPAC", definition: "Wind Industry Transportation Professional Advanced Certification — an advanced PEVO certification specific to wind turbine component transport. Requires CDL or PEVO prerequisite. Valid for 3 years.", category: "certification", regions: ["US"], seoKeywords: ["witpac certification", "wind turbine transport", "wind energy pilot car"] },
    { term: "Oversize Load", definition: "Any vehicle or load that exceeds legal dimensions (height, width, length) and/or weight limits, requiring special permits and escort vehicles for safe transport.", category: "official", regions: ["US", "CA", "AU", "GB", "NZ"], seoKeywords: ["oversize load", "oversized load", "overweight load", "extra legal vehicle"] },
    { term: "Non-Divisible Load", definition: "Any load exceeding applicable limits that cannot be separated into smaller loads without compromising its intended use, destroying its value, or requiring more than 8 work hours to dismantle.", category: "official", regions: ["US", "CA"], seoKeywords: ["non-divisible load", "indivisible load"] },
    { term: "Superload", definition: "Any load requiring special analysis and approval by one or more state permit offices because of its extreme dimensions or weight. Typically requires a Traffic Control Plan.", category: "official", regions: ["US"], seoKeywords: ["superload", "super load permit", "extreme oversize"] },
    { term: "High Pole", definition: "A professional-grade, non-conductive, adjustable measuring device mounted on the front of the lead escort vehicle, used to measure the height of obstructions along the route. Must never be homemade.", category: "equipment", regions: ["US", "CA"], seoKeywords: ["high pole", "height pole", "clearance measurement", "pilot car high pole"] },
    { term: "Striker Tip", definition: "The tip of a high pole that contacts overhead obstructions to verify clearance. Must be professional-grade, no more than 24 inches long. Tennis balls or makeshift tips are not acceptable.", category: "equipment", regions: ["US", "CA"], seoKeywords: ["striker tip", "high pole tip"] },
    { term: "Bridge Strike", definition: "An incident where a vehicle or its load is too large to pass under a bridge, resulting in a collision. Average cost is approximately $300,000 in infrastructure damage. At least 3,000 occurred nationwide between 2008-2018.", category: "safety", regions: ["US", "CA", "GB", "AU", "DE", "NL"], seoKeywords: ["bridge strike", "bridge hit", "low bridge accident", "oversize load bridge"] },
    { term: "Route Survey", definition: "A detailed breakdown of the planned transport route, including images, maps, notes, and descriptions of all hazards, restrictions, and railroad crossings. Required before every oversize load move.", category: "official", regions: ["US", "CA", "AU", "GB"], seoKeywords: ["route survey", "route plan oversize load"] },
    { term: "Pre-Trip Meeting", definition: "A mandatory meeting held before every oversize load move where team members identify roles, inspect equipment, verify load measurements against the route survey, and review emergency protocols.", category: "safety", regions: ["US", "CA", "AU"], seoKeywords: ["pre-trip meeting", "pre-trip inspection", "oversize load meeting"] },
    { term: "Leapfrogging", definition: "A technique used on hilly or curvy terrain where the load must be stopped and traffic control measures put in place before proceeding through each section.", category: "official", regions: ["US", "CA"], seoKeywords: ["leapfrogging pilot car", "pilot car technique"] },
    { term: "Steerperson", definition: "An individual who steers any axle or group of axles on an articulated trailer, while not riding on the trailer itself.", category: "official", regions: ["US", "CA"], seoKeywords: ["steerperson", "steer person oversize load"] },
    { term: "Tillerman", definition: "An individual who is physically located on the trailer, steering the rear axles of a Commercial Motor Vehicle at highway speeds.", category: "official", regions: ["US"], seoKeywords: ["tillerman", "tillerman oversize load"] },
    { term: "Curfew", definition: "Specific times of day when an oversize load may not travel on particular roads. Varies by state and jurisdiction.", category: "regulation", regions: ["US", "CA", "AU", "GB"], seoKeywords: ["oversize load curfew", "travel time restrictions"] },
    { term: "Lowboy", definition: "A type of trailer with low clearance that can accommodate taller loads. The term may refer to either a drop deck or Removable Goose Neck (RGN) trailer.", category: "equipment", regions: ["US", "CA"], seoKeywords: ["lowboy trailer", "drop deck trailer", "rgn trailer"] },
    { term: "MUTCD", definition: "Manual on Uniform Traffic Control Devices — published by the Federal Highway Administration, this manual defines the national standards for traffic control devices including those used by pilot car operators.", category: "regulation", regions: ["US"], seoKeywords: ["mutcd", "traffic control devices", "fhwa standards"] },
    { term: "TWIC Card", definition: "Transportation Workers Identification Credential — required since 2009 for anyone entering a secured area of a maritime port.", category: "certification", regions: ["US"], seoKeywords: ["twic card", "maritime port credential"] },
    { term: "Traffic Control Plan (TCP)", definition: "A document depicting the route and specific procedures to be followed for safe movement, including lane restrictions and use of flaggers. Typically required for superloads.", category: "official", regions: ["US"], seoKeywords: ["traffic control plan", "tcp oversize load"] },
    { term: "Deflection", definition: "The amount the tip of the high pole bends while traveling at high speed. Must be accounted for when measuring clearances.", category: "equipment", regions: ["US", "CA"], seoKeywords: ["high pole deflection"] },

    // ── Industry Radio Lingo / Slang ──
    { term: "Alligators / Gators", definition: "Shredded pieces of blown tire lying in or near the travel lane where the load may hit them.", category: "slang", regions: ["US", "CA"], seoKeywords: ["pilot car lingo", "trucker slang"] },
    { term: "Center Up", definition: "The lead escort will instruct the driver where they need to position the load while crossing a bridge or covered structure to ensure safe clearance.", category: "slang", regions: ["US", "CA"], seoKeywords: ["pilot car radio lingo"] },
    { term: "Dress Up / Dress Down", definition: "Dress up: Raising the oversize load sign, securing banners, placing flags, and turning on warning lights. Dress down: The reverse — removing all oversize load indicators.", category: "slang", regions: ["US", "CA"], seoKeywords: ["pilot car terminology"] },
    { term: "Shoe Fly", definition: "Driving the wrong way on a turn lane to negotiate a corner that's too tight for a long load. Traffic in both directions must be completely blocked.", category: "slang", regions: ["US"], seoKeywords: ["shoe fly oversize load", "tight turn oversize"] },
    { term: "Skinny Bridge", definition: "A narrow bridge or overpass with less than a foot of shoulder off the fog line — requires extra caution for oversize loads.", category: "slang", regions: ["US"], seoKeywords: ["narrow bridge oversize load"] },
    { term: "Chicken Shack", definition: "Slang for a weigh station.", category: "slang", regions: ["US"], seoKeywords: ["trucker slang weigh station"] },
    { term: "Skids", definition: "Flexible piping with ropes running through them, placed over the top of a load. If the lead's height pole tags something low, the skids help the load glide underneath.", category: "equipment", regions: ["US"], seoKeywords: ["oversize load skids"] },
    { term: "Fog Line", definition: "A solid white line that divides the road from the shoulder.", category: "official", regions: ["US", "CA"], seoKeywords: ["fog line road marking"] },
    { term: "Gore Strip", definition: "The area dividing two merging lanes.", category: "official", regions: ["US", "CA"], seoKeywords: ["gore strip road marking"] },
    { term: "Pork Chop", definition: "A small island at an intersection, usually with a sign post in it.", category: "slang", regions: ["US"], seoKeywords: ["pork chop intersection"] },
];

// ── US State PEVO Certification Requirements ──

export interface StateCertRequirement {
    state: string;
    stateCode: string;
    requiresCert: boolean;
    /** Which other state certs this state accepts */
    acceptsCertsFrom: string[];
    /** Official DOT or regulatory website */
    officialUrl?: string;
    /** Authority that administers the certification program */
    certAuthority?: string;
    /** Official program name */
    certProgram?: string;
    /** Training provider (if different from authority) */
    trainingProvider?: string;
    notes?: string;
}

// Source: FHWA Publication FHWA-HOP-17-061, Chapter 11, Table 7
// "Best Practices in Permitting of Oversize and Overweight Vehicles"
export const US_STATE_CERT_REQUIREMENTS: StateCertRequirement[] = [
    { state: "Alabama", stateCode: "AL", requiresCert: true, acceptsCertsFrom: [], notes: "Has certification program but no listed reciprocity agreements." },
    { state: "Arizona", stateCode: "AZ", requiresCert: true, acceptsCertsFrom: ["CO", "FL", "NC", "UT", "VA", "WA"] },
    { state: "Colorado", stateCode: "CO", requiresCert: true, acceptsCertsFrom: ["AZ", "FL", "MN", "OK", "UT", "WA"], certAuthority: "CDOT", officialUrl: "https://www.codot.gov/business/permits/truckpermits/pilot-car-certification-information.html", notes: "Danny Wells (retired CDOT Permits Unit Manager) was a key advocate for national cert standards." },
    { state: "Florida", stateCode: "FL", requiresCert: true, acceptsCertsFrom: ["AZ", "CO", "GA", "MN", "NC", "OK", "PA", "VA", "WA", "WI"], certAuthority: "FDOT", certProgram: "Florida Pilot/Escort Flagging Training", trainingProvider: "University of Florida Transportation Institute (T2 Center)", officialUrl: "https://techtransfer.ce.ufl.edu/", notes: "FL has the BROADEST reciprocity — accepts 10 other states. Runs its own cert program through UF T2 Center. Includes flagging-specific training." },
    { state: "Georgia", stateCode: "GA", requiresCert: true, acceptsCertsFrom: ["AZ", "CO", "FL", "NC", "OK", "OR", "UT", "VA", "WA"], certAuthority: "GDOT", officialUrl: "http://www.dot.ga.gov/ps/permits/oversizepermits", notes: "GA accepts AZ, CO, UT but they do NOT reciprocate back. Two-way reciprocity only with NC, FL, OK, VA, and WA." },
    { state: "Kansas", stateCode: "KS", requiresCert: true, acceptsCertsFrom: [], notes: "Has certification requirement but reciprocity details not listed in FHWA data." },
    { state: "Minnesota", stateCode: "MN", requiresCert: true, acceptsCertsFrom: ["CO", "FL", "NC", "OK", "UT", "WA"], officialUrl: "http://www.dot.state.mn.us/cvo/permits/GeneralProvisions.pdf" },
    { state: "New York", stateCode: "NY", requiresCert: true, acceptsCertsFrom: [], certAuthority: "NY DMV", officialUrl: "https://dmv.ny.gov/more-info/escort-driver-certification", notes: "NY accepts NO other state certifications. Has its own standalone escort driver certification through the DMV." },
    { state: "North Carolina", stateCode: "NC", requiresCert: true, acceptsCertsFrom: ["CO", "FL", "GA", "MN", "NY", "OK", "UT", "VA", "WA"], certAuthority: "NCDOT", officialUrl: "https://connect.ncdot.gov/business/trucking/pages/overpermits.aspx", notes: "Two-way reciprocity with FL, GA, OK, WA. Also accepts (one-way) CO, MN, NY, UT, VA certs." },
    { state: "Oklahoma", stateCode: "OK", requiresCert: true, acceptsCertsFrom: ["CO", "FL", "GA", "MN", "NC", "UT", "WA"] },
    { state: "Pennsylvania", stateCode: "PA", requiresCert: true, acceptsCertsFrom: ["GA", "CO", "UT", "NC", "VA"], notes: "Accepts RSA Network (CO/UT) certifications." },
    { state: "Texas", stateCode: "TX", requiresCert: false, acceptsCertsFrom: [], notes: "NO official Texas pilot car certification exists. TxDOT has no state-administered PEVO program. Any card claiming to be a 'Texas certification' is FRAUDULENT." },
    { state: "Utah", stateCode: "UT", requiresCert: true, acceptsCertsFrom: ["AZ", "CO", "FL", "MN", "NC", "OK", "VA", "WA"], officialUrl: "https://www.udot.utah.gov/connect/" },
    { state: "Virginia", stateCode: "VA", requiresCert: true, acceptsCertsFrom: ["FL", "GA", "MN", "NC", "OK", "UT", "WA"], certAuthority: "VA DMV", officialUrl: "https://www.dmv.virginia.gov/drivers/#escrt/index.asp" },
    { state: "Washington", stateCode: "WA", requiresCert: true, acceptsCertsFrom: ["CO", "GA", "MN", "NC", "OK", "UT", "VA"], certAuthority: "Washington State Patrol", certProgram: "PEVO Certification (WAC 468-38-100)", trainingProvider: "Evergreen Safety Council (ESC) + Authorized Training Providers", officialUrl: "https://www.wsdot.wa.gov/commercial-vehicle/permits/pilot-car", notes: "Home state of the PEVO standard. ESC cert numbers: 'ES' (PEVO) or 'CT' (WITPAC). Online verification available. Enforcement at weigh stations by State Patrol." },
    { state: "Wisconsin", stateCode: "WI", requiresCert: true, acceptsCertsFrom: [], officialUrl: "https://wisconsindot.gov/Pages/dmv/com-drv-vehs/mtr-car-trkr/osow-requirements.aspx", notes: "Has certification program. FL accepts WI certs (one-way)." },
];

// ── Industry Bodies ──

export interface IndustryBody {
    name: string;
    acronym: string;
    role: string;
    url?: string;
    founded?: string;
}

export const INDUSTRY_BODIES: IndustryBody[] = [
    { name: "National Pilot Car Association", acronym: "NPCA", role: "Primary industry advocacy organization. Played significant role in FHWA Best Practices development.", url: "http://www.nationalpca.org" },
    { name: "North American Pilot Vehicle Safety Alliance", acronym: "NAPVSA", role: "Formed 2016 from FHWA Advisory Council. Multi-stakeholder alliance (pilots, carriers, insurance, law enforcement, government) focused on standardizing certification across all states.", founded: "2016" },
    { name: "Evergreen Safety Council", acronym: "ESC", role: "Primary PEVO/WITPAC certification provider. WA-based, nationally recognized.", url: "https://www.esc.org" },
    { name: "Federal Highway Administration", acronym: "FHWA", role: "Published 2017 Best Practices for P/EVO certification. Provides model certification framework.", url: "https://ops.fhwa.dot.gov" },
    { name: "Specialized Carriers & Rigging Association", acronym: "SC&RA", role: "Industry trade association for specialized transport and rigging.", url: "https://www.scranet.org" },
];

// ── PEVO Equipment Checklist ──

export interface EquipmentItem {
    name: string;
    category: "vehicle" | "ppe" | "signaling" | "communication" | "backup";
    required: boolean;
    description: string;
}

export const PEVO_EQUIPMENT_CHECKLIST: EquipmentItem[] = [
    // Vehicle equipment
    { name: "Roof-mounted Oversize Load sign", category: "vehicle", required: true, description: "Visible from front and back. Must be retractable or removable." },
    { name: "Amber strobe light", category: "vehicle", required: true, description: "At least one roof-mounted flashing/rotating amber light. Visible 360° for minimum 500 feet." },
    { name: "Professional high pole", category: "vehicle", required: true, description: "Non-conductive, adjustable, with extra tips. Never use homemade poles, broomsticks, or painter's poles." },
    { name: "High pole mount", category: "vehicle", required: true, description: "Sturdy mount welded to frame. Recommended to have mounts in various positions across the front." },
    { name: "Convex mirror or dashcam", category: "vehicle", required: false, description: "For viewing the high pole tip while driving. Dashcam also useful for liability documentation." },

    // PPE
    { name: "High-visibility vest/jacket", category: "ppe", required: true, description: "Fluorescent yellow-green, orange-red, or red. Must be ANSI Class 2 or 3 compliant with retroreflective banding." },
    { name: "High-visibility hard hat", category: "ppe", required: true, description: "White, yellow, yellow-green, orange, or red. Marked with retroreflective banding for night visibility." },
    { name: "ANSI Class E pants", category: "ppe", required: true, description: "High-visibility pants required for nighttime operations." },
    { name: "High-visibility gloves", category: "ppe", required: false, description: "Recommended for flagging situations." },
    { name: "Steel-toed boots", category: "ppe", required: true, description: "Protective footwear required for all PEVO operations." },

    // Signaling equipment
    { name: "Emergency reflective triangles", category: "signaling", required: true, description: "At least 3 bi-directional emergency reflective triangles." },
    { name: "Traffic cones", category: "signaling", required: true, description: "3 or more 28-inch orange cones with retroreflective collars." },
    { name: "STOP/SLOW paddle", category: "signaling", required: true, description: "18-inch retroreflective paddle. 24-inch recommended for night. 6-7 foot mounting staff recommended." },
    { name: "Red flag on staff", category: "signaling", required: true, description: "Weighted, 24-inch red flag mounted on a 36-inch staff." },
    { name: "Flashlight with red nose cone", category: "signaling", required: true, description: "With additional batteries and extra bulb." },

    // Communication
    { name: "40-channel CB radio", category: "communication", required: true, description: "Quality 4-watt radio installed in vehicle. Voice-activated or hands-free recommended." },
    { name: "Handheld two-way radio", category: "communication", required: true, description: "At least one, with extra batteries." },

    // Backup equipment
    { name: "Backup high pole", category: "backup", required: false, description: "At least one additional high pole for each mounted pole." },
    { name: "Extra striker tips", category: "backup", required: false, description: "At least 6 additional striker tips." },
    { name: "Extra mounting hardware", category: "backup", required: false, description: "Additional clamps, brackets, pins, and screws." },
];

// ── PEVO Insurance Types ──

export interface InsuranceType {
    name: string;
    description: string;
    critical: boolean;
}

export const PEVO_INSURANCE_TYPES: InsuranceType[] = [
    { name: "Commercial Automotive Insurance", description: "Protects against damages to your vehicle during escort operations.", critical: true },
    { name: "General Liability Insurance", description: "Covers third-party claims for bodily injury or property damage arising from your operations.", critical: true },
    { name: "Professional Errors & Omissions (E&O)", description: "Protects against injury or property damage claims beyond general liability coverage. Critical for bridge strike scenarios where a single incident can cost $200,000+.", critical: true },
];

// ── Content Enrichment Pages (fills thin content gaps) ──

export interface ContentPageTemplate {
    slug: string;
    title: string;
    category: "guide" | "glossary" | "certification" | "equipment" | "safety" | "career";
    targetKeywords: string[];
    description: string;
    /** Which existing pages this content enriches */
    enrichesPages: string[];
}

export const CONTENT_PAGE_TEMPLATES: ContentPageTemplate[] = [
    // Certification guides (huge SEO gap filler)
    {
        slug: "pilot-car-certification-guide",
        title: "Pilot Car Certification Guide: State Requirements & Reciprocity",
        category: "certification",
        targetKeywords: ["pilot car certification", "pevo certification", "pilot car license", "escort vehicle operator certification"],
        description: "Comprehensive guide to PEVO certification requirements across all US states, including reciprocity agreements and training resources.",
        enrichesPages: ["/us/guides", "/us/certification", "country hub pages"],
    },
    {
        slug: "witpac-certification-guide",
        title: "WITPAC Certification: Wind Industry Transport Professional Guide",
        category: "certification",
        targetKeywords: ["witpac certification", "wind turbine pilot car", "wind energy transport certification"],
        description: "Complete guide to WITPAC certification for wind industry transport professionals. Prerequisites, training, and career opportunities.",
        enrichesPages: ["/us/guides", "/us/wind-energy", "operator profiles"],
    },
    {
        slug: "pilot-car-equipment-checklist",
        title: "Complete Pilot Car Equipment Checklist (2024 Guide)",
        category: "equipment",
        targetKeywords: ["pilot car equipment", "pevo equipment list", "escort vehicle supplies", "high pole requirements"],
        description: "Full equipment checklist for pilot car operators including vehicle equipment, PPE, signaling, communication, and backup supplies.",
        enrichesPages: ["/us/equipment", "operator profiles", "country hub pages"],
    },
    {
        slug: "how-to-start-pilot-car-career",
        title: "How to Start a Pilot Car Career: 7 Steps from Experienced Operators",
        category: "career",
        targetKeywords: ["how to become pilot car driver", "pilot car career", "start escort vehicle business", "pevo career"],
        description: "Step-by-step career guide based on real operator experiences: working for someone first, getting certified, networking, finances, safety, and resilience.",
        enrichesPages: ["/us/careers", "/us/guides", "blog"],
    },
    {
        slug: "preventing-bridge-strikes",
        title: "5 Steps to Preventing Bridge Strikes with Oversize Loads",
        category: "safety",
        targetKeywords: ["prevent bridge strikes", "bridge hit oversize load", "low bridge clearance", "bridge strike prevention"],
        description: "How to prevent bridge strikes that cost an average of $300,000 per incident. Measurement, permitting, route surveys, staying on route, and driving safely.",
        enrichesPages: ["/us/safety", "risk layer pages", "corridor pages"],
    },
    {
        slug: "pilot-car-insurance-guide",
        title: "Pilot Car Insurance Guide: What Coverage You Actually Need",
        category: "guide",
        targetKeywords: ["pilot car insurance", "pevo insurance", "escort vehicle insurance", "e&o insurance pilot car"],
        description: "Why standard auto insurance isn't enough. The three essential policies every PEVO needs: commercial auto, general liability, and professional E&O.",
        enrichesPages: ["/us/insurance", "operator profiles"],
    },
    {
        slug: "oversize-load-railroad-crossings",
        title: "Railroad Safety for Oversize Loads: Route Survey & Emergency Guide",
        category: "safety",
        targetKeywords: ["oversize load railroad crossing", "railroad safety oversize", "train crossing oversize load"],
        description: "Route survey checklist for railroad crossings, maneuvering procedures, and emergency protocols when a load gets stuck on tracks.",
        enrichesPages: ["/us/safety", "corridor pages", "risk layer pages"],
    },
    {
        slug: "pre-trip-meeting-guide",
        title: "Oversize Load Pre-Trip Meeting: Essential Checklist",
        category: "safety",
        targetKeywords: ["pre-trip meeting oversize load", "pre-trip inspection checklist", "oversize load safety meeting"],
        description: "What every pre-trip meeting must cover: team identification, equipment inspection, load measurement verification, route survey review, and emergency protocols.",
        enrichesPages: ["/us/safety", "job flow pages"],
    },
    {
        slug: "high-pole-guide",
        title: "High Pole Basics: Setup, Measurement & Safety for PEVOs",
        category: "equipment",
        targetKeywords: ["high pole pilot car", "high pole basics", "clearance measurement oversize load", "high pole mount"],
        description: "Professional high pole setup, mounting, striker tips, deflection compensation, night illumination, and backup equipment requirements.",
        enrichesPages: ["/us/equipment", "operator profiles"],
    },
    {
        slug: "pilot-car-terminology-glossary",
        title: "Pilot Car Terminology: Official Terms & Industry Radio Lingo",
        category: "glossary",
        targetKeywords: ["pilot car terminology", "pevo terms", "trucker lingo", "escort vehicle glossary", "oversize load terms"],
        description: "Complete glossary of official PEVO terms plus informal radio lingo used by pilot car operators in the field.",
        enrichesPages: ["glossary pages", "country hub pages", "blog"],
    },
    {
        slug: "spot-fraudulent-pilot-car-certification",
        title: "How to Spot a Fraudulent Pilot Car Certification",
        category: "certification",
        targetKeywords: ["fake pilot car certification", "fraudulent pevo card", "verify pilot car certification"],
        description: "How to verify legitimate certifications, red flags for fake cards, and why certification data is now tracked online. Note: No official Texas pilot car certification exists.",
        enrichesPages: ["/us/certification", "trust/verification pages"],
    },
    {
        slug: "state-pilot-car-rules",
        title: "Pilot Car Rules by State: Complete US Regulatory Guide",
        category: "certification",
        targetKeywords: ["pilot car rules by state", "state escort vehicle requirements", "pevo requirements map"],
        description: "State-by-state breakdown of pilot car requirements, certification reciprocity, and links to official state regulations.",
        enrichesPages: ["US state pages", "country hub US"],
    },
];

// ── Helper: get content for thin page enrichment ──

export function getEnrichmentForPage(pageType: string): ContentPageTemplate[] {
    return CONTENT_PAGE_TEMPLATES.filter(t =>
        t.enrichesPages.some(p =>
            p.toLowerCase().includes(pageType.toLowerCase())
        )
    );
}

export function getTermsByCategory(cat: IndustryTerm["category"]): IndustryTerm[] {
    return INDUSTRY_TERMINOLOGY.filter(t => t.category === cat);
}

export function getTermsByRegion(iso2: string): IndustryTerm[] {
    return INDUSTRY_TERMINOLOGY.filter(t => t.regions.includes(iso2));
}

export function getEquipmentByCategory(cat: EquipmentItem["category"]): EquipmentItem[] {
    return PEVO_EQUIPMENT_CHECKLIST.filter(e => e.category === cat);
}

export function getStatesRequiringCert(): StateCertRequirement[] {
    return US_STATE_CERT_REQUIREMENTS.filter(s => s.requiresCert);
}

export function getStatesAcceptingCertFrom(stateCode: string): StateCertRequirement[] {
    return US_STATE_CERT_REQUIREMENTS.filter(s => s.acceptsCertsFrom.includes(stateCode));
}

export function getReciprocityCount(stateCode: string): number {
    return US_STATE_CERT_REQUIREMENTS.filter(s => s.acceptsCertsFrom.includes(stateCode)).length;
}

