'use client';

import { useState, useRef, useEffect } from 'react';

interface EnhancedLoad {
  title?: string;
  full_description?: string;
  required_certifications?: string[];
  escort_count_min?: number;
  escort_count_max?: number;
  special_requirements?: string[];
  permit_required?: boolean;
  permit_states?: string[];
  estimated_duration_hrs?: number;
  load_category?: string;
  curfew_risk?: string;
}

interface LoadEnhanceWidgetProps {
  onEnhanced?: (data: EnhancedLoad) => void;
}

/**
 * AI Load Enhancement Widget
 * Drops into any load posting form.
 * As the broker types, Gemini auto-fills certifications, escort count, requirements.
 */
export default function LoadEnhanceWidget({ onEnhanced }: LoadEnhanceWidgetProps) {
  const [description, setDescription] = useState('');
  const [enhanced, setEnhanced] = useState<EnhancedLoad | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-enhance as user types (debounced 1.5s)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (description.length < 20) { setEnhanced(null); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/content/load-enhance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description }),
        });
        const data = await res.json();
        if (!data.error) {
          setEnhanced(data);
          onEnhanced?.(data);
        }
      } catch {}
      setLoading(false);
    }, 1500);
  }, [description]);

  const RISK_COLORS: Record<string, string> = {
    low: 'text-green-400',
    medium: 'text-amber-400',
    high: 'text-red-400',
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Load Description
          <span className="ml-2 text-xs text-blue-400">👁️ AI powered</span>
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. 14ft wide transformer, Dallas TX to Abilene TX, overweight at 220k lbs"
          className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm p-3 focus:outline-none focus:border-amber-500/40 resize-none"
          rows={3}
        />
        {loading && (
          <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
            <span className="animate-spin w-2 h-2 border border-blue-400 border-t-transparent rounded-full inline-block" />
            Gemini is analyzing your load...
          </p>
        )}
      </div>

      {enhanced && !loading && (
        <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3">
          <p className="text-xs text-blue-400 font-medium">👁️ Auto-filled by Gemini</p>

          {enhanced.title && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Suggested title</p>
              <p className="text-sm font-medium text-white">{enhanced.title}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {(enhanced.escort_count_min !== undefined) && (
              <div className="p-2 bg-white/5 rounded-lg">
                <p className="text-xs text-gray-500">Escorts needed</p>
                <p className="font-bold text-white">
                  {enhanced.escort_count_min === enhanced.escort_count_max
                    ? enhanced.escort_count_min
                    : `${enhanced.escort_count_min}–${enhanced.escort_count_max}`
                  }
                </p>
              </div>
            )}
            {enhanced.load_category && (
              <div className="p-2 bg-white/5 rounded-lg">
                <p className="text-xs text-gray-500">Category</p>
                <p className="font-bold text-white capitalize">{enhanced.load_category}</p>
              </div>
            )}
            {enhanced.estimated_duration_hrs && (
              <div className="p-2 bg-white/5 rounded-lg">
                <p className="text-xs text-gray-500">Est. duration</p>
                <p className="font-bold text-white">{enhanced.estimated_duration_hrs}h</p>
              </div>
            )}
            {enhanced.curfew_risk && (
              <div className="p-2 bg-white/5 rounded-lg">
                <p className="text-xs text-gray-500">Curfew risk</p>
                <p className={`font-bold capitalize ${RISK_COLORS[enhanced.curfew_risk] ?? 'text-white'}`}>
                  {enhanced.curfew_risk}
                </p>
              </div>
            )}
          </div>

          {enhanced.required_certifications?.length ? (
            <div>
              <p className="text-xs text-gray-500 mb-1">Required certifications</p>
              <div className="flex flex-wrap gap-1">
                {enhanced.required_certifications.map(c => (
                  <span key={c} className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">{c}</span>
                ))}
              </div>
            </div>
          ) : null}

          {enhanced.special_requirements?.length ? (
            <div>
              <p className="text-xs text-gray-500 mb-1">Special requirements</p>
              <div className="flex flex-wrap gap-1">
                {enhanced.special_requirements.map(r => (
                  <span key={r} className="px-2 py-0.5 bg-white/10 text-gray-300 text-xs rounded-full">{r}</span>
                ))}
              </div>
            </div>
          ) : null}

          {enhanced.permit_states?.length ? (
            <div>
              <p className="text-xs text-gray-500 mb-1">Permits likely needed in</p>
              <p className="text-xs text-amber-400">{enhanced.permit_states.join(', ')}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
