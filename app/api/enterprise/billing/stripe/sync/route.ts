import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getStripe } from "@/lib/enterprise/stripe/client";

export const runtime = "nodejs";

type SyncBody = { account_id: string };

export async function POST(req: Request) {
    const supabase = getSupabaseAdmin();
    const stripe = getStripe();

    const body = (await req.json()) as SyncBody;
    const accountId = body?.account_id;
    if (!accountId) return NextResponse.json({ error: "account_id required" }, { status: 400 });

    // 1) Load plan mapping for this account (you can change this join to your real schema)
    // Expect: plan record includes stripe_price_id per metric_key
    const { data: planRows, error: planErr } = await supabase
        .from("enterprise_plan_matrix")
        .select("metric_key,stripe_price_id")
        .eq("account_id", accountId);

    if (planErr) return NextResponse.json({ error: planErr.message }, { status: 500 });
    if (!planRows?.length)
        return NextResponse.json({ error: "No plan_matrix rows found for account" }, { status: 400 });

    // 2) Get Stripe customer id (must exist or be created by your provisioning flow)
    const { data: customerRow, error: custErr } = await supabase
        .from("stripe_customers")
        .select("stripe_customer_id")
        .eq("account_id", accountId)
        .maybeSingle();

    if (custErr) return NextResponse.json({ error: custErr.message }, { status: 500 });
    if (!customerRow?.stripe_customer_id)
        return NextResponse.json({ error: "stripe_customer_id not found for account" }, { status: 400 });

    // 3) Fetch active subscription (simplest: first active subscription)
    const subs = await stripe.subscriptions.list({
        customer: customerRow.stripe_customer_id,
        status: "all",
        limit: 10,
        expand: ["data.items.data.price"],
    });

    const sub = subs.data.find((s) => ["active", "trialing", "past_due"].includes(s.status));
    if (!sub) return NextResponse.json({ error: "No active/trialing subscription found" }, { status: 400 });

    // 4) Upsert subscription record
    const { error: subUpsertErr } = await supabase.from("stripe_subscriptions").upsert(
        {
            account_id: accountId,
            stripe_subscription_id: sub.id,
            status: sub.status,
            current_period_start: new Date((sub as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
        },
        { onConflict: "account_id" }
    );
    if (subUpsertErr) return NextResponse.json({ error: subUpsertErr.message }, { status: 500 });

    // 5) Map each metric_key -> subscription_item_id by matching price id
    // If you use multiple metered items, each should correspond to one stripe_price_id.
    const items = sub.items.data;

    const upserts: Array<{
        account_id: string;
        metric_key: string;
        stripe_subscription_item_id: string;
        stripe_price_id: string;
    }> = [];

    for (const plan of planRows) {
        const metricKey = (plan as any).metric_key as string;
        const stripePriceId = (plan as any).stripe_price_id as string;
        if (!metricKey || !stripePriceId) continue;

        const matchingItem = items.find((it) => (it as any).price?.id === stripePriceId);
        if (!matchingItem) {
            return NextResponse.json(
                {
                    error: `Subscription missing item for metric_key=${metricKey} stripe_price_id=${stripePriceId}`,
                    subscription_id: sub.id,
                },
                { status: 400 }
            );
        }

        upserts.push({
            account_id: accountId,
            metric_key: metricKey,
            stripe_subscription_item_id: matchingItem.id,
            stripe_price_id: stripePriceId,
        });
    }

    if (upserts.length) {
        const { error: itemErr } = await supabase.from("stripe_subscription_items").upsert(upserts, {
            onConflict: "account_id,metric_key",
        });
        if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 });
    }

    return NextResponse.json({
        ok: true,
        account_id: accountId,
        stripe_customer_id: customerRow.stripe_customer_id,
        stripe_subscription_id: sub.id,
        synced_items: upserts.length,
    });
}
