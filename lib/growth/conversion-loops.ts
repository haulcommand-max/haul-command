
/**
 * Module 8: App + Directory Conversion Loops
 * Purpose: Connect App events to Web signals to drive freshness and re-engagement.
 */

// Signal Types
export type AppSignal =
    | 'DRIVER_LOCATION_PING'
    | 'LOAD_VIEWED'
    | 'PROFILE_CLAIM'
    | 'LANE_SAVED';

export async function processAppSignal(userId: string, signal: AppSignal, payload: any) {
    switch (signal) {
        case 'DRIVER_LOCATION_PING':
            // "Recently Active" loop
            // Update the provider's "last_active_at" timestamp in DB
            // This boosts their Trust Score (Module 6) and keeps their profile "fresh"
            console.log(`[Signal] Driver ${userId} active at ${payload.lat},${payload.lng}`);
            break;

        case 'LANE_SAVED':
            // "Lane Alert" loop
            // If they save "FL to TX", subscribe them to daily load digest
            // Generate a programmatic email/push: "3 New Loads on Your FL->TX Lane"
            console.log(`[Signal] User ${userId} saved lane ${payload.origin}->${payload.dest}`);
            break;

        case 'PROFILE_CLAIM':
            // "Verification" loop
            // Trigger V1/V2 verification flow
            console.log(`[Signal] User ${userId} claimed profile ${payload.slug}`);
            break;
    }
}

export function generateConversionPrompt(pageContext: 'PROVIDER' | 'LOAD' | 'CITY'): { text: string; actionUrl: string } {
    if (pageContext === 'PROVIDER') {
        return {
            text: "Is this your business? Claim your profile to update rates and receive direct load alerts.",
            actionUrl: "/auth/claim"
        };
    }
    if (pageContext === 'LOAD') {
        return {
            text: "Get instant alerts for loads like this on the Haul Command App.",
            actionUrl: "/download"
        };
    }
    return {
        text: "Join the verified network.",
        actionUrl: "/auth/register"
    };
}
