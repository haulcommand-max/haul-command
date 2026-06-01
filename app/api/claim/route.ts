export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { EMAIL_CONFIRMATION_REQUIRED, isEmailConfirmed } from '@/lib/auth/confirmed-user';

export async function POST(req: NextRequest) {
    try {
        const auth = createClient();
        const { data: { user } } = await auth.auth.getUser();
        if (!isEmailConfirmed(user)) {
            return NextResponse.json(EMAIL_CONFIRMATION_REQUIRED, { status: 403 });
        }

        const body = await req.json();
        const { hash } = body;

        if (!hash) {
            return NextResponse.json({ error: 'Missing hash' }, { status: 400 });
        }

        // Must use service role to reassign user_id on the row
        const supabase = getSupabaseAdmin();

        // 1. Find the seeded profile
        const { data: profile, error: fetchError } = await supabase
            .from('hc_global_operators')
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
            .from('hc_global_operators')
            .update({
                user_id: user.id,
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
        if (oldTempId && oldTempId !== user.id) {
            await supabase.from('profiles').delete().eq('id', oldTempId);
        }

        return NextResponse.json({ success: true, profileId: profile.id });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Claim failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
