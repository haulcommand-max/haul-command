// ══════════════════════════════════════════════════════════════
// VOICE INTENT DOMINANCE ENGINE
// Purpose: Capture Google Assistant, Siri, Alexa, featured
//          snippets, and map pack visibility across 52 countries
// ══════════════════════════════════════════════════════════════

// ── Voice Intent Clusters ──

export interface VoiceIntentCluster {
    id: string;
    name: string;
    description: string;
    conversionValue: "extreme" | "very_high" | "high" | "high_assist" | "medium";
    templates: string[];
    /** Geo-expandable: {city}, {region}, {state}, {country} */
    geoExpandable: boolean;
}

export const VOICE_INTENT_CLUSTERS: VoiceIntentCluster[] = [
    {
        id: "emergency_high_intent",
        name: "Emergency / High Intent",
        description: "Driver under time pressure — highest conversion",
        conversionValue: "extreme",
        templates: [
            "pilot car near me",
            "escort vehicle near me right now",
            "oversize load escort near me",
            "pilot car service open now",
            "escort for wide load near me",
            "urgent pilot car needed",
            "find escort vehicle near my location",
            "closest pilot car to me",
            "who has an escort available right now",
            "need a pilot car asap",
        ],
        geoExpandable: true,
    },
    {
        id: "broker_sourcing",
        name: "Broker Sourcing",
        description: "Broker or dispatcher searching supply",
        conversionValue: "very_high",
        templates: [
            "pilot car companies near {city}",
            "oversize escort service {city}",
            "escort companies for heavy haul",
            "pilot car providers {region}",
            "oversize load escort company",
            "certified pilot car service",
            "wide load escort company near me",
            "who has escort capacity near {city}",
            "pilot car availability today {city}",
        ],
        geoExpandable: true,
    },
    {
        id: "compliance_questions",
        name: "Compliance Questions",
        description: "Rule and requirement discovery",
        conversionValue: "high_assist",
        templates: [
            "do I need a pilot car in {region}",
            "escort requirements for oversize load",
            "wide load rules {region}",
            "pilot car requirements {region}",
            "when is escort required oversize",
            "escort laws for wide loads",
            "how many escorts for wide load {region}",
            "oversize load regulations {region}",
        ],
        geoExpandable: true,
    },
    {
        id: "route_planning",
        name: "Route Planning",
        description: "Pre-trip planning queries",
        conversionValue: "high",
        templates: [
            "pilot car for route {city} to {city}",
            "escort needed for route",
            "oversize route planning help",
            "wide load route requirements",
            "escort coverage along route",
            "pilot car availability along highway",
            "escort along I-{highway}",
        ],
        geoExpandable: true,
    },
    {
        id: "pricing_intent",
        name: "Pricing Intent",
        description: "Commercial readiness — extreme conversion",
        conversionValue: "extreme",
        templates: [
            "how much does a pilot car cost",
            "escort vehicle price near me",
            "pilot car rates {region}",
            "wide load escort cost",
            "oversize escort pricing",
            "pilot car hourly rate",
            "what do pilot cars charge per mile",
            "escort vehicle daily rate {city}",
        ],
        geoExpandable: true,
    },
];

// ── Multi-Language Voice Patterns ──

export interface LanguageVoicePatterns {
    languageCode: string;
    languageName: string;
    countries: string[];
    priority: "tier_1_full" | "tier_2_expansion" | "tier_3_seed";
    patterns: {
        nearMe: string[];
        urgency: string[];
        brokerFormal: string[];
        compliance: string[];
        pricing: string[];
    };
}

