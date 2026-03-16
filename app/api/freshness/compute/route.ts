/**
 * POST /api/freshness/compute
 * 
 * Computes freshness scores for operators.
 * Can be called per-operator or as batch job.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { computeFreshness, type FreshnessInput } from '@/lib/engines/freshness';


export async function POST(req: NextRequest) {
    const auth = req.headers.get('x-admin-secret');
    if (auth !== process.env.ADMIN_SECRET && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { operator_id, batch = false, limit = 50 } = await req.json() as {
            operator_id?: string;
            batch?: boolean;
            limit?: number;
        };

        const supabase = getSupabaseAdmin();

        // Fetch operators
        let query = supabase.from('operators').select(`
      id, last_availability_update, updated_at, last_login_at,
      total_actions_7d, total_actions_30d, response_rate_7d,
      docs_expiring_30d, docs_expired
    `);

        if (operator_id) {
            query = query.eq('id', operator_id);
        } else if (batch) {
            query = query.order('freshness_computed_at', { ascending: true, nullsFirst: true }).limit(limit);
        } else {
            return NextResponse.json({ error: 'Provide operator_id or set batch=true' }, { status: 400 });
        }

        const { data: operators, error } = await query;
        if (error) throw error;

        const results = [];

        for (const op of operators || []) {
            const input: FreshnessInput = {
                operator_id: op.id,
                last_availability_update: op.last_availability_update,
                last_profile_edit: op.updated_at,
                last_login: op.last_login_at,
                last_app_checkin: null,
                last_load_completion: null,
                last_response_to_inquiry: null,
                docs_expiring_within_30d: op.docs_expiring_30d || 0,
                docs_expired: op.docs_expired || 0,
                total_actions_last_7d: op.total_actions_7d || 0,
                total_actions_last_30d: op.total_actions_30d || 0,
                response_rate_7d: op.response_rate_7d || 0,
            };

            const result = computeFreshness(input);
            results.push(result);

            // Update the operator's freshness score in DB
            await supabase.from('operators').update({
                freshness_score: result.freshness_score,
                freshness_decay_state: result.decay_state,
                freshness_computed_at: result.computed_at,
            }).eq('id', op.id);
        }

        return NextResponse.json({
            ok: true,
            computed: results.length,
            results: results.map(r => ({
                operator_id: r.operator_id,
                score: r.freshness_score,
                state: r.decay_state,
                badges: r.badges,
                alerts: r.alerts.length,
            })),
            summary: {
                avg_score: Math.round(results.reduce((s, r) => s + r.freshness_score, 0) / (results.length || 1)),
                fresh: results.filter(r => r.decay_state === 'fresh').length,
                warm: results.filter(r => r.decay_state === 'warm').length,
                cooling: results.filter(r => r.decay_state === 'cooling').length,
                stale: results.filter(r => r.decay_state === 'stale').length,
                dormant: results.filter(r => r.decay_state === 'dormant').length,
            },
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
