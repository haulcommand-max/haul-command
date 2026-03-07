// ═══════════════════════════════════════════════════════════════════════════════
// APP STORE DISTRIBUTION CONFIG — 52-Country Multi-Store Launch
//
// Maximizes reach by targeting EVERY install surface available:
//   1. Apple App Store (iOS) — All 52 countries
//   2. Google Play Store — All 52 countries
//   3. Huawei AppGallery — Critical for MY, SG, and Chinese-brand Android share
//   4. Samsung Galaxy Store — Free, incremental Android reach
//   5. PWA (installable) — Fallback for markets with sideloading
//   6. Amazon Appstore — Fire tablets, incremental US/EU
//   7. Xiaomi GetApps — India, Southeast Asia reach
//
// Each store entry generates:
//   - ASO-optimized title + description in local language
//   - Localized screenshots + feature graphics
//   - Deep link schema for place profiles
//   - Country-specific keyword targets
//
// ═══════════════════════════════════════════════════════════════════════════════

import { COUNTRY_REGISTRY, type CountryConfig, type Tier } from '../config/country-registry';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type AppStore = 'apple_app_store' | 'google_play' | 'huawei_appgallery'
    | 'samsung_galaxy' | 'amazon_appstore' | 'xiaomi_getapps' | 'pwa';

export interface StoreListingConfig {
    store: AppStore;
    countryCode: string;
    language: string;
    title: string;
    shortDescription: string;
    fullDescription: string;
    keywords: string[];
    category: string;
    secondaryCategory?: string;
    screenshotSets: ScreenshotSet[];
    deepLinkScheme: string;
    appLinksConfig: AppLinkConfig;
    pricingTier: 'free' | 'freemium';
    inAppPurchases: boolean;
    ageRating: string;
    contentRating: string;
    privacyPolicyUrl: string;
    termsUrl: string;
}

export interface ScreenshotSet {
    device: 'iphone_6_7' | 'iphone_14_pro_max' | 'ipad_pro' | 'android_phone' | 'android_tablet';
    screenshots: {
        filename: string;
        caption: string;
    }[];
}

export interface AppLinkConfig {
    domain: string;
    pathPatterns: string[];
    intentFilters: {
        action: string;
        category: string[];
        data: { scheme: string; host: string; pathPrefix: string }[];
    }[];
}

