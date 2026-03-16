// app/api/intelligence/classify/route.ts
//
// POST: Submit a social post for classification (admin or system use)
// GET:  Retrieve recent classifications with filters

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { classifySinglePost, processUnclassifiedImports } from '@/lib/intelligence/social-classifier';
import { validateImport, checkSourceRateLimit, logGuardrailEvent } from '@/lib/intelligence/social-guardrails';

function getAdminClient() {
    return getSupabaseAdmin();
}

async function requireAdminOrStaff(): Promise<{ error?: NextResponse }> {
    const cookieStore = await cookies();
    const authClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };

    const { data: profile } = await getAdminClient()
        .from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!profile || !['admin', 'staff'].includes(profile.role)) {
        return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
    }
    return {};
}

// ── POST: Import + classify a social post ──────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const authCheck = await requireAdminOrStaff();
        if (authCheck.error) return authCheck.error;

        const supabase = getAdminClient();
        const body = await req.json();
        const {
            raw_text,
            import_source = 'admin_manual_post_import',
            raw_author_name,
            raw_author_handle,
            raw_platform = 'facebook',
            raw_group_name,
            raw_posted_at,
            opt_in_verified = false,
            consent_reference,
            classify_immediately = true,
        } = body;

        if (!raw_text) {
            return NextResponse.json({ error: 'raw_text required' }, { status: 400 });
        }

        // ── Guardrail: validate import ──
        const validation = validateImport(raw_text, import_source, opt_in_verified);
        if (!validation.valid) {
            await logGuardrailEvent('import_blocked', {
                source: import_source,
                violations: validation.violations,
            });
            return NextResponse.json({
                error: 'import_blocked',
                violations: validation.violations,
            }, { status: 422 });
        }

        // ── Guardrail: rate limit ──
        const rateCheck = await checkSourceRateLimit(import_source);
        if (!rateCheck.allowed) {
            await logGuardrailEvent('rate_limited', { source: import_source });
            return NextResponse.json({
                error: 'rate_limited',
                remaining_hour: rateCheck.remaining_hour,
                remaining_day: rateCheck.remaining_day,
            }, { status: 429 });
        }

        // ── Insert import ──
        const { data: importRow, error: importErr } = await supabase
            .from('social_post_imports')
            .insert({
                import_source,
                raw_text: validation.sanitized_text,
                raw_author_name,
                raw_author_handle,
                raw_platform,
                raw_group_name,
                raw_posted_at,
                opt_in_verified,
                consent_reference,
                processed: false,
            })
            .select('id')
            .single();

        if (importErr) {
            return NextResponse.json({ error: importErr.message }, { status: 500 });
        }

        // ── Classify immediately if requested ──
        let classification = null;
        if (classify_immediately && opt_in_verified) {
            const result = classifySinglePost(validation.sanitized_text);

            const { data: classRow } = await supabase
                .from('social_classifications')
                .insert({
                    import_id: importRow.id,
                    model_version: 'social_intent_v1',
                    intent_class: result.intent_class,
                    confidence: result.confidence,
                    secondary_intents: result.secondary_intents,
                    origin_city: result.origin_city,
                    origin_state: result.origin_state,
                    destination_city: result.destination_city,
                    destination_state: result.destination_state,
                    load_type: result.load_type,
                    urgency_level: result.urgency_level,
                    escort_count: result.escort_count,
                    contact_present: result.contact_present,
                    extracted_phone: result.extracted_phone,
                    extracted_email: result.extracted_email,
                    estimated_date: result.estimated_date,
                    equipment_type: result.equipment_type,
                    rate_mentioned: result.rate_mentioned,
                    extraction_quality: result.extraction_quality,
                    human_reviewed: false,
                })
                .select('*')
                .single();

            if (classRow) {
                await supabase.from('social_post_imports').update({
                    processed: true,
                    processed_at: new Date().toISOString(),
                    classification_id: classRow.id,
                }).eq('id', importRow.id);

                classification = classRow;
            }
        }

        return NextResponse.json({
            import_id: importRow.id,
            classification,
            classified: !!classification,
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}

// ── GET: Query classifications ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const authCheck = await requireAdminOrStaff();
        if (authCheck.error) return authCheck.error;

        const supabase = getAdminClient();
        const url = new URL(req.url);
        const intent = url.searchParams.get('intent');
        const state = url.searchParams.get('state');
        const urgency = url.searchParams.get('urgency');
        const minConfidence = parseFloat(url.searchParams.get('min_confidence') || '0.60');
        const limit = parseInt(url.searchParams.get('limit') || '50', 10);
        const offset = parseInt(url.searchParams.get('offset') || '0', 10);

        let query = supabase
            .from('social_classifications')
            .select('*, social_post_imports!inner(raw_text, raw_author_name, raw_platform, raw_group_name)')
            .gte('confidence', minConfidence)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (intent) query = query.eq('intent_class', intent);
        if (state) query = query.or(`origin_state.eq.${state},destination_state.eq.${state}`);
        if (urgency) query = query.eq('urgency_level', urgency);

        const { data, error, count } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ classifications: data || [], total: count });

    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
