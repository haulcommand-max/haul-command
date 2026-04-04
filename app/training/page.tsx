import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { AdGridSlot } from '@/components/home/AdGridSlot'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'HC Training Academy — Pilot Car & Heavy Haul Certifications | Haul Command',
  description: 'The only global heavy haul training and certification platform. Free micro-courses to Master certification. 120+ countries. Trust score boosts on completion.',
  alternates: { canonical: 'https://www.haulcommand.com/training' },
}

const TIERS = [
  { key:'free',         label:'Free',           color:'#566880',  bg:'#0f1a24', price:'$0',    boost:0,   desc:'7-minute intros. No login required. Start here.',        icon:'▶' },
  { key:'tier1',        label:'Foundation',     color:'#3b82f6',  bg:'#0a1929', price:'$49',  boost:10,  desc:'4-hour global fundamentals. Accepted in all 120 countries.', icon:'◆' },
  { key:'tier2_us',     label:'US State Cert',  color:'#8b5cf6',  bg:'#13102a', price:'$149–$299', boost:25, desc:'Official PEVO certifications by state. Reciprocity included.', icon:'★' },
  { key:'tier2_intl',   label:'Intl Cert',      color:'#d4950e',  bg:'#1a1200', price:'$195+', boost:50, desc:'First-mover national certifications. AU, CA, UK, DE, AE, BR, ZA, NZ.', icon:'🌐' },
  { key:'tier3_specialist', label:'Specialist', color:'#22c55e',  bg:'#0a1f10', price:'$295–$495', boost:75, desc:'High pole, steerman, route survey, TWIC, military, renewable.', icon:'⬡' },
  { key:'tier4_master', label:'Master',         color:'#f59e0b',  bg:'#1f1500', price:'$795–$1,495', boost:100, desc:'The highest HC credential. Elite badge, directory boost, priority dispatch.', icon:'👑' },
]

async function getCourses() {
  const supabase = createClient()
  const { data } = await supabase
    .from('hc_training_courses')
    .select('id,slug,title,description,tier,price_cents,currency,duration_hours,modules_count,hc_trust_score_boost,certification_level,is_featured,tags,country_codes')
    .eq('is_active', true)
    .order('sort_order')
  return data ?? []
}

function fmtPrice(cents: number, currency: string) {
  if (cents === 0) return 'FREE'
  const sym: Record<string,string> = { USD:'$', AUD:'A$', CAD:'C$', GBP:'£', EUR:'€', AED:'AED ', BRL:'R$', ZAR:'R', NZD:'NZ$' }
  return `${sym[currency]??''}${(cents/100).toLocaleString()}`
}

const schemaOrg = {
  '@context':'https://schema.org','@type':'ItemList',
  name:'HC Training Academy — Heavy Haul Certifications',
  description:'Global pilot car and heavy haul training platform. Free to Master tier. 120 countries.',
  url:'https://www.haulcommand.com/training',
}

