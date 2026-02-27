// ═══════════════════════════════════════════════════════════
// GLOBAL EQUIPMENT TAXONOMY — 3-tier classification
// Used by: programmatic SEO pages, directory filters,
// load posting, equipment intelligence engine
// ═══════════════════════════════════════════════════════════

export interface EquipmentType {
    id: string;
    slug: string;
    name: string;
    tier: 1 | 2 | 3;
    category: string;
    /** Country-specific name aliases */
    aliases: Record<string, string>;
    /** Typical escort requirements */
    escortRequirements: {
        minEscorts: number;
        heightPoleRequired: boolean;
        policeRequired: boolean;
        routeSurveyRequired: boolean;
    };
    /** SEO page generation config */
    seo: {
        generatePages: boolean;
        primaryKeyword: string;
        secondaryKeywords: string[];
    };
}

// ── TIER 1: Core Equipment Types ──
export const TIER_1_CORE: EquipmentType[] = [
    {
        id: "mobile-home",
        slug: "mobile-home-transport",
        name: "Mobile Home",
        tier: 1,
        category: "residential",
        aliases: {
            US: "Mobile Home", CA: "Manufactured Home", AU: "Relocatable Home",
            GB: "Park Home", DE: "Mobilheim", BR: "Casa Móvel",
        },
        escortRequirements: {
            minEscorts: 1, heightPoleRequired: false,
            policeRequired: false, routeSurveyRequired: false,
        },
        seo: {
            generatePages: true,
            primaryKeyword: "mobile home transport",
            secondaryKeywords: ["manufactured home movers", "wide load mobile home", "mobile home pilot car"],
        },
    },
    {
        id: "construction-equipment",
        slug: "construction-equipment-transport",
        name: "Construction Equipment",
        tier: 1,
        category: "heavy_equipment",
        aliases: {
            US: "Construction Equipment", CA: "Construction Machinery",
            AU: "Earthmoving Equipment", GB: "Heavy Plant",
            DE: "Baumaschinen", BR: "Equipamento de Construção",
        },
        escortRequirements: {
            minEscorts: 1, heightPoleRequired: true,
            policeRequired: false, routeSurveyRequired: false,
        },
        seo: {
            generatePages: true,
            primaryKeyword: "construction equipment transport",
            secondaryKeywords: ["excavator transport", "dozer transport", "heavy equipment hauling"],
        },
    },
    {
        id: "farm-equipment",
        slug: "farm-equipment-transport",
        name: "Farm Equipment",
        tier: 1,
        category: "agricultural",
        aliases: {
            US: "Farm Equipment", CA: "Agricultural Machinery",
            AU: "Agricultural Machinery", GB: "Farm Machinery",
            DE: "Landmaschinen", BR: "Máquinas Agrícolas",
        },
        escortRequirements: {
            minEscorts: 1, heightPoleRequired: false,
            policeRequired: false, routeSurveyRequired: false,
        },
        seo: {
            generatePages: true,
            primaryKeyword: "farm equipment transport",
            secondaryKeywords: ["combine transport", "tractor hauling", "agricultural oversize load"],
        },
    },
    {
        id: "cranes",
        slug: "crane-transport",
        name: "Crane Components",
        tier: 1,
        category: "heavy_equipment",
        aliases: {
            US: "Crane Components", CA: "Crane Transport",
            AU: "Crane Transport", GB: "Crane Components",
            DE: "Krankomponenten", BR: "Componentes de Guindaste",
        },
        escortRequirements: {
            minEscorts: 2, heightPoleRequired: true,
            policeRequired: true, routeSurveyRequired: true,
        },
        seo: {
            generatePages: true,
            primaryKeyword: "crane transport",
            secondaryKeywords: ["crane boom transport", "crawler crane hauling", "superload crane"],
        },
    },
    {
        id: "transformers",
        slug: "transformer-transport",
        name: "Transformers",
        tier: 1,
        category: "energy",
        aliases: {
            US: "Electrical Transformers", CA: "Power Transformers",
            AU: "Electrical Transformers", GB: "Grid Transformers",
            DE: "Transformatoren", BR: "Transformadores",
        },
        escortRequirements: {
            minEscorts: 2, heightPoleRequired: true,
            policeRequired: true, routeSurveyRequired: true,
        },
        seo: {
            generatePages: true,
            primaryKeyword: "transformer transport",
            secondaryKeywords: ["electrical transformer hauling", "power transformer oversize load"],
        },
    },
    {
        id: "steel-structures",
        slug: "steel-beam-transport",
        name: "Steel Structures",
        tier: 1,
        category: "construction",
        aliases: {
            US: "Steel Beams", CA: "Structural Steel",
            AU: "Steel Structures", GB: "Steelwork",
            DE: "Stahlbau", BR: "Estruturas de Aço",
        },
        escortRequirements: {
            minEscorts: 1, heightPoleRequired: true,
            policeRequired: false, routeSurveyRequired: false,
        },
        seo: {
            generatePages: true,
            primaryKeyword: "steel beam transport",
            secondaryKeywords: ["structural steel hauling", "long load escort", "steel girder transport"],
        },
    },
    {
        id: "wind-turbine",
        slug: "wind-turbine-transport",
        name: "Wind Turbine Components",
        tier: 1,
        category: "energy",
        aliases: {
            US: "Wind Turbine Components", CA: "Wind Turbine Components",
            AU: "Wind Turbine Components", GB: "Wind Farm Components",
            DE: "Windkraftanlagen", BR: "Componentes de Turbina Eólica",
        },
        escortRequirements: {
            minEscorts: 2, heightPoleRequired: true,
            policeRequired: true, routeSurveyRequired: true,
        },
        seo: {
            generatePages: true,
            primaryKeyword: "wind turbine transport",
            secondaryKeywords: ["wind turbine blade transport", "nacelle transport", "wind tower hauling"],
        },
    },
    {
        id: "boats-yachts",
        slug: "boat-transport",
        name: "Boats & Yachts",
        tier: 1,
        category: "marine",
        aliases: {
            US: "Boats & Yachts", CA: "Boats & Yachts",
            AU: "Boats & Vessels", GB: "Boats & Yachts",
            DE: "Boote & Yachten", BR: "Barcos e Iates",
        },
        escortRequirements: {
            minEscorts: 1, heightPoleRequired: true,
            policeRequired: false, routeSurveyRequired: false,
        },
        seo: {
            generatePages: true,
            primaryKeyword: "boat transport",
            secondaryKeywords: ["yacht transport", "boat hauling oversize", "marine vessel escort"],
        },
    },
];

