// app/api/revenue/recover/route.ts
// POST /api/revenue/recover — Surface recovery signals for an operator
// GET /api/revenue/recover/report — Admin: total estimated recovery value
//
// Activates the dormant recovery-revenue.ts engine
// Per dormant_plan_extractor: "upgrade and revive the strongest ones instead of inventing weaker replacements"

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';
import {
    type RecoverySignal,
} from '@/lib/engines/recovery-revenue';

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'auth_required' }, { status: 401 });
        }

        const admin = getSupabaseAdmin();

        // Fetch operator profile
        const { data: profile } = await admin
            .from('hc_places')
            .select('id, is_claimed, last_verified_at, documents_last_updated, trust_score, rank_score')
            .eq('claimed_by', user.id)
            .maybeSingle();

        if (!profile) {
            return NextResponse.json({
                signals: [],
                estimated_recovery: 0,
                message: 'No claimed profile found. Claim your listing to unlock recovery signals.',
            });
        }

        const signals: RecoverySignal[] = [];
        const now = new Date();

        // ── Signal 1: Stale freshness ──
        if (profile.last_verified_at) {
            const daysSinceVerified = (now.getTime() - new Date(profile.last_verified_at).getTime()) / 86400000;
            if (daysSinceVerified > 90) {
                signals.push({
                    type: 'stale_freshness',
                    operator_id: profile.id,
                    severity: daysSinceVerified > 180 ? 'high' : 'medium',
                    revenue_hook: 'trust_score_decay',
                    estimated_recovery_value: 45,
                    message: `Profile not refreshed in ${Math.round(daysSinceVerified)} days. Trust score and ranking are decaying.`,
                    action_label: 'Refresh My Profile',
                    action_url: '/dashboard/profile/refresh',
                    deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
                    context: { days_since_verified: Math.round(daysSinceVerified) },
                });
            }
        }

        // ── Signal 2: Documents stale ──
        if (profile.documents_last_updated) {
            const daysSinceDocs = (now.getTime() - new Date(profile.documents_last_updated).getTime()) / 86400000;
            if (daysSinceDocs > 365) {
                signals.push({
                    type: 'expiring_docs',
                    operator_id: profile.id,
                    severity: 'high',
                    revenue_hook: 'document_expiry_urgency',
                    estimated_recovery_value: 120,
                    message: `Insurance and cert documents over 12 months old. Verify to maintain Elite status.`,
                    action_label: 'Update Documents',
                    action_url: '/dashboard/documents',
                    deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
                    context: { days_since_update: Math.round(daysSinceDocs) },
                });
            }
        }

        // ── Signal 3: Rank drop ──
        if (profile.rank_score !== null && profile.rank_score < 50) {
            signals.push({
                type: 'rank_drop',
                operator_id: profile.id,
                severity: profile.rank_score < 30 ? 'critical' : 'medium',
                revenue_hook: 'visibility_recovery',
                estimated_recovery_value: 85,
                message: `Your directory rank is ${profile.rank_score}/100. You're losing visibility to competitors.`,
                action_label: 'Boost My Rank',
                action_url: '/dashboard/boost',
                context: { current_rank: profile.rank_score },
            });
        }

        // ── Signal 4: No trust score ──
        if (!profile.trust_score || profile.trust_score === 0) {
            signals.push({
                type: 'rank_drop',
                operator_id: profile.id,
                severity: 'medium',
                revenue_hook: 'trust_score_unlock',
                estimated_recovery_value: 60,
                message: 'No trust score. Add verification data to unlock top search placement.',
                action_label: 'Build Trust Score',
                action_url: '/dashboard/verification',
                context: {},
            });
        }

        const totalRecovery = signals.reduce((sum, s) => sum + s.estimated_recovery_value, 0);

        // Write recovery audit event
        await admin.from('swarm_activity_log').insert({
            agent_name: 'recovery_revenue_agent',
            trigger_reason: 'recovery_scan:operator_request',
            action_taken: `Scanned ${signals.length} recovery opportunities for ${user.id}`,
            surfaces_touched: ['operator_dashboard', 'recovery_signals'],
            revenue_impact: totalRecovery,
            trust_impact: null,
            country: 'US',
            status: 'completed',
        }).catch(() => {});

        return NextResponse.json({
            operator_id: profile.id,
            signals: signals.sort((a, b) => b.estimated_recovery_value - a.estimated_recovery_value),
            estimated_recovery_usd: totalRecovery,
            scan_count: signals.length,
            scanned_at: now.toISOString(),
        });

    } catch (err) {
        console.error('[/api/revenue/recover]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// Type for RecoverySignal (re-export from engine)
type RecoverySignal = {
    type: string;
    operator_id: string;
    severity: string;
    revenue_hook: string;
    estimated_recovery_value: number;
    message: string;
    action_label: string;
    action_url: string;
    deadline?: string;
    context: Record<string, unknown>;
};
