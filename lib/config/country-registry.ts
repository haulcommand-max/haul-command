// ══════════════════════════════════════════════════════════════
// TIER-AWARE MASTER COUNTRY REGISTRY
// The single source of truth. Every module pulls from here.
// All 120 countries × tier rules × localization × payments ×
// comms × answer quotas × pricing
// ══════════════════════════════════════════════════════════════

export type Tier = "gold" | "blue" | "silver" | "slate" | "copper";

export interface TierConfig {
    tier: Tier;
    pricingMultiplier: number;
    answerQuota: number;
    corridorDepth: "required" | "partial" | "none";
    localPaymentsRequired: boolean;
    socialLocalization: "required" | "recommended" | "email_ok" | "email_only";
    freshnessHalfLifeDays: number;
    refreshScheduleDays: number;
    paymentSuccessFloor: number;
}

export const TIER_CONFIGS: Record<Tier, TierConfig> = {
    gold: {
        tier: "gold", pricingMultiplier: 1.00, answerQuota: 60,
        corridorDepth: "required", localPaymentsRequired: true,
        socialLocalization: "required", freshnessHalfLifeDays: 90,
        refreshScheduleDays: 60, paymentSuccessFloor: 0.92,
    },
    blue: {
        tier: "blue", pricingMultiplier: 0.85, answerQuota: 25,
        corridorDepth: "partial", localPaymentsRequired: false,
        socialLocalization: "recommended", freshnessHalfLifeDays: 150,
        refreshScheduleDays: 120, paymentSuccessFloor: 0.88,
    },
    silver: {
        tier: "silver", pricingMultiplier: 0.65, answerQuota: 10,
        corridorDepth: "none", localPaymentsRequired: false,
        socialLocalization: "email_ok", freshnessHalfLifeDays: 240,
        refreshScheduleDays: 180, paymentSuccessFloor: 0.82,
    },
    slate: {
        tier: "slate", pricingMultiplier: 0.55, answerQuota: 5,
        corridorDepth: "none", localPaymentsRequired: false,
        socialLocalization: "email_only", freshnessHalfLifeDays: 365,
        refreshScheduleDays: 365, paymentSuccessFloor: 0.75,
    },
    copper: {
        tier: "copper", pricingMultiplier: 0.45, answerQuota: 3,
        corridorDepth: "none", localPaymentsRequired: false,
        socialLocalization: "email_only", freshnessHalfLifeDays: 365,
        refreshScheduleDays: 365, paymentSuccessFloor: 0.70,
    },
};

export type SocialChannel = "facebook" | "linkedin" | "whatsapp" | "xing" | "instagram" | "email" | "sms";
export type PaymentRail = "cards" | "ach" | "sepa" | "pix" | "boleto" | "mada" | "bank_transfer" | "apple_pay" | "google_pay";
export type Tone = "operator_practical" | "professional_balanced" | "professional_b2b" | "compliance_first" | "formal_authority" | "speed_availability" | "availability_speed";

export interface CountryConfig {
    code: string;
    name: string;
    tier: Tier;
    languagePrimary: string;
    languageSecondary?: string;
    languageTertiary?: string;
    currency: string;
    socialPrimary: SocialChannel;
    socialSecondary: SocialChannel;
    paymentPriority: PaymentRail[];
    tone: Tone;
    /** Top metros/cities for corridor depth */
    topMetros: string[];
    /** Top corridors */
    topCorridors: string[];
    /** hreflang code (may differ from language) */
    hreflangCode: string;
    /** Multi-language risk flag */
    multiLanguageRisk: boolean;
    /** Activation status: scaffold | ready | active */
    activationStatus?: 'scaffold' | 'ready' | 'active';
    /** Compliance readiness slots */
    complianceSlots?: {
        escortLicenseRequired?: boolean;
        permitSystemMapped?: boolean;
        heightWeightRestrictionsMapped?: boolean;
        insuranceRequirementsMapped?: boolean;
        localLanguageRequired?: boolean;
    };
}

// ══════════════════════════════════════════════════════════════
// ALL 120 countries — COMPLETE REGISTRY
// ══════════════════════════════════════════════════════════════

