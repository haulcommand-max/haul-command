
import { CostBreakdown } from './types';

export interface TeamRequirements {
    origin_state: string;
    dest_state: string;
    total_miles: number;
    width: number;
    height: number;
    length: number;
    overhang_front: number;
    overhang_rear: number;
}

export interface TeamConfig {
    front_escorts: number;
    rear_escorts: number;
    police_escorts: number;
    steer_person: boolean;
    surveyor: boolean;
}

export interface TeamCostEstimate {
    config: TeamConfig;
    total_daily_cost: number;
    total_trip_cost: number;
    breakdown: CostBreakdown[];
    warnings: string[];
}

// Mock rates (would come from DB/Settings)
const RATES = {
    escort_day_rate: 650,
    police_hourly_rate: 150,
    survey_mile_rate: 2.50,
    steer_person_day_rate: 400, // Premium over driver pay
    per_diem: 150,
    lodging: 150
};

export function calculateTeamConfig(req: TeamRequirements): TeamConfig {
    const config: TeamConfig = {
        front_escorts: 0,
        rear_escorts: 0,
        police_escorts: 0,
        steer_person: false,
        surveyor: false
    };

    // Basic logic (Rule of Thumb)
    // Width
    if (req.width > 12) config.rear_escorts = 1;
    if (req.width > 14) config.front_escorts = 1;
    if (req.width > 16) config.police_escorts = 2;

    // Height
    if (req.height > 14.5) config.front_escorts = 1; // High pole
    if (req.height > 16) config.surveyor = true;

    // Length
    if (req.length > 80) config.rear_escorts = 1;
    if (req.length > 110) config.front_escorts = 1; // 2 total
    if (req.length > 150) config.steer_person = true;

    // Overhang
    if (req.overhang_front > 20) config.front_escorts = 1;
    if (req.overhang_rear > 20) config.rear_escorts = 1;

    // Survey
    if (req.height > 15 || req.width > 16) config.surveyor = true;

    return config;
}

export function estimateTeamCost(req: TeamRequirements, config: TeamConfig): TeamCostEstimate {
    const miles_per_day = 400; // conservative for superloads
    const days = Math.ceil(req.total_miles / miles_per_day);
    const cost_breakdown: CostBreakdown[] = [];
    let total_trip = 0;

    // Civilians
    const civilian_count = config.front_escorts + config.rear_escorts;
    if (civilian_count > 0) {
        const daily = civilian_count * (RATES.escort_day_rate + RATES.per_diem + RATES.lodging);
        const trip = daily * days;
        cost_breakdown.push({
            category: `Civilian Escorts (${civilian_count})`,
            amount: trip,
            notes: `${days} days @ ~$${daily / civilian_count}/day avg`
        });
        total_trip += trip;
    }

    // Police
    if (config.police_escorts > 0) {
        // Police usually charged hourly, assume 10hr days
        const hours = days * 10;
        const cost = config.police_escorts * hours * RATES.police_hourly_rate;
        cost_breakdown.push({
            category: `Police Escorts (${config.police_escorts})`,
            amount: cost,
            notes: `${hours} hours @ $${RATES.police_hourly_rate}/hr`
        });
        total_trip += cost;
    }

    // Surveyor
    if (config.surveyor) {
        const survey_cost = req.total_miles * RATES.survey_mile_rate;
        cost_breakdown.push({
            category: 'Route Survey',
            amount: survey_cost,
            notes: `$${RATES.survey_mile_rate}/mile`
        });
        total_trip += survey_cost;
    }

    // Steer Person surcharge
    if (config.steer_person) {
        const steer_cost = days * RATES.steer_person_day_rate;
        cost_breakdown.push({
            category: 'Steer Person Surcharge',
            amount: steer_cost,
            notes: 'Specialized driver premium'
        });
        total_trip += steer_cost;
    }

    return {
        config,
        total_daily_cost: total_trip / days,
        total_trip_cost: total_trip,
        breakdown: cost_breakdown,
        warnings: req.width > 16 ? ['Check Superload Status', 'Utility assistance may be required'] : []
    };
}
