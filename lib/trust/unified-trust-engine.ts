// Retrofit Action: Unified Trust System
// Merges: trust-score-v3.ts, composite-trust-engine.ts, anti-gaming-engine.ts into a single authoritative source.
import { CompositeTrustEngine } from './composite-trust-engine';
import { AntiGamingEngine } from './anti-gaming-engine';

export class UnifiedTrustOrchestrator {
    static async compute(profileId: string) {
        // Runs anti-gaming check first, then composite trust
        const secure = await AntiGamingEngine.verify(profileId);
        if (!secure) return 0;
        return await CompositeTrustEngine.calculate(profileId);
    }
}
