import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import RateEstimatorClient from './RateEstimatorClient';
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
    title:`${name} Pilot Car Rate Estimator & Calculator`,
    description: `Instantly calculate pilot car rates and escort vehicle costs for ${name}. Estimate deadhead, layovers, base rates, and toll costs based on local standards.`,
    alternates: {
      canonical: `https://haulcommand.com/tools/rate-estimator/${code}`,
    }
  };
}

export default async function RateEstimatorPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const code = country.toLowerCase();
  if (!ALL_COUNTRY_CODES.includes(code)) {
    notFound();
  }

  const countryName = COUNTRY_NAMES[code];
  const isMetric = code !== 'us' && code !== 'gb';

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-[80px] sm:pt-[100px] px-4 pb-20">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 uppercase">
              {countryName} <span className="text-accent underline decoration-[6px] underline-offset-4">Rate Estimator</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Calculate projected escort vehicle costs based on distance, layovers, deadhead, and local {isMetric ? 'metric (km)' : 'imperial (miles)'} standards.
            </p>
          </div>

          <RateEstimatorClient 
            countryCode={code} 
            countryName={countryName} 
          />

          {/* Marketing/SEO Text Block */}
          <div className="mt-16 bg-white/[0.02] border border-white/5 rounded-2xl p-8 lg:p-12">
            <h2 className="text-2xl font-bold text-white mb-4">How are pilot car rates calculated in {countryName}?</h2>
            <div className="grid md:grid-cols-2 gap-8 text-sm text-gray-400 leading-relaxed">
              <p>
                Professional escort vehicle operators calculate their invoices using a combination of "Loaded" run {isMetric ? 'kilometers' : 'miles'}, discounted "Deadhead" return distances, and fixed incidentals like overnight layover fees (motels) and hourly standby rates. 
              </p>
              <p>
                Our <strong>Rate Estimator</strong> provides carriers and brokers with an accurate baseline before bidding out freight. Remember that specialized escorts (e.g. Height Pole operators, Route Surveyors, or Level 2 Certified Pilots) typically charge a premium base rate above standard lead/chase vehicles.
              </p>
            </div>
          </div>
          
        </div>
      </main>
    </>
  );
}