// ── TIER 2: Industrial Equipment Types ──
export const TIER_2_INDUSTRIAL: EquipmentType[] = [
    {
        id: "refinery-modules", slug: "refinery-module-transport",
        name: "Refinery Modules", tier: 2, category: "energy",
        aliases: { US: "Refinery Modules", AU: "Process Modules", DE: "Raffinerie-Module" },
        escortRequirements: { minEscorts: 3, heightPoleRequired: true, policeRequired: true, routeSurveyRequired: true },
        seo: { generatePages: true, primaryKeyword: "refinery module transport", secondaryKeywords: ["process module hauling", "modular refinery transport"] },
    },
    {
        id: "pressure-vessels", slug: "pressure-vessel-transport",
        name: "Pressure Vessels", tier: 2, category: "energy",
        aliases: { US: "Pressure Vessels", AU: "Pressure Vessels", DE: "Druckbehälter" },
        escortRequirements: { minEscorts: 2, heightPoleRequired: true, policeRequired: true, routeSurveyRequired: true },
        seo: { generatePages: true, primaryKeyword: "pressure vessel transport", secondaryKeywords: ["reactor vessel hauling", "tank transport"] },
    },
    {
        id: "industrial-generators", slug: "generator-transport",
        name: "Industrial Generators", tier: 2, category: "energy",
        aliases: { US: "Industrial Generators", AU: "Power Generators", DE: "Industriegeneratoren" },
        escortRequirements: { minEscorts: 2, heightPoleRequired: true, policeRequired: true, routeSurveyRequired: true },
        seo: { generatePages: true, primaryKeyword: "generator transport", secondaryKeywords: ["power generator hauling", "industrial generator escort"] },
    },
    {
        id: "mining-equipment", slug: "mining-equipment-transport",
        name: "Mining Equipment", tier: 2, category: "heavy_equipment",
        aliases: { US: "Mining Equipment", AU: "Mining Machinery", ZA: "Mining Equipment", BR: "Equipamento de Mineração" },
        escortRequirements: { minEscorts: 2, heightPoleRequired: true, policeRequired: true, routeSurveyRequired: true },
        seo: { generatePages: true, primaryKeyword: "mining equipment transport", secondaryKeywords: ["haul truck transport", "mining machinery escort"] },
    },
    {
        id: "bridge-beams", slug: "bridge-beam-transport",
        name: "Bridge Beams", tier: 2, category: "construction",
        aliases: { US: "Bridge Beams", GB: "Bridge Sections", DE: "Brückenträger" },
        escortRequirements: { minEscorts: 2, heightPoleRequired: true, policeRequired: true, routeSurveyRequired: true },
        seo: { generatePages: true, primaryKeyword: "bridge beam transport", secondaryKeywords: ["bridge girder escort", "precast bridge hauling"] },
    },
    {
        id: "precast-concrete", slug: "precast-concrete-transport",
        name: "Precast Concrete", tier: 2, category: "construction",
        aliases: { US: "Precast Concrete", AU: "Precast Panels", DE: "Betonfertigteile" },
        escortRequirements: { minEscorts: 1, heightPoleRequired: true, policeRequired: false, routeSurveyRequired: false },
        seo: { generatePages: true, primaryKeyword: "precast concrete transport", secondaryKeywords: ["concrete panel hauling", "precast beam escort"] },
    },
];

