"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import SwipeableRunCard from "@/components/mobile/SwipeableRunCard";
import AvailabilityWidget from "@/components/dispatch/AvailabilityWidget";
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

interface Job {
  id: string;
  status: string;
  origin_city?: string;
  origin_state?: string;
  destination_city?: string;
  destination_state?: string;
  load_type?: string;
  scheduled_date?: string;
  accepted_rate?: number;
  job_reference?: string;
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

interface Props {
  userId: string;
  operatorId: string | null;
  operatorProfile: OperatorProfile | null;
  hasLinkedProfile: boolean;
  claimStatus: string;
  profileCompleteness: number;
  activeJobs: Job[];
  recentEarnings: Earning[];
  totalEarnings30d: number;
  pendingPayout: number;
  availableLoads: Load[];
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
  activeJobs,
  recentEarnings,
  totalEarnings30d,
  pendingPayout,
  availableLoads,
}: Props) {
  const [loads, setLoads] = useState(availableLoads);
  const [biddingOn, setBiddingOn] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'jobs' | 'loads' | 'earnings'>('jobs');

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
            <span className="text-2xl font-black text-white">{activeJobs.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Jobs</span>
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
      <AvailabilityWidget className="mb-2" />

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {(['jobs', 'loads', 'earnings'] as const).map(tab => (
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
            {tab === 'jobs' ? `Jobs (${activeJobs.length})` : tab === 'loads' ? `Open Loads (${loads.length})` : `Earnings`}
          </button>
        ))}
      </div>

      {/* ── Jobs Tab ── */}
      {activeTab === 'jobs' && (
        <Card>
          {activeJobs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-slate-400">No active jobs</p>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs text-emerald-400">
                      {job.job_reference ?? job.id.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-300">{job.origin_city}, {job.origin_state}</span>
                        <span className="text-slate-600">→</span>
                        <span className="text-slate-300">{job.destination_city}, {job.destination_state}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">{job.load_type ?? '—'}</TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="font-bold text-white">
                      {job.accepted_rate ? `$${job.accepted_rate.toLocaleString()}` : '—'}
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${STATUS_COLORS[job.status] ?? STATUS_COLORS.pending}`}>
                        {job.status}
                      </span>
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
