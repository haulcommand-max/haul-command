// lib/strategy/country-priority.ts
//
// Country Priority Scoring Engine
// Spec: HCOS-BREAKOUT-ACCELERATOR-01 / country_priority_engine
//
// Ranks all 52 countries by composite growth score.
// Outputs: Tier A/B/C/D buckets, install targets, resource allocation.

// ============================================================
// TYPES
// ============================================================

export interface CountryScore {
    country_iso2: string;
    country_name: string;
    tier: 'A' | 'B' | 'C' | 'D';
    rank: number;
    composite_score: number;
    breakdown: {
        demand: number;
        supply: number;
        market_size: number;
        competition_gap: number;
        monetization: number;
    };
    year1_install_target: number;
    install_share_pct: number;
}

// ============================================================
// WEIGHTS
// ============================================================

const WEIGHTS = {
    demand: 0.30,
    supply: 0.20,
    market_size: 0.20,
    competition_gap: 0.15,
    monetization: 0.15,
} as const;

// ============================================================
// TOP 10 HIT LIST (hardened scores from warplan)
// ============================================================

const COUNTRY_DATA: Array<{
    iso2: string;
    name: string;
    scores: { demand: number; supply: number; market_size: number; competition_gap: number; monetization: number };
    year1_target: number;
}> = [
        { iso2: 'US', name: 'United States', scores: { demand: 10.0, supply: 9.5, market_size: 10.0, competition_gap: 9.0, monetization: 10.0 }, year1_target: 420000 },
        { iso2: 'CA', name: 'Canada', scores: { demand: 9.0, supply: 8.5, market_size: 8.0, competition_gap: 9.5, monetization: 9.0 }, year1_target: 120000 },
        { iso2: 'AU', name: 'Australia', scores: { demand: 9.0, supply: 8.0, market_size: 7.5, competition_gap: 9.5, monetization: 9.5 }, year1_target: 90000 },
        { iso2: 'GB', name: 'United Kingdom', scores: { demand: 8.5, supply: 7.5, market_size: 8.0, competition_gap: 8.0, monetization: 9.5 }, year1_target: 80000 },
        { iso2: 'NZ', name: 'New Zealand', scores: { demand: 8.0, supply: 7.0, market_size: 5.0, competition_gap: 9.5, monetization: 9.0 }, year1_target: 45000 },
        { iso2: 'ZA', name: 'South Africa', scores: { demand: 7.5, supply: 6.0, market_size: 7.0, competition_gap: 8.5, monetization: 7.0 }, year1_target: 60000 },
        { iso2: 'DE', name: 'Germany', scores: { demand: 7.5, supply: 6.5, market_size: 8.0, competition_gap: 7.0, monetization: 8.0 }, year1_target: 50000 },
        { iso2: 'NL', name: 'Netherlands', scores: { demand: 7.0, supply: 6.0, market_size: 5.5, competition_gap: 8.0, monetization: 8.5 }, year1_target: 35000 },
        { iso2: 'AE', name: 'United Arab Emirates', scores: { demand: 7.0, supply: 5.5, market_size: 5.0, competition_gap: 8.5, monetization: 8.0 }, year1_target: 40000 },
        { iso2: 'BR', name: 'Brazil', scores: { demand: 7.0, supply: 5.0, market_size: 8.0, competition_gap: 7.0, monetization: 5.5 }, year1_target: 60000 },
        // Tier B countries
        { iso2: 'IE', name: 'Ireland', scores: { demand: 6.5, supply: 5.0, market_size: 3.5, competition_gap: 8.5, monetization: 8.0 }, year1_target: 0 },
        { iso2: 'SE', name: 'Sweden', scores: { demand: 6.0, supply: 5.0, market_size: 5.0, competition_gap: 7.5, monetization: 7.5 }, year1_target: 0 },
        { iso2: 'NO', name: 'Norway', scores: { demand: 6.0, supply: 5.0, market_size: 4.5, competition_gap: 7.5, monetization: 8.0 }, year1_target: 0 },
        { iso2: 'DK', name: 'Denmark', scores: { demand: 5.5, supply: 4.5, market_size: 4.0, competition_gap: 7.5, monetization: 7.5 }, year1_target: 0 },
        { iso2: 'FI', name: 'Finland', scores: { demand: 5.5, supply: 4.5, market_size: 4.0, competition_gap: 7.5, monetization: 7.0 }, year1_target: 0 },
        { iso2: 'BE', name: 'Belgium', scores: { demand: 6.0, supply: 4.5, market_size: 5.0, competition_gap: 7.0, monetization: 7.0 }, year1_target: 0 },
        { iso2: 'AT', name: 'Austria', scores: { demand: 5.5, supply: 4.5, market_size: 4.5, competition_gap: 7.0, monetization: 7.0 }, year1_target: 0 },
        { iso2: 'CH', name: 'Switzerland', scores: { demand: 5.5, supply: 4.0, market_size: 4.0, competition_gap: 7.5, monetization: 8.5 }, year1_target: 0 },
        { iso2: 'ES', name: 'Spain', scores: { demand: 6.0, supply: 4.5, market_size: 6.0, competition_gap: 7.0, monetization: 6.5 }, year1_target: 0 },
        { iso2: 'FR', name: 'France', scores: { demand: 6.5, supply: 5.0, market_size: 7.0, competition_gap: 6.5, monetization: 7.0 }, year1_target: 0 },
        { iso2: 'IT', name: 'Italy', scores: { demand: 6.0, supply: 4.5, market_size: 6.5, competition_gap: 6.5, monetization: 6.5 }, year1_target: 0 },
        { iso2: 'PT', name: 'Portugal', scores: { demand: 5.0, supply: 3.5, market_size: 3.5, competition_gap: 7.5, monetization: 6.5 }, year1_target: 0 },
        { iso2: 'PL', name: 'Poland', scores: { demand: 5.5, supply: 4.0, market_size: 5.5, competition_gap: 7.0, monetization: 5.5 }, year1_target: 0 },
        { iso2: 'CZ', name: 'Czech Republic', scores: { demand: 4.5, supply: 3.5, market_size: 3.5, competition_gap: 7.0, monetization: 5.5 }, year1_target: 0 },
        { iso2: 'SK', name: 'Slovakia', scores: { demand: 4.0, supply: 3.0, market_size: 2.5, competition_gap: 7.5, monetization: 5.0 }, year1_target: 0 },
        { iso2: 'HU', name: 'Hungary', scores: { demand: 4.5, supply: 3.5, market_size: 3.5, competition_gap: 7.0, monetization: 5.0 }, year1_target: 0 },
        { iso2: 'SI', name: 'Slovenia', scores: { demand: 3.5, supply: 2.5, market_size: 2.0, competition_gap: 7.5, monetization: 5.0 }, year1_target: 0 },
        { iso2: 'EE', name: 'Estonia', scores: { demand: 3.0, supply: 2.0, market_size: 1.5, competition_gap: 8.0, monetization: 6.0 }, year1_target: 0 },
        { iso2: 'LV', name: 'Latvia', scores: { demand: 3.0, supply: 2.0, market_size: 1.5, competition_gap: 8.0, monetization: 5.0 }, year1_target: 0 },
        { iso2: 'LT', name: 'Lithuania', scores: { demand: 3.5, supply: 2.5, market_size: 2.0, competition_gap: 7.5, monetization: 5.0 }, year1_target: 0 },
        { iso2: 'HR', name: 'Croatia', scores: { demand: 3.5, supply: 2.5, market_size: 2.0, competition_gap: 7.5, monetization: 5.0 }, year1_target: 0 },
        { iso2: 'RO', name: 'Romania', scores: { demand: 4.0, supply: 3.0, market_size: 3.5, competition_gap: 7.5, monetization: 4.5 }, year1_target: 0 },
        { iso2: 'BG', name: 'Bulgaria', scores: { demand: 3.5, supply: 2.5, market_size: 2.5, competition_gap: 7.5, monetization: 4.5 }, year1_target: 0 },
        { iso2: 'GR', name: 'Greece', scores: { demand: 4.5, supply: 3.0, market_size: 3.5, competition_gap: 7.0, monetization: 5.5 }, year1_target: 0 },
        { iso2: 'TR', name: 'Turkey', scores: { demand: 5.5, supply: 4.0, market_size: 6.0, competition_gap: 7.0, monetization: 5.0 }, year1_target: 0 },
        { iso2: 'SA', name: 'Saudi Arabia', scores: { demand: 6.5, supply: 4.0, market_size: 5.5, competition_gap: 8.0, monetization: 7.5 }, year1_target: 0 },
        { iso2: 'QA', name: 'Qatar', scores: { demand: 5.0, supply: 3.0, market_size: 2.5, competition_gap: 8.5, monetization: 8.0 }, year1_target: 0 },
        { iso2: 'KW', name: 'Kuwait', scores: { demand: 4.5, supply: 2.5, market_size: 2.0, competition_gap: 8.5, monetization: 7.5 }, year1_target: 0 },
        { iso2: 'OM', name: 'Oman', scores: { demand: 4.0, supply: 2.5, market_size: 2.0, competition_gap: 8.5, monetization: 6.5 }, year1_target: 0 },
        { iso2: 'BH', name: 'Bahrain', scores: { demand: 3.5, supply: 2.0, market_size: 1.5, competition_gap: 8.5, monetization: 7.0 }, year1_target: 0 },
        { iso2: 'SG', name: 'Singapore', scores: { demand: 5.0, supply: 3.5, market_size: 3.0, competition_gap: 7.5, monetization: 8.5 }, year1_target: 0 },
        { iso2: 'MY', name: 'Malaysia', scores: { demand: 5.0, supply: 3.5, market_size: 4.0, competition_gap: 7.5, monetization: 6.0 }, year1_target: 0 },
        { iso2: 'JP', name: 'Japan', scores: { demand: 5.5, supply: 3.0, market_size: 7.0, competition_gap: 5.0, monetization: 8.5 }, year1_target: 0 },
        { iso2: 'KR', name: 'South Korea', scores: { demand: 5.0, supply: 3.0, market_size: 5.5, competition_gap: 5.5, monetization: 7.5 }, year1_target: 0 },
        { iso2: 'CL', name: 'Chile', scores: { demand: 6.0, supply: 3.5, market_size: 3.0, competition_gap: 8.0, monetization: 6.0 }, year1_target: 0 },
        { iso2: 'MX', name: 'Mexico', scores: { demand: 6.5, supply: 4.5, market_size: 7.0, competition_gap: 7.0, monetization: 5.5 }, year1_target: 0 },
        { iso2: 'AR', name: 'Argentina', scores: { demand: 5.5, supply: 3.5, market_size: 5.0, competition_gap: 7.5, monetization: 4.0 }, year1_target: 0 },
        { iso2: 'CO', name: 'Colombia', scores: { demand: 5.5, supply: 3.0, market_size: 4.5, competition_gap: 7.5, monetization: 5.0 }, year1_target: 0 },
        { iso2: 'PE', name: 'Peru', scores: { demand: 5.0, supply: 3.0, market_size: 3.5, competition_gap: 8.0, monetization: 5.0 }, year1_target: 0 },
        { iso2: 'UY', name: 'Uruguay', scores: { demand: 3.5, supply: 2.0, market_size: 1.5, competition_gap: 8.5, monetization: 6.0 }, year1_target: 0 },
        { iso2: 'PA', name: 'Panama', scores: { demand: 4.5, supply: 2.5, market_size: 2.0, competition_gap: 8.5, monetization: 6.5 }, year1_target: 0 },
        { iso2: 'CR', name: 'Costa Rica', scores: { demand: 3.5, supply: 2.0, market_size: 1.5, competition_gap: 8.5, monetization: 5.5 }, year1_target: 0 },
    ];

