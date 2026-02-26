export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { hash, userId } = body;

        if (!hash || !userId) {
            return NextResponse.json({ error: 'Missing hash or userId' }, { status: 400 });
        }

        // Must use service role to reassign user_id on the row
        const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Find the seeded profile
        const { data: profile, error: fetchError } = await supabase
            .from('driver_profiles')
            .select('id, user_id, is_seeded')
            .eq('claim_hash', hash)
            .single();

        if (fetchError || !profile) {
            return NextResponse.json({ error: 'Invalid claim link' }, { status: 404 });
        }

        if (!profile.is_seeded) {
            return NextResponse.json({ error: 'Already claimed' }, { status: 400 });
        }

        const oldTempId = profile.user_id;

        // 2. Update the profile:
        // - Rebind user_id to the REAL auth.uid() (the new user)
        // - Remove the seeded flag
        // - Null out the hash so it can't be used again
        // - Set claimed_at
        const { error: updateError } = await supabase
            .from('driver_profiles')
            .update({
                user_id: userId,
                is_seeded: false,
                claim_hash: null,
                claimed_at: new Date().toISOString(),
                badges: ['early_operator'], // Hand out the Early Coverage Badge automatically!
            })
            .eq('id', profile.id);

        if (updateError) {
            console.error('Update err:', updateError);
            return NextResponse.json({ error: 'Failed to bind profile' }, { status: 500 });
        }

        // 3. Clean up the old temporary profile row if needed
        // (Assuming you created a dummy row in 'profiles' for the seed)
        if (oldTempId && oldTempId !== userId) {
            await supabase.from('profiles').delete().eq('id', oldTempId);
        }

        return NextResponse.json({ success: true, profileId: profile.id });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
