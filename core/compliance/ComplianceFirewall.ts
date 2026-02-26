import { uib } from '../intelligence/IntelligenceBus';
import { EquipmentAlerts } from './EquipmentAlerts';

export class ComplianceFirewall {
    /**
     * "Bridge Hit Preventer" & "Shutdown Trap Defender"
     * Verifies route adherence and proactively alerts on state-specific compliance risks.
     */

    async verifyRouteAdherence(surveyId: string, plannedRouteGeoJSON: any, actualGpsPoints: any[]): Promise<boolean> {
        console.log(`[ComplianceFirewall] Verifying Survey ${surveyId}`);

        // 1. Route Deviation Check
        const deviation = this.calculateDeviation(plannedRouteGeoJSON, actualGpsPoints);
        if (deviation > 50) { // Meters
            console.warn(`[ComplianceFirewall] Survey Failed. Deviation: ${deviation}m`);
            return false;
        }

        // 2. Proactive Shutdown Trap Checks (NY, FL, etc.)
        await this.checkShutdownTraps(plannedRouteGeoJSON);

        uib.emitSignal({
            id: `SIG-${Date.now()}`,
            type: 'NAV-S',
            source: 'COMPLIANCE_FIREWALL',
            timestamp: Date.now(),
            hash: 'hash-abc',
            sqs: 95,
            priority: 'HIGH',
            payload: {
                status: 'ROUTE_VERIFIED',
                survey_id: surveyId,
                deviation_meters: deviation
            }
        });

        return true;
    }

    private async checkShutdownTraps(route: any) {
        // Extract states from route (Mock logic for now - assuming destination is in route properties)
        const destinationState = route.properties?.destination_state || 'NY'; // Default to NY for testing
        // Pass destinationState as a missing permit so MISSING_* alerts (LA, NV, KS) are included
        const missingPermits = route.properties?.missing_permits ?? [destinationState];

        const alerts = EquipmentAlerts.getAlertsForState(destinationState, missingPermits);

        for (const alert of alerts) {
            EquipmentAlerts.emitComplianceSignal(alert);
            console.log(`[ComplianceFirewall] Shutdown Trap Alert: ${alert.message}`);
        }
    }

    private calculateDeviation(plan: any, points: any[]): number {
        // Mock: Return 0 for now
        return 0;
    }
}

