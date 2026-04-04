import { NextRequest, NextResponse } from 'next/server'

// AdGrid AI Creative Generator
// Framework: Hormozi (offer stack) → Cole Gordon (pain/close) → Billy Gene (pattern interrupt hook)
// Output: 3 A/B/C variants per request

const ADVERTISER_TYPES = ['vendor', 'operator_promotion'] as const
type AdvertiserType = typeof ADVERTISER_TYPES[number]

interface GenerateRequest {
  advertiser_type: AdvertiserType  // 'vendor' (insurance co, permit service) or 'operator_promotion'
  audience: string                  // 'pilot_car_operators' | 'brokers' | 'carriers' | 'dispatchers' | 'all_operators'
  offer: string                     // what they're selling / offering
  target_country: string            // US, CA, AU, GB, etc.
  target_region?: string            // TX, NSW, Ontario, etc.
  company_name: string
  value_points?: string[]           // what the product delivers
  risk_reversal?: string            // free trial, guarantee, etc.
  cta_url: string
}

function buildHormoziOffer(req: GenerateRequest): string {
  const vp = req.value_points?.length
    ? req.value_points.map((v, i) => `• ${v}`).join('\n')
    : `• Access to ${req.offer}`
  const rr = req.risk_reversal ?? 'Free to try. Cancel anytime.'
  return `OFFER STACK:\n${vp}\nRisk reversal: ${rr}`
}

function buildColeGordonCopy(req: GenerateRequest): { headline: string; body: string; cta: string } {
  const PAIN_MAP: Record<string, string> = {
    pilot_car_operators: 'losing jobs to operators with no verified history',
    brokers: 'wasting hours calling operators who never pick up',
    carriers: 'losing loads to competitors with better digital presence',
    dispatchers: 'managing 12 things on a spreadsheet that keeps breaking',
    all_operators: 'being invisible to the brokers who are searching right now',
  }
  const pain = PAIN_MAP[req.audience] ?? 'not seeing the results your business deserves'

  const AUDIENCE_LABEL: Record<string,string> = {
    pilot_car_operators: 'Pilot Car Operators', brokers: 'Heavy Haul Brokers',
    carriers: 'Heavy Haul Carriers', dispatchers: 'Dispatch Managers', all_operators: 'Heavy Haul Operators',
  }
  const audienceLabel = AUDIENCE_LABEL[req.audience] ?? 'Heavy Haul Professionals'

  return {
    headline: `Stop ${pain.split(' ').slice(0,4).join(' ')} — ${req.company_name} has the fix`,
    body: `${audienceLabel} in ${req.target_region ?? req.target_country}: ${req.offer}. ${req.risk_reversal ?? 'No contract required.'}`,
    cta: 'See How It Works',
  }
}

function buildBillyGeneHook(req: GenerateRequest, variant: 'A'|'B'|'C'): string {
  const HOOKS: Record<AdvertiserType, Record<'A'|'B'|'C', string>> = {
    vendor: {
      A: `"I closed 3 loads this week from a platform I'd never heard of." — That's what your future customer is about to say about ${req.company_name}.`,
      B: `14,000 heavy haul operators are searching for ${req.offer.toLowerCase().split(' ').slice(0,4).join(' ')} right now. ${req.company_name} isn't in front of them. Yet.`,
      C: `The top-performing ad in this corridor last month wasn't from a big brand. It was from a company your size that decided to show up. Here's what ${req.company_name} needs to do next.`,
    },
    operator_promotion: {
      A: `This pilot car operator in ${req.target_region ?? req.target_country} booked 8 jobs in 14 days without a single cold call. Here's the exact thing they did.`,
      B: `312 operators in your corridor are broadcasting to brokers right now. You're not one of them. That changes today.`,
      C: `A broker posted a load at 6:47am. By 6:51am, a verified operator responded. That operator earned their fee in 4 minutes. Here's how.`,
    },
  }
  return HOOKS[req.advertiser_type]?.[variant] ?? `Discover ${req.offer} from ${req.company_name}.`
}

function buildLocalization(country: string): { currency: string; tone: string; disclosure: string } {
  const MAP: Record<string,{ currency:string; tone:string; disclosure:string }> = {
    US: { currency:'USD', tone:'direct, assertive, ROI-focused',      disclosure:'Results may vary.' },
    CA: { currency:'CAD', tone:'professional, bilingual-aware',        disclosure:'Résultats peuvent varier.' },
    AU: { currency:'AUD', tone:'casual-confident, no-BS, matey',       disclosure:'Results may vary.' },
    GB: { currency:'GBP', tone:'professional, understated confidence', disclosure:'Results may vary.' },
    NZ: { currency:'NZD', tone:'casual-confident',                     disclosure:'Results may vary.' },
    ZA: { currency:'ZAR', tone:'direct, community-focused',            disclosure:'Results may vary.' },
    AE: { currency:'AED', tone:'formal, prestige-oriented',            disclosure:'Results may vary.' },
    DE: { currency:'EUR', tone:'precise, engineering-focused',         disclosure:'Ergebnisse können variieren.' },
    BR: { currency:'BRL', tone:'warm, relationship-first',             disclosure:'Os resultados podem variar.' },
  }
  return MAP[country] ?? { currency:'USD', tone:'professional', disclosure:'Results may vary.' }
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json()
    if (!body.advertiser_type || !body.audience || !body.offer || !body.company_name) {
      return NextResponse.json({ ok:false, error:'Missing required fields' }, { status:400 })
    }

    const offerStack   = buildHormoziOffer(body)           // Hormozi layer
    const closeCopy    = buildColeGordonCopy(body)         // Cole Gordon layer
    const locale       = buildLocalization(body.target_country) // Localization

    const variants = (['A','B','C'] as const).map(v => ({
      variant: v,
      hook:    buildBillyGeneHook(body, v),               // Billy Gene layer
      headline: closeCopy.headline,
      body:    closeCopy.body,
      cta_label: closeCopy.cta,
      cta_url:  body.cta_url,
      offer_stack: offerStack,
      locale,
      targeting_summary: [
        `Audience: ${body.audience}`,
        `Country: ${body.target_country}`,
        body.target_region ? `Region: ${body.target_region}` : null,
        `Ad type: ${body.advertiser_type}`,
      ].filter(Boolean).join(' · '),
      framework_notes: [
        `Hormozi: offer & risk reversal baked into body`,
        `Cole Gordon: pain-first headline, single CTA`,
        `Billy Gene: pattern-interrupt hook (variant ${v})`,
        `Localization: ${locale.tone}`,
      ],
      image_direction: body.advertiser_type === 'vendor'
        ? 'Real industry photography: wide load moving on highway at golden hour. Bold ${body.company_name} logo overlay. No stock photo faces.'
        : 'Real pilot car or escort vehicle photo from behind, load visible ahead. Operator\'s hand on radio. No staged photos.',
      disclosure: locale.disclosure,
    }))

    return NextResponse.json({ ok:true, variants, meta: { advertiser_type:body.advertiser_type, audience:body.audience, country:body.target_country } })
  } catch(err:any) {
    return NextResponse.json({ ok:false, error:err.message }, { status:500 })
  }
}
