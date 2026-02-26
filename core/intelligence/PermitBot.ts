import { uib } from './IntelligenceBus';
import registry from './provider_registry.json';

interface PermitRequest {
    state: string; // 'FL', 'TX', 'GA', etc.
    loadDims: { h: number, w: number, l: number, gw: number };
    routeStr: string;
    startDate: string;
}

export class PermitBot {

    public static async apply(req: PermitRequest) {
        console.log(`[PERMIT BOT] Initiating filing for ${req.state} (Dims: ${req.loadDims.w}x${req.loadDims.h})`);

        // 1. Portal Selector Logic
        const portal = this.selectPortal(req.state);

        // 2. RPA Execution (Mock)
        // In real life, this would fire a Playwright/Puppeteer script
        const submissionId = `perm-sub-${req.state}-${Date.now()}`;

        console.log(`[PERMIT BOT] RPA Success. Submitted via ${portal}. Ref: ${submissionId}`);

        // 3. Emit NAV-S (Navigation/Permit Signal)
        uib.emitSignal({
            id: `nav-${Date.now()}`,
            type: 'NAV-S', // Automation Signal
            source: 'bot-permit-allocator',
            payload: {
                reqId: submissionId,
                status: 'SUBMITTED',
                state: req.state,
                etaHours: 4 // Mock ETA
            },
            hash: 'sha256-placeholder',
            timestamp: Date.now(),
            sqs: 1.0 // Bot actions are high trust
        });

        return { status: 'SUBMITTED', ref: submissionId };
    }

    private static selectPortal(state: string) {
        // 1. Check US Portals
        const usPortals: any = registry.networks.state_portals.US;
        if (usPortals[state]) return usPortals[state];

        // 2. Check Canadian Portals
        const caPortals: any = registry.networks.state_portals.Canada;
        if (caPortals[state]) return caPortals[state];

        // 3. Fallback logic
        if (['ON', 'BC', 'AB', 'SK', 'MB', 'QC'].includes(state)) {
            return "https://www.heavyhaul.net/canada-oversize-permits/"; // Generic CA fallback
        }

        // Default to Federal/Generic
        return usPortals.federal || 'GENERIC-PORTAL-RPA';
    }

    private static determineComplexity(req: PermitRequest): 'AUTO' | 'MANUAL_REVIEW' {
        // Simple heuristic: Height > 16ft is usually superload
        if (req.loadDims.h > 16 || req.loadDims.w > 16) return 'MANUAL_REVIEW';
        return 'AUTO';
    }
}
