import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { targetPhone, entityId, programType = "profile_claim", countryCode } = body;

        if (!targetPhone || !entityId) {
            return NextResponse.json({ error: "targetPhone and entityId are required" }, { status: 400 });
        }

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        
        // HYBRID LCR (LEAST COST ROUTING) DEPLOYMENT
        // T1 (Telnyx) is 30% cheaper. T2 (Twilio) provides 120-country fallback.
        const telnyxCoreRegions = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE'];
        
        // Retrieve explicit hybrid trunk IDs, or fallback to legacy single trunk
        const telnyxTrunkId = process.env.LIVEKIT_SIP_TRUNK_TELNYX || process.env.LIVEKIT_SIP_TRUNK_ID;
        const twilioTrunkId = process.env.LIVEKIT_SIP_TRUNK_TWILIO || process.env.LIVEKIT_SIP_TRUNK_ID;

        // Dynamic Trunk Selection: Route to T1 if supported, T2 if edge/remote
        const sipTrunkId = telnyxCoreRegions.includes(countryCode?.toUpperCase() || 'US') 
            ? telnyxTrunkId 
            : twilioTrunkId;

        if (!apiKey || !apiSecret || !sipTrunkId) {
            console.warn("LiveKit SIP credentials missing - skipping outbound dispatch.");
            return NextResponse.json({ error: "LiveKit SIP hybrid nodes not configured" }, { status: 500 });
        }

        const supabase = await createClient();

        const roomName = `outbound_${programType}_${entityId}_${Date.now()}`;

        // Prepare SIP Participant Creation request to LiveKit Cloud (Server API)
        // Note: Actual SDK payload may differ depending on the installed livekit-server-sdk version.
        // Below is the standard CreateSipParticipant REST format pattern used by LiveKit.
        // 4. Hyper-Local Persona Injection
        // Instructs the Voice AI to adopt regional accents, dialects, and formalities to increase conversion
        const localPersonas: Record<string, string> = {
            'US': 'Adopt a professional, direct American tone. Use standard logistics terminology.',
            'CA': 'Adopt a polite, professional Canadian tone. Be helpful and collaborative.',
            'GB': 'Adopt a professional British accent. Use formal business language.',
            'AU': 'Adopt a confident, friendly Australian accent. Use straightforward business language.',
            'MX': 'Adopt a professional Latin American Spanish accent, primarily communicating in Spanish unless spoken to in English. Use standard Mexican logistics terminology.'
        };
        const personaInstruction = localPersonas[countryCode?.toUpperCase()] || 'Adopt a neutral, professional business tone.';

        // 5. Psychological Behavior Fallbacks (Cole Gordon, Alex Hormozi, Billy Gene models)
        // Instruct the bot heavily on qualification, value stacking, and anger diffusion.
        const psychologicalDirectives = `
            STRATEGY:
            - Speed to logic (Cole Gordon): Qualify them in the first 10 seconds. "Hey, you run heavy haul out of [State], right?"
            - Disruption (Billy Gene): If they try to hang up quickly, disrupt them. "Wait, before you hang up and leave the directory leads to your competitors..."
            - Value Stacking (Alex Hormozi): Remove all risk. "It's 100% free to claim, I just need 10 seconds to verify it's you so we can send you loads."

            FALLBACK AND ANGER BEHAVIOR:
            - If they get angry or defensive: Immediately drop the pitch. Diffuse and agree. "I totally understand, you're busy running trucks. I'll take you off the dialer." 
            - If they explicitly yell or demand to be removed: Say "No problem, taking you off the list now, have a safe drive," and IMMEDIATELY trigger the DNC function.
            - If they hang up mid-sentence: Do not call back. The system will auto-route them to the SMS/Email fallback sequence.
        `;

        const systemInstruction = `Outbound sales sequence for ${programType}. ${personaInstruction} The prospect is located in region: ${countryCode}. ${psychologicalDirectives}`;

        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL 
            ? process.env.NEXT_PUBLIC_LIVEKIT_WS_URL.replace('wss://', 'https://') 
            : 'https://haulcommand.livekit.cloud';

        const res = await fetch(`${livekitUrl}/twirp/livekit.SIP/CreateSIPParticipant`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sip_trunk_id: sipTrunkId,
                sip_call_to: targetPhone,
                room_name: roomName,
                participant_identity: `bot_${programType}`,
                metadata: JSON.stringify({ programType, targetPhone, entityId, system_instruction: systemInstruction }) 
            })
        });

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`LiveKit SIP error: ${errBody}`);
        }

        // Log the event as "dialed"
        await supabase.from('livekit_outbound_eligibility').update({ 
            status: 'dialed', 
            last_called_at: new Date().toISOString() 
        }).eq('entity_id', entityId);

        await supabase.from('livekit_call_events').insert({
            room_name: roomName,
            participant_identity: `bot_${programType}`,
            call_type: 'outbound_sip',
            status: 'initiated',
            system_instruction: systemInstruction
        });

        return NextResponse.json({ success: true, roomName }, { status: 200 });

    } catch (e: any) {
        console.error("LiveKit Outbound Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
