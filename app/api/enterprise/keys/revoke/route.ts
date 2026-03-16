export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/utils/supabase/server';

function admin() {
    return getSupabaseAdmin();
}

// ════════════════════════════════════════════════════════════════
// POST /api/enterprise/keys/revoke — Revoke an API key
// ════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
    const supabase = createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const keyId = body.key_id;

    if (!keyId) {
        return NextResponse.json({ error: 'key_id is required' }, { status: 400 });
    }

    const svc = admin();

    // Verify ownership
    const { data: key } = await svc
        .from('enterprise_api_keys')
        .select('id, customer_id, status')
        .eq('id', keyId)
        .single();

    if (!key) {
        return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    if (key.customer_id !== user.id) {
        return NextResponse.json({ error: 'Not authorized to revoke this key' }, { status: 403 });
    }

    if (key.status === 'revoked') {
        return NextResponse.json({ error: 'Key already revoked' }, { status: 409 });
    }

    // Revoke
    const { error: updateErr } = await svc
        .from('enterprise_api_keys')
        .update({
            status: 'revoked',
            active: false,
            revoked_at: new Date().toISOString(),
        })
        .eq('id', keyId);

    if (updateErr) {
        return NextResponse.json({ error: 'Failed to revoke key' }, { status: 500 });
    }

    // Emit security event
    await svc.from('enterprise_anomaly_log').insert({
        api_key_id: keyId,
        customer_id: user.id,
        anomaly_type: 'key_sharing_signature', // reusing type for revocation audit
        severity: 'info',
        details: { action: 'user_revoked', revoked_by: user.id },
    }).then(() => null, () => null);

    await svc.from('enterprise_export_audit').insert({
        api_key_id: keyId,
        customer_id: user.id,
        endpoint: '/api/enterprise/keys/revoke',
        query_params: { action: 'revoke' },
        rows_returned: 0,
    });

    return NextResponse.json({
        revoked: true,
        key_id: keyId,
        revoked_at: new Date().toISOString(),
    });
}