export interface ASOConfig {
    primaryKeywords: string[];
    longTailKeywords: string[];
    competitorApps: string[];
    targetCPI: number;
    organicInstallTarget: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORE DISTRIBUTION MATRIX — Which stores per country
// ═══════════════════════════════════════════════════════════════════════════════

const STORE_PRIORITY: Record<AppStore, {
    markets: string[] | 'all';
    priority: number;
    setupComplexity: 'low' | 'medium' | 'high';
    devAccountCostUsd: number;
    reviewTime: string;
}> = {
    apple_app_store: {
        markets: 'all',
        priority: 1,
        setupComplexity: 'medium',
        devAccountCostUsd: 99, // annual
        reviewTime: '1-3 days',
    },
    google_play: {
        markets: 'all',
        priority: 1,
        setupComplexity: 'low',
        devAccountCostUsd: 25, // one-time
        reviewTime: '1-7 days',
    },
    huawei_appgallery: {
        markets: ['MY', 'SG', 'AE', 'SA', 'QA', 'KW', 'OM', 'BH', 'TR', 'ZA',
            'DE', 'FR', 'ES', 'IT', 'PT', 'NL', 'BE', 'AT', 'CH',
            'PL', 'CZ', 'RO', 'BG', 'HR', 'SI', 'SK', 'HU',
            'SE', 'NO', 'DK', 'FI', 'BR', 'MX', 'CO', 'AR', 'CL', 'PE'],
        priority: 2,
        setupComplexity: 'medium',
        devAccountCostUsd: 0, // free
        reviewTime: '3-5 days',
    },
    samsung_galaxy: {
        markets: 'all',
        priority: 3,
        setupComplexity: 'low',
        devAccountCostUsd: 0, // free
        reviewTime: '1-3 days',
    },
    amazon_appstore: {
        markets: ['US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT', 'AU', 'JP', 'BR', 'MX'],
        priority: 4,
        setupComplexity: 'low',
        devAccountCostUsd: 0, // free
        reviewTime: '1-2 days',
    },
    xiaomi_getapps: {
        markets: ['MY', 'SG', 'BR', 'MX', 'TR', 'RO', 'BG', 'CO', 'PE', 'AR', 'CL'],
        priority: 5,
        setupComplexity: 'medium',
        devAccountCostUsd: 0,
        reviewTime: '3-7 days',
    },
    pwa: {
        markets: 'all',
        priority: 2,
        setupComplexity: 'low',
        devAccountCostUsd: 0,
        reviewTime: 'instant',
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ASO KEYWORD ENGINE — Per-country keyword optimization
// ═══════════════════════════════════════════════════════════════════════════════

const ASO_KEYWORD_TEMPLATES: Record<string, {
    primary: string[];
    longTail: string[];
}> = {
    en: {
        primary: [
            'pilot car', 'escort vehicle', 'oversize load', 'heavy haul',
            'truck stop', 'truck parking', 'wide load escort', 'route survey',
            'OSOW permit', 'heavy transport', 'trucking directory',
        ],
        longTail: [
            'pilot car services near me', 'find escort vehicle operator',
            'oversize load regulations by state', 'truck stop with shower nearby',
            'heavy haul route planning', 'certified pilot car operator',
            'wide load escort requirements', 'truck parking availability',
        ],
    },
    de: {
        primary: [
            'Schwertransport', 'Begleitfahrzeug', 'Überbreite Ladung',
            'Schwerlastverkehr', 'LKW-Parkplatz', 'Sondertransport',
            'BF3 Begleitung', 'Transportbegleitung', 'LKW-Verzeichnis',
        ],
        longTail: [
            'Schwertransport Begleitfahrzeug finden', 'BF3 Fahrer in der Nähe',
            'Überbreite Ladung Genehmigung', 'LKW Parkplatz Autobahn',
        ],
    },
    fr: {
        primary: [
            'convoi exceptionnel', 'véhicule pilote', 'transport exceptionnel',
            'charge lourde', 'relais routier', 'parking poids lourds',
        ],
        longTail: [
            'véhicule pilote convoi exceptionnel', 'transport exceptionnel réglementation',
            'relais routier parking camion', 'escort convoi autoroute',
        ],
    },
    es: {
        primary: [
            'carga sobredimensionada', 'vehículo escolta', 'transporte especial',
            'carga pesada', 'estacionamiento camiones', 'parada de camiones',
        ],
        longTail: [
            'escolta carga sobredimensionada', 'transporte especial permisos',
            'estacionamiento camiones cerca de mí', 'servicios carga pesada',
        ],
    },
    pt: {
        primary: [
            'carga indivisível', 'batedor', 'escolta de carga',
            'transporte pesado', 'posto de caminhão', 'carga especial',
        ],
        longTail: [
            'escolta carga especial Brasil', 'batedor transporte pesado',
            'posto caminhão perto de mim', 'regulamentação carga indivisível',
        ],
    },
    ar: {
        primary: [
            'نقل الحمولات الثقيلة', 'مرافقة الحمولات', 'نقل خاص',
            'حمولة كبيرة', 'مواقف الشاحنات', 'محطات الديزل',
        ],
        longTail: [
            'خدمات مرافقة الحمولات الكبيرة', 'نقل ثقيل السعودية',
            'مواقف شاحنات قريبة', 'تصاريح نقل خاص',
        ],
    },
    nl: {
        primary: [
            'zwaar transport', 'begeleidingsvoertuig', 'exceptioneel transport',
            'breed transport', 'vrachtwagenparkeren', 'transportbegeleiding',
        ],
        longTail: [
            'begeleidingsvoertuig zwaar transport', 'exceptioneel transport vergunning',
            'vrachtwagen parkeren snelweg', 'breed transport begeleiding',
        ],
    },
    it: {
        primary: [
            'trasporto eccezionale', 'scorta tecnica', 'carico pesante',
            'autotrasporto', 'parcheggio camion', 'stazione di servizio',
        ],
        longTail: [
            'scorta tecnica trasporto eccezionale', 'trasporto eccezionale normativa',
            'parcheggio camion vicino a me', 'servizi carico pesante',
        ],
    },
    ja: {
        primary: [
            '特殊車両', '誘導車', '重量物輸送', 'トラック駐車場',
            '大型車両通行許可', '運送業者検索',
        ],
        longTail: [
            '特殊車両通行許可申請', '誘導車手配', '重量物輸送サービス',
            'トラック駐車場近く',
        ],
    },
    ko: {
        primary: [
            '특수운송', '호송차량', '중량물운반', '화물차주차',
            '과적운송허가', '운송업체검색',
        ],
        longTail: [
            '특수운송 호송서비스', '중량물운반 허가', '화물주차장 가까운',
        ],
    },
    sv: {
        primary: [
            'tungtransport', 'eskortfordon', 'specialtransport',
            'breddökning', 'lastbilsparkering', 'transportledning',
        ],
        longTail: [
            'eskort specialtransport', 'tungtransport tillstånd',
            'lastbilsparkering nära mig', 'breddökning eskort',
        ],
    },
    tr: {
        primary: [
            'ağır yük taşımacılığı', 'refakat aracı', 'özel taşımacılık',
            'geniş yük', 'tır parkı', 'nakliye rehberi',
        ],
        longTail: [
            'ağır yük refakat aracı', 'özel taşımacılık izin',
            'tır parkı yakın', 'geniş yük taşımacılığı hizmetleri',
        ],
    },
};

function getASOKeywords(languagePrimary: string): { primary: string[]; longTail: string[] } {
    return ASO_KEYWORD_TEMPLATES[languagePrimary] || ASO_KEYWORD_TEMPLATES.en;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCALIZED LISTING GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

const STORE_DESCRIPTIONS: Record<string, {
    title: string;
    shortDesc: string;
    fullDesc: string;
}> = {
    en: {
        title: 'Haul Command — Heavy Transport Directory',
        shortDesc: 'Find pilot cars, escort vehicles, truck stops, and heavy-haul services worldwide.',
        fullDesc: `Haul Command is the world's leading directory for heavy transport, oversize load escort, and trucking infrastructure.

🔍 FIND SERVICES FAST
• Certified pilot car & escort vehicle operators
• Truck stops, parking, fuel stations & rest areas
• Heavy truck repair shops & tire services
• Tow & rotator companies for emergencies
• Port services & industrial park facilities

🌍 GLOBAL COVERAGE
• 52 countries, local language support
• State-by-state regulations (US, CA, AU, and more)
• Corridor-based route planning
• Port & border crossing information

📊 BUSINESS TOOLS
• Claim your free business listing
• Get verified to stand out from competitors
• Track views, leads, and analytics
• Run targeted ad campaigns via AdGrid

⭐ TRUSTED BY THE INDUSTRY
• 150,000+ verified business profiles
• Real driver reviews and ratings
• Up-to-date regulation information
• Used by operators, brokers, and fleet managers

Download free. Start finding services or claim your business today.`,
    },
    de: {
        title: 'Haul Command — Schwertransport-Verzeichnis',
        shortDesc: 'Begleitfahrzeuge, LKW-Parkplätze und Schwertransport-Services weltweit finden.',
        fullDesc: `Haul Command ist das führende Verzeichnis für Schwertransport, Sondertransport-Begleitung und Transport-Infrastruktur.

🔍 SERVICES SCHNELL FINDEN
• Zertifizierte BF3-Begleitfahrzeuge
• LKW-Parkplätze, Tankstellen & Raststätten
• Werkstätten für Schwerlastfahrzeuge
• Abschlepp- & Bergungsdienste
• Hafen- und Industriepark-Services

🌍 GLOBALE ABDECKUNG
• 52 Länder, lokale Sprachunterstützung
• Vorschriften nach Bundesland
• Korridorbasierte Routenplanung

📊 BUSINESS-TOOLS
• Kostenlosen Firmeneintrag beanspruchen
• Verifizierung für mehr Sichtbarkeit
• Aufrufe, Leads und Analysen verfolgen

Kostenlos herunterladen. Jetzt Services finden oder Ihr Unternehmen eintragen.`,
    },
    pt: {
        title: 'Haul Command — Diretório de Transporte Pesado',
        shortDesc: 'Encontre batedores, escoltas, postos de caminhão e serviços de carga pesada.',
        fullDesc: `Haul Command é o diretório líder mundial para transporte pesado, escolta de cargas especiais e infraestrutura rodoviária.

🔍 ENCONTRE SERVIÇOS RÁPIDO
• Batedores e escoltas certificados
• Postos de caminhão, estacionamentos e postos de combustível
• Oficinas para veículos pesados
• Serviços de guincho e resgate
• Serviços portuários e parques industriais

🌍 COBERTURA GLOBAL
• 52 países, suporte em idioma local
• Regulamentações por estado
• Planejamento de rotas por corredor

📊 FERRAMENTAS EMPRESARIAIS
• Reivindique sua listagem gratuita
• Verificação para se destacar da concorrência

Baixe grátis. Encontre serviços ou cadastre seu negócio hoje.`,
    },
    es: {
        title: 'Haul Command — Directorio Transporte Pesado',
        shortDesc: 'Encuentra escoltas, paradas de camión y servicios de carga pesada en todo el mundo.',
        fullDesc: `Haul Command es el directorio líder mundial para transporte pesado, escolta de cargas y servicios de infraestructura vial.

🔍 ENCUENTRA SERVICIOS RÁPIDO
• Escoltas de carga certificados
• Paradas de camión, estacionamientos y gasolineras
• Talleres para vehículos pesados
• Servicios de grúa y rescate

🌍 COBERTURA GLOBAL
• 52 países, soporte en idioma local
• Regulaciones por estado/provincia

Descarga gratis. Encuentra servicios o registra tu negocio hoy.`,
    },
    ar: {
        title: 'هول كوماند — دليل النقل الثقيل',
        shortDesc: 'ابحث عن مرافقين الحمولات، مواقف الشاحنات وخدمات النقل الثقيل.',
        fullDesc: `هول كوماند هو الدليل العالمي الرائد للنقل الثقيل وخدمات مرافقة الحمولات.

🔍 ابحث عن الخدمات بسرعة
• مرافقون معتمدون للحمولات الكبيرة
• مواقف شاحنات ومحطات وقود
• ورش صيانة للشاحنات الثقيلة

🌍 تغطية عالمية
• 52 دولة، دعم باللغة المحلية

حمّل مجاناً. ابحث عن خدمات أو سجّل شركتك اليوم.`,
    },
};

function getStoreDescription(language: string) {
    return STORE_DESCRIPTIONS[language] || STORE_DESCRIPTIONS.en;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEEP LINK CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export function buildDeepLinkConfig(): AppLinkConfig {
    return {
        domain: 'haulcommand.com',
        pathPatterns: [
            '/*/places/*',           // Place profiles
            '/*/corridor/*/services', // Corridor pages
            '/*/port/*/nearby*',      // Port halo pages
            '/rules/*/escort*',       // Regulation pages
            '/search*',               // Search results
            '/dashboard*',            // User dashboard
        ],
        intentFilters: [{
            action: 'android.intent.action.VIEW',
            category: ['android.intent.category.DEFAULT', 'android.intent.category.BROWSABLE'],
            data: [
                { scheme: 'https', host: 'haulcommand.com', pathPrefix: '/' },
                { scheme: 'haulcommand', host: 'app', pathPrefix: '/' },
            ],
        }],
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULL DISTRIBUTION PLAN GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export interface DistributionPlan {
    totalStoreListings: number;
    totalCountries: number;
    totalStores: number;
    listings: StoreListingConfig[];
    storeStats: Record<AppStore, { countries: number; estimatedReach: number }>;
    setupCost: { oneTime: number; annual: number };
    estimatedTimeToLaunch: string;
}

export function generateDistributionPlan(): DistributionPlan {
    const listings: StoreListingConfig[] = [];

    for (const country of COUNTRY_REGISTRY) {
        for (const [storeKey, config] of Object.entries(STORE_PRIORITY)) {
            const store = storeKey as AppStore;

            // Skip stores that don't target this country
            if (config.markets !== 'all' && !config.markets.includes(country.code)) continue;

            const desc = getStoreDescription(country.languagePrimary);
            const aso = getASOKeywords(country.languagePrimary);

            listings.push({
                store,
                countryCode: country.code,
                language: country.languagePrimary,
                title: desc.title,
                shortDescription: desc.shortDesc,
                fullDescription: desc.fullDesc,
                keywords: [...aso.primary, ...aso.longTail],
                category: store === 'apple_app_store' ? 'Business' : 'Business',
                secondaryCategory: 'Travel',
                screenshotSets: [], // Generated during build
                deepLinkScheme: 'haulcommand',
                appLinksConfig: buildDeepLinkConfig(),
                pricingTier: 'free',
                inAppPurchases: true,
                ageRating: '4+',
                contentRating: 'Everyone',
                privacyPolicyUrl: 'https://haulcommand.com/privacy',
                termsUrl: 'https://haulcommand.com/terms',
            });
        }
    }

    // Calculate store stats
    const storeStats: Record<AppStore, { countries: number; estimatedReach: number }> = {} as any;
    for (const store of Object.keys(STORE_PRIORITY) as AppStore[]) {
        const storeListings = listings.filter(l => l.store === store);
        const reachMultiplier: Record<AppStore, number> = {
            apple_app_store: 0.25,
            google_play: 0.55,
            huawei_appgallery: 0.08,
            samsung_galaxy: 0.06,
            amazon_appstore: 0.03,
            xiaomi_getapps: 0.02,
            pwa: 0.01,
        };
        storeStats[store] = {
            countries: storeListings.length,
            estimatedReach: Math.round(storeListings.length * 1000000 * (reachMultiplier[store] || 0.01)),
        };
    }

    return {
        totalStoreListings: listings.length,
        totalCountries: COUNTRY_REGISTRY.length,
        totalStores: Object.keys(STORE_PRIORITY).length,
        listings,
        storeStats,
        setupCost: {
            oneTime: 25, // Google Play
            annual: 99,  // Apple
        },
        estimatedTimeToLaunch: '2-3 weeks for Apple + Google Play, 4-6 weeks for all stores',
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISTRIBUTION DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export function getDistributionSummary() {
    const plan = generateDistributionPlan();

    return {
        overview: {
            totalListings: plan.totalStoreListings,
            totalCountries: plan.totalCountries,
            stores: Object.entries(plan.storeStats).map(([store, stats]) => ({
                store,
                countries: stats.countries,
                estimatedReach: stats.estimatedReach,
            })),
        },
        launchPhases: [
            {
                phase: 1,
                name: 'Core Launch',
                stores: ['apple_app_store', 'google_play', 'pwa'],
                countries: COUNTRY_REGISTRY.filter(c => c.tier === 'gold').map(c => c.code),
                timeline: 'Week 1-2',
            },
            {
                phase: 2,
                name: 'Extended Reach',
                stores: ['huawei_appgallery', 'samsung_galaxy'],
                countries: COUNTRY_REGISTRY.filter(c => ['gold', 'blue'].includes(c.tier)).map(c => c.code),
                timeline: 'Week 3-4',
            },
            {
                phase: 3,
                name: 'Full Global',
                stores: ['amazon_appstore', 'xiaomi_getapps'],
                countries: COUNTRY_REGISTRY.map(c => c.code),
                timeline: 'Week 5-6',
            },
        ],
        setupCost: plan.setupCost,
        estimatedTimeToLaunch: plan.estimatedTimeToLaunch,
    };
}
