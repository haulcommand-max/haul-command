'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Database, Shield, DollarSign, Activity, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function DataMonetizationPage() {
  const [optIn, setOptIn] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white">
      <Navbar />
      
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Database className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-4">
            Data <span className="text-green-500">Monetization</span>
          </h1>
          <p className="text-[#b0b0b0] text-base sm:text-lg max-w-2xl mx-auto">
            You are gathering valuable market intelligence. Opt-in to sell your anonymized trend data to fleet algorithms and autonomous vehicle developers.
          </p>
        </header>

        <div className="grid gap-6">
          {/* Main Control Panel */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Activity className="text-accent w-5 h-5" />
              Participation Status
            </h2>

            <div className="space-y-6">
              {/* Privacy Policy Check */}
              <label className="flex items-start gap-3 p-4 rounded-xl bg-black/40 border border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors">
                <input 
                  type="checkbox" 
                  checked={acceptedPolicy}
                  onChange={(e) => {
                    setAcceptedPolicy(e.target.checked);
                    if (!e.target.checked) setOptIn(false);
                  }}
                  className="mt-1 w-5 h-5 rounded border-gray-600 text-accent focus:ring-accent bg-transparent"
                />
                <div>
                  <div className="font-semibold text-white mb-1">I acknowledge the Data Privacy Policy</div>
                  <div className="text-sm text-gray-500 leading-relaxed">
                    By checking this box, I confirm that I understand only anonymized, aggregate metrics are monetized. Personally Identifiable Information (PII) is completely stripped before synthesis.
                  </div>
                </div>
              </label>

              {/* Master Switch */}
              <div className={`p-6 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 ${optIn ? 'bg-green-500/10 border-green-500/30' : 'bg-white/[0.02] border-white/[0.05]'}`}>
                <div>
                  <h3 className={`font-bold text-lg mb-1 ${optIn ? 'text-green-400' : 'text-white'}`}>
                    {optIn ? 'Currently Monetizing Data' : 'Data Sales Paused'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {optIn ? 'Your tracking data is being anonymously pooled and sold to institutional buyers.' : 'Toggle to begin selling your aggregated network intelligence.'}
                  </p>
                </div>
                
                <button
                  onClick={() => acceptedPolicy && setOptIn(!optIn)}
                  disabled={!acceptedPolicy}
                  className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${optIn ? 'bg-green-500' : 'bg-gray-700'} ${!acceptedPolicy && 'opacity-50 cursor-not-allowed'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${optIn ? 'translate-x-8' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              {!acceptedPolicy && (
                <div className="flex items-center gap-2 text-sm text-yellow-500/80 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                  <AlertCircle className="w-4 h-4" />
                  You must accept the privacy policy before opting in.
                </div>
              )}
            </div>
          </div>

          {/* Payout Dashboard Link */}
          <div className="bg-gradient-to-br from-white/[0.05] to-black border border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Payout Dashboard</h2>
              <p className="text-sm text-gray-400">Track your earnings, view institutional buyer demographics, and manage payout methods.</p>
            </div>
            
            <Link 
              href="/dashboard/earnings"
              className="w-full sm:w-auto px-6 py-3 bg-white text-black font-bold rounded-xl text-center hover:bg-gray-200 transition-colors"
            >
              View Earnings →
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600 mt-4">
            <Shield className="w-4 h-4" />
            SOC2 Compliant Data Pipeline
          </div>
        </div>
      </main>
    </div>
  );
}
