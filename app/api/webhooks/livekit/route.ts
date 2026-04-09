import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        // This expects the LiveKit Egress/Call Completion Webhook format
        const { event, room, participant, sip_call_status, ai_disposition, target_phone } = body;

        // Ensure this is a SIP Call termination event or AI Summary event
        if (event !== 'participant_left' && event !== 'room_finished' && event !== 'ai_summary') {
            return NextResponse.json({ success: true, message: "Ignored non-termination event." });
        }

        const supabase = await createClient(process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const roomName = room?.name || body.room_name;

        // If the AI explicitly flagged them as angry/DNC via tool call or summary disposition
        if (ai_disposition === 'angry' || ai_disposition === 'dnc_requested') {
            
            // 1. Permanently remove from active dialer view via strict DNC registry
            if (target_phone) {
                await supabase.from('telephony_dnc_registry').upsert({
                    phone_number: target_phone,
                    reason: ai_disposition === 'angry' ? 'legal_demand' : 'opt_out',
                    source: 'livekit_ai_agent'
                }, { onConflict: 'phone_number' });
            }

            // 2. Mark the event
            await supabase.from('livekit_call_events').update({
                status: 'terminated_angry'
            }).eq('room_name', roomName);

            return NextResponse.json({ success: true, action: "Added to DNC." });
        }

        // Hang Up / No Conversion Fallback -> Push to Email/SMS Pipeline
        if (sip_call_status === 'hung_up' || ai_disposition === 'hung_up' || ai_disposition === 'no_conversion') {
            
            await supabase.from('livekit_call_events').update({
                status: 'terminated_fallback'
            }).eq('room_name', roomName);

            // TODO: Extract entity ID from roomName (format: outbound_programType_entityId_timestamp)
            const split = roomName.split('_');
            const entityId = split.length >= 3 ? split[2] : null;

            if (entityId) {
                // Shift them to the SMS/Email asynchronous follow-up campaign
                await supabase.from('marketing_campaign_queue').insert({
                    entity_id: entityId,
                    campaign_type: 'omnichannel_fallback',
                    trigger_reason: 'livekit_hangup',
                    status: 'queued'
                });
            }

            return NextResponse.json({ success: true, action: "Routed to Omnichannel Fallback." });
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("LiveKit Webhook Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