export default async function TrainingPage() {
  const courses = await getCourses()
  const byCourses = (tier: string) => courses.filter(c=>c.tier===tier)

  return (
    <>
      <JsonLd data={schemaOrg}/>
      <div className="min-h-screen bg-[#07090d] text-[#f0f2f5]">

        {/* HERO */}
        <div className="relative overflow-hidden border-b border-[#131c28]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1929] via-[#07090d] to-[#07090d]" />
          <div className="relative px-4 lg:px-10 py-16 max-w-5xl mx-auto">
            <p className="text-[11px] tracking-[0.2em] text-[#d4950e] font-semibold mb-4">HC TRAINING ACADEMY · 120 COUNTRIES</p>
            <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-[#f0f2f5] mb-5 max-w-3xl leading-tight">
              The Only Global<br/>Heavy Haul Certification Platform
            </h1>
            <p className="text-sm lg:text-base text-[#8a9ab0] mb-8 max-w-2xl leading-relaxed">
              From your first free 7-minute explainer to the highest Master credential — every course boosts your HC Trust Score, improves your directory rank, and opens higher-value loads.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="#free" className="bg-[#d4950e] hover:bg-[#c4850e] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">Start Free ▶</Link>
              <Link href="#tier2_us" className="border border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf640] font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">View US Certifications</Link>
              <Link href="#tier2_intl" className="border border-[#d4950e40] text-[#d4950e] hover:bg-[#d4950e20] font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">International Certs</Link>
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-10 py-10 max-w-5xl mx-auto">

          {/* TRUST SCORE EXPLAINER */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-5 mb-10 flex flex-wrap gap-6 items-center">
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs text-[#566880] mb-1">HOW TRAINING AFFECTS YOUR PROFILE</p>
              <p className="text-sm font-semibold text-[#d0dce8] mb-2">Every course completion boosts your HC Trust Score</p>
              <p className="text-xs text-[#8a9ab0]">Higher trust scores earn better directory placement, priority in load matching, and verified badges visible to brokers before contact.</p>
            </div>
            <div className="flex gap-4 flex-wrap">
              {[['Foundation','+10'],['US Cert','+25'],['Intl Cert','+50'],['Specialist','+75'],['Master','+100']].map(([label,boost])=>(
                <div key={label} className="text-center">
                  <p className="text-xl font-black text-[#22c55e]">{boost}</p>
                  <p className="text-[10px] text-[#566880]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <AdGridSlot zone="training_page_top" />

          {/* TIER SECTIONS */}
          {TIERS.map(tier => {
            const tierCourses = byCourses(tier.key)
            return (
              <section key={tier.key} id={tier.key} className="mb-14 scroll-mt-16">
                {/* TIER HEADER */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{background:tier.bg, border:`1px solid ${tier.color}30`}}>{tier.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold tracking-widest px-2 py-0.5 rounded" style={{color:tier.color,background:`${tier.color}15`}}>{tier.label.toUpperCase()}</span>
                      <span className="text-xs text-[#566880]">{tier.price}</span>
                      {tier.boost>0&&<span className="text-xs text-[#22c55e] bg-[#0d2000] px-2 py-0.5 rounded">Trust +{tier.boost}</span>}
                    </div>
                    <p className="text-xs text-[#8a9ab0] mt-0.5">{tier.desc}</p>
                  </div>
                </div>

                {/* COURSE CARDS */}
                {tierCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tierCourses.map(course=>(
                      <Link key={course.id} href={`/training/${course.slug}`}
                        className="bg-[#0f1a24] border border-[#1e3048] rounded-xl p-4 flex flex-col gap-3 hover:border-[#d4950e] transition-colors group">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#d0dce8] group-hover:text-[#f0f2f5] leading-snug mb-1">{course.title}</p>
                            {course.description&&<p className="text-xs text-[#566880] leading-relaxed line-clamp-2">{course.description}</p>}
                          </div>
                          {course.is_featured&&<span className="text-[9px] font-bold text-[#d4950e] bg-[#2a1f08] px-1.5 py-0.5 rounded shrink-0 mt-0.5">FEATURED</span>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] text-[#8ab0d0] bg-[#141e28] px-2 py-0.5 rounded">
                            {fmtPrice(course.price_cents, course.currency)}
                          </span>
                          {course.duration_hours&&<span className="text-[10px] text-[#566880]">{course.duration_hours < 1 ? `${Math.round(course.duration_hours*60)} min` : `${course.duration_hours}hr`}</span>}
                          {course.modules_count>0&&<span className="text-[10px] text-[#566880]">{course.modules_count} modules</span>}
                          {course.hc_trust_score_boost>0&&<span className="text-[10px] text-[#22c55e] bg-[#0d2000] px-1.5 py-0.5 rounded">+{course.hc_trust_score_boost} Trust</span>}
                          {course.certification_level&&<span className="text-[10px] text-[#d4950e] bg-[#2a1f08] px-1.5 py-0.5 rounded">{course.certification_level}</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#0f1a24] border border-dashed border-[#1e3048] rounded-xl p-6 text-center">
                    <p className="text-sm text-[#566880] mb-3">Courses launching Q2 2026 — join the waitlist.</p>
                    <Link href="/waitlist" className="text-xs text-[#d4950e] border border-[#d4950e40] px-4 py-2 rounded-lg hover:bg-[#2a1f08]">Join Waitlist →</Link>
                  </div>
                )}
              </section>
            )
          })}

          <AdGridSlot zone="training_page_bottom" />

          {/* BOTTOM CTA */}
          <div className="bg-gradient-to-r from-[#0f1a24] to-[#0a1929] border border-[#1e3048] rounded-2xl p-8 text-center mt-6">
            <p className="text-[11px] tracking-[0.15em] text-[#d4950e] font-semibold mb-3">NOT SURE WHERE TO START?</p>
            <h2 className="text-xl font-bold text-[#f0f2f5] mb-3">Try a free 7-minute course first</h2>
            <p className="text-sm text-[#8a9ab0] mb-6 max-w-md mx-auto">No account required. See what Haul Command Training is about before committing to a certification.</p>
            <Link href="#free" className="bg-[#d4950e] hover:bg-[#c4850e] text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors">Start Free Now ▶</Link>
          </div>

          {/* COUNTRY COVERAGE */}
          <div className="mt-10 border-t border-[#131c28] pt-8">
            <p className="text-[10px] tracking-[0.15em] text-[#566880] mb-4">AVAILABLE IN 120 COUNTRIES</p>
            <div className="flex flex-wrap gap-2">
              {['US','CA','AU','GB','NZ','ZA','DE','NL','AE','BR','IE','SE','NO','DK','FI','BE','AT','CH','ES','FR','IT','PT','SA','QA','MX','IN','ID','TH'].map(cc=>(
                <span key={cc} className="text-[10px] bg-[#0f1a24] border border-[#1e3048] text-[#566880] px-2 py-0.5 rounded">{cc}</span>
              ))}
              <span className="text-[10px] text-[#566880] px-2 py-0.5">+ 92 more</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
