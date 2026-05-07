import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const event = await req.json()
  const { event: eventType, room, participant } = event

  await supabase.from('livekit_call_events').insert({
    event_type: eventType,
    room_name: room?.name,
    participant_identity: participant?.identity,
    payload: event,
    created_at: new Date().toISOString(),
  })

  if (eventType === 'room_finished') {
    const operatorId = room?.name?.split('-')[1]
    const duration = room?.duration ?? 0

    await supabase.from('hc_livekit_sessions')
      .update({
        status: 'completed',
        duration_seconds: duration,
        completed_at: new Date().toISOString(),
      })
      .eq('room_name', room?.name)

    await supabase.from('hc_outreach_log').insert({
      operator_id: operatorId,
      channel: 'livekit_voice',
      room_name: room?.name,
      duration_seconds: duration,
      outcome: duration > 10 ? 'connected' : 'no_answer',
      logged_at: new Date().toISOString(),
    })

    await supabase.from('hc_outreach_queue')
      .update({ status: 'completed', last_contacted_at: new Date().toISOString() })
      .eq('operator_id', operatorId)
  }

  return NextResponse.json({ ok: true })
}
