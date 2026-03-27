import { NextRequest, NextResponse } from 'next/server';
import { generateAgentToken } from '@/lib/livekit/agent-dispatcher';

// POST /api/livekit/token
// Generates a LiveKit access token for a room
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { roomName, identity } = body;

  if (!roomName || !identity) {
    return NextResponse.json({ error: 'roomName and identity required' }, { status: 400 });
  }

  try {
    const token = await generateAgentToken(roomName, identity);
    return NextResponse.json({ token });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Token generation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
