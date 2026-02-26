/**
 * HazardAPIResponse
 * The data product sold to logistics giants and permit companies.
 * This is the high-margin "B2B Data Sale" layer.
 */

export interface B2B_HazardFeed {
    jurisdiction: string;
    activeHazards: Array<{
        type: 'SCALE' | 'HEIGHT' | 'CHOKE_POINT';
        lat: number;
        lng: number;
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
        verifiedAt: string;
        description: string;
    }>;
    riskScore: number; // Proprietary calculation
}

export class DataMoatProduct {
    /**
     * Packages the live data for a specific route.
     */
    async getRouteRiskProfile(startLat: number, startLng: number, endLat: number, endLng: number): Promise<B2B_HazardFeed> {
        // Spatial query finding hazards along the line string
        return {
            jurisdiction: "TX-LA Corridor",
            activeHazards: [
                {
                    type: 'HEIGHT',
                    lat: 31.7619,
                    lng: -106.4850,
                    severity: 'HIGH',
                    verifiedAt: new Date().toISOString(),
                    description: "Low hanging communication wire confirmed by 3 high poles."
                }
            ],
            riskScore: 88 // High risk due to height strikes
        };
    }
}
