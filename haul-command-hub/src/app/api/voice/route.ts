import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/voice/token
 *
 * Generates a LiveKit room token for the voice AI agent.
 * In production, this uses livekit-server-sdk to create a signed JWT.
 *
 * Required env vars:
 * - LIVEKIT_API_KEY
 * - LIVEKIT_API_SECRET
 * - LIVEKIT_URL
 */
export async function POST(req: NextRequest) {
  try {
    const { country, query } = await req.json();

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        { error: 'Voice service not configured. LiveKit credentials missing.' },
        { status: 503 }
      );
    }

    // In production, use livekit-server-sdk:
    // import { AccessToken } from 'livekit-server-sdk';
    // const at = new AccessToken(apiKey, apiSecret, {
    //   identity: `user-${Date.now()}`,
    //   name: `Voice Query: ${query}`,
    // });
    // at.addGrant({
    //   roomJoin: true,
    //   room: `voice-${country}-${Date.now()}`,
    //   canPublish: true,
    //   canSubscribe: true,
    // });
    // const token = await at.toJwt();

    return NextResponse.json({
      token: 'pending-livekit-setup',
      url: livekitUrl,
      room: `voice-${country}-${Date.now()}`,
      country,
      query,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate voice token' },
      { status: 500 }
    );
  }
}
