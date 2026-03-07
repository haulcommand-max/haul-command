import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/messaging — Start conversation or send message
 * Actions: "start_conversation", "send_message"
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const sb = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        if (body.action === "start_conversation") {
            const { data, error } = await sb.rpc("hc_start_conversation", {
                p_participants: body.participants,
                p_type: body.type || "direct",
                p_initial_message: body.message || null,
                p_sender_id: body.sender_id || null,
            });
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json(data);
        }

        if (body.action === "send_message") {
            const { data, error } = await sb.rpc("hc_send_msg", {
                p_conversation_id: body.conversation_id,
                p_sender_id: body.sender_id,
                p_body: body.body,
            });
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json(data);
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
