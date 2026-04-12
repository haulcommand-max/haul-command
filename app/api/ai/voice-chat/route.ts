/**
 * VOICE CHAT API Route — Streaming Claude for Voice
 * 
 * POST /api/ai/voice-chat
 * Body: { messages: [{role, content}], model?, systemPrompt?, maxTokens? }
 * Returns: SSE stream of text deltas
 * 
 * This endpoint streams Claude responses as Server-Sent Events (SSE),
 * designed for the voice adapter to chunk into TTS sentences.
 */
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Server missing ANTHROPIC_API_KEY' }, { status: 500 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const messages = body?.messages;
    const model = body?.model || 'claude-haiku-4-5';
    const systemPrompt = body?.systemPrompt || 'You are the Haul Command AI assistant. Be concise and conversational — your responses will be spoken aloud. Keep answers under 3 sentences unless the user asks for detail.';
    const maxTokens = Math.min(body?.maxTokens || 1024, 4096);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Missing messages' }, { status: 400 });
    }

    // Call Claude with streaming
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[VoiceChat] Claude error:', res.status, err);
      return Response.json({ error: 'Claude request failed', details: err }, { status: res.status });
    }

    // Create SSE stream from Claude's stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE events
            const events = buffer.split('\n\n');
            buffer = events.pop() || ''; // Keep incomplete event in buffer

            for (const event of events) {
              const lines = event.split('\n');
              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6);

                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);

                  // Claude SSE: content_block_delta with text delta
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    const sseEvent = `data: ${JSON.stringify({ delta: parsed.delta.text })}\n\n`;
                    controller.enqueue(encoder.encode(sseEvent));
                  }

                  // Claude SSE: message_stop
                  if (parsed.type === 'message_stop') {
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  }
                } catch {
                  // Skip unparseable chunks
                }
              }
            }
          }
        } catch (err) {
          console.error('[VoiceChat] Stream error:', err);
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err: any) {
    console.error('[VoiceChat] Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
