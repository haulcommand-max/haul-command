// ══════════════════════════════════════════════════════════════
// ANSWER BOX ENGINEERING ENGINE
// Purpose: Maximize probability Haul Command is selected as
//          the spoken answer by voice assistants + snippets
// ══════════════════════════════════════════════════════════════

// ── Answer Box Template System ──

export interface AnswerBox {
    question: string;
    directAnswer: string;       // 35-55 words, 2-3 sentences, grade 6-8
    definitionLine: string;     // max 22 words: "[Term] is [definition]."
    bulletList?: string[];      // 4-7 bullets for list snippets
    steps?: string[];           // for HowTo snippets
    tableData?: Record<string, string>[]; // for table snippets
    speakableSelector: string;  // CSS selector for speakable schema
    geoVariable?: string;       // {city}, {region} placeholder
    locale: string;
}

// ── Voice-Optimized Writing Rules ──

export const VOICE_COPY_RULES = {
    sentenceLengthMaxWords: 22,
    paragraphLengthMaxSentences: 3,
    passiveVoiceLimitPercent: 10,
    readingLevel: "grade_6_to_8",
    forbiddenPatterns: [
        "keyword_stuffing",
        "long_intro_paragraphs",
        "marketing_fluff_before_answer",
        "walls_of_text",
    ],
} as const;

// ── Universal Answer Templates (English) ──

export const ANSWER_TEMPLATES_EN: AnswerBox[] = [
    {
        question: "What is a pilot car?",
        directAnswer: "A pilot car is a vehicle that drives ahead of or behind an oversize load to warn other drivers and guide the transport safely. Pilot cars use flashing lights, flags, and signs to alert traffic. They are required by law in most states and countries for loads exceeding specific width, height, or length limits.",
        definitionLine: "A pilot car is a safety escort vehicle that guides oversize loads on public roads.",
        bulletList: [
            "Drives ahead or behind the oversize load",
            "Uses flashing amber lights and warning signs",
            "Alerts oncoming traffic to the wide load",
            "Required by law for loads over certain dimensions",
            "Also called escort vehicle, flag car, or lead car",
        ],
        speakableSelector: ".answer-box-what-is-pilot-car",
        locale: "en",
    },
    {
        question: "How much does a pilot car cost?",
        directAnswer: "Pilot car services typically cost between $400 and $800 per day in the US. Hourly rates range from $25 to $50 per hour. Costs vary by distance, route complexity, and how many escort vehicles are required. Multi-day trips and complex routes with permit requirements cost more.",
        definitionLine: "Pilot car costs range from $400 to $800 per day or $25 to $50 per hour in the US.",
        tableData: [
            { Type: "Hourly Rate", Range: "$25 – $50/hr" },
            { Type: "Daily Rate", Range: "$400 – $800/day" },
            { Type: "Per Mile", Range: "$1.50 – $3.00/mi" },
            { Type: "Multi-Day Trip", Range: "$800 – $2,000+" },
        ],
        speakableSelector: ".answer-box-pilot-car-cost",
        locale: "en",
    },
    {
        question: "Do I need a pilot car for my oversize load?",
        directAnswer: "You need a pilot car when your load exceeds the legal dimensions for your route. In most US states, loads wider than 12 feet, taller than 14.5 feet, or longer than 95 feet require at least one escort vehicle. Some states require two escorts for extra-wide loads. Check your state and route requirements before dispatch.",
        definitionLine: "A pilot car is required when your load exceeds legal width, height, or length limits.",
        bulletList: [
            "Loads wider than 12 feet usually need one escort",
            "Loads wider than 14–16 feet may need two escorts",
            "Height over 14.5 feet often triggers escort requirement",
            "Length over 95–100 feet typically requires escorts",
            "Requirements vary by state — check before you move",
        ],
        speakableSelector: ".answer-box-do-i-need-pilot-car",
        locale: "en",
    },
    {
        question: "How do I find a pilot car near me?",
        directAnswer: "Use the Haul Command directory to search for certified pilot car operators near your location. Enter your city or allow location access to find available escorts. Filter by certification, rating, and response time. You can also post a job on the load board to receive quotes from nearby operators.",
        definitionLine: "Find pilot cars near you by searching the Haul Command escort vehicle directory.",
        steps: [
            "Go to haulcommand.com or open the Haul Command app",
            "Allow location access or enter your city",
            "Browse available escort operators near you",
            "Filter by certification, rating, and availability",
            "Contact the operator or post a job on the load board",
        ],
        speakableSelector: ".answer-box-find-pilot-car-near-me",
        locale: "en",
    },
    {
        question: "What equipment does a pilot car need?",
        directAnswer: "A pilot car needs an oversize load sign, amber flashing lights, two-way radio or CB, height pole, flags, and safety cones. Most states also require a fire extinguisher, first aid kit, and reflective vest. The vehicle should be a full-size car, SUV, or truck in good condition with proper insurance.",
        definitionLine: "Pilot cars need oversize load signs, amber lights, radios, height poles, and safety equipment.",
        bulletList: [
            "Oversize Load / Wide Load sign (front and/or rear)",
            "Amber flashing or rotating lights",
            "Two-way radio or CB radio",
            "Height measuring pole (for bridges/overpasses)",
            "Red/orange safety flags",
            "Safety cones and reflective vest",
            "Fire extinguisher and first aid kit",
        ],
        speakableSelector: ".answer-box-pilot-car-equipment",
        locale: "en",
    },
];

