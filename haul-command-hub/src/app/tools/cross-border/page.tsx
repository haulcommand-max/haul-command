'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import ToolDisclaimer from '@/components/hc/ToolDisclaimer';
import ToolResultCTA from '@/components/hc/ToolResultCTA';

export const runtime = 'edge';

const COUNTRIES_DATA = [
  {
    code: 'US',
    name: '🇺🇸 United States',
    system: 'State-by-state federal framework',
    maxWidthFt: '8.5 ft standard / 16+ with permit',
    maxWeightLbs: '80,000 lbs gross',
    permitAuthority: 'State DOT per state',
    permitUrl: 'https://ops.fhwa.dot.gov/freight/sw/index.htm',
    escortTrigger: "Width >8'6\" / varies by state",
    uniqueNote: 'Bridge Formula B applies federally',
  },
  {
    code: 'CA',
    name: '🇨🇦 Canada',
    system: 'Provincial — no national standard',
    maxWidthFt: '2.6m (8.5 ft) standard',
    maxWeightLbs: '63,500 kg gross (139,995 lbs)',
    permitAuthority: 'Provincial MTO/DOH',
    permitUrl: 'https://www.ontario.ca/page/oversize-and-over-weight-vehicles',
    escortTrigger: '3.5m width or 4.15m height',
    uniqueNote: 'Alberta/BC most complex',
  },
  {
    code: 'AU',
    name: '🇦🇺 Australia',
    system: 'State-based: VicRoads, QLD TMC, etc.',
    maxWidthFt: '2.5m (8.2 ft) standard',
    maxWeightLbs: '42,500 kg gross (93,695 lbs)',
    permitAuthority: 'State road authority',
    permitUrl: 'https://www.nhvr.gov.au/',
    escortTrigger: '3.5m width or 4.6m height',
    uniqueNote: 'NHVR portal for interstate moves',
  },
  {
    code: 'GB',
    name: '🇬🇧 United Kingdom',
    system: 'Abnormal Load — STGO Classes',
    maxWidthFt: '2.55m (8.4 ft) standard',
    maxWeightLbs: '44,000 kg (97,000 lbs)',
    permitAuthority: 'National Highways + Police',
    permitUrl: 'https://www.nationalhighways.co.uk/',
    escortTrigger: '2.9m+ width requires notification',
    uniqueNote: 'Road space reservation system for large loads',
  },
  {
    code: 'DE',
    name: '🇩🇪 Germany',
    system: 'VEMAGS federal permit system',
    maxWidthFt: '2.55m (8.4 ft) standard',
    maxWeightLbs: '40,000 kg (88,185 lbs)',
    permitAuthority: 'Bundesamt für Güterverkehr (BAG)',
    permitUrl: 'https://www.bag.bund.de/',
    escortTrigger: '3.0m+ width, 4.0m+ height',
    uniqueNote: 'VEMAGS route planning mandatory for all permits',
  },
  {
    code: 'FR',
    name: '🇫🇷 France',
    system: 'Transport Exceptionnel (TE) categories',
    maxWidthFt: '2.55m (8.4 ft) standard',
    maxWeightLbs: '40,000 kg (88,185 lbs)',
    permitAuthority: 'DREAL regional authorities',
    permitUrl: 'https://www.ecologie.gouv.fr/',
    escortTrigger: '3.0m+ width',
    uniqueNote: '4 TE categories based on dimensions/weight',
  },
  {
    code: 'NL',
    name: '🇳🇱 Netherlands',
    system: 'RDW — Exceptional Transport',
    maxWidthFt: '2.55m standard',
    maxWeightLbs: '50,000 kg gross',
    permitAuthority: 'RDW',
    permitUrl: 'https://www.rdw.nl/en',
    escortTrigger: '3.0m+ width, 4.0m+ height',
    uniqueNote: 'Port corridor (Rotterdam) has separate rules',
  },
  {
    code: 'NZ',
    name: '🇳🇿 New Zealand',
    system: 'NZTA Overweight/Oversize',
    maxWidthFt: '2.55m standard',
    maxWeightLbs: '44,000 kg',
    permitAuthority: 'NZTA Waka Kotahi',
    permitUrl: 'https://www.nzta.govt.nz/',
    escortTrigger: '3.0m+ width or 4.25m+ height',
    uniqueNote: 'Remote routes require extra lead time',
  },
];

