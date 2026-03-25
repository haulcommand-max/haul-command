import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import fs from 'fs';
import path from 'path';
import EscortRulesClient from './EscortRulesClient';
import { ALL_COUNTRY_CODES, COUNTRY_NAMES } from '@/lib/directory-helpers';

export const revalidate = 3600;

export async function generateStaticParams() {
  return ALL_COUNTRY_CODES.map((code) => ({
    country: code.toLowerCase()
  }));
}

export async function generateMetadata({ params }: { params: { country: string } }): Promise<Metadata> {
  const code = params.country.toLowerCase();
  const name = COUNTRY_NAMES[code] || code.toUpperCase();

  return {
    title: `${name} Escort Requirements & Rules | Haul Command`,
    description: `Lookup precise pilot car, escort vehicle, and superload requirements for ${name}. Calculate trigger dimensions and regulations instantly.`,
    alternates: {
      canonical: `https://haulcommand.com/tools/escort-rules/${code}`,
    }
  };
}

export default async function EscortRulesPage({ params }: { params: { country: string } }) {
  const code = params.country.toLowerCase();
  if (!ALL_COUNTRY_CODES.includes(code)) {
    notFound();
  }

  const countryName = COUNTRY_NAMES[code];
  let dictionaryData: any[] = [];

  try {
    if (code === 'us') {
      const p = path.join(process.cwd(), 'src', 'data', 'states_master.json');
      const raw = fs.readFileSync(p, 'utf8');
      const parsed = JSON.parse(raw);
      dictionaryData = parsed.map((item: any) => ({
        ...item,
        name: item.state
      }));
    } else {
      const p = path.join(process.cwd(), 'src', 'data', 'international_esc_dictionaries.json');
      const raw = fs.readFileSync(p, 'utf8');
      const parsed = JSON.parse(raw);
      // Find the specific country or show all if we want? The tool makes more sense doing all countries if 'country' is 'international'.
      // But the URL is /tools/escort-rules/ca.
      // Wait, 'international_esc_dictionaries.json' contains ONE entry per country.
      // So the dictionary array would be length 1 for 'ca'.
      const specific = parsed.find((c: any) => c.slug === countryName.toLowerCase().replace(/ /g, '-'));
      if (specific) {
        dictionaryData = [{ ...specific, name: specific.country }];
      } else {
        // Fallback if not specifically found in the seeded JSON
        dictionaryData = [];
      }
    }
  } catch (err) {
    console.error('Failed to load ESC dictionary for', code, err);
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-[80px] sm:pt-[100px] px-4 pb-20">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 uppercase">
              {countryName} <span className="text-accent underline decoration-[6px] underline-offset-4">Regulations</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Calculate exact pilot car, height pole, and route survey requirements based on load dimensions.
            </p>
          </div>

          <EscortRulesClient 
            countryCode={code} 
            countryName={countryName} 
            dictionary={dictionaryData} 
          />

          {/* Marketing/SEO Text Block */}
          <div className="mt-16 bg-white/[0.02] border border-white/5 rounded-2xl p-8 lg:p-12">
            <h2 className="text-2xl font-bold text-white mb-4">Why use the Heavy Haul Rules Calculator?</h2>
            <div className="grid md:grid-cols-2 gap-8 text-sm text-gray-400 leading-relaxed">
              <p>
                Oversize and overweight (OSOW) transport regulations vary drastically between jurisdictions. This live calculator translates your exact load dimensions against verified government thresholds for {countryName}, ensuring you book the correct number of Escort Vehicle Operators (EVO) before applying for your permits.
              </p>
              <p>
                If your load triggers a <strong>Route Survey</strong> or <strong>Height Pole</strong> requirement, avoiding compliance errors is critical. Use this tool alongside our <Link href={`/directory/${code}`} className="text-accent hover:underline">verified pilot car directory</Link> to source competent professionals instantly.
              </p>
            </div>
          </div>
          
        </div>
      </main>
    </>
  );
}
