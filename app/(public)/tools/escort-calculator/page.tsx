'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AdGridClassifiedsFeed } from '@/components/ads/AdGridClassifiedsFeed';
import { AdGridSponsorSlot } from '@/app/_components/directory/AdGridSponsorSlot';
import SocialProofBanner from '@/components/social/SocialProofBanner';
import { StaticAnswerBlock } from '@/components/ai-search/AnswerBlock';
import RelatedLinks from '@/components/seo/RelatedLinks';
import '@/components/ai-search/answer-block.css';

type CountryCode = 'US' | 'CA' | 'AU' | 'GB' | 'NZ' | 'ZA' | 'DE' | 'NL' | 'AE' | 'BR' | 'IE' | 'SE' | 'NO' | 'FR' | 'SA' | 'IN' | 'MX';
type ServiceType = 'pevo' | 'heightPole' | 'bucket';

type CountryRate = {
  code: CountryCode;
  name: string;
  unit: 'mile' | 'km';
  currency: string;
  symbol: string;
  base: Record<ServiceType, { min: number; max: number; hrMin?: number; hrMax?: number }>;
};

const QUOTE_COUNTRIES: CountryRate[] = [
  { code: 'US', name: 'United States', unit: 'mile', currency: 'USD', symbol: '$', base: { pevo: { min: 1.65, max: 2.25 }, heightPole: { min: 1.90, max: 2.75 }, bucket: { min: 2.25, max: 3.50, hrMin: 150, hrMax: 275 } } },
  { code: 'CA', name: 'Canada', unit: 'km', currency: 'CAD', symbol: 'CA$', base: { pevo: { min: 1.35, max: 1.95 }, heightPole: { min: 1.65, max: 2.25 }, bucket: { min: 1.95, max: 3.10, hrMin: 175, hrMax: 285 } } },
  { code: 'AU', name: 'Australia', unit: 'km', currency: 'AUD', symbol: 'A$', base: { pevo: { min: 1.45, max: 2.15 }, heightPole: { min: 1.75, max: 2.55 }, bucket: { min: 2.10, max: 3.25, hrMin: 190, hrMax: 310 } } },
  { code: 'GB', name: 'United Kingdom', unit: 'mile', currency: 'GBP', symbol: '£', base: { pevo: { min: 1.45, max: 2.15 }, heightPole: { min: 1.75, max: 2.65 }, bucket: { min: 2.15, max: 3.45, hrMin: 125, hrMax: 225 } } },
  { code: 'NZ', name: 'New Zealand', unit: 'km', currency: 'NZD', symbol: 'NZ$', base: { pevo: { min: 1.35, max: 1.95 }, heightPole: { min: 1.65, max: 2.35 }, bucket: { min: 1.95, max: 3.05, hrMin: 175, hrMax: 285 } } },
  { code: 'ZA', name: 'South Africa', unit: 'km', currency: 'ZAR', symbol: 'R', base: { pevo: { min: 16, max: 28 }, heightPole: { min: 22, max: 34 }, bucket: { min: 28, max: 44, hrMin: 650, hrMax: 1200 } } },
  { code: 'DE', name: 'Germany', unit: 'km', currency: 'EUR', symbol: '€', base: { pevo: { min: 1.55, max: 2.45 }, heightPole: { min: 1.95, max: 2.95 }, bucket: { min: 2.35, max: 3.75, hrMin: 150, hrMax: 260 } } },
  { code: 'NL', name: 'Netherlands', unit: 'km', currency: 'EUR', symbol: '€', base: { pevo: { min: 1.50, max: 2.35 }, heightPole: { min: 1.85, max: 2.85 }, bucket: { min: 2.25, max: 3.60, hrMin: 145, hrMax: 250 } } },
  { code: 'AE', name: 'United Arab Emirates', unit: 'km', currency: 'AED', symbol: 'AED ', base: { pevo: { min: 5.50, max: 8.50 }, heightPole: { min: 6.75, max: 10.50 }, bucket: { min: 8.00, max: 13.00, hrMin: 280, hrMax: 475 } } },
  { code: 'BR', name: 'Brazil', unit: 'km', currency: 'BRL', symbol: 'R$', base: { pevo: { min: 5.25, max: 8.25 }, heightPole: { min: 6.50, max: 10.50 }, bucket: { min: 8.00, max: 13.00, hrMin: 240, hrMax: 450 } } },
  { code: 'IE', name: 'Ireland', unit: 'km', currency: 'EUR', symbol: '€', base: { pevo: { min: 1.35, max: 2.05 }, heightPole: { min: 1.65, max: 2.45 }, bucket: { min: 2.00, max: 3.25, hrMin: 140, hrMax: 240 } } },
  { code: 'SE', name: 'Sweden', unit: 'km', currency: 'SEK', symbol: 'kr ', base: { pevo: { min: 15, max: 24 }, heightPole: { min: 19, max: 30 }, bucket: { min: 24, max: 38, hrMin: 1200, hrMax: 2100 } } },
  { code: 'NO', name: 'Norway', unit: 'km', currency: 'NOK', symbol: 'kr ', base: { pevo: { min: 17, max: 28 }, heightPole: { min: 22, max: 34 }, bucket: { min: 28, max: 45, hrMin: 1300, hrMax: 2300 } } },
  { code: 'FR', name: 'France', unit: 'km', currency: 'EUR', symbol: '€', base: { pevo: { min: 1.45, max: 2.25 }, heightPole: { min: 1.80, max: 2.75 }, bucket: { min: 2.20, max: 3.50, hrMin: 145, hrMax: 250 } } },
  { code: 'SA', name: 'Saudi Arabia', unit: 'km', currency: 'SAR', symbol: 'SAR ', base: { pevo: { min: 5.25, max: 8.25 }, heightPole: { min: 6.50, max: 10.25 }, bucket: { min: 8.00, max: 12.75, hrMin: 275, hrMax: 475 } } },
  { code: 'IN', name: 'India', unit: 'km', currency: 'INR', symbol: '₹', base: { pevo: { min: 90, max: 160 }, heightPole: { min: 125, max: 210 }, bucket: { min: 160, max: 275, hrMin: 4500, hrMax: 8500 } } },
  { code: 'MX', name: 'Mexico', unit: 'km', currency: 'MXN', symbol: 'MX$', base: { pevo: { min: 26, max: 42 }, heightPole: { min: 34, max: 55 }, bucket: { min: 42, max: 70, hrMin: 1000, hrMax: 1900 } } },
];

