import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function sendTelnyxReply(to: string, text: string) {
  if (!process.env.TELNYX_API_KEY || !process.env.NEXT_PUBLIC_TELNYX_NUMBER) {
    return;
  }

  await fetch("https://api.telnyx.com/v2/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.NEXT_PUBLIC_TELNYX_NUMBER,
      to,
      text,
    }),
  });
}

// Telnyx inbound webhook parser. It stores raw broker SMS intake, but never
// creates marketplace loads or notifies operators until route extraction is verified.
export async function POST(req: Request) {
  try {
    const payload = await req.json();

    if (payload.data?.event_type !== "message.received") {
      return NextResponse.json({ status: "ignored" });
    }

    const inboundText = payload.data?.payload?.text || "";
    const senderNumber = payload.data?.payload?.from?.phone_number || payload.data?.payload?.from || "unknown";

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: broker, error: brokerErr } = await supabase
      .from("ent_identities")
      .select("id, kyc_status")
      .eq("phone", senderNumber)
      .eq("role", "broker")
      .single();

    if (brokerErr || !broker) {
      console.warn(`Unrecognized intake attempt from ${senderNumber}`);
      return NextResponse.json({ status: "success", parsed: false, reason: "unauthorized" });
    }

    const parserConfigured = Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);
    const kycApproved = broker.kyc_status === "level_2";
    const status = kycApproved && parserConfigured ? "queued_for_verified_extraction" : "queued_for_extraction";
    const parserStatus = parserConfigured ? "configured_pending_handler" : "unconfigured";

    const { error: insertErr } = await supabase.from("cmd_runs").insert({
      owner_id: broker.id,
      status,
      payload: {
        raw_text: inboundText,
        sender: senderNumber,
        source: "telnyx_sms",
        parser_status: parserStatus,
        kyc_status: broker.kyc_status,
      },
    });

    if (insertErr) {
      throw insertErr;
    }

    await sendTelnyxReply(
      senderNumber,
      "Load request received. Haul Command queued it for extraction; no operators are notified until origin, destination, and requirements are verified."
    );

    return NextResponse.json({
      status: "success",
      parsed: false,
      buffered: true,
      reason: parserStatus,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ingestion failed";
    console.error("Ingestion Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
