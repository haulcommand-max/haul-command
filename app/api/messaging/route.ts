import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/messaging — Start conversation or send message
 * Actions: "start_conversation", "send_message"
 *
 * SECURITY: Requires authenticated user. sender_id must match auth user.
 */
export async function POST(req: NextRequest) {
    try {
        // 1. Verify authentication
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const body = await req.json();

        // 2. Validate sender_id matches authenticated user
        if (body.sender_id && body.sender_id !== user.id) {
            return NextResponse.json(
                { error: "sender_id must match authenticated user" },
                { status: 403 }
            );
        }

        // Use admin client for RPC execution (may need elevated permissions),
        // but sender identity is always the authenticated user
        const sb = getSupabaseAdmin();
        const authenticatedSenderId = user.id;

        if (body.action === "start_conversation") {
            const { data, error } = await sb.rpc("hc_start_conversation", {
                p_participants: body.participants,
                p_type: body.type || "direct",
                p_initial_message: body.message || null,
                p_sender_id: authenticatedSenderId,
            });
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json(data);
        }

        if (body.action === "send_message") {
            const { data, error } = await sb.rpc("hc_send_msg", {
                p_conversation_id: body.conversation_id,
                p_sender_id: authenticatedSenderId,
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

