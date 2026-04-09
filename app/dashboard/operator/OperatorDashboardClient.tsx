"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import SwipeableRunCard from "@/components/mobile/SwipeableRunCard";
import { AvailabilityToggle } from "@/components/dispatch/AvailabilityToggle";
import AvailabilityQuickSet from "@/components/capture/AvailabilityQuickSet";
import { TrustScoreBadge } from "@/components/trust/TrustScoreBadge";
import { CheckCircle, AlertCircle, Clock, TrendingUp, DollarSign, Briefcase, User, ChevronRight } from "lucide-react";

const HeavyHaulMap = dynamic(() => import('@/components/map/HeavyHaulMap'), { ssr: false });

// ═══════════════════════════════════════════════════════════════
// OperatorDashboardClient — Fully typed, live-data connected
// Props are injected 100% server-side from the DB in page.tsx.
// Zero mocked fallbacks. Client handles UI state only.
// ═══════════════════════════════════════════════════════════════

interface OperatorProfile {
  id: string;
  business_name: string;
  claim_status: string;
  trust_score?: number;
  verification_tier?: string;
  state?: string;
  city?: string;
  country_code?: string;
  rating_avg?: number;
  review_count?: number;
  profile_completeness_pct?: number;
  is_active?: boolean;
}

interface Assignment {
  id: string;
  dispatch_request_id?: string;
  load_id?: string;
  origin?: string;
  destination?: string;
  load_type?: string;
  date_needed?: string;
  agreed_rate_per_day?: number;
  positions?: string[];
  status: string;
  accepted_at?: string;
}

interface Earning {
  id: string;
  amount: number;
  status: string;
  job_id?: string;
  earned_at?: string;
  description?: string;
}

interface Load {
  id: string;
  origin_city?: string;
  origin_state?: string;
  destination_city?: string;
  destination_state?: string;
  equipment_type?: string[];
  status?: string;
}

interface TrustProfile {
  trust_score?: number;
  identity_verified?: boolean;
  insurance_verified?: boolean;
  license_verified?: boolean;
  background_checked?: boolean;
  claimed?: boolean;
  badges?: string[];
  review_count?: number;
  review_avg?: number;
  verified_jobs_count?: number;
  verified_km_total?: number;
  active_since?: string;
  jobs_30d?: number; jobs_90d?: number; jobs_180d?: number; jobs_365d?: number;
  km_30d?: number;   km_90d?: number;   km_180d?: number;  km_365d?: number;
  avg_rating_30d?: number; avg_rating_90d?: number; avg_rating_180d?: number; avg_rating_365d?: number;
  reviews_30d?: number;    reviews_90d?: number;    reviews_180d?: number;    reviews_365d?: number;
  avg_response_min_30d?: number; avg_response_min_90d?: number;
  avg_response_min_180d?: number; avg_response_min_365d?: number;
  period_stats_refreshed_at?: string;
  score_computed_at?: string;
}

interface Props {
  userId: string;
  operatorId: string | null;
  operatorProfile: OperatorProfile | null;
  hasLinkedProfile: boolean;
  claimStatus: string;
  profileCompleteness: number;
  assignments: Assignment[];
  recentEarnings: Earning[];
  totalEarnings30d: number;
  pendingPayout: number;
  availableLoads: Load[];
  trustProfile: TrustProfile | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  pending: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  accepted: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  en_route: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  completed: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
};

