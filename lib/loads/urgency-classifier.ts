/**
 * Urgency Score Classification — Shared Module
 *
 * Moved out of the API route to comply with Next.js 16 which
 * only allows HTTP method exports from route.ts files.
 */

export type UrgencyBand = "fresh" | "warming" | "urgent" | "critical";

export function classifyUrgency(score: number): {
    band: UrgencyBand;
    label: string;
    color: string;
    action_hint: string;
} {
    if (score >= 80) return {
        band: "critical", label: "Critical", color: "#ef4444",
        action_hint: "Coverage needed immediately — act now",
    };
    if (score >= 60) return {
        band: "urgent", label: "Urgent", color: "#f97316",
        action_hint: "Escorts needed in next 30 min",
    };
    if (score >= 40) return {
        band: "warming", label: "Heating", color: "#F1A91B",
        action_hint: "Coverage tightening — check availability",
    };
    return {
        band: "fresh", label: "Fresh", color: "#22c55e",
        action_hint: "High response expected",
    };
}
