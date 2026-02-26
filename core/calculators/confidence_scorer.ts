
export interface ConfidenceRequest {
    miles?: number;
    width?: number;
    height?: number;
    length?: number;
    shipDate?: string; // or Date object
    timeWindow?: string;

    positions?: {
        leadCount?: number;
        chaseCount?: number;
        highPoleCount?: number;
        steerCount?: number;
    };

    permitRouteKnown: boolean;
    nightOps?: boolean;
    weekend?: boolean;
    afterHours?: boolean;

    policeRequired?: boolean;
    policeHours?: number;

    surveyRequired?: boolean;
    surveyMode?: string;

    originCity?: string;
    originZip?: string;
    destCity?: string;
    sourceState?: string;
    destState?: string;

    specialNotes?: string;
}

export interface ConfidenceResult {
    score: number;
    label: 'High' | 'Medium' | 'Low';
    suggestions: string[];
}

export class ConfidenceScorer {
    public static calculate(req: ConfidenceRequest): ConfidenceResult {
        let score = 100;
        const suggestions: string[] = [];

        // --- Core Completeness (60 pts) ---

        // Missing Miles (-15)
        if (!req.miles || req.miles <= 0) {
            score -= 15;
            suggestions.push("Add estimated miles");
        }

        // Missing Dims (-10 each, max -30)
        let dimDeduction = 0;
        if (!req.width) dimDeduction += 10;
        if (!req.height) dimDeduction += 10;
        if (!req.length) dimDeduction += 10;
        dimDeduction = Math.min(dimDeduction, 30);
        score -= dimDeduction;
        if (dimDeduction > 0) suggestions.push("Add dimensions (W/H/L) for accurate sizing");

        // Missing Ship Date / Window (-10)
        if (!req.shipDate && !req.timeWindow) {
            score -= 10;
            suggestions.push("Add ship date or travel window");
        }

        // Missing Positions (-15)
        // Check if at least one position is defined and > 0
        const hasPositions = req.positions && (
            (req.positions.leadCount || 0) > 0 ||
            (req.positions.chaseCount || 0) > 0 ||
            (req.positions.highPoleCount || 0) > 0 ||
            (req.positions.steerCount || 0) > 0
        );
        if (!hasPositions) {
            score -= 15;
            suggestions.push("Confirm escort positions required");
        }

        // --- Risk Flags (25 pts) ---

        // Permit Route Unknown (-10)
        if (!req.permitRouteKnown) {
            score -= 10;
            suggestions.push("Upload permit route / permit number");
        }

        // Timing Risk (-5)
        // Night/Weekend/AfterHours toggled but no details (Proxy: just checking flags for now)
        // If flags are true, we assume risk is present. Prompt implies "toggled but no details".
        // Since we just have booleans here, we can't fully check "details". 
        // We'll assume if they checked it, it's a risk factor unless validated elsewhere.
        // Simplifying: If complex timing active, deduct 5 to encourage verification.
        if (req.nightOps || req.weekend || req.afterHours) {
            // In a real form, we'd check if specific "Notes" about timing were added?
            // Let's stick to the prompt: "toggled but no details".
            // Use 'specialNotes' as proxy for details.
            if (!req.specialNotes || req.specialNotes.length < 5) {
                score -= 5;
                suggestions.push("Add notes for night/weekend travel");
            }
        }

        // Police Risk (-5)
        if (req.policeRequired && (!req.policeHours || req.policeHours <= 0)) {
            score -= 5;
            suggestions.push("Estimate police hours needed");
        }

        // Survey Risk (-5)
        if (req.surveyRequired && !req.surveyMode) {
            score -= 5;
            suggestions.push("Select route survey method");
        }

        // --- Data Quality Signals (15 pts) ---
        // Zip/City checks
        // If state is set but city/zip missing
        if (req.sourceState && (!req.originCity && !req.originZip)) {
            score -= 5;
        }

        // Multi-state Logic
        // If origin != dest state (multi-state), check if both defined
        if (req.sourceState && req.destState && req.sourceState !== req.destState) {
            // Implicitly good? Prompt: "Multi-state move but only 1 state entered"
            // If we only have 1 state but distance > 500?
            if (req.miles && req.miles > 500 && (!req.destState)) {
                score -= 5;
                suggestions.push("Confirm destination state for long-haul");
            }
        }

        // Clamp Score
        score = Math.max(15, Math.min(100, score));

        // Label
        let label: ConfidenceResult['label'] = 'Low';
        if (score >= 85) label = 'High';
        else if (score >= 65) label = 'Medium';

        return {
            score,
            label,
            suggestions: suggestions.slice(0, 3) // Top 3
        };
    }
}
