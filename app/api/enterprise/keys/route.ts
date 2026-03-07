export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import crypto from 'crypto';

// ── Admin client ──────────────────────────────────────────────
function admin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

function hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
}

// ════════════════════════════════════════════════════════════════
// POST /api/enterprise/keys — Create a new API key (self-serve)
// ════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
    const supabase = createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const label = body.label || 'Default';

    const svc = admin();

    // 1. Validate subscription is active
    const { data: sub } = await svc
        .from('subscriptions')
        .select('status, stripe_price_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!sub || !['active', 'trialing'].includes(sub.status)) {
        return NextResponse.json({
            error: 'Active subscription required to create API keys.',
            hint: 'Subscribe to a plan at /pricing',
        }, { status: 403 });
    }

    // 2. Resolve plan from subscription
    const { data: plan } = await svc
        .from('enterprise_plan_matrix')
        .select('*')
        .eq('stripe_price_id', sub.stripe_price_id)
        .eq('active', true)
        .maybeSingle();

    // Fallback: resolve by tier from any active key
    let resolvedPlan = plan;
    if (!resolvedPlan) {
        const { data: fallbackPlan } = await svc
            .from('enterprise_plan_matrix')
            .select('*')
            .eq('plan_slug', 'starter_api')
            .eq('active', true)
            .maybeSingle();
        resolvedPlan = fallbackPlan;
    }

    if (!resolvedPlan) {
        return NextResponse.json({ error: 'No eligible plan found' }, { status: 403 });
    }

    // 3. Check key count limit
    const { count } = await svc
        .from('enterprise_api_keys')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', user.id)
        .in('status', ['active']);

    if ((count ?? 0) >= resolvedPlan.max_keys) {
        return NextResponse.json({
            error: `Key limit reached. Your plan allows ${resolvedPlan.max_keys} active keys.`,
            current: count,
            max: resolvedPlan.max_keys,
        }, { status: 409 });
    }

    // 4. Generate secure key
    const rawKey = `hc_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 10); // hc_XXXXXX — visible for support

    // 5. Store key (plaintext NEVER stored)
    const { data: newKey, error: insertErr } = await svc
        .from('enterprise_api_keys')
        .insert({
            customer_id: user.id,
            customer_name: user.email ?? 'unknown',
            org_id: body.org_id ?? null,
            api_key_hash: keyHash,
            api_key_prefix: keyPrefix,
            key_label: label,
            tier: resolvedPlan.tier,
            status: 'active',
            rate_limit_rpm: resolvedPlan.rpm_limit,
            export_limit_rows_month: resolvedPlan.monthly_rows > 0 ? resolvedPlan.monthly_rows : null,
            monthly_quota: resolvedPlan.monthly_rows > 0 ? resolvedPlan.monthly_rows : null,
            created_by: user.id,
        })
        .select('id, api_key_prefix, key_label, tier, rate_limit_rpm, created_at')
        .single();

    if (insertErr) {
        console.error('[Keys] Insert error:', insertErr.message);
        return NextResponse.json({ error: 'Failed to create key' }, { status: 500 });
    }

    // 6. Initialize rate limit state
    await svc.from('enterprise_rate_limit_state').insert({
        api_key_id: newKey.id,
        request_count: 0,
        rows_exported_this_month: 0,
    });

    // 7. Emit audit event
    await svc.from('enterprise_export_audit').insert({
        api_key_id: newKey.id,
        customer_id: user.id,
        endpoint: '/api/enterprise/keys',
        query_params: { action: 'create', label },
        rows_returned: 0,
    });

    return NextResponse.json({
        key: {
            id: newKey.id,
            prefix: newKey.api_key_prefix,
            label: newKey.key_label,
            tier: newKey.tier,
            rpm_limit: newKey.rate_limit_rpm,
            created_at: newKey.created_at,
        },
        // ⚠️ This is the ONLY time the full key is shown
        api_key: rawKey,
        warning: 'Store this key securely. It will not be shown again.',
        plan: resolvedPlan.plan_slug,
    }, { status: 201 });
}

// ════════════════════════════════════════════════════════════════
// GET /api/enterprise/keys — List user's API keys
// ════════════════════════════════════════════════════════════════
export async function GET() {
    const supabase = createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const svc = admin();

    const { data: keys, error } = await svc
        .from('enterprise_api_keys')
        .select(`
            id, api_key_prefix, key_label, tier, status,
            rate_limit_rpm, export_limit_rows_month, monthly_quota,
            last_used_at, request_count_total, created_at
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get quota status
    const { data: quota } = await svc.rpc('check_enterprise_quota', {
        p_customer_id: user.id,
    });

    return NextResponse.json({
        keys: keys ?? [],
        count: keys?.length ?? 0,
        quota: quota ?? null,
    });
}
