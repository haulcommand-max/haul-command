import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { JsonLd } from '@/components/seo/JsonLd'
import Link from 'next/link'
import { InstantAIVerificationCard } from '@/components/support/InstantAIVerificationCard'
import { DirectoryBackgroundShell } from '@/components/directory/DirectoryBackgroundShell'
import { buildClaimPreviewPacket } from '@/lib/claims/claim-preview-packet'
import { buildClaimPath, normalizeClaimParams, resolveClaimTarget } from '@/lib/claims/claim-target'
import {
  ArrowTrendingUpIcon, CheckBadgeIcon,
  ChatBubbleLeftRightIcon, BriefcaseIcon,
  EyeIcon, HandRaisedIcon, ArrowPathIcon
} from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'Claim Your Profile | Haul Command',
  description: 'Claim your Haul Command operator profile. Get verified, boost your trust score, and get found by brokers searching for capacity.',
}

export const dynamic = 'force-dynamic'

type ClaimSearchParams = Record<string, string | string[] | undefined>

const CLAIM_HIDDEN_FIELDS = [
  'entity',
  'hcid',
  'operator',
  'eq',
  'listing',
  'place',
  'surface_id',
  'id',
  'slug',
  'market',
  'country',
  'region',
  'plan',
  'upgrade',
  'tool',
  'ref',
  'intent',
  'source',
] as const

