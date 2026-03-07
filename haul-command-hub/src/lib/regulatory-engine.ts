import statesMaster from '../data/states_master.json';
import policeEscort from '../data/police_escort.json';
import equipmentSpecs from '../data/equipment_specs.json';
import superloadMatrix from '../data/superload_matrix.json';
import movementChecker from '../data/movement_checker.json';
import cityOverrides from '../data/city_county_overrides.json';

export interface StateRule {
    state: string;
    slug: string;
    permit_authority: string;
    permit_portal_url: string;
    escort_trigger_width_1: number;
    escort_trigger_width_2: number;
    height_trigger_escort: number;
    height_trigger_survey: number;
    length_trigger: number;
    superload_threshold_width: number;
    superload_threshold_weight: number;
    night_movement: string;
    weekend_movement: string;
    major_metro_curfew: string;
    police_scheduling_authority: string;
    p_evo_required: string;
    reciprocity_notes: string;
    height_pole_required: string;
    sign_spec_link: string;
    light_spec_link: string;
    risk_score_base: number;
    last_verified_date: string;
}

export function getAllStates(): StateRule[] {
    return statesMaster as StateRule[];
}

export function getStateBySlug(slug: string): StateRule | undefined {
    return (statesMaster as StateRule[]).find(s => s.slug === slug);
}

export function getPoliceInfo(stateName: string) {
    return (policeEscort as any[]).find(p => p.state === stateName);
}

export function getEquipmentSpecs(stateName: string) {
    return (equipmentSpecs as any[]).find(e => e.state === stateName);
}

export function getSuperloadInfo(stateName: string) {
    return (superloadMatrix as any[]).find(s => s.state_province === stateName);
}

export function getCityOverride(stateName: string, cityName: string) {
    return (cityOverrides as any[]).find(c => c.state === stateName && c.city_county.toLowerCase() === cityName.toLowerCase());
}

export interface MovementInput {
    stateSlug: string;
    width: number;
    height: number;
    length: number;
    isFriday: boolean;
    isMetro: boolean;
    cityName?: string;
}

export interface MovementOutput {
    escortsRequired: number;
    policeRequired: boolean;
    heightPoleRequired: boolean;
    riskScore: number;
    riskLevel: string;
    riskColor: string;
    policeProbabilityPct: number;
    utilityCoordinationPct: number;
    engineeringReviewPct: number;
    permitDelayDays: string;
}

export function calculateMovementRisk(input: MovementInput): MovementOutput | undefined {
    const state = getStateBySlug(input.stateSlug);
    if (!state) return undefined;

    let score = state.risk_score_base;
    let escorts = 0;
    let police = false;
    let heightPole = false;

    // Escort calculation (Width)
    if (input.width >= state.escort_trigger_width_2) {
        escorts = 2;
    } else if (input.width >= state.escort_trigger_width_1) {
        escorts = 1;
    }

    // Police Trigger
    if (input.width >= state.superload_threshold_width) {
        police = true;
        score += movementChecker.risk_multipliers.police_required;
    }

    // Height Pole
    if (input.height >= state.height_trigger_escort) {
        heightPole = true;
    }

    // Multipliers
    if (input.isFriday) score += movementChecker.risk_multipliers.friday;
    if (input.isMetro) score += movementChecker.risk_multipliers.metro;
    if (input.width >= state.superload_threshold_width) score += movementChecker.risk_multipliers.superload;

    // City Overrides
    if (input.cityName) {
        const override = getCityOverride(state.state, input.cityName);
        if (override) {
            score += override.risk_score_override || 0;
            if (override.police_override === "Yes") police = true;
        }
    }

    // Risk Level
    let level = "Low Risk";
    let color = movementChecker.score_levels.low.color;

    if (score >= movementChecker.score_levels.high.range[0]) {
        level = movementChecker.score_levels.high.label;
        color = movementChecker.score_levels.high.color;
    } else if (score >= movementChecker.score_levels.medium.range[0]) {
        level = movementChecker.score_levels.medium.label;
        color = movementChecker.score_levels.medium.color;
    }

    // Compute secondary indicators from superload matrix + state data
    const superloadInfo = getSuperloadInfo(state.state);
    const isSuperload = input.width >= state.superload_threshold_width;

    // Police probability: based on width vs trigger thresholds
    let policeProbPct = 0;
    if (police) policeProbPct = 95;
    else if (input.width >= state.escort_trigger_width_2) policeProbPct = 60;
    else if (input.width >= state.escort_trigger_width_1) policeProbPct = 25;
    if (input.isMetro && policeProbPct > 0) policeProbPct = Math.min(99, policeProbPct + 15);

    // Utility coordination: based on height (overhead clearance) + superload flag
    let utilityPct = 0;
    if (input.height >= state.height_trigger_survey) utilityPct = 85;
    else if (input.height >= state.height_trigger_escort) utilityPct = 55;
    else if (input.height >= 14) utilityPct = 25;
    if (superloadInfo?.utility_escort_required === 'Yes') utilityPct = Math.max(utilityPct, 90);
    else if (superloadInfo?.utility_escort_required === 'Conditional') utilityPct = Math.max(utilityPct, 65);

    // Engineering review: based on superload status and weight
    let engReviewPct = 0;
    if (isSuperload) engReviewPct = 90;
    else if (input.width >= state.escort_trigger_width_2) engReviewPct = 50;
    else if (input.width >= state.escort_trigger_width_1) engReviewPct = 15;
    if (superloadInfo?.engineering_review_required === 'Yes') engReviewPct = Math.max(engReviewPct, 85);

    // Permit delay from superload data
    const permitDelay = isSuperload && superloadInfo?.typical_lead_time
        ? superloadInfo.typical_lead_time
        : isSuperload ? '7-14 Business Days' : '3-5 Business Days';

    return {
        escortsRequired: escorts,
        policeRequired: police,
        heightPoleRequired: heightPole,
        riskScore: score,
        riskLevel: level,
        riskColor: color,
        policeProbabilityPct: policeProbPct,
        utilityCoordinationPct: utilityPct,
        engineeringReviewPct: engReviewPct,
        permitDelayDays: permitDelay,
    };
}