// ── TIER 3: Specialized Equipment Types ──
export const TIER_3_SPECIALIZED: EquipmentType[] = [
    {
        id: "aerospace", slug: "aerospace-transport",
        name: "Aerospace Components", tier: 3, category: "defense",
        aliases: { US: "Aerospace Components", GB: "Aerospace Parts" },
        escortRequirements: { minEscorts: 3, heightPoleRequired: true, policeRequired: true, routeSurveyRequired: true },
        seo: { generatePages: true, primaryKeyword: "aerospace component transport", secondaryKeywords: ["aircraft fuselage transport", "rocket component hauling"] },
    },
    {
        id: "defense-logistics", slug: "defense-transport",
        name: "Defense Logistics", tier: 3, category: "defense",
        aliases: { US: "Defense Logistics", GB: "MoD Transport" },
        escortRequirements: { minEscorts: 3, heightPoleRequired: true, policeRequired: true, routeSurveyRequired: true },
        seo: { generatePages: false, primaryKeyword: "defense logistics transport", secondaryKeywords: [] },
    },
    {
        id: "energy-modules", slug: "energy-module-transport",
        name: "Energy Modules", tier: 3, category: "energy",
        aliases: { US: "Energy Modules", AU: "Energy Infrastructure", DE: "Energiemodule" },
        escortRequirements: { minEscorts: 2, heightPoleRequired: true, policeRequired: true, routeSurveyRequired: true },
        seo: { generatePages: true, primaryKeyword: "energy module transport", secondaryKeywords: ["solar module hauling", "pipeline module escort"] },
    },
    {
        id: "oversized-tanks", slug: "tank-transport",
        name: "Oversized Tanks", tier: 3, category: "energy",
        aliases: { US: "Oversized Tanks", AU: "Large Tanks", DE: "Großtanks" },
        escortRequirements: { minEscorts: 2, heightPoleRequired: true, policeRequired: true, routeSurveyRequired: true },
        seo: { generatePages: true, primaryKeyword: "oversized tank transport", secondaryKeywords: ["storage tank hauling", "tank vessel escort"] },
    },
    {
        id: "rail-equipment", slug: "rail-equipment-transport",
        name: "Rail Equipment", tier: 3, category: "infrastructure",
        aliases: { US: "Rail Equipment", GB: "Railway Components", DE: "Schienenfahrzeuge" },
        escortRequirements: { minEscorts: 2, heightPoleRequired: true, policeRequired: true, routeSurveyRequired: true },
        seo: { generatePages: true, primaryKeyword: "rail equipment transport", secondaryKeywords: ["locomotive transport", "railcar hauling"] },
    },
];

// ── Combined taxonomy ──
export const ALL_EQUIPMENT_TYPES: EquipmentType[] = [
    ...TIER_1_CORE,
    ...TIER_2_INDUSTRIAL,
    ...TIER_3_SPECIALIZED,
];

/** Get equipment by slug (for route matching) */
export function getEquipmentBySlug(slug: string): EquipmentType | undefined {
    return ALL_EQUIPMENT_TYPES.find(e => e.slug === slug);
}

/** Get localized equipment name */
export function getLocalizedName(equipment: EquipmentType, countryIso2: string): string {
    return equipment.aliases[countryIso2] ?? equipment.name;
}

/** Get tier label */
export function getTierLabel(tier: 1 | 2 | 3): string {
    switch (tier) {
        case 1: return "Core";
        case 2: return "Industrial";
        case 3: return "Specialized";
    }
}
