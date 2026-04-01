'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Assignment {
  id: string;
  schedule_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  escrow_amount: number;
  operator_payout: number;
  recurring_schedules: {
    title: string;
    origin_jurisdiction: string;
    destination_jurisdiction: string;
    load_type: string;
    rate_per_occurrence: number;
    frequency: string;
  };
}

interface EarningsData {
  earnedToDate: number;
  projectedEarnings: number;
  totalProjected: number;
  completedRuns: number;
  upcomingRuns: number;
}

interface Conflict {
  date: string;
  count: number;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'border-gray-500/30 bg-gray-500/5',
  dispatched: 'border-blue-500/30 bg-blue-500/5',
  accepted: 'border-blue-500/50 bg-blue-500/10',
  in_progress: 'border-yellow-500/30 bg-yellow-500/5',
  completed: 'border-green-500/30 bg-green-500/5',
  cancelled: 'border-red-500/30 bg-red-500/5',
};

const DEMO_ASSIGNMENTS: Assignment[] = Array.from({ length: 8 }, (_, i) => ({
  id: `asgn-${i}`,
  schedule_id: 'demo-1',
  scheduled_date: new Date(Date.UTC(2026, 2, 25 + i * 7)).toISOString().split('T')[0],
  scheduled_time: '06:00',
  status: i === 0 ? 'dispatched' : 'scheduled',
  escrow_amount: 441,
  operator_payout: 399,
  recurring_schedules: {
    title: 'I-10 Houston Wind Blade Run',
    origin_jurisdiction: 'US-TX',
    destination_jurisdiction: 'US-NM',
    load_type: 'wind_blade',
    rate_per_occurrence: 420,
    frequency: 'weekly',
  },
}));

export default function OperatorStandingOrders() {
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [upcoming, setUpcoming] = useState<Assignment[]>(DEMO_ASSIGNMENTS);
  const [completed, setCompleted] = useState<Assignment[]>([]);
  const [earnings, setEarnings] = useState<EarningsData>({
    earnedToDate: 1197,
    projectedEarnings: 3192,
    totalProjected: 4389,
    completedRuns: 3,
    upcomingRuns: 8,
  });
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  useEffect(() => {
    fetch('/api/schedules/operator/demo-operator')
      .then(r => r.json())
      .then(data => {
        if (data.upcoming?.length) setUpcoming(data.upcoming);
        if (data.completed?.length) setCompleted(data.completed);
        if (data.earnings) setEarnings(data.earnings);
        if (data.conflicts?.length) setConflicts(data.conflicts);
      })
      .catch(() => {});
  }, []);

  const displayList = tab === 'upcoming' ? upcoming : completed;

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">My Standing Orders</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
            My <span className="text-accent">Assignments</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Recurring loads assigned to you. Guaranteed work, guaranteed pay.</p>
        </div>

        {/* Earnings Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <div className="text-green-400 font-black text-2xl">${earnings.earnedToDate.toLocaleString()}</div>
            <div className="text-gray-500 text-[10px]">Earned To Date</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <div className="text-accent font-black text-2xl">${earnings.projectedEarnings.toLocaleString()}</div>
            <div className="text-gray-500 text-[10px]">Projected Remaining</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <div className="text-white font-bold text-2xl">{earnings.completedRuns}</div>
            <div className="text-gray-500 text-[10px]">Completed Runs</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <div className="text-white font-bold text-2xl">{earnings.upcomingRuns}</div>
            <div className="text-gray-500 text-[10px]">Upcoming Runs</div>
          </div>
        </div>

        {/* Conflicts Warning */}
        {conflicts.length > 0 && (
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-6">
            <h3 className="text-orange-400 font-bold text-xs mb-1">⚠️ Schedule Conflicts Detected</h3>
            <p className="text-gray-400 text-xs">
              You have overlapping assignments on: {conflicts.map(c => c.date).join(', ')}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 mb-6 w-fit">
          {(['upcoming', 'completed'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all capitalize ${
                tab === t ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'
              }`}
            >{t}</button>
          ))}
        </div>

        {/* Assignment List */}
        <div className="space-y-3">
          {displayList.map(asgn => {
            const info = asgn.recurring_schedules;
            const colors = STATUS_COLORS[asgn.status] ?? STATUS_COLORS.scheduled;
            const isDispatched = asgn.status === 'dispatched';

            return (
              <div key={asgn.id} className={`border rounded-xl overflow-hidden ${colors} transition-all`}>
                {/* Card content row */}
                <div className="p-4 flex items-center gap-3">
                  {/* Date block */}
                  <div className="text-center min-w-[48px] flex-shrink-0">
                    <div className="text-accent font-black text-lg leading-none">{asgn.scheduled_date.split('-')[2]}</div>
                    <div className="text-gray-500 text-[9px] mt-0.5">{new Date(asgn.scheduled_date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short' })}</div>
                  </div>
                  {/* Info */}
                  <div className="flex-grow min-w-0">
                    <h3 className="text-white font-bold text-sm truncate">{info.title}</h3>
                    <div className="text-gray-500 text-[10px] mt-0.5 truncate">{info.origin_jurisdiction} → {info.destination_jurisdiction} · {asgn.scheduled_time}</div>
                  </div>
                  {/* Payout */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-accent font-black text-lg tabular-nums">${asgn.operator_payout}</div>
                    <div className="text-gray-600 text-[9px]">payout</div>
                  </div>
                </div>
                {/* Full-width action row — never wraps */}
                {isDispatched && (
                  <div className="flex border-t border-white/[0.06]">
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-green-400 bg-green-500/5 hover:bg-green-500/10 active:bg-green-500/15 transition-colors">
                      <span>✓</span> Accept
                    </button>
                    <div className="w-px bg-white/[0.06]" />
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors">
                      <span>✕</span> Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {displayList.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <span className="text-4xl block mb-3">📋</span>
              <p className="text-sm">No {tab} assignments yet.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
