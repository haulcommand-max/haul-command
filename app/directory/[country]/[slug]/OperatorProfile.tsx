import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { OperatorTrustCard } from '@/components/profile/OperatorTrustCard'
import OperatorReportCard from '@/components/profile/OperatorReportCard'
import { OperatorReviews } from '@/components/profile/OperatorReviews'
import { OperatorBadges } from '@/components/profile/OperatorBadges'
import { ClaimProfileCTA } from '@/components/profile/ClaimProfileCTA'
import { AdGridSlot } from '@/components/home/AdGridSlot'
import { SchemaGenerator } from '@/components/seo/SchemaGenerator'
import Link from 'next/link'

interface Props { params: { country: string; slug: string } }

async function getOperatorBySlug(country: string, slug: string) {
  const supabase = createClient()
  const { data: seoPage } = await supabase.from('hc_seo_pages').select('entity_id').eq('slug', slug).eq('country_code', country.toUpperCase()).eq('page_type', 'entity_profile').single()
  if (!seoPage?.entity_id) return null
  const { data: operator } = await supabase.from('operators').select('id,hc_id,company_name,contact_name,state,country_code,region,locale,currency,confidence_score,rank_score,tier,subscription_tier,is_claimed,jobs_completed,avg_response_minutes,avg_response_time_minutes,response_rate_7d,corridors_familiar,completed_jobs_90d,created_at,updated_at').eq('id', seoPage.entity_id).single()
  if (!operator) return null
  const [{ data: reportCard }, { data: trust }, { data: badges }, { data: reviews }, { data: nearby }] = await Promise.all([
    supabase.from('hc_operator_report_card').select('*').eq('operator_id', operator.id).single(),
    supabase.from('hc_trust_score_breakdown').select('*').eq('operator_id', operator.id).single(),
    supabase.from('hc_badges').select('*').eq('operator_id', operator.id).order('awarded_at', { ascending: false }).limit(10),
    supabase.from('hc_reviews').select('id,rating,communication,reliability,safety,comment,reviewer_role,weighted_score,created_at').eq('target_id', operator.id).eq('is_published', true).order('created_at', { ascending: false }).limit(10),
    supabase.from('operators').select('id,company_name,state,hc_id,rank_score,tier').eq('state', operator.state).eq('country_code', operator.country_code).neq('id', operator.id).order('rank_score', { ascending: false }).limit(4),
  ])
  return { operator, reportCard, trust, badges: badges ?? [], reviews: reviews ?? [], nearby: nearby ?? [] }
}

export async function generateOperatorMetadata({ params }: Props): Promise<Metadata> {
  const data = await getOperatorBySlug(params.country, params.slug)
  if (!data) return { title: 'Operator Not Found | Haul Command' }
  const { operator, reportCard } = data
  const name = operator.company_name
  const location = [operator.state, operator.country_code].filter(Boolean).join(', ')
  const ratingStr = reportCard?.avg_review_rating ? ` — ${Number(reportCard.avg_review_rating).toFixed(1)}★` : ''
  return {
    title: `${name} (${operator.hc_id}) — Pilot Car & Escort | ${location} | Haul Command`,
    description: `${name} is a verified heavy haul escort operator in ${location}${ratingStr}. View trust score, report card, reviews, and contact on Haul Command.`,
    alternates: { canonical: `https://www.haulcommand.com/directory/${params.country}/${params.slug}` },
  }
}

