'use client';

import React from 'react';

// Haul Command Global Component
// Derived from NTS/Freedom Pilot audits - Converts static service text into a localized capability dispatcher.

export default function CapabilityBookingSidebar({ 
  countryCode,
  regionCode 
}: { 
  countryCode: string, 
  regionCode: string 
}) {
  
  // Dynamic Localization Simulator mapping hc_localized_capabilities
  const capabilities = {
    'US': [
      { id: 'lead', name: 'Lead Pilot Car', icon: '🚗' },
      { id: 'chase', name: 'Chase Pilot Car', icon: '🚙' },
      { id: 'high_pole', name: 'High-Pole Escort', icon: '🚩' },
      { id: 'twic', name: 'TWIC Port Access', icon: '⚓' }
    ],
    'AU': [
      { id: 'lead', name: 'Level 1 Pilot Vehicle', icon: '🚗' },
      { id: 'chase', name: 'Level 2 Pilot Vehicle', icon: '🚙' },
      { id: 'msic', name: 'MSIC Authorized', icon: '⚓' }
    ],
    'DE': [
      { id: 'lead', name: 'BF3 Begleitfahrzeug', icon: '🚗' },
      { id: 'police', name: 'BF4 (Polizeiersatz)', icon: '🚓' },
      { id: 'route_survey', name: 'Streckenprüfung', icon: '📏' }
    ]
  };

  const currentCapabilities = capabilities[countryCode.toUpperCase() as keyof typeof capabilities] || capabilities['US'];

  return (
    <div className="bg-hc-gray-900 rounded-xl p-6 border border-hc-gray-800 shadow-xl">
      <h3 className="font-extrabold text-xl text-white mb-2">Request {regionCode.toUpperCase()} Dispatch</h3>
      <p className="text-sm text-hc-gray-400 mb-6">Match with verified local operators holding these specific capabilities.</p>
      
      <form className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold text-hc-gray-500 tracking-wider">Required Capabilities</label>
          <div className="grid grid-cols-1 gap-2">
            {currentCapabilities.map(cap => (
              <label key={cap.id} className="flex items-center gap-3 p-3 bg-hc-gray-800 border border-hc-gray-700 rounded cursor-pointer hover:bg-hc-gray-700 transition-colors">
                <input type="checkbox" className="form-checkbox h-5 w-5 text-hc-yellow-400 bg-hc-gray-900 border-hc-gray-600 rounded focus:ring-0 focus:ring-offset-0" />
                <span className="text-hc-gray-100 font-medium">
                  {cap.icon} {cap.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button type="button" className="w-full bg-hc-yellow-400 hover:bg-yellow-500 text-hc-gray-900 font-extrabold py-3 rounded uppercase tracking-wide transition-all shadow-md">
            Find Verified Operators
          </button>
          <p className="text-center text-xs text-hc-gray-500 mt-3">
            Only matches operators with active, verified credential wallets valid in {regionCode.toUpperCase()}.
          </p>
        </div>
      </form>
    </div>
  );
}