export const COUNTRY_REGISTRY: CountryConfig[] = [
    // ═══ GOLD ═══
    { code: "US", name: "United States", tier: "gold", languagePrimary: "en", currency: "USD", socialPrimary: "facebook", socialSecondary: "email", paymentPriority: ["cards", "ach"], tone: "operator_practical", topMetros: ["Houston", "Dallas", "Los Angeles", "Chicago", "Atlanta", "Phoenix", "Denver", "Seattle", "Miami", "Nashville"], topCorridors: ["Houston→Permian Basin", "LA→Phoenix", "Chicago→Detroit", "Dallas→Oklahoma City", "Atlanta→Jacksonville"], hreflangCode: "en-us", multiLanguageRisk: false },
    { code: "CA", name: "Canada", tier: "gold", languagePrimary: "en", languageSecondary: "fr", currency: "CAD", socialPrimary: "facebook", socialSecondary: "linkedin", paymentPriority: ["cards"], tone: "professional_balanced", topMetros: ["Toronto", "Vancouver", "Calgary", "Edmonton", "Montreal", "Halifax"], topCorridors: ["Edmonton→Fort McMurray", "Calgary→Vancouver", "Toronto→Montreal", "Winnipeg→Thunder Bay"], hreflangCode: "en-ca", multiLanguageRisk: true },
    { code: "AU", name: "Australia", tier: "gold", languagePrimary: "en", currency: "AUD", socialPrimary: "facebook", socialSecondary: "linkedin", paymentPriority: ["cards"], tone: "operator_practical", topMetros: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Darwin"], topCorridors: ["Perth→Pilbara", "Brisbane→Gladstone", "Sydney→Melbourne", "Adelaide→Darwin"], hreflangCode: "en-au", multiLanguageRisk: false },
    { code: "GB", name: "United Kingdom", tier: "gold", languagePrimary: "en", currency: "GBP", socialPrimary: "linkedin", socialSecondary: "facebook", paymentPriority: ["cards", "bank_transfer"], tone: "professional_b2b", topMetros: ["London", "Manchester", "Birmingham", "Glasgow", "Edinburgh", "Bristol"], topCorridors: ["Southampton→Midlands", "Felixstowe→London", "Aberdeen→Central Belt", "M1 corridor"], hreflangCode: "en-gb", multiLanguageRisk: false },
    { code: "NZ", name: "New Zealand", tier: "gold", languagePrimary: "en", currency: "NZD", socialPrimary: "facebook", socialSecondary: "email", paymentPriority: ["cards"], tone: "operator_practical", topMetros: ["Auckland", "Wellington", "Christchurch", "Hamilton"], topCorridors: ["Auckland→Waikato", "Christchurch→West Coast"], hreflangCode: "en-nz", multiLanguageRisk: false },
    { code: "ZA", name: "South Africa", tier: "gold", languagePrimary: "en", currency: "ZAR", socialPrimary: "whatsapp", socialSecondary: "facebook", paymentPriority: ["cards"], tone: "availability_speed", topMetros: ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth"], topCorridors: ["Johannesburg→Durban", "Cape Town→PE", "Johannesburg→Mpumalanga"], hreflangCode: "en-za", multiLanguageRisk: false },
    { code: "DE", name: "Germany", tier: "gold", languagePrimary: "de", currency: "EUR", socialPrimary: "linkedin", socialSecondary: "xing", paymentPriority: ["sepa", "cards"], tone: "compliance_first", topMetros: ["Hamburg", "Berlin", "Munich", "Frankfurt", "Stuttgart", "Cologne", "Düsseldorf", "Bremen"], topCorridors: ["Hamburg→Schleswig-Holstein", "Bremen→Niedersachsen", "Ruhr→Rotterdam", "Stuttgart→Munich"], hreflangCode: "de-de", multiLanguageRisk: false },
    { code: "NL", name: "Netherlands", tier: "gold", languagePrimary: "nl", languageSecondary: "en", currency: "EUR", socialPrimary: "linkedin", socialSecondary: "email", paymentPriority: ["sepa", "cards"], tone: "professional_b2b", topMetros: ["Rotterdam", "Amsterdam", "The Hague", "Utrecht", "Eindhoven"], topCorridors: ["Rotterdam→Ruhr", "Amsterdam→Antwerp", "Rotterdam→inland"], hreflangCode: "nl-nl", multiLanguageRisk: false },
    { code: "AE", name: "United Arab Emirates", tier: "gold", languagePrimary: "en", languageSecondary: "ar", currency: "AED", socialPrimary: "whatsapp", socialSecondary: "email", paymentPriority: ["cards"], tone: "formal_authority", topMetros: ["Dubai", "Abu Dhabi", "Sharjah", "Jebel Ali", "Fujairah"], topCorridors: ["Jebel Ali→Abu Dhabi", "Dubai→Sharjah industrial"], hreflangCode: "en-ae", multiLanguageRisk: true },
    { code: "BR", name: "Brazil", tier: "gold", languagePrimary: "pt", currency: "BRL", socialPrimary: "whatsapp", socialSecondary: "instagram", paymentPriority: ["pix", "boleto", "cards"], tone: "speed_availability", topMetros: ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Salvador", "Curitiba", "Porto Alegre", "Recife", "Manaus"], topCorridors: ["Santos→São Paulo", "Rio→BH", "São Paulo→Curitiba", "Salvador→Recife"], hreflangCode: "pt-br", multiLanguageRisk: false },

    // ═══ BLUE ═══
    { code: "IE", name: "Ireland", tier: "blue", languagePrimary: "en", currency: "EUR", socialPrimary: "linkedin", socialSecondary: "email", paymentPriority: ["sepa", "cards"], tone: "professional_b2b", topMetros: ["Dublin", "Cork", "Galway", "Limerick"], topCorridors: ["Dublin→Cork", "Shannon→Dublin"], hreflangCode: "en-ie", multiLanguageRisk: false },
    { code: "SE", name: "Sweden", tier: "blue", languagePrimary: "sv", currency: "SEK", socialPrimary: "linkedin", socialSecondary: "email", paymentPriority: ["cards", "sepa"], tone: "professional_b2b", topMetros: ["Stockholm", "Gothenburg", "Malmö"], topCorridors: ["Gothenburg→Stockholm", "Malmö→Copenhagen"], hreflangCode: "sv-se", multiLanguageRisk: false },
    { code: "NO", name: "Norway", tier: "blue", languagePrimary: "no", currency: "NOK", socialPrimary: "linkedin", socialSecondary: "email", paymentPriority: ["cards"], tone: "professional_b2b", topMetros: ["Oslo", "Bergen", "Stavanger", "Trondheim"], topCorridors: ["Oslo→Bergen", "Stavanger oil corridor"], hreflangCode: "no", multiLanguageRisk: false },
    { code: "DK", name: "Denmark", tier: "blue", languagePrimary: "da", currency: "DKK", socialPrimary: "linkedin", socialSecondary: "email", paymentPriority: ["cards"], tone: "professional_b2b", topMetros: ["Copenhagen", "Aarhus", "Odense"], topCorridors: ["Copenhagen→Jutland"], hreflangCode: "da-dk", multiLanguageRisk: false },
    { code: "FI", name: "Finland", tier: "blue", languagePrimary: "fi", currency: "EUR", socialPrimary: "linkedin", socialSecondary: "email", paymentPriority: ["sepa", "cards"], tone: "professional_b2b", topMetros: ["Helsinki", "Tampere", "Turku"], topCorridors: ["Helsinki→Tampere", "Port of Helsinki inland"], hreflangCode: "fi-fi", multiLanguageRisk: false },
    { code: "BE", name: "Belgium", tier: "blue", languagePrimary: "nl", languageSecondary: "fr", currency: "EUR", socialPrimary: "linkedin", socialSecondary: "email", paymentPriority: ["sepa", "cards"], tone: "professional_b2b", topMetros: ["Brussels", "Antwerp", "Ghent", "Liège"], topCorridors: ["Antwerp→Brussels", "Antwerp→Rotterdam"], hreflangCode: "nl-be", multiLanguageRisk: true },
    { code: "AT", name: "Austria", tier: "blue", languagePrimary: "de", currency: "EUR", socialPrimary: "linkedin", socialSecondary: "xing", paymentPriority: ["sepa", "cards"], tone: "compliance_first", topMetros: ["Vienna", "Graz", "Linz", "Salzburg"], topCorridors: ["Vienna→Linz", "Brenner corridor"], hreflangCode: "de-at", multiLanguageRisk: false },
    { code: "CH", name: "Switzerland", tier: "blue", languagePrimary: "de", languageSecondary: "fr", languageTertiary: "it", currency: "CHF", socialPrimary: "linkedin", socialSecondary: "xing", paymentPriority: ["cards", "sepa"], tone: "compliance_first", topMetros: ["Zurich", "Geneva", "Basel", "Bern"], topCorridors: ["Basel→Zurich", "Gotthard corridor"], hreflangCode: "de-ch", multiLanguageRisk: true },
    { code: "ES", name: "Spain", tier: "blue", languagePrimary: "es", currency: "EUR", socialPrimary: "linkedin", socialSecondary: "whatsapp", paymentPriority: ["sepa", "cards"], tone: "professional_b2b", topMetros: ["Madrid", "Barcelona", "Valencia", "Bilbao", "Seville"], topCorridors: ["Barcelona→Madrid", "Bilbao→Mediterranean"], hreflangCode: "es-es", multiLanguageRisk: false },
    { code: "FR", name: "France", tier: "blue", languagePrimary: "fr", currency: "EUR", socialPrimary: "linkedin", socialSecondary: "email", paymentPriority: ["sepa", "cards"], tone: "professional_b2b", topMetros: ["Paris", "Marseille", "Lyon", "Toulouse", "Le Havre"], topCorridors: ["Le Havre→Paris", "Marseille→Lyon", "Calais→Paris"], hreflangCode: "fr-fr", multiLanguageRisk: false },
    { code: "IT", name: "Italy", tier: "blue", languagePrimary: "it", currency: "EUR", socialPrimary: "linkedin", socialSecondary: "whatsapp", paymentPriority: ["sepa", "cards"], tone: "professional_b2b", topMetros: ["Milan", "Rome", "Genoa", "Naples", "Turin"], topCorridors: ["Genoa→Milan", "Milan→Brenner", "Naples→Rome"], hreflangCode: "it-it", multiLanguageRisk: false },
    { code: "PT", name: "Portugal", tier: "blue", languagePrimary: "pt", currency: "EUR", socialPrimary: "linkedin", socialSecondary: "whatsapp", paymentPriority: ["sepa", "cards"], tone: "professional_b2b", topMetros: ["Lisbon", "Porto", "Sines"], topCorridors: ["Sines→Lisbon", "Porto→Spain border"], hreflangCode: "pt-pt", multiLanguageRisk: false },
    { code: "SA", name: "Saudi Arabia", tier: "blue", languagePrimary: "ar", languageSecondary: "en", currency: "SAR", socialPrimary: "whatsapp", socialSecondary: "email", paymentPriority: ["mada", "cards"], tone: "formal_authority", topMetros: ["Riyadh", "Jeddah", "Dammam", "Jubail"], topCorridors: ["Dammam→Riyadh", "Jubail industrial"], hreflangCode: "ar-sa", multiLanguageRisk: true },
    { code: "QA", name: "Qatar", tier: "blue", languagePrimary: "ar", languageSecondary: "en", currency: "QAR", socialPrimary: "whatsapp", socialSecondary: "email", paymentPriority: ["cards"], tone: "formal_authority", topMetros: ["Doha", "Lusail"], topCorridors: ["Doha industrial zone"], hreflangCode: "ar-qa", multiLanguageRisk: true },
    { code: "MX", name: "Mexico", tier: "blue", languagePrimary: "es", currency: "MXN", socialPrimary: "whatsapp", socialSecondary: "facebook", paymentPriority: ["cards"], tone: "speed_availability", topMetros: ["Mexico City", "Monterrey", "Guadalajara", "Tijuana", "Veracruz"], topCorridors: ["Monterrey→Laredo", "Mexico City→Veracruz", "Tijuana→Ensenada"], hreflangCode: "es-mx", multiLanguageRisk: false },
    { code: "IN", name: "India", tier: "blue", languagePrimary: "hi", languageSecondary: "en", currency: "INR", socialPrimary: "whatsapp", socialSecondary: "linkedin", paymentPriority: ["cards"], tone: "speed_availability", topMetros: ["Mumbai", "Delhi", "Chennai", "Kolkata", "Ahmedabad", "Pune"], topCorridors: ["Mumbai→Pune", "Delhi→Jaipur", "Chennai→Bangalore"], hreflangCode: "hi-in", multiLanguageRisk: true },
    { code: "ID", name: "Indonesia", tier: "blue", languagePrimary: "id", currency: "IDR", socialPrimary: "whatsapp", socialSecondary: "facebook", paymentPriority: ["cards", "bank_transfer"], tone: "speed_availability", topMetros: ["Jakarta", "Surabaya", "Balikpapan", "Makassar"], topCorridors: ["Jakarta→Surabaya", "Balikpapan industrial"], hreflangCode: "id-id", multiLanguageRisk: false },
    { code: "TH", name: "Thailand", tier: "blue", languagePrimary: "th", languageSecondary: "en", currency: "THB", socialPrimary: "facebook", socialSecondary: "whatsapp", paymentPriority: ["cards", "bank_transfer"], tone: "professional_balanced", topMetros: ["Bangkok", "Laem Chabang", "Rayong"], topCorridors: ["Laem Chabang→Bangkok", "Eastern Seaboard industrial"], hreflangCode: "th-th", multiLanguageRisk: false },

    // ═══ SILVER (26 countries) ═══
    ...([
        { c: "PL", n: "Poland", l: "pl", cr: "PLN", m: ["Warsaw", "Gdańsk", "Katowice"] },
        { c: "CZ", n: "Czech Republic", l: "cs", cr: "CZK", m: ["Prague", "Brno", "Ostrava"] },
        { c: "SK", n: "Slovakia", l: "sk", cr: "EUR", m: ["Bratislava", "Košice"] },
        { c: "HU", n: "Hungary", l: "hu", cr: "HUF", m: ["Budapest", "Debrecen"] },
        { c: "SI", n: "Slovenia", l: "sl", cr: "EUR", m: ["Ljubljana", "Koper"] },
        { c: "EE", n: "Estonia", l: "et", cr: "EUR", m: ["Tallinn"] },
        { c: "LV", n: "Latvia", l: "lv", cr: "EUR", m: ["Riga"] },
        { c: "LT", n: "Lithuania", l: "lt", cr: "EUR", m: ["Vilnius", "Klaipėda"] },
        { c: "HR", n: "Croatia", l: "hr", cr: "EUR", m: ["Zagreb", "Rijeka", "Split"] },
        { c: "RO", n: "Romania", l: "ro", cr: "RON", m: ["Bucharest", "Constanța", "Cluj-Napoca"] },
        { c: "BG", n: "Bulgaria", l: "bg", cr: "BGN", m: ["Sofia", "Varna", "Burgas"] },
        { c: "GR", n: "Greece", l: "el", cr: "EUR", m: ["Athens", "Thessaloniki", "Piraeus"] },
        { c: "TR", n: "Turkey", l: "tr", cr: "TRY", m: ["Istanbul", "Ankara", "Izmir", "Mersin"] },
        { c: "KW", n: "Kuwait", l: "ar", cr: "KWD", m: ["Kuwait City"] },
        { c: "OM", n: "Oman", l: "ar", cr: "OMR", m: ["Muscat", "Sohar"] },
        { c: "BH", n: "Bahrain", l: "ar", cr: "BHD", m: ["Manama"] },
        { c: "SG", n: "Singapore", l: "en", cr: "SGD", m: ["Singapore"] },
        { c: "MY", n: "Malaysia", l: "ms", cr: "MYR", m: ["Kuala Lumpur", "Penang", "Johor Bahru"] },
        { c: "JP", n: "Japan", l: "ja", cr: "JPY", m: ["Tokyo", "Osaka", "Nagoya", "Yokohama"] },
        { c: "KR", n: "South Korea", l: "ko", cr: "KRW", m: ["Seoul", "Busan", "Incheon"] },
        { c: "CL", n: "Chile", l: "es", cr: "CLP", m: ["Santiago", "Valparaíso", "Antofagasta"] },
        { c: "AR", n: "Argentina", l: "es", cr: "ARS", m: ["Buenos Aires", "Rosario", "Córdoba"] },
        { c: "CO", n: "Colombia", l: "es", cr: "COP", m: ["Bogotá", "Medellín", "Cartagena", "Barranquilla"] },
        { c: "PE", n: "Peru", l: "es", cr: "PEN", m: ["Lima", "Callao", "Arequipa"] },
        { c: "VN", n: "Vietnam", l: "vi", cr: "VND", m: ["Ho Chi Minh City", "Hanoi", "Da Nang"] },
        { c: "PH", n: "Philippines", l: "en", cr: "PHP", m: ["Manila", "Cebu", "Davao"] },
    ] as const).map(s => ({
        code: s.c, name: s.n, tier: "silver" as Tier,
        languagePrimary: s.l, currency: s.cr,
        socialPrimary: "linkedin" as SocialChannel, socialSecondary: "email" as SocialChannel,
        paymentPriority: ["cards" as PaymentRail],
        tone: "professional_b2b" as Tone,
        topMetros: [...s.m], topCorridors: [],
        hreflangCode: `${s.l}-${s.c.toLowerCase()}`,
        multiLanguageRisk: false,
    })),

    // ═══ SLATE (25 countries) ═══
    ...([
        { c: "UY", n: "Uruguay",        l: "es", cr: "UYU", m: ["Montevideo"] },
        { c: "PA", n: "Panama",         l: "es", cr: "PAB", m: ["Panama City", "Colón"] },
        { c: "CR", n: "Costa Rica",     l: "es", cr: "CRC", m: ["San José"] },
        { c: "IL", n: "Israel",         l: "he", cr: "ILS", m: ["Tel Aviv", "Haifa", "Ashdod"] },
        { c: "NG", n: "Nigeria",        l: "en", cr: "NGN", m: ["Lagos", "Port Harcourt", "Abuja"] },
        { c: "EG", n: "Egypt",          l: "ar", cr: "EGP", m: ["Cairo", "Alexandria", "Suez"] },
        { c: "KE", n: "Kenya",          l: "en", cr: "KES", m: ["Nairobi", "Mombasa"] },
        { c: "MA", n: "Morocco",        l: "ar", cr: "MAD", m: ["Casablanca", "Tangier", "Agadir"] },
        { c: "RS", n: "Serbia",         l: "sr", cr: "RSD", m: ["Belgrade", "Novi Sad"] },
        { c: "UA", n: "Ukraine",        l: "uk", cr: "UAH", m: ["Kyiv", "Odessa", "Dnipro"] },
        { c: "KZ", n: "Kazakhstan",     l: "kk", cr: "KZT", m: ["Almaty", "Astana", "Aktau"] },
        { c: "TW", n: "Taiwan",         l: "zh", cr: "TWD", m: ["Taipei", "Kaohsiung", "Taichung"] },
        { c: "PK", n: "Pakistan",       l: "ur", cr: "PKR", m: ["Karachi", "Lahore", "Islamabad"] },
        { c: "BD", n: "Bangladesh",     l: "bn", cr: "BDT", m: ["Dhaka", "Chittagong"] },
        { c: "MN", n: "Mongolia",       l: "mn", cr: "MNT", m: ["Ulaanbaatar"] },
        { c: "TT", n: "Trinidad & Tobago", l: "en", cr: "TTD", m: ["Port of Spain"] },
        { c: "JO", n: "Jordan",         l: "ar", cr: "JOD", m: ["Amman", "Aqaba"] },
        { c: "GH", n: "Ghana",          l: "en", cr: "GHS", m: ["Accra", "Tema", "Kumasi"] },
        { c: "TZ", n: "Tanzania",       l: "sw", cr: "TZS", m: ["Dar es Salaam", "Dodoma"] },
        { c: "GE", n: "Georgia",        l: "ka", cr: "GEL", m: ["Tbilisi", "Batumi"] },
        { c: "AZ", n: "Azerbaijan",     l: "az", cr: "AZN", m: ["Baku"] },
        { c: "CY", n: "Cyprus",         l: "el", cr: "EUR", m: ["Limassol", "Nicosia"] },
        { c: "IS", n: "Iceland",        l: "is", cr: "ISK", m: ["Reykjavik"] },
        { c: "LU", n: "Luxembourg",     l: "lb", cr: "EUR", m: ["Luxembourg City"] },
        { c: "EC", n: "Ecuador",        l: "es", cr: "USD", m: ["Guayaquil", "Quito"] },
    ] as const).map(s => ({
        code: s.c, name: s.n, tier: "slate" as Tier,
        languagePrimary: s.l, currency: s.cr,
        socialPrimary: "email" as SocialChannel, socialSecondary: "email" as SocialChannel,
        paymentPriority: ["cards" as PaymentRail],
        tone: "professional_b2b" as Tone,
        topMetros: [...s.m], topCorridors: [],
        hreflangCode: `${s.l}-${s.c.toLowerCase()}`,
        multiLanguageRisk: false,
    })),

    // ═══ COPPER (41 countries) ═══
    ...([
        { c: "BO", n: "Bolivia",               l: "es", cr: "BOB", m: ["La Paz", "Santa Cruz"] },
        { c: "PY", n: "Paraguay",              l: "es", cr: "PYG", m: ["Asunción"] },
        { c: "GT", n: "Guatemala",             l: "es", cr: "GTQ", m: ["Guatemala City"] },
        { c: "DO", n: "Dominican Republic",    l: "es", cr: "DOP", m: ["Santo Domingo", "Santiago"] },
        { c: "HN", n: "Honduras",              l: "es", cr: "HNL", m: ["Tegucigalpa", "San Pedro Sula"] },
        { c: "SV", n: "El Salvador",           l: "es", cr: "USD", m: ["San Salvador"] },
        { c: "NI", n: "Nicaragua",             l: "es", cr: "NIO", m: ["Managua"] },
        { c: "JM", n: "Jamaica",               l: "en", cr: "JMD", m: ["Kingston", "Montego Bay"] },
        { c: "GY", n: "Guyana",                l: "en", cr: "GYD", m: ["Georgetown"] },
        { c: "SR", n: "Suriname",              l: "nl", cr: "SRD", m: ["Paramaribo"] },
        { c: "BA", n: "Bosnia & Herzegovina",  l: "bs", cr: "BAM", m: ["Sarajevo", "Banja Luka"] },
        { c: "ME", n: "Montenegro",            l: "cnr", cr: "EUR", m: ["Podgorica", "Bar"] },
        { c: "MK", n: "North Macedonia",       l: "mk", cr: "MKD", m: ["Skopje"] },
        { c: "AL", n: "Albania",               l: "sq", cr: "ALL", m: ["Tirana", "Durrës"] },
        { c: "MD", n: "Moldova",               l: "ro", cr: "MDL", m: ["Chișinău"] },
        { c: "IQ", n: "Iraq",                  l: "ar", cr: "IQD", m: ["Baghdad", "Basra", "Erbil"] },
        { c: "NA", n: "Namibia",               l: "en", cr: "NAD", m: ["Windhoek", "Walvis Bay"] },
        { c: "AO", n: "Angola",                l: "pt", cr: "AOA", m: ["Luanda", "Lobito"] },
        { c: "MZ", n: "Mozambique",            l: "pt", cr: "MZN", m: ["Maputo", "Beira"] },
        { c: "ET", n: "Ethiopia",              l: "am", cr: "ETB", m: ["Addis Ababa", "Djibouti corridor"] },
        { c: "CI", n: "Côte d'Ivoire",         l: "fr", cr: "XOF", m: ["Abidjan"] },
        { c: "SN", n: "Senegal",               l: "fr", cr: "XOF", m: ["Dakar"] },
        { c: "BW", n: "Botswana",              l: "en", cr: "BWP", m: ["Gaborone", "Francistown"] },
        { c: "ZM", n: "Zambia",                l: "en", cr: "ZMW", m: ["Lusaka", "Kitwe"] },
        { c: "UG", n: "Uganda",                l: "en", cr: "UGX", m: ["Kampala", "Entebbe"] },
        { c: "CM", n: "Cameroon",              l: "fr", cr: "XAF", m: ["Douala", "Yaoundé"] },
        { c: "KH", n: "Cambodia",              l: "km", cr: "KHR", m: ["Phnom Penh", "Sihanoukville"] },
        { c: "LK", n: "Sri Lanka",             l: "si", cr: "LKR", m: ["Colombo", "Galle"] },
        { c: "UZ", n: "Uzbekistan",            l: "uz", cr: "UZS", m: ["Tashkent", "Navoi"] },
        { c: "LA", n: "Laos",                  l: "lo", cr: "LAK", m: ["Vientiane"] },
        { c: "NP", n: "Nepal",                 l: "ne", cr: "NPR", m: ["Kathmandu"] },
        { c: "DZ", n: "Algeria",               l: "ar", cr: "DZD", m: ["Algiers", "Oran", "Annaba"] },
        { c: "TN", n: "Tunisia",               l: "ar", cr: "TND", m: ["Tunis", "Sfax", "Bizerte"] },
        { c: "MT", n: "Malta",                 l: "mt", cr: "EUR", m: ["Valletta", "Marsaxlokk"] },
        { c: "BN", n: "Brunei",                l: "ms", cr: "BND", m: ["Bandar Seri Begawan"] },
        { c: "RW", n: "Rwanda",                l: "rw", cr: "RWF", m: ["Kigali"] },
        { c: "MG", n: "Madagascar",            l: "mg", cr: "MGA", m: ["Antananarivo", "Toamasina"] },
        { c: "PG", n: "Papua New Guinea",      l: "en", cr: "PGK", m: ["Port Moresby", "Lae"] },
        { c: "TM", n: "Turkmenistan",          l: "tk", cr: "TMT", m: ["Ashgabat", "Turkmenbashi"] },
        { c: "KG", n: "Kyrgyzstan",            l: "ky", cr: "KGS", m: ["Bishkek"] },
        { c: "MW", n: "Malawi",                l: "ny", cr: "MWK", m: ["Lilongwe", "Blantyre"] },
    ] as const).map(s => ({
        code: s.c, name: s.n, tier: "copper" as Tier,
        languagePrimary: s.l, currency: s.cr,
        socialPrimary: "email" as SocialChannel, socialSecondary: "email" as SocialChannel,
        paymentPriority: ["cards" as PaymentRail],
        tone: "professional_b2b" as Tone,
        topMetros: [...s.m], topCorridors: [],
        hreflangCode: `${s.l}-${s.c.toLowerCase()}`,
        multiLanguageRisk: false,
    })),
];

// ── Lookup Functions ──

export function getCountry(code: string): CountryConfig | undefined {
    return COUNTRY_REGISTRY.find(c => c.code === code);
}

/** Alias for getCountry — used by gemini-ad-factory */
export const lookupCountry = getCountry;

export function getCountryTier(code: string): Tier {
    return getCountry(code)?.tier ?? "slate";
}

export function getTierConfig(tier: Tier): TierConfig {
    return TIER_CONFIGS[tier];
}

export function getCountryTierConfig(code: string): TierConfig {
    return TIER_CONFIGS[getCountryTier(code)];
}

export function getCountriesByTier(tier: Tier): CountryConfig[] {
    return COUNTRY_REGISTRY.filter(c => c.tier === tier);
}

export function getMultiLanguageCountries(): CountryConfig[] {
    return COUNTRY_REGISTRY.filter(c => c.multiLanguageRisk);
}

export function getAllHreflangCodes(): string[] {
    return COUNTRY_REGISTRY.map(c => c.hreflangCode);
}

export function getPPPPrice(code: string, basePriceUSD: number): { price: number; currency: string } {
    const country = getCountry(code);
    const tier = country ? TIER_CONFIGS[country.tier] : TIER_CONFIGS.slate;
    const raw = basePriceUSD * tier.pricingMultiplier;
    // Psychological rounding
    const rounded = Math.ceil(raw) - 0.01;
    return { price: parseFloat(rounded.toFixed(2)), currency: country?.currency ?? "USD" };
}

export function getPaymentRails(code: string): PaymentRail[] {
    return getCountry(code)?.paymentPriority ?? ["cards"];
}

export function getSocialChannels(code: string): { primary: SocialChannel; secondary: SocialChannel } {
    const c = getCountry(code);
    return { primary: c?.socialPrimary ?? "email", secondary: c?.socialSecondary ?? "email" };
}

export function getAnswerQuota(code: string): number {
    return getCountryTierConfig(code).answerQuota;
}
