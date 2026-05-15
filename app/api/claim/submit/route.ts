import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushToUser } from '@/lib/notifications/push-service'
import { upsertEntity, logActivity } from '@/lib/twenty/client'
import { buildClaimPath, normalizeClaimParams, resolveClaimTarget } from '@/lib/claims/claim-target'
import { buildInternalRequestHeaders, getInternalRequestToken } from '@/lib/security/internal-request-auth'
import { isEmailConfirmed } from '@/lib/auth/confirmed-user'

function formString(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value : ''
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const hcid = formString(form, 'hcid')
    const company_name = formString(form, 'company_name')
    const phone = formString(form, 'phone')
    const claimTypeFromForm = formString(form, 'claim_type')
    const acceptedClaimActorFromForm = formString(form, 'accepted_claim_actor')
    const formCountryCode = formString(form, 'country_code') || formString(form, 'country')
    const claimParams = normalizeClaimParams(form)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const next = encodeURIComponent(buildClaimPath(claimParams))
      return NextResponse.redirect(new URL(`/login?next=${next}`, req.url))
    }
    if (!isEmailConfirmed(user)) {
      const next = encodeURIComponent(buildClaimPath(claimParams))
      return NextResponse.redirect(new URL(`/login?next=${next}&error=email_confirmation_required`, req.url))
    }

    const claimTarget = await resolveClaimTarget(supabase, claimParams)

    if (claimTarget?.isClaimed) {
      return NextResponse.redirect(new URL('/claim?error=already_claimed', req.url))
    }

    const claimEntityId = claimTarget?.entityId || formString(form, 'claim_entity_id') || hcid
    const claimEntityType = claimTarget?.entityType || formString(form, 'claim_entity_type') || 'operator'
    const claimType = claimTarget?.claimType || claimTypeFromForm || 'business_claim'
    const acceptedClaimActor = claimTarget?.acceptedClaimActor || acceptedClaimActorFromForm || null
    const countryCode = claimTarget?.countryCode || formCountryCode || undefined

    if (!claimEntityId) {
      return NextResponse.redirect(new URL('/claim?error=missing_claim_target', req.url))
    }

    // Create trust profile claim record
    const { error } = await supabase.from('hc_trust_profiles').upsert({
      entity_id: claimEntityId,
      entity_type: claimEntityType,
      claimed: false, // pending review
      claim_pending: true,
      claim_submitted_at: new Date().toISOString(),
      claim_company_name: company_name,
      claim_phone: phone,
      claim_user_id: user.id,
      claim_type: claimType,
    }, { onConflict: 'entity_id' })

    if (error && !error.message.includes('column')) {
      throw error
    }

    // Enqueue notification to admin + confirmation to claimer
    await sendPushToUser({
      userId: user.id,
      eventType: 'claim_reminder',
      title: 'Claim Submitted \u2714',
      body: `Your claim for ${company_name} is under review. We'll notify you within 24 hours.`,
      deepLink: '/claim/submitted',
      dedupKey: `claim_submitted:${String(hcid || claimEntityId)}`,
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
        metadata: {
          hcid: hcid || null,
          user_id: user.id,
          claim_entity_id: claimEntityId,
          claim_entity_type: claimEntityType,
          claim_type: claimType,
          accepted_claim_actor: acceptedClaimActor,
          required_claim_proof: claimTarget?.requiredClaimProof || null,
          claim_source_table: claimTarget?.sourceTable || formString(form, 'claim_source_table') || null,
          intent: claimParams.intent || null,
          source: claimParams.source || null,
          market: claimParams.market || null,
        }
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
    if (getInternalRequestToken()) {
      fetch(new URL('/api/livekit/outbound', req.url).toString(), {
        method: 'POST',
        headers: buildInternalRequestHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          targetPhone: phone,
          entityId: claimEntityId,
          programType: 'profile_claim',
          claimType,
          acceptedClaimActor,
          ...(countryCode ? { countryCode } : {})
        })
      }).catch(err => console.warn('[LiveKit] Outbound webhook trigger failed:', err))
    } else {
      console.warn('[LiveKit] Outbound webhook skipped: internal request token is not configured.')
    }


    return NextResponse.redirect(new URL('/claim/submitted', req.url))
  } catch (err: any) {
    return NextResponse.redirect(new URL(`/claim?error=${encodeURIComponent(err.message)}`, req.url))
  }
}
