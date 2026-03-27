'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';

/* ══════════════════════════════════════════════════════
   GLOBAL ROUTE INTELLIGENCE — /tools/regulation-alerts
   57-Country Feasibility Engine + Corridor Alerts
   ══════════════════════════════════════════════════════ */

interface CountryReg {
  country_code: string;
  country_name: string;
  max_routine_width_meters: number;
  max_routine_height_meters: number;
  max_routine_length_meters: number;
  max_routine_weight_kg: number;
  escort_required_width_meters: number;
  standard_curfews_apply: boolean;
  night_moves_allowed: boolean;
  metric_standard: boolean;
  transport_authority_notes: string;
}

interface Alert {
  id: string;
  corridorName: string;
  alertType: 'weather' | 'curfew' | 'shutdown' | 'construction' | 'dot_advisory';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  startTime: string;
  endTime: string;
  source: string;
}

type FeasibilityResult = {
  status: 'green' | 'yellow' | 'red';
  label: string;
  escortRequired: boolean;
  nightAllowed: boolean;
  curfewsApply: boolean;
  widthExceeds: boolean;
  heightExceeds: boolean;
  lengthExceeds: boolean;
  weightExceeds: boolean;
  notes: string;
};

const CORRIDORS = [
  'All Corridors',
  'I-10 Texas Triangle', 'I-95 East Coast', 'I-5 West Coast', 'I-40 Cross Country',
  'Oklahoma Wind Belt', 'Gulf Coast Industrial', 'I-20 Southern Corridor',
  'I-70 Midwest', 'I-80 Northern Route', 'I-35 Central',
];

// Meters/feet conversion
const M_TO_FT = 3.28084;
const KG_TO_LBS = 2.20462;

