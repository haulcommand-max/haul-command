import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TrustScoreBadge } from '@/components/trust/TrustScoreBadge';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Enterprise Fleet Training Portal | Haul Command',
  description: 'Manage fleet compliance, bulk-purchase training seats, and track driver certification to earn your Fleet Verification Badge.',
  robots: 'noindex',
};

async function getEnterpriseStats(userId: string) {
  // In production, this would query a real hc_enterprise_fleets / seats table
  // For now, we stub the baseline integration
  return {
    fleetName: 'Example Logistics Corp',
    trustScore: 88,
    seatsPurchased: 25,
    seatsAssigned: 18,
    seatsCompleted: 12,
    badgeUnlocked: true, // Only true if completed > 10
  };
}

const DRIVERS = [
  { id: '1', name: 'James Morrison', role: 'Heavy Haul Driver', status: 'completed', tier: 'AV-Ready', score: 92 },
  { id: '2', name: 'Elena Rostova', role: 'Pilot Car Lead', status: 'completed', tier: 'Elite', score: 98 },
  { id: '3', name: 'Marcus Chen', role: 'Dispatcher', status: 'in_progress', tier: 'HC Certified', score: 65 },
  { id: '4', name: 'Sarah Jenkins', role: 'Heavy Haul Driver', status: 'invited', tier: 'Pending', score: 0 },
];

export default async function EnterpriseDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in?next=/dashboard/enterprise');

  const stats = await getEnterpriseStats(user.id);
  const complianceRate = Math.round((stats.seatsCompleted / stats.seatsAssigned) * 100) || 0;

  return (
    <div className="min-h-screen bg-[#07090d] text-[#f0f2f5]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="border-b border-[#131c28] bg-[#0a0d14] px-4 lg:px-10 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] text-[#566880] font-bold tracking-widest uppercase">ENTERPRISE HQ · TRAINING & COMPLIANCE</p>
            <h1 className="text-xl font-black text-[#f0f2f5] mt-0.5 tracking-tight">{stats.fleetName}</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/enterprise/billing" className="px-4 py-2 text-xs font-bold rounded-xl border border-[#1e3048] text-[#8a9ab0] hover:text-white transition-colors">
              Billing
            </Link>
            <Link href="/dashboard/enterprise/seats/buy" className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white shadow-lg shadow-purple-900/20">
              Bulk-Buy Seats
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-10 py-8">
        
        {/* Fleet Verification Banner */}
        <div className={`mb-8 p-6 rounded-2xl border ${stats.badgeUnlocked ? 'bg-[rgba(59,130,246,0.05)] border-blue-500/30' : 'bg-[#0f1a24] border-[#1e3048]'} relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6`}>
          <div className="relative z-10 flex items-center gap-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${stats.badgeUnlocked ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-[#2a4060] bg-[#1a2636] text-[#566880]'}`}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">
                {stats.badgeUnlocked ? 'Fleet Verification Active' : 'Fleet Verification Incomplete'}
              </h2>
              <p className="text-sm text-gray-400 max-w-xl">
                {stats.badgeUnlocked 
                  ? 'Your fleet has completed sufficient Haul Command Compliance Pre-Training. The Premium Fleet Badge is now visible on all your load board postings.'
                  : 'Achieve 75% fleet compliance to unlock the Premium Fleet Badge and increase operator acceptance rates by up to 34%.'}
              </p>
            </div>
          </div>
          <div className="relative z-10 flex-shrink-0 text-center">
            <div className="text-3xl font-black text-white">{complianceRate}%</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Compliance Rate</div>
          </div>
          {stats.badgeUnlocked && (
            <div className="absolute top-0 right-0 p-32 bg-blue-500 opacity-[0.03] blur-3xl pointer-events-none rounded-full" />
          )}
        </div>

        {/* KPI Scorecards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Purchased Seats', val: stats.seatsPurchased, color: '#f0f2f5', icon: '🎟️' },
            { label: 'Assigned Seats', val: stats.seatsAssigned, color: '#f0f2f5', icon: '👥' },
            { label: 'Completed Training', val: stats.seatsCompleted, color: '#22c55e', icon: '✅' },
            { label: 'Fleet Trust Score', val: stats.trustScore, color: '#F5A623', icon: '⭐' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-5 hover:border-[#2a4060] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">{kpi.icon}</span>
                <p className="text-[10px] text-[#566880] font-bold tracking-wider uppercase">{kpi.label}</p>
              </div>
              <p className="text-3xl font-black" style={{ color: kpi.color }}>{kpi.val}</p>
            </div>
          ))}
        </div>

        {/* Compliance Roster */}
        <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[#1e3048] flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-bold text-[#f0f2f5]">Compliance Roster</h2>
              <p className="text-[11px] text-[#566880] mt-1">Manage team access and view certification readiness before load assignment.</p>
            </div>
            <button className="px-4 py-2 text-xs font-bold rounded-xl border border-[#2a4060] bg-[#111827] text-white hover:bg-[#1f2937] transition-colors">
              + Invite Driver
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111827] text-[#566880] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3 font-bold">Team Member</th>
                  <th className="px-5 py-3 font-bold">Role</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold">Certification Tier</th>
                  <th className="px-5 py-3 font-bold text-right">Individual Trust Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3048]">
                {DRIVERS.map((d) => (
                  <tr key={d.id} className="hover:bg-[#111827] transition-colors">
                    <td className="px-5 py-4 font-semibold text-white">{d.name}</td>
                    <td className="px-5 py-4 text-gray-400">{d.role}</td>
                    <td className="px-5 py-4">
                      {d.status === 'completed' && <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full font-semibold">Completed</span>}
                      {d.status === 'in_progress' && <span className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full font-semibold">In Progress</span>}
                      {d.status === 'invited' && <span className="bg-gray-500/10 text-gray-400 px-2 py-1 rounded-full font-semibold">Invite Sent</span>}
                    </td>
                    <td className="px-5 py-4">
                      {d.tier !== 'Pending' ? (
                        <span className={`px-2 py-1 rounded-full font-semibold ${
                          d.tier === 'Elite' ? 'bg-[#E5E4E2]/10 text-[#E5E4E2]' : 
                          d.tier === 'AV-Ready' ? 'bg-[#F5A623]/10 text-[#F5A623]' : 'bg-[#A8A8A8]/10 text-[#A8A8A8]'
                        }`}>
                          {d.tier}
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {d.score > 0 ? <TrustScoreBadge score={d.score} variant="compact" /> : <span className="text-gray-600">Pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enterprise APIs teaser */}
        <div className="mt-8 bg-gradient-to-br from-[#111827] to-[#0a0f18] border border-[#2a4060] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-[14px] font-bold text-white mb-2">Automate Compliance with Enterprise APIs</h3>
            <p className="text-[12px] text-gray-400 max-w-xl line-height-relaxed">
              Integrate Haul Command's 120-country rules engine and live Trust Scores directly into your TMS. Prevent negligent hiring liability before dispatching a load.
            </p>
          </div>
          <Link href="/enterprise/api" className="flex-shrink-0 px-5 py-2.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors">
            Generate API Keys
          </Link>
        </div>

      </div>
    </div>
  );
}
