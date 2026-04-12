import React from 'react';
import { VendorCard } from '@/components/marketplace/VendorCard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Heavy Haul Insurance Partners | Haul Command',
  description: 'Specialized commercial auto, cargo, and general liability insurance for heavy haul escort operators.',
};

export default function InsurancePage() {
  const vendors = [
    {
      name: 'Progressive Commercial',
      category: 'Primary Auto & General Liability',
      description: 'Industry-leading policies for pilot cars and heavy haul specialized transport. Get immediate quotes tailored to state regulations and cross-border transport requirements.',
      offerText: 'Fast quotes for Haul Command Operators',
      link: 'https://www.progressivecommercial.com',
      isFeatured: true
    },
    {
      name: 'Reliance Partners',
      category: 'Cargo & Specialized coverage',
      description: 'Expert specialized trucking and pilot car insurance tailored to complex routes and varying mult-state authority regulations.',
      offerText: 'Free Coverage Audit',
      link: 'https://reliancepartners.com/'
    }
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 py-16 md:py-24">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Pilot Car <span className="text-emerald-500">Insurance</span>
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
          The heavy haul ecosystem demands specific coverages. We've partnered with the leading commercial insurance brokers who truly understand pilot car and escort vehicle requirements.
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