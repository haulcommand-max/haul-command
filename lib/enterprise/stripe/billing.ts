/**
 * Stripe Metered Billing Engine
 *
 * Enforces the Correctness Pattern (Rollups -> Watermark -> Exactly-Once).
 * Usage is aggregated and reported idempotently to Stripe.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2026-02-25.clover', // Latest API version
});

function getAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

// Map internal DB metric keys to the actual columns in enterprise_usage_rollups
const METRIC_TO_COLUMN: Record<string, string> = {
    'api_calls': 'total_requests',
    'export_rows': 'total_export_rows',
    'pro_intel_requests': 'total_pro_requests', // Mapping conceptually if needed
};

export async function processMeteredBillingRun(accountId: string) {
    const sb = getAdmin();

    try {
        // 1. Acquire Per-Account Advisory Lock
        const { data: lockAcquired } = await sb.rpc('acquire_billing_lock', { p_account_id: accountId });
        if (!lockAcquired) {
            console.warn(`[Billing] Lock contended for ${accountId}, skipping.`);
            return { skipped: true, reason: 'lock_contended' };
        }

        // 2. Load Stripe Subscription Items (what metrics are billable?)
        const { data: items } = await sb
            .from('stripe_subscription_items')
            .select('*')
            .eq('account_id', accountId);

        if (!items || items.length === 0) {
            return { skipped: true, reason: 'no_subscription_items' };
        }

        const reports = [];

        // 3. Process Each Metric
        for (const item of items) {
            const report = await processMetricForAccount(sb, accountId, item);
            if (report) reports.push(report);
        }

        return { skipped: false, reports };

    } catch (err) {
        console.error(`[Billing] Error running billing for ${accountId}:`, err);
        throw err;
    }
}

async function processMetricForAccount(sb: any, accountId: string, item: any) {
    const metricKey = item.metric_key;
    const stripeItemId = item.stripe_subscription_item_id;

    // A. Lock Watermark Row (FOR UPDATE handled implicitly by RPC or we can do a quick check)
    // We'll read the watermark first.
    let { data: watermark } = await sb
        .from('stripe_usage_watermarks')
        .select('*')
        .eq('account_id', accountId)
        .eq('metric_key', metricKey)
        .single();

    // If no watermark, initialize it to maybe yesterday
    if (!watermark) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const { data: newWm } = await sb
            .from('stripe_usage_watermarks')
            .insert({
                account_id: accountId,
                metric_key: metricKey,
                stripe_subscription_item_id: stripeItemId,
                last_reported_day: yesterday,
                lock_version: 0,
            })
            .select('*')
            .single();
        watermark = newWm;
    }

    // B. Determine Reportable Days string
    const startDayDate = new Date(watermark.last_reported_day);
    startDayDate.setDate(startDayDate.getDate() + 1);
    const startDayStr = startDayDate.toISOString().split('T')[0];

    // Read end day (yesterday, since rollups for today change)
    const endDayDate = new Date(Date.now() - 86400000);
    const endDayStr = endDayDate.toISOString().split('T')[0];

    if (startDayStr > endDayStr) {
        // Nothing new to report
        return null; // Already up to date
    }

    // C. Fetch Daily Rollups for these days
    const rollupCol = METRIC_TO_COLUMN[metricKey] || 'total_requests';
    const { data: rollups } = await sb
        .from('enterprise_usage_rollups')
        .select(`rollup_date, ${rollupCol}`)
        .eq('customer_id', accountId)
        .gte('rollup_date', startDayStr)
        .lte('rollup_date', endDayStr);

    if (!rollups || rollups.length === 0) {
        // Update watermark anyway so we don't keep polling
        await sb.from('stripe_usage_watermarks')
            .update({ last_reported_day: endDayStr })
            .eq('account_id', accountId)
            .eq('metric_key', metricKey);
        return { metricKey, units: 0, status: 'skipped_no_usage' };
    }

    // Aggregate
    const totalUnits = rollups.reduce((sum: number, row: any) => sum + (row[rollupCol] || 0), 0);

    if (totalUnits === 0) {
        // Update watermark anyway
        await sb.from('stripe_usage_watermarks')
            .update({ last_reported_day: endDayStr })
            .eq('account_id', accountId)
            .eq('metric_key', metricKey);
        return { metricKey, units: 0, status: 'skipped_zero_usage' };
    }

    // D. Hash for Idempotency
    const hashData = `${accountId}:${metricKey}:${startDayStr}:${endDayStr}:${totalUnits}`;
    const rollupHash = crypto.createHash('md5').update(hashData).digest('hex');
    const idempotencyKey = `hc_usage:${accountId}:${metricKey}:${startDayStr}:${endDayStr}:${rollupHash}`;

    // E. Create Batch Row
    const { data: batch } = await sb
        .from('stripe_usage_batches')
        .insert({
            account_id: accountId,
            period_start: startDayStr,
            period_end: endDayStr,
            metric_key: metricKey,
            stripe_subscription_item_id: stripeItemId,
            total_units: totalUnits,
            rollup_days_count: rollups.length,
            rollup_hash: rollupHash,
            idempotency_key: idempotencyKey,
            status: 'pending'
        })
        .select('*')
        .single();

    if (!batch) {
        // Idempotency conflict (already running)
        return { metricKey, status: 'conflict_pending_batch' };
    }

    // F. Send to Stripe
    try {
        const timestamp = Math.floor(Date.now() / 1000);

        // This makes the Stripe API call
        const stripeRecord = await (stripe.subscriptionItems as any).createUsageRecord(
            stripeItemId,
            {
                quantity: totalUnits,
                timestamp: timestamp, // Using current time for event time
                action: 'set', // Overwrite if same timestamp, but we append daily (could use 'increment')
            },
            {
                idempotencyKey: idempotencyKey
            }
        );

        // G. Mark Sent
        await sb.from('stripe_usage_batches')
            .update({
                status: 'confirmed',
                stripe_response_json: stripeRecord,
            })
            .eq('batch_id', batch.batch_id);

        // H. Advance Watermark
        await sb.from('stripe_usage_watermarks')
            .update({ last_reported_day: endDayStr })
            .eq('account_id', accountId)
            .eq('metric_key', metricKey);

        return { metricKey, units: totalUnits, status: 'confirmed' };

    } catch (stripeErr: any) {
        // Mark Failed
        await sb.from('stripe_usage_batches')
            .update({
                status: 'failed',
                error_message: stripeErr.message || 'Stripe error',
                error_code: stripeErr.type || 'unknown',
            })
            .eq('batch_id', batch.batch_id);

        throw stripeErr;
    }
}
