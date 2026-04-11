import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin Service Role needed to bypass RLS for identity verification updates
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        
        // Ensure this is coming from Stripe Identity or Clear/ID.me
        if (payload.status === 'verified') {
            const userId = payload.metadata.user_id;

            const { error } = await supabase
                .from('profiles')
                .update({ 
                    kyc_verified_at: new Date().toISOString(),
                    kyc_provider_ref: payload.reference_id
                })
                .eq('id', userId);

            if (error) throw error;

            console.log(`[KYC-WEBHOOK] User ${userId} hard-verified via external provider.`);
        }
        
        return NextResponse.json({ success: true, processed: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
