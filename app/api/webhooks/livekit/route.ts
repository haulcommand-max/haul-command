import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { WebhookReceiver } from "livekit-server-sdk";

// ── Billing rate: $0.012 / minute (adjust via env)
const PER_MINUTE_RATE_CENTS = parseInt(process.env.LIVEKIT_BILLING_CENTS_PER_MIN || '2', 10);

export async function POST(req: NextRequest) {
    try {
        // Require Auth Header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return NextResponse.json({ success: false, message: "Missing Authorization header" }, { status: 401 });
        }

        const receiver = new WebhookReceiver(
            process.env.LIVEKIT_API_KEY!,
            process.env.LIVEKIT_API_SECRET!
        );

        // This verifies the signature and parses the event payload
        const rawBody = await req.text();
        const eventData = receiver.receive(rawBody, authHeader);
        const body = JSON.parse(rawBody);
        
        // This expects the LiveKit Egress/Call Completion Webhook format
        const { event, room, participant, sip_call_status, ai_disposition, target_phone, transcript, duration_seconds } = body;

        // Ensure this is a SIP Call termination event or AI Summary event
        if (event !== 'participant_left' && event !== 'room_finished' && event !== 'ai_summary' && eventData.event !== 'room_finished') {
            return NextResponse.json({ success: true, message: "Ignored non-termination event." });
        }

        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
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

        // ═══════════════════════════════════════════════════════════════
        // CONVERTED — AI agent successfully converted the call target
        // ═══════════════════════════════════════════════════════════════
        if (ai_disposition === 'converted' || ai_disposition === 'interested') {
            // Extract entity ID from roomName (format: outbound_programType_entityId_timestamp)
            const split = roomName?.split('_') || [];
            const programType = split.length >= 2 ? split[1] : 'unknown';
            const entityId = split.length >= 3 ? split[2] : null;

            // 1. Update call event to completed_converted
            await supabase.from('livekit_call_events').update({
                status: 'completed_converted',
                transcript_text: transcript || null,
                duration_seconds: duration_seconds || null,
                completed_at: new Date().toISOString(),
            }).eq('room_name', roomName);

            // 2. Write to mm_event_log for analytics pipeline
            if (entityId) {
                await supabase.from('mm_event_log').insert({
                    event_type: 'call_converted',
                    entity_id: entityId,
                    source: 'livekit_ai_agent',
                    payload: {
                        room_name: roomName,
                        program_type: programType,
                        disposition: ai_disposition,
                        target_phone: target_phone || null,
                        duration_seconds: duration_seconds || null,
                    },
                    created_at: new Date().toISOString(),
                });
            }

            // 3. Record billing event for call minutes
            if (duration_seconds && duration_seconds > 0) {
                const callMinutes = Math.ceil(duration_seconds / 60);
                await supabase.from('billing_events').insert({
                    event_type: 'ai_voice_call',
                    quantity: callMinutes,
                    unit: 'minutes',
                    entity_id: entityId,
                    metadata: { room_name: roomName, raw_seconds: duration_seconds },
                    created_at: new Date().toISOString(),
                }).catch(() => { /* billing table may not exist yet — non-fatal */ });
            }

            return NextResponse.json({ success: true, action: "Conversion recorded.", entity_id: entityId });
        }

        // Hang Up / No Conversion Fallback -> Push to Email/SMS Pipeline
        if (sip_call_status === 'hung_up' || ai_disposition === 'hung_up' || ai_disposition === 'no_conversion') {
            
            await supabase.from('livekit_call_events').update({
                status: 'terminated_fallback',
                transcript_text: transcript || null,
                duration_seconds: duration_seconds || null,
            }).eq('room_name', roomName);

            const split = roomName?.split('_') || [];
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

        // Store transcript for any unhandled event type that includes one
        if (transcript && roomName) {
            await supabase.from('livekit_call_events').update({
                transcript_text: transcript,
            }).eq('room_name', roomName);
        }

        // ═══════════════════════════════════════════════════════════════
        // GUARDRAIL #7: LiveKit Completion Billing + Transcript Storage
        // Handles room_finished + ai_summary events for the ESCROW billing path
        // ═══════════════════════════════════════════════════════════════
        if ((event === 'room_finished' || eventData.event === 'room_finished') && roomName) {
            const actualDuration = duration_seconds ?? room?.duration ?? null;

            // 7a. Mark call ended in mm_event_log
            await supabase.from('mm_event_log').upsert({
                event_type: 'call_ended',
                entity_id: roomName,
                source: 'livekit_webhook',
                payload: {
                    room_name: roomName,
                    duration_seconds: actualDuration,
                    participant_count: room?.num_participants ?? null,
                },
                created_at: new Date().toISOString(),
            }, { onConflict: 'entity_id,event_type' }).catch(() => {});

            // 7b. Billing Capture — ceil to nearest minute
            if (actualDuration && actualDuration > 0) {
                const billableMinutes = Math.ceil(actualDuration / 60);
                const billAmountCents = billableMinutes * PER_MINUTE_RATE_CENTS;
                await supabase.from('hc_call_billing').insert({
                    room_name: roomName,
                    duration_seconds: actualDuration,
                    billable_minutes: billableMinutes,
                    amount_cents: billAmountCents,
                    status: 'PENDING',
                    billed_at: new Date().toISOString(),
                }).catch((e: any) => console.warn('[LiveKit] Billing insert skip:', e?.message));
            }

            // 7c. Transcript storage → secure_vault (Supabase Storage)
            if (transcript) {
                const vaultPath = `livekit_transcripts/${roomName}/transcript.json`;
                const vaultPayload = JSON.stringify({
                    room_name: roomName,
                    duration_seconds: actualDuration,
                    transcript,
                    stored_at: new Date().toISOString(),
                });
                await supabase.storage
                    .from('secure_vault')
                    .upload(vaultPath, vaultPayload, {
                        contentType: 'application/json',
                        upsert: true,
                    }).catch((e: any) => console.warn('[LiveKit] Transcript vault skip:', e?.message));

                // Also update the call event row
                await supabase.from('livekit_call_events').update({
                    transcript_text: transcript,
                    duration_seconds: actualDuration,
                    completed_at: new Date().toISOString(),
                }).eq('room_name', roomName).catch(() => {});
            }
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("LiveKit Webhook Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

