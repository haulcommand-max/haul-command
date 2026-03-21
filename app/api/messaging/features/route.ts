/**
 * GET /api/messaging/features
 * Returns messaging feature gates based on user's subscription tier.
 * Free / Pro ($29) / Elite ($79) — gates read receipts, bulk, templates, online status.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

type Tier = 'free' | 'pro' | 'elite';

const FEATURES: Record<string, { tier: Tier; label: string; description: string }> = {
    read_receipts: { tier: 'pro', label: 'Read Receipts', description: 'See when your messages are read' },
    bulk_message: { tier: 'pro', label: 'Bulk Message (up to 5)', description: 'Send same offer to 5 operators at once' },
    message_templates: { tier: 'pro', label: 'Message Templates (10)', description: 'Save and reuse message templates' },
    response_time_badge: { tier: 'pro', label: 'Response Time Badge', description: 'Gold clock badge for <30min avg response' },
    response_guarantee: { tier: 'elite', label: '2-Hour Response Guarantee', description: 'Guaranteed 2h response or score drops' },
    online_indicator: { tier: 'elite', label: 'Online Indicator', description: 'Green dot when active in app' },
    load_offer_priority: { tier: 'elite', label: 'Load Offer Priority', description: 'Receive offers 10 min before standard operators' },
};

const TIER_RANK: Record<Tier, number> = { free: 0, pro: 1, elite: 2 };

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const admin = getSupabaseAdmin();
        const { data: profile } = await admin.from('profiles').select('subscription_tier').eq('id', user.id).single();
        const userTier = (profile?.subscription_tier || 'free') as Tier;
        const userRank = TIER_RANK[userTier] || 0;

        const gates = Object.entries(FEATURES).map(([key, feat]) => ({
            feature: key,
            label: feat.label,
            description: feat.description,
            required_tier: feat.tier,
            unlocked: userRank >= TIER_RANK[feat.tier],
            upgrade_prompt: userRank < TIER_RANK[feat.tier]
                ? `Upgrade to ${feat.tier.charAt(0).toUpperCase() + feat.tier.slice(1)} to unlock ${feat.label}`
                : null,
        }));

        return NextResponse.json({
            ok: true,
            current_tier: userTier,
            features: gates,
            upgrade_url: '/plans',
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
