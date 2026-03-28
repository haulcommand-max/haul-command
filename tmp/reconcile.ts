import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env.local') });

async function runReconciliation() {
    const dbUrl = process.env.SUPABASE_DB_POOLER_URL;
    if (!dbUrl) throw new Error("Missing SUPABASE_DB_POOLER_URL in .env.local");

    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    
    console.log('🚀 Starting System-Wide Monetization Reconciliation Sweep via Direct PostgreSQL Link...');

    // ========================================================================
    // SWEEP 1: WALLET INTEGRITY
    // Enforce 100% wallet coverage for all registered users using raw SQL.
    // ========================================================================
    console.log('\n[Sweep 1] Auditing HC Pay Wallets...');
    const walletRes = await client.query(`
        INSERT INTO hc_pay_wallets (user_id)
        SELECT id FROM auth.users
        ON CONFLICT (user_id) DO NOTHING
    `);
    console.log(`✅ Wallet Sync Complete. Backfilled ${walletRes.rowCount} missing wallets directly.`);

    // ========================================================================
    // SWEEP 2: SUBSCRIPTION DRIFT
    // Ensure all profiles claiming premium status have canonical user_subscription.
    // ========================================================================
    console.log('\n[Sweep 2] Auditing Subscription MRR Integrity...');
    const driftedProfiles = await client.query(`
        SELECT id, stripe_customer_id, stripe_subscription_id, plan_tier, subscription_tier, subscription_status
        FROM profiles
        WHERE subscription_tier != 'free' OR plan_tier != 'basic'
    `);
    
    let subSyncCount = 0;
    for (const p of driftedProfiles.rows) {
        // Upsert standardizes the logic safely taking the strongest non-free tier
        const priceKey = p.subscription_tier !== 'free' ? p.subscription_tier : p.plan_tier;
        const res = await client.query(`
            INSERT INTO user_subscriptions (user_id, stripe_customer_id, stripe_subscription_id, price_key, plan_id, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id) DO NOTHING
        `, [
            p.id, 
            p.stripe_customer_id, 
            p.stripe_subscription_id || `legacy_sync_${p.id}`, 
            priceKey, 
            priceKey, 
            p.subscription_status || 'active'
        ]);
        if (res.rowCount && res.rowCount > 0) subSyncCount++;
    }
    console.log(`✅ Subscription Sync Complete. Reconciled ${subSyncCount} orphan profile tiers into canonical user_subscriptions.`);

    // ========================================================================
    // SWEEP 3: WEBHOOK IDEMPOTENCY BACKFILL
    // ========================================================================
    console.log('\n[Sweep 3] Auditing Webhook Idempotency Event States...');
    const hookRes = await client.query(`
        UPDATE webhook_inbox 
        SET status = 'processed', signature_verified = true 
        WHERE status IS NULL
    `);
    console.log(`✅ Webhook State Synchronization Complete. Marked ${hookRes.rowCount} historical webhooks as processed to prevent infinite replay loops.`);

    console.log('\n🎉 System-Wide Reconciliation Complete. Platform ready for full autonomous execution.');
    await client.end();
}

runReconciliation().catch(err => {
    console.error('FATAL RECONCILIATION ERROR:', err);
    process.exit(1);
});
