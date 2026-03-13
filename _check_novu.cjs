const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function main() {
    // Verify audit table exists
    const { data, error } = await sb.from('hc_notification_events').select('id').limit(1);
    console.log(error ? '❌ ' + error.message : '✅ hc_notification_events table is LIVE');

    // Quick smoke test: insert and read back
    const { data: ins, error: insErr } = await sb.from('hc_notification_events').insert({
        event_name: 'system.smoke_test',
        recipient_id: 'test_user',
        idempotency_key: 'smoke_test_' + Date.now(),
        status: 'dry_run',
        transaction_id: 'test_tx',
        payload: '{"test": true}',
    }).select();

    if (insErr) {
        console.log('❌ Insert failed:', insErr.message);
    } else {
        console.log('✅ Smoke test insert succeeded:', ins[0]?.id);

        // Clean up smoke test
        await sb.from('hc_notification_events').delete().eq('id', ins[0].id);
        console.log('✅ Smoke test cleaned up');
    }

    // Full system check
    const tables = [
        'lead_unlocks', 'lead_credit_balances', 'lead_credit_purchases', 'subscription_states',
        'profile_boosts', 'territory_sponsorships', 'document_submissions',
        'hc_load_alerts', 'training_enrollments', 'credential_verifications',
        'hc_notification_events'
    ];

    console.log('\n📋 FULL TABLE STATUS:');
    for (const t of tables) {
        const { error: e } = await sb.from(t).select('id').limit(1);
        console.log(`  ${t.padEnd(30)} ${e ? '❌' : '✅'}`);
    }
}

main().catch(console.error);