export const LANGUAGE_VOICE_PATTERNS: LanguageVoicePatterns[] = [
    {
        languageCode: "en",
        languageName: "English",
        countries: ["US", "CA", "AU", "GB", "NZ", "ZA", "IE", "SG"],
        priority: "tier_1_full",
        patterns: {
            nearMe: ["pilot car near me", "escort vehicle near me", "wide load escort near me", "oversize load escort closest to me", "find escort vehicle near my location"],
            urgency: ["pilot car available now", "need escort right now", "urgent pilot car needed", "escort vehicle asap", "who has an escort open now"],
            brokerFormal: ["certified pilot car company", "oversize escort provider", "licensed escort vehicle operator", "pilot car companies hiring", "heavy haul escort service"],
            compliance: ["do I need a pilot car in {region}", "escort requirements oversize load", "wide load rules {region}", "how many escorts for {dimension} wide load"],
            pricing: ["how much does a pilot car cost", "pilot car rates per mile", "escort vehicle hourly rate", "wide load escort pricing {region}"],
        },
    },
    {
        languageCode: "es",
        languageName: "Spanish",
        countries: ["MX", "ES", "AR", "CL", "CO", "PE", "CR", "PA", "UY"],
        priority: "tier_1_full",
        patterns: {
            nearMe: ["carro piloto cerca de mí", "escolta para carga sobredimensionada cerca", "vehículo escolta cerca de mí", "escolta de carga pesada cerca"],
            urgency: ["necesito carro piloto ahora", "escolta disponible ahora", "carro piloto urgente", "busco escolta ahora mismo"],
            brokerFormal: ["empresa de carros piloto", "servicio de escolta carga pesada", "empresa de escolta certificada", "proveedores de escolta {city}"],
            compliance: ["necesito escolta para carga ancha en {region}", "requisitos de escolta {region}", "regulaciones carga sobredimensionada {region}"],
            pricing: ["cuánto cuesta un carro piloto", "precio de escolta carga pesada", "tarifa de carro piloto por hora", "costo de escolta {city}"],
        },
    },
    {
        languageCode: "pt",
        languageName: "Portuguese",
        countries: ["BR", "PT"],
        priority: "tier_1_full",
        patterns: {
            nearMe: ["carro batedor perto de mim", "escolta para carga excedente perto", "veículo de escolta perto de mim"],
            urgency: ["preciso de batedor agora", "escolta disponível agora", "batedor urgente"],
            brokerFormal: ["empresa de carro batedor", "serviço de escolta de carga", "empresa de escolta certificada"],
            compliance: ["preciso de escolta para carga especial em {region}", "requisitos de escolta {region}"],
            pricing: ["quanto custa um carro batedor", "preço de escolta de carga", "tarifa de batedor por hora"],
        },
    },
    {
        languageCode: "de",
        languageName: "German",
        countries: ["DE", "AT", "CH"],
        priority: "tier_1_full",
        patterns: {
            nearMe: ["Begleitfahrzeug in meiner Nähe", "Schwertransport Begleitservice", "Begleitfahrzeug jetzt finden", "BF3 in der Nähe"],
            urgency: ["Begleitfahrzeug jetzt verfügbar", "Begleitservice sofort benötigt", "dringend Begleitfahrzeug gesucht"],
            brokerFormal: ["zertifizierter Begleitservice", "Schwertransport Begleitung Unternehmen", "BF3 BF4 Dienstleister"],
            compliance: ["brauche ich Begleitfahrzeug für Schwertransport", "Begleitfahrzeug Pflicht {bundesland}", "Schwertransport Vorschriften {bundesland}"],
            pricing: ["was kostet ein Begleitfahrzeug", "Begleitfahrzeug Kosten pro Stunde", "Schwertransport Begleitung Preis"],
        },
    },
    {
        languageCode: "fr",
        languageName: "French",
        countries: ["FR", "BE", "CH"],
        priority: "tier_2_expansion",
        patterns: {
            nearMe: ["véhicule d'accompagnement près de moi", "escorte convoi exceptionnel près de moi", "voiture pilote proche"],
            urgency: ["véhicule d'accompagnement disponible maintenant", "escorte urgente convoi exceptionnel"],
            brokerFormal: ["entreprise véhicule d'accompagnement", "service d'escorte convoi exceptionnel certifié"],
            compliance: ["ai-je besoin d'une escorte pour convoi exceptionnel", "réglementation convoi exceptionnel {region}"],
            pricing: ["combien coûte un véhicule d'accompagnement", "tarif escorte convoi exceptionnel"],
        },
    },
    {
        languageCode: "nl",
        languageName: "Dutch",
        countries: ["NL", "BE"],
        priority: "tier_2_expansion",
        patterns: {
            nearMe: ["begeleidingsvoertuig bij mij in de buurt", "exceptioneel transport begeleiding dichtbij"],
            urgency: ["begeleiding nu nodig", "begeleidingsvoertuig direct beschikbaar"],
            brokerFormal: ["gecertificeerd begeleidingsbedrijf", "exceptioneel transport begeleiding dienst"],
            compliance: ["heb ik begeleiding nodig voor exceptioneel transport", "regels exceptioneel transport {province}"],
            pricing: ["kosten begeleidingsvoertuig", "prijs begeleiding exceptioneel transport"],
        },
    },
    {
        languageCode: "ar",
        languageName: "Arabic",
        countries: ["AE", "SA", "QA", "KW", "OM", "BH"],
        priority: "tier_2_expansion",
        patterns: {
            nearMe: ["سيارة مرافقة قريبة مني", "مرافقة حمولة كبيرة بالقرب مني", "أقرب مرافقة حمولة"],
            urgency: ["أحتاج سيارة مرافقة الآن", "مرافقة متاحة الآن", "مرافقة عاجلة"],
            brokerFormal: ["شركة مرافقة الحمولات الثقيلة", "خدمة مرافقة معتمدة"],
            compliance: ["هل أحتاج مرافقة للحمولة الكبيرة", "قوانين الحمولات الكبيرة {region}"],
            pricing: ["كم تكلفة سيارة المرافقة", "سعر المرافقة بالساعة"],
        },
    },
    {
        languageCode: "it",
        languageName: "Italian",
        countries: ["IT"],
        priority: "tier_2_expansion",
        patterns: {
            nearMe: ["veicolo di scorta vicino a me", "scorta trasporto eccezionale vicino"],
            urgency: ["scorta tecnica disponibile adesso", "veicolo di scorta urgente"],
            brokerFormal: ["azienda di scorta tecnica", "servizio scorta trasporto eccezionale"],
            compliance: ["serve la scorta per trasporto eccezionale", "normativa trasporto eccezionale {region}"],
            pricing: ["quanto costa un veicolo di scorta", "tariffe scorta trasporto eccezionale"],
        },
    },
    {
        languageCode: "ja",
        languageName: "Japanese",
        countries: ["JP"],
        priority: "tier_2_expansion",
        patterns: {
            nearMe: ["先導車 近く", "誘導車 近くで探す", "特殊車両 先導車 近い"],
            urgency: ["先導車 今すぐ必要", "誘導車 すぐ手配", "先導車 緊急"],
            brokerFormal: ["先導車 会社", "特殊車両 誘導サービス", "先導車 業者"],
            compliance: ["特殊車両 先導車 必要", "特殊車両通行許可 誘導車 規則"],
            pricing: ["先導車 料金", "誘導車 費用", "先導車 時間単価"],
        },
    },
    {
        languageCode: "ko",
        languageName: "Korean",
        countries: ["KR"],
        priority: "tier_2_expansion",
        patterns: {
            nearMe: ["유도차량 근처", "특수차량 호송 가까운", "유도차량 찾기"],
            urgency: ["유도차량 지금 필요", "호송차량 긴급", "유도차량 바로 배치"],
            brokerFormal: ["유도차량 업체", "특수차량 호송 서비스", "유도차량 회사"],
            compliance: ["특수차량 유도차량 필요 여부", "과적차량 규정"],
            pricing: ["유도차량 비용", "호송차량 요금", "유도차량 시간당 요금"],
        },
    },
    {
        languageCode: "tr",
        languageName: "Turkish",
        countries: ["TR"],
        priority: "tier_2_expansion",
        patterns: {
            nearMe: ["refakat aracı yakınımda", "gabari dışı yük eskort yakın"],
            urgency: ["refakat aracı hemen lazım", "acil refakat aracı"],
            brokerFormal: ["refakat aracı şirketi", "özel yük taşıma refakat hizmeti"],
            compliance: ["gabari dışı yük için refakat gerekli mi", "özel yük taşıma kuralları {il}"],
            pricing: ["refakat aracı ücreti", "refakat aracı fiyatı"],
        },
    },
    {
        languageCode: "pl",
        languageName: "Polish",
        countries: ["PL"],
        priority: "tier_2_expansion",
        patterns: {
            nearMe: ["pojazd pilotujący w pobliżu", "pilot drogowy blisko mnie"],
            urgency: ["potrzebuję pilota drogowego teraz", "pilotaż pilny"],
            brokerFormal: ["firma pilotażu drogowego", "usługa pilotaży transportów"],
            compliance: ["czy potrzebuję pilotażu dla transportu nienormatywnego", "przepisy transport nienormatywny {voivodeship}"],
            pricing: ["ile kosztuje pilot drogowy", "cena pilotażu transportu"],
        },
    },
];