const REGIONS: Partial<Record<CountryCode, Array<{ key: string; label: string; multiplier?: number }>>> = {
  US: [
    { key: 'southeast', label: 'Southeast (FL, GA, AL, MS, SC, NC, TN)', multiplier: 0.98 },
    { key: 'southwest', label: 'Southwest (TX, NM, AZ, OK, AR, LA)', multiplier: 1.05 },
    { key: 'west_coast', label: 'West Coast (CA, OR, WA)', multiplier: 1.15 },
    { key: 'midwest', label: 'Midwest (OH, IL, IN, MI, WI, MN, IA, MO)', multiplier: 1.03 },
    { key: 'northeast', label: 'Northeast (NY, PA, NJ, CT, MA, VT, NH, ME)', multiplier: 1.08 },
    { key: 'mountain', label: 'Mountain West (CO, UT, NV, ID, MT, WY)', multiplier: 1.10 },
    { key: 'gulf', label: 'Gulf Coast (TX Coast, MS, AL Coast)', multiplier: 1.06 },
  ],
  AU: [
    { key: 'QLD', label: 'Queensland', multiplier: 1.03 },
    { key: 'NSW', label: 'New South Wales', multiplier: 1.08 },
    { key: 'VIC', label: 'Victoria', multiplier: 1.06 },
    { key: 'WA', label: 'Western Australia', multiplier: 1.12 },
    { key: 'SA', label: 'South Australia', multiplier: 1.02 },
    { key: 'NT', label: 'Northern Territory', multiplier: 1.18 },
    { key: 'TAS', label: 'Tasmania', multiplier: 1.08 },
    { key: 'ACT', label: 'ACT / Canberra', multiplier: 1.10 },
  ],
  CA: [
    { key: 'BC', label: 'British Columbia', multiplier: 1.10 },
    { key: 'AB', label: 'Alberta', multiplier: 1.06 },
    { key: 'ON', label: 'Ontario', multiplier: 1.04 },
    { key: 'QC', label: 'Quebec', multiplier: 1.03 },
    { key: 'MB', label: 'Manitoba', multiplier: 1.02 },
    { key: 'SK', label: 'Saskatchewan', multiplier: 1.04 },
    { key: 'NS', label: 'Nova Scotia', multiplier: 1.07 },
    { key: 'NB', label: 'New Brunswick', multiplier: 1.06 },
  ],
  GB: [
    { key: 'ENG', label: 'England', multiplier: 1.03 },
    { key: 'SCT', label: 'Scotland', multiplier: 1.10 },
    { key: 'WLS', label: 'Wales', multiplier: 1.05 },
    { key: 'NIR', label: 'Northern Ireland', multiplier: 1.08 },
  ],
};

