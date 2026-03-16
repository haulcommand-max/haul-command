// app/api/enterprise/dashboard/tiles/route.ts
//
// Executive dashboard tile feed:
// - MRR (best-effort from Stripe invoices, cached-ish)
// - overage (billed deltas in current period vs included quotas if available)
// - usage runway (days until quota exhaustion, per metric)
// - dispute risk (incidents: reconciliation mismatch + overreport)
// - watermark lag (days behind yesterday)
//
// Uses the exact tables introduced earlier:
// - stripe_customers, stripe_subscriptions, stripe_usage_watermarks, stripe_usage_batches, enterprise_incidents
// And existing rollups:
// - enterprise_usage_rollups
// And plan matrix (assumed; best-effort):
// - enterprise_plan_matrix includes metric_key + included_units_monthly (or included_units) per account
//
// SECURITY:
// - This should be admin-only for the account (enterpriseGate + role check).
// - In production, bind account_id from auth context (not querystring).

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getStripe } from "@/lib/enterprise/stripe/client";

export const runtime = "nodejs";

function utcMidnight(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
function toISODate(d: Date): string {
    return d.toISOString().slice(0, 10);
}
function addDays(d: Date, days: number): Date {
    const x = new Date(d.getTime());
    x.setUTCDate(x.getUTCDate() + days);
    return x;
}
function daysBetween(a: Date, b: Date): number {
    return Math.floor((utcMidnight(b).getTime() - utcMidnight(a).getTime()) / (24 * 3600 * 1000));
}

const METRICS = ["api_calls", "export_rows", "pro_intel_requests"] as const;
type MetricKey = (typeof METRICS)[number];

type Tile =
    | { key: "mrr"; title: string; value: number | null; currency: string; window_days: number; detail?: any }
    | { key: "overage"; title: string; value: number | null; unit: string; detail?: any }
    | { key: "usage_runway"; title: string; value: number | null; unit: string; detail?: any }
    | { key: "dispute_risk"; title: string; value: number; unit: string; detail?: any }
    | { key: "watermark_lag"; title: string; value: number; unit: string; detail?: any };

export async function GET(req: Request) {
    const supabase = getSupabaseAdmin();
    const stripe = getStripe();
    const url = new URL(req.url);

    // In production: derive from auth
    const accountId = url.searchParams.get("account_id");
    if (!accountId) return NextResponse.json({ error: "account_id required (bind this from auth in prod)" }, { status: 400 });

    const now = new Date();
    const todayUtc = utcMidnight(now);
    const yesterdayUtc = addDays(todayUtc, -1);
    const yesterdayStr = toISODate(yesterdayUtc);

    // -------------------------
    // Stripe: MRR (best-effort)
    // -------------------------
    // Simple: sum of paid invoices in last 30 days (approx MRR).
    // More precise requires subscription items/recurring amounts; this is intentionally dispute-safe and observable.
    let mrrTile: Tile = { key: "mrr", title: "MRR (30d paid invoices)", value: null, currency: "usd", window_days: 30 };

    const { data: custRow } = await supabase
        .from("stripe_customers")
        .select("stripe_customer_id")
        .eq("account_id", accountId)
        .maybeSingle();

    if (custRow?.stripe_customer_id) {
        try {
            const since = Math.floor(addDays(now, -30).getTime() / 1000);
            const invoices = await stripe.invoices.list({
                customer: custRow.stripe_customer_id,
                created: { gte: since },
                limit: 100,
            });

            const paid = invoices.data.filter((i) => i.status === "paid");
            const totalCents = paid.reduce((s, i) => s + (i.amount_paid ?? 0), 0);

            mrrTile = {
                key: "mrr",
                title: "MRR (30d paid invoices)",
                value: Number((totalCents / 100).toFixed(2)),
                currency: (paid[0]?.currency ?? "usd") as string,
                window_days: 30,
                detail: { invoices_paid: paid.length },
            };
        } catch (e: any) {
            mrrTile = { ...mrrTile, detail: { error: e?.message ?? String(e) } };
        }
    } else {
        mrrTile = { ...mrrTile, detail: { warning: "stripe_customer_id missing" } };
    }

    // --------------------------------
    // Plan quotas (best-effort schema)
    // --------------------------------
    // Assumed columns:
    // - enterprise_plan_matrix: account_id, metric_key, included_units_monthly (or included_units)
    const { data: planRows } = await supabase
        .from("enterprise_plan_matrix")
        .select("metric_key,included_units_monthly,included_units")
        .eq("account_id", accountId);

    const includedMap = new Map<string, number>();
    for (const p of planRows ?? []) {
        const k = (p as any).metric_key as string;
        const v = Number((p as any).included_units_monthly ?? (p as any).included_units ?? 0);
        if (k) includedMap.set(k, Number.isFinite(v) ? v : 0);
    }

    // --------------------------------
    // Current period window (best-effort)
    // --------------------------------
    const { data: subRow } = await supabase
        .from("stripe_subscriptions")
        .select("current_period_start,current_period_end,status")
        .eq("account_id", accountId)
        .maybeSingle();

    // If subscription window missing, fall back to current calendar month
    let periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    let periodEnd = addDays(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)), -1);

    if (subRow?.current_period_start && subRow?.current_period_end) {
        periodStart = new Date(subRow.current_period_start);
        periodEnd = new Date(subRow.current_period_end);
    }

    const startDay = toISODate(utcMidnight(periodStart));
    const endDay = toISODate(utcMidnight(periodEnd));

    // --------------------------------
    // Usage totals in current period
    // --------------------------------
    const { data: rollups, error: rollErr } = await supabase
        .from("enterprise_usage_rollups")
        .select("rollup_day,api_calls,export_rows,pro_intel_requests")
        .eq("account_id", accountId)
        .gte("rollup_day", startDay)
        .lte("rollup_day", (yesterdayStr < endDay ? yesterdayStr : endDay))
        .order("rollup_day", { ascending: true });

    if (rollErr) return NextResponse.json({ error: rollErr.message }, { status: 500 });

    const usageTotals: Record<string, number> = { api_calls: 0, export_rows: 0, pro_intel_requests: 0 };
    for (const r of rollups ?? []) {
        usageTotals.api_calls += Number((r as any).api_calls ?? 0);
        usageTotals.export_rows += Number((r as any).export_rows ?? 0);
        usageTotals.pro_intel_requests += Number((r as any).pro_intel_requests ?? 0);
    }

    // --------------------------------
    // Billed totals in current period
    // --------------------------------
    const { data: billedRows, error: billErr } = await supabase
        .from("stripe_usage_batches")
        .select("metric_key,usage_day,total_units,status")
        .eq("account_id", accountId)
        .gte("usage_day", startDay)
        .lte("usage_day", (yesterdayStr < endDay ? yesterdayStr : endDay))
        .in("status", ["confirmed", "sent"]);

    if (billErr) return NextResponse.json({ error: billErr.message }, { status: 500 });

    const billedTotals: Record<string, number> = { api_calls: 0, export_rows: 0, pro_intel_requests: 0 };
    for (const b of billedRows ?? []) {
        const mk = (b as any).metric_key as string;
        if (mk in billedTotals) billedTotals[mk] += Number((b as any).total_units ?? 0);
    }

    // --------------------------------
    // Overage + runway
    // --------------------------------
    // Overages: how far above included quotas (based on usage rollups).
    // Runway: estimated days remaining until quota exhaustion based on trailing 7-day average daily usage.
    const trailingStart = toISODate(addDays(yesterdayUtc, -6)); // 7 days inclusive
    const { data: trailingRollups } = await supabase
        .from("enterprise_usage_rollups")
        .select("rollup_day,api_calls,export_rows,pro_intel_requests")
        .eq("account_id", accountId)
        .gte("rollup_day", trailingStart)
        .lte("rollup_day", yesterdayStr);

    const trailingTotals: Record<string, number> = { api_calls: 0, export_rows: 0, pro_intel_requests: 0 };
    for (const r of trailingRollups ?? []) {
        trailingTotals.api_calls += Number((r as any).api_calls ?? 0);
        trailingTotals.export_rows += Number((r as any).export_rows ?? 0);
        trailingTotals.pro_intel_requests += Number((r as any).pro_intel_requests ?? 0);
    }
    const avgDaily: Record<string, number> = {
        api_calls: trailingTotals.api_calls / 7,
        export_rows: trailingTotals.export_rows / 7,
        pro_intel_requests: trailingTotals.pro_intel_requests / 7,
    };

    const overageDetail: any = {};
    const runwayDetail: any = {};
    let worstRunwayDays: number | null = null;

    for (const mk of METRICS as readonly MetricKey[]) {
        const included = includedMap.get(mk) ?? 0;
        const used = usageTotals[mk];
        const over = Math.max(0, used - included);

        overageDetail[mk] = { included_units: included, used_units: used, overage_units: over, billed_units: billedTotals[mk] };

        if (included > 0) {
            const remaining = Math.max(0, included - used);
            const rate = avgDaily[mk];
            const runway = rate > 0 ? Math.floor(remaining / rate) : null;
            runwayDetail[mk] = { remaining_units: remaining, avg_daily_units_7d: Number(rate.toFixed(2)), runway_days: runway };
            if (runway !== null) worstRunwayDays = worstRunwayDays === null ? runway : Math.min(worstRunwayDays, runway);
        } else {
            runwayDetail[mk] = { remaining_units: null, avg_daily_units_7d: Number(avgDaily[mk].toFixed(2)), runway_days: null };
        }
    }

    const overageTile: Tile = {
        key: "overage",
        title: "Overage (units above included)",
        value: Object.values(overageDetail).reduce((s: number, x: any) => s + Number(x.overage_units ?? 0), 0),
        unit: "units",
        detail: {
            period: { start: startDay, end: endDay, through: (yesterdayStr < endDay ? yesterdayStr : endDay) },
            by_metric: overageDetail,
            note: "Overage calculated from usage rollups vs included units (plan_matrix).",
        },
    };

    const runwayTile: Tile = {
        key: "usage_runway",
        title: "Usage runway (worst metric)",
        value: worstRunwayDays,
        unit: "days",
        detail: {
            trailing_window_days: 7,
            by_metric: runwayDetail,
            note: "Runway uses trailing 7-day average daily usage.",
        },
    };

    // --------------------------------
    // Dispute risk: incidents in last 30 days
    // --------------------------------
    const incidentSince = new Date(addDays(now, -30).toISOString());
    const { data: incidents } = await supabase
        .from("enterprise_incidents")
        .select("incident_type,created_at,severity")
        .eq("account_id", accountId)
        .gte("created_at", incidentSince.toISOString());

    const disputeTypes = new Set(["billing_reconciliation_mismatch", "billing_overreport_detected"]);
    const disputeIncidents = (incidents ?? []).filter((i: any) => disputeTypes.has(i.incident_type));

    // Simple risk score: count weighted by severity
    const severityWeight = (sev: string) => (sev === "critical" ? 3 : sev === "high" ? 2 : 1);
    const disputeRiskScore = disputeIncidents.reduce((s: number, i: any) => s + severityWeight(i.severity ?? "low"), 0);

    const disputeTile: Tile = {
        key: "dispute_risk",
        title: "Dispute risk (30d)",
        value: disputeRiskScore,
        unit: "score",
        detail: {
            incidents_30d: disputeIncidents.length,
            by_type: disputeIncidents.reduce((acc: any, i: any) => {
                acc[i.incident_type] = (acc[i.incident_type] ?? 0) + 1;
                return acc;
            }, {}),
        },
    };

    // --------------------------------
    // Watermark lag (days behind yesterday)
    // --------------------------------
    const { data: watermarks, error: wmErr } = await supabase
        .from("stripe_usage_watermarks")
        .select("metric_key,last_reported_day")
        .eq("account_id", accountId);

    if (wmErr) return NextResponse.json({ error: wmErr.message }, { status: 500 });

    let maxLag = 0;
    const lagByMetric: any = {};

    for (const mk of METRICS as readonly MetricKey[]) {
        const wm = (watermarks ?? []).find((w: any) => w.metric_key === mk);
        const last = wm?.last_reported_day ? new Date(wm.last_reported_day + "T00:00:00Z") : null;
        const lag = last ? Math.max(0, daysBetween(last, yesterdayUtc)) : daysBetween(addDays(yesterdayUtc, -30), yesterdayUtc); // if never reported, show big lag
        lagByMetric[mk] = { last_reported_day: wm?.last_reported_day ?? null, lag_days: lag };
        maxLag = Math.max(maxLag, lag);
    }

    const watermarkTile: Tile = {
        key: "watermark_lag",
        title: "Billing freshness (max lag)",
        value: maxLag,
        unit: "days",
        detail: { through_day: yesterdayStr, by_metric: lagByMetric },
    };

    const tiles: Tile[] = [mrrTile, overageTile, runwayTile, disputeTile, watermarkTile];

    return NextResponse.json({
        ok: true,
        account_id: accountId,
        period: { start: startDay, end: endDay, through: (yesterdayStr < endDay ? yesterdayStr : endDay) },
        tiles,
    });
}
