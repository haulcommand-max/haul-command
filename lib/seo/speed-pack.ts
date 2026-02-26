
/**
 * antiGravitySpeedPack.ts
 * "Speed it up" helpers: deterministic seeds, content variation, entity co-mentions, and safe freshness.
 */

export type Seed = string;

export function seededPick<T>(seed: Seed, arr: T[]): T {
    // deterministic pick so pages remain stable (reduces churn + index volatility)
    const h = hash(seed);
    return arr[h % arr.length];
}

export function seededShuffle<T>(seed: Seed, arr: T[]): T[] {
    const out = [...arr];
    let s = hash(seed);
    for (let i = out.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) >>> 0;
        const j = s % (i + 1);
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

export function safeFreshness(lastDataChangeISO: string, lastVerifiedISO?: string) {
    // don’t fake “today”; show truth
    return {
        lastUpdated: lastDataChangeISO,
        lastVerified: lastVerifiedISO ?? lastDataChangeISO
    };
}

export function entityCoMentions(seed: Seed) {
    // rotate authoritative entities without stuffing
    const entities = [
        { name: "FMCSA", url: "https://www.fmcsa.dot.gov/" },
        { name: "MUTCD", url: "https://mutcd.fhwa.dot.gov/" },
        { name: "SC&RA", url: "https://www.scranet.org/" },
        { name: "Specialized Carriers & Rigging Association", url: "https://www.scranet.org/" },
        { name: "USDOT", url: "https://www.transportation.gov/" }
    ];
    return seededShuffle(seed, entities).slice(0, 2);
}

export function uniquenessIntro(seed: Seed, vars: { city: string; admin1: string; corridor?: string }) {
    const patterns = [
        `Haul Command helps coordinate ${vars.city}, ${vars.admin1} escort coverage with verified operators and live load flow.`,
        `Running oversize through ${vars.city}? Use Haul Command to find the right escort type, fast—without guessing.`,
        `For escorts near ${vars.city}, ${vars.admin1}, Haul Command pairs local coverage with corridor-aware updates.`,
        `If you need a pilot car in ${vars.city}, we show verified options, active lanes, and real-time route friction.`
    ];
    const line = seededPick(seed, patterns);
    const corridorLine = vars.corridor ? ` Common freight movement runs along ${vars.corridor}.` : "";
    return line + corridorLine;
}

function hash(s: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
