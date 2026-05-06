import { NextRequest, NextResponse } from 'next/server'
import { checkOperatorEligibility } from '@/lib/outreach/policy'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { operator_id } = await req.json()
  if (!operator_id) return NextResponse.json({ error: 'operator_id required' }, { status: 400 })

  const { eligible, reason } = await checkOperatorEligibility(operator_id)

  await supabase.from('hc_outreach_compliance').insert({
    operator_id,
    channel: 'livekit_voice',
    eligible,
    reason: reason ?? 'passed',
    checked_at: new Date().toISOString(),
  })

  if (!eligible) {
    return NextResponse.json({ queued: false, reason }, { status: 403 })
  }

  const sessionId = crypto.randomUUID()

  await supabase.from('hc_outreach_queue').upsert({
    operator_id,
    channel: 'livekit_voice',
    status: 'pending',
    session_id: sessionId,
    created_at: new Date().toISOString(),
  }, { onConflict: 'operator_id' })

  await supabase.from('livekit_compliant_dial_queue').insert({
    operator_id,
    session_id: sessionId,
    status: 'pending',
    created_at: new Date().toISOString(),
  })

  return NextResponse.json({ queued: true, session_id: sessionId })
}
