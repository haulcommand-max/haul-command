'use client';

import { useState, useEffect } from 'react';

interface DayEntry {
  available_date: string;
  status: 'available' | 'unavailable' | 'booked' | 'tentative';
  notes?: string;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  available: { bg: 'rgba(0,255,136,0.15)', border: '#00ff88', text: '#00ff88' },
  unavailable: { bg: 'rgba(255,59,48,0.15)', border: '#ff3b30', text: '#ff3b30' },
  booked: { bg: 'rgba(0,212,255,0.15)', border: '#00d4ff', text: '#00d4ff' },
  tentative: { bg: 'rgba(255,200,0,0.15)', border: '#ffc800', text: '#ffc800' },
};

export function AvailabilityCalendar({ operatorId, editable = false }: { operatorId?: string; editable?: boolean }) {
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d;
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  });

  useEffect(() => {
    const start = days[0].toISOString().split('T')[0];
    const end = days[6].toISOString().split('T')[0];
    const params = new URLSearchParams({ start, end });
    if (operatorId) params.set('operator_id', operatorId);
    fetch(`/api/availability?${params}`).then(r => r.json()).then(d => setEntries(d.availability || [])).catch(() => {});
  }, [weekStart]);

  const getStatus = (date: Date): DayEntry | undefined => {
    const ds = date.toISOString().split('T')[0];
    return entries.find(e => e.available_date === ds);
  };

  const toggleDay = async (date: Date) => {
    if (!editable) return;
    const ds = date.toISOString().split('T')[0];
    const current = getStatus(date);
    const next = !current ? 'available' : current.status === 'available' ? 'unavailable' : current.status === 'unavailable' ? 'available' : current.status;
    if (current?.status === 'booked') return; // Can't toggle booked days

    await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dates: [ds], status: next }),
    });
    setEntries(prev => {
      const filtered = prev.filter(e => e.available_date !== ds);
      return [...filtered, { available_date: ds, status: next as any }];
    });
  };

  const prevWeek = () => setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; });
  const nextWeek = () => setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button aria-label="Interactive Button" onClick={prevWeek} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 13 }}>←</button>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
          {days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <button aria-label="Interactive Button" onClick={nextWeek} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 13 }}>→</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {dayNames.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', padding: '4px 0', textTransform: 'uppercase' }}>{d}</div>
        ))}
        {days.map((day, i) => {
          const entry = getStatus(day);
          const sc = entry ? STATUS_COLORS[entry.status] : { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.3)' };
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <button aria-label="Interactive Button" key={i} onClick={() => toggleDay(day)} style={{ padding: '12px 4px', borderRadius: 8, background: sc.bg, border: `1px solid ${isToday ? '#fff' : sc.border}`, color: sc.text, cursor: editable && entry?.status !== 'booked' ? 'pointer' : 'default', textAlign: 'center', fontSize: 13, fontWeight: 700 }}>
              {day.getDate()}
              {entry && <div style={{ fontSize: 9, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{entry.status}</div>}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 12, justifyContent: 'center' }}>
        {Object.entries(STATUS_COLORS).map(([k, v]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.text }} />{k}
          </span>
        ))}
      </div>

      {editable && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <a href="/api/availability/ical" style={{ fontSize: 12, color: '#00d4ff' }}>📅 Export to Calendar (iCal)</a>
        </div>
      )}
    </div>
  );
}
