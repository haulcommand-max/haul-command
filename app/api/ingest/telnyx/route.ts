import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Telnyx Inbound Webhook Parser (15X Zero-Touch Broker Load Ingestion)
export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Ensure this is an inbound message from Telnyx
    if (payload.data?.event_type !== "message.received") {
      return NextResponse.json({ status: "ignored" });
    }

    const inboundText = payload.data?.payload?.text || "";
    const senderNumber = payload.data?.payload?.from?.phone_number || payload.data?.payload?.from || "unknown";

    // 1. Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Identify the Broker by Phone/Email (KYC verification logic)
    const { data: broker, error: brokerErr } = await supabase
      .from('ent_identities')
      .select('id, kyc_status')
      .eq('phone', senderNumber)
      .eq('role', 'broker')
      .single();

    if (brokerErr || !broker) {
      // Logic for unrecognized senders (Claim Trap)
      console.warn(`Unrecognized intake attempt from ${senderNumber}`);
      return NextResponse.json({ status: "success", parsed: false, reason: "unauthorized" });
    }

    // 3. KYC Token-Compute Buffer (Cost Protection)
    // Buffer non-KYC loads for async batch parsing to prevent token exhaustion.
    if (broker.kyc_status !== 'level_2') {
      console.log(`Buffering load for KYC non-compliant broker: ${broker.id}`);
      await supabase.from('cmd_runs').insert({
        owner_id: broker.id,
        status: 'queued_for_extraction', 
        payload: { raw_text: inboundText, priority: 'low' }
      });
      return NextResponse.json({ status: "success", parsed: false, buffered: true });
    }

    // 4. Lightweight Edge-LLM parsing for the Route/Load Details (Enterprise Only)
    // Example: "Need 1 height pole from Dallas TX to Calgary AB tomorrow. 15ft wide."
    // In production, this would hit the exact OpenAI or Gemini inference node.
    const mockParsedOrigin = inboundText.includes('Dallas') ? 'Dallas, TX' : 'Unknown Origin';
    const mockParsedDest = inboundText.includes('Calgary') ? 'Calgary, AB' : 'Unknown Destination';

    // 5. Inject the parsed load directly to the open Marketplace
    const { error: insertErr } = await supabase
      .from('cmd_runs') // or dedicated `mkt_loads` table
      .insert({
        owner_id: broker.id,
        status: 'pending_coverage',
        payload: {
          raw_text: inboundText,
          origin: mockParsedOrigin,
          destination: mockParsedDest,
        }
      });

    if (insertErr) {
      throw insertErr;
    }

    // 6. Trigger the push notification logic to Firebase / Comms table implicitly built into Supabase edge rules
    await supabase.from('ntf_outbound_events').insert({
        channel: 'push',
        target_role: 'operator',
        content: `🚨 New Load: ${mockParsedOrigin} to ${mockParsedDest}. Claim to bid.`,
        urgency: 'high'
    });

    // 7. Return auto-reply for guaranteed upsell via Telnyx out-bound
    const smsReply = `Load ingested. 14 escorts matched. Reply 'PIN' to guarantee priority coverage for $49.`;
    
    // Call Telnyx outbound message API (fire and forget)
    fetch("https://api.telnyx.com/v2/messages", {
       method: "POST",
       headers: {
           "Authorization": `Bearer ${process.env.TELNYX_API_KEY}`,
           "Content-Type": "application/json"
       },
       body: JSON.stringify({
           from: process.env.NEXT_PUBLIC_TELNYX_NUMBER,
           to: senderNumber,
           text: smsReply
       })
    });

    return NextResponse.json({ status: "success", parsed: true });
  } catch (error: any) {
    console.error("Ingestion Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}mui
