import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushToUser } from '@/lib/notifications/push-service'
import { upsertEntity, logActivity } from '@/lib/twenty/client'
export async function POST(req: NextRequest) {
  try {
    const { hcid, company_name, phone, user_id } = Object.fromEntries(await req.formData())
    const supabase = createClient()

    // Find operator record
    let operatorId: string | null = null
    if (hcid) {
      const { data: op } = await supabase.from('operators').select('id,is_claimed').eq('hc_id', hcid).single()
      if (op?.is_claimed) {
        return NextResponse.redirect(new URL('/claim?error=already_claimed', req.url))
      }
      operatorId = op?.id ?? null
    }

    // Create trust profile claim record
    const { error } = await supabase.from('hc_trust_profiles').upsert({
      entity_id: operatorId ?? user_id,
      entity_type: 'operator',
      claimed: false, // pending review
      claim_pending: true,
      claim_submitted_at: new Date().toISOString(),
      claim_company_name: String(company_name),
      claim_phone: String(phone),
      claim_user_id: String(user_id),
    }, { onConflict: 'entity_id' })

    if (error && !error.message.includes('column')) {
      throw error
    }

    // Enqueue notification to admin + confirmation to claimer
    await sendPushToUser({
      userId: String(user_id),
      eventType: 'claim_reminder',
      title: 'Claim Submitted \u2714',
      body: `Your claim for ${company_name} is under review. We'll notify you within 24 hours.`,
      deepLink: '/claim/submitted',
      dedupKey: `claim_submitted:${String(hcid ?? user_id)}`,
      dedupWindowHrs: 48,
    }).catch(()=>{})

    // PHASE 6: TWENTY CRM INTEGRATION - Track Full Lifecycle
    try {
      const crmEntity = await upsertEntity({
        type: 'claim',
        name: `Claim: ${company_name}`,
        phone: String(phone),
        status: 'pending_verification',
        assignedTo: 'queue_verification',
        metadata: { hcid: hcid || 'new_operator', user_id }
      })
      
      if (crmEntity?.id) {
        await logActivity({
          entityId: crmEntity.id,
          entityType: 'claim',
          activityType: 'status_change',
          title: 'Claim Submitted via Web UI',
          timestamp: new Date().toISOString()
        })
      }
    } catch (crmErr) {
      console.warn('[Twenty] CRM mapping failed, continuing flow:', crmErr)
    }

    // PHASE 5: LIVEKIT INTEGRATION - Trigger AI Verification Call
    // Fires an asynchronous webhook to the LiveKit outbound route
    fetch(new URL('/api/livekit/outbound', req.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetPhone: String(phone),
        entityId: operatorId ?? user_id,
        programType: 'profile_claim',
        countryCode: 'US' // Assume US for initial verification
      })
    }).catch(err => console.warn('[LiveKit] Outbound webhook trigger failed:', err))


    return NextResponse.redirect(new URL('/claim/submitted', req.url))
  } catch (err: any) {
    return NextResponse.redirect(new URL(`/claim?error=${encodeURIComponent(err.message)}`, req.url))
  }
}
