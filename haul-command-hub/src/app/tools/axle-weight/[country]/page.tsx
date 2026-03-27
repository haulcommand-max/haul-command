import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AxleWeightClient from './AxleWeightClient';
import { ALL_COUNTRY_CODES, COUNTRY_NAMES } from '@/lib/directory-helpers';

export const revalidate = 3600;

export async function generateStaticParams() {
  return ALL_COUNTRY_CODES.map((code) => ({
    country: code.toLowerCase()
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params;
  const code = country.toLowerCase();
  const name = COUNTRY_NAMES[code] || code.toUpperCase();

  return {
    title:`${name} Axle Weight Calculator & Bridge Formula Checker`,
    description: `Calculate your gross weight, tandem grouping limits, and superload structural engineering thresholds for heavy haul transport in ${name}.`,
    alternates: {
      canonical: `https://haulcommand.com/tools/axle-weight/${code}`,
    }
  };
}

export default async function AxleWeightPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const code = country.toLowerCase();
  if (!ALL_COUNTRY_CODES.includes(code)) {
    notFound();
  }

  const countryName = COUNTRY_NAMES[code];

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-[80px] sm:pt-[100px] px-4 pb-20">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 uppercase">
              {countryName} <span className="text-accent underline decoration-[6px] underline-offset-4">Weight Calculator</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Verify compliance with internal bridge formulas, structural limitations, and local overweight payload capacities.
            </p>
          </div>

          <AxleWeightClient 
            countryCode={code} 
            countryName={countryName} 
          />

          {/* Marketing/SEO Text Block */}
          <div className="mt-16 bg-white/[0.02] border border-white/5 rounded-2xl p-8 lg:p-12">
            <h2 className="text-2xl font-bold text-white mb-6">Navigating Bridge Formulas in {countryName}</h2>
            <div className="grid md:grid-cols-2 gap-8 text-sm text-gray-400 leading-relaxed">
              <div>
                <h3 className="text-white font-bold mb-2 uppercase tracking-wide">Gross Capacity vs Bridge Analysis</h3>
                <p>
                  A truck may be within the legal overall weight limit but still fail structural enforcement due to concentrated point-loading on tandem and tridem axle groups. Engineering limits require exact weight distribution per axle to ensure aging highway bridges are not sheared by immense pressure points. 
                </p>
              </div>
              <div>
                <h3 className="text-white font-bold mb-2 uppercase tracking-wide">Superloads & Structural Clearances</h3>
                <p>
                  Massive combinations utilizing jeep/booster trailers distribute weight effectively, but once your gross mass breaches {countryName}'s definition of a "Superload", automated permits are denied. These loads mandate 3rd-party engineering firms conducting live structural analysis of every culvert and overpass on your route.
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </>
  );
}