export default function RegulationAlertsPage() {
  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<'checker' | 'alerts'>('checker');

  // ── Feasibility Checker ──
  const [countries, setCountries] = useState<CountryReg[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadWidth, setLoadWidth] = useState(14);
  const [loadHeight, setLoadHeight] = useState(15);
  const [loadLength, setLoadLength] = useState(100);
  const [loadWeight, setLoadWeight] = useState(120000);
  const [useMetric, setUseMetric] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Alert state ──
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertLoading, setAlertLoading] = useState(false);
  const [selectedCorridor, setSelectedCorridor] = useState('All Corridors');

  // ── Fetch countries from Supabase ──
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/regulations/countries');
        const data = await res.json();
        if (data.countries?.length) {
          setCountries(data.countries);
        }
      } catch {
        // Fallback: use empty array (API will be built separately)
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Fetch alerts ──
  useEffect(() => {
    if (activeTab !== 'alerts') return;
    async function fetchAlerts() {
      setAlertLoading(true);
      try {
        const params = selectedCorridor !== 'All Corridors' ? `?corridor=${encodeURIComponent(selectedCorridor)}` : '';
        const res = await fetch(`/api/alerts/corridor${params}`);
        const data = await res.json();
        setAlerts(data.alerts || []);
      } catch {
        setAlerts([]);
      } finally {
        setAlertLoading(false);
      }
    }
    fetchAlerts();
  }, [selectedCorridor, activeTab]);

  // ── Filtered countries for search ──
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const q = searchQuery.toLowerCase();
    return countries.filter(c =>
      c.country_name.toLowerCase().includes(q) || c.country_code.toLowerCase().includes(q)
    );
  }, [countries, searchQuery]);

  const activeCountry = countries.find(c => c.country_code === selectedCountry);

  // ── Feasibility calculation ──
  const feasibility = useMemo((): FeasibilityResult | null => {
    if (!activeCountry) return null;

    // Convert inputs to meters/kg for comparison
    const widthM = useMetric ? loadWidth : loadWidth / M_TO_FT;
    const heightM = useMetric ? loadHeight : loadHeight / M_TO_FT;
    const lengthM = useMetric ? loadLength : loadLength / M_TO_FT;
    const weightKg = useMetric ? loadWeight : loadWeight / KG_TO_LBS;

    const widthExceeds = widthM > activeCountry.max_routine_width_meters;
    const heightExceeds = heightM > activeCountry.max_routine_height_meters;
    const lengthExceeds = lengthM > activeCountry.max_routine_length_meters;
    const weightExceeds = weightKg > activeCountry.max_routine_weight_kg;
    const escortRequired = widthM > activeCountry.escort_required_width_meters;

    const anyExceeds = widthExceeds || heightExceeds || lengthExceeds || weightExceeds;

    let status: 'green' | 'yellow' | 'red' = 'green';
    let label = 'ROUTINE PERMIT — Clear to Move';

    if (anyExceeds) {
      status = 'red';
      label = 'SUPERLOAD — Engineering Review Required';
    } else if (escortRequired || activeCountry.standard_curfews_apply) {
      status = 'yellow';
      label = 'ESCORT REQUIRED — Curfew Restrictions Apply';
    }

    return {
      status,
      label,
      escortRequired,
      nightAllowed: activeCountry.night_moves_allowed,
      curfewsApply: activeCountry.standard_curfews_apply,
      widthExceeds,
      heightExceeds,
      lengthExceeds,
      weightExceeds,
      notes: activeCountry.transport_authority_notes,
    };
  }, [activeCountry, loadWidth, loadHeight, loadLength, loadWeight, useMetric]);

  // ── Alert helpers ──
  function getSeverityStyle(severity: string) {
    switch (severity) {
      case 'critical': return { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', badge: 'bg-red-500 text-white', icon: '🚨' };
      case 'high': return { bg: 'bg-orange-500/10 border-orange-500/30', text: 'text-orange-400', badge: 'bg-orange-500 text-white', icon: '⚠️' };
      case 'medium': return { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500/80 text-black', icon: '⚡' };
      default: return { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500 text-white', icon: 'ℹ️' };
    }
  }

  function timeRemaining(endTime: string) {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / 3600000);
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`;
    return `${hours}h remaining`;
  }

  const statusColors: Record<string, string> = {
    green: 'from-green-500/20 to-green-500/5 border-green-500/30',
    yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30',
    red: 'from-red-500/20 to-red-500/5 border-red-500/30',
  };

  const statusTextColors: Record<string, string> = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
  };

  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/tools/escort-calculator" className="hover:text-accent">Tools</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Route Intelligence</span>
        </nav>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <span className="text-accent text-xs font-bold uppercase tracking-wider">120 countries</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter mb-3">
            Route <span className="text-accent">Intelligence</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl">
            Instant global feasibility checks, corridor alerts, and DOT compliance analysis — 
            before you dispatch.
          </p>
        </header>

        {/* ── Tab Switcher ── */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('checker')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'checker' ? 'bg-accent text-black' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            🌐 Feasibility Checker
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'alerts' ? 'bg-accent text-black' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            🚨 Corridor Alerts
          </button>
        </div>

        {/* ════════════════ FEASIBILITY CHECKER TAB ════════════════ */}
        {activeTab === 'checker' && (
          <div className="ag-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* ── Left: Input Form ── */}
              <div className="space-y-6">
                {/* Country Search & Select */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                  <h2 className="text-white font-bold text-lg mb-4">Select Country</h2>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search 120 countries..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/40 mb-3"
                  />
                  {loading ? (
                    <div className="space-y-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                      {filteredCountries.map(c => (
                        <button
                          key={c.country_code}
                          onClick={() => { setSelectedCountry(c.country_code); setSearchQuery(''); }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between ${
                            selectedCountry === c.country_code
                              ? 'bg-accent/10 text-accent border border-accent/20'
                              : 'text-gray-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="font-medium">{c.country_name}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{c.country_code}</span>
                        </button>
                      ))}
                      {filteredCountries.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">No countries found</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Dimensions Input */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-bold text-lg">Load Dimensions</h2>
                    <button
                      onClick={() => setUseMetric(!useMetric)}
                      className="bg-white/5 text-gray-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 hover:text-accent hover:border-accent/20 transition-all"
                    >
                      {useMetric ? '📐 Metric (m/kg)' : '📏 Imperial (ft/lbs)'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-500 text-xs mb-2">Width ({useMetric ? 'm' : 'ft'})</label>
                      <input type="number" step="0.5" value={loadWidth} onChange={e => setLoadWidth(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/40" />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-xs mb-2">Height ({useMetric ? 'm' : 'ft'})</label>
                      <input type="number" step="0.5" value={loadHeight} onChange={e => setLoadHeight(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/40" />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-xs mb-2">Length ({useMetric ? 'm' : 'ft'})</label>
                      <input type="number" step="1" value={loadLength} onChange={e => setLoadLength(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/40" />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-xs mb-2">Weight ({useMetric ? 'kg' : 'lbs'})</label>
                      <input type="number" step="1000" value={loadWeight} onChange={e => setLoadWeight(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/40" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Right: Results ── */}
              <div>
                {!activeCountry ? (
                  <div className="h-full border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-12 text-center opacity-40">
                    <div className="text-6xl mb-6">🛰️</div>
                    <p className="font-bold uppercase tracking-widest text-sm mb-2">Select a Country</p>
                    <p className="text-xs text-gray-500">Choose a country to calculate feasibility</p>
                  </div>
                ) : feasibility ? (
                  <div className="space-y-4 ag-slide-up">
                    {/* Status Card */}
                    <div className={`bg-gradient-to-br ${statusColors[feasibility.status]} border rounded-2xl p-6 relative overflow-hidden`}>
                      <div className={`absolute top-0 right-0 w-32 h-32 opacity-20 rounded-full blur-3xl ${
                        feasibility.status === 'green' ? 'bg-green-500' : feasibility.status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div className="relative z-10">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Feasibility Result</div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`text-4xl font-black ${statusTextColors[feasibility.status]}`}>
                            {feasibility.status === 'green' ? '✅' : feasibility.status === 'yellow' ? '⚠️' : '🚫'}
                          </span>
                          <div>
                            <div className={`font-black text-lg ${statusTextColors[feasibility.status]}`}>
                              {feasibility.label}
                            </div>
                            <div className="text-gray-400 text-sm">{activeCountry.country_name}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dimension Comparison Table */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                      <h3 className="text-white font-bold text-sm mb-4">Dimension Analysis</h3>
                      <div className="space-y-3">
                        {[
                          { dim: 'Width', yours: useMetric ? loadWidth : loadWidth, limit: useMetric ? activeCountry.max_routine_width_meters : activeCountry.max_routine_width_meters * M_TO_FT, unit: useMetric ? 'm' : 'ft', exceeds: feasibility.widthExceeds },
                          { dim: 'Height', yours: useMetric ? loadHeight : loadHeight, limit: useMetric ? activeCountry.max_routine_height_meters : activeCountry.max_routine_height_meters * M_TO_FT, unit: useMetric ? 'm' : 'ft', exceeds: feasibility.heightExceeds },
                          { dim: 'Length', yours: useMetric ? loadLength : loadLength, limit: useMetric ? activeCountry.max_routine_length_meters : activeCountry.max_routine_length_meters * M_TO_FT, unit: useMetric ? 'm' : 'ft', exceeds: feasibility.lengthExceeds },
                          { dim: 'Weight', yours: useMetric ? loadWeight : loadWeight, limit: useMetric ? activeCountry.max_routine_weight_kg : activeCountry.max_routine_weight_kg * KG_TO_LBS, unit: useMetric ? 'kg' : 'lbs', exceeds: feasibility.weightExceeds },
                        ].map(row => (
                          <div key={row.dim} className={`flex items-center justify-between p-3 rounded-xl ${row.exceeds ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/5 border border-green-500/10'}`}>
                            <span className="text-gray-300 text-sm font-medium">{row.dim}</span>
                            <div className="flex items-center gap-4 text-sm tabular-nums">
                              <span className="text-white font-bold">{row.yours.toLocaleString()} {row.unit}</span>
                              <span className="text-gray-600">vs</span>
                              <span className={row.exceeds ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                                {Math.round(row.limit).toLocaleString()} {row.unit}
                              </span>
                              <span className="text-lg">{row.exceeds ? '❌' : '✅'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Restrictions Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className={`p-4 rounded-xl text-center ${feasibility.escortRequired ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-green-500/5 border border-green-500/10'}`}>
                        <div className="text-2xl mb-1">{feasibility.escortRequired ? '🚗' : '✅'}</div>
                        <div className="text-xs font-bold text-white">Escort</div>
                        <div className={`text-[10px] ${feasibility.escortRequired ? 'text-yellow-400' : 'text-green-400'}`}>
                          {feasibility.escortRequired ? 'REQUIRED' : 'Not Required'}
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl text-center ${feasibility.nightAllowed ? 'bg-green-500/5 border border-green-500/10' : 'bg-red-500/10 border border-red-500/20'}`}>
                        <div className="text-2xl mb-1">{feasibility.nightAllowed ? '🌙' : '🚫'}</div>
                        <div className="text-xs font-bold text-white">Night Move</div>
                        <div className={`text-[10px] ${feasibility.nightAllowed ? 'text-green-400' : 'text-red-400'}`}>
                          {feasibility.nightAllowed ? 'ALLOWED' : 'PROHIBITED'}
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl text-center ${feasibility.curfewsApply ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-green-500/5 border border-green-500/10'}`}>
                        <div className="text-2xl mb-1">{feasibility.curfewsApply ? '⏰' : '✅'}</div>
                        <div className="text-xs font-bold text-white">Curfews</div>
                        <div className={`text-[10px] ${feasibility.curfewsApply ? 'text-orange-400' : 'text-green-400'}`}>
                          {feasibility.curfewsApply ? 'APPLY' : 'None Standard'}
                        </div>
                      </div>
                    </div>

                    {/* Authority Notes */}
                    {feasibility.notes && (
                      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                        <h3 className="text-accent font-bold text-xs mb-1">📋 Authority Notes</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{feasibility.notes}</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ CORRIDOR ALERTS TAB ════════════════ */}
        {activeTab === 'alerts' && (
          <div className="ag-slide-up">
            {/* Corridor Filter */}
            <div className="flex flex-wrap gap-2 mb-8">
              {CORRIDORS.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCorridor(c)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    selectedCorridor === c
                      ? 'bg-accent text-black'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10 hover:border-accent/30'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Alerts List */}
            {alertLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 animate-pulse">
                    <div className="h-4 bg-white/5 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-white/5 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-green-400 font-bold text-lg mb-2">All Clear</h3>
                <p className="text-gray-400 text-sm">No active alerts for {selectedCorridor === 'All Corridors' ? 'any corridor' : selectedCorridor}. Conditions are favorable for movement.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map(alert => {
                  const style = getSeverityStyle(alert.severity);
                  return (
                    <div key={alert.id} className={`rounded-2xl border p-6 ${style.bg} transition-all hover:scale-[1.005]`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${style.badge} uppercase tracking-wider`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-gray-500">{alert.corridorName}</span>
                        </div>
                        <span className="text-xs text-gray-500 tabular-nums">{timeRemaining(alert.endTime)}</span>
                      </div>
                      <h3 className={`font-bold text-lg mb-2 ${style.text}`}>
                        {style.icon} {alert.title}
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed">{alert.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Subscribe CTA */}
        <div className="mt-12 bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-8 text-center">
          <h2 className="text-white font-bold text-2xl mb-3">Get Alerts Before Your Run</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
            Subscribe to corridor-specific alerts and get notified via push notification
            when weather, curfews, or shutdowns affect your route.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
            />
            <button className="bg-accent text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors whitespace-nowrap">
              Subscribe — $9/mo
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
