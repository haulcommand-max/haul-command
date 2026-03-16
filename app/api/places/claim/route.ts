import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { startClaim, verifyClaim, getAvailableVerificationMethods } from "@/lib/places/claim-engine";

/**
 * POST /api/places/claim
 * Starts or verifies a place claim.
 * 
 * Body: { action: 'start' | 'verify', ...params }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body;

        if (action === 'start') {
            const result = await startClaim({
                placeId: body.placeId,
                claimantAccountId: body.claimantAccountId,
                claimantRole: body.claimantRole || 'owner',
                verificationMethod: body.verificationMethod,
                businessPhone: body.businessPhone,
                businessEmail: body.businessEmail,
                businessWebsite: body.businessWebsite,
            });
            return NextResponse.json(result, { status: result.success ? 200 : 400 });
        }

        if (action === 'verify') {
            const result = await verifyClaim({
                claimId: body.claimId,
                otpCode: body.otpCode,
                dnsVerified: body.dnsVerified,
                htmlTagVerified: body.htmlTagVerified,
            });
            return NextResponse.json(result, { status: result.success ? 200 : 400 });
        }

        if (action === 'methods') {
            // Get available verification methods for a place
            const supabase = getSupabaseAdmin();
            const { data: place } = await supabase
                .from('places')
                .select('phone, website')
                .eq('place_id', body.placeId)
                .single();

            if (!place) return NextResponse.json({ error: 'Place not found' }, { status: 404 });

            const methods = getAvailableVerificationMethods(place);
            return NextResponse.json({ methods });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        console.error("Place Claim API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
