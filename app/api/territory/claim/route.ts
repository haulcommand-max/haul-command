/**
 * POST /api/territory/claim
 * Claims a territory slot in a county for the authenticated escort.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { county_fips } = await req.json();
        if (!county_fips) return NextResponse.json({ error: 'county_fips required' }, { status: 400 });

        // Auth
        const cookieStore = await cookies();
        const supabaseUser = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll() } }
        );
        const { data: { user } } = await supabaseUser.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const admin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check county exists and has slots
        const { data: county } = await admin
            .from('county_territories')
            .select('*')
            .eq('county_fips', county_fips)
            .single();

        if (!county) return NextResponse.json({ error: 'County not found' }, { status: 404 });

        const maxSlots = county.max_slots ?? 3;
        const claimedSlots = county.claimed_slots ?? 0;
        if (claimedSlots >= maxSlots) {
            return NextResponse.json({ error: 'No slots remaining' }, { status: 409 });
        }

        // Check if already claimed by this user
        const { data: existing } = await admin
            .from('territory_claims')
            .select('id')
            .eq('user_id', user.id)
            .eq('county_fips', county_fips)
            .eq('status', 'active')
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: 'Already claimed' }, { status: 409 });
        }

        // Insert claim
        const { data: claim, error: err } = await admin
            .from('territory_claims')
            .insert({
                user_id: user.id,
                county_fips,
                county_name: county.county_name,
                state_code: county.state_code,
                status: 'active',
                claimed_at: new Date().toISOString(),
                streak_start: new Date().toISOString(),
                streak_days: 0,
            })
            .select('id')
            .single();

        if (err) return NextResponse.json({ error: 'Failed to claim' }, { status: 500 });

        // Increment slot counter
        await admin
            .from('county_territories')
            .update({ claimed_slots: claimedSlots + 1 })
            .eq('county_fips', county_fips);

        // Send defense alerts to existing claimants
        const { data: others } = await admin
            .from('territory_claims')
            .select('user_id')
            .eq('county_fips', county_fips)
            .eq('status', 'active')
            .neq('user_id', user.id);

        if (others && others.length > 0) {
            const { data: profile } = await admin.from('profiles').select('display_name').eq('id', user.id).single();
            const alerts = others.map((o: any) => ({
                user_id: o.user_id,
                channel: 'inapp',
                title: '🚨 Territory Alert!',
                body: `${profile?.display_name ?? 'A new operator'} claimed a spot in ${county.county_name}, ${county.state_code}`,
                metadata: { type: 'territory_defense', event_type: 'NEW_CLAIM', intruder_id: user.id, county_fips },
            }));
            await admin.from('notifications').insert(alerts);
        }

        // Audit
        await admin.from('audit_events').insert({
            event_type: 'territory_claimed',
            actor_id: user.id,
            subject_type: 'territory',
            subject_id: claim?.id,
            payload: { county_fips, county_name: county.county_name, state_code: county.state_code },
        });

        return NextResponse.json({
            ok: true,
            claim_id: claim?.id,
            remaining_slots: maxSlots - claimedSlots - 1,
        });
    } catch (err) {
        return NextResponse.json({ error: 'Server error', detail: String(err) }, { status: 500 });
    }
}