export async function OperatorProfilePage({ params }: Props) {
  const data = await getOperatorBySlug(params.country, params.slug)
  if (!data) notFound()
  const { operator, reportCard, trust, badges, reviews, nearby } = data
  const name = operator.company_name
  const avgRating = reportCard?.avg_review_rating ? Number(reportCard.avg_review_rating) : null
  const reviewCount = reportCard?.reviews_total ?? reviews.length
  const trustTier = trust?.trust_tier ?? operator.tier ?? 'standard'
  const tierColor = ({ elite: '#d4950e', verified: '#22c55e', standard: '#8ab0d0', provisional: '#566880' } as Record<string,string>)[trustTier] ?? '#566880'
  const schema = {
    '@context': 'https://schema.org', '@type': ['LocalBusiness','TransportationService'], name,
    identifier: operator.hc_id,
    url: `https://www.haulcommand.com/directory/${params.country}/${params.slug}`,
    address: { '@type': 'PostalAddress', addressRegion: operator.state, addressCountry: operator.country_code },
    ...(avgRating && reviewCount > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: avgRating.toFixed(1), reviewCount, bestRating: '5', worstRating: '1' } } : {}),
  }

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Directory", "item": "https://www.haulcommand.com/directory" },
      { "@type": "ListItem", "position": 2, "name": params.country.toUpperCase() === 'US' ? 'United States' : params.country.toUpperCase(), "item": `https://www.haulcommand.com/directory/${params.country}` },
      { "@type": "ListItem", "position": 3, "name": name, "item": `https://www.haulcommand.com/directory/${params.country}/${params.slug}` }
    ]
  };

  return (
    <>
      <JsonLd data={schema} />
      <SchemaGenerator type="BreadcrumbList" data={breadcrumbData} />
      <div className="min-h-screen bg-[#07090d] text-[#f0f2f5]">
        <nav className="px-4 lg:px-10 py-2.5 border-b border-[#131c28]">
          <div className="max-w-4xl mx-auto text-xs text-[#566880] flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-[#d4950e]">Home</Link><span>›</span>
            <Link href="/directory" className="hover:text-[#d4950e]">Directory</Link><span>›</span>
            <Link href={`/directory/${params.country}`} className="hover:text-[#d4950e] uppercase">{params.country}</Link><span>›</span>
            <span className="text-[#8a9ab0] truncate">{name}</span>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto px-4 lg:px-10 py-6 space-y-6">
          {/* HERO */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold flex-shrink-0"
                style={{ background: `${tierColor}20`, color: tierColor, border: `2px solid ${tierColor}40` }}>
                {name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-3 mb-2">
                  <h1 className="text-xl lg:text-3xl font-extrabold text-[#f0f2f5] tracking-tight">{name}</h1>
                  <span className="text-xs bg-[#07090d] border border-[#1e3048] text-[#566880] px-2 py-1 rounded-lg font-mono">{operator.hc_id}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-sm text-[#8a9ab0]">{[operator.state, operator.country_code].filter(Boolean).join(', ')}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${tierColor}20`, color: tierColor }}>{trustTier.toUpperCase()}</span>
                  {operator.is_claimed
                    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22c55e20] text-[#22c55e]">CLAIMED</span>
                    : <span className="text-[10px] text-[#566880] border border-[#1e3048] px-2 py-0.5 rounded-full">UNCLAIMED</span>}
                </div>
                {avgRating && reviewCount > 0
                  ? <div className="flex items-center gap-2 mb-4"><span className="text-base font-bold text-[#d4950e]">{avgRating.toFixed(1)}★</span><span className="text-sm text-[#566880]">({reviewCount} reviews)</span></div>
                  : <p className="text-xs text-[#3a4e64] mb-4">No reviews yet</p>}
                <div className="flex flex-wrap gap-3">
                  {operator.is_claimed
                    ? <a href="tel:" className="bg-[#d4950e] text-[#07090d] font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#e8a828] transition-colors">Contact Operator</a>
                    : <Link href={`/claim?operator=${operator.id}`} className="bg-[#d4950e] text-[#07090d] font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#e8a828] transition-colors">Claim This Profile — Free</Link>}
                  <Link href={`/directory/${params.country}`} className="border border-[#1e3048] text-[#8a9ab0] text-sm px-5 py-2.5 rounded-xl hover:border-[#d4950e] transition-colors">← {params.country.toUpperCase()} Directory</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OperatorTrustCard trust={trust} operator={operator} tierColor={tierColor} />
            <OperatorReportCard 
              score={reportCard?.score || 0}
              rank={reportCard?.rank || 999}
              postCount={reportCard?.postCount || 0}
              region={operator.region_code || operator.state || 'US'}
            />
          </div>
          {badges.length > 0 && <OperatorBadges badges={badges} />}
          <AdGridSlot zone="profile_mid" />
          <OperatorReviews reviews={reviews} operatorName={name} operatorId={operator.id} />
          {Array.isArray(operator.corridors_familiar) && operator.corridors_familiar.length > 0 && (
            <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6">
              <h2 className="text-base font-bold text-[#f0f2f5] mb-4">Corridors Served</h2>
              <div className="flex flex-wrap gap-2">{operator.corridors_familiar.map((c: string) => <span key={c} className="text-xs bg-[#07090d] border border-[#1e3048] text-[#8ab0d0] px-3 py-1.5 rounded-lg">{c}</span>)}</div>
            </div>
          )}
          {nearby.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-[#f0f2f5] mb-4">Other Operators in {operator.state}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {nearby.map(op => (
                  <Link key={op.id} href={`/directory/${params.country}/${op.hc_id?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    className="bg-[#0f1a24] border border-[#1e3048] rounded-xl p-4 flex items-center gap-3 hover:border-[#d4950e] transition-colors group">
                    <div className="w-9 h-9 rounded-xl bg-[#141e28] flex items-center justify-center text-xs font-bold text-[#8ab0d0]">
                      {(op.company_name ?? 'O').split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#d0dce8] group-hover:text-[#f0f2f5] truncate">{op.company_name}</p>
                      <p className="text-[10px] text-[#3a5068] font-mono">{op.hc_id}</p>
                    </div>
                    {op.tier === 'elite' && <span className="text-[9px] text-[#d4950e] bg-[#2a1f08] px-1.5 py-0.5 rounded">ELITE</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {!operator.is_claimed && <ClaimProfileCTA operatorId={operator.id} operatorName={name} hcId={operator.hc_id} />}
        </div>
      </div>
    </>
  )
}
