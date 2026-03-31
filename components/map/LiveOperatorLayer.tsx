'use client';

import { useEffect, useState, useCallback } from 'react';

interface LiveOperator {
  operator_id: string;
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  source: 'phone' | 'motive' | 'manual';
  updated_at: string;
  company_name?: string;
  display_name?: string;
}

type DotColor = 'green' | 'gold' | 'grey';

function getDotColor(op: LiveOperator): DotColor {
  const age = Date.now() - new Date(op.updated_at).getTime();
  if (age > 5 * 60 * 1000) return 'grey'; // >5min = offline
  if (op.speed && op.speed > 2) return 'green'; // moving
  return 'gold'; // stationary
}

const DOT_COLORS: Record<DotColor, string> = {
  green: '#10b981', gold: '#f59e0b', grey: '#6b7280',
};

export function LiveOperatorLayer({ showLiveOnly = false }: { showLiveOnly?: boolean }) {
  const [operators, setOperators] = useState<LiveOperator[]>([]);
  const [liveFilter, setLiveFilter] = useState(showLiveOnly);

  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch('/api/location/live');
      if (res.ok) {
        const data = await res.json();
        setOperators(data.operators || []);
      }
    } catch { /* offline — use cached */ }
  }, []);

  useEffect(() => {
    fetchPositions();
    const id = setInterval(fetchPositions, 15_000); // refresh every 15s
    return () => clearInterval(id);
  }, [fetchPositions]);

  const filtered = liveFilter
    ? operators.filter(op => getDotColor(op) !== 'grey')
    : operators;

  return (
    <div>
      {/* Filter toggle */}
      <div className="absolute top-4 right-4 z-10">
        <button aria-label="Interactive Button"
          onClick={() => setLiveFilter(!liveFilter)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all
            ${liveFilter
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-gray-800/80 text-gray-400 border border-gray-700'}`}
        >
          <span className={`w-2 h-2 rounded-full ${liveFilter ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
          Live GPS
        </button>
      </div>

      {/* Render dots as absolute positioned markers (for non-MapLibre fallback) */}
      {filtered.map(op => {
        const color = getDotColor(op);
        const opacity = op.accuracy && op.accuracy > 100 ? 0.5 : 1;
        return (
          <div key={op.operator_id} className="relative" title={`${op.display_name || 'Operator'} - ${op.source === 'motive' ? 'ELD GPS' : 'Phone GPS'}`}>
            <div
              className="absolute w-3 h-3 rounded-full animate-ping"
              style={{ backgroundColor: DOT_COLORS[color], opacity: opacity * 0.3 }}
            />
            <div
              className="absolute w-3 h-3 rounded-full border-2 border-gray-900"
              style={{ backgroundColor: DOT_COLORS[color], opacity }}
            />
            {op.heading != null && op.speed && op.speed > 2 && (
              <div
                className="absolute w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-l-transparent border-r-transparent"
                style={{
                  borderBottomColor: DOT_COLORS[color],
                  transform: `rotate(${op.heading}deg) translateY(-8px)`,
                }}
              />
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-gray-900/90 backdrop-blur rounded-lg p-3 text-xs space-y-1">
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Moving</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> Stationary</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-500" /> Recently offline</div>
        <div className="text-gray-500 mt-1">{filtered.length} operator{filtered.length !== 1 ? 's' : ''} visible</div>
      </div>
    </div>
  );
}
