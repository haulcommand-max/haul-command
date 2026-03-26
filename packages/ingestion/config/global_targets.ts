/**
 * ==============================================================================
 * HAUL COMMAND GLOBAL INGESTION HARD-LIMITS (v3.1) - DRONE INTEGRATION
 * ==============================================================================
 * Anchor Point: 1.5 Million Global Pilot Car Operators
 * Coverage: 57 Countries (Tier A, Tier B, Tier C, Tier D)
 * Purpose: This configuration caps the recursive scrapers. 
 *          It now includes Geo-Gated Future Tech routing (UAVs).
 * ==============================================================================
 */

export const TARGET_ANCHOR = 1500000; // 1.5M Pilot Cars Global Ceiling

export const GLOBAL_TARGETS = {
    // 1. The Core Infrastructure Anchor
    "Pilot Car / Escort": TARGET_ANCHOR,                    // 1,500,000
    
    // 2. High-Density Assets
    "Flagger / Traffic Control": Math.floor(TARGET_ANCHOR / 8),        // 187,500
    "Height Pole & Specialized Escort": Math.floor(TARGET_ANCHOR / 10),// 150,000
    
    // 3. Medium-Density Assets
    "WITPAC / Interstate Pilot Car": Math.floor(TARGET_ANCHOR / 20),   // 75,000
    "Bucket Truck (Utility/Line Lift)": Math.floor(TARGET_ANCHOR / 25), // 60,000
    "Permit Service / Expediter": Math.floor(TARGET_ANCHOR / 40),      // 37,500
    
    // 4. Low-Density Assets (High Priority / Specialized)
    "Route Survey (Engineering)": Math.floor(TARGET_ANCHOR / 50),      // 30,000
    "Traffic Control Supervisor (TCS)": Math.floor(TARGET_ANCHOR / 50), // 30,000
    
    // 5. Scarcity & Specialized Assets
    "Police Escort (State + Local)": Math.floor(TARGET_ANCHOR / 100),   // 15,000
    "Steer Car / Rear Escort": Math.floor(TARGET_ANCHOR / 200),        // 7,500
    "Freight Broker / Dispatcher": Math.floor(TARGET_ANCHOR / 400),     // 3,750

    // 6. Next-Gen / Autonomous Assets (Geo-Gated)
    "UAV / Drone Route Survey": Math.floor(TARGET_ANCHOR / 75),         // 20,000
    "Autonomous Fleet Escort (Waymo/Kodiak)": Math.floor(TARGET_ANCHOR / 150), // 10,000
    "Autonomous Incident Recovery (L4 Override)": Math.floor(TARGET_ANCHOR / 300), // 5,000

    // 7. Localized Foreign Roles (Non-US Target Matrix)
    "Road Train Escort (AU) / Tillerman (UK)": Math.floor(TARGET_ANCHOR / 150) // 10,000
};

/**
 * Validates current database count against the 1.5M global anchor map.
 * IMPLEMENTS GEO-GATED TARGETING FOR FUTURE TECH.
 */
export function canIngestTarget(assetClass: keyof typeof GLOBAL_TARGETS, currentDbCount: number, countryCode: string): boolean {
    let limit = GLOBAL_TARGETS[assetClass];
    
    // Geo-Gated Drone Logic: We do not burn API budget hunting drones in rural Tier C/D zones.
    // Drones are strictly hunted in Tier A heavy-haul corridors (Mining, Energy, Telecom).
    if (assetClass === 'UAV / Drone Route Survey') {
        const highDemandRegions = ['CA', 'US', 'AU', 'GB', 'DE', 'NO']; // Canada, USA, Australia, Britain, Germany, Norway
        if (!highDemandRegions.includes(countryCode)) {
            return false; // Automatically shut off Drone scrapers for low-demand countries
        }
        // Limit is concentrated exclusively in these high-demand regions
    }

    if (!limit) return false; 
    
    const overFetchLimit = Math.floor(limit * 1.30);
    return currentDbCount < overFetchLimit;
}