// ── Urgency / Situation Modifiers ──

export const URGENCY_MODIFIERS = ["right now", "open now", "asap", "immediately", "today", "available now", "closest"] as const;
export const SITUATION_MODIFIERS = ["stuck", "on the road", "at the port", "near the highway", "at a weigh station", "before sunrise", "after hours"] as const;
export const DISTANCE_MODIFIERS = ["near me", "closest to me", "within 50 miles", "along my route", "near {landmark}", "near {port}", "near {industrial_area}"] as const;
export const VEHICLE_CONTEXT = ["for wide load", "for heavy haul", "for oversize load", "for mobile home", "for crane move", "for heavy equipment", "for wind turbine blades"] as const;

// ── Voice Query Generator ──

export interface GeneratedVoiceQuery {
    query: string;
    cluster: string;
    language: string;
    conversionValue: string;
    geoTarget?: string;
    urgencyLevel: "critical" | "high" | "normal";
}

export function generateVoiceQueries(
    iso2: string,
    city?: string,
    region?: string
): GeneratedVoiceQuery[] {
    const queries: GeneratedVoiceQuery[] = [];
    const langPattern = LANGUAGE_VOICE_PATTERNS.find(l => l.countries.includes(iso2));
    if (!langPattern) return queries;

    const resolve = (t: string) => t
        .replace("{city}", city || "")
        .replace("{region}", region || "")
        .replace("{state}", region || "")
        .replace("{bundesland}", region || "")
        .replace("{province}", region || "")
        .replace("{il}", region || "")
        .replace("{voivodeship}", region || "")
        .trim();

    // Near me (critical urgency)
    for (const p of langPattern.patterns.nearMe) {
        queries.push({ query: resolve(p), cluster: "emergency", language: langPattern.languageCode, conversionValue: "extreme", geoTarget: city, urgencyLevel: "critical" });
    }

    // Urgency
    for (const p of langPattern.patterns.urgency) {
        queries.push({ query: resolve(p), cluster: "urgency", language: langPattern.languageCode, conversionValue: "extreme", geoTarget: city, urgencyLevel: "critical" });
    }

    // Broker
    for (const p of langPattern.patterns.brokerFormal) {
        queries.push({ query: resolve(p), cluster: "broker", language: langPattern.languageCode, conversionValue: "very_high", geoTarget: city, urgencyLevel: "high" });
    }

    // Compliance
    for (const p of langPattern.patterns.compliance) {
        queries.push({ query: resolve(p), cluster: "compliance", language: langPattern.languageCode, conversionValue: "high", geoTarget: region, urgencyLevel: "normal" });
    }

    // Pricing
    for (const p of langPattern.patterns.pricing) {
        queries.push({ query: resolve(p), cluster: "pricing", language: langPattern.languageCode, conversionValue: "extreme", geoTarget: city, urgencyLevel: "high" });
    }

    return queries.filter(q => q.query.length > 3);
}

// ── Geo Density Targets ──

export const GEO_DENSITY_TARGETS: Record<string, { multiplier: string; pageTypes: string[] }> = {
    A: { multiplier: "15x", pageTypes: ["city_pages", "corridor_pages", "port_pages", "industrial_zone_pages", "highway_segment_pages"] },
    B: { multiplier: "10x", pageTypes: ["city_pages", "corridor_pages", "port_pages", "industrial_zone_pages"] },
    C: { multiplier: "6x", pageTypes: ["city_pages", "corridor_pages", "port_pages"] },
    D: { multiplier: "4x", pageTypes: ["city_pages", "corridor_pages"] },
};
