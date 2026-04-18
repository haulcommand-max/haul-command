'use client';

import React, { useState } from 'react';
import { ShareButton } from '@/components/social/ShareButton';

export default function ComplianceHubPage() {
  const [activeTab, setActiveTab] = useState('documents');
  const [uploading, setUploading] = useState(false);

  const docs = [
    { id: 1, name: 'W-9 Form', type: 'Tax', status: 'verified', expiry: null },
    { id: 2, name: 'Certificate of Insurance (COI)', type: 'Insurance', status: 'expiring_soon', expiry: '2026-05-15' },
    { id: 3, name: 'Amber Light Certification', type: 'State Required', status: 'verified', expiry: '2028-12-01' },
    { id: 4, name: 'Utah Pilot Car Certification', type: 'Permit', status: 'missing', expiry: null },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 bg-[#0a0a09] min-h-screen">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-widest">Compliance Hub</h1>
          <p className="text-gray-400 font-semibold text-sm mt-2 max-w-xl">
            Store your operating docs, certificates, and W-9. Autofill them into broker packets and never miss a renewal deadline.
          </p>
        </div>
        <div className="hidden sm:block">
          <ShareButton 
            title="My Escort Compliance Packet" 
            text="Access my verified W-9, COI, and Certifications via Haul Command." 
            context="profile" 
          />
        </div>
      </div>

      {/* Trust & Proof Top Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 border border-white/10 p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Stored Documents</div>
            <div className="text-2xl font-black text-white mt-1">3 <span className="text-sm font-normal text-gray-400">Total</span></div>
          </div>
          <div className="text-3xl">🗂️</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Trust Status</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">Verified</div>
          </div>
          <div className="text-3xl">✓</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-500 uppercase tracking-widest">Next Action</div>
            <div className="text-lg font-bold text-amber-400 mt-1">Renew COI <span className="text-xs">in 37 days</span></div>
          </div>
          <div className="text-3xl">⚠️</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/40">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">Active Documents</h3>
              <button 
                onClick={() => setUploading(true)}
                className="text-xs bg-white text-black font-bold uppercase px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                + Upload New
              </button>
            </div>
            
            <div className="divide-y divide-white/10">
              {docs.map(doc => (
                <div key={doc.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {doc.type === 'Tax' ? '📄' : doc.type === 'Insurance' ? '🛡️' : '🏅'}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm flex items-center gap-2">
                        {doc.name}
                        {doc.status === 'verified' && <span className="text-emerald-400 text-xs text-[10px]">✓ Verified</span>}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">{doc.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {doc.status === 'expiring_soon' && (
                      <div className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md mb-1 inline-block border border-amber-500/20">
                        Expiring {doc.expiry}
                      </div>
                    )}
                    {doc.status === 'missing' && (
                      <div className="text-xs font-bold text-gray-400 bg-white/5 px-2.5 py-1 rounded-md mb-1 inline-block border border-white/10">
                        Required
                      </div>
                    )}
                    {doc.status !== 'missing' ? (
                      <p className="text-xs text-blue-400 font-semibold cursor-pointer hover:underline">View File</p>
                    ) : (
                      <p className="text-xs text-emerald-400 font-semibold cursor-pointer hover:underline">Upload File</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#12110c] border border-amber-500/30 p-6 rounded-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🔄</div>
             <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-2 relative z-10">Autofill Packets</h4>
             <p className="text-xs text-gray-400 mb-4 leading-relaxed relative z-10">
               When you are booked on a load or quote via Haul Command Escrow, your <strong>Verified W-9 and COI</strong> automatically route to the broker, skipping manual emails.
             </p>
             <button className="w-full bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/30 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all">
               Generate Setup Packet
             </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Notification Hooks</h4>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded appearance-none border border-white/20 checked:bg-emerald-500 checked:border-emerald-500 flex-shrink-0 relative focus:outline-none after:content-['✓'] after:invisible checked:after:visible after:text-black after:text-[10px] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2" />
                <span className="text-xs text-gray-300 font-medium">90/30/15 day expiration Push alerts</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded appearance-none border border-white/20 checked:bg-emerald-500 checked:border-emerald-500 flex-shrink-0 relative focus:outline-none after:content-['✓'] after:invisible checked:after:visible after:text-black after:text-[10px] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2" />
                <span className="text-xs text-gray-300 font-medium">Auto-email brokers upon renewal</span>
              </label>
            </div>
            <p className="text-[10px] text-gray-500 mt-4 border-t border-white/5 pt-4">
              Push notifications are securely routed via Firebase Cloud Messaging based on your Supabase document records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
