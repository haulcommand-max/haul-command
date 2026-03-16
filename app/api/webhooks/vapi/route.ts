import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// Vapi Webhook Handler
// Handles call logging, transcription saving, and intelligence extraction via webhook payloads.

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();

        // 1. Verify Vapi signature / IP (Skipped in draft, add crypto verification matching Vapi docs)
        // Vapi sends specific headers to verify the payload

        const supabase = getSupabaseAdmin();

        // Events: 'EndOfCallReport', 'StatusUpdate', etc.
        if (payload.message?.type === 'end-of-call-report') {
            const report = payload.message;
            const callId = report.call?.id;

            if (!callId) return NextResponse.json({ error: "Missing call ID" }, { status: 400 });

            // Insert call event
            await supabase.from('vapi_call_events').upsert({
                call_id: callId,
                vapi_agent_id: report.call?.assistantId,
                direction: report.call?.type === 'inboundPhoneCall' ? 'inbound' : 'outbound',
                caller_number: report.call?.customer?.number,
                recipient_number: report.call?.assistant?.phoneNumber,
                call_status: report.call?.status,
                duration_seconds: report.call?.durationMetrics?.callDurationSeconds || 0,
                recording_url: report.recordingUrl,
                cost_usd: report.call?.cost || 0
            });

            // If transcripts exist, insert them
            if (report.transcript && Array.isArray(report.transcript)) {
                const transcriptInserts = report.transcript.map((t: any) => ({
                    call_id: callId,
                    role: t.role,
                    content: t.content,
                    timestamp: new Date().toISOString() // Or use t.time if provided
                }));
                if (transcriptInserts.length > 0) {
                    await supabase.from('vapi_call_transcripts').insert(transcriptInserts);
                }
            }

            // If intelligence/analysis exists, insert
            if (report.analysis) {
                await supabase.from('vapi_call_intelligence').upsert({
                    call_id: callId,
                    sentiment_score: report.analysis.sentiment === 'Positive' ? 1.0 : (report.analysis.sentiment === 'Negative' ? -1.0 : 0),
                    extracted_entities: report.analysis.extractedData || {},
                });
            }
        }

        return NextResponse.json({ received: true });

    } catch (e: any) {
        console.error("Vapi webhook Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
