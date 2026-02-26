
/**
 * Hard Metro Mode: Houston & Tier 1 Cities
 * Purpose: Extreme density and specificity for high-competition zones.
 */

export const HARD_METROS = ['houston', 'chicago', 'los-angeles', 'atlanta'] as const;
export type HardMetroSlug = typeof HARD_METROS[number];

type MetroConfig = {
    key: HardMetroSlug;
    city: string;
    state: string;
    landmarks: string[];
    corridors: string[];
    minDensity: number;
    uniquenessThreshold: number;
};

export const METRO_CONFIGS: Record<HardMetroSlug, MetroConfig> = {
    'houston': {
        key: 'houston',
        city: 'Houston',
        state: 'TX',
        landmarks: [
            'Port of Houston',
            'Houston Rail Yards',
            'I-10 Corridor',
            'I-45 Corridor',
            'Beltway 8',
            'US-59/I-69'
        ],
        corridors: ['i-10', 'i-45', 'us-59'],
        minDensity: 8,
        uniquenessThreshold: 0.72
    },
    'chicago': {
        key: 'chicago',
        city: 'Chicago',
        state: 'IL',
        landmarks: ['O\'Hare Freight Zone', 'I-90', 'I-94', 'I-80/I-294'],
        corridors: ['i-90', 'i-80'],
        minDensity: 10,
        uniquenessThreshold: 0.75
    },
    'los-angeles': {
        key: 'los-angeles',
        city: 'Los Angeles',
        state: 'CA',
        landmarks: ['Port of Long Beach', 'I-5', 'I-405', 'I-710'],
        corridors: ['i-5', 'i-10'],
        minDensity: 12,
        uniquenessThreshold: 0.80
    },
    'atlanta': {
        key: 'atlanta',
        city: 'Atlanta',
        state: 'GA',
        landmarks: ['Hartsfield Cargo', 'I-285 Perimeter', 'I-75', 'I-85'],
        corridors: ['i-75', 'i-85'],
        minDensity: 8,
        uniquenessThreshold: 0.70
    }
};

export function isHardMetro(citySlug: string): boolean {
    return HARD_METROS.includes(citySlug as HardMetroSlug);
}

export function getHardMetroConfig(citySlug: string): MetroConfig | undefined {
    return METRO_CONFIGS[citySlug as HardMetroSlug];
}

export function applyDensityGate(citySlug: string, providerCount: number): 'INDEX' | 'NOINDEX' | 'INDEX_HUB_ONLY' {
    const config = getHardMetroConfig(citySlug);
    if (!config) return 'INDEX'; // Default behavior for non-hard metros

    if (providerCount >= config.minDensity) return 'INDEX';
    // For hard metros, we don't want to burn budget on thin pages.
    // Index the main city Hub, but maybe not the service sub-pages if thin.
    return 'INDEX_HUB_ONLY';
}
