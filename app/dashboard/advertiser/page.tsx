import React from 'react';
import AdGridSystem from '@/components/adgrid/AdGridSystem';

export const metadata = {
  title: 'Advertiser Dashboard | AdGrid',
  description: 'Manage your heavy haul advertising campaigns, view ROI, and generate AI creatives.',
};

export default function AdvertiserDashboardPage() {
  return (
    <div className="min-h-screen bg-hc-bg text-hc-text pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header styling matching the standard Haul Command dashboard look */}
        <div className="mb-8 border-b border-white/5 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Advertiser Command Center</h1>
          <p className="text-slate-400 text-sm">
            Deploy hyper-local creatives across 120 countries. Control your budget and view real-time ROI across the complete heavy-haul operator network.
          </p>
        </div>

        {/* AdGrid Core System */}
        <AdGridSystem />

      </div>
    </div>
  );
}