export default async function ClaimPage({ searchParams }: { searchParams: ClaimSearchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const claimParams = normalizeClaimParams(searchParams)
  const claimPath = buildClaimPath(claimParams)
  const nextParam = encodeURIComponent(claimPath)

  const claimTarget = await resolveClaimTarget(supabase, claimParams)
  const operator: any = claimTarget ? {
    id: claimTarget.entityId,
    hc_id: claimTarget.raw.hc_id ?? (claimTarget.targetParam === 'hcid' ? claimTarget.targetValue : undefined),
    company_name: claimTarget.name,
    state: claimTarget.region,
    country_code: claimTarget.countryCode,
    is_claimed: claimTarget.isClaimed,
    source_table: claimTarget.sourceTable,
    entity_type: claimTarget.entityType,
    claim_type: claimTarget.claimType,
    accepted_claim_actor: claimTarget.acceptedClaimActor,
    required_claim_proof: claimTarget.requiredClaimProof,
  } : null

  const claimPacket = operator ? buildClaimPreviewPacket({
    name: operator.company_name,
    region: operator.state,
    countryCode: operator.country_code,
    isClaimed: operator.is_claimed,
  }) : null

  const schema = { '@context':'https://schema.org','@type':'WebPage', name:'Claim Your Haul Command Profile', description:'Verify your identity and claim your listing on Haul Command.' }

  return (
    <>
      <JsonLd data={schema}/>
      <DirectoryBackgroundShell className="text-[#f0f2f5]">
        <div className="px-4 lg:px-10 py-12 max-w-2xl mx-auto pb-32">

          {/* HEADER */}
          <p className="text-[11px] tracking-[0.2em] text-[#d4950e] font-semibold mb-3">HAUL COMMAND DIRECTORY</p>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white mb-3">Claim Your Profile</h1>
          <p className="text-sm text-[#8a9ab0] mb-6 leading-relaxed">
            Claim your free profile to confirm ownership, service area, role, proof items, and job-alert preferences. Haul Command uses verified signals to improve directory trust and job routing.
          </p>

          {/* OPERATOR PREVIEW */}
          {operator && (
            <div className={`border rounded-2xl p-5 mb-8 shadow-xl ${
              operator.is_claimed
                ? 'border-[#22c55e40] bg-[#0d2000]'
                : 'border-[#d4950e40] bg-[#1a1200]'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#141e28] flex items-center justify-center text-sm font-bold text-[#8ab0d0]">
                  {(operator.company_name ?? 'O').split(' ').map((w:string)=>w[0]).join('').slice(0,2)}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#f0f2f5]">{operator.company_name ?? 'Directory listing'}</p>
                  <p className="text-[10px] text-[#566880] font-mono">{[operator.hc_id, operator.state, operator.country_code].filter(Boolean).join(' - ')}</p>
                </div>
                <div className="ml-auto">
                  {operator.is_claimed
                    ? <span className="text-[10px] text-[#22c55e] bg-[#0d2000] border border-[#22c55e40] px-2 py-0.5 rounded font-black tracking-widest">CLAIMED</span>
                    : <span className="flex items-center gap-1.5 text-[10px] text-[#d4950e] bg-[#2a1f08] border border-[#d4950e40] px-2 py-0.5 rounded font-black tracking-widest animate-pulse">UNCLAIMED</span>
                  }
                </div>
              </div>
              {operator.is_claimed ? (
                <p className="text-xs text-[#22c55e] mt-4 font-semibold">This profile has already been claimed. <Link href="/contact?subject=claimed-profile-support" className="underline hover:text-white">Contact support</Link> if this is yours.</p>
              ) : (
                <div className="mt-5 border-t border-[#d4950e20] pt-4">
                  {claimPacket && (
                    <div className="mb-4 rounded-xl border border-[#d4950e25] bg-black/20 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#d4950e]">{claimPacket.roleLabel}</p>
                      <p className="mt-1 text-xs font-semibold text-white">{claimPacket.headline}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-[#8a9ab0]">{claimPacket.summary}</p>
                    </div>
                  )}
                  {operator.claim_type && (
                    <div className="mb-4 rounded-xl border border-[#1e3048] bg-[#07111a] p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8ab0d0]">Required claim path</p>
                      <p className="mt-1 text-xs font-semibold text-white">{operator.claim_type.replace(/_/g, ' ')}</p>
                      {operator.accepted_claim_actor && (
                        <p className="mt-1 text-[11px] leading-relaxed text-[#8a9ab0]">
                          Accepted actor: {operator.accepted_claim_actor.replace(/_/g, ' ')}.
                        </p>
                      )}
                      {operator.required_claim_proof?.length ? (
                        <p className="mt-1 text-[11px] leading-relaxed text-[#8a9ab0]">
                          Proof: {operator.required_claim_proof.join(', ')}.
                        </p>
                      ) : null}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {(claimPacket?.metrics ?? []).map((metric, index) => {
                      const Icon = index === 0 ? EyeIcon : index === 1 ? HandRaisedIcon : ArrowPathIcon
                      const color = metric.evidence === 'actual' ? '#22c55e' : '#d4950e'
                      return (
                        <div key={metric.label} className={`text-center ${index > 0 ? 'border-l border-[#d4950e20]' : ''}`}>
                          <div className="text-[11px] font-black text-white flex min-h-8 items-center justify-center gap-1 leading-tight">
                            <Icon className="h-4 w-4 shrink-0" style={{ color }} />
                            <span>{metric.value}</span>
                          </div>
                          <div className="text-[9px] text-[#8a9ab0] uppercase tracking-wider">{metric.label}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRESSURE & BENEFITS */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-8 shadow-xl">
            <p className="text-[10px] text-[#8a9ab0] font-black tracking-[0.15em] mb-4">WHAT YOU UNLOCK</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <div className="flex gap-3">
                  <ArrowTrendingUpIcon className="w-6 h-6 text-[#d4950e] flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white mb-0.5">Stronger visibility signals</p>
                    <p className="text-[11px] text-[#8a9ab0] leading-relaxed">Confirmed service area, availability, and proof signals can improve directory confidence.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckBadgeIcon className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white mb-0.5">Proof-ready profile</p>
                    <p className="text-[11px] text-[#8a9ab0] leading-relaxed">Show brokers which contact, equipment, credential, and service-area signals are confirmed.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <BriefcaseIcon className="w-6 h-6 text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white mb-0.5">Job-alert eligibility</p>
                    <p className="text-[11px] text-[#8a9ab0] leading-relaxed">Choose the roles, corridors, and communication channels you want Haul Command to use.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white mb-0.5">Role-aware next steps</p>
                    <p className="text-[11px] text-[#8a9ab0] leading-relaxed">After claim, Haul Command routes you toward jobs, quote requests, training, sponsors, or partner workflows.</p>
                  </div>
                </div>
            </div>
          </div>

          {/* CLAIM CTA FORM */}
          {(!operator || !operator.is_claimed) && (
            <div className="flex flex-col gap-3">
              {!user ? (
                <>
                  <Link href={`/auth/register?intent=claim&next=${nextParam}`}
                    className="relative group bg-gradient-to-r from-[#d4950e] to-[#c4850e] text-white font-black uppercase tracking-widest py-4 rounded-xl text-sm text-center transition-all shadow-[0_0_20px_rgba(212,149,14,0.3)] hover:shadow-[0_0_30px_rgba(212,149,14,0.5)] overflow-hidden">
                    <span className="relative z-10">Claim My Profile - Free</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                  </Link>
                  <Link href={`/login?next=${nextParam}`}
                    className="border border-[#1e3048] text-[#8a9ab0] font-bold hover:text-white hover:bg-white/5 py-4 rounded-xl text-sm text-center transition-all">
                    I Already Have an Account
                  </Link>
                </>
              ) : (
                <form action="/api/claim/submit" method="POST" className="bg-[#0f1a24] border border-[#1e3048] p-6 rounded-2xl">
                  <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest border-b border-white/[0.05] pb-3">Final Verification Step</h3>
                  {CLAIM_HIDDEN_FIELDS.map((field) => (
                    claimParams[field] ? <input key={field} type="hidden" name={field} value={claimParams[field]} /> : null
                  ))}
                  {claimTarget?.entityId && <input type="hidden" name="claim_entity_id" value={claimTarget.entityId} />}
                  {claimTarget?.entityType && <input type="hidden" name="claim_entity_type" value={claimTarget.entityType} />}
                  {claimTarget?.sourceTable && <input type="hidden" name="claim_source_table" value={claimTarget.sourceTable} />}
                  {claimTarget?.countryCode && <input type="hidden" name="country_code" value={claimTarget.countryCode} />}
                  {claimTarget?.claimType && <input type="hidden" name="claim_type" value={claimTarget.claimType} />}
                  {claimTarget?.acceptedClaimActor && <input type="hidden" name="accepted_claim_actor" value={claimTarget.acceptedClaimActor} />}

                  <InstantAIVerificationCard hcid={claimParams.hcid} companyName={operator?.company_name} />

                  <div className="mb-4">
                    <label className="block text-[10px] text-[#8a9ab0] mb-1.5 font-bold tracking-widest uppercase">Company Name <span className="text-red-400">*</span></label>
                    <input name="company_name" defaultValue={operator?.company_name??''} required
                      className="w-full bg-[#07090d] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-white placeholder-[#3a5068] focus:border-[#d4950e] focus:ring-1 focus:ring-[#d4950e] outline-none transition-all" placeholder="Exact legal company name"/>
                  </div>
                  <div className="mb-6">
                    <label className="block text-[10px] text-[#8a9ab0] mb-1.5 font-bold tracking-widest uppercase">Business Mobile <span className="text-red-400">*</span></label>
                    <input name="phone" type="tel" required
                      className="w-full bg-[#07090d] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-white placeholder-[#3a5068] focus:border-[#d4950e] focus:ring-1 focus:ring-[#d4950e] outline-none transition-all" placeholder="+1 (555) 000-0000"/>
                  </div>
                  <button type="submit" className="w-full bg-[#d4950e] hover:bg-[#c4850e] text-white font-black tracking-widest uppercase py-4 rounded-xl text-sm transition-all shadow-[0_4px_14px_rgba(212,149,14,0.4)] hover:shadow-[0_6px_20px_rgba(212,149,14,0.6)] hover:scale-[1.01]">
                    Submit Verification
                  </button>
                  <p className="text-[9px] text-[#566880] text-center mt-4">Verification may use email, phone, document, or manual review depending on country, consent status, and listing confidence.</p>
                </form>
              )}
            </div>
          )}

          {/* SEARCH YOUR LISTING */}
          {!claimTarget && (
            <div className="mt-8 pt-8 border-t border-[#1e3048]">
              <p className="text-[10px] font-black tracking-[0.1em] uppercase text-[#8a9ab0] mb-3">Find Your Profile</p>
              <form action="/claim" method="GET" className="flex gap-2">
                <input name="operator" placeholder="Enter HC ID, slug, or listing ID" className="flex-1 bg-[#0f1a24] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-white placeholder-[#3a5068] focus:border-[#d4950e] outline-none transition-all"/>
                <button type="submit" className="bg-[#1e3048] hover:bg-[#2a4060] text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors">Search</button>
              </form>
            </div>
          )}
        </div>
      </DirectoryBackgroundShell>
    </>
  )
}
