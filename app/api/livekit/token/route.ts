import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const { roomName, participantIdentity, role = 'claim_verifier' } = await req.json();

        if (!roomName || !participantIdentity) {
            return NextResponse.json({ error: "roomName and participantIdentity are required" }, { status: 400 });
        }

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;

        // Note: For real environment, ensure LIVEKIT_URL is also set so the client knows where to connect.
        if (!apiKey || !apiSecret) {
            return NextResponse.json({ error: "LiveKit credentials not configured in environment" }, { status: 500 });
        }

        // Authenticate the user asking for a token (if required)
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Create the token. We enable publish and subscribe permissions.
        const at = new AccessToken(apiKey, apiSecret, {
            identity: participantIdentity,
            // We stamp the user's role and ID onto the LiveKit token metadata so the AI agent knows who it's talking to
            metadata: JSON.stringify({ 
                role, 
                userId: user?.id || 'anonymous_guest',
                system_instruction: role === 'claim_verifier' 
                    ? "Verify the caller's identity and guide them to claim their profile." 
                    : "Assist the caller with heavy haul workflow questions."
            })
        });

        at.addGrant({ 
            roomJoin: true, 
            room: roomName, 
            canPublish: true, 
            canSubscribe: true, 
            canPublishData: true // needed for tool-calling/transcripts
        });

        const token = await at.toJwt();

        return NextResponse.json({ 
            token,
            url: process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL
        }, { status: 200 });

    } catch (e: any) {
        console.error("LiveKit Token Generation Error:", e);
        return NextResponse.json({ error: e.message || "Failed to generate token" }, { status: 500 });
    }
}