export default function CrossBorderComparatorPage() {
  const [country1, setCountry1] = useState('US');
  const [country2, setCountry2] = useState('CA');
  const [widthFt, setWidthFt] = useState('14');
  const [weightLbs, setWeightLbs] = useState('120000');
  const [comparison, setComparison] = useState<typeof COUNTRIES_DATA | null>(null);

  function compare() {
    const c1 = COUNTRIES_DATA.find((c) => c.code === country1);
    const c2 = COUNTRIES_DATA.find((c) => c.code === country2);
    if (c1 && c2) setComparison([c1, c2]);
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/tools" className="hover:text-accent">Tools</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Cross-Border Comparator</span>
        </nav>

        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 mb-4">
            <span className="text-blue-400 text-xs font-bold">🌍 120 countries</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-3">
            Cross-Border <span className="text-accent">Comparator</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            Side-by-side comparison of oversize load regulations across countries.
            Australia and Germany are completely different regulatory universes.
          </p>
        </header>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-400 font-bold mb-2">Country 1</label>
              <select
                value={country1}
                onChange={(e) => setCountry1(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50"
              >
                {COUNTRIES_DATA.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-bold mb-2">Country 2</label>
              <select
                value={country2}
                onChange={(e) => setCountry2(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50"
              >
                {COUNTRIES_DATA.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={compare}
            className="w-full bg-accent text-black py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors"
          >
            Compare Regulations →
          </button>
        </div>

        {comparison && (
          <div className="space-y-4 mb-6">
            {/* Side by side comparison */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs text-gray-500 pb-3 font-bold uppercase tracking-wider">Regulation</th>
                    {comparison.map((c) => (
                      <th key={c.code} className="text-left text-xs text-accent pb-3 font-bold pl-4">{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {[
                    { label: 'Permit System', key: 'system' as const },
                    { label: 'Max Width', key: 'maxWidthFt' as const },
                    { label: 'Max Weight', key: 'maxWeightLbs' as const },
                    { label: 'Permit Authority', key: 'permitAuthority' as const },
                    { label: 'Escort Trigger', key: 'escortTrigger' as const },
                    { label: 'Key Note', key: 'uniqueNote' as const },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="py-3 text-gray-500 text-xs font-bold pr-4">{row.label}</td>
                      {comparison.map((c) => (
                        <td key={c.code} className="py-3 text-gray-200 text-xs pl-4">{c[row.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Authority Links */}
            <div className="grid grid-cols-2 gap-3">
              {comparison.map((c) => (
                <a
                  key={c.code}
                  href={c.permitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm hover:border-accent/30 transition-all"
                >
                  <span className="text-accent font-bold text-xs">{c.code}</span>
                  <span className="text-gray-400 text-xs">{c.permitAuthority} →</span>
                </a>
              ))}
            </div>

            <ToolResultCTA
              context="Now find escorts who operate across both jurisdictions."
              primary={{ label: 'Find International Escorts', href: '/directory', icon: '🌍' }}
              secondary={{ label: 'Browse All Countries', href: '/countries', icon: '🗺️' }}
            />
          </div>
        )}

        {/* All Countries Reference */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 mb-6">
          <h2 className="text-white font-bold text-sm mb-3">📊 Full Reference Table</h2>
          <div className="space-y-2">
            {COUNTRIES_DATA.map((c) => (
              <div key={c.code} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0 text-xs">
                <span className="text-white font-medium">{c.name}</span>
                <span className="text-gray-500">{c.escortTrigger}</span>
              </div>
            ))}
          </div>
        </div>

        <ToolDisclaimer
          dataSource="Country-specific road authority regulations"
          jurisdiction="International — regulations vary significantly by jurisdiction"
        />
      </main>
    </>
  );
}