export function OperatorDashboardClient({
  userId,
  operatorId,
  operatorProfile,
  hasLinkedProfile,
  claimStatus,
  profileCompleteness,
  assignments,
  recentEarnings,
  totalEarnings30d,
  pendingPayout,
  availableLoads,
  trustProfile,
}: Props) {
  const [loads, setLoads] = useState(availableLoads);
  const [biddingOn, setBiddingOn] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'assignments' | 'loads' | 'earnings' | 'report_card'>('assignments');
  const [cardPeriod, setCardPeriod] = useState<30 | 90 | 180 | 365>(30);

  const handleSubmitBid = async (loadId: string) => {
    if (!bidAmount || isNaN(Number(bidAmount))) return alert("Enter a valid bid amount.");
    if (!operatorId) return alert("You need to claim a profile before bidding.");

    setIsProcessing(true);
    try {
      const response = await fetch("/api/dispatch/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          load_id: loadId,
          operator_id: operatorId,
          bid_amount: Number(bidAmount)
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      alert(`Bid of $${bidAmount} submitted successfully.`);
      setBiddingOn(null);
      setBidAmount("");
      setLoads(prev => prev.filter(l => l.id !== loadId));
    } catch (err: any) {
      alert(`Dispatch Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = (loadId: string) => {
    setLoads(prev => prev.filter(l => l.id !== loadId));
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {operatorProfile?.business_name ?? "Operator Dashboard"}
          </h1>
          <p className="text-slate-400 mt-1">
            {hasLinkedProfile
              ? `${operatorProfile?.city ?? ''}${operatorProfile?.state ? `, ${operatorProfile.state}` : ''} · ${claimStatus === 'verified' ? '✓ Verified' : 'Pending claim'}`
              : "No profile linked yet — claim your listing to activate full features."}
          </p>
        </div>
        <div className="text-right">
          {hasLinkedProfile ? (
            <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${
              claimStatus === 'verified'
                ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                : 'text-amber-400 bg-amber-400/10 border-amber-400/20'
            }`}>
              {claimStatus === 'verified' ? '✓ Verified Operator' : `⏳ ${claimStatus}`}
            </span>
          ) : (
            <Link href="/claim" className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition-colors">
              Claim Your Listing →
            </Link>
          )}
        </div>
      </div>

      {/* ── No Profile CTA ── */}
      {!hasLinkedProfile && (
        <Card>
          <div className="p-6 flex items-center gap-4">
            <AlertCircle className="w-10 h-10 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="font-bold text-white mb-1">Connect your operator profile</h2>
              <p className="text-sm text-slate-400">
                Claim your listing to access jobs, earnings, and dispatch matching.
                It takes less than 2 minutes with email or SMS verification.
              </p>
            </div>
            <Link href="/claim" className="flex-shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition-colors">
              Claim Now →
            </Link>
          </div>
        </Card>
      )}

      {/* ── Profile Completeness Bar ── */}
      {hasLinkedProfile && profileCompleteness < 100 && (
        <Card>
          <div className="p-4 flex items-center gap-4">
            <User className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-white">Profile Completeness</span>
                <span className="text-amber-400 font-bold">{profileCompleteness}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all"
                  style={{ width: `${profileCompleteness}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Complete your profile to rank higher in operator search</p>
            </div>
            <Link href="/settings/profile" className="text-xs text-amber-400 hover:underline flex-shrink-0 flex items-center gap-1">
              Complete <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>
      )}

      {/* ── Compliance Hub CTA ── */}
      {hasLinkedProfile && (
        <Card>
          <div className="p-4 flex items-center justify-between gap-4 border border-[#22c55e]/20 bg-[#22c55e]/5 rounded-xl">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-8 h-8 text-[#22c55e] flex-shrink-0" />
              <div>
                <h2 className="font-bold text-white text-sm">Compliance Hub</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sign auto-filled route surveys, W-9s, and high-pole declarations.
                </p>
              </div>
            </div>
            <Link href="/dashboard/operator/forms" className="flex-shrink-0 px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-colors whitespace-nowrap">
              Manage Forms →
            </Link>
          </div>
        </Card>
      )}

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4 flex flex-col gap-1">
            <DollarSign className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-2xl font-black text-white">${totalEarnings30d.toLocaleString()}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Earned (30d)</span>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex flex-col gap-1">
            <Clock className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-2xl font-black text-white">${pendingPayout.toLocaleString()}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending Payout</span>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex flex-col gap-1">
            <Briefcase className="w-4 h-4 text-blue-400 mb-1" />
            <span className="text-2xl font-black text-white">{assignments.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Missions</span>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex flex-col gap-1">
            <TrendingUp className="w-4 h-4 text-purple-400 mb-1" />
            <span className="text-2xl font-black text-white">
              {operatorProfile?.rating_avg ? `${operatorProfile.rating_avg.toFixed(1)}★` : '—'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Avg Rating ({operatorProfile?.review_count ?? 0} reviews)
            </span>
          </div>
        </Card>
      </div>

      {/* ── Availability ── */}
      {operatorId && (
        <AvailabilityToggle 
          operatorId={operatorId} 
          initialStatus={operatorProfile?.is_active ? 'online' : 'offline'} 
        />
      )}

      {/* ── One-Tap Availability Broadcast ── */}
      {/* This directly writes to availability_broadcasts → appears in /available-now broker feed */}
      {operatorId && (
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-white">Broadcast Availability</h2>
                <p className="text-xs text-slate-500 mt-0.5">Set your status to appear in the live broker feed at <a href="/available-now" className="text-amber-400 hover:underline">/available-now</a></p>
              </div>
              {operatorProfile?.rating_avg && (
                <TrustScoreBadge
                  score={Math.round((operatorProfile.rating_avg / 5) * 100)}
                  variant="compact"
                />
              )}
            </div>
            <AvailabilityQuickSet
              operatorId={operatorId}
              compact={false}
            />
          </div>
        </Card>
      )}

      {/* ── Tabs ── */}
      <div className="flex flex-wrap gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {(['assignments', 'loads', 'earnings', 'report_card'] as const).map(tab => (
          <button
            key={tab}
            id={`op-tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-amber-500 text-black'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'assignments' ? `Missions (${assignments.length})`
              : tab === 'loads' ? `Open Loads (${loads.length})`
              : tab === 'report_card' ? '📊 Report Card'
              : 'Earnings'}
          </button>
        ))}
      </div>

      {/* ── Assignments Tab ── */}
      {activeTab === 'assignments' && (
        <Card>
          {assignments.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-slate-400">No active missions</p>
              <p className="text-sm mt-1">Switch to "Open Loads" to bid on new routes.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-mono text-xs text-emerald-400">
                      {assignment.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-300">{assignment.origin}</span>
                        <span className="text-slate-600">→</span>
                        <span className="text-slate-300">{assignment.destination}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">{assignment.load_type ?? '—'}</TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {assignment.date_needed ?? 'ASAP'}
                    </TableCell>
                    <TableCell className="font-bold text-white">
                      {assignment.agreed_rate_per_day ? `$${assignment.agreed_rate_per_day.toLocaleString()} / day` : '—'}
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${STATUS_COLORS[assignment.status] ?? STATUS_COLORS.pending}`}>
                        {assignment.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link 
                        href={`/dashboard/operator/assignments/${assignment.id}`}
                        className="inline-flex items-center text-xs font-bold text-emerald-400 hover:text-emerald-300 transition gap-1"
                      >
                        Action <ChevronRight className="w-3 h-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* ── Open Loads Tab ── */}
      {activeTab === 'loads' && (
        <>
          {/* Live Map */}
          <Card>
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Load Map</h2>
                  <p className="text-xs text-slate-600 mt-0.5">{loads.length} open loads on the network</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
                </div>
              </div>
              <div style={{ height: 260, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                <HeavyHaulMap
                  mode="operator"
                  showPermitRoute={false}
                  showHud={false}
                  initialCenter={[-95.7, 37.0]}
                  initialZoom={4}
                />
              </div>
            </div>
          </Card>

          {/* Bid Table — Desktop */}
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route Code</TableHead>
                    <TableHead>Corridor</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                        No open loads right now. Check back soon.
                      </TableCell>
                    </TableRow>
                  )}
                  {loads.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-emerald-400">{l.id.substring(0, 8)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-slate-300">{l.origin_city}, {l.origin_state}</span>
                          <span className="text-slate-600">→</span>
                          <span className="font-medium text-slate-300">{l.destination_city}, {l.destination_state}</span>
                        </div>
                      </TableCell>
                      <TableCell>{l.equipment_type?.join(" • ") ?? "High Pole / Chase"}</TableCell>
                      <TableCell>
                        {biddingOn === l.id ? (
                          <div className="flex space-x-2 items-center">
                            <input
                              id={`bid-input-${l.id}`}
                              type="number"
                              placeholder="Quote ($)"
                              className="bg-slate-800 text-white px-3 py-1 rounded text-sm w-24 outline-none border border-slate-700"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              min="50"
                            />
                            <Button aria-label="Submit bid" size="sm" disabled={isProcessing} onClick={() => handleSubmitBid(l.id)}>Submit</Button>
                            <Button aria-label="Cancel bid" variant="ghost" className="text-slate-500 text-sm hover:text-white" onClick={() => setBiddingOn(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <Button aria-label="Bid on route" size="sm" onClick={() => setBiddingOn(l.id)}>Bid on Route</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Swipeable Cards — Mobile */}
          <div className="md:hidden space-y-4">
            {loads.length === 0 && (
              <div className="text-center py-10 text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
                No open loads right now.
              </div>
            )}
            {loads.map((l) => (
              <SwipeableRunCard
                key={l.id}
                id={l.id}
                onAccept={() => setBiddingOn(l.id)}
                onSkip={handleSkip}
                acceptLabel="Bid"
                skipLabel="Pass"
                className="bg-[#121214] rounded-2xl border border-white/10"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-emerald-400 font-bold">{l.id.substring(0, 8)}</span>
                    <span className="text-xs font-bold uppercase tracking-wider bg-white/5 text-slate-300 px-2 py-1 rounded">
                      {l.equipment_type?.[0] ?? "High Pole"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm mb-4 bg-black/20 p-3 rounded-lg border border-white/5">
                    <span className="font-medium text-slate-200">{l.origin_city}, {l.origin_state}</span>
                    <span className="text-slate-600">→</span>
                    <span className="font-medium text-slate-200">{l.destination_city}, {l.destination_state}</span>
                  </div>
                  {biddingOn === l.id && (
                    <div className="flex flex-col space-y-3">
                      <input
                        id={`bid-mobile-${l.id}`}
                        type="number"
                        placeholder="Enter Quote ($)"
                        className="bg-[#0a0a0a] text-white px-4 py-3 rounded-xl text-lg w-full outline-none border border-amber-500/50"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        min="50"
                      />
                      <div className="flex space-x-3">
                        <Button aria-label="Submit bid" className="flex-1 py-6 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl" disabled={isProcessing} onClick={() => handleSubmitBid(l.id)}>
                          Submit Bid
                        </Button>
                        <Button aria-label="Cancel bid" variant="ghost" className="py-6 px-4 bg-white/5 text-slate-400 hover:text-white rounded-xl" onClick={() => setBiddingOn(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              </SwipeableRunCard>
            ))}
          </div>
        </>
      )}

      {/* ── Report Card Tab ── */}
      {activeTab === 'report_card' && (
        <div className="space-y-4">
          {/* Period selector */}
          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
            {([30, 90, 180, 365] as const).map(p => (
              <button key={p} onClick={() => setCardPeriod(p)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  cardPeriod === p ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-slate-300'
                }`}>
                {p === 365 ? '1 Year' : `${p}d`}
              </button>
            ))}
          </div>

          {!trustProfile ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center">
              <p className="text-2xl mb-2">📊</p>
              <p className="font-bold text-slate-300 mb-1">No report card yet</p>
              <p className="text-sm text-slate-500">Complete verified jobs to build your performance record.</p>
            </div>
          ) : (() => {
            const j = trustProfile[`jobs_${cardPeriod}d` as keyof TrustProfile] as number | undefined;
            const km = trustProfile[`km_${cardPeriod}d` as keyof TrustProfile] as number | undefined;
            const rating = trustProfile[`avg_rating_${cardPeriod}d` as keyof TrustProfile] as number | undefined;
            const reviews = trustProfile[`reviews_${cardPeriod}d` as keyof TrustProfile] as number | undefined;
            const resp = trustProfile[`avg_response_min_${cardPeriod}d` as keyof TrustProfile] as number | undefined;
            return (
              <div className="space-y-4">
                {/* KPI grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Jobs Completed', val: j != null ? j.toLocaleString() : '—', color: 'text-emerald-400', icon: '✅' },
                    { label: 'Km Covered', val: km != null ? `${(km / 1000).toFixed(1)}K` : '—', color: 'text-blue-400', icon: '🛣️' },
                    { label: 'Avg Rating', val: rating != null ? `${rating.toFixed(2)}★` : '—', color: 'text-amber-400', icon: '⭐' },
                    { label: 'Avg Response', val: resp != null ? `${resp}m` : '—', color: 'text-purple-400', icon: '⚡' },
                  ].map(k => (
                    <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <div className="text-lg mb-1">{k.icon}</div>
                      <p className={`text-2xl font-black ${k.color}`}>{k.val}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">{k.label}</p>
                    </div>
                  ))}
                </div>

                {/* Trust badges */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Verification Status</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Identity', ok: trustProfile.identity_verified },
                      { label: 'Insurance', ok: trustProfile.insurance_verified },
                      { label: 'License', ok: trustProfile.license_verified },
                      { label: 'Background', ok: trustProfile.background_checked },
                      { label: 'Profile Claimed', ok: trustProfile.claimed },
                    ].map(b => (
                      <span key={b.label} className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                        b.ok
                          ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}>
                        {b.ok ? '✓' : '○'} {b.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* All-time totals */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">All-Time Network Record</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xl font-black text-white">{trustProfile.verified_jobs_count ?? '—'}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Verified Jobs</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-white">
                        {trustProfile.verified_km_total ? `${(trustProfile.verified_km_total / 1000).toFixed(0)}K km` : '—'}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Distance</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-white">
                        {trustProfile.review_avg ? `${trustProfile.review_avg.toFixed(2)}★` : '—'}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Avg Rating ({trustProfile.review_count ?? 0} reviews)
                      </p>
                    </div>
                  </div>
                  {trustProfile.period_stats_refreshed_at && (
                    <p className="text-[10px] text-slate-600 mt-4">
                      Period stats refreshed: {new Date(trustProfile.period_stats_refreshed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* CTA if not fully verified */}
                {(!trustProfile.identity_verified || !trustProfile.claimed) && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-amber-400">Boost your trust score</p>
                      <p className="text-xs text-slate-400 mt-0.5">Verify identity and claim your profile to unlock higher rankings.</p>
                    </div>
                    <a href="/claim" className="shrink-0 px-4 py-2 bg-amber-500 text-black text-xs font-black rounded-lg hover:bg-amber-400 transition-colors">
                      Verify Now →
                    </a>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Earnings Tab ── */}
      {activeTab === 'earnings' && (
        <Card>
          {recentEarnings.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-slate-400">No earnings recorded yet</p>
              <p className="text-sm mt-1">Earnings appear here after jobs are completed and settled.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEarnings.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-slate-400 font-mono">
                      {e.earned_at ? new Date(e.earned_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-300">{e.description ?? 'Job completion'}</TableCell>
                    <TableCell className="font-bold text-white">${e.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${
                        e.status === 'paid'
                          ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                          : 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                      }`}>
                        {e.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