// ── Spanish Answer Templates ──

export const ANSWER_TEMPLATES_ES: AnswerBox[] = [
    {
        question: "¿Qué es un carro piloto?",
        directAnswer: "Un carro piloto es un vehículo que conduce delante o detrás de una carga sobredimensionada para advertir a otros conductores y guiar el transporte de forma segura. Usa luces intermitentes, banderas y señales de advertencia. Es obligatorio por ley en la mayoría de los países para cargas que excedan ciertos límites.",
        definitionLine: "Un carro piloto es un vehículo de escolta que guía cargas sobredimensionadas en vías públicas.",
        speakableSelector: ".answer-box-que-es-carro-piloto",
        locale: "es",
    },
    {
        question: "¿Cuánto cuesta un carro piloto?",
        directAnswer: "Los servicios de carro piloto cuestan entre $300 y $700 USD por día en Latinoamérica. Las tarifas varían según la distancia, complejidad de la ruta y el número de escoltas requeridos. En España y México los precios pueden ser diferentes según la regulación local.",
        definitionLine: "Un carro piloto cuesta entre $300 y $700 USD por día en promedio.",
        speakableSelector: ".answer-box-costo-carro-piloto",
        locale: "es",
    },
];

// ── German Answer Templates ──

export const ANSWER_TEMPLATES_DE: AnswerBox[] = [
    {
        question: "Was ist ein Begleitfahrzeug?",
        directAnswer: "Ein Begleitfahrzeug fährt vor oder hinter einem Schwertransport, um andere Verkehrsteilnehmer zu warnen und den Transport sicher zu begleiten. Es ist mit gelben Warnleuchten, Warnschildern und Funkgeräten ausgestattet. Ab bestimmten Breiten und Gewichten ist die Begleitung gesetzlich vorgeschrieben.",
        definitionLine: "Ein Begleitfahrzeug ist ein Sicherheitsfahrzeug zur Begleitung von Schwertransporten auf öffentlichen Straßen.",
        speakableSelector: ".answer-box-was-ist-begleitfahrzeug",
        locale: "de",
    },
    {
        question: "Was kostet ein Begleitfahrzeug?",
        directAnswer: "Begleitfahrzeuge kosten in Deutschland zwischen 400€ und 900€ pro Tag. Die Kosten hängen von der Strecke, Komplexität der Route und Anzahl der benötigten Begleitfahrzeuge ab. Für BF3-Begleitung gelten andere Tarife als für BF4-Begleitung.",
        definitionLine: "Ein Begleitfahrzeug kostet in Deutschland zwischen 400€ und 900€ pro Tag.",
        speakableSelector: ".answer-box-kosten-begleitfahrzeug",
        locale: "de",
    },
];

// ── Structured Data Generators ──

