
import { calculateUniquenessScore } from '@/lib/seo/content-engine';

/**
 * Module 10: Data Quality Scoring (SQS for SEO)
 * Module 11: Link Acquisition Targets
 */

// Module 10: SQS
export function calculatePageQualityScore(pageData: {
    providerCount: number;
    descriptionLength: number;
    hasImages: boolean;
    uniquenessMetrics: any;
}): number {
    let score = 0;

    // Content Depth (0.3)
    if (pageData.descriptionLength > 300) score += 0.3;
    else if (pageData.descriptionLength > 100) score += 0.15;

    // Data Density (0.3)
    if (pageData.providerCount > 5) score += 0.3;
    else if (pageData.providerCount > 0) score += 0.1;

    // Visuals (0.1)
    if (pageData.hasImages) score += 0.1;

    // Uniqueness (0.3)
    const uniqueness = calculateUniquenessScore(pageData.uniquenessMetrics);
    score += (uniqueness * 0.3);

    return parseFloat(score.toFixed(2));
}

export function getIndexingAction(pqs: number): 'INDEX' | 'LOW_PRIORITY' | 'NOINDEX' {
    if (pqs >= 0.75) return 'INDEX';
    if (pqs >= 0.50) return 'LOW_PRIORITY';
    return 'NOINDEX';
}

// Module 11: Link Targets
export const LINK_TARGETS = {
    'fl': [
        { name: 'Florida Trucking Association', url: 'https://floridatrucking.org' },
        { name: 'FDOT Permits', url: 'https://www.fdot.gov/maintenance/oversizeprofiles.shtm' }
    ],
    'tx': [
        { name: 'Texas Trucking Association', url: 'https://www.textrucking.com' },
        { name: 'TxDMV Oversize', url: 'https://www.txdmv.gov/motor-carriers/oversize-overweight-permits' }
    ],
    'national': [
        { name: 'SC&RA', url: 'https://www.scranet.org' },
        { name: 'Specialized Carriers & Rigging Association', url: 'https://www.scranet.org' }
    ]
};

export function getRecommendedAnchorText(brand: string, city: string, service: string): string[] {
    return [
        brand, // "Haul Command"
        `${brand} ${city}`, // "Haul Command Miami"
        `${service} in ${city}`, // "Pilot Car in Miami"
        `Verified ${service} Providers`, // "Verified Pilot Car Providers"
        `https://haulcommand.com/us/fl/miami` // Naked URL
    ];
}
