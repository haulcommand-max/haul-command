'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ══════════════════════════════════════════════════════
   ADGRID — Advertiser Dashboard + Creative Upload
   Now with Supabase integration and live metrics
   ══════════════════════════════════════════════════════ */

interface Campaign {
  id: string;
  name: string;
  tier: string;
  status: string;
  impressions: number;
  clicks: number;
  spend: number;
  budget: number;
  daysRemaining: number;
  segment: string;
  creative_url?: string;
}

const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: 'demo-1',
    name: 'I-95 Corridor Takeover',
    tier: 'Exclusive Corridor Sponsor',
    status: 'active',
    impressions: 42450,
    clicks: 1387,
    spend: 149,
    budget: 149,
    daysRemaining: 18,
    segment: 'All Operators',
  },
  {
    id: 'demo-2',
    name: 'Pilot Car Insurance Retargeting',
    tier: 'Run of Network',
    status: 'active',
    impressions: 18920,
    clicks: 434,
    spend: 19,
    budget: 19,
    daysRemaining: 12,
    segment: 'Unverified Operators',
  },
];

const SEGMENTS = [
  { id: 'fuel', name: 'Fuel Card Segment', count: 7335, desc: 'Target all active verified operators logging daily miles' },
  { id: 'insurance', name: 'Insurance Segment', count: 1820, desc: 'Target newly registered, unverified profile operators' },
  { id: 'equipment', name: 'Equipment Segment', count: 2410, desc: 'Target new operators standing up their first rig' },
  { id: 'hotel', name: 'Hotel Segment', count: 3105, desc: 'Target operators actively running multi-day corridors' },
];

