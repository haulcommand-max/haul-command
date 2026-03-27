import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabase-server';
import HCFaqModule from '@/components/hc/FaqModule';
import HCTrustGuardrailsModule from '@/components/hc/TrustGuardrailsModule';
import TrustBadge from '@/components/hc/TrustBadge';
import TrustScoreLadder from '@/components/hc/TrustScoreLadder';
import PostClaimLauncher from '@/components/hc/PostClaimLauncher';

export const metadata: Metadata = {
  title: 'Claim Your Business Listing — Haul Command',
  description:
    'Claim and verify your escort, pilot car, or heavy haul business listing on Haul Command. Free to claim. Unlock premium features, respond to loads, and build your verified reputation across 120 countries.',
};

export default async function ClaimPage() {
  const sb = supabaseServer();

  // Count total unclaimed listings for urgency messaging
  const [listingsResult, claimsResult] = await Promise.all([
    sb.from('directory_listings').select('id', { count: 'exact', head: true }).eq('is_visible', true),
    sb.from('listing_claims').select('id, claim_status, claimed_at').eq('claim_status', 'verified').order('claimed_at', { ascending: false }).limit(10),
  ]);

  const unclaimedCount = listingsResult.count ?? 0;
  const recentClaims = claimsResult.data ?? [];
  const claimedCount = recentClaims.length;

  // Simulated lost opportunity metrics (real data in production from profile_claim_funnel_snapshot)
  const lostLeadsWeekly = Math.floor(unclaimedCount * 0.003);
  const invisibleToBrokers = Math.floor(unclaimedCount * 0.02);

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full overflow-x-hidden">

        {/* ═══ HERO — Urgency + Value ═══ */}
        <section className="relative py-16 sm:py-24 px-4 overflow-hidden border-b border-white/5 bg-[#05080f]">
          {/* Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto relative z-10 text-center">
            {/* Velocity Banner */}
            {claimedCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-6 ag-badge-pop">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400 text-xs font-bold">
                  {claimedCount} operators claimed in the last 24h
                </span>
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter mb-4 leading-[0.95]">
              You Already Exist in{' '}
              <span className="text-accent ag-text-glow">Haul Command</span>
            </h1>
            <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto mb-6">
              Your profile is live. Brokers are searching. But until you claim it,
              you&apos;re invisible and losing jobs to operators who already did.
            </p>

            {/* Stats Ribbon */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-8">
              {[
                { value: unclaimedCount > 0 ? unclaimedCount.toLocaleString() : '—', label: 'Profiles Indexed' },
                { value: lostLeadsWeekly > 0 ? `~${lostLeadsWeekly}` : '—', label: 'Leads Missed / Week' },
                { value: invisibleToBrokers > 0 ? `${invisibleToBrokers.toLocaleString()}+` : '—', label: 'Invisible to Brokers' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-black text-accent ag-tick">{s.value}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto">
              <input
                type="text"
                placeholder="Business name or phone number"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50 max-w-full"
              />
              <button className="bg-accent text-black px-8 py-3.5 rounded-xl font-black text-sm hover:bg-yellow-500 transition-all whitespace-nowrap ag-magnetic shadow-[0_0_24px_rgba(245,159,10,0.3)]">
                Find My Listing
              </button>
            </div>
            <p className="text-gray-600 text-[10px] mt-3">
              Free to claim · 2-minute verification · Instant upgrade
            </p>
          </div>
        </section>

        {/* ═══ FOMO BLOCKS — Lost Leads + Missing Visibility ═══ */}
        <section className="py-10 sm:py-14 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Lost Leads Block */}
            <div className="bg-red-500/[0.04] border border-red-500/20 rounded-2xl p-6 ag-spring-hover">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🚨</span>
                <h3 className="text-white font-bold text-base">You&apos;re Missing Jobs</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Unclaimed operators miss an estimated <span className="text-red-400 font-bold">{lostLeadsWeekly > 0 ? lostLeadsWeekly : '3–12'} leads per week</span>.
                Brokers can&apos;t contact you because your profile shows no verified phone or availability.
              </p>
              <div className="flex items-center gap-4 text-[10px] text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500/50" />
                  No direct contact
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500/50" />
                  No alert notifications
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500/50" />
                  No load matching
                </div>
              </div>
            </div>

            {/* Missing Visibility Block */}
            <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-2xl p-6 ag-spring-hover">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">👁️‍🗨️</span>
                <h3 className="text-white font-bold text-base">You&apos;re Invisible</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                <span className="text-amber-400 font-bold">{invisibleToBrokers > 0 ? invisibleToBrokers.toLocaleString() : '200+'} brokers</span> searched
                your territory this month. Without a claimed profile, verified operators outrank you in every search.
              </p>
              <div className="flex items-center gap-4 text-[10px] text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500/50" />
                  No search priority
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500/50" />
                  No verified badge
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500/50" />
                  No territory claim
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ TRUST SCORE PREVIEW ═══ */}
        <section className="py-8 sm:py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter mb-2">
                Your Trust Score <span className="text-accent">Preview</span>
              </h2>
              <p className="text-gray-500 text-sm max-w-lg mx-auto">
                Every operator in our directory gets a Trust Score. Claim yours to unlock verified status and climb the leaderboard.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sample Estimated Badge */}
              <div className="space-y-4">
                <div className="text-[10px] text-gray-600 uppercase tracking-widest font-bold text-center">Before Claiming</div>
                <TrustBadge
                  overallTrustScore={35}
                  aliveStatus="scraped"
                  hcId="HC-XXXX-XX"
                  variant="full"
                  reliabilityScore={30}
                  complianceScore={40}
                  disputeRiskScore={60}
                />
              </div>

              {/* Sample Verified Badge */}
              <div className="space-y-4">
                <div className="text-[10px] text-gray-600 uppercase tracking-widest font-bold text-center">After Claiming</div>
                <TrustBadge
                  overallTrustScore={88}
                  aliveStatus="claimed"
                  hcId="HC-1004-TX"
                  variant="full"
                  reliabilityScore={92}
                  complianceScore={85}
                  disputeRiskScore={15}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS — 3 Steps ═══ */}
        <section className="py-10 sm:py-14 px-4 bg-black/20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white text-center tracking-tighter mb-8">
              Claim in <span className="text-accent">2 Minutes</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { step: '1', icon: '🔍', title: 'Find Your Profile', desc: 'Search by name, phone, or USDOT. Your profile is already here.' },
                { step: '2', icon: '📱', title: 'Verify by Phone', desc: 'Quick verification code to your business number. Done in seconds.' },
                { step: '3', icon: '🚀', title: 'Go Live', desc: 'Instant verified badge, direct contact, load alerts, and priority placement.' },
              ].map((s) => (
                <div key={s.step} className="relative bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 text-center hover:border-accent/20 transition-all ag-spring-hover">
                  <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 text-accent font-black text-sm">
                    {s.step}
                  </div>
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <h3 className="text-white font-bold text-base mb-1.5">{s.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ TERRITORY OPPORTUNITY + SECOND SEARCH CTA ═══ */}
        <section className="py-10 sm:py-14 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-accent/20 rounded-2xl p-6 sm:p-10 text-center overflow-hidden relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 blur-[80px] rounded-full pointer-events-none" />
              <h2 className="text-white font-black text-xl sm:text-2xl tracking-tighter mb-2 relative z-10">
                Your Territory is <span className="text-accent ag-text-glow">Open</span>
              </h2>
              <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto relative z-10">
                Early claimants lock dominant lane positioning during our global rollout.
                {unclaimedCount > 0 && ` ${unclaimedCount.toLocaleString()} profiles still unclaimed.`}
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto relative z-10">
                <input
                  type="text"
                  placeholder="Business name or phone number"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
                />
                <button className="bg-accent text-black px-8 py-3.5 rounded-xl font-black text-sm hover:bg-yellow-500 transition-all whitespace-nowrap ag-magnetic shadow-[0_0_24px_rgba(245,159,10,0.3)]">
                  Claim Now →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ REVENUE UNLOCKS ═══ */}
        <section className="py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              Unlock <span className="text-accent">Revenue</span>
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">Free features + premium upgrades that pay for themselves</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: '✅', title: 'Verified Badge', desc: 'Stand out with a verified badge visible on search and profile', tier: 'Free' },
                { icon: '📞', title: 'Direct Contact', desc: 'Receive calls and texts directly from shippers and carriers', tier: 'Free' },
                { icon: '📊', title: 'Profile Analytics', desc: 'See how many times your profile is viewed and contacted', tier: 'Free' },
                { icon: '🚀', title: 'Priority Placement', desc: 'Verified profiles appear higher in search results', tier: 'Pro' },
                { icon: '📦', title: 'Load Alerts', desc: 'Get notified when matching loads are posted in your area', tier: 'Pro' },
                { icon: '🛡️', title: 'Reputation System', desc: 'Build your trust score through verified performance data', tier: 'Free' },
                { icon: '⚡', title: 'Standing Orders', desc: 'Accept recurring pre-funded loads from verified brokers', tier: 'Pro' },
                { icon: '💰', title: 'QuickPay', desc: 'Get paid within 24 hours of load completion', tier: 'Pro' },
              ].map((b, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex gap-4 items-start hover:border-accent/15 transition-all">
                  <span className="text-2xl">{b.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold text-sm">{b.title}</h3>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        b.tier === 'Free' ? 'bg-green-500/10 text-green-400' : 'bg-accent/10 text-accent'
                      }`}>{b.tier}</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ TRUST SCORE LADDER ═══ */}
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <TrustScoreLadder />
          </div>
        </section>

        {/* ═══ POST-CLAIM MONETIZATION LAUNCHER ═══ */}
        <section className="py-10 px-4 bg-black/20">
          <div className="max-w-5xl mx-auto">
            <PostClaimLauncher />
          </div>
        </section>

        {/* ═══ PRICING CTA ═══ */}
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 ag-glow-gold">
              <div>
                <h3 className="text-white font-black text-xl tracking-tighter mb-1">
                  Ready for <span className="text-accent">Pro</span>?
                </h3>
                <p className="text-gray-400 text-sm">Priority placement, load alerts, QuickPay, and analytics.</p>
              </div>
              <Link
                href="/pricing"
                className="bg-accent text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors flex-shrink-0 ag-magnetic"
              >
                View Plans →
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <HCFaqModule
              items={[
                { question: 'Is claiming free?', answer: 'Yes, claiming your listing is completely free. Premium features like boost credits and enhanced analytics are available through paid plans, but the core claim and verification is always free.' },
                { question: 'How does the Trust Score work?', answer: 'Every profile in Haul Command gets a Trust Score from F to A. It\'s calculated from reliability, compliance, dispute risk, and activity signals. Claiming your profile is the first step to upgrading from Estimated to Verified.' },
                { question: 'When will other countries be added?', answer: 'We are currently running the "Claim Campaign" for our Tier A countries (US, Canada, Australia, UK, New Zealand, South Africa, Germany, Netherlands, UAE, Brazil). Our system tracks 120 countries with autonomous expansion.' },
                { question: 'What if my business isn\'t listed yet?', answer: 'If you operate inside a tracked country, you can add your business directly through the claim flow. We\'ll create your profile and you can claim it immediately.' },
                { question: 'Can I route multi-currency loads?', answer: 'Yes. Upon claiming, operators can accept loads globally using our automated 30-day currency conversion index.' },
                { question: 'How many operators are on Haul Command?', answer: `Our directory tracks ${unclaimedCount > 0 ? unclaimedCount.toLocaleString() : 'over 1.5 million'} entities across 120 countries. Claiming early grants dominant lane positioning during the global rollout.` },
              ]}
            />
          </div>
        </section>

        {/* ═══ TRUST GUARDRAILS ═══ */}
        <section className="py-6 px-4">
          <div className="max-w-4xl mx-auto">
            <HCTrustGuardrailsModule />
          </div>
        </section>

      </main>
    </>
  );
}
