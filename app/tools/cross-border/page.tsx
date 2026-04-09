'use client';

import React, { useState } from 'react';
import { Share2, FileWarning, ShieldAlert, BadgeCheck, Globe, Truck, Map, Calculator, ArrowRight, Zap, Download } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   CROSS-BORDER COMMAND CENTER & PERMIT WIZARD
   High-fidelity interactive tool for calculating cross-jurisdictional
   compliance requirements (US-Canada, State-to-State).
   ═══════════════════════════════════════════════════════════════════ */

export default function CrossBorderCommandCenter() {
  const [origin, setOrigin] = useState('TX');
  const [destination, setDestination] = useState('AB');
  const [width, setWidth] = useState('14');
  const [height, setHeight] = useState('14.5');
  const [weight, setWeight] = useState('110000');
  const [activeTab, setActiveTab] = useState<'overview' | 'permits' | 'reciprocity'>('overview');

  // Hardcoded mockup data for visual presentation
  const routeCrossings = [
    { from: 'TX', to: 'NM', type: 'State Line', requirements: ['NM Oversize Permit', 'Port of Entry Clearance'] },
    { from: 'NM', to: 'CO', type: 'State Line', requirements: ['CO Oversize Permit', 'Chains Required (Winter)'] },
    { from: 'CO', to: 'WY', type: 'State Line', requirements: ['WY Oversize Permit', 'Port of Entry Clearance'] },
    { from: 'WY', to: 'MT', type: 'State Line', requirements: ['MT Oversize Permit'] },
    { from: 'MT', to: 'AB (Canada)', type: 'International Border', requirements: ['Coutts/Sweetgrass Crossing Clearance', 'eManifest', 'AB Provincial Permit', 'Customs Broker Release'] },
  ];

  const requiredPermits = [
    { jurisdiction: 'Texas', type: 'Routine Oversize', status: 'Required', cost: '$60.00' },
    { jurisdiction: 'New Mexico', type: 'Oversize/Overweight', status: 'Required', cost: '$85.00' },
    { jurisdiction: 'Colorado', type: 'Oversize', status: 'Required', cost: '$30.00' },
    { jurisdiction: 'Wyoming', type: 'Oversize', status: 'Required', cost: '$40.00' },
    { jurisdiction: 'Montana', type: 'Oversize', status: 'Required', cost: '$55.00' },
    { jurisdiction: 'Alberta', type: 'High Load Corridor', status: 'Required', cost: '$120.00 CAD' },
  ];

  return (
    <div className="min-h-screen bg-hc-bg text-hc-text font-display flex flex-col pt-[80px]">
      {/* Header */}
      <div className="border-b border-hc-border bg-hc-surface/50 backdrop-blur-xl sticky top-[80px] z-30">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-hc-success text-xs font-bold uppercase tracking-widest mb-4">
            <Globe className="w-4 h-4" /> Operations Command
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-white uppercase tracking-[-0.02em] mb-2">Cross-Border Command Center</h1>
              <p className="text-hc-muted text-lg max-w-2xl">
                Multi-jurisdictional permit wizard and reciprocity calculator.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 bg-hc-surface border border-hc-border rounded-xl text-sm font-bold text-white uppercase flex items-center gap-2 hover:bg-hc-border transition-colors">
                <Share2 className="w-4 h-4" /> Share Route
              </button>
              <button className="px-5 py-2.5 bg-hc-success text-black rounded-xl text-sm font-black uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-500 transition-colors">
                <Download className="w-4 h-4" /> Export Itinerary
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input Form (Wizard) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-hc-surface/80 border border-hc-border rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white uppercase mb-6 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-hc-gold-500" /> Route Specs
            </h2>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-hc-muted uppercase">Origin State/Prov</label>
                  <select 
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-hc-bg border border-hc-border-high rounded-xl px-4 py-3 text-white focus:outline-none focus:border-hc-gold-500 transition-colors appearance-none"
                    data-tool-interact="cross-border-origin"
                  >
                    <option value="TX">Texas (TX)</option>
                    <option value="FL">Florida (FL)</option>
                    <option value="WA">Washington (WA)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-hc-muted uppercase">Destination</label>
                  <select 
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-hc-bg border border-hc-border-high rounded-xl px-4 py-3 text-white focus:outline-none focus:border-hc-gold-500 transition-colors appearance-none"
                    data-tool-interact="cross-border-destination"
                  >
                    <option value="AB">Alberta (AB)</option>
                    <option value="MX">Mexico (MX)</option>
                    <option value="NY">New York (NY)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-hc-muted uppercase">Width (Feet)</label>
                <input 
                  type="number" 
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full bg-hc-bg border border-hc-border-high rounded-xl px-4 py-3 text-white focus:outline-none focus:border-hc-gold-500 transition-colors"
                  data-tool-interact="cross-border-width"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-hc-muted uppercase">Height (Feet)</label>
                  <input 
                    type="number" 
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full bg-hc-bg border border-hc-border-high rounded-xl px-4 py-3 text-white focus:outline-none focus:border-hc-gold-500 transition-colors"
                    data-tool-interact="cross-border-height"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-hc-muted uppercase">Weight (Lbs)</label>
                  <input 
                    type="number" 
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-hc-bg border border-hc-border-high rounded-xl px-4 py-3 text-white focus:outline-none focus:border-hc-success transition-colors"
                    data-tool-interact="cross-border-weight"
                  />
                </div>
              </div>

              <button className="w-full py-4 bg-hc-gold-500 hover:bg-hc-gold-400 text-black font-black uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 mt-4" data-tool-interact="generate-itinerary">
                <Zap className="w-4 h-4" /> Calculate Compliance
              </button>
            </div>
          </div>
          
          {/* Intelligence Snapshot */}
          <div className="bg-hc-danger/10 border border-hc-danger/20 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-hc-danger uppercase flex items-center gap-2 mb-3">
              <FileWarning className="w-4 h-4" /> Critical Warnings
            </h3>
            <ul className="space-y-3 text-sm text-hc-muted leading-relaxed">
              <li><strong className="text-white">Alberta:</strong> Height exceeds 4.15m (13'7"). High Load Corridor clearances required.</li>
              <li><strong className="text-white">Border Crossing:</strong> Coutts port of entry requires ACE/ACI eManifest filed 1 hour prior to arrival.</li>
              <li><strong className="text-white">Colorado:</strong> Winter chain laws in effect. All escorts must carry chains.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Interactive Results */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tabs */}
          <div className="flex gap-2 border-b border-hc-border pb-1 overflow-x-auto hide-scrollbar">
            {['overview', 'permits', 'reciprocity'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-5 py-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-hc-gold-500 text-white' : 'border-transparent text-hc-muted hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content: OVERVIEW (Route Sequence) */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white uppercase mb-4 flex items-center gap-2">
                <Map className="w-5 h-5 text-hc-success" /> Trajectory Matrix
              </h2>
              
              <div className="relative pl-6 space-y-8 border-l-2 border-hc-border/50 ml-3">
                {routeCrossings.map((cross, idx) => (
                  <div key={idx} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-hc-bg border-2 border-hc-success z-10" />
                    
                    <div className="bg-hc-surface border border-hc-border rounded-xl p-5 hover:border-hc-border-high transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-white">{cross.from}</span>
                          <ArrowRight className="w-4 h-4 text-hc-muted" />
                          <span className="text-lg font-black text-white">{cross.to}</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${cross.type === 'International Border' ? 'bg-hc-danger/20 text-hc-danger' : 'bg-white/10 text-hc-muted'}`}>
                          {cross.type}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {cross.requirements.map((req, ridx) => (
                          <span key={ridx} className="text-xs text-hc-subtle bg-hc-bg border border-hc-border px-2.5 py-1 rounded-md flex items-center gap-1.5">
                            <ShieldAlert className="w-3 h-3 text-hc-gold-500" /> {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content: PERMITS */}
          {activeTab === 'permits' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white uppercase flex items-center gap-2">
                  <FileWarning className="w-5 h-5 text-hc-gold-500" /> State / Provincial Permits
                </h2>
                <div className="text-right">
                  <div className="text-sm text-hc-muted uppercase font-bold tracking-wider">Estimated Cost</div>
                  <div className="text-2xl font-black text-hc-gold-500">$390.00 <span className="text-sm text-hc-muted">+ $120 CAD</span></div>
                </div>
              </div>
              
              <div className="overflow-hidden bg-hc-surface/50 border border-hc-border rounded-2xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-hc-surface border-b border-hc-border text-xs uppercase tracking-wider text-hc-muted font-bold">
                    <tr>
                      <th className="px-6 py-4">Jurisdiction</th>
                      <th className="px-6 py-4">Permit Type</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hc-border text-white">
                    {requiredPermits.map((p, i) => (
                      <tr key={i} className="hover:bg-hc-surface/80 transition-colors">
                        <td className="px-6 py-4 font-bold">{p.jurisdiction}</td>
                        <td className="px-6 py-4 text-hc-muted">{p.type}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs px-2 py-1 bg-hc-danger/10 text-hc-danger rounded font-bold uppercase">Required</span>
                        </td>
                        <td className="px-6 py-4 tabular-nums text-hc-gold-500 font-bold">{p.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-hc-subtle text-right mt-2">* Costs are estimates for routine oversize issuing fees only. Excludes municipal or engineering fees.</p>
            </div>
          )}

          {/* Tab Content: RECIPROCITY ENGINE */}
          {activeTab === 'reciprocity' && (
            <div className="space-y-4">
               <h2 className="text-xl font-bold text-white uppercase mb-4 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-hc-success" /> Reciprocity Engine
              </h2>
              <p className="text-hc-muted mb-6 leading-relaxed">
                The Reciprocity Engine analyzes {routeCrossings.length} jurisdictions to determine <a href="/glossary/pilot-car" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">pilot car</a> certification validity across the entire corridor.
              </p>

              <div className="bg-hc-surface/50 border border-hc-border rounded-xl p-6 space-y-6">
                <div className="flex items-start gap-4 p-4 bg-hc-bg rounded-xl border border-hc-border-high">
                  <Truck className="w-6 h-6 text-hc-gold-500 mt-1" />
                  <div>
                    <h4 className="text-white font-bold mb-1"><a href="/glossary/lead-pilot-car" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">Lead Pilot Car</a> Certification</h4>
                    <p className="text-sm text-hc-muted">Your selected pilot car holds a <strong>Washington State (WA)</strong> Certification.</p>
                    
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-hc-success/10 border border-hc-success/20 rounded p-2 text-center text-hc-success font-bold text-xs uppercase">TX Valid</div>
                      <div className="bg-hc-success/10 border border-hc-success/20 rounded p-2 text-center text-hc-success font-bold text-xs uppercase">NM Valid</div>
                      <div className="bg-hc-success/10 border border-hc-success/20 rounded p-2 text-center text-hc-success font-bold text-xs uppercase">CO Valid</div>
                      <div className="bg-hc-danger/10 border border-hc-danger/20 rounded p-2 text-center text-hc-danger font-bold text-xs uppercase">AB Invalid</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-hc-gold-500/10 border border-hc-gold-500/20 rounded-xl">
                  <h4 className="text-hc-gold-500 font-bold mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Action Required
                  </h4>
                  <p className="text-sm text-white/80 leading-relaxed">
                    Alberta does not formally accept US Pilot Car certifications. You must hire a Canadian-based pilot car or ensure your US operator has specific temporary clearances and high-load training.
                  </p>
                  <button className="mt-4 px-4 py-2 bg-hc-surface border border-hc-gold-500 text-white text-xs font-bold uppercase rounded hover:bg-hc-bg transition-colors">
                    Find Alberta Escorts →
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
