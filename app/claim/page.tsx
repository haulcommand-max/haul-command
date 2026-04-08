import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/seo/JsonLd'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Claim Your Profile | Haul Command',
  description: 'Claim your Haul Command operator profile. Get verified, boost your trust score, and get found by brokers searching for capacity.',
}

export const dynamic = 'force-dynamic'

export default async function ClaimPage({ searchParams }: { searchParams: { hcid?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Resolve operator if hcid passed
  let operator: any = null
  if (searchParams.hcid) {
    const { data } = await supabase
      .from('operators')
      .select('id,hc_id,company_name,state,country_code,is_claimed')
      .eq('hc_id', searchParams.hcid)
      .single()
    operator = data
  }

  const schema = { '@context':'https://schema.org','@type':'WebPage', name:'Claim Your Haul Command Profile', description:'Verify your identity and claim your listing on Haul Command.' }

  // A/B Split Test: 'Claim Your Profile' vs 'Get Verified'
  const isGetVerifiedVariation = Math.random() > 0.5;
  const headingText = isGetVerifiedVariation ? 'Get Verified' : 'Claim Your Profile';

  return (
    <>
      <JsonLd data={schema}/>
      <div className="min-h-screen bg-[#07090d] text-[#f0f2f5]">
        <div className="px-4 lg:px-10 py-12 max-w-2xl mx-auto">

          {/* HEADER */}
          <p className="text-[11px] tracking-[0.2em] text-[#d4950e] font-semibold mb-3">HAUL COMMAND DIRECTORY</p>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#f0f2f5] mb-3">{headingText}</h1>
          <p className="text-sm text-[#8a9ab0] mb-8 leading-relaxed">
            Your company may already be listed. Claiming takes 2 minutes and immediately boosts your trust score, ranking, and broker visibility.
          </p>

          {/* OPERATOR PREVIEW */}
          {operator && (
            <div className={`border rounded-2xl p-5 mb-8 ${
              operator.is_claimed
                ? 'border-[#22c55e40] bg-[#0d2000]'
                : 'border-[#d4950e40] bg-[#1a1200]'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#141e28] flex items-center justify-center text-sm font-bold text-[#8ab0d0]">
                  {(operator.company_name??'O').split(' ').map((w:string)=>w[0]).join('').slice(0,2)}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#f0f2f5]">{operator.company_name}</p>
                  <p className="text-[10px] text-[#566880] font-mono">{operator.hc_id} · {[operator.state,operator.country_code].filter(Boolean).join(', ')}</p>
                </div>
                <div className="ml-auto">
                  {operator.is_claimed
                    ? <span className="text-[10px] text-[#22c55e] bg-[#0d2000] border border-[#22c55e40] px-2 py-0.5 rounded">CLAIMED</span>
                    : <span className="text-[10px] text-[#d4950e] bg-[#2a1f08] border border-[#d4950e40] px-2 py-0.5 rounded">UNCLAIMED</span>
                  }
                </div>
              </div>
              {operator.is_claimed && (
                <p className="text-xs text-[#22c55e] mt-4">✔ This profile has already been claimed. If you believe this is your company, <Link href="/support" className="underline">contact support</Link>.</p>
              )}
            </div>
          )}

          {/* BENEFITS */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-8">
            <p className="text-xs text-[#566880] font-semibold tracking-wider mb-4">WHAT YOU GET WHEN YOU CLAIM</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { icon:'⬆️', label:'Higher directory rank', desc:'Claimed profiles rank above unclaimed listings.' },
                { icon:'✔️', label:'Verified badge', desc:'Green verified checkmark visible to every broker who views your profile.' },
                { icon:'📈', label:'Trust score boost', desc:'Claiming adds +20 to your HC Trust Score immediately.' },
                { icon:'🔔', label:'Broker enquiries', desc:'Brokers can message you directly through the platform.' },
                { icon:'💼', label:'Load board access', desc:'Receive push notifications for matching loads near you.' },
                { icon:'🏅', label:'Certification display', desc:'Show your HC certifications and training badges on your profile.' },
              ].map(b=>(
                <div key={b.label} className="flex gap-3">
                  <span className="text-base">{b.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-[#d0dce8]">{b.label}</p>
                    <p className="text-[11px] text-[#566880] leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CLAIM CTA */}
          {(!operator || !operator.is_claimed) && (
            <div className="flex flex-col gap-3">
              {!user ? (
                <>
                  <Link href={`/sign-up?next=/claim${searchParams.hcid?`?hcid=${searchParams.hcid}`:''}`}
                    className="bg-[#d4950e] hover:bg-[#c4850e] text-black font-bold py-4 rounded-xl text-sm text-center transition-colors">
                    Create Account &amp; Claim Your Profile
                  </Link>
                  <Link href={`/sign-in?next=/claim${searchParams.hcid?`?hcid=${searchParams.hcid}`:''}`}
                    className="border border-[#1e3048] text-[#8a9ab0] hover:border-[#d4950e] py-4 rounded-xl text-sm text-center transition-colors">
                    Sign In to Claim
                  </Link>
                </>
              ) : (
                <form action="/api/claim/submit" method="POST">
                  {searchParams.hcid && <input type="hidden" name="hcid" value={searchParams.hcid}/>}
                  <input type="hidden" name="user_id" value={user.id}/>
                  <div className="mb-4">
                    <label className="block text-xs text-[#566880] mb-1.5 font-semibold tracking-wider">YOUR COMPANY NAME <span className="text-red-400">*</span></label>
                    <input name="company_name" defaultValue={operator?.company_name??''} required
                      className="w-full bg-[#0f1a24] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#d4950e] focus:outline-none" placeholder="Exact legal company name"/>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs text-[#566880] mb-1.5 font-semibold tracking-wider">BUSINESS PHONE <span className="text-red-400">*</span></label>
                    <input name="phone" type="tel" required
                      className="w-full bg-[#0f1a24] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#d4950e] focus:outline-none" placeholder="+1 (555) 000-0000"/>
                  </div>
                  <button type="submit" className="w-full bg-[#d4950e] hover:bg-[#c4850e] text-black font-bold py-4 rounded-xl text-sm transition-colors">
                    Submit Claim &rarr;
                  </button>
                </form>
              )}
              <p className="text-[10px] text-[#3a5068] text-center">Claims are reviewed within 24 hours. We may request a copy of your business documentation.</p>
            </div>
          )}

          {/* SEARCH YOUR LISTING */}
          {!searchParams.hcid && (
            <div className="mt-8 border-t border-[#131c28] pt-8">
              <p className="text-xs text-[#566880] mb-3">Search for your existing listing first:</p>
              <form action="/claim" method="GET" className="flex gap-2">
                <input name="hcid" placeholder="Enter your HC ID (e.g. HC-TX-00123)" className="flex-1 bg-[#0f1a24] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#d4950e] focus:outline-none"/>
                <button type="submit" className="bg-[#1e3048] hover:bg-[#2a4060] text-[#8ab0d0] font-semibold px-4 py-3 rounded-xl text-sm">Search</button>
              </form>
              <p className="text-[10px] text-[#3a5068] mt-2">Don&apos;t have an HC ID? <Link href="/directory" className="text-[#d4950e] hover:underline">Browse the directory</Link> to find your listing.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
