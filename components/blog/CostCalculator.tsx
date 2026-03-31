'use client';

import { useState, useMemo } from 'react';

const ALL_STATES = [
  { code: 'AL', name: 'Alabama', level: 'not-required' as const, cost: 0 },
  { code: 'AK', name: 'Alaska', level: 'none' as const, cost: 350 },
  { code: 'AZ', name: 'Arizona', level: 'full' as const, cost: 325 },
  { code: 'AR', name: 'Arkansas', level: 'partial' as const, cost: 200 },
  { code: 'CA', name: 'California', level: 'partial' as const, cost: 495 },
  { code: 'CO', name: 'Colorado', level: 'partial' as const, cost: 350 },
  { code: 'CT', name: 'Connecticut', level: 'none' as const, cost: 300 },
  { code: 'DE', name: 'Delaware', level: 'partial' as const, cost: 225 },
  { code: 'FL', name: 'Florida', level: 'none' as const, cost: 375 },
  { code: 'GA', name: 'Georgia', level: 'none' as const, cost: 400 },
  { code: 'HI', name: 'Hawaii', level: 'none' as const, cost: 450 },
  { code: 'ID', name: 'Idaho', level: 'full' as const, cost: 200 },
  { code: 'IL', name: 'Illinois', level: 'partial' as const, cost: 275 },
  { code: 'IN', name: 'Indiana', level: 'partial' as const, cost: 250 },
  { code: 'IA', name: 'Iowa', level: 'partial' as const, cost: 200 },
  { code: 'KS', name: 'Kansas', level: 'partial' as const, cost: 225 },
  { code: 'KY', name: 'Kentucky', level: 'partial' as const, cost: 275 },
  { code: 'LA', name: 'Louisiana', level: 'partial' as const, cost: 250 },
  { code: 'ME', name: 'Maine', level: 'none' as const, cost: 300 },
  { code: 'MD', name: 'Maryland', level: 'partial' as const, cost: 275 },
  { code: 'MA', name: 'Massachusetts', level: 'none' as const, cost: 350 },
  { code: 'MI', name: 'Michigan', level: 'partial' as const, cost: 300 },
  { code: 'MN', name: 'Minnesota', level: 'partial' as const, cost: 275 },
  { code: 'MS', name: 'Mississippi', level: 'not-required' as const, cost: 0 },
  { code: 'MO', name: 'Missouri', level: 'none' as const, cost: 300 },
  { code: 'MT', name: 'Montana', level: 'full' as const, cost: 275 },
  { code: 'NE', name: 'Nebraska', level: 'not-required' as const, cost: 0 },
  { code: 'NV', name: 'Nevada', level: 'full' as const, cost: 300 },
  { code: 'NH', name: 'New Hampshire', level: 'partial' as const, cost: 250 },
  { code: 'NJ', name: 'New Jersey', level: 'none' as const, cost: 350 },
  { code: 'NM', name: 'New Mexico', level: 'partial' as const, cost: 250 },
  { code: 'NY', name: 'New York', level: 'none' as const, cost: 500 },
  { code: 'NC', name: 'North Carolina', level: 'none' as const, cost: 325 },
  { code: 'ND', name: 'North Dakota', level: 'not-required' as const, cost: 0 },
  { code: 'OH', name: 'Ohio', level: 'partial' as const, cost: 300 },
  { code: 'OK', name: 'Oklahoma', level: 'partial' as const, cost: 225 },
  { code: 'OR', name: 'Oregon', level: 'full' as const, cost: 250 },
  { code: 'PA', name: 'Pennsylvania', level: 'none' as const, cost: 425 },
  { code: 'RI', name: 'Rhode Island', level: 'none' as const, cost: 275 },
  { code: 'SC', name: 'South Carolina', level: 'not-required' as const, cost: 0 },
  { code: 'SD', name: 'South Dakota', level: 'not-required' as const, cost: 0 },
  { code: 'TN', name: 'Tennessee', level: 'none' as const, cost: 300 },
  { code: 'TX', name: 'Texas', level: 'partial' as const, cost: 400 },
  { code: 'UT', name: 'Utah', level: 'full' as const, cost: 275 },
  { code: 'VT', name: 'Vermont', level: 'partial' as const, cost: 225 },
  { code: 'VA', name: 'Virginia', level: 'none' as const, cost: 350 },
  { code: 'WA', name: 'Washington', level: 'full' as const, cost: 350 },
  { code: 'WV', name: 'West Virginia', level: 'partial' as const, cost: 250 },
  { code: 'WI', name: 'Wisconsin', level: 'partial' as const, cost: 275 },
  { code: 'WY', name: 'Wyoming', level: 'full' as const, cost: 225 },
];

const RECIPROCITY_SAVINGS: Record<string, number> = {
  full: 1.0,       // 100% savings — cert covered
  partial: 0.6,    // 60% savings — reduced fee
  none: 0,         // 0% savings — full cost
  'not-required': 1.0, // no cost
};