export interface SpeakableSchemaOutput {
    "@context": string;
    "@type": string;
    speakable: {
        "@type": string;
        cssSelector: string[];
    };
    url: string;
}

export function generateSpeakableSchema(
    url: string,
    cssSelectors: string[]
): SpeakableSchemaOutput {
    return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: cssSelectors,
        },
        url,
    };
}

export interface FAQSchemaOutput {
    "@context": string;
    "@type": string;
    mainEntity: { "@type": string; name: string; acceptedAnswer: { "@type": string; text: string } }[];
}

export function generateFAQSchema(faqs: { q: string; a: string }[]): FAQSchemaOutput {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(faq => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
    };
}

export interface HowToSchemaOutput {
    "@context": string;
    "@type": string;
    name: string;
    step: { "@type": string; text: string; position: number }[];
}

export function generateHowToSchema(name: string, steps: string[]): HowToSchemaOutput {
    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name,
        step: steps.map((text, i) => ({ "@type": "HowToStep", text, position: i + 1 })),
    };
}

export interface LocalBusinessSchemaOutput {
    "@context": string;
    "@type": string;
    name: string;
    description: string;
    areaServed: { "@type": string; name: string }[];
    url: string;
    priceRange: string;
    serviceType: string;
}

export function generateLocalBusinessSchema(
    name: string,
    description: string,
    areas: string[],
    url: string
): LocalBusinessSchemaOutput {
    return {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name,
        description,
        areaServed: areas.map(a => ({ "@type": "Place", name: a })),
        url,
        priceRange: "$$",
        serviceType: "Pilot Car / Escort Vehicle Service",
    };
}

// ── Snippet Capture Scoring ──

export interface SnippetReadiness {
    pageUrl: string;
    hasDirectAnswer: boolean;
    hasDefinitionLine: boolean;
    hasFAQSchema: boolean;
    hasSpeakableSchema: boolean;
    hasHowToSchema: boolean;
    wordCountInAnswerBlock: number;
    readingLevel: string;
    mobileSpeedScore: number;
    snippetReadyScore: number; // 0-100
}

export function scoreSnippetReadiness(
    page: Omit<SnippetReadiness, "snippetReadyScore">
): SnippetReadiness {
    let score = 0;
    if (page.hasDirectAnswer) score += 25;
    if (page.hasDefinitionLine) score += 10;
    if (page.hasFAQSchema) score += 20;
    if (page.hasSpeakableSchema) score += 20;
    if (page.hasHowToSchema) score += 10;
    if (page.wordCountInAnswerBlock >= 35 && page.wordCountInAnswerBlock <= 55) score += 10;
    if (page.mobileSpeedScore >= 90) score += 5;
    return { ...page, snippetReadyScore: Math.min(score, 100) };
}

// ── Hreflang Tag Generator ──

export interface HreflangTag {
    hreflang: string;
    href: string;
}

export function generateHreflangTags(
    basePath: string,
    domain: string,
    locales: { lang: string; country: string; pathPrefix: string }[]
): HreflangTag[] {
    const tags: HreflangTag[] = locales.map(l => ({
        hreflang: `${l.lang}-${l.country}`,
        href: `https://${domain}${l.pathPrefix}${basePath}`,
    }));
    // x-default
    tags.push({ hreflang: "x-default", href: `https://${domain}${basePath}` });
    return tags;
}

// ── Day-One Checklist Validator ──

export interface DayOneChecklist {
    answerBlocksInstalled: boolean;
    speakableSchemaLive: boolean;
    faqSchemaLive: boolean;
    geoVariablesWorking: boolean;
    multilingualReady: boolean;
    snippetBlocksPresent: boolean;
    mobileSpeedPassing: boolean;
    hreflangDeployed: boolean;
    reviewVelocityActive: boolean;
    overallReady: boolean;
}

export function validateDayOneReadiness(
    checks: Omit<DayOneChecklist, "overallReady">
): DayOneChecklist {
    const critical = [
        checks.answerBlocksInstalled,
        checks.speakableSchemaLive,
        checks.faqSchemaLive,
        checks.mobileSpeedPassing,
    ];
    return { ...checks, overallReady: critical.every(Boolean) };
}
