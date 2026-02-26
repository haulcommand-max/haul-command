
// upgradeOnlyGate.ts
// Drop-in Change Gate for "upgrade-only / never downgrade" behavior.

export type RiskFlag =
    | "thin_content"
    | "duplicate_risk"
    | "orphan_risk"
    | "schema_invalid"
    | "index_bloat"
    | "unsafe_noindex"
    | "broken_breadcrumbs";

export type Metrics = {
    coverageScore: number;      // 0..1
    uniquenessScore: number;    // 0..1
    safetyScore: number;        // 0..1 (anti-dup, anti-thin, crawl safety)
    performanceScore?: number;   // 0..1 (optional: from analytics / search console)
    riskFlags: RiskFlag[];
    confidence: number;         // 0..1 (how complete/verified the new info is)
};

export type Component = {
    id: string;                 // e.g. "schema.city_service.v1"
    version: string;            // semver string
    payload: unknown;           // template/schema/ruleset object
    metrics: Metrics;
    createdAtISO: string;
    rollbackTo?: { version: string };
};

export type GateDecision = "APPLY" | "HOLD" | "MERGE";

export type GateResult = {
    componentId: string;
    decision: GateDecision;
    qsOld: number;
    qsNew: number;
    minMargin: number;
    reason: string;
    canary?: { enabled: boolean; percentage: number };
    mergedPayload?: unknown;
};

const DEFAULTS = {
    MIN_MARGIN: 0.03,              // new must win by 3% to replace
    MIN_CONFIDENCE: 0.70,          // if lower, never replace; maybe MERGE/HOLD
    MAX_RISK_FLAGS_REPLACE: 0,      // do not replace if new has any risk flags
    CANARY_PERCENT: 5
};

// Weighted Quality Score
export function qualityScore(m: Metrics): number {
    // Weights tuned for SEO safety-first programmatic systems
    const w = {
        coverage: 0.25,
        uniqueness: 0.30,
        safety: 0.35,
        performance: 0.10
    };

    const base =
        m.coverageScore * w.coverage +
        m.uniquenessScore * w.uniqueness +
        m.safetyScore * w.safety +
        (m.performanceScore ?? 0) * w.performance;

    // Penalize risk flags hard
    const riskPenalty = Math.min(0.30, m.riskFlags.length * 0.08); // up to -0.30
    // Penalize low confidence
    const confidencePenalty = m.confidence < 0.85 ? (0.85 - m.confidence) * 0.20 : 0;

    return clamp01(base - riskPenalty - confidencePenalty);
}

export function upgradeOnlyGate(
    oldComp: Component,
    newComp: Component,
    opts: Partial<typeof DEFAULTS> = {}
): GateResult {
    const cfg = { ...DEFAULTS, ...opts };
    const qsOld = qualityScore(oldComp.metrics);
    const qsNew = qualityScore(newComp.metrics);

    // Basic safety checks
    if (newComp.metrics.confidence < cfg.MIN_CONFIDENCE) {
        return {
            componentId: oldComp.id,
            decision: "HOLD",
            qsOld,
            qsNew,
            minMargin: cfg.MIN_MARGIN,
            reason: `HOLD: new confidence too low (${newComp.metrics.confidence.toFixed(2)} < ${cfg.MIN_CONFIDENCE}). Store as suggestion only.`
        };
    }

    // If new has any risk flags, do not replace; allow merge if possible
    if (newComp.metrics.riskFlags.length > cfg.MAX_RISK_FLAGS_REPLACE) {
        const merged = safeMerge(oldComp.payload, newComp.payload);
        return {
            componentId: oldComp.id,
            decision: merged ? "MERGE" : "HOLD",
            qsOld,
            qsNew,
            minMargin: cfg.MIN_MARGIN,
            reason: merged
                ? `MERGE: new has risk flags (${newComp.metrics.riskFlags.join(", ")}). Merge additive parts only.`
                : `HOLD: new has risk flags (${newComp.metrics.riskFlags.join(", ")}).`,
            mergedPayload: merged ?? undefined
        };
    }

    // Replace only if it clearly wins by margin, OR equals with expanded coverage and no added risk
    if (qsNew >= qsOld + cfg.MIN_MARGIN) {
        return {
            componentId: oldComp.id,
            decision: "APPLY",
            qsOld,
            qsNew,
            minMargin: cfg.MIN_MARGIN,
            reason: `APPLY: QS improved by ${(qsNew - qsOld).toFixed(3)}.`,
            canary: { enabled: true, percentage: cfg.CANARY_PERCENT }
        };
    }

    // If basically tied, prefer MERGE (additive) over replace
    if (Math.abs(qsNew - qsOld) < cfg.MIN_MARGIN) {
        const merged = safeMerge(oldComp.payload, newComp.payload);
        return {
            componentId: oldComp.id,
            decision: merged ? "MERGE" : "HOLD",
            qsOld,
            qsNew,
            minMargin: cfg.MIN_MARGIN,
            reason: merged
                ? "MERGE: QS near-tie; keep strong base, add only additive improvements."
                : "HOLD: QS near-tie but cannot safely merge without risk."
        };
    }

    // Otherwise new is worse → block
    return {
        componentId: oldComp.id,
        decision: "HOLD",
        qsOld,
        qsNew,
        minMargin: cfg.MIN_MARGIN,
        reason: `HOLD: upgrade-only policy. New QS is lower by ${(qsOld - qsNew).toFixed(3)}.`
    };
}

// ------- Helpers -------

function clamp01(x: number): number {
    return Math.max(0, Math.min(1, x));
}

/**
 * safeMerge: conservative merge strategy.
 * - If objects: deep merge arrays by union (dedupe by JSON string) and objects by key (do not overwrite existing primitives)
 * - If types mismatch or primitives: return null (can't safely merge)
 */
function safeMerge(oldPayload: any, newPayload: any): any | null {
    if (oldPayload == null || newPayload == null) return null;
    if (typeof oldPayload !== typeof newPayload) return null;

    if (Array.isArray(oldPayload) && Array.isArray(newPayload)) {
        const set = new Set(oldPayload.map((x: any) => JSON.stringify(x)));
        for (const item of newPayload) set.add(JSON.stringify(item));
        return Array.from(set).map((s) => JSON.parse(s));
    }

    if (isPlainObject(oldPayload) && isPlainObject(newPayload)) {
        const out: any = { ...oldPayload };
        for (const [k, v] of Object.entries(newPayload)) {
            if (out[k] === undefined) {
                out[k] = v; // additive only
            } else {
                const mergedChild = safeMerge(out[k], v);
                if (mergedChild !== null) out[k] = mergedChild;
                // else: do not overwrite existing primitives or incompatible structures
            }
        }
        return out;
    }

    // primitives cannot merge safely
    return null;
}

function isPlainObject(x: any): boolean {
    return x && typeof x === "object" && !Array.isArray(x);
}
