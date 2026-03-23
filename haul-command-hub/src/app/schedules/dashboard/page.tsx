'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

/* ══════════════════════════════════════════════════════
   STANDING ORDERS — Broker Dashboard
   ══════════════════════════════════════════════════════ */

interface Occurrence {
  id: string;
  scheduled_date: string;
  status: string;
  operator_id: string | null;
  escrow_amount: number;
  operator_payout: number;
  compliance_flags: Array<{ flag: string; severity: string }>;
}

interface Schedule {
  id: string;
  title: string;
  origin_jurisdiction: string;
  destination_jurisdiction: string;
  rate_per_occurrence: number;
  frequency: string;
  total_occurrences: number;
  completed_occurrences: number;
  status: string;
  escrow_balance: number;
  next_dispatch_date: string | null;
  occurrences: Occurrence[];
  stats: Record<string, number>;
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  pending_funding: 'bg-yellow-500/20 text-yellow-400',
  paused: 'bg-orange-500/20 text-orange-400',
  completed: 'bg-blue-500/20 text-blue-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

const OCC_COLOR: Record<string, string> = {
  scheduled: 'bg-gray-500/30', dispatched: 'bg-blue-500/30',
  accepted: 'bg-blue-500/50', in_progress: 'bg-yellow-500/30',
  completed: 'bg-green-500/30', cancelled: 'bg-red-500/30',
  no_show: 'bg-red-500/50', compliance_hold: 'bg-orange-500/30',
};

const DEMO: Schedule[] = [{
  id: 'demo-1', title: 'I-10 Houston Wind Blade Run',
  origin_jurisdiction: 'US-TX', destination_jurisdiction: 'US-NM',
  rate_per_occurrence: 420, frequency: 'weekly',
  total_occurrences: 12, completed_occurrences: 3,
  status: 'active', escrow_balance: 3780,
  next_dispatch_date: '2026-03-25',
  occurrences: Array.from({ length: 12 }, (_, i) => ({
    id: `o-${i}`, scheduled_date: `2026-${String(3 + Math.floor((4 + i * 7) / 28)).padStart(2, '0')}-${String(((4 + i * 7 - 1) % 28) + 1).padStart(2, '0')}`,
    status: i < 3 ? 'completed' : i === 3 ? 'dispatched' : 'scheduled',
    operator_id: i < 4 ? 'op-1' : null,
    escrow_amount: 441, operator_payout: 399,
    compliance_flags: i === 9 ? [{ flag: 'Holiday', severity: 'critical' }] : [],
  })),
  stats: { total: 12, completed: 3, dispatched: 1, scheduled: 8 },
}];

export default function StandingOrdersDashboard() {
  const [schedules, setSchedules] = useState<Schedule[]>(DEMO);
  const [sel, setSel] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  const fetchSchedules = useCallback(() => {
    fetch('/api/schedules/broker/demo-broker').then(r => r.json()).then(d => {
      if (d.schedules?.length) setSchedules(d.schedules);
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  async function handleMarkCompleted(occurrenceId: string) {
    setCompleting(occurrenceId);
    try {
      const res = await fetch('/api/schedules/occurrence/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occurrence_id: occurrenceId }),
      });
      if (res.ok) {
        // Refresh schedule data to reflect escrow deduction
        fetchSchedules();
        // Optimistically update local state
        setSchedules(prev => prev.map(s => ({
          ...s,
          occurrences: s.occurrences.map(o =>
            o.id === occurrenceId ? { ...o, status: 'completed' } : o
          ),
          completed_occurrences: s.occurrences.some(o => o.id === occurrenceId)
            ? s.completed_occurrences + 1 : s.completed_occurrences,
        })));
      }
    } catch { /* handled gracefully */ }
    setCompleting(null);
  }

  async function handleTopUpEscrow(scheduleId: string) {
    try {
      const res = await fetch('/api/schedules/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_id: scheduleId }),
      });
      const data = await res.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch { /* handled gracefully */ }
  }

  const active = schedules.find(s => s.id === sel) ?? schedules[0];

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
              Standing <span className="text-accent">Orders</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Pre-funded recurring escorts — automatic execution.</p>
          </div>
          <Link href="/schedules/create" className="bg-accent text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors">+ New Order</Link>
        </div>

        {/* Schedule Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {schedules.map(s => {
            const pct = s.total_occurrences ? (s.completed_occurrences / s.total_occurrences * 100) : 0;
            return (
              <button key={s.id} onClick={() => setSel(s.id)} className={`text-left bg-white/[0.02] border rounded-2xl p-5 hover:border-accent/20 transition-all ag-card-hover ${sel === s.id ? 'border-accent/40 bg-accent/[0.03]' : 'border-white/[0.06]'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-sm">{s.title}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_BADGE[s.status] ?? ''}`}>{s.status.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div className="text-gray-500 text-xs mb-3">{s.origin_jurisdiction} → {s.destination_jurisdiction} · {s.frequency}</div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div><div className="text-accent font-black text-lg">${s.rate_per_occurrence}</div><div className="text-gray-600 text-[10px]">per run</div></div>
                  <div><div className="text-white font-bold text-lg">{s.completed_occurrences}/{s.total_occurrences}</div><div className="text-gray-600 text-[10px]">done</div></div>
                  <div><div className="text-green-400 font-bold text-lg">${s.escrow_balance.toLocaleString()}</div><div className="text-gray-600 text-[10px]">escrow</div></div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5"><div className="bg-accent h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
                {s.next_dispatch_date && <div className="mt-2 text-[10px] text-gray-500">Next: <span className="text-accent">{s.next_dispatch_date}</span></div>}
              </button>
            );
          })}
        </div>

        {/* Occurrence Calendar */}
        {active && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-lg">{active.title} — Occurrences</h2>
              {active.status === 'active' && <button onClick={() => handleTopUpEscrow(active.id)} className="bg-accent/10 text-accent px-4 py-2 rounded-lg text-xs font-bold hover:bg-accent/20 transition-all">💰 Top Up Escrow</button>}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {active.occurrences.map(o => (
                <div key={o.id} className={`${OCC_COLOR[o.status] ?? 'bg-gray-500/20'} rounded-xl p-3 text-center relative group transition-all hover:scale-105`}>
                  {(o.compliance_flags?.length ?? 0) > 0 && <span className="absolute -top-1 -right-1 text-xs">⚠️</span>}
                  <div className="text-white font-bold text-xs">{o.scheduled_date.split('-').slice(1).join('/')}</div>
                  <div className="text-[10px] text-gray-400 capitalize mt-0.5">{o.status.replace('_', ' ')}</div>
                  <div className="text-accent text-[10px] font-bold">${o.operator_payout}</div>
                  {(o.status === 'in_progress' || o.status === 'dispatched' || o.status === 'accepted') && (
                    <button
                      onClick={() => handleMarkCompleted(o.id)}
                      disabled={completing === o.id}
                      className="mt-1.5 w-full bg-green-500/20 text-green-400 text-[10px] font-bold py-1 rounded-lg hover:bg-green-500/30 transition-all disabled:opacity-50"
                    >
                      {completing === o.id ? '⏳' : '✅ Complete'}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-white/[0.06]">
              {Object.entries(OCC_COLOR).map(([s, c]) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${c}`} />
                  <span className="text-gray-500 text-[10px] capitalize">{s.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
