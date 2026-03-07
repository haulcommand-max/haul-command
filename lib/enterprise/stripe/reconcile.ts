/**
 * Stripe Billing Reconciliation
 *
 * Prevents disputes by comparing Stripe invoice line items
 * against locally reported `stripe_usage_batches`.
 * If any mismatch exceeds the materiality threshold, raises an Incident.
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2026-02-25.clover',
});

function getAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

const MATERIALITY_THRESHOLDS: Record<string, number> = {
    'api_calls': 5000,
    'export_rows': 50000,
    'pro_intel_requests': 200,
};

export async function processReconciliation() {
    const sb = getAdmin();

    try {
        // Find most recent finalized invoices from Stripe (last 30 days)
        // Or you could fetch by active subscriptions locally.
        const invoices = await stripe.invoices.list({
            limit: 50,
            status: 'open', // Open invoices are finalized but unpaid, good target to reconcile before charge
        });

        let mismatches = 0;

        for (const inv of invoices.data) {
            // Find our local account_id
            if (!inv.customer) continue;
            const custId = typeof inv.customer === 'string' ? inv.customer : inv.customer.id;
            const { data: accountRow } = await sb
                .from('stripe_customers')
                .select('account_id')
                .eq('stripe_customer_id', custId)
                .single();

            if (!accountRow) continue; // Not our problem/internal account

            const accountId = accountRow.account_id;

            // Check each line item
            for (const line of inv.lines.data) {
                if ((line as any).type !== 'subscription' || !(line as any).subscription_item) continue;

                const subItemId = typeof (line as any).subscription_item === 'string'
                    ? (line as any).subscription_item
                    : (line as any).subscription_item.id;

                // What is the metric? We map subItemId to metric_key
                const { data: localItem } = await sb
                    .from('stripe_subscription_items')
                    .select('metric_key')
                    .eq('stripe_subscription_item_id', subItemId)
                    .single();

                if (!localItem) continue; // Line item not managed by our metered billing
                const metricKey = localItem.metric_key;

                // Sum up our confirmed batches that fell in this invoice period
                const periodStart = new Date(line.period.start * 1000).toISOString().split('T')[0];
                const periodEnd = new Date(line.period.end * 1000).toISOString().split('T')[0];

                const { data: batches } = await sb
                    .from('stripe_usage_batches')
                    .select('total_units, rollup_hash, batch_id')
                    .eq('account_id', accountId)
                    .eq('metric_key', metricKey)
                    .eq('stripe_subscription_item_id', subItemId)
                    .eq('status', 'confirmed')
                    .gte('period_start', periodStart)
                    .lte('period_end', periodEnd);

                const internalTotal = (batches || []).reduce((acc: number, b: any) => acc + parseInt(b.total_units), 0);
                const stripeTotal = line.quantity || 0; // The quantity Stripe recorded

                const delta = stripeTotal - internalTotal;
                const threshold = MATERIALITY_THRESHOLDS[metricKey] || 1000;

                // Mismatch Check
                // Overreporting = Stripe thinks we have more than DB thinks (delta > 0)
                // Underreporting = Stripe thinks we have less than DB thinks (delta < 0, maybe a batch failed)

                if (Math.abs(delta) > threshold) {
                    mismatches++;
                    const msg = `[Billing Reconcile] Mismatch for ${accountId} - Metric: ${metricKey}. `
                        + `Stripe: ${stripeTotal}, DB: ${internalTotal}. Delta: ${delta}`;

                    console.error(msg);

                    // Raise Enterprise Incident (dispute prevention)
                    await sb.from('enterprise_incidents').insert({
                        customer_id: accountId,
                        incident_type: 'billing_mismatch',
                        severity: 'high',
                        status: 'investigating',
                        description: msg,
                        metadata: {
                            invoice_id: inv.id,
                            line_item_id: line.id,
                            subscription_item_id: subItemId,
                            metric_key: metricKey,
                            stripe_quantity: stripeTotal,
                            db_quantity: internalTotal,
                            involved_batches: (batches || []).map((b: any) => b.batch_id),
                        }
                    });

                    // (In a real system you'd also drop Evidence Vault records here showing the rollup hashes)
                } else {
                    // Mark batches as reconciled
                    const batchIds = (batches || []).map((b: any) => b.batch_id);
                    if (batchIds.length > 0) {
                        await sb.from('stripe_usage_batches')
                            .update({ status: 'reconciled' })
                            .in('batch_id', batchIds);
                    }
                }
            }
        }

        return { success: true, mismatches };

    } catch (err: any) {
        console.error(`[Reconcile] Error:`, err);
        throw err;
    }
}
