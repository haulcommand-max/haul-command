/**
 * GET /api/reputation/improvements?operatorId=xxx
 * 
 * Returns score improvement suggestions with paywall gating.
 * Free users: see teaser (top 2 items, no specifics)
 * Paid users: see full action plan with projected score increases
 * 
 * Phase 0: score_improvement_paywall_live
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceSupabase() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

interface ImprovementItem {
    field: string;
    label: string;
    category: string;
    pointsGain: number;
    effort: 'easy' | 'medium' | 'hard';
    action: string;
    details?: string;
}

// The improvement logic — what actions give the most score boost
function computeImprovements(operator: Record<string, unknown>): ImprovementItem[] {
    const items: ImprovementItem[] = [];

    // Identity & Ownership
    if (!operator.avatar_url) {
        items.push({
            field: 'avatar_url',
            label: 'Add profile photo',
            category: 'identity',
            pointsGain: 8,
            effort: 'easy',
            action: 'Upload a professional photo of yourself or your vehicle.',
            details: 'Profiles with photos get 3x more contact requests.',
        });
    }

    if (!operator.bio || (typeof operator.bio === 'string' && operator.bio.length < 50)) {
        items.push({
            field: 'bio',
            label: 'Write a professional bio',
            category: 'profile_strength',
            pointsGain: 7,
            effort: 'easy',
            action: 'Describe your experience, equipment, and service areas in 2-3 sentences.',
            details: 'A complete bio increases trust and helps brokers choose you.',
        });
    }

    // Equipment
    if (!operator.has_height_pole) {
        items.push({
            field: 'has_height_pole',
            label: 'Add height pole equipment',
            category: 'equipment',
            pointsGain: 6,
            effort: 'easy',
            action: 'Mark that you have a height pole if applicable.',
            details: 'Height pole operators get priority on oversize load matches.',
        });
    }
    if (!operator.has_signs) {
        items.push({
            field: 'has_signs',
            label: 'Add signage equipment',
            category: 'equipment',
            pointsGain: 4,
            effort: 'easy',
            action: 'Mark OVERSIZE LOAD signs and other signage.',
        });
    }
    if (!operator.has_amber_lights) {
        items.push({
            field: 'has_amber_lights',
            label: 'Add amber light equipment',
            category: 'equipment',
            pointsGain: 4,
            effort: 'easy',
            action: 'Mark that you have DOT-compliant amber lights.',
        });
    }

    // Compliance
    if (!operator.insurance_provider) {
        items.push({
            field: 'insurance_provider',
            label: 'Add insurance information',
            category: 'compliance',
            pointsGain: 10,
            effort: 'medium',
            action: 'Upload your insurance certificate for verification.',
            details: 'Verified insurance unlocks the Compliance Verified tier.',
        });
    }
    if (!operator.certifications || (Array.isArray(operator.certifications) && operator.certifications.length === 0)) {
        items.push({
            field: 'certifications',
            label: 'Add certifications',
            category: 'compliance',
            pointsGain: 6,
            effort: 'medium',
            action: 'List your safety certifications, DOT training, or state escort licenses.',
        });
    }

    // Territory
    if (!operator.service_states || (Array.isArray(operator.service_states) && operator.service_states.length === 0)) {
        items.push({
            field: 'service_states',
            label: 'Define your service territory',
            category: 'territory',
            pointsGain: 8,
            effort: 'easy',
            action: 'Select the states/provinces where you operate.',
            details: 'More territory = more visibility in search results.',
        });
    }
    if (!operator.service_corridors || (Array.isArray(operator.service_corridors) && operator.service_corridors.length === 0)) {
        items.push({
            field: 'service_corridors',
            label: 'Add corridor routes',
            category: 'territory',
            pointsGain: 5,
            effort: 'easy',
            action: 'Select your primary corridors (I-10, I-75, I-95, etc.).',
        });
    }

    // Dispatch Readiness
    if (!operator.dispatch_ready) {
        items.push({
            field: 'dispatch_ready',
            label: 'Enable dispatch readiness',
            category: 'dispatch',
            pointsGain: 9,
            effort: 'easy',
            action: 'Toggle your dispatch readiness to start receiving opportunities.',
            details: 'Dispatch-ready operators rank higher in search and matching.',
        });
    }
    if (!operator.availability_status || operator.availability_status === 'offline') {
        items.push({
            field: 'availability_status',
            label: 'Set your availability status',
            category: 'dispatch',
            pointsGain: 5,
            effort: 'easy',
            action: 'Update to "active" or "standby" so brokers know you\'re available.',
        });
    }

    // Freshness
    if (!operator.website) {
        items.push({
            field: 'website',
            label: 'Add your website',
            category: 'freshness',
            pointsGain: 3,
            effort: 'easy',
            action: 'Link to your company website or social media.',
        });
    }

    // Sort by points gain descending
    items.sort((a, b) => b.pointsGain - a.pointsGain);

    return items;
}

export async function GET(req: NextRequest) {
    try {
        const operatorId = req.nextUrl.searchParams.get('operatorId');
        if (!operatorId) {
            return NextResponse.json({ error: 'operatorId required' }, { status: 400 });
        }

        // Auth check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const serviceSupabase = getServiceSupabase();

        // Get operator data
        const { data: operator, error } = await serviceSupabase
            .from('operators')
            .select('*')
            .eq('id', operatorId)
            .single();

        if (error || !operator) {
            return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
        }

        // Compute improvements
        const allImprovements = computeImprovements(operator);
        const totalPossibleGain = allImprovements.reduce((sum, i) => sum + i.pointsGain, 0);

        // Check if user is the owner AND has a paid subscription
        let isPaid = false;
        if (user && user.id === operator.user_id) {
            const { data: sub } = await serviceSupabase
                .from('subscription_states')
                .select('status, plan_id')
                .eq('user_id', user.id)
                .single();

            isPaid = sub?.status === 'active' && sub?.plan_id !== 'free';
        }

        if (isPaid) {
            // Full action plan — all items with details and projected scores
            return NextResponse.json({
                tier: 'premium',
                totalItems: allImprovements.length,
                totalPossibleGain,
                improvements: allImprovements,
                message: `Complete these ${allImprovements.length} actions to gain up to ${totalPossibleGain} points.`,
            });
        } else {
            // Free teaser — show top 2 items without details, blur the rest
            const teaser = allImprovements.slice(0, 2).map(item => ({
                label: item.label,
                category: item.category,
                pointsGain: item.pointsGain,
                effort: item.effort,
                action: item.action,
                // No details in free tier
            }));

            const locked = allImprovements.slice(2).map(item => ({
                label: '🔒 Upgrade to see this improvement',
                category: item.category,
                pointsGain: item.pointsGain,
                locked: true,
            }));

            return NextResponse.json({
                tier: 'free',
                totalItems: allImprovements.length,
                totalPossibleGain,
                improvements: teaser,
                locked,
                upgradeMessage: `Unlock ${locked.length} more improvements worth +${locked.reduce((s, i) => s + i.pointsGain, 0)} points.`,
                upgradeUrl: '/plans?source=score_improvements',
            });
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
