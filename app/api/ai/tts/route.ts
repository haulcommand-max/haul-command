/**
 * TTS API Route — OpenAI Speech Proxy
 * 
 * POST /api/ai/tts
 * Body: { text: string, voice?: string, speed?: number }
 * Returns: audio/mpeg binary stream
 */
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Server missing OPENAI_API_KEY' }, { status: 500 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const text = body?.text;
    const voice = body?.voice || 'alloy';
    const speed = body?.speed || 1.0;

    if (!text || typeof text !== 'string' || text.length < 1) {
      return Response.json({ error: 'Missing text' }, { status: 400 });
    }

    if (text.length > 4096) {
      return Response.json({ error: 'Text too long (max 4096 chars)' }, { status: 413 });
    }

    // Forward to OpenAI Speech API
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',       // Use tts-1 for speed, tts-1-hd for quality
        input: text,
        voice,
        speed,
        response_format: 'mp3',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[TTS] OpenAI Speech error:', res.status, err);
      return Response.json({ error: 'Speech synthesis failed', details: err }, { status: res.status });
    }

    // Stream audio back to client
    const audioBuffer = await res.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('[TTS] Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
