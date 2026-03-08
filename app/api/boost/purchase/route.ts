/**
 * POST /api/boost/purchase
 * GET  /api/boost/purchase?operatorId=xxx
 * 
 * Profile Boost — operators pay to appear higher in search results.
 * Boost tiers:
 *   - spotlight: $9.99/week — appears at top of their territory/state
 *   - featured:  $29/month — gold badge + appears in featured section
 *   - premium:   $79/month — max visibility + competitor suppression radius
 * 
 * Phase 1: profile_boost_live + sponsored_ranking_live
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceSupabase() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

const BOOST_TIERS = {
    spotlight: {
        name: 'Spotlight',
        price_cents: 999,
        interval: 'week',
        duration_days: 7,
        search_multiplier: 1.5,
        badge: 'spotlight',
        benefits: [
            'Appear at top of state/territory search results',
            'Spotlight badge on profile for 7 days',
        ],
    },
    featured: {
        name: 'Featured',
        price_cents: 2900,
        interval: 'month',
        duration_days: 30,
        search_multiplier: 2.0,
        badge: 'featured_operator',
        benefits: [
            'Gold "Featured" badge on profile',
            'Appear in featured operators section',
            'Priority in directory browse listings',
            '2x search result ranking boost',
        ],
    },
    premium: {
        name: 'Premium Visibility',
        price_cents: 7900,
        interval: 'month',
        duration_days: 30,
        search_multiplier: 3.0,
        badge: 'premium_visibility',
        benefits: [
            'Maximum search visibility — always at top',
            'Premium badge with animated glow',
            'Featured in territory, corridor, and state pages',
            'Competitor suppression in 50-mile radius',
            'Priority in AI match recommendations',
            '3x search ranking boost',
        ],
    },
} as const;

type BoostTier = keyof typeof BOOST_TIERS;

// GET: Return available boost tiers and active boosts
export async function GET(req: NextRequest) {
    const operatorId = req.nextUrl.searchParams.get('operatorId');

    if (operatorId) {
        const serviceSupabase = getServiceSupabase();
        const { data: activeBoosts } = await serviceSupabase
            .from('profile_boosts')
            .select('*')
            .eq('operator_id', operatorId)
            .gte('expires_at', new Date().toISOString())
            .order('search_multiplier', { ascending: false });

        return NextResponse.json({
            tiers: BOOST_TIERS,
            activeBoosts: activeBoosts || [],
        });
    }

    return NextResponse.json({ tiers: BOOST_TIERS });
}

// POST: Purchase a boost
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { operatorId, tier } = await req.json() as {
            operatorId: string;
            tier: string;
        };

        if (!operatorId || !tier) {
            return NextResponse.json({ error: 'operatorId and tier required' }, { status: 400 });
        }

        if (!(tier in BOOST_TIERS)) {
            return NextResponse.json({ error: 'Invalid boost tier' }, { status: 400 });
        }

        const boostConfig = BOOST_TIERS[tier as BoostTier];
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

        // Check for existing active boost of same or higher tier
        const { data: existing } = await serviceSupabase
            .from('profile_boosts')
            .select('id, tier, expires_at')
            .eq('operator_id', operatorId)
            .gte('expires_at', new Date().toISOString())
            .single();

        if (existing && BOOST_TIERS[existing.tier as BoostTier]?.search_multiplier >= boostConfig.search_multiplier) {
            return NextResponse.json({
                error: 'You already have an equal or higher boost active',
                currentBoost: existing,
            }, { status: 409 });
        }

        const expiresAt = new Date(Date.now() + boostConfig.duration_days * 24 * 60 * 60 * 1000).toISOString();

        // Create the boost record
        const { data: boost, error: boostErr } = await serviceSupabase
            .from('profile_boosts')
            .upsert({
                operator_id: operatorId,
                tier: tier,
                search_multiplier: boostConfig.search_multiplier,
                badge: boostConfig.badge,
                price_cents: boostConfig.price_cents,
                purchased_at: new Date().toISOString(),
                expires_at: expiresAt,
                status: 'active',
                purchased_by: user.id,
            }, { onConflict: 'operator_id' })
            .select()
            .single();

        if (boostErr) {
            return NextResponse.json({ error: boostErr.message }, { status: 500 });
        }

        // Grant badge
        const { data: current } = await serviceSupabase
            .from('operators')
            .select('badges')
            .eq('id', operatorId)
            .single();

        const badges = Array.isArray(current?.badges) ? current.badges : [];
        if (!badges.includes(boostConfig.badge)) {
            await serviceSupabase
                .from('operators')
                .update({ badges: [...badges, boostConfig.badge] })
                .eq('id', operatorId);
        }

        // PostHog
        if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'}/capture/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
                        distinct_id: user.id,
                        event: 'boost_purchased',
                        properties: {
                            operator_id: operatorId,
                            tier,
                            price_cents: boostConfig.price_cents,
                        },
                    }),
                });
            } catch { /* non-blocking */ }
        }

        return NextResponse.json({
            ok: true,
            boost,
            message: `${boostConfig.name} boost activated. Expires ${new Date(expiresAt).toLocaleDateString()}.`,
            checkoutUrl: `/api/subscriptions/checkout?boost=${tier}&operatorId=${operatorId}`,
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
