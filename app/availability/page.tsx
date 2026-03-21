'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type DayStatus = 'available' | 'unavailable' | 'booked' | null;

interface CalendarDay {
  date: string;
  dayNum: number;
  isCurrentMonth: boolean;
  status: DayStatus;
}

export default function AvailabilityCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<Record<string, DayStatus>>({});
  const [saving, setSaving] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfWeek = (y: number, m: number) => new Date(y, m, 1).getDay();

  const days: CalendarDay[] = [];
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  // Previous month padding
  const prevDays = getDaysInMonth(year, month - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i;
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    const dateStr = `${py}-${String(pm + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ date: dateStr, dayNum: d, isCurrentMonth: false, status: availability[dateStr] || null });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ date: dateStr, dayNum: d, isCurrentMonth: true, status: availability[dateStr] || null });
  }

  // Next month padding  
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    const dateStr = `${ny}-${String(nm + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ date: dateStr, dayNum: d, isCurrentMonth: false, status: availability[dateStr] || null });
  }

  const toggleDay = (dateStr: string) => {
    const current = availability[dateStr];
    const next: DayStatus = current === null || current === undefined ? 'available' : current === 'available' ? 'unavailable' : null;
    setAvailability(prev => {
      const copy = { ...prev };
      if (next === null) delete copy[dateStr];
      else copy[dateStr] = next;
      return copy;
    });
  };

  const saveAvailability = async () => {
    setSaving(true);
    const available = Object.entries(availability).filter(([, s]) => s === 'available').map(([d]) => d);
    const unavailable = Object.entries(availability).filter(([, s]) => s === 'unavailable').map(([d]) => d);

    try {
      if (available.length > 0) {
        await fetch('/api/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dates: available, status: 'available' }),
        });
      }
      if (unavailable.length > 0) {
        await fetch('/api/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dates: unavailable, status: 'unavailable' }),
        });
      }
      alert('Availability saved!');
    } catch { alert('Save failed'); }
    setSaving(false);
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const today = new Date().toISOString().split('T')[0];

  const statusColors: Record<string, { bg: string; border: string; text: string }> = {
    available: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
    unavailable: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', text: '#ef4444' },
    booked: { bg: 'rgba(198,146,58,0.15)', border: 'rgba(198,146,58,0.3)', text: '#C6923A' },
  };

  return (
    <div className="min-h-screen text-white" style={{ background: '#060b12', fontFamily: 'var(--font-body)' }}>
      <style>{`
        .cal-cell{border:1px solid rgba(255,255,255,0.04);padding:8px;min-height:64px;cursor:pointer;transition:all 0.15s;border-radius:8px;}
        .cal-cell:hover{border-color:rgba(198,146,58,0.2);background:rgba(255,255,255,0.02);}
        .cal-cell--dim{opacity:0.3;cursor:default;}
        .cal-cell--today{border-color:rgba(198,146,58,0.3) !important;}
      `}</style>

      <nav className="border-b border-white/[0.06]" style={{ background: 'rgba(11,11,12,0.85)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm font-black text-[#C6923A]">HAUL COMMAND</Link>
            <span className="text-[#5A6577] mx-1">/</span>
            <span className="text-sm font-semibold text-white">Availability</span>
          </div>
          <div className="flex gap-3">
            <a href="/api/availability/ical?user_id=me" className="text-xs font-semibold text-[#8fa3b8] hover:text-white px-3 py-2">Export iCal</a>
            <button onClick={saveAvailability} disabled={saving}
              className="text-xs font-bold px-4 py-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Legend */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: statusColors.available.bg, border: `1px solid ${statusColors.available.border}` }} />
            <span className="text-[10px] text-[#8fa3b8] font-semibold">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: statusColors.unavailable.bg, border: `1px solid ${statusColors.unavailable.border}` }} />
            <span className="text-[10px] text-[#8fa3b8] font-semibold">Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: statusColors.booked.bg, border: `1px solid ${statusColors.booked.border}` }} />
            <span className="text-[10px] text-[#8fa3b8] font-semibold">Booked</span>
          </div>
          <span className="text-[10px] text-[#5A6577]">Click a day to toggle status</span>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="text-xs font-bold text-[#8fa3b8] hover:text-white px-3 py-2">← Prev</button>
          <h2 className="text-lg font-black">{monthName}</h2>
          <button onClick={nextMonth} className="text-xs font-bold text-[#8fa3b8] hover:text-white px-3 py-2">Next →</button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-[#5A6577] uppercase py-2">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const colors = day.status ? statusColors[day.status] : null;
            return (
              <div key={i}
                onClick={() => day.isCurrentMonth && day.status !== 'booked' && toggleDay(day.date)}
                className={`cal-cell ${!day.isCurrentMonth ? 'cal-cell--dim' : ''} ${day.date === today ? 'cal-cell--today' : ''}`}
                style={colors ? { background: colors.bg, borderColor: colors.border } : {}}>
                <div className="text-xs font-bold" style={{ color: colors?.text || (day.isCurrentMonth ? '#f5f7fb' : '#5A6577') }}>{day.dayNum}</div>
                {day.status && <div className="text-[8px] font-bold mt-1" style={{ color: colors?.text }}>{day.status === 'booked' ? '🟠 Booked' : day.status === 'available' ? '✅' : '❌'}</div>}
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-[#5A6577]">When you accept a load for a date, that date is automatically marked as booked. Double-booking prevention is built in.</p>
        </div>
      </main>
    </div>
  );
}