// ============================================================
// SCORING
// ============================================================

function computeComposite(s: { demand: number; supply: number; market_size: number; competition_gap: number; monetization: number }): number {
    return (
        s.demand * WEIGHTS.demand +
        s.supply * WEIGHTS.supply +
        s.market_size * WEIGHTS.market_size +
        s.competition_gap * WEIGHTS.competition_gap +
        s.monetization * WEIGHTS.monetization
    );
}

function assignTier(score: number, rank: number): 'A' | 'B' | 'C' | 'D' {
    if (rank <= 10 && score >= 7.0) return 'A';
    if (rank <= 25 && score >= 5.0) return 'B';
    if (score >= 3.5) return 'C';
    return 'D';
}

// ============================================================
// PUBLIC API
// ============================================================

export function getCountryPriorityScores(): CountryScore[] {
    const scored = COUNTRY_DATA.map(c => ({
        ...c,
        composite: computeComposite(c.scores),
    }));

    scored.sort((a, b) => b.composite - a.composite);

    const totalTarget = 1000000;
    // Assign install targets: top 10 have explicit targets; rest get proportional share of remainder
    const top10Total = scored.slice(0, 10).reduce((s, c) => s + c.year1_target, 0);
    const remainder = totalTarget - top10Total;
    const remainingCountries = scored.slice(10);
    const remainingCompositeSum = remainingCountries.reduce((s, c) => s + c.composite, 0);

    return scored.map((c, i) => {
        const rank = i + 1;
        const tier = assignTier(c.composite, rank);
        const target = c.year1_target > 0
            ? c.year1_target
            : Math.round((c.composite / remainingCompositeSum) * remainder);

        return {
            country_iso2: c.iso2,
            country_name: c.name,
            tier,
            rank,
            composite_score: Math.round(c.composite * 100) / 100,
            breakdown: c.scores,
            year1_install_target: target,
            install_share_pct: Math.round((target / totalTarget) * 10000) / 100,
        };
    });
}

/**
 * Get Tier A countries only.
 */
export function getTierACountries(): CountryScore[] {
    return getCountryPriorityScores().filter(c => c.tier === 'A');
}

/**
 * Get top N countries.
 */
export function getTopCountries(n: number = 10): CountryScore[] {
    return getCountryPriorityScores().slice(0, n);
}
