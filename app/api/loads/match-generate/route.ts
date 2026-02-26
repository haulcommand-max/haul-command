/**
 * POST /api/loads/match-generate
 *
 * Returns Top 3 escort matches for a given load:
 *   - Sure Thing   → maximise trust + on-time rate
 *   - Best Value   → best trust-per-dollar + availability
 *   - Speedster    → fastest response, trust_score >= 70 floor
 *
 * Scoring weights (from spec):
 *   trust_score         0.40
 *   response_speed      0.25
 *   proximity           0.15
 *   price               0.15
 *   corridor_experience 0.05
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface LoadContext {
    load_id?: string;
    origin_state?: string;
    dest_state?: string;
    corridor_id?: string;
    required_at?: string;       // ISO timestamp
    load_type?: string;
    budget_max?: number;        // broker's max rate (per mile or flat)
}

interface OperatorRow {
    id: string;
    full_name: string | null;
    trust_score: number;
    avg_response_minutes: number | null;
    completed_escorts: number;
    states_licensed: string[];
    vehicle_type: string | null;
    is_available: boolean;
    base_rate_per_mile: number | null;
    on_time_rate: number | null;
    dispute_count: number;
    corridor_match_count: number;
}

interface MatchCard {
    type: "sure_thing" | "best_value" | "speedster";
    label: string;
    tagline: string;
    operator_id: string;
    operator_name: string;
    trust_score: number;
    response_min: number | null;
    rate_per_mile: number | null;
    corridor_match_count: number;
    composite_score: number;
    confidence: "high" | "medium" | "low";
    reasoning: string[];
}

// ── Scorers ───────────────────────────────────────────────────────────────────

const W = {
    trust: 0.40,
    response: 0.25,
    proximity: 0.15,
    price: 0.15,
    corridor: 0.05,
} as const;

function normaliseTrust(v: number) { return Math.min(v, 100) / 100; }
function normaliseResponse(v: number) { return Math.max(0, 1 - v / 120); } // best=0m, 0 at 2h+
function normalisePrice(v: number, max: number) {
    if (!max || max <= 0) return 0.5;
    return Math.max(0, 1 - v / max);
}
function normaliseCorridor(v: number) { return Math.min(v / 20, 1); } // 20+ = max

function baseScore(op: OperatorRow, ctx: LoadContext): number {
    const tTrust = normaliseTrust(op.trust_score);
    const tResponse = normaliseResponse(op.avg_response_minutes ?? 90);
    const tProx = op.states_licensed.includes(ctx.origin_state ?? "") ? 1 : 0.3;
    const tPrice = normalisePrice(op.base_rate_per_mile ?? 3, ctx.budget_max ?? 4);
    const tCorridor = normaliseCorridor(op.corridor_match_count);
    return tTrust * W.trust + tResponse * W.response + tProx * W.proximity +
        tPrice * W.price + tCorridor * W.corridor;
}

// ── Card builders ─────────────────────────────────────────────────────────────

function buildSureThing(ops: OperatorRow[], ctx: LoadContext): MatchCard | null {
    // Maximize trust + on_time_rate + low disputes
    const scored = ops.map(op => ({
        op,
        score: baseScore(op, ctx) + (op.on_time_rate ?? 0.5) * 0.2 - (op.dispute_count * 0.05),
    })).sort((a, b) => b.score - a.score);

    const winner = scored[0];
    if (!winner) return null;
    const op = winner.op;
    return {
        type: "sure_thing",
        label: "Sure Thing",
        tagline: "Highest reliability in this corridor",
        operator_id: op.id,
        operator_name: op.full_name ?? "Unknown Operator",
        trust_score: op.trust_score,
        response_min: op.avg_response_minutes,
        rate_per_mile: op.base_rate_per_mile,
        corridor_match_count: op.corridor_match_count,
        composite_score: parseFloat(winner.score.toFixed(4)),
        confidence: op.trust_score >= 80 ? "high" : op.trust_score >= 60 ? "medium" : "low",
        reasoning: [
            `Trust Score: ${op.trust_score}/100`,
            op.on_time_rate ? `On-time rate: ${Math.round((op.on_time_rate ?? 0) * 100)}%` : "Verified operator",
            op.dispute_count === 0 ? "Zero disputes" : `${op.dispute_count} dispute(s) on record`,
        ],
    };
}

function buildBestValue(ops: OperatorRow[], ctx: LoadContext): MatchCard | null {
    // Maximize trust/dollar + availability
    const scored = ops.map(op => {
        const trustPerDollar = op.base_rate_per_mile && op.base_rate_per_mile > 0
            ? (op.trust_score / 100) / op.base_rate_per_mile
            : op.trust_score / 100;
        return { op, score: trustPerDollar * 0.6 + normaliseResponse(op.avg_response_minutes ?? 90) * 0.4 };
    }).sort((a, b) => b.score - a.score);

    const winner = scored[0];
    if (!winner) return null;
    const op = winner.op;
    return {
        type: "best_value",
        label: "Best Value",
        tagline: "Best trust-to-rate ratio available",
        operator_id: op.id,
        operator_name: op.full_name ?? "Unknown Operator",
        trust_score: op.trust_score,
        response_min: op.avg_response_minutes,
        rate_per_mile: op.base_rate_per_mile,
        corridor_match_count: op.corridor_match_count,
        composite_score: parseFloat(winner.score.toFixed(4)),
        confidence: "medium",
        reasoning: [
            op.base_rate_per_mile ? `Rate: $${op.base_rate_per_mile.toFixed(2)}/mi` : "Competitive rate",
            `Trust Score: ${op.trust_score}/100`,
            op.avg_response_minutes ? `Responds in ~${op.avg_response_minutes}min` : "Responsive operator",
        ],
    };
}

function buildSpeedster(ops: OperatorRow[], ctx: LoadContext): MatchCard | null {
    // Minimize ETA, trust_score floor = 70
    const eligible = ops.filter(op => op.trust_score >= 70);
    if (eligible.length === 0) return null;

    const scored = eligible.map(op => ({
        op,
        score: normaliseResponse(op.avg_response_minutes ?? 90) * 0.75 + normaliseTrust(op.trust_score) * 0.25,
    })).sort((a, b) => b.score - a.score);

    const winner = scored[0];
    if (!winner) return null;
    const op = winner.op;
    return {
        type: "speedster",
        label: "Speedster",
        tagline: "Fastest response, ready to move",
        operator_id: op.id,
        operator_name: op.full_name ?? "Unknown Operator",
        trust_score: op.trust_score,
        response_min: op.avg_response_minutes,
        rate_per_mile: op.base_rate_per_mile,
        corridor_match_count: op.corridor_match_count,
        composite_score: parseFloat(winner.score.toFixed(4)),
        confidence: op.avg_response_minutes && op.avg_response_minutes < 15 ? "high" : "medium",
        reasoning: [
            op.avg_response_minutes ? `Avg response: ${op.avg_response_minutes}min` : "Fast responder",
            `Trust Score: ${op.trust_score}/100 (min 70 required)`,
            op.is_available ? "Available now" : "High availability",
        ],
    };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const ctx: LoadContext = await req.json();

        // Fetch candidate pool — available operators with trust score
        const query = getSupabase()
        .from("driver_profiles")
            .select(`
        id, full_name, trust_score, avg_response_minutes,
        completed_escorts, states_licensed, vehicle_type,
        is_available, base_rate_per_mile, on_time_rate,
        dispute_count, corridor_match_count
      `)
            .eq("is_available", true)
            .not("trust_score", "is", null)
            .order("trust_score", { ascending: false })
            .limit(100);

        if (ctx.origin_state) {
            query.contains("states_licensed", [ctx.origin_state]);
        }

        const { data: operators, error } = await query;

        if (error || !operators || operators.length === 0) {
            return NextResponse.json({
                matches: [],
                message: "No available operators found for this corridor",
            });
        }

        const ops = operators as OperatorRow[];

        // Deduplicate across cards by ID
        const usedIds = new Set<string>();
        const cards: MatchCard[] = [];

        const sureThing = buildSureThing(ops, ctx);
        if (sureThing) { usedIds.add(sureThing.operator_id); cards.push(sureThing); }

        const remaining = ops.filter(o => !usedIds.has(o.id));
        const bestValue = buildBestValue(remaining, ctx);
        if (bestValue) { usedIds.add(bestValue.operator_id); cards.push(bestValue); }

        const remaining2 = ops.filter(o => !usedIds.has(o.id));
        const speedster = buildSpeedster(remaining2, ctx);
        if (speedster) cards.push(speedster);

        return NextResponse.json({
            matches: cards,
            context: ctx,
            candidate_pool_size: operators.length,
            generated_at: new Date().toISOString(),
        });
    } catch (err) {
        return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
    }
}
