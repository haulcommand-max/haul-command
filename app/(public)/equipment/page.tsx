import React from 'react';
import { VendorCard } from '@/components/marketplace/VendorCard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pilot Car Equipment & Vendors | Haul Command',
  description: 'Verified suppliers for beacons, radios, flags, poles, and specialized escort vehicle upfitting.',
};

export default function EquipmentPage() {
  const vendors = [
    {
      name: 'Safety Warning Systems',
      category: 'Lightbars & LED Signage',
      description: 'DOT compliant ultra-bright roof LED lightbars and rigid folding signs for extreme weather and night transport.',
      offerText: '10% off for verified operators',
      link: '#',
      isFeatured: true
    },
    {
      name: 'High Pole Masters',
      category: 'Height Poles & Sensors',
      description: 'Reliable, calibrated fiberglass height poles designed specifically for heavy equipment scanning at 15ft+.',
      offerText: 'Free shipping anywhere in US/CA',
      link: '#'
    },
    {
      name: 'Baofeng / Motorola Solutions',
      category: 'Two-Way Comms',
      description: 'Reliable VHF/UHF two-way comms essential for front-to-rear load coordination in rural dead zones.',
      offerText: 'Exclusive radio bundles',
      link: '#'
    }
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 py-16 md:py-24">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Escort <span className="text-emerald-500">Equipment</span>
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
          Your rig is your livelihood. Upfit your escort vehicle with DOT-compliant flags, signs, lightbars, height poles, and deep-range radios that won't fail during a superload movement.
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