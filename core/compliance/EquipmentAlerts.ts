import { uib } from '../intelligence/IntelligenceBus';

export interface ShutdownAlert {
    state: string;
    type: 'EQUIPMENT' | 'PERMIT' | 'INSPECTION' | 'VEHICLE';
    severity: 'CRITICAL' | 'WARNING';
    message: string;
    actionLink?: string;
    trigger: string;
}

export class EquipmentAlerts {
    private static readonly TRAPS: ShutdownAlert[] = [
        {
            state: 'NY',
            type: 'EQUIPMENT',
            severity: 'CRITICAL',
            message: 'NY Mandatory: 43"-52" Light Bar & 10lb (Class 5 BC) Fire Extinguisher required.',
            trigger: 'DESTINATION_NY'
        },
        {
            state: 'NY',
            type: 'VEHICLE',
            severity: 'CRITICAL',
            message: 'NY Restriction: Minimum 100" wheelbase required for escort vehicles.',
            trigger: 'WHEELBASE_CHECK'
        },
        {
            state: 'NY',
            type: 'EQUIPMENT',
            severity: 'WARNING',
            message: 'NY Required: "Mobile Home Escort" or "Oversize Load" insignia decals.',
            trigger: 'DESTINATION_NY'
        },
        {
            state: 'FL',
            type: 'EQUIPMENT',
            severity: 'CRITICAL',
            message: 'Florida Mandatory: 36-inch reflective cones required for all escort vehicles.',
            trigger: 'GEOFENCE_FL'
        },
        {
            state: 'LA',
            type: 'PERMIT',
            severity: 'CRITICAL',
            message: 'Louisiana Escort Permit required ($10/yr). Verify valid $500k GL on board.',
            actionLink: 'https://permittest.dotd.la.gov/LAEscortPermit',
            trigger: 'MISSING_PERMIT_LA'
        },
        {
            state: 'NV',
            type: 'PERMIT',
            severity: 'WARNING',
            message: 'Nevada Amber Light Permit required ($2/yr).',
            actionLink: 'https://dmv.nv.gov/pdfforms/mt301.pdf',
            trigger: 'MISSING_PERMIT_NV'
        },
        {
            state: 'KS',
            type: 'PERMIT',
            severity: 'WARNING',
            message: 'Kansas K-TRIPS registration required.',
            actionLink: 'https://www.k-trips.com/',
            trigger: 'MISSING_REG_KS'
        },
        {
            state: 'UT',
            type: 'INSPECTION',
            severity: 'CRITICAL',
            message: 'Mandatory Port of Entry stop. Fiberglass height pole audit expected.',
            trigger: 'GEOFENCE_UT_POE'
        },
        {
            state: 'NM',
            type: 'INSPECTION',
            severity: 'CRITICAL',
            message: 'Mandatory Port of Entry stop. Equipment checklist enforcement high.',
            trigger: 'GEOFENCE_NM_POE'
        }
    ];

    static checkNYCompliance(wheelbase: number): { compliant: boolean; error?: string } {
        if (wheelbase < 100) {
            return {
                compliant: false,
                error: 'Vehicle wheelbase is less than 100 inches. NY Loads are prohibited.'
            };
        }
        return { compliant: true };
    }

    static getAlertsForState(state: string, missingPermits: string[] = []): ShutdownAlert[] {
        return this.TRAPS.filter(trap => {
            if (trap.state !== state) return false;
            if (trap.trigger.startsWith('MISSING_') && !missingPermits.includes(trap.state)) return false;
            return true;
        });
    }

    static emitComplianceSignal(alert: ShutdownAlert) {
        uib.emitSignal({
            id: `SIG-SHUTDOWN-${Date.now()}-${alert.state}`,
            type: 'COM-S',
            source: 'EQUIPMENT_ALERTS',
            timestamp: Date.now(),
            hash: 'sh-trap-1',
            sqs: 100,
            priority: alert.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
            payload: {
                ...alert,
                action: 'SHUTDOWN_PREVENTION'
            }
        });
    }
}
