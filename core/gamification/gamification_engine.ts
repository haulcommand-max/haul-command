/**
 * GamificationEngine
 * Rewards drivers for providing ground-truth "Route Intelligence."
 */

export interface DriverStats {
    driverId: string;
    points: number;
    badgeLevel: 'ROOKIE' | 'SCOUTER' | 'ELITE' | 'MASTER_SCOUT';
    verificationsCount: number;
}

export class GamificationEngine {
    /**
     * Calculates points for a hazard report.
     * Permanent hazards (Bridges/Wires) worth more than temporary (Scales).
     */
    calculateReward(hazardType: string, isFirstReporter: boolean): number {
        let points = 20;

        if (hazardType === 'low_wire' || hazardType === 'bridge_clearance') {
            points += 100; // High value proprietary data
        }

        if (isFirstReporter) {
            points *= 2; // Bonus for being the scout
        }

        return points;
    }

    /**
     * Checks for badge rank-ups matches.
     */
    checkBadgeRank(stats: DriverStats): string {
        if (stats.verificationsCount > 100) return 'MASTER_SCOUT';
        if (stats.verificationsCount > 50) return 'ELITE';
        if (stats.verificationsCount > 10) return 'SCOUTER';
        return 'ROOKIE';
    }
}
