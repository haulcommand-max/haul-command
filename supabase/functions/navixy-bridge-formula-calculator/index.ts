// ============================================================================
// SYSTEM 1 — BRIDGE FORMULA CALCULATOR (Pre-Compliance Engine)
// ============================================================================
// Logic:    Federal Bridge Formula B
//           W = 500 [ (LN / (N-1)) + 12N + 36 ]
// Inputs:   Axle Spacings (ft) and Weights (lbs)
// Output:   Compliance status + Violation details for every axle group
// Source:   23 CFR 658.17
// ============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/supabase-client.ts";
import type { BridgeFormulaInput, BridgeFormulaResult } from "../_shared/types.ts";

/**
 * Calculates the max allowed weight for a group of axles using Federal Bridge Formula B.
 * @param L Distance in feet between the outer axles of the group.
 * @param N Number of axles in the group.
 */
function calculateFormulaB(L: number, N: number): number {
    if (N < 2) return 0; // Invalid group
    // Formula: W = 500 [ (LN / (N-1)) + 12N + 36 ]
    // Result is rounded to nearest 500 lbs
    let W = 500 * ((L * N) / (N - 1) + 12 * N + 36);
    return Math.round(W / 500) * 500;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const input: BridgeFormulaInput = await req.json();

        // 1. Validate Input
        if (!input.spacings_ft || !input.weights_lbs || input.spacings_ft.length !== input.weights_lbs.length - 1) {
            throw new Error("Invalid input: Spacings array length must be (Axles - 1)");
        }

        const numAxles = input.weights_lbs.length;
        const totalWeight = input.weights_lbs.reduce((a, b) => a + b, 0);

        // Calculate cumulative distances from axle 1 (position 0)
        // Axle 1 is at 0.0
        const axlePositions: number[] = [0];
        let currentDist = 0;
        for (const spacing of input.spacings_ft) {
            currentDist += spacing;
            axlePositions.push(currentDist);
        }

        const totalWheelbase = currentDist;

        // 2. Initial Setup
        const result: BridgeFormulaResult = {
            is_compliant: true,
            total_weight_lbs: totalWeight,
            total_wheelbase_ft: totalWheelbase,
            max_formula_weight_lbs: 0, // Will be set to the limit for the full group (1-N)
            failed_groups: []
        };

        // 3. Iterate ALL Axle Groups (The "Inner Bridge" Check)
        // Group start index: i (0 to N-2)
        // Group end index: j (i+1 to N-1)

        for (let i = 0; i < numAxles; i++) {
            for (let j = i + 1; j < numAxles; j++) {
                const N = j - i + 1; // Number of axles in group
                const L = axlePositions[j] - axlePositions[i]; // Distance between outer axles

                // Calculate Actual Weight of this group
                let actualWeight = 0;
                for (let k = i; k <= j; k++) {
                    actualWeight += input.weights_lbs[k];
                }

                // Calculate Formula Limit
                const allowedWeight = calculateFormulaB(L, N);

                // Special Case: Gross Weight Limit (Federal is 80,000 usually, but Formula B applies)
                // For the full truck (i=0, j=last), strict Formula B is the baseline.
                // However, there is a hard cap of 80,000 for standard, but SUPERLOADS ignore the 80k cap 
                // and strictly follow the Bridge Formula (or state tables).

                // If checking standard compliance, cap at 80k (unless specific exceptions apply)
                // But since this is a "Bridge Formula Calculator", we return the Formula Limit.

                if (i === 0 && j === numAxles - 1) {
                    result.max_formula_weight_lbs = allowedWeight;
                }

                // Check Compliance
                if (actualWeight > allowedWeight) {
                    result.is_compliant = false;
                    result.failed_groups.push({
                        axles: `${i + 1}-${j + 1}`,
                        actual_weight: actualWeight,
                        allowed_weight: allowedWeight,
                        formula_code: "Federal Bridge Formula B"
                    });
                }
            }
        }

        // 4. Federal Exception Logic (Common Exception)
        // Two consecutive sets of tandem axles may carry 34,000 pounds each 
        // if the overall distance between the first and last axles of these tandems is 36 feet or more.
        // (Simplified implementation for MVP — exact logic is complex)

        // 5. Return Result
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err) {
        return new Response(
            JSON.stringify({ error: (err as Error).message }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
