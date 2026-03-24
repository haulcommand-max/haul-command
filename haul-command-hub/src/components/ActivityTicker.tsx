'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ActivityEvent {
  id: string;
  text: string;
  icon: string;
  timestamp: string;
}

// Static seed events to always show something alive
const SEED_EVENTS: ActivityEvent[] = [
  { id: 'seed-1', text: 'New operator claimed in Texas', icon: '🏷️', timestamp: '2m ago' },
  { id: 'seed-2', text: 'Load posted: I-10 FL → TX', icon: '📦', timestamp: '5m ago' },
  { id: 'seed-3', text: 'Escort accepted on I-35 corridor', icon: '✅', timestamp: '8m ago' },
  { id: 'seed-4', text: 'Rate advisory updated for California', icon: '💰', timestamp: '12m ago' },
  { id: 'seed-5', text: 'Superload scored in Pennsylvania', icon: '🌡️', timestamp: '15m ago' },
  { id: 'seed-6', text: 'New pilot car listing in Ohio', icon: '🚗', timestamp: '18m ago' },
  { id: 'seed-7', text: 'Corridor demand spike: I-95', icon: '📊', timestamp: '22m ago' },
  { id: 'seed-8', text: 'Width escort triggered: 14\' load', icon: '🚨', timestamp: '25m ago' },
];

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.round((now - then) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

export default function ActivityTicker() {
  const [events, setEvents] = useState<ActivityEvent[]>(SEED_EVENTS);
  const [scrollPos, setScrollPos] = useState(0);

  const loadLiveEvents = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('activity_events')
        .select('id, event_type, payload, created_at')
        .order('created_at', { ascending: false })
        .limit(12);

      if (data && data.length > 0) {
        const live: ActivityEvent[] = data.map((e) => {
          const p = (e.payload as Record<string, string>) ?? {};
          const iconMap: Record<string, string> = {
            claim: '🏷️',
            load_posted: '📦',
            load_accepted: '✅',
            escort_matched: '🚗',
            rate_update: '💰',
            corridor_alert: '📊',
          };
          return {
            id: e.id,
            text: p.summary || p.description || `${e.event_type} event`,
            icon: iconMap[e.event_type] || '⚡',
            timestamp: timeAgo(e.created_at),
          };
        });
        setEvents(live);
      }
    } catch {
      // Keep seed events on failure — never empty
    }
  }, []);

  useEffect(() => {
    loadLiveEvents();
    const interval = setInterval(loadLiveEvents, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, [loadLiveEvents]);

  // Auto-scroll animation
  useEffect(() => {
    const interval = setInterval(() => {
      setScrollPos((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const visibleIndex = scrollPos % events.length;
  const current = events[visibleIndex];
  const next = events[(visibleIndex + 1) % events.length];

  return (
    <div className="w-full bg-white/[0.02] border-y border-white/[0.06] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider hidden sm:inline">Live</span>
        </div>

        {/* Scrolling events */}
        <div className="flex-1 min-w-0 relative h-5 overflow-hidden">
          <div
            key={current.id}
            className="absolute inset-0 flex items-center gap-2 animate-[tickerSlide_0.4s_ease-out]"
          >
            <span className="text-sm flex-shrink-0">{current.icon}</span>
            <span className="text-xs text-gray-400 truncate">{current.text}</span>
            <span className="text-[10px] text-gray-600 flex-shrink-0">{current.timestamp}</span>
          </div>
        </div>

        {/* Upcoming preview */}
        <div className="hidden md:flex items-center gap-2 text-gray-600 flex-shrink-0">
          <span className="text-[10px]">Next:</span>
          <span className="text-xs truncate max-w-32">{next.text}</span>
        </div>
      </div>
    </div>
  );
}