export default function CostCalculator() {
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());
  const [baseCert, setBaseCert] = useState<string>('OR');

  const toggleState = (code: string) => {
    setSelectedStates((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const results = useMemo(() => {
    const selectedData = ALL_STATES.filter((s) => selectedStates.has(s.code));
    const withoutReciprocity = selectedData.reduce((sum, s) => sum + s.cost, 0);
    const withReciprocity = selectedData.reduce((sum, s) => {
      const savings = RECIPROCITY_SAVINGS[s.level];
      return sum + s.cost * (1 - savings);
    }, 0);
    // Add base cert cost
    const baseCertCost = ALL_STATES.find((s) => s.code === baseCert)?.cost || 250;

    return {
      stateCount: selectedData.length,
      withoutReciprocity,
      withReciprocity: withReciprocity + baseCertCost,
      savings: withoutReciprocity - (withReciprocity + baseCertCost),
      baseCertCost,
    };
  }, [selectedStates, baseCert]);

  const levelColors = {
    full: 'text-green-400 bg-green-500/10 border-green-500/20',
    partial: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    none: 'text-red-400 bg-red-500/10 border-red-500/20',
    'not-required': 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  };

  return (
    <div className="my-10 p-6 bg-white/[0.03] border border-white/10 rounded-2xl" id="cost-calculator">
      <h3 className="text-lg font-bold text-white mb-1">
        Reciprocity Cost Calculator
      </h3>
      <p className="text-sm text-gray-500 mb-5">
        Select the states on your typical routes to see potential savings with certification reciprocity.
      </p>

      {/* Base Certification Selector */}
      <div className="mb-4">
        <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
          Base Certification State
        </label>
        <select
          value={baseCert}
          onChange={(e) => setBaseCert(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none w-full max-w-xs"
          id="base-cert-select"
        >
          {ALL_STATES
            .filter((s) => s.level === 'full')
            .map((s) => (
              <option key={s.code} value={s.code} className="bg-[#1a1a1a]">
                {s.name} (${s.cost})
              </option>
            ))}
        </select>
      </div>

      {/* State Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5 mb-6">
        {ALL_STATES.map((state) => {
          const isSelected = selectedStates.has(state.code);
          return (
            <button aria-label="Interactive Button"
              key={state.code}
              onClick={() => toggleState(state.code)}
              className={`px-1 py-2 rounded-lg text-xs font-medium transition-all duration-150 border ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-sm shadow-amber-500/10'
                  : 'bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/15 hover:text-gray-300'
              }`}
              title={`${state.name} — ${state.level === 'not-required' ? 'No cert required' : `$${state.cost}`}`}
              id={`calc-state-${state.code}`}
            >
              {state.code}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {results.stateCount > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="text-xs text-red-400 mb-1">All Individual Certs</div>
              <div className="text-2xl font-bold text-red-400">
                ${results.withoutReciprocity.toLocaleString()}
              </div>
              <div className="text-xs text-red-400/60 mt-1">
                {results.stateCount} state{results.stateCount > 1 ? 's' : ''}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="text-xs text-green-400 mb-1">With {ALL_STATES.find(s => s.code === baseCert)?.name} Base</div>
              <div className="text-2xl font-bold text-green-400">
                ${results.withReciprocity.toLocaleString()}
              </div>
              <div className="text-xs text-green-400/60 mt-1">
                Includes ${results.baseCertCost} base cert
              </div>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="text-xs text-amber-400 mb-1">Estimated Savings</div>
              <div className="text-2xl font-bold text-amber-400">
                ${Math.max(0, results.savings).toLocaleString()}
              </div>
              <div className="text-xs text-amber-400/60 mt-1">
                {results.savings > 0
                  ? `${Math.round((results.savings / results.withoutReciprocity) * 100)}% less`
                  : 'Select more states'}
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
            <h4 className="text-sm font-bold text-white mb-3">State Breakdown</h4>
            <div className="space-y-1.5">
              {ALL_STATES.filter((s) => selectedStates.has(s.code)).map((state) => (
                <div key={state.code} className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">{state.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] uppercase ${levelColors[state.level]}`}>
                      {state.level === 'not-required' ? 'No cert' : state.level}
                    </span>
                    <span className="text-gray-500 w-14 text-right">
                      {state.level === 'not-required'
                        ? 'Free'
                        : state.level === 'full'
                        ? '$0'
                        : state.level === 'partial'
                        ? `$${Math.round(state.cost * 0.4)}`
                        : `$${state.cost}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {results.stateCount === 0 && (
        <div className="text-center py-6 text-gray-600 text-sm">
          Tap the state codes above to build your route and see cost savings.
        </div>
      )}

      <p className="mt-4 text-xs text-gray-600 italic">
        Costs are estimates based on 2026 state fee schedules. Reciprocity savings assume a valid base certification.
        Contact individual state DOTs for exact current fees.
      </p>
    </div>
  );
}
