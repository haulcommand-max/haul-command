import { NextRequest, NextResponse } from 'next/server'
import { createRoom, createAgentToken, createOutboundRoom } from '@/lib/livekit/client'
import { checkOperatorEligibility } from '@/lib/outreach/policy'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Pick next pending operator: US > CA > rest by corridor density
  const { data: next } = await supabase
    .from('livekit_compliant_dial_queue')
    .select('operator_id, session_id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!next) return NextResponse.json({ error: 'queue_empty' }, { status: 404 })

  // Re-validate eligibility — policy may have changed since queuing
  const { eligible, reason } = await checkOperatorEligibility(next.operator_id)
  if (!eligible) {
    await supabase.from('livekit_compliant_dial_queue')
      .update({ status: 'ineligible', updated_at: new Date().toISOString() })
      .eq('operator_id', next.operator_id)
    return NextResponse.json({ skipped: true, reason }, { status: 200 })
  }

  const roomName = createOutboundRoom(next.operator_id)
  await createRoom(roomName)

  const agentToken = createAgentToken(roomName, `hc-agent-${next.operator_id}`)
  const operatorToken = createAgentToken(roomName, `operator-${next.operator_id}`)

  await supabase.from('hc_livekit_sessions').insert({
    session_id: next.session_id,
    operator_id: next.operator_id,
    room_name: roomName,
    status: 'initiated',
    channel: 'livekit_voice',
    initiated_at: new Date().toISOString(),
  })

  await supabase.from('livekit_compliant_dial_queue')
    .update({ status: 'initiated', room_name: roomName, updated_at: new Date().toISOString() })
    .eq('operator_id', next.operator_id)

  return NextResponse.json({ room_name: roomName, agent_token: agentToken, operator_token: operatorToken })
}
