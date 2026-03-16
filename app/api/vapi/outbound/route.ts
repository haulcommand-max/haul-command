import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// Vapi Outbound Dialer Endpoint
// Triggers outbound calls using the Vapi API to claim profiles, reach out to sponsors, etc.

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { targetNumber, vapiAgentId, type = "profile_claim", countryCode } = body;

        // 1. Compliance Verification
        const supabase = getSupabaseAdmin();

        if (!countryCode) return NextResponse.json({ error: "Country code is required" }, { status: 400 });

        const { data: compliance } = await supabase
            .from('country_compliance_profiles')
            .select('outbound_allowed, call_recording_consent')
            .eq('country_code', countryCode)
            .single();

        if (!compliance || !compliance.outbound_allowed) {
            return NextResponse.json({ error: `Outbound calling is strictly disabled for country code: ${countryCode}` }, { status: 403 });
        }

        // 2. Gate Verification - VAPI API Key check
        if (!process.env.VAPI_PRIVATE_API_KEY) {
            console.warn("VAPI_PRIVATE_API_KEY missing - skipping outbound call.");
            return NextResponse.json({ error: "Voice integration not fully configured" }, { status: 501 });
        }

        // 3. Initiate Call with Vapi
        const response = await fetch("https://api.vapi.ai/call", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.VAPI_PRIVATE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                assistantId: vapiAgentId,
                customer: {
                    number: targetNumber
                },
                // Pass custom metadata for webhook association
                metadata: {
                    type,
                    countryCode
                }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Vapi API error: ${errBody}`);
        }

        const callData = await response.json();
        return NextResponse.json({ success: true, callId: callData.id });

    } catch (e: any) {
        console.error("Vapi Outbound Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
