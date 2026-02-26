
export interface CalculationResult {
    instant: {
        estimated_value: string | number;
        summary: string;
        is_range: boolean;
    };
    pro: {
        detailed_breakdown: any[];
        actionable_insect: string;
        pdf_download_url?: string;
    };
}

/**
 * Configuration for a state's permit regulations
 */
export interface StateRegulation {
    state_code: string;
    width_limit: number;
    height_limit: number;
    length_limit: number;
    weight_limit: number;
    permit_fee_base: number;
    escort_requirements: {
        width_threshold: number;
        height_threshold: number;
        length_threshold: number;
        num_escorts_min: number;
        num_escorts_max: number;
    };
}

/**
 * Shared types for simple cost breakdowns
 */
export interface CostBreakdown {
    category: string;
    amount: number;
    notes?: string;
}
