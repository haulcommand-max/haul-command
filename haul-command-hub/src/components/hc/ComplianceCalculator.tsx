'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface RegulationData {
  admin1_code: string;
  admin1_name: string;
  max_length_ft: number | null;
  max_width_ft: number | null;
  max_height_ft: number | null;
  max_weight_lbs: number | null;
}

interface ComplianceResult {
  dimension: string;
  label: string;
  userValue: number;
  legalLimit: number | null;
  unit: string;
  status: 'legal' | 'oversize' | 'superload' | 'unknown';
  overage: number | null;
}

const STATUS_STYLES = {
  legal: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', badge: '✓ LEGAL', glow: 'shadow-green-500/5' },
  oversize: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', badge: '⚠ OVERSIZE', glow: 'shadow-amber-500/5' },
  superload: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', badge: '🚨 SUPERLOAD', glow: 'shadow-red-500/5' },
  unknown: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-gray-400', badge: '— NO DATA', glow: '' },
};

export default function ComplianceCalculator({ stateCode, stateName, countryCode = 'US' }: {
  stateCode: string;
  stateName: string;
  countryCode?: string;
}) {
  const [regulation, setRegulation] = useState<RegulationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [width, setWidth] = useState(8.5);
  const [height, setHeight] = useState(13.5);
  const [length, setLength] = useState(65);
  const [weight, setWeight] = useState(80000);
  const [results, setResults] = useState<ComplianceResult[]>([]);
  const [calculated, setCalculated] = useState(false);

  useEffect(() => {
    async function loadRegulation() {
      setLoading(true);
      const { data, error } = await supabase
        .from('hc_jurisdiction_regulations')
        .select('admin1_code, admin1_name, max_length_ft, max_width_ft, max_height_ft, max_weight_lbs')
        .eq('country_code', countryCode.toUpperCase())
        .eq('admin1_code', stateCode.toUpperCase())
        .single();

      if (!error && data) {
        setRegulation(data);
      }
      setLoading(false);
    }
    loadRegulation();
  }, [stateCode, countryCode]);

  function calculate() {
    if (!regulation) return;
    const checks: ComplianceResult[] = [
      {
        dimension: 'width',
        label: 'Width',
        userValue: width,
        legalLimit: regulation.max_width_ft,
        unit: 'ft',
        status: regulation.max_width_ft
          ? width <= regulation.max_width_ft ? 'legal' : width > regulation.max_width_ft * 1.5 ? 'superload' : 'oversize'
          : 'unknown',
        overage: regulation.max_width_ft ? Math.max(0, width - regulation.max_width_ft) : null,
      },
      {
        dimension: 'height',
        label: 'Height',
        userValue: height,
        legalLimit: regulation.max_height_ft,
        unit: 'ft',
        status: regulation.max_height_ft
          ? height <= regulation.max_height_ft ? 'legal' : height > regulation.max_height_ft * 1.15 ? 'superload' : 'oversize'
          : 'unknown',
        overage: regulation.max_height_ft ? Math.max(0, height - regulation.max_height_ft) : null,
      },
      {
        dimension: 'length',
        label: 'Length',
        userValue: length,
        legalLimit: regulation.max_length_ft,
        unit: 'ft',
        status: regulation.max_length_ft
          ? length <= regulation.max_length_ft ? 'legal' : length > regulation.max_length_ft * 1.5 ? 'superload' : 'oversize'
          : 'unknown',
        overage: regulation.max_length_ft ? Math.max(0, length - regulation.max_length_ft) : null,
      },
      {
        dimension: 'weight',
        label: 'Weight',
        userValue: weight,
        legalLimit: regulation.max_weight_lbs,
        unit: 'lbs',
        status: regulation.max_weight_lbs
          ? weight <= regulation.max_weight_lbs ? 'legal' : weight > regulation.max_weight_lbs * 1.5 ? 'superload' : 'oversize'
          : 'unknown',
        overage: regulation.max_weight_lbs ? Math.max(0, weight - regulation.max_weight_lbs) : null,
      },
    ];
    setResults(checks);
    setCalculated(true);
  }

  const worstStatus = results.reduce<'legal' | 'oversize' | 'superload' | 'unknown'>((worst, r) => {
    const rank = { unknown: 0, legal: 1, oversize: 2, superload: 3 };
    return rank[r.status] > rank[worst] ? r.status : worst;
  }, 'legal');

  if (loading) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 animate-pulse">
        <div className="h-6 bg-white/5 rounded w-48 mb-4" />
        <div className="h-32 bg-white/5 rounded" />
      </div>
    );
  }

  if (!regulation) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm">Regulation data for {stateName} is not yet available.</p>
        <p className="text-gray-600 text-xs mt-2">We are actively compiling this data. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <h3 className="text-white font-black text-lg tracking-tight">
            ⚖️ {stateName} Compliance Calculator
          </h3>
          <p className="text-gray-500 text-xs mt-1">
            Powered by verified {stateName} DOT regulation data • Source: WLS
          </p>
        </div>
        <span className="bg-green-500/10 border border-green-500/20 text-green-400 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
          LIVE DATA
        </span>
      </div>

      {/* Legal Limits Reference */}
      <div className="px-6 py-4 bg-white/[0.01] border-b border-white/[0.04]">
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">
          {stateName} Legal Limits
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Max Width', value: regulation.max_width_ft, unit: "'" },
            { label: 'Max Height', value: regulation.max_height_ft, unit: "'" },
            { label: 'Max Length', value: regulation.max_length_ft, unit: "'" },
            { label: 'Max Weight', value: regulation.max_weight_lbs, unit: ' lbs' },
          ].map(lim => (
            <div key={lim.label} className="bg-white/[0.03] rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{lim.label}</p>
              <p className="text-white font-black text-lg mt-1">
                {lim.value ? `${lim.value.toLocaleString()}${lim.unit}` : '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <div className="px-6 py-5 space-y-4">
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
          Enter Your Load Dimensions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Width (ft)</label>
            <input
              type="number"
              step="0.5"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent/50 tabular-nums"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Height (ft)</label>
            <input
              type="number"
              step="0.5"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent/50 tabular-nums"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Length (ft)</label>
            <input
              type="number"
              step="1"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent/50 tabular-nums"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Weight (lbs)</label>
            <input
              type="number"
              step="5000"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent/50 tabular-nums"
            />
          </div>
        </div>

        <button
          onClick={calculate}
          className="w-full bg-accent text-black py-3 rounded-xl font-black text-sm hover:bg-yellow-500 transition-all"
        >
          CHECK COMPLIANCE
        </button>
      </div>

      {/* Results */}
      {calculated && results.length > 0 && (
        <div className="px-6 py-5 border-t border-white/[0.06] space-y-4">
          {/* Overall Verdict */}
          <div className={`${STATUS_STYLES[worstStatus].bg} ${STATUS_STYLES[worstStatus].border} border rounded-xl p-4 text-center ${STATUS_STYLES[worstStatus].glow} shadow-lg`}>
            <p className={`text-2xl font-black ${STATUS_STYLES[worstStatus].text}`}>
              {STATUS_STYLES[worstStatus].badge}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {worstStatus === 'legal' && `Your load is within all ${stateName} legal limits. No permit required.`}
              {worstStatus === 'oversize' && `Your load exceeds ${stateName} legal limits. An oversize permit is required.`}
              {worstStatus === 'superload' && `Your load far exceeds ${stateName} limits. Superload permit, escorts, and route survey likely required.`}
              {worstStatus === 'unknown' && `Some dimension data is unavailable for ${stateName}. Verify with state DOT.`}
            </p>
          </div>

          {/* Per-Dimension Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results.map(r => {
              const style = STATUS_STYLES[r.status];
              return (
                <div key={r.dimension} className={`${style.bg} ${style.border} border rounded-xl p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-xs font-bold uppercase">{r.label}</span>
                    <span className={`${style.text} text-[10px] font-black px-2 py-0.5 rounded-full ${style.bg}`}>
                      {style.badge}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-white font-black text-2xl tabular-nums">
                      {r.unit === 'lbs' ? r.userValue.toLocaleString() : r.userValue}
                    </span>
                    <span className="text-gray-500 text-sm mb-0.5">{r.unit}</span>
                  </div>
                  {r.legalLimit && (
                    <p className="text-gray-500 text-[11px] mt-1">
                      Limit: {r.unit === 'lbs' ? r.legalLimit.toLocaleString() : r.legalLimit}{r.unit === 'lbs' ? ' lbs' : "'"}
                      {r.overage && r.overage > 0 && (
                        <span className={`${style.text} ml-1`}>
                          (+{r.unit === 'lbs' ? r.overage.toLocaleString() : r.overage} over)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Disclaimer */}
          <p className="text-gray-600 text-[10px] leading-relaxed">
            ⚠️ This calculator provides <strong>preliminary planning estimates</strong> based on publicly available
            regulation data sourced from WideLoadShipping.com. Always verify with the {stateName} DOT before movement.
            Permit requirements, fees, and escort rules may vary by route and load type.
          </p>
        </div>
      )}
    </div>
  );
}
