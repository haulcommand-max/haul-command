import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props { params: { campaignId: string } }

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Campaign Analytics — AdGrid | Haul Command`, robots: 'noindex' }
}

export default async function AdvertiserDashboard({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  // Fetch campaign + advertiser (verify ownership)
  const { data: campaign } = await supabase
    .from('hc_adgrid_campaigns')
    .select(`id, campaign_name, status, starts_at, ends_at, bid_cents, daily_budget_cents,
      hc_adgrid_advertisers!inner(id, company_name, user_id)`)
    .eq('id', params.campaignId)
    .single()

  if (!campaign || (campaign as any).hc_adgrid_advertisers?.user_id !== user.id) return notFound()

  // Aggregate impressions, clicks, leads
  const [{ count: impressions }, { count: clicks }, { count: leads }] = await Promise.all([
    supabase.from('hc_adgrid_impressions').select('id', { count:'exact', head:true }).eq('campaign_id', params.campaignId),
    supabase.from('hc_adgrid_clicks').select('id', { count:'exact', head:true }).eq('campaign_id', params.campaignId),
    supabase.from('hc_adgrid_leads').select('id', { count:'exact', head:true }).eq('campaign_id', params.campaignId),
  ])

  const imp = impressions ?? 0
  const clk = clicks ?? 0
  const lds = leads ?? 0
  const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(2) : '0.00'
  const cpl = lds > 0 ? ((campaign.bid_cents ?? 0) / 100 / lds).toFixed(2) : '—'
  const spend = (campaign.bid_cents ?? 0) / 100

  // Recent clicks breakdown by country
  const { data: clicksByCountry } = await supabase
    .from('hc_adgrid_clicks')
    .select('country_code')
    .eq('campaign_id', params.campaignId)
    .order('ts', { ascending: false })
    .limit(200)

  const countryBreakdown: Record<string,number> = {}
  ;(clicksByCountry ?? []).forEach((c:any) => {
    countryBreakdown[c.country_code ?? 'Unknown'] = (countryBreakdown[c.country_code ?? 'Unknown'] ?? 0) + 1
  })
  const sortedCountries = Object.entries(countryBreakdown).sort((a,b)=>b[1]-a[1]).slice(0,8)

  // Variant breakdown
  const { data: variantData } = await supabase
    .from('hc_adgrid_clicks')
    .select('variant')
    .eq('campaign_id', params.campaignId)
    .limit(500)
  const variantCount: Record<string,number> = {}
  ;(variantData ?? []).forEach((v:any) => {
    variantCount[v.variant ?? 'A'] = (variantCount[v.variant ?? 'A'] ?? 0) + 1
  })

  const STATUS_COLOR: Record<string,string> = {
    active:'#22c55e', pending_review:'#d4950e', paused:'#566880', completed:'#3b82f6'
  }
  const statusColor = STATUS_COLOR[campaign.status] ?? '#566880'
  const advertiser = (campaign as any).hc_adgrid_advertisers

  return (
    <div className="min-h-screen bg-[#07090d] text-[#f0f2f5]">
      <div className="border-b border-[#131c28] bg-[#0a0d14]">
        <div className="px-4 lg:px-10 py-5 max-w-5xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[10px] text-[#566880] font-semibold tracking-wider">HC ADGRID · CAMPAIGN ANALYTICS</p>
            <h1 className="text-lg font-bold text-[#f0f2f5] mt-0.5">{campaign.campaign_name}</h1>
            <p className="text-xs text-[#566880]">{advertiser?.company_name}</p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded border" style={{color:statusColor, borderColor:`${statusColor}40`}}>
            {campaign.status?.toUpperCase().replace('_',' ')}
          </span>
          <Link href="/dashboard/advertiser" className="text-xs text-[#566880] hover:text-[#f0f2f5]">All Campaigns</Link>
        </div>
      </div>

      <div className="px-4 lg:px-10 py-8 max-w-5xl mx-auto">

        {/* KPI SCORECARDS */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
          {[
            { label:'Impressions', val:imp.toLocaleString(),    color:'#8a9ab0', note:'Total ad views' },
            { label:'Clicks',      val:clk.toLocaleString(),    color:'#3b82f6', note:'Clicked your ad' },
            { label:'CTR',         val:`${ctr}%`,               color:parseFloat(ctr)>=2?'#22c55e':'#d4950e', note:'Click-through rate' },
            { label:'Leads',       val:lds.toLocaleString(),    color:'#22c55e', note:'Form / contact actions' },
            { label:'CPL',         val:lds>0?`$${cpl}`:'--',   color:'#d4950e', note:'Cost per lead' },
            { label:'Spend',       val:`$${spend}`,             color:'#f0f2f5', note:'Total billed' },
          ].map(kpi=>(
            <div key={kpi.label} className="bg-[#0f1a24] border border-[#1e3048] rounded-xl p-4 md:col-span-1 col-span-1">
              <p className="text-[10px] text-[#566880] font-semibold tracking-wider mb-1">{kpi.label}</p>
              <p className="text-xl lg:text-2xl font-black" style={{color:kpi.color}}>{kpi.val}</p>
              <p className="text-[9px] text-[#3a5068] mt-0.5">{kpi.note}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* COUNTRY BREAKDOWN */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-5">
            <p className="text-xs font-bold text-[#f0f2f5] mb-4">Clicks by Country</p>
            {sortedCountries.length > 0 ? (
              <div className="flex flex-col gap-2">
                {sortedCountries.map(([cc, count]) => {
                  const pct = clk > 0 ? Math.round((count/clk)*100) : 0
                  return (
                    <div key={cc}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#8a9ab0] font-semibold">{cc}</span>
                        <span className="text-[#d0dce8]">{count} <span className="text-[#566880]">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-[#131c28] rounded-full overflow-hidden">
                        <div className="h-full bg-[#3b82f6] rounded-full" style={{width:`${pct}%`}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-[#3a5068]">No click data yet. Impressions will accumulate once your campaign goes live.</p>
            )}
          </div>

          {/* VARIANT PERFORMANCE */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-5">
            <p className="text-xs font-bold text-[#f0f2f5] mb-4">A/B/C Variant Performance</p>
            {Object.keys(variantCount).length > 0 ? (
              <div className="flex flex-col gap-3">
                {['A','B','C'].map(v => {
                  const cnt = variantCount[v] ?? 0
                  const pct = clk > 0 ? Math.round((cnt/clk)*100) : 0
                  const isWinner = v === Object.entries(variantCount).sort((a,b)=>b[1]-a[1])[0]?.[0]
                  return (
                    <div key={v}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#8a9ab0] font-semibold flex items-center gap-1.5">Variant {v} {isWinner&&cnt>0&&<span className="text-[8px] text-[#22c55e] bg-[#0d2000] px-1 py-0.5 rounded">WINNING</span>}</span>
                        <span className="text-[#d0dce8]">{cnt} clicks <span className="text-[#566880]">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-[#131c28] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{width:`${pct}%`, background:isWinner?'#22c55e':'#3b82f6'}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div>
                <p className="text-xs text-[#3a5068] mb-3">Variant data populates once your campaign is active.</p>
                <div className="flex flex-col gap-2">
                  {['A (Hook: Pattern Interrupt)', 'B (Hook: Social Proof)', 'C (Hook: Authority Story)'].map((v,i)=>(
                    <div key={i} className="text-[10px] text-[#566880] bg-[#07090d] rounded-lg p-2.5">Variant {v}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CAMPAIGN SETTINGS */}
        <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-5 mb-6">
          <p className="text-xs font-bold text-[#f0f2f5] mb-4">Campaign Settings</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {label:'Start Date', val:campaign.starts_at ? new Date(campaign.starts_at).toLocaleDateString() : 'Pending approval'},
              {label:'End Date',   val:campaign.ends_at   ? new Date(campaign.ends_at).toLocaleDateString()   : 'TBD'},
              {label:'Weekly Budget', val:campaign.bid_cents ? `$${(campaign.bid_cents/100).toFixed(0)}/wk` : 'N/A'},
              {label:'Daily Cap',  val:campaign.daily_budget_cents ? `$${(campaign.daily_budget_cents/100).toFixed(0)}/day` : 'N/A'},
            ].map(s=>(
              <div key={s.label}>
                <p className="text-[10px] text-[#566880] font-semibold tracking-wider mb-1">{s.label}</p>
                <p className="text-sm text-[#d0dce8]">{s.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* HELP / HANDHOLD */}
        {campaign.status === 'pending_review' && (
          <div className="bg-[#0a1929] border border-[#3b82f640] rounded-2xl p-5 mb-6">
            <p className="text-sm font-bold text-[#3b82f6] mb-1">🔄 Your campaign is under review</p>
            <p className="text-xs text-[#8a9ab0] mb-3">Our team reviews all campaigns within 2 hours. Once approved, your ads go live and you’ll see real-time data on this page. We’ll send you a push notification when it activates.</p>
            <a href="mailto:ads@haulcommand.com" className="text-xs text-[#3b82f6] hover:underline">Questions? Email ads@haulcommand.com</a>
          </div>
        )}

        {/* ROI EXPLANATION */}
        <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-5">
          <p className="text-xs font-bold text-[#f0f2f5] mb-3">How to Read Your Results</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {label:'Good CTR for this audience', val:'1.5–3.5%', desc:'Heavy haul is hyper-niche. A 2%+ CTR is exceptional. Industry average for Google display is 0.35%.'},
              {label:'CPL benchmark',              val:'$8–$45',   desc:'Our first-party audience targeting means your cost per lead should be 3–8x lower than Facebook or Google for this vertical.'},
              {label:'When to optimize',           val:'After 500 impr', desc:'Let variants run to at least 500 impressions each before pausing the underperformer. We’ll alert you when data is conclusive.'},
            ].map(r=>(
              <div key={r.label} className="bg-[#07090d] rounded-xl p-3.5">
                <p className="text-[10px] text-[#566880] font-semibold tracking-wider mb-1">{r.label}</p>
                <p className="text-sm font-bold text-[#d4950e]">{r.val}</p>
                <p className="text-[11px] text-[#8a9ab0] mt-1 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