function formatMoney(amount: number, country: CountryRate) {
  const rounded = Math.round(amount);
  return `${country.symbol}${rounded.toLocaleString()}`;
}

export default function EscortCalculator() {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('US');
  const [selectedRegion, setSelectedRegion] = useState<string>('southeast');
  const [distance, setDistance] = useState<number>(350);
  const [serviceType, setServiceType] = useState<ServiceType>('pevo');
  const [nightMove, setNightMove] = useState(false);
  const [waitHours, setWaitHours] = useState(0);

  const country = QUOTE_COUNTRIES.find(c => c.code === selectedCountry) || QUOTE_COUNTRIES[0];
  const countryRegions = REGIONS[selectedCountry] || [];
  const region = countryRegions.find(r => r.key === selectedRegion);
  const multiplier = region?.multiplier || 1;
  const baseRate = country.base[serviceType];

  const adjustedMin = baseRate.min * multiplier;
  const adjustedMax = baseRate.max * multiplier;

  let rateMin = adjustedMin * distance;
  let rateMax = adjustedMax * distance;

  const nightMin = country.unit === 'mile' ? 0.25 : 0.15;
  const nightMax = country.unit === 'mile' ? 0.50 : 0.35;
  if (nightMove) { rateMin += (nightMin * distance); rateMax += (nightMax * distance); }
  if (waitHours > 0) { rateMin += (waitHours * (baseRate.hrMin || 50)); rateMax += (waitHours * (baseRate.hrMax || 75)); }
  if (serviceType === 'pevo' && distance < 150) { rateMin = Math.max(rateMin, baseRate.min * 200); rateMax = Math.max(rateMax, baseRate.max * 225); }

  const regionLabel = countryRegions.length ? (region?.label || 'All regions') : country.name;
  const directoryHref = `/directory/${country.code.toLowerCase()}`;

  const answer = useMemo(() => {
    return `Pilot car and escort rates vary by country, region, service type, distance, timing, and wait time. For ${country.name}, this calculator estimates ${serviceType === 'heightPole' ? 'height pole' : serviceType === 'bucket' ? 'bucket truck / utility support' : 'lead/chase escort'} costs in ${country.currency} per ${country.unit}, with local region adjustments where available. Final pricing should be confirmed by a qualified local operator because permits, police escort rules, route complexity, and equipment requirements vary by jurisdiction.`;
  }, [country.name, country.currency, country.unit, serviceType]);

  return (
    <div className=" bg-[#07090f] text-white font-sans pt-8 pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Haul Command Escort Cost Calculator',
          description: 'Calculate heavy haul escort vehicle costs by country, region, service type, distance, and timing using Haul Command rate benchmarks.',
          url: 'https://haulcommand.com/tools/escort-calculator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: country.currency },
          creator: { '@type': 'Organization', name: 'Haul Command' },
        }) }}
      />
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-10 border-b border-white/10 pb-8">
          <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-500 text-xs font-bold tracking-widest uppercase rounded-full mb-4 border border-amber-500/20">
            Global Rate Benchmarks
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Live Quote <span className="text-amber-500">System</span>
          </h1>
          <p className="text-gray-400 max-w-2xl text-lg">
            Estimate oversize load support rates by country, region, service type, distance, timing, and wait time. Built for 120-country expansion instead of a U.S.-only quote flow.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-4 flex flex-col gap-6 bg-white/5 border border-white/10 p-6 rounded-2xl">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  const next = e.target.value as CountryCode;
                  setSelectedCountry(next);
                  setSelectedRegion(REGIONS[next]?.[0]?.key || '');
                }}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
              >
                {QUOTE_COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name} — {c.currency}</option>
                ))}
              </select>
            </div>

            {countryRegions.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {selectedCountry === 'CA' ? 'Province' : selectedCountry === 'AU' ? 'State / Territory' : selectedCountry === 'GB' ? 'Region' : 'Region'}
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
                >
                  {countryRegions.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Service Type</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="pevo">Base Escort (Lead/Chase)</option>
                <option value="heightPole">Height Pole & Specialized</option>
                <option value="bucket">Bucket Truck / Utility Support</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total {country.unit === 'mile' ? 'Miles' : 'Kilometers'}</label>
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
                min="0"
              />
              <p className="text-[10px] text-gray-500 mt-2 uppercase">Rate shown per {country.unit} in {country.currency}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Wait Time (Hours)</label>
              <input
                type="number"
                value={waitHours}
                onChange={(e) => setWaitHours(Number(e.target.value))}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
                min="0"
              />
            </div>

            <div className="flex items-center gap-3 bg-[#0a0a0a] p-3 rounded-lg border border-white/10 cursor-pointer" onClick={() => setNightMove(!nightMove)}>
              <input type="checkbox" checked={nightMove} readOnly className="w-4 h-4 accent-amber-500" />
              <div className="flex-1">
                <div className="text-sm font-bold text-white">Night Moves</div>
                <div className="text-[10px] text-gray-500 uppercase">+ {country.symbol}{nightMin.toFixed(2)} to {country.symbol}{nightMax.toFixed(2)}/{country.unit}</div>
              </div>
            </div>
          </div>

          <div className="md:col-span-8">
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/30 rounded-3xl p-8 lg:p-12 h-full flex flex-col justify-center">
              <div className="text-amber-500 font-bold tracking-widest uppercase text-sm mb-4 text-center">
                Estimated Project Rate · {country.currency}
              </div>
              <div className="text-center font-black text-5xl lg:text-7xl tabular-nums text-white drop-shadow-lg mb-6">
                {formatMoney(rateMin, country)} <span className="text-gray-500 font-normal text-3xl mx-2">-</span> {formatMoney(rateMax, country)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-amber-500/20 pt-8 mt-4">
                <div className="text-center">
                  <div className="text-xs text-gray-400 uppercase font-bold mb-1">Base Rate</div>
                  <div className="text-xl font-bold text-white">{country.symbol}{adjustedMin.toFixed(2)} - {country.symbol}{adjustedMax.toFixed(2)}<span className="text-sm text-gray-500">/{country.unit}</span></div>
                </div>
                <div className="text-center sm:border-l border-amber-500/20 sm:pl-6">
                  <div className="text-xs text-gray-400 uppercase font-bold mb-1">Night Premium</div>
                  <div className="text-xl font-bold text-white">{nightMove ? `+${country.symbol}${nightMin.toFixed(2)}/${country.unit}` : `${country.symbol}0`}</div>
                </div>
                <div className="text-center sm:border-l border-amber-500/20 sm:pl-6">
                  <div className="text-xs text-gray-400 uppercase font-bold mb-1">Wait Time Total</div>
                  <div className="text-xl font-bold text-white">{formatMoney(waitHours * (baseRate.hrMin || 50), country)} - {formatMoney(waitHours * (baseRate.hrMax || 75), country)}</div>
                </div>
              </div>

              <div className="mt-10 max-w-lg mx-auto text-center">
                <Link aria-label="Find providers" href={directoryHref} className="inline-block w-full text-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white py-4 rounded-xl font-black text-sm tracking-widest uppercase shadow-xl shadow-amber-500/20 transition-all">
                  Find {serviceType === 'bucket' ? 'Utility Support' : 'Pilot Cars'} in {country.name}
                </Link>
                <div className="text-[10px] text-gray-500 mt-4 leading-relaxed">
                  DISCLAIMER: Rates are planning estimates, not guaranteed quotes. Final pricing depends on route, permit rules, police escort rules, timing, load dimensions, local market supply, and operator confirmation.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <AdGridSponsorSlot regionName={regionLabel} type="pilot_car_broker_or_agency" countryCode={country.code} />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 text-white">Route Survey / Engineering Notes</h3>
            <div className="space-y-3 text-sm text-gray-400">
              <p>Route survey pricing depends heavily on country, region, urban density, bridges, clearance hazards, utility coordination, and whether the move crosses jurisdictions.</p>
              <p className="text-amber-500 font-bold">Selected market: {country.name} · {regionLabel}</p>
            </div>
            <p className="text-xs text-gray-500 mt-4">Use local authority sources and operator confirmation before relying on estimates for permits or dispatch.</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 text-white">Police Escorts & Premiums</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-gray-400">Official police / authority escort</span><span className="font-bold text-white text-right">Local authority rate</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-400">Urban coordination</span><span className="font-bold text-amber-500 text-right">Market dependent</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-400">Weekend / seasonal premium</span><span className="font-bold text-amber-500 text-right">Often applies</span></div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Equipment Marketplace</h2>
          <AdGridClassifiedsFeed
            items={[
              { id: 'cl-1', title: 'Pilot Car Setup — Full Kit', price: 42500, location: 'Houston, TX', images: [], seller_name: 'Verified Seller', seller_verified: true, posted_ago: 'recently', category: 'pilot_truck', condition: 'like_new', featured: true },
              { id: 'cl-2', title: 'Telescoping Height Pole — 18ft Max', price: 1200, location: 'Oklahoma City, OK', images: [], seller_name: 'Escort Supply Partner', seller_verified: true, posted_ago: 'recently', category: 'height_pole', condition: 'new', featured: false },
              { id: 'cl-3', title: 'LED Amber Beacon Kit — DOT Approved', price: 349, location: 'Jacksonville, FL', images: [], seller_name: 'Parts Supplier', seller_verified: true, posted_ago: 'recently', category: 'beacon', condition: 'new', featured: false },
              { id: 'cl-4', title: 'OVERSIZE LOAD Sign Kit + Flags', price: 189, location: 'Dallas, TX', images: [], seller_name: 'Pilot Gear Seller', seller_verified: false, posted_ago: 'recently', category: 'sign_kit', condition: 'good', featured: false },
            ]}
          />
        </div>

        <StaticAnswerBlock
          question="How much does a pilot car or escort vehicle cost?"
          answer={answer}
          confidence="verified_current"
          source="Haul Command global rate benchmark model"
          ctaLabel="Find Local Providers"
          ctaUrl={directoryHref}
        />

        <div className="mt-8">
          <SocialProofBanner />
        </div>

        <RelatedLinks
          pageType="tool"
          context={{ toolSlug: 'escort-calculator' }}
          heading="Related tools and resources"
          className="max-w-5xl"
        />
      </div>
    </div>
  );
}