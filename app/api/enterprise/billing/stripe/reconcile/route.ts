import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getStripe } from "@/lib/enterprise/stripe/client";

export const runtime = "nodejs";

type ReconcileBody = {
    account_id?: string;
    lookback_days?: number; // default 30
    max_accounts?: number; // default 50
};

function isoDateToDate(iso: string): Date {
    return new Date(iso + "T00:00:00Z");
}
function toISODate(d: Date): string {
    return d.toISOString().slice(0, 10);
}
function addDays(d: Date, days: number): Date {
    const x = new Date(d.getTime());
    x.setUTCDate(x.getUTCDate() + days);
    return x;
}

export async function POST(req: Request) {
    const supabase = getSupabaseAdmin();
    const stripe = getStripe();
    const body = (await req.json().catch(() => ({}))) as ReconcileBody;

    const lookbackDays = Math.max(7, Math.min(120, body.lookback_days ?? 30));
    const maxAccounts = Math.max(1, Math.min(500, body.max_accounts ?? 50));

    let accounts: Array<{ account_id: string; stripe_customer_id: string }> = [];

    if (body.account_id) {
        const { data, error } = await supabase
            .from("stripe_customers")
            .select("account_id,stripe_customer_id")
            .eq("account_id", body.account_id)
            .maybeSingle();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        if (!data) return NextResponse.json({ error: "stripe_customer missing" }, { status: 400 });
        accounts = [data as any];
    } else {
        const { data, error } = await supabase
            .from("stripe_customers")
            .select("account_id,stripe_customer_id")
            .limit(maxAccounts);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        accounts = (data ?? []) as any[];
    }

    const since = addDays(new Date(), -lookbackDays);
    const sinceUnix = Math.floor(since.getTime() / 1000);

    const out: any[] = [];

    for (const a of accounts) {
        try {
            // Fetch recent invoices
            const invoices = await stripe.invoices.list({
                customer: a.stripe_customer_id,
                created: { gte: sinceUnix },
                limit: 50,
                expand: ["data.lines.data.price"],
            });

            // Pull subscription items mapping for metric keys
            const { data: items, error: itemsErr } = await supabase
                .from("stripe_subscription_items")
                .select("metric_key,stripe_subscription_item_id,stripe_price_id")
                .eq("account_id", a.account_id);

            if (itemsErr) throw new Error(itemsErr.message);

            const priceToMetric = new Map<string, string>();
            for (const it of (items ?? []) as any[]) {
                if (it.stripe_price_id && it.metric_key) priceToMetric.set(it.stripe_price_id, it.metric_key);
            }

            let mismatches = 0;

            for (const inv of invoices.data) {
                // We only reconcile invoices that are open/paid; draft can change
                if (!["open", "paid", "uncollectible", "void"].includes(inv.status ?? "")) continue;

                // Determine the invoice coverage window (best effort)
                const periodStart = inv.period_start ? new Date(inv.period_start * 1000) : null;
                const periodEnd = inv.period_end ? new Date(inv.period_end * 1000) : null;

                for (const line of inv.lines.data) {
                    const priceId = ((line as any).price as any)?.id as string | undefined;
                    if (!priceId) continue;

                    const metricKey = priceToMetric.get(priceId);
                    if (!metricKey) continue;

                    // Estimate billed usage days from invoice period (best effort)
                    if (!periodStart || !periodEnd) continue;

                    const startDay = toISODate(new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth(), periodStart.getUTCDate())));
                    const endDay = toISODate(new Date(Date.UTC(periodEnd.getUTCFullYear(), periodEnd.getUTCMonth(), periodEnd.getUTCDate())));

                    // Sum our ledger in that window
                    const { data: rows, error: sumErr } = await supabase
                        .from("stripe_usage_batches")
                        .select("total_units,usage_day,status")
                        .eq("account_id", a.account_id)
                        .eq("metric_key", metricKey)
                        .in("status", ["confirmed", "sent"])
                        .gte("usage_day", startDay)
                        .lte("usage_day", endDay);

                    if (sumErr) throw new Error(sumErr.message);

                    const dbUnits = (rows ?? []).reduce((s: number, r: any) => s + Number(r.total_units ?? 0), 0);

                    // Stripe line quantity isn’t always present; for metered pricing, it can appear as quantity on line
                    const stripeQty = Number((line as any).quantity ?? 0);

                    // If Stripe doesn't provide quantity here (can happen), skip mismatch check
                    if (!Number.isFinite(stripeQty) || stripeQty <= 0) continue;

                    // Tolerance: small diffs due to invoice boundary & timing
                    const tolerance = Math.max(10, Math.floor(stripeQty * 0.005)); // 0.5% or 10 units
                    const diff = Math.abs(stripeQty - dbUnits);

                    if (diff > tolerance) {
                        mismatches += 1;

                        await supabase.from("enterprise_incidents").insert({
                            account_id: a.account_id,
                            incident_type: "billing_reconciliation_mismatch",
                            severity: "high",
                            details: {
                                invoice_id: inv.id,
                                invoice_status: inv.status,
                                metric_key: metricKey,
                                stripe_price_id: priceId,
                                stripe_quantity: stripeQty,
                                db_units: dbUnits,
                                tolerance,
                                period_start: startDay,
                                period_end: endDay,
                            },
                            created_at: new Date().toISOString(),
                        }).then(() => null, () => null);
                    }
                }
            }

            out.push({ account_id: a.account_id, ok: true, invoices_checked: invoices.data.length, mismatches });
        } catch (e: any) {
            out.push({ account_id: a.account_id, ok: false, error: e?.message ?? String(e) });
        }
    }

    return NextResponse.json({ ok: true, lookback_days: lookbackDays, accounts: out });
}
