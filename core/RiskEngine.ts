
/**
 * Haul Command Risk Engine (The "Actuarial Brain")
 * Calculates Risk Scores for Route Segments.
 */

interface RiskSegment {
    id: string;
    load_height_in: number;
    bridge_clearance_in?: number;
    wind_gust_mph: number;
    exposure_level: number;
    is_curfew_active: boolean;
    hazard_count: number;
    segment_length_miles: number;
}

export class RiskEngine {

    /**
     * Calculate Total Route Risk
     */
    static calculateRouteRisk(segments: RiskSegment[]): number {
        let weightedSum = 0;
        let totalLength = 0;

        for (const segment of segments) {
            const risk = this.calculateSegmentRisk(segment);
            weightedSum += risk * segment.segment_length_miles;
            totalLength += segment.segment_length_miles;
        }

        return totalLength > 0 ? Math.round(weightedSum / totalLength) : 0;
    }

    /**
     * Calculate Single Segment Risk (0-100)
     */
    private static calculateSegmentRisk(segment: RiskSegment): number {
        // 1. Clearance Risk
        let clearanceRisk = 0;
        if (segment.bridge_clearance_in) {
            const delta = segment.load_height_in - segment.bridge_clearance_in;
            if (delta >= 0) clearanceRisk = 100; // IMPACT
            else if (delta >= -3) clearanceRisk = 80; // CRITICAL
            else if (delta >= -6) clearanceRisk = 40; // WARNING
            else clearanceRisk = 10;
        }

        // 2. Wind Risk
        let windRisk = 0;
        if (segment.wind_gust_mph >= 35 && segment.load_height_in > 180) windRisk = 90;
        else if (segment.wind_gust_mph >= 30) windRisk = 70;
        else if (segment.wind_gust_mph >= 25) windRisk = 40;
        else windRisk = 10;

        windRisk = windRisk * (segment.exposure_level / 3); // Multiplier

        // 3. Curfew Risk
        const curfewRisk = segment.is_curfew_active ? 80 : 0;

        // 4. Hazard Risk
        const hazardRisk = Math.min(100, segment.hazard_count * 10);

        // Final Weighting
        const total =
            (0.35 * clearanceRisk) +
            (0.25 * windRisk) +
            (0.20 * curfewRisk) +
            (0.20 * hazardRisk);

        return Math.min(100, total);
    }
}
