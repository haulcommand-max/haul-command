import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getStripe } from "@/lib/enterprise/stripe/client";
import { usageIdempotencyKey } from "@/lib/enterprise/stripe/idempotency";

export const runtime = "nodejs";

function toISODate(d: Date): string {
    return d.toISOString().slice(0, 10);
}
function addDays(date: Date, days: number): Date {
    const d = new Date(date.getTime());
    d.setUTCDate(d.getUTCDate() + days);
    return d;
}
function utcMidnight(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
function toUnixSeconds(date: Date): number {
    return Math.floor(date.getTime() / 1000);
}

type ReportBody = {
    account_id?: string; // optional: force a single account
    backfill_days?: number; // default 3
    max_accounts?: number; // default 50
};

const DEFAULT_BACKFILL_DAYS = 3;
const DEFAULT_MAX_ACCOUNTS = 50;

export async function POST(req: Request) {
    const supabase = getSupabaseAdmin();
    const stripe = getStripe();

    const body = (await req.json().catch(() => ({}))) as ReportBody;
    const backfillDays = Math.max(0, Math.min(14, body.backfill_days ?? DEFAULT_BACKFILL_DAYS));
    const maxAccounts = Math.max(1, Math.min(500, body.max_accounts ?? DEFAULT_MAX_ACCOUNTS));

    // Determine "yesterday" in UTC (report complete days only)
    const now = new Date();
    const todayUtc = utcMidnight(now);
    const yesterdayUtc = addDays(todayUtc, -1);
    const yesterdayStr = toISODate(yesterdayUtc);

    // Select accounts eligible for billing.
    // Replace this query with your real "enterprise accounts with active subscriptions" source.
    let accountIds: string[] = [];

    if (body.account_id) {
        accountIds = [body.account_id];
    } else {
        const { data, error } = await supabase
            .from("stripe_subscriptions")
            .select("account_id,status")
            .in("status", ["active", "trialing", "past_due"])
            .limit(maxAccounts);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        accountIds = (data ?? []).map((r: any) => r.account_id);
    }

    const results: any[] = [];

    for (const accountId of accountIds) {
        // Acquire per-account advisory lock (prevents cron overlap races)
        const { data: lockOk, error: lockErr } = await supabase.rpc("acquire_billing_lock", {
            p_account_id: accountId,
        });

        if (lockErr) {
            results.push({ account_id: accountId, ok: false, error: lockErr.message });
            continue;
        }
        if (!lockOk) {
            results.push({ account_id: accountId, ok: true, skipped: "lock_contended" });
            continue;
        }

        try {
            // Load subscription items (metered items) for metrics
            const { data: items, error: itemsErr } = await supabase
                .from("stripe_subscription_items")
                .select("metric_key,stripe_subscription_item_id,stripe_price_id")
                .eq("account_id", accountId);

            if (itemsErr) throw new Error(itemsErr.message);
            if (!items?.length) {
                results.push({ account_id: accountId, ok: false, error: "no_subscription_items" });
                continue;
            }

            const perMetric: any[] = [];

            for (const item of items as any[]) {
                const metricKey = item.metric_key as string;
                const subscriptionItemId = item.stripe_subscription_item_id as string;

                // Ensure watermark row exists (upsert)
                // last_reported_day null means "nothing reported yet"
                const { error: wmUpsertErr } = await supabase.from("stripe_usage_watermarks").upsert(
                    {
                        account_id: accountId,
                        metric_key: metricKey,
                        stripe_subscription_item_id: subscriptionItemId,
                        last_reported_day: null,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "account_id,metric_key", ignoreDuplicates: true as any }
                );
                if (wmUpsertErr) throw new Error(wmUpsertErr.message);

                // Fetch watermark
                const { data: wmRow, error: wmErr } = await supabase
                    .from("stripe_usage_watermarks")
                    .select("last_reported_day,stripe_subscription_item_id")
                    .eq("account_id", accountId)
                    .eq("metric_key", metricKey)
                    .maybeSingle();

                if (wmErr) throw new Error(wmErr.message);

                // Start day = last_reported_day + 1, else (yesterday - backfillDays) to allow initial backfill
                const lastReported = (wmRow as any)?.last_reported_day as string | null;
                const baseStart = lastReported ? addDays(new Date(lastReported + "T00:00:00Z"), 1) : addDays(yesterdayUtc, -backfillDays);
                const startUtc = utcMidnight(baseStart);

                // We will process:
                // 1) Backfill window: last N days (up to yesterday) delta-correct
                // 2) Forward fill: from watermark+1 to yesterday
                //
                // For simplicity and correctness, we do a single day-by-day loop from startUtc..yesterdayUtc.
                let day = startUtc;

                let sentDays = 0;
                let deltaDays = 0;
                let stoppedOnMissingRollup = false;

                while (toISODate(day) <= yesterdayStr) {
                    const dayStr = toISODate(day);

                    // Pull the rollup row for that day.
                    // Assumption: enterprise_usage_rollups has:
                    // account_id, rollup_day (date), api_calls, export_rows, pro_intel_requests, id (bigint)
                    const { data: rollup, error: rollupErr } = await supabase
                        .from("enterprise_usage_rollups")
                        .select("id,rollup_day,api_calls,export_rows,pro_intel_requests")
                        .eq("account_id", accountId)
                        .eq("rollup_day", dayStr)
                        .maybeSingle();

                    if (rollupErr) throw new Error(rollupErr.message);

                    // If rollup missing, stop to avoid skipping usage (prevents "missed usage").
                    // Next run will pick it up once rollup exists.
                    if (!rollup) {
                        stoppedOnMissingRollup = true;
                        break;
                    }

                    const units =
                        metricKey === "api_calls"
                            ? Number((rollup as any).api_calls ?? 0)
                            : metricKey === "export_rows"
                                ? Number((rollup as any).export_rows ?? 0)
                                : metricKey === "pro_intel_requests"
                                    ? Number((rollup as any).pro_intel_requests ?? 0)
                                    : 0;

                    const rollupId = Number((rollup as any).id);

                    // What have we already billed for this day (sum successful batches)?
                    const { data: billedRows, error: billedErr } = await supabase
                        .from("stripe_usage_batches")
                        .select("total_units,status")
                        .eq("account_id", accountId)
                        .eq("metric_key", metricKey)
                        .eq("usage_day", dayStr)
                        .in("status", ["confirmed", "sent"]);

                    if (billedErr) throw new Error(billedErr.message);

                    const alreadyBilled = (billedRows ?? []).reduce((sum: number, r: any) => sum + Number(r.total_units ?? 0), 0);

                    // Delta-correct inside backfill window (and also safe for first-time runs)
                    const delta = units - alreadyBilled;

                    if (delta < 0) {
                        // Overreport detected: do NOT attempt negative usage.
                        // Create an incident record if you have enterprise_incidents; otherwise just log.
                        await supabase.from("enterprise_incidents").insert({
                            account_id: accountId,
                            incident_type: "billing_overreport_detected",
                            severity: "high",
                            details: {
                                metric_key: metricKey,
                                usage_day: dayStr,
                                units_rollup: units,
                                already_billed: alreadyBilled,
                                delta,
                            },
                            created_at: new Date().toISOString(),
                        }).then(() => null, () => null);

                        // Do not advance watermark past a day with overreport discrepancy without human action.
                        break;
                    }

                    if (delta === 0) {
                        // Nothing to bill; but watermark can still advance IF this day is >= lastReported+1.
                        // We'll advance after the loop using "last successfully processed day".
                        day = addDays(day, 1);
                        continue;
                    }

                    // Compute stable rollup_hash via DB function
                    const { data: hashRow, error: hashErr } = await supabase.rpc("compute_daily_rollup_hash", {
                        p_usage_day: dayStr,
                        p_units: delta,
                        p_rollup_id: rollupId,
                    });
                    if (hashErr) throw new Error(hashErr.message);
                    const rollupHash = hashRow as string;

                    const idemKey = usageIdempotencyKey({
                        accountId,
                        metricKey,
                        usageDay: dayStr,
                        rollupHash,
                    });

                    // Insert batch row first (crash-safe)
                    const stripeRequest = {
                        subscription_item_id: subscriptionItemId,
                        metric_key: metricKey,
                        usage_day: dayStr,
                        quantity: delta,
                        action: "increment",
                        timestamp: toUnixSeconds(addDays(day, 1)), // bill at end of day (midnight next day UTC)
                    };

                    // If already exists (duplicate run), we will fetch it and decide based on status.
                    const { error: insErr } = await supabase.from("stripe_usage_batches").insert({
                        account_id: accountId,
                        metric_key: metricKey,
                        stripe_subscription_item_id: subscriptionItemId,
                        usage_day: dayStr,
                        total_units: delta,
                        rollup_id: rollupId,
                        rollup_hash: rollupHash,
                        idempotency_key: idemKey,
                        stripe_request_json: stripeRequest,
                        status: "pending",
                    });

                    if (insErr) {
                        // If unique violation on idempotency_key, fetch existing and continue idempotently.
                        // Supabase doesn’t expose SQLSTATE nicely here; we just fetch by idempotency_key.
                        const { data: existing, error: exErr } = await supabase
                            .from("stripe_usage_batches")
                            .select("*")
                            .eq("idempotency_key", idemKey)
                            .maybeSingle();

                        if (exErr) throw new Error(exErr.message);
                        if (existing?.status === "confirmed" || existing?.status === "sent") {
                            // Already billed this delta
                            day = addDays(day, 1);
                            continue;
                        }
                        // Otherwise fallthrough: attempt Stripe call again with same idempotency key
                    }

                    // Send Stripe usage record with deterministic Idempotency-Key
                    try {
                        const stripeResp = await (stripe.subscriptionItems as any).createUsageRecord(
                            subscriptionItemId,
                            {
                                quantity: delta,
                                timestamp: stripeRequest.timestamp,
                                action: "increment",
                            },
                            { idempotencyKey: idemKey }
                        );

                        await supabase
                            .from("stripe_usage_batches")
                            .update({
                                stripe_response_json: stripeResp as any,
                                status: "confirmed",
                            })
                            .eq("idempotency_key", idemKey);

                        if (alreadyBilled > 0) deltaDays += 1;
                        else sentDays += 1;
                    } catch (e: any) {
                        await supabase
                            .from("stripe_usage_batches")
                            .update({
                                status: "failed",
                                error_code: e?.code ?? null,
                                error_message: e?.message ?? String(e),
                            })
                            .eq("idempotency_key", idemKey);

                        // Stop metric loop; let next run retry safely
                        break;
                    }

                    day = addDays(day, 1);
                }

                // Advance watermark conservatively:
                // - If we stopped due to missing rollup or overreport discrepancy, do NOT advance beyond last confirmed day.
                // We compute last_confirmed_day for this metric by looking at batches.
                const { data: lastBilled, error: lastBilledErr } = await supabase
                    .from("stripe_usage_batches")
                    .select("usage_day")
                    .eq("account_id", accountId)
                    .eq("metric_key", metricKey)
                    .in("status", ["confirmed", "sent"])
                    .order("usage_day", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (lastBilledErr) throw new Error(lastBilledErr.message);

                if (lastBilled?.usage_day) {
                    await supabase
                        .from("stripe_usage_watermarks")
                        .update({
                            last_reported_day: lastBilled.usage_day,
                            stripe_subscription_item_id: subscriptionItemId,
                            updated_at: new Date().toISOString(),
                        })
                        .eq("account_id", accountId)
                        .eq("metric_key", metricKey);
                }

                perMetric.push({
                    metric_key: metricKey,
                    subscription_item_id: subscriptionItemId,
                    sent_days: sentDays,
                    delta_days: deltaDays,
                    stopped_on_missing_rollup: stoppedOnMissingRollup,
                });
            }

            results.push({ account_id: accountId, ok: true, metrics: perMetric });
        } catch (e: any) {
            results.push({ account_id: accountId, ok: false, error: e?.message ?? String(e) });
        } finally {
            try { await supabase.rpc("release_billing_lock", { p_account_id: accountId }); } catch { /* ignore */ }
        }
    }

    return NextResponse.json({
        ok: true,
        backfill_days: backfillDays,
        reported_through_day: yesterdayStr,
        accounts: results,
    });
}
