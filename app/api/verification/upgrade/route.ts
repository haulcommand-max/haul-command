/**
 * POST /api/verification/upgrade
 * GET  /api/verification/upgrade?operatorId=xxx
 * 
 * Verified Ladder — trust tiers from claimed → priority_dispatch_ready.
 * Each tier has requirements + optional paid upgrade path.
 * 
 * Tiers (ascending):
 *   1. claimed         — Free. Just claimed the listing.
 *   2. verified        — Free. Email + phone confirmed.
 *   3. compliance_verified — Paid or free. Insurance + license docs uploaded.
 *   4. dispatch_ready  — Requirements met: equipment confirmed, availability set.
 *   5. priority_dispatch_ready — Premium. Paid tier. Priority ranking + badge.
 * 
 * Phase 0: verified_ladder_live
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

// Tier definitions with requirements
const TRUST_TIERS = [
    {
        tier: 'claimed',
        label: 'Claimed',
        level: 1,
        requirements: [
            { field: 'is_seeded', check: 'equals', value: false, label: 'Listing claimed' },
        ],
        badges: ['early_operator'],
        paidUpgrade: false,
    },
    {
        tier: 'verified',
        label: 'Verified',
        level: 2,
        requirements: [
            { field: 'email', check: 'exists', label: 'Email confirmed' },
            { field: 'phone', check: 'exists', label: 'Phone number added' },
            { field: 'avatar_url', check: 'exists', label: 'Profile photo uploaded' },
            { field: 'bio', check: 'minLength', value: 20, label: 'Bio written (20+ chars)' },
        ],
        badges: ['verified_identity'],
        paidUpgrade: false,
    },
    {
        tier: 'compliance_verified',
        label: 'Compliance Verified',
        level: 3,
        requirements: [
            { field: 'insurance_provider', check: 'exists', label: 'Insurance info provided' },
            { field: 'insurance_expiry', check: 'futureDate', label: 'Insurance not expired' },
            { field: 'service_states', check: 'hasItems', label: 'Service territory defined' },
        ],
        badges: ['compliance_verified', 'insured'],
        paidUpgrade: false,
        paidExpedite: { price_cents: 2900, label: 'Expedited verification review ($29)' },
    },
    {
        tier: 'dispatch_ready',
        label: 'Dispatch Ready',
        level: 4,
        requirements: [
            { field: 'has_height_pole', check: 'isTrue', label: 'Height pole confirmed', optional: true },
            { field: 'has_signs', check: 'isTrue', label: 'Signage confirmed' },
            { field: 'vehicle_type', check: 'exists', label: 'Vehicle info added' },
            { field: 'availability_status', check: 'notEquals', value: 'offline', label: 'Availability status set' },
            { field: 'dispatch_ready', check: 'isTrue', label: 'Dispatch toggle enabled' },
        ],
        badges: ['dispatch_ready'],
        paidUpgrade: false,
    },
    {
        tier: 'priority_dispatch_ready',
        label: 'Priority Dispatch Ready',
        level: 5,
        requirements: [
            { field: 'dispatch_ready_tier', check: 'equals', value: 'dispatch_ready', label: 'Dispatch Ready tier achieved' },
        ],
        badges: ['priority_operator', 'elite_operator'],
        paidUpgrade: true,
        price: { monthly_cents: 4900, annual_cents: 47000, label: 'Priority Dispatch ($49/mo)' },
        benefits: [
            'Priority ranking in all search results',
            'Gold badge on profile',
            'Featured in territory pages',
            'AI-powered match scoring',
            'Priority lead routing',
            'Full score improvement intelligence',
        ],
    },
];

// Check if a requirement is met
function checkRequirement(
    operator: Record<string, unknown>,
    req: { field: string; check: string; value?: unknown; optional?: boolean }
): boolean {
    const val = operator[req.field];

    switch (req.check) {
        case 'exists':
            return val !== null && val !== undefined && val !== '';
        case 'isTrue':
            return val === true;
        case 'equals':
            return val === req.value;
        case 'notEquals':
            return val !== req.value;
        case 'minLength':
            return typeof val === 'string' && val.length >= (req.value as number);
        case 'hasItems':
            return Array.isArray(val) && val.length > 0;
        case 'futureDate':
            if (!val) return false;
            return new Date(val as string).getTime() > Date.now();
        default:
            return false;
    }
}

// GET: Read current tier status
export async function GET(req: NextRequest) {
    const operatorId = req.nextUrl.searchParams.get('operatorId');
    if (!operatorId) {
        return NextResponse.json({ error: 'operatorId required' }, { status: 400 });
    }

    const serviceSupabase = getServiceSupabase();
    const { data: operator, error } = await serviceSupabase
        .from('operators')
        .select('*')
        .eq('id', operatorId)
        .single();

    if (error || !operator) {
        return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }

    // Evaluate each tier
    const tierStatus = TRUST_TIERS.map(tierDef => {
        const reqResults = tierDef.requirements.map(r => ({
            label: r.label,
            met: checkRequirement(operator, r),
            optional: (r as { optional?: boolean }).optional || false,
        }));

        const requiredMet = reqResults
            .filter(r => !r.optional)
            .every(r => r.met);
        const allMet = reqResults.every(r => r.met || r.optional);

        return {
            tier: tierDef.tier,
            label: tierDef.label,
            level: tierDef.level,
            requirements: reqResults,
            unlocked: requiredMet && allMet,
            paidUpgrade: tierDef.paidUpgrade,
            price: tierDef.price || null,
            paidExpedite: tierDef.paidExpedite || null,
            benefits: tierDef.benefits || null,
            badges: tierDef.badges,
        };
    });

    // Current tier = highest unlocked
    const currentTier = [...tierStatus]
        .reverse()
        .find(t => t.unlocked);

    // Next tier = first locked one above current
    const currentLevel = currentTier?.level || 0;
    const nextTier = tierStatus.find(t => t.level > currentLevel && !t.unlocked);

    return NextResponse.json({
        operatorId,
        currentTier: currentTier?.tier || 'unclaimed',
        currentLevel: currentTier?.level || 0,
        tiers: tierStatus,
        nextTier: nextTier ? {
            tier: nextTier.tier,
            label: nextTier.label,
            missingRequirements: nextTier.requirements.filter(r => !r.met && !r.optional),
            paidUpgrade: nextTier.paidUpgrade,
            price: nextTier.price,
        } : null,
    });
}

// POST: Request tier upgrade (for paid tiers)
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { operatorId, targetTier } = await req.json();
        if (!operatorId || !targetTier) {
            return NextResponse.json({ error: 'operatorId and targetTier required' }, { status: 400 });
        }

        const serviceSupabase = getServiceSupabase();

        // Verify ownership
        const { data: operator } = await serviceSupabase
            .from('operators')
            .select('id, user_id')
            .eq('id', operatorId)
            .single();

        if (!operator || operator.user_id !== user.id) {
            return NextResponse.json({ error: 'Not your listing' }, { status: 403 });
        }

        const tierDef = TRUST_TIERS.find(t => t.tier === targetTier);
        if (!tierDef) {
            return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
        }

        if (tierDef.paidUpgrade && tierDef.price) {
            // This requires a subscription — redirect to checkout
            return NextResponse.json({
                requiresPayment: true,
                tier: tierDef.tier,
                price: tierDef.price,
                checkoutUrl: `/plans?tier=${tierDef.tier}&source=verification_ladder`,
                benefits: tierDef.benefits,
            });
        }

        if (tierDef.paidExpedite) {
            // Optional paid expedite available
            return NextResponse.json({
                tier: tierDef.tier,
                canExpedite: true,
                expeditePrice: tierDef.paidExpedite,
                normalProcessing: 'Your documents will be reviewed within 48 hours.',
                expeditedProcessing: 'Pay for expedited review — verified within 4 hours.',
            });
        }

        // Free tier upgrade — just update the tier field
        await serviceSupabase
            .from('operators')
            .update({
                trust_tier: tierDef.tier,
                trust_tier_updated_at: new Date().toISOString(),
            })
            .eq('id', operatorId);

        // Grant badges
        const { data: current } = await serviceSupabase
            .from('operators')
            .select('badges')
            .eq('id', operatorId)
            .single();

        const existingBadges = Array.isArray(current?.badges) ? current.badges : [];
        const newBadges = [...new Set([...existingBadges, ...tierDef.badges])];

        await serviceSupabase
            .from('operators')
            .update({ badges: newBadges })
            .eq('id', operatorId);

        // PostHog
        if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'}/capture/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
                        distinct_id: user.id,
                        event: 'tier_upgraded',
                        properties: { operator_id: operatorId, new_tier: tierDef.tier },
                    }),
                });
            } catch { /* non-blocking */ }
        }

        return NextResponse.json({
            ok: true,
            tier: tierDef.tier,
            badges: newBadges,
            message: `Upgraded to ${tierDef.label}. ${tierDef.badges.join(', ')} badge${tierDef.badges.length > 1 ? 's' : ''} granted.`,
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
