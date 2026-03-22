'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useState, useEffect } from 'react';

/* ══════════════════════════════════════════════════════
   CORRIDOR ALERTS — /tools/regulation-alerts
   Delay & Shutdown Prevention — pure painkiller
   ══════════════════════════════════════════════════════ */

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

const CORRIDORS = [
  'All Corridors',
  'I-10 Texas Triangle', 'I-95 East Coast', 'I-5 West Coast', 'I-40 Cross Country',
  'Oklahoma Wind Belt', 'Gulf Coast Industrial', 'I-20 Southern Corridor',
  'I-70 Midwest', 'I-80 Northern Route', 'I-35 Central',
];

export default function CorridorAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCorridor, setSelectedCorridor] = useState('All Corridors');

  useEffect(() => {
    fetchAlerts();
  }, [selectedCorridor]);

  async function fetchAlerts() {
    setLoading(true);
    try {
      const params = selectedCorridor !== 'All Corridors' ? `?corridor=${encodeURIComponent(selectedCorridor)}` : '';
      const res = await fetch(`/api/alerts/corridor${params}`);
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }

  function getSeverityStyle(severity: string) {
    switch (severity) {
      case 'critical': return { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', badge: 'bg-red-500 text-white', icon: '🚨' };
      case 'high': return { bg: 'bg-orange-500/10 border-orange-500/30', text: 'text-orange-400', badge: 'bg-orange-500 text-white', icon: '⚠️' };
      case 'medium': return { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500/80 text-black', icon: '⚡' };
      default: return { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500 text-white', icon: 'ℹ️' };
    }
  }

  function getAlertTypeLabel(type: string) {
    switch (type) {
      case 'weather': return '🌧️ Weather';
      case 'curfew': return '🕐 Curfew';
      case 'shutdown': return '🚫 Shutdown';
      case 'construction': return '🏗️ Construction';
      case 'dot_advisory': return '📋 DOT Advisory';
      default: return '📋 Alert';
    }
  }

  function timeRemaining(endTime: string) {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / 3600000);
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`;
    return `${hours}h remaining`;
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/tools/escort-calculator" className="hover:text-accent">Tools</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Corridor Alerts</span>
        </nav>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Live Alerts</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter mb-3">
            Corridor <span className="text-accent">Alerts</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl">
            Weather delays, DOT shutdowns, weekend curfews, and construction restrictions — 
            before they cost you a day of revenue.
          </p>
        </header>

        {/* Corridor Filter Tabs */}
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
        {loading ? (
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
                      <span className="text-xs text-gray-500">{getAlertTypeLabel(alert.alertType)}</span>
                      <span className="text-xs text-gray-600">•</span>
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
