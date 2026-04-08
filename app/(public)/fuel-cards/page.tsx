import React from 'react';
import { VendorCard } from '@/components/marketplace/VendorCard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Heavy Haul Fuel Cards | Haul Command',
  description: 'Fuel savings and fleet cards for escort operators driving thousands of miles monthly.',
};

export default function FuelCardsPage() {
  const vendors = [
    {
      name: 'AtoB',
      category: 'Fuel Dispatch Card',
      description: 'Zero hidden fees. Universally accepted Visa fleet card offering competitive discounts at major truck stops globally.',
      offerText: '$.05+ off per gallon',
      link: '#',
      isFeatured: true
    },
    {
      name: 'Mudflap',
      category: 'Discount Network',
      description: 'Instant fuel discounts at independent truck stops. No credit checks required, completely app-based.',
      offerText: 'Save up to 40¢/gal',
      link: '#'
    }
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 py-16 md:py-24">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Fleet <span className="text-emerald-500">Fuel Cards</span>
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
          When you're running 120,000 miles a year, every cent matters. We've vetted the best fuel networks providing heavy haul operators with immediate point-of-sale liquidity and deep discounts.
        </p>
      </div>

      <div className="grid gap-6">
        {vendors.map((v, i) => (
          <VendorCard key={i} {...v} />
        ))}
      </div>
    </main>
  );
}
