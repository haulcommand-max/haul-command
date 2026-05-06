import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface OutreachPolicy {
  seasoningDaysMinimum: number
  requiresAuthorityScore: number
  noEmailNoSms: boolean
  allowedChannel: 'livekit_voice'
}

export async function getOutreachPolicy(): Promise<OutreachPolicy> {
  const { data } = await supabase
    .from('hc_policy')
    .select('key, default_value')
    .in('key', [
      'claim.seasoning_days_minimum',
      'claim.outreach.requires_authority_score',
      'claim.outreach.no_email_no_sms',
    ])

  const map: Record<string, string> = {}
  for (const row of data ?? []) map[row.key] = row.default_value

  return {
    seasoningDaysMinimum: parseInt(map['claim.seasoning_days_minimum'] ?? '90'),
    requiresAuthorityScore: parseInt(map['claim.outreach.requires_authority_score'] ?? '40'),
    noEmailNoSms: map['claim.outreach.no_email_no_sms'] === 'true',
    allowedChannel: 'livekit_voice',
  }
}

export async function checkOperatorEligibility(
  operatorId: string
): Promise<{ eligible: boolean; reason?: string }> {
  const policy = await getOutreachPolicy()

  const { data: operator } = await supabase
    .from('hc_claims')
    .select('created_at, authority_score')
    .eq('operator_id', operatorId)
    .single()

  if (!operator) return { eligible: false, reason: 'operator_not_found' }

  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(operator.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceCreated < policy.seasoningDaysMinimum) {
    return {
      eligible: false,
      reason: `seasoning_insufficient: ${daysSinceCreated}/${policy.seasoningDaysMinimum} days`,
    }
  }

  const authorityScore = operator.authority_score ?? 0
  if (authorityScore < policy.requiresAuthorityScore) {
    return {
      eligible: false,
      reason: `authority_score_insufficient: ${authorityScore}/${policy.requiresAuthorityScore}`,
    }
  }

  return { eligible: true }
}

export function isOutreachChannel(channel: string): channel is 'livekit_voice' {
  if (channel !== 'livekit_voice') {
    throw new Error(`Invalid outreach channel: ${channel}. Only livekit_voice is permitted.`)
  }
  return true
}
