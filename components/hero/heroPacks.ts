/**
 * Country Hero Packs — localized copy + asset paths per country.
 * Assets live in public/hero/{iso2}/
 * Fallback covers every country without a dedicated pack.
 */

export type HeroPack = {
    country: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
    /** Base path (no extension) e.g. "/hero/us/us-hero-poster" */
    posterBase: string;
    /** Base path (no extension) e.g. "/hero/us/us-hero" */
    videoBase: string;
};

export const HERO_PACKS: Record<string, HeroPack> = {
    US: {
        country: "US",
        title: "Real-Time Escort Intelligence for Heavy Haul",
        subtitle:
            "Match oversize loads with verified escorts in minutes. Stage-based fill probability. One-tap accept. Built for the corridor.",
        ctaLabel: "Find Coverage",
        ctaHref: "/directory",
        posterBase: "/hero/us/us-hero-poster",
        videoBase: "/hero/us/us-hero",
    },
    CA: {
        country: "CA",
        title: "Canada-Ready Escort Coverage",
        subtitle:
            "Permits, provinces, and positioning — built for real heavy haul across every province.",
        ctaLabel: "Browse Operators",
        ctaHref: "/directory",
        posterBase: "/hero/ca/ca-hero-poster",
        videoBase: "/hero/ca/ca-hero",
    },
    AU: {
        country: "AU",
        title: "Pilot Vehicle Intelligence for Australia",
        subtitle:
            "Wide loads, escort vehicles, and route compliance — purpose-built for Australian corridors.",
        ctaLabel: "Find Pilots",
        ctaHref: "/directory",
        posterBase: "/hero/au/au-hero-poster",
        videoBase: "/hero/au/au-hero",
    },
    GB: {
        country: "GB",
        title: "Abnormal Load Escort Coverage — UK",
        subtitle:
            "STGO-compliant escort matching, route intelligence, and verified operator coverage across the UK.",
        ctaLabel: "Find Escorts",
        ctaHref: "/directory",
        posterBase: "/hero/gb/gb-hero-poster",
        videoBase: "/hero/gb/gb-hero",
    },
    DE: {
        country: "DE",
        title: "Schwertransport-Eskorte — Deutschland",
        subtitle:
            "BF3-konforme Begleitfahrzeuge, Routenintelligenz und verifizierte Betreiber in ganz Deutschland.",
        ctaLabel: "Betreiber finden",
        ctaHref: "/directory",
        posterBase: "/hero/de/de-hero-poster",
        videoBase: "/hero/de/de-hero",
    },
    BR: {
        country: "BR",
        title: "Escolta Rodoviária para Cargas Pesadas",
        subtitle:
            "Cobertura verificada de escoltas, rotas inteligentes e coordenação operacional para o Brasil.",
        ctaLabel: "Ver Diretório",
        ctaHref: "/directory",
        posterBase: "/hero/br/br-hero-poster",
        videoBase: "/hero/br/br-hero",
    },
    MX: {
        country: "MX",
        title: "Escolta Vial para Carga Sobredimensionada",
        subtitle:
            "Vehículos piloto verificados, inteligencia de rutas y coordinación operativa para México.",
        ctaLabel: "Ver Directorio",
        ctaHref: "/directory",
        posterBase: "/hero/mx/mx-hero-poster",
        videoBase: "/hero/mx/mx-hero",
    },
};

export const FALLBACK_PACK: HeroPack = {
    country: "ZZ",
    title: "Heavy Haul Escort Intelligence — Worldwide",
    subtitle:
        "Country-ready escort matching, compliance routing, and verified operator coverage across 57 countries.",
    ctaLabel: "Explore Directory",
    ctaHref: "/directory",
    posterBase: "/hero/_fallback/fallback-poster",
    videoBase: "/hero/_fallback/fallback-hero",
};

export function resolveHeroPack(country: string): HeroPack {
    const cc = country.toUpperCase();
    return HERO_PACKS[cc] ?? FALLBACK_PACK;
}
