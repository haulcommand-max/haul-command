import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import fs from 'fs';
import path from 'path';
import PermitCheckerClient from './PermitCheckerClient';
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
    title:`${name} Heavy Haul Permit Authority Directory`,
    description: `Lookup official OSOW permit portals, police escort authorities, and municipal curfews for heavy haul transport in ${name}.`,
    alternates: {
      canonical: `https://haulcommand.com/tools/permit-checker/${code}`,
    }
  };
}

export default async function PermitCheckerPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const code = country.toLowerCase();
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
      const specific = parsed.find((c: any) => c.slug === countryName.toLowerCase().replace(/ /g, '-'));
      if (specific) {
        dictionaryData = [{ ...specific, name: specific.country }];
      } else {
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
              {countryName} <span className="text-accent underline decoration-[6px] underline-offset-4">Permit Checker</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Find official state or provincial DOT portals, police escort contacts, and regional curfew rules to process your oversize permits.
            </p>
          </div>

          <PermitCheckerClient 
            countryCode={code} 
            countryName={countryName} 
            dictionary={dictionaryData} 
          />

          {/* Marketing/SEO Text Block */}
          <div className="mt-16 bg-white/[0.02] border border-white/5 rounded-2xl p-8 lg:p-12">
            <h2 className="text-2xl font-bold text-white mb-4">Official Permit Auth Portals for {countryName}</h2>
            <div className="text-sm text-gray-400 leading-relaxed max-w-4xl mx-auto">
              <p>
                Navigating jurisdiction-specific portals can be the hardest part of heavy haul logistics. Use the <strong>Permit Checker</strong> to instantly locate the official government or state-level DOT applications, saving you hours of searching. We continually update the URLs, authorities, and metropolitan curfews to ensure your oversize processing remains compliant.
              </p>
              <p className="mt-4">
                Before applying for your permit, run your final dimensions through our <Link href={`/tools/escort-rules/${code}`} className="text-accent hover:underline">Escort Rule Finder</Link> to accurately determine exactly how many pilot cars are required to legally move your load through {countryName}.
              </p>
            </div>
          </div>
          
        </div>
      </main>
    </>
  );
}
