
import { CostBreakdown, StateRegulation } from './types';

// Mock database of state permit regulations (would be in DB in production)
// This is a simplified subset for the MVP calculator
const STATE_REGULATIONS: Record<string, StateRegulation> = {
    'TX': {
        state_code: 'TX',
        width_limit: 8.5, // feet
        height_limit: 14.0, // feet (legal height)
        length_limit: 65.0, // feet
        weight_limit: 80000, // lbs
        permit_fee_base: 60,
        escort_requirements: {
            width_threshold: 14.0,
            height_threshold: 17.0,
            length_threshold: 100.0,
            num_escorts_min: 1,
            num_escorts_max: 3
        }
    },
    'OK': {
        state_code: 'OK',
        width_limit: 8.5,
        height_limit: 13.5,
        length_limit: 65.0,
        weight_limit: 80000,
        permit_fee_base: 40,
        escort_requirements: {
            width_threshold: 12.0,
            height_threshold: 16.0,
            length_threshold: 80.0,
            num_escorts_min: 1,
            num_escorts_max: 2
        }
    },
    'LA': {
        state_code: 'LA',
        width_limit: 8.5,
        height_limit: 14.0, // 13.5 on non-interstate
        length_limit: 65.0,
        weight_limit: 80000,
        permit_fee_base: 50,
        escort_requirements: {
            width_threshold: 12.0,
            height_threshold: 15.5,
            length_threshold: 90.0,
            num_escorts_min: 1,
            num_escorts_max: 2
        }
    }
    // Add more states as needed
};

export interface LoadDimensions {
    width: number;
    height: number;
    length: number;
    weight: number;
}

export interface PermitCheckResult {
    requires_permit: boolean;
    estimated_cost: number;
    flags: string[];
    escorts_required: boolean;
    escort_count_est: number;
    critical_warning?: string;
}

/**
 * Checks permit requirements for a single state based on dimensions
 */
export function checkStatePermit(stateCode: string, dims: LoadDimensions): PermitCheckResult {
    const state = STATE_REGULATIONS[stateCode];

    if (!state) {
        return {
            requires_permit: true, // Safety fallback
            estimated_cost: 0,
            flags: ['State data not available - manual verification required'],
            escorts_required: true,
            escort_count_est: 0,
            critical_warning: `Regulation data missing for ${stateCode}`
        };
    }

    const flags: string[] = [];
    let requires_permit = false;
    let estimated_cost = 0;
    let escorts_required = false;
    let escort_count_est = 0;

    // 1. Check Dimensions
    if (dims.width > state.width_limit) {
        requires_permit = true;
        flags.push(`Overwidth: ${dims.width}' > ${state.width_limit}'`);
    }
    if (dims.height > state.height_limit) {
        requires_permit = true;
        flags.push(`Overheight: ${dims.height}' > ${state.height_limit}'`);
    }
    if (dims.length > state.length_limit) {
        requires_permit = true;
        flags.push(`Overlength: ${dims.length}' > ${state.length_limit}'`);
    }
    if (dims.weight > state.weight_limit) {
        requires_permit = true;
        flags.push(`Overweight: ${dims.weight}lbs > ${state.weight_limit}lbs`);
    }

    // 2. Calculate Cost (Simplified logic)
    if (requires_permit) {
        estimated_cost = state.permit_fee_base;
        // Add weight surcharges if applicable (mock logic)
        if (dims.weight > 120000) estimated_cost += 50;
        if (dims.weight > 160000) estimated_cost += 150;
    }

    // 3. Check Escort Requirements
    if (
        dims.width >= state.escort_requirements.width_threshold ||
        dims.height >= state.escort_requirements.height_threshold ||
        dims.length >= state.escort_requirements.length_threshold
    ) {
        escorts_required = true;
        escort_count_est = state.escort_requirements.num_escorts_min;

        // Superload check
        if (dims.width > 16 || dims.height > 16 || dims.weight > 180000) {
            escort_count_est = state.escort_requirements.num_escorts_max;
            flags.push('SUPERLOAD CLASSIFICATION LIKELY');
        }

        flags.push(`Escorts Required (Est. ${escort_count_est})`);
    }

    return {
        requires_permit,
        estimated_cost,
        flags,
        escorts_required,
        escort_count_est
    };
}

/**
 * Batch check for a route (list of states)
 */
export function checkRoutePermits(states: string[], dims: LoadDimensions) {
    const results: Record<string, PermitCheckResult> = {};
    let total_cost_est = 0;
    let max_escorts = 0;

    for (const state of states) {
        const res = checkStatePermit(state, dims);
        results[state] = res;
        total_cost_est += res.estimated_cost;
        max_escorts = Math.max(max_escorts, res.escort_count_est);
    }

    return {
        breakdown: results,
        total_permit_cost_est: total_cost_est,
        max_escorts_needed: max_escorts,
        summary: `Route through ${states.join(', ')} requires approx $${total_cost_est} in permits.`
    };
}
