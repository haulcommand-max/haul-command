import React from 'react';

type Region = 'Southeast' | 'Midwest' | 'Northeast' | 'Southwest' | 'West Coast' | 'Canada';
type ServiceType = 'Base PEVO' | 'Height Pole' | 'Bucket Truck' | 'Police Escort' | 'Route Survey';

interface RateIndicatorProps {
  offeredRatePerMile?: number;
  offeredDayRate?: number;
  region: Region;
  serviceType: ServiceType;
}

// Rate guide definitions from official 2026 Operator Resource
const RATE_GUIDES = {
  'Base PEVO': {
    perMileRange: {
      'Southeast': [1.65, 1.85],
      'Midwest': [1.75, 1.95],
      'Northeast': [1.80, 2.00],
      'Southwest': [1.85, 2.00],
      'West Coast': [2.00, 2.25],
      'Canada': [2.00, 2.25]
    },
    dayRateMin: 450,
    dayRateMax: 650,
  },
  'Height Pole': {
    perMileRange: {
      'Southeast': [1.90, 2.20],
      'Midwest': [2.00, 2.50],
      'Northeast': [2.00, 2.50],
      'Southwest': [2.00, 2.50], // Estimating based on MW/NE parity
      'West Coast': [2.25, 2.75],
      'Canada': [2.25, 2.75]
    },
    dayRateMin: 550,
    dayRateMax: 800,
  },
  'Bucket Truck': {
    perMileRange: {
      'Southeast': [2.25, 3.50],
      'Midwest': [2.25, 3.50],
      'Northeast': [2.25, 3.50],
      'Southwest': [2.25, 3.50],
      'West Coast': [2.25, 3.50],
      'Canada': [2.25, 3.50]
    },
    dayRateMin: 1200,
    dayRateMax: 1800,
  }
};

export default function RateIndicator({ offeredRatePerMile, offeredDayRate, region, serviceType }: RateIndicatorProps) {
  if (serviceType === 'Police Escort' || serviceType === 'Route Survey') {
    return <div className="text-sm text-gray-400">Fixed/Variable municipality pricing applies.</div>;
  }

  const guide = RATE_GUIDES[serviceType];
  if (!guide) return null;

  const [minMile, maxMile] = guide.perMileRange[region] || [1.65, 1.85];
  
  let isTooLowPerMile = false;
  let isTooLowDayRate = false;

  if (offeredRatePerMile && offeredRatePerMile < minMile) {
    isTooLowPerMile = true;
  }
  
  if (offeredDayRate && offeredDayRate < guide.dayRateMin) {
    isTooLowDayRate = true;
  }

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800 shadow-sm mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Market Rate Analytics</h4>
        {isTooLowPerMile || isTooLowDayRate ? (
           <span className="flex items-center text-red-500 font-bold gap-1 text-sm bg-red-500/10 px-2 py-1 rounded">
             <span className="text-lg">↓</span> BELOW MARKET
           </span>
        ) : (
           <span className="flex items-center text-green-500 font-bold gap-1 text-sm bg-green-500/10 px-2 py-1 rounded">
             <span className="text-lg">↑</span> FAIR RATE
           </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mt-3">
        <div className="bg-gray-800/50 p-3 rounded">
          <p className="text-gray-500 mb-1">Per Mile Estimate</p>
          <div className="flex justify-between items-center">
            <span className="font-mono text-white">${minMile.toFixed(2)} - ${maxMile.toFixed(2)}</span>
            {offeredRatePerMile && (
               <span className={isTooLowPerMile ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>
                 Offered: ${offeredRatePerMile.toFixed(2)}
               </span>
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 p-3 rounded">
          <p className="text-gray-500 mb-1">Day Rate Base</p>
          <div className="flex justify-between items-center">
            <span className="font-mono text-white">${guide.dayRateMin} - ${guide.dayRateMax}</span>
            {offeredDayRate && (
               <span className={isTooLowDayRate ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>
                 Offered: ${offeredDayRate}
               </span>
            )}
          </div>
        </div>
      </div>
      
      {(isTooLowPerMile || isTooLowDayRate) && (
        <p className="text-xs text-red-400 mt-3 flex items-center gap-2">
          <span className="text-red-500">⚠️</span> Warning: Booking rates below market average will result in delays securing pilot cars.
        </p>
      )}
    </div>
  );
}
