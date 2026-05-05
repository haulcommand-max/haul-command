import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushToUser } from '@/lib/notifications/push-service'
import { upsertEntity, logActivity } from '@/lib/twenty/client'
import { COUNTRY_REGISTRY } from '@/lib/config/country-registry'

type MinimalOperator = {
  id?: string | null
  is_claimed?: boolean | null
  country_code?: string | null
  region_code?: string | null
  state?: string | null
  region?: string | null
  location?: string | null
}

function normalizeCountryCode(value: unknown): string | null {
  const code = String(value || '').trim().toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : null
}

function buildCountryContext(countryCode: string, regionCode?: string | null, roleContext = 'operator_claim') {
  const country = COUNTRY_REGISTRY.find(c => c.code.toUpperCase() === countryCode.toUpperCase())
  return {
    countryCode,
    regionCode: regionCode || null,
    roleContext,
    languageCode: country?.languagePrimary || 'en',
    secondaryLanguageCode: country?.languageSecondary || null,
    currencyCode: country?.currency || 'USD',
    socialPrimary: country?.socialPrimary || 'email',
    socialSecondary: country?.socialSecondary || 'email',
    localTone: country?.tone || 'operator_practical',
    countryName: country?.name || countryCode,
    tier: country?.tier || 'gold',
  }
}

async function findOperatorByHcid(supabase: ReturnType<typeof createClient>, hcid: FormDataEntryValue | null): Promise<MinimalOperator | null> {
  if (!hcid) return null

  // First try the rich global fields. If this branch is running against an older DB shape,
  // fall back to the legacy two-column query instead of breaking claim submission.
  const rich = await supabase
    .from('operators')
    .select('id,is_claimed,country_code,region_code,state,region,location')
    .eq('hc_id', hcid)
    .single()

  if (!rich.error && rich.data) return rich.data as MinimalOperator

  const legacy = await supabase
    .from('operators')
    .select('id,is_claimed')
    .eq('hc_id', hcid)
    .single()

  return (legacy.data as MinimalOperator | null) ?? null
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const { hcid, company_name, phone, user_id, country_code, region_code } = Object.fromEntries(form)
    const supabase = createClient()

    const op = await findOperatorByHcid(supabase, hcid ?? null)
    if (op?.is_claimed) {
      return NextResponse.redirect(new URL('/claim?error=already_claimed', req.url))
    }

    const operatorId = op?.id ?? null
    const resolvedCountryCode =
      normalizeCountryCode(country_code) ||
      normalizeCountryCode(op?.country_code) ||
      'US'

    const resolvedRegionCode = String(
      region_code || op?.region_code || op?.state || op?.region || op?.location || ''
    ).trim() || null

    const countryContext = buildCountryContext(resolvedCountryCode, resolvedRegionCode, 'operator_claim')

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
      claim_country_code: resolvedCountryCode,
      claim_region_code: resolvedRegionCode,
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
    }).catch(() => {})

    // TWENTY CRM INTEGRATION - Track full lifecycle
    try {
      const crmEntity = await upsertEntity({
        type: 'claim',
        name: `Claim: ${company_name}`,
        phone: String(phone),
        status: 'pending_verification',
        assignedTo: 'queue_verification',
        metadata: {
          hcid: hcid || 'new_operator',
          user_id,
          country_code: resolvedCountryCode,
          region_code: resolvedRegionCode,
          role_context: 'operator_claim',
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

    // LIVEKIT INTEGRATION - Trigger AI verification call with 120-country context.
    fetch(new URL('/api/livekit/outbound', req.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetPhone: String(phone),
        entityId: operatorId ?? user_id,
        programType: 'profile_claim',
        countryCode: resolvedCountryCode,
        regionCode: resolvedRegionCode,
        languageCode: countryContext.languageCode,
        currencyCode: countryContext.currencyCode,
        roleContext: countryContext.roleContext,
        countryContext,
      })
    }).catch(err => console.warn('[LiveKit] Outbound webhook trigger failed:', err))

    return NextResponse.redirect(new URL('/claim/submitted', req.url))
  } catch (err: any) {
    return NextResponse.redirect(new URL(`/claim?error=${encodeURIComponent(err.message)}`, req.url))
  }
}
