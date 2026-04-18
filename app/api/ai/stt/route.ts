/**
 * STT API Route — OpenAI Whisper Proxy
 * 
 * POST /api/ai/stt
 * Body: FormData with 'file' (audio blob) and optional 'language'
 * Returns: { text: string }
 */
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Server missing OPENAI_API_KEY' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;
    const language = (formData.get('language') as string) || 'en';

    if (!file) {
      return Response.json({ error: 'Missing audio file' }, { status: 400 });
    }

    // Forward to OpenAI Whisper
    const whisperForm = new FormData();
    whisperForm.append('file', file, 'audio.webm');
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('language', language);
    whisperForm.append('response_format', 'json');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: whisperForm,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[STT] Whisper error:', res.status, err);
      return Response.json({ error: 'Transcription failed', details: err }, { status: res.status });
    }

    const data = await res.json();
    return Response.json({ text: data.text || '' });
  } catch (err: any) {
    console.error('[STT] Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
