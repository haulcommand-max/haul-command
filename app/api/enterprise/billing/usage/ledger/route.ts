// app/api/enterprise/billing/usage/ledger/route.ts
//
// Customer-facing billing ledger: daily rollups vs billed deltas.
// Assumptions:
// - enterprise_usage_rollups: account_id, rollup_day(date), id(bigint), api_calls, export_rows, pro_intel_requests
// - stripe_usage_batches: account_id, metric_key, usage_day(date), total_units, status
// - stripe_usage_watermarks: account_id, metric_key, last_reported_day
//
// SECURITY:
// - This endpoint should be tier-gated (enterprise/pro) and scoped to the caller's account_id
//   via your existing auth middleware (enterpriseGate + tenant binding).
//
// QUERY PARAMS:
// - start=YYYY-MM-DD (default: today-30d)
// - end=YYYY-MM-DD (default: today-1d, UTC complete days)
// - metric_key=api_calls|export_rows|pro_intel_requests (optional; if omitted returns all 3)

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = "nodejs";

function toISODate(d: Date): string {
    return d.toISOString().slice(0, 10);
}
function utcMidnight(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
function addDays(d: Date, days: number): Date {
    const x = new Date(d.getTime());
    x.setUTCDate(x.getUTCDate() + days);
    return x;
}
function clampDateRange(start: string, end: string) {
    if (start > end) return { start: end, end: start };
    return { start, end };
}

const METRICS = ["api_calls", "export_rows", "pro_intel_requests"] as const;
type MetricKey = (typeof METRICS)[number];

export async function GET(req: Request) {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);

    // In production: derive from auth context (API key -> account_id)
    const accountId = url.searchParams.get("account_id");
    if (!accountId) return NextResponse.json({ error: "account_id required (bind this from auth in prod)" }, { status: 400 });

    const now = new Date();
    const todayUtc = utcMidnight(now);
    const defaultEnd = addDays(todayUtc, -1); // only completed days
    const defaultStart = addDays(todayUtc, -30);

    const startParam = url.searchParams.get("start") ?? toISODate(defaultStart);
    const endParam = url.searchParams.get("end") ?? toISODate(defaultEnd);
    let { start, end } = clampDateRange(startParam, endParam);

    const metricParam = url.searchParams.get("metric_key");
    const metrics: MetricKey[] = metricParam
        ? (METRICS.includes(metricParam as any) ? ([metricParam] as MetricKey[]) : [])
        : [...METRICS];

    if (metricParam && metrics.length === 0) {
        return NextResponse.json({ error: "invalid metric_key" }, { status: 400 });
    }

    // Pull rollups for range
    const { data: rollups, error: rollErr } = await supabase
        .from("enterprise_usage_rollups")
        .select("id,rollup_day,api_calls,export_rows,pro_intel_requests")
        .eq("account_id", accountId)
        .gte("rollup_day", start)
        .lte("rollup_day", end)
        .order("rollup_day", { ascending: true });

    if (rollErr) return NextResponse.json({ error: rollErr.message }, { status: 500 });

    // Pull billed batches for range (confirmed+sent are treated as billed)
    const { data: billed, error: billErr } = await supabase
        .from("stripe_usage_batches")
        .select("metric_key,usage_day,total_units,status")
        .eq("account_id", accountId)
        .gte("usage_day", start)
        .lte("usage_day", end)
        .in("status", ["confirmed", "sent"]);

    if (billErr) return NextResponse.json({ error: billErr.message }, { status: 500 });

    // Pull watermarks (for "billing freshness" signal)
    const { data: watermarks, error: wmErr } = await supabase
        .from("stripe_usage_watermarks")
        .select("metric_key,last_reported_day")
        .eq("account_id", accountId);

    if (wmErr) return NextResponse.json({ error: wmErr.message }, { status: 500 });

    const billedMap = new Map<string, number>(); // key = `${metric_key}:${usage_day}`
    for (const r of billed ?? []) {
        const key = `${r.metric_key}:${r.usage_day}`;
        billedMap.set(key, (billedMap.get(key) ?? 0) + Number(r.total_units ?? 0));
    }

    const wmMap = new Map<string, string | null>();
    for (const w of watermarks ?? []) {
        wmMap.set(w.metric_key, w.last_reported_day ?? null);
    }

    // Produce ledger rows per day, per metric
    const rows: Array<{
        day: string;
        metrics: Record<string, { rollup_units: number; billed_units: number; unbilled_units: number; billed_pct: number }>;
    }> = [];

    for (const r of rollups ?? []) {
        const day = r.rollup_day as string;

        const metricObj: any = {};
        for (const m of metrics) {
            const rollupUnits = Number((r as any)[m] ?? 0);
            const billedUnits = Number(billedMap.get(`${m}:${day}`) ?? 0);
            const unbilled = Math.max(0, rollupUnits - billedUnits);
            const billedPct = rollupUnits > 0 ? Math.min(1, billedUnits / rollupUnits) : 1;
            metricObj[m] = {
                rollup_units: rollupUnits,
                billed_units: billedUnits,
                unbilled_units: unbilled,
                billed_pct: Number(billedPct.toFixed(4)),
            };
        }

        rows.push({ day, metrics: metricObj });
    }

    // Summary totals
    const totals: any = {};
    for (const m of metrics) {
        let rollupTotal = 0;
        let billedTotal = 0;
        for (const row of rows) {
            rollupTotal += row.metrics[m].rollup_units;
            billedTotal += row.metrics[m].billed_units;
        }
        totals[m] = {
            rollup_total: rollupTotal,
            billed_total: billedTotal,
            unbilled_total: Math.max(0, rollupTotal - billedTotal),
            watermark_last_reported_day: wmMap.get(m) ?? null,
        };
    }

    return NextResponse.json({
        ok: true,
        account_id: accountId,
        range: { start, end },
        metrics,
        totals,
        rows,
    });
}