export default function AdvertiserDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(DEMO_CAMPAIGNS);
  const [uploading, setUploading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [authed, setAuthed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Auth gate — don't expose campaign data publicly
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setAuthChecking(false);
    });
  }, []);

  // Fetch live campaigns from Supabase
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/advertise/campaigns');
      const data = await res.json();
      if (data.campaigns?.length) setCampaigns(data.campaigns);
    } catch {
      // Keep demo data on error
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  // Creative upload handler
  async function handleCreativeUpload(file: File, campaignId: string) {
    setUploading(true);
    setUploadTarget(campaignId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('campaign_id', campaignId);

      const res = await fetch('/api/advertise/upload-creative', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setCampaigns(prev => prev.map(c =>
          c.id === campaignId ? { ...c, creative_url: data.url } : c
        ));
      }
    } catch {
      // handled gracefully
    }
    setUploading(false);
    setUploadTarget(null);
  }

  function handleDrop(e: React.DragEvent, campaignId: string) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleCreativeUpload(file, campaignId);
    }
  }

  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0';

  if (authChecking) {
    return (
      <>
        <Navbar />
        <main className="flex-grow flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
        </main>
      </>
    );
  }

  if (!authed) {
    return (
      <>
        <Navbar />
        <main className="flex-grow flex items-center justify-center min-h-screen px-4">
          <div className="max-w-md w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-black text-white mb-2">AdGrid Dashboard</h1>
            <p className="text-gray-400 text-sm mb-6">
              Sign in to access your campaign analytics, audience targeting, and creative uploads.
            </p>
            <Link
              href="/login"
              className="block bg-accent text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors mb-3"
            >
              Sign In to Dashboard
            </Link>
            <Link
              href="/advertise"
              className="block text-gray-500 hover:text-white text-sm transition-colors"
            >
              ← Back to Advertise
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
              AdGrid <span className="text-accent">OS</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Self-serve enterprise advertising for the heavy haul industry</p>
          </div>
          <Link
            href="/advertise/create"
            className="bg-accent text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors shrink-0"
          >
            + New Campaign
          </Link>
        </div>

        {/* ── Aggregate Performance Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Impressions', value: totalImpressions.toLocaleString(), icon: '👁️' },
            { label: 'Total Clicks', value: totalClicks.toLocaleString(), icon: '🖱️' },
            { label: 'Avg CTR', value: `${avgCTR}%`, icon: '📊' },
            { label: 'Total Spend', value: `$${totalSpend}`, icon: '💰' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="text-lg mb-1">{stat.icon}</div>
              <div className="text-accent font-black text-xl tabular-nums">{stat.value}</div>
              <div className="text-gray-500 text-[10px] uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Audience Segments Insight ── */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-8">
          <h2 className="text-white font-bold text-lg mb-4">AdGrid Network Audiences</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SEGMENTS.map(seg => (
              <div key={seg.id} className="bg-black/40 border border-white/5 p-4 rounded-xl hover:border-accent/20 transition-all ag-card-hover">
                <div className="text-accent text-xl font-black">{seg.count.toLocaleString()}</div>
                <div className="text-white font-bold text-xs uppercase my-1">{seg.name}</div>
                <div className="text-gray-500 text-[10px]">{seg.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Active Campaigns ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Your Active Campaigns</h2>
            <div className="text-xs text-gray-500">
              Pricing: From $25/day (Sponsored), $50/day (Corridor), $100/day (Data Sponsor)
            </div>
          </div>

          <div className="space-y-4">
            {campaigns.map(campaign => (
              <div
                key={campaign.id}
                className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-accent/20 transition-all"
              >
                <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2">
                  <div>
                    <h3 className="text-white font-bold text-base">{campaign.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-accent text-xs font-semibold">{campaign.tier}</span>
                      <span className="text-gray-600 text-[10px]">|</span>
                      <span className="text-gray-400 text-xs">Targeting: {campaign.segment}</span>
                    </div>
                  </div>
                  <div className="self-start">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400">
                      {campaign.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-black/30 p-4 rounded-lg border border-white/5 mb-4">
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Impressions</div>
                    <div className="text-white font-bold">{campaign.impressions.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Clicks</div>
                    <div className="text-white font-bold">{campaign.clicks.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">CTR</div>
                    <div className="text-accent font-bold">{(campaign.clicks / campaign.impressions * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Budget Use</div>
                    <div className="text-white font-bold">${campaign.spend} <span className="text-gray-500 font-normal">/ mo</span></div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Cycle Renews</div>
                    <div className="text-white font-bold">{campaign.daysRemaining} Days</div>
                  </div>
                </div>

                {/* Creative Upload Dropzone */}
                <div
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                    dragActive ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-accent/30'
                  }`}
                  onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={e => handleDrop(e, campaign.id)}
                  onClick={() => { setUploadTarget(campaign.id); fileInputRef.current?.click(); }}
                >
                  {campaign.creative_url ? (
                    <div className="flex items-center gap-3">
                      <img src={campaign.creative_url} alt="Creative" className="w-20 h-12 object-cover rounded-lg border border-white/10" />
                      <div className="text-left">
                        <div className="text-green-400 text-xs font-bold">✅ Creative Uploaded</div>
                        <div className="text-gray-500 text-[10px]">Click or drag to replace</div>
                      </div>
                    </div>
                  ) : uploading && uploadTarget === campaign.id ? (
                    <div className="py-2">
                      <div className="text-accent text-sm font-bold animate-pulse">⬆️ Uploading...</div>
                    </div>
                  ) : (
                    <div className="py-2">
                      <div className="text-gray-400 text-sm">📎 Drop banner creative here or <span className="text-accent font-bold">click to upload</span></div>
                      <div className="text-gray-600 text-[10px] mt-1">JPG, PNG, or WebP · Max 2MB · Recommended: 728×90 or 300×250</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file && uploadTarget) handleCreativeUpload(file, uploadTarget);
            }}
          />
        </section>

        {/* ── Pricing CTA ── */}
        <div className="mt-12 bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-8 text-center">
          <h2 className="text-white font-bold text-2xl mb-3">Ready to Reach 7,335+ Operators?</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
            Launch your campaign in minutes. Target operators by corridor, certification level, and equipment type.
          </p>
          <Link href="/advertise/create" className="bg-accent text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors inline-block">
            Launch Campaign — From $25/day
          </Link>
        </div>
      </main>
    </>
  );
}
